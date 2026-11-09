// The voiceover: what the tomatoes say, as speech or as babble (cartoon syllables made in
// code). Also the mouth movements that follow it, and a check that a line is written the way
// it should be spoken.
//
// Speech comes from ElevenLabs (eleven_v4, over the network, using ELEVENLABS_API_KEY from
// .env.local at the top of the repo). If there's no key or ElevenLabs fails, every line of the
// video falls back to Kokoro, a small text-to-speech model that runs on this computer (about
// 330 MB, downloaded from Hugging Face the first time and kept in node_modules), so one video
// never mixes the two.
//
// Speech is cached in scripts/.cache/voice/, one file per line, engine, voice and speed, so a
// render only asks for lines that changed.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { rng, seedOf } = require('./pen.js');

const SR = 48000;
const TAU = Math.PI * 2;
const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const DTYPE = 'fp32';
const EL_MODEL = 'eleven_v4';
const CACHE = path.join(__dirname, '..', '.cache', 'voice');

// The ElevenLabs key lives in .env.local at the top of the repo; load it unless it's already set.
const ENV_FILE = path.join(__dirname, '..', '..', '.env.local');
if (!process.env.ELEVENLABS_API_KEY && fs.existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

// Roma Tom's voice, and the pool every other tomato's name picks from (the same name always
// gets the same voice). American English voices only: the audience is American. A few
// recurring characters are pinned so they keep a fitting voice. Each engine has its own
// list, in the same order, so a tomato sounds alike in both.
const HOST = 'roma tom';
const VOICES = {
  elevenlabs: {
    host: 'bTw8AqIDQenIK3kFqvhT', // Chris - Soothing (from the voice library; add it to My Voices)
    guests: [
      'cgSgspJ2msm6clMCkdW9', // Jessica: playful, bright, warm
      'N2lVS1w4EtoT3dr4eOWO', // Callum: husky trickster
      'hpp4J3VqNfWAUOO0d1Us', // Bella: professional, bright, warm
      'bIHbv24MWmeRgasZH58o', // Will: relaxed optimist
      'FGY2WhTYpPnrIDTdsKH5', // Laura: enthusiast, quirky
      'XrExE9yKIg1WjnnlVkGX', // Matilda: knowledgeable, upbeat
      'cjVigY5qzO86Huf0OWal', // Eric: smooth, trustworthy
      'EXAVITQu4vr4xnSDxMaL', // Sarah: mature, reassuring
    ],
    recurring: { dev: 'TX3LPaxmHKxFdv7VOQHJ' }, // Liam: energetic, young
  },
  kokoro: {
    host: 'am_michael',
    guests: ['af_heart', 'am_puck', 'af_bella', 'am_fenrir', 'af_kore', 'af_nicole', 'am_fenrir', 'af_sarah'],
    recurring: { dev: 'am_puck' },
  },
};
const ENGINES = Object.keys(VOICES);

const key = (name) => String(name).trim().toLowerCase();
const hash = (s) => parseInt(crypto.createHash('sha1').update(s).digest('hex').slice(0, 8), 16);

// A cast entry is { "elevenlabs": "<voice id>", "kokoro": "am_puck" } (either or both), or a
// single voice: a Kokoro name like "am_puck" or an ElevenLabs voice id. A name with no voice
// for this engine falls back to the pool.
const isKokoroName = (v) => /^[a-z]{2}_[a-z]+$/.test(v);
function voiceFor(name, cast = {}, engine = 'elevenlabs') {
  for (const [n, v] of Object.entries(cast)) {
    if (key(n) !== key(name)) continue;
    if (typeof v === 'object' && v[engine]) return v[engine];
    if (typeof v === 'string' && isKokoroName(v) === (engine === 'kokoro')) return v;
  }
  const { host, guests, recurring } = VOICES[engine];
  if (key(name) === HOST) return host;
  if (recurring[key(name)]) return recurring[key(name)];
  return guests[hash(key(name)) % guests.length];
}

// ---------------------------------------------------------------- checking a line

// Things the model reads badly or not at all. Lines should spell these out as spoken words.
const PROBLEMS = [
  [/\d/, 'digits (write the number as words: "sixteen dollars", "thirty-eight percent")'],
  [/[$€£¥%&@#+=×÷/\\]/, 'symbols (say them: "dollars", "percent", "and", "times", "per")'],
  [/\*/, 'marker swash asterisks (those are for on-screen text only)'],
  [/\b(vs|etc|e\.g|i\.e|approx|min|hr|hrs|wk|yr|avg|qty|w\/)\b\.?/i, 'abbreviations (write the full words)'],
  [/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, 'emoji'],
];

function checkLine(text) {
  // Spelled-out pronunciations, [word](/fəˈnɛtɪks/), are allowed: check only what's outside them.
  const plain = String(text).replace(/\[[^\]]*\]\(\/[^)]*\/\)/g, '');
  return PROBLEMS.filter(([re]) => re.test(plain)).map(([, why]) => why);
}

// ---------------------------------------------------------------- speech

let ttsPromise = null;
function kokoro() {
  if (!ttsPromise) {
    ttsPromise = (async () => {
      const { KokoroTTS } = await import('kokoro-js');
      process.stdout.write('loading the voice model (the first time, this downloads it)…\n');
      return KokoroTTS.from_pretrained(MODEL, { dtype: DTYPE, device: 'cpu' });
    })();
  }
  return ttsPromise;
}

let clientPromise = null;
function elevenlabs() {
  if (!clientPromise) {
    clientPromise = import('@elevenlabs/elevenlabs-js').then(({ ElevenLabsClient }) => new ElevenLabsClient());
  }
  return clientPromise;
}

// Both engines give 24 kHz here; double it to 48 kHz with a windowed-sinc half-band filter.
function upsample2(x) {
  const TAPS = 32, out = new Float32Array(x.length * 2);
  const h = [];
  for (let k = -TAPS; k < TAPS; k++) {
    const t = k + 0.5, w = 0.5 + 0.5 * Math.cos((Math.PI * t) / TAPS);
    h.push((Math.sin(Math.PI * t) / (Math.PI * t)) * w);
  }
  for (let i = 0; i < x.length; i++) {
    out[2 * i] = x[i];
    let s = 0;
    for (let k = -TAPS; k < TAPS; k++) {
      const j = i + k + 1;
      if (j >= 0 && j < x.length) s += x[j] * h[k + TAPS];
    }
    out[2 * i + 1] = s;
  }
  return out;
}

// Cut leading and trailing silence, keeping a few milliseconds so words don't clip.
function trim(x, sr) {
  const thr = 0.01, keep = Math.round(0.03 * sr);
  let a = 0, b = x.length - 1;
  while (a < x.length && Math.abs(x[a]) < thr) a++;
  while (b > a && Math.abs(x[b]) < thr) b--;
  return x.slice(Math.max(0, a - keep), Math.min(x.length, b + keep));
}

function normalize(x, peak = 0.6) {
  let m = 0;
  for (const v of x) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < x.length; i++) x[i] *= peak / m;
  return x;
}

// One line as 24 kHz samples, from an engine.
async function generate(engine, text, voice, speed) {
  if (engine === 'kokoro') {
    const out = await (await kokoro()).generate(text, { voice, speed });
    if (out.sampling_rate !== 24000) throw new Error(`unexpected sample rate ${out.sampling_rate}`);
    return Float32Array.from(out.audio);
  }
  // ElevenLabs reads words, not Kokoro's phonemes: [gyro](/ˈjiɹO/) is sent as "gyro". Eleven v4
  // has no speed setting, so speed only applies to Kokoro.
  const words = String(text).replace(/\[([^\]]*)\]\(\/[^)]*\/\)/g, '$1');
  const stream = await (await elevenlabs()).textToSpeech.convert(voice, {
    text: words,
    modelId: EL_MODEL,
    outputFormat: 'pcm_24000', // raw 16-bit little-endian mono
    voiceSettings: { stability: 0.5, similarityBoost: 0.75 },
  });
  const b = Buffer.from(await new Response(stream).arrayBuffer());
  const out = new Float32Array(b.length >> 1);
  for (let i = 0; i < out.length; i++) out[i] = b.readInt16LE(i * 2) / 32768;
  return out;
}

async function speak(text, voice, speed = 1, engine = 'elevenlabs') {
  const parts = engine === 'kokoro' ? [MODEL, DTYPE, voice, speed, text] : ['elevenlabs', EL_MODEL, voice, text];
  const id = crypto.createHash('sha1').update(parts.join('|')).digest('hex');
  const file = path.join(CACHE, `${id}.f32`);
  if (fs.existsSync(file)) {
    const b = fs.readFileSync(file);
    return new Float32Array(b.buffer, b.byteOffset, b.length / 4).slice();
  }
  const samples = normalize(upsample2(trim(await generate(engine, text, voice, speed), 24000)));
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(file, Buffer.from(samples.buffer));
  return samples;
}

// Every line of a video, each { text, speaker }, from one engine: ElevenLabs unless asked
// for Kokoro. If ElevenLabs has no key or fails on any line, all of them are redone with
// Kokoro, so the voices stay consistent. Returns { engine, clips }.
async function speakAll(lines, { engine = 'elevenlabs', cast = {}, speed = 1 } = {}) {
  if (!ENGINES.includes(engine)) throw new Error(`unknown voice engine "${engine}" (use ${ENGINES.join(' or ')})`);
  const run = async (e) => {
    const clips = [];
    for (const l of lines) clips.push(await speak(l.text, voiceFor(l.speaker, cast, e), speed, e));
    return { engine: e, clips };
  };
  if (engine === 'elevenlabs') {
    if (!process.env.ELEVENLABS_API_KEY) {
      console.warn('warning: no ELEVENLABS_API_KEY (run `npx -y @elevenlabs/cli@latest onboard init` at the top of the repo), so the voice is Kokoro');
    } else {
      try {
        if (speed !== 1) console.warn(`warning: ElevenLabs (${EL_MODEL}) has no speed setting, so "speed": ${speed} is ignored`);
        return await run('elevenlabs');
      } catch (err) {
        const status = err && err.statusCode ? ` (${err.statusCode})` : '';
        console.warn(`warning: ElevenLabs failed${status}: ${err && err.message ? err.message.split('\n')[0] : err}\n  falling back to Kokoro for every line`);
      }
    }
  }
  return run('kokoro');
}

// ---------------------------------------------------------------- babble

// Two-pole resonator (a band of the voice, a formant), normalised to unit gain at its peak.
function resonator(f, bw) {
  const r = Math.exp((-Math.PI * bw) / SR), c = 2 * r * Math.cos((TAU * f) / SR), g = 1 - r;
  let y1 = 0, y2 = 0;
  return (x) => {
    const y = g * x + c * y1 - r * r * y2;
    y2 = y1;
    y1 = y;
    return y;
  };
}

// Mouth shapes for each vowel: first and second formant (Hz).
const VOWELS = { a: [800, 1250], e: [520, 1850], i: [330, 2250], o: [520, 900], u: [370, 800], y: [330, 2250] };

// Cartoon talk, kept bright and friendly: one soft "boop" per syllable of the line, sung in tune
// on a cheerful major pentatonic scale (so it sounds like a happy little tune, never off-key),
// each note scooping up into place. There is barely any vowel colour, so it reads as a cartoon
// voice rather than an almost-human one. Pauses at spaces and punctuation, a hop up at a
// question and a step down at the end of a sentence. Each name has its own key.
const SCALE = [0, 2, 4, 7, 9]; // major pentatonic, in semitones
function babble(text, name, max = Infinity) {
  const r = rng(seedOf('babble', key(name), text));
  // Roma Tom sits around B4; everyone else gets their own key between about A4 and E5.
  const base = key(name) === HOST ? 494 : 440 * Math.pow(2, (hash(key(name)) % 8) / 12);
  const note = (step) => {
    const o = Math.floor(step / SCALE.length), d = ((step % SCALE.length) + SCALE.length) % SCALE.length;
    return base * Math.pow(2, (12 * o + SCALE[d]) / 12);
  };
  const words = String(text).replace(/\[([^\]]*)\]\(\/[^)]*\/\)/g, '$1').match(/[A-Za-z']+[^A-Za-z']*/g) || [];
  const plan = [];
  words.forEach((w) => {
    const letters = w.match(/[A-Za-z']+/)[0].toLowerCase();
    const groups = letters.match(/[aeiouy]+/g) || ['a'];
    const n = Math.min(4, groups.length);
    for (let k = 0; k < n; k++) plan.push({ v: groups[k][0], gap: 0.02 });
    const p = w.slice(letters.length);
    plan[plan.length - 1].gap = /[.!?]/.test(p) ? 0.3 : /[,;:—–-]/.test(p) ? 0.17 : 0.06;
    plan[plan.length - 1].end = /\?/.test(p) ? 'up' : /[.!]/.test(p) ? 'down' : null;
  });
  // The tune: a gentle random walk on the scale, pulled back toward the home note.
  const parts = [];
  let total = 0, step = 0;
  // With a time budget (babble mode keeps each scene at its own duration), stop once the next
  // syllable would run over, and end the phrase the way the line ends.
  const question = /\?\s*$/.test(String(text));
  for (let i = 0, t = 0; i < plan.length; i++) {
    t += 0.1 + plan[i].gap;
    if (t > max && i > 0) {
      plan.length = i;
      plan[i - 1].end = question ? 'up' : 'down';
      break;
    }
  }
  plan.forEach((s) => {
    const move = r() < 0.35 ? 0 : r() < 0.5 ? 1 : -1;
    step = Math.max(-2, Math.min(3, step + move - (step > 1 ? 1 : 0) + (step < -1 ? 1 : 0)));
    let f0 = note(step);
    if (s.end === 'up') f0 = note(step + 2);
    if (s.end === 'down') f0 = note(Math.min(step, 0) - 1);
    if (s.end) step = 0;
    const dur = 0.085 + r() * 0.035;
    parts.push({ ...s, dur, f0 });
    total += dur + s.gap;
  });
  const out = new Float32Array(Math.ceil((total + 0.1) * SR));
  const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x)));
  const cut = 1 - Math.exp((-TAU * 4000) / SR);
  let at = 0, ph = 0, lp = 0;
  for (const s of parts) {
    const [f1] = VOWELS[s.v] || VOWELS.a;
    const r1 = resonator(Math.max(f1, s.f0 * 1.5), 400); // a faint, wide hint of the vowel
    const n = Math.round(s.dur * SR), a = 0.012 * SR, d = 0.04 * SR, scoop = 0.03 * SR;
    for (let i = 0; i < n; i++) {
      // Scoop up a semitone and a half into the note, like a cheerful "boop".
      let f = s.f0 * Math.pow(2, (-1.5 * (1 - ease(i / scoop))) / 12);
      if (s.end === 'up') f *= 1 + 0.12 * ease((i - 0.4 * n) / (0.6 * n));
      ph = (ph + f / SR) % 1;
      const w = TAU * ph;
      const src = Math.sin(w) + 0.25 * Math.sin(2 * w) + 0.08 * Math.sin(3 * w);
      // Quick soft start, a light fall through the syllable, soft end.
      const env = ease(i / a) * (1 - 0.35 * (i / n)) * ease((n - i) / d);
      lp += cut * ((src * 0.75 + r1(src) * 0.35) - lp);
      out[Math.round(at * SR) + i] += lp * env;
    }
    at += s.dur + s.gap;
  }
  return normalize(trim(out, SR));
}

// ---------------------------------------------------------------- the mouth

// How open the mouth is on each video frame of a clip (0 to 1), from the loudness of the
// sound. It changes every other frame, like hand-drawn animation on twos.
function mouth(x, fps) {
  const hop = SR / fps, frames = Math.ceil(x.length / hop);
  const rms = [];
  for (let f = 0; f < frames; f += 2) {
    const a = Math.round(f * hop), b = Math.min(x.length, Math.round((f + 2) * hop));
    let s = 0;
    for (let i = a; i < b; i++) s += x[i] * x[i];
    rms.push(Math.sqrt(s / Math.max(1, b - a)));
  }
  const loud = rms.filter((v) => v > 0.01).sort((p, q) => p - q);
  const ref = loud[Math.floor(loud.length * 0.9)] || 1;
  const out = new Float32Array(frames);
  for (let f = 0; f < frames; f++) out[f] = Math.max(0, Math.min(1, (rms[f >> 1] / ref - 0.15) / 0.75));
  return out;
}

module.exports = { SR, VOICES, ENGINES, voiceFor, checkLine, speak, speakAll, babble, mouth };
