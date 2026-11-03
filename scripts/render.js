// Render a storyboard to a 1080×1920, 30 fps MP4.
//
//   node render.js ../videos/best-seller/storyboard.json   → video.mp4 and cover.jpg beside it
//   node render.js <storyboard> --frames 0,45,100   → PNGs of just those frames, for checking
//   node render.js <storyboard> --bg lime            → override the storyboard's background
//
// storyboard.json:
//   {
//     "background": "paper" | "lime",
//     "output": "video.mp4",              (next to the storyboard; optional)
//     "scenes": [{ "type": "hook", "duration": 3.5, "props": { ... }, "push": 0.03 }, ...]
//   }
//
// Each scene after the first is wiped in over the previous one with a growing, wobbly
// ink-edged blob, during its first WIPE seconds.
//
// Sound: each scene module may export draw.cues(props) → [{ t (0..1 in the scene), sfx, gain }].
// The renderer adds a whoosh on every wipe, mixes them over the pad into sound.wav, saves each
// effect used to sfx/<name>.wav for your own edits, and muxes the mix into the MP4.
// The mix is normalised to -14 LUFS, the level Reels, TikTok and Shorts play at.
// "sound": false in the storyboard (or --silent) leaves the audio out.

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const { W, H, FPS, THEMES, frame, drawScene, pen, motion } = require('./lib/kit.js');
const sound = require('./lib/sound.js');
const { writeCover } = require('./cover.js');

const WIPE = 0.5; // seconds
const BOIL = 4; // frames per boil step

const args = process.argv.slice(2);
const file = path.resolve(args[0] || '');
if (!args[0] || !fs.existsSync(file)) {
  console.error('usage: node render.js <storyboard.json> [--frames 0,30,60]');
  process.exit(1);
}
const framesArg = args.includes('--frames') ? args[args.indexOf('--frames') + 1].split(',').map(Number) : null;

const board = JSON.parse(fs.readFileSync(file, 'utf8'));
if (args.includes('--bg')) board.background = args[args.indexOf('--bg') + 1];
const baseTheme = THEMES[board.background || 'paper'];

// Lay the scenes out on a timeline (in frames).
let cursor = 0;
const scenes = board.scenes.map((s) => {
  const frames = Math.round(s.duration * FPS);
  const scene = {
    ...s,
    draw: require(`./scenes/${s.type}.js`),
    theme: s.type === 'endcard' ? THEMES.lime : THEMES[s.background || ''] || baseTheme,
    start: cursor,
    frames,
  };
  cursor += frames;
  return scene;
});
const total = cursor;

// Two scratch canvases: the scene coming in, and the one it covers during a wipe.
const cur = frame(), prev = frame(), out = frame();

function paintScene(target, scene, f) {
  const local = Math.min(f - scene.start, scene.frames - 1);
  const t = scene.frames > 1 ? local / (scene.frames - 1) : 1;
  drawScene(target.ctx, scene, scene.theme, t, { sec: local / FPS, dur: scene.frames / FPS });
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

const dir = path.dirname(file);

if (framesArg) {
  for (const f of framesArg) {
    const png = path.join(dir, `frame-${String(f).padStart(4, '0')}.png`);
    fs.writeFileSync(png, renderFrame(Math.min(f, total - 1)).toBuffer('image/png'));
    console.log(png);
  }
  process.exit(0);
}

// Collect every scene's cues on the video's timeline and mix the soundtrack.
function soundtrack() {
  const cues = [];
  scenes.forEach((sc, i) => {
    const dur = (sc.frames - 1) / FPS, start = sc.start / FPS;
    if (i > 0) cues.push({ at: start, sfx: 'whoosh', gain: 0.5 });
    for (const c of sc.draw.cues?.(sc.props || {}) || []) cues.push({ ...c, at: start + c.t * dur });
  });
  const wavFile = path.join(dir, 'sound.wav');
  fs.writeFileSync(wavFile, sound.wav(sound.mix(total / FPS, cues, board.mix || {})));
  const sfxDir = path.join(dir, 'sfx');
  fs.mkdirSync(sfxDir, { recursive: true });
  for (const name of new Set(cues.map((c) => c.sfx))) fs.writeFileSync(path.join(sfxDir, `${name}.wav`), sound.wav(sound.SFX[name]()));
  return wavFile;
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

(async () => {
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
})();
