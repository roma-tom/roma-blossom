// Render a storyboard to a 1080×1920, 30 fps MP4.
//
//   node render.js ../videos/best-seller/storyboard.json   → video.mp4 and cover.jpg beside it
//   node render.js <storyboard> --frames 0,45,100   → PNGs of just those frames, for checking
//   node render.js <storyboard> --bg lime            → override the storyboard's background
//   node render.js <storyboard> --babble             → the tomatoes babble instead of speaking
//   node render.js <storyboard> --no-voice           → no voiceover
//
// storyboard.json:
//   {
//     "background": "paper" (or lime, butter, blush, sky, mint), or a list to alternate by scene,
//     "output": "video.mp4",              (next to the storyboard; optional)
//     "voice": { "mode": "speech" | "babble" | "off", "narrator": "Roma Tom", "speed": 1, "cast": {} },
//     "scenes": [{ "type": "hook", "duration": 3.5, "say": "…", "speaker": "Maria", "props": { ... } }, ...]
//   }
//
// Each scene after the first is wiped in over the previous one with a growing, wobbly
// ink-edged blob, during its first WIPE seconds.
//
// Voice: on by default. A scene's `say` is spoken by its `speaker` (the narrator, Roma Tom,
// unless set), and the scene grows to fit the line: its duration is a minimum. Babble has no
// words to wait for, so it's trimmed to fit the scene's duration and the scenes move quicker. The speaker's
// mouth follows the voice wherever that tomato is drawn; if the scene doesn't draw them, they
// peek in at the lower left (`"peek": false` on the scene leaves them out). See lib/voice.js.
//
// Sound: each scene module may export draw.cues(props) → [{ t (0..1 in the scene) or sec (seconds in), sfx, gain }].
// The renderer adds a whoosh on every wipe (or mix.wipe), mixes them over the pad (mix.pad, see lib/sound.js) with the
// voice into sound.wav (and the voice alone into voice.wav), saves each effect used to
// sfx/<name>.wav for your own edits, and muxes the mix into the MP4.
// The mix is normalised to -14 LUFS, the level Reels, TikTok and Shorts play at.
// "sound": false in the storyboard (or --silent) leaves the audio out; the voice still sets
// the timing.

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const kit = require('./lib/kit.js');
const { W, H, FPS, THEMES, frame, drawScene, pen, motion } = kit;
const sound = require('./lib/sound.js');
const voice = require('./lib/voice.js');
const american = require('./lib/american.js');
const { writeCover } = require('./cover.js');
const { loadScene } = require('./lib/scenes.js');

const WIPE = 0.5; // seconds
const BOIL = 4; // frames per boil step
const LEAD = 0.45; // seconds into a scene before its line starts (the wipe is nearly done)
const LEAD_FIRST = 0.3;
const TAIL = 0.45; // seconds of quiet after a line before the next wipe
const TAIL_LAST = 0.9;

const args = process.argv.slice(2);
const file = path.resolve(args[0] || '');
if (!args[0] || !fs.existsSync(file)) {
  console.error('usage: node render.js <storyboard.json> [--frames 0,30,60] [--bg lime] [--babble | --no-voice] [--silent]');
  process.exit(1);
}
const framesArg = args.includes('--frames') ? args[args.indexOf('--frames') + 1].split(',').map(Number) : null;

const board = JSON.parse(fs.readFileSync(file, 'utf8'));
if (args.includes('--bg')) board.background = args[args.indexOf('--bg') + 1];
const backgrounds = [].concat(board.background || 'paper');
for (const b of backgrounds) if (!THEMES[b]) throw new Error(`unknown background "${b}" (try ${Object.keys(THEMES).join(', ')})`);
const dir = path.dirname(file);

// Each video's hook is its own: stop on an unfinished starter, or a copy of another video's hook.
for (const s of board.scenes || []) {
  if (!/^\.\.?\//.test(String(s.type))) continue;
  const src = fs.readFileSync(path.resolve(dir, s.type), 'utf8');
  if (src.includes('// STARTER:')) throw new Error(`${s.type} is still the starter: build this video's own hook (see style/HOOKS.md)`);
  const videos = path.join(__dirname, '..', 'videos');
  for (const other of fs.readdirSync(videos)) {
    const f = path.join(videos, other, path.basename(s.type));
    if (path.resolve(f) !== path.resolve(dir, s.type) && fs.existsSync(f) && fs.readFileSync(f, 'utf8') === src) {
      throw new Error(`${s.type} is the same as videos/${other}/${path.basename(s.type)}: each video needs its own hook`);
    }
  }
}

// American English only: stop on British words or spellings anywhere a viewer sees or hears them.
{
  const capFile = path.join(dir, 'caption.txt');
  const found = american.checkBoard(board, fs.existsSync(capFile) ? fs.readFileSync(capFile, 'utf8') : null);
  if (found.length) {
    console.error(`stopped: the audience is American, so fix these British words or spellings first:\n  ${found.join('\n  ')}`);
    process.exit(1);
  }
}

// "voice": absent → speech; false → off; "babble" → babble; or an object.
function voiceConfig() {
  let v = board.voice;
  if (v === undefined || v === true) v = {};
  else if (v === false) v = { mode: 'off' };
  else if (typeof v === 'string') v = { mode: v };
  v = { mode: 'speech', narrator: 'Roma Tom', speed: 1, cast: {}, ...v };
  if (args.includes('--babble')) v.mode = 'babble';
  if (args.includes('--no-voice')) v.mode = 'off';
  if (!['speech', 'babble', 'off'].includes(v.mode)) throw new Error(`unknown voice mode "${v.mode}"`);
  return v;
}

// Make every scene's line, then lay the scenes out on a timeline (in frames).
async function layout(vc) {
  const lines = [];
  if (vc.mode !== 'off') {
    for (const [i, s] of board.scenes.entries()) {
      if (!s.say) {
        if (s.type !== 'endcard') console.warn(`warning: scene ${i + 1} (${s.type}) has no "say", so it's silent`);
        lines.push(null);
        continue;
      }
      const problems = voice.checkLine(s.say);
      if (problems.length) console.warn(`warning: scene ${i + 1} "say" has ${problems.join('; ')}:\n  ${s.say}`);
      const speaker = s.speaker || vc.narrator;
      // Speech: the scene grows to fit the line. Babble carries no words, so it fits inside the
      // scene's own duration instead, and the scenes keep their quicker pace.
      const lead = i === 0 ? LEAD_FIRST : LEAD, tail = i === board.scenes.length - 1 ? TAIL_LAST : TAIL;
      const clip = vc.mode === 'speech'
        ? await voice.speak(s.say, voice.voiceFor(speaker, vc.cast), vc.speed)
        : voice.babble(s.say, speaker, Math.max(0.6, (s.duration || 0) - lead - tail));
      lines.push({ speaker, clip, mouth: voice.mouth(clip, FPS) });
    }
  }

  let cursor = 0;
  return board.scenes.map((s, i) => {
    const line = lines[i] || null;
    const lead = i === 0 ? LEAD_FIRST : LEAD;
    const tail = i === board.scenes.length - 1 ? TAIL_LAST : TAIL;
    const need = line ? lead + line.clip.length / sound.SR + tail : 0;
    const frames = Math.round(Math.max(s.duration || 0, need) * FPS);
    const scene = {
      ...s,
      draw: loadScene(s.type, dir),
      theme: s.type === 'endcard' ? THEMES.lime : THEMES[s.background || ''] || THEMES[backgrounds[i % backgrounds.length]],
      start: cursor,
      frames,
      line,
      lineStart: cursor + Math.round(lead * FPS),
    };
    cursor += frames;
    return scene;
  });
}

let scenes, total;

// Two scratch canvases: the scene coming in, and the one it covers during a wipe.
const cur = frame(), prev = frame(), out = frame();

function paintScene(target, scene, f) {
  const local = Math.min(f - scene.start, scene.frames - 1);
  const t = scene.frames > 1 ? local / (scene.frames - 1) : 1;
  const line = scene.line;
  const talk = new Map();
  if (line) {
    const k = f - scene.lineStart;
    talk.set(line.speaker.trim().toLowerCase(), k >= 0 && k < line.mouth.length ? line.mouth[k] : 0);
  }
  kit.setTalking(talk);
  drawScene(target.ctx, scene, scene.theme, t, { sec: local / FPS, dur: scene.frames / FPS });
  if (line && scene.peek !== false && !kit.wasDrawn(line.speaker)) peek(target.ctx, scene, line, f);
  kit.setTalking(null);
}

// The speaker, when the scene doesn't show them: they pop up at the lower left as their line
// starts and stay, leaning in towards the scene.
function peek(ctx, scene, line, f) {
  const sec = (f - scene.lineStart) / FPS;
  if (sec < -0.25) return;
  const k = motion.spring((sec + 0.25) / 0.6);
  const breathe = 1 + 0.02 * Math.sin(f / FPS * 2.6);
  kit.tomato(ctx, line.speaker, 150, 1440 + (1 - k) * 360, 310, { angle: 0.14, squash: breathe });
}

// A wobbly circle from the bottom center, grown to cover the frame.
function blob(p, seed) {
  const r = motion.easeInOut(p) * Math.hypot(W / 2, H) * 1.08;
  return pen.wobble(pen.ellipse(W / 2, H + 40, r, r, 96), Math.max(4, r * 0.03), seed, true);
}

function renderFrame(f) {
  pen.setBoil(Math.floor(f / BOIL) + 1);
  const i = scenes.findIndex((s) => f >= s.start && f < s.start + s.frames);
  const scene = scenes[i];
  const wipeFrames = Math.round(WIPE * FPS);
  const intoScene = f - scene.start;

  if (i === 0 || intoScene >= wipeFrames) {
    paintScene(out, scene, f);
    return out.canvas;
  }

  // Wipe: the previous scene holds its last frame; the new one shows through the blob.
  paintScene(prev, scenes[i - 1], f);
  paintScene(cur, scene, f);
  const pts = blob(intoScene / wipeFrames, 77 + i);
  const ctx = out.ctx;
  ctx.drawImage(prev.canvas, 0, 0);
  ctx.save();
  pen.trace(ctx, pts, true);
  ctx.clip();
  ctx.drawImage(cur.canvas, 0, 0);
  ctx.restore();
  pen.line(ctx, pts, { width: 9, amp: 0, closed: true });
  return out.canvas;
}

// The voice on the video's timeline.
function voiceTrack() {
  const track = new Float32Array(Math.ceil((total / FPS) * sound.SR));
  let any = false;
  for (const sc of scenes) {
    if (!sc.line) continue;
    any = true;
    const at = Math.round((sc.lineStart / FPS) * sound.SR);
    for (let i = 0; i < sc.line.clip.length && at + i < track.length; i++) track[at + i] += sc.line.clip[i];
  }
  return any ? track : null;
}

// Collect every scene's cues on the video's timeline and mix the soundtrack.
function soundtrack() {
  const cues = [];
  const o = board.mix || {};
  const wipe = o.wipe || 'whoosh';
  scenes.forEach((sc, i) => {
    const dur = (sc.frames - 1) / FPS, start = sc.start / FPS;
    if (i > 0) cues.push({ at: start, sfx: wipe, gain: 0.5 });
    for (const c of sc.draw.cues?.(sc.props || {}) || []) cues.push({ ...c, at: start + (c.sec != null ? Math.min(c.sec, dur) : c.t * dur) });
  });
  const vt = voiceTrack();
  if (vt) fs.writeFileSync(path.join(dir, 'voice.wav'), sound.wav(vt));
  const wavFile = path.join(dir, 'sound.wav');
  const track = sound.mix(total / FPS, cues, o, vt);
  fs.writeFileSync(wavFile, sound.wav(track));
  const sfxDir = path.join(dir, 'sfx');
  fs.mkdirSync(sfxDir, { recursive: true });
  for (const name of track.used) fs.writeFileSync(path.join(sfxDir, `${name}.wav`), sound.wav(sound.SFX[name]()));
  return wavFile;
}

(async () => {
  const vc = voiceConfig();
  scenes = await layout(vc);
  total = scenes.reduce((n, s) => n + s.frames, 0);
  if (vc.mode !== 'off') {
    console.log(`voice: ${vc.mode}, ${(total / FPS).toFixed(1)} s`);
    for (const [i, s] of scenes.entries()) console.log(`  ${i + 1} ${s.type.padEnd(10)} ${(s.frames / FPS).toFixed(1).padStart(5)} s  starts at frame ${s.start}`);
  }

  if (framesArg) {
    for (const f of framesArg) {
      const png = path.join(dir, `frame-${String(f).padStart(4, '0')}.png`);
      fs.writeFileSync(png, renderFrame(Math.min(f, total - 1)).toBuffer('image/png'));
      console.log(png);
    }
    return;
  }

  const silent = board.sound === false || args.includes('--silent');
  const audio = silent ? null : soundtrack();
  const mp4 = path.join(dir, board.output || 'video.mp4');
  const enc = spawn(ffmpeg, [
    '-y', '-loglevel', 'error',
    '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    ...(audio ? ['-i', audio, '-map', '0:v', '-map', '1:a', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', mp4,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    const c = renderFrame(f);
    const px = Buffer.from(c.getContext('2d').getImageData(0, 0, W, H).data.buffer);
    if (!enc.stdin.write(px)) await new Promise((r) => enc.stdin.once('drain', r));
    if (f % FPS === 0) process.stdout.write(`\r${f}/${total} frames`);
  }
  enc.stdin.end();
  enc.on('close', (code) => {
    process.stdout.write(`\r${total}/${total} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s\n`);
    if (code) process.exit(code);
    console.log(mp4);
    console.log(writeCover(file)[0]);
  });
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
