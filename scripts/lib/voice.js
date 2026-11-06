// The voiceover: what the tomatoes say, as speech (Kokoro, a small text-to-speech model that
// runs on this computer) or as babble (cartoon syllables made in code). Also the mouth
// movements that follow it, and a check that a line is written the way it should be spoken.
//
// Speech is cached in scripts/.cache/voice/, one file per line, voice and speed, so a render
// only runs the model for lines that changed. The model (about 330 MB) downloads from
// Hugging Face the first time and is kept in node_modules.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { rng, seedOf } = require('./pen.js');

const SR = 48000;
const TAU = Math.PI * 2;
const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const DTYPE = 'fp32';
const CACHE = path.join(__dirname, '..', '.cache', 'voice');

// Roma Tom's voice, and the pool every other tomato's name picks from (the same name always
// gets the same voice). American English voices only: the audience is American, so no British
// (bf_/bm_) voices. A few recurring characters are pinned so they keep a fitting voice.
const HOST = 'roma tom';
const HOST_VOICE = 'am_michael';
const GUEST_VOICES = ['af_heart', 'am_puck', 'af_bella', 'am_fenrir', 'af_kore', 'af_nicole', 'am_fenrir', 'af_sarah'];
const RECURRING = { dev: 'am_puck' };

const key = (name) => String(name).trim().toLowerCase();
const hash = (s) => parseInt(crypto.createHash('sha1').update(s).digest('hex').slice(0, 8), 16);

function voiceFor(name, cast = {}) {
  for (const [n, v] of Object.entries(cast)) if (key(n) === key(name)) return v;
  if (key(name) === HOST) return HOST_VOICE;
  if (RECURRING[key(name)]) return RECURRING[key(name)];
  return GUEST_VOICES[hash(key(name)) % GUEST_VOICES.length];
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
function model() {
  if (!ttsPromise) {
    ttsPromise = (async () => {
      const { KokoroTTS } = await import('kokoro-js');
      process.stdout.write('loading the voice model (the first time, this downloads it)…\n');
      return KokoroTTS.from_pretrained(MODEL, { dtype: DTYPE, device: 'cpu' });
    })();
  }
  return ttsPromise;
}

// Kokoro speaks at 24 kHz; double it to 48 kHz with a windowed-sinc half-band filter.
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

async function speak(text, voice, speed = 1) {
  const id = crypto.createHash('sha1').update([MODEL, DTYPE, voice, speed, text].join('|')).digest('hex');
  const file = path.join(CACHE, `${id}.f32`);
  if (fs.existsSync(file)) {
    const b = fs.readFileSync(file);
    return new Float32Array(b.buffer, b.byteOffset, b.length / 4).slice();
  }
  const tts = await model();
  const out = await tts.generate(text, { voice, speed });
  if (out.sampling_rate !== 24000) throw new Error(`unexpected sample rate ${out.sampling_rate}`);
  const samples = normalize(upsample2(trim(Float32Array.from(out.audio), 24000)));
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(file, Buffer.from(samples.buffer));
  return samples;
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

// Cartoon talk, kept warm and friendly: one soft, rounded, vowel-coloured hum per syllable of
// the line, with the pitch gliding smoothly from one syllable to the next (no jumps), gentle
// fade-ins and fade-outs, pauses at spaces and punctuation, and a lift at a question. Each
// name has its own pitch.
function babble(text, name) {
  const r = rng(seedOf('babble', key(name), text));
  const base = key(name) === HOST ? 145 : 135 + (hash(key(name)) % 110);
  const words = String(text).replace(/\[([^\]]*)\]\(\/[^)]*\/\)/g, '$1').match(/[A-Za-z']+[^A-Za-z']*/g) || [];
  const plan = [];
  words.forEach((w) => {
    const letters = w.match(/[A-Za-z']+/)[0].toLowerCase();
    const groups = letters.match(/[aeiouy]+/g) || ['a'];
    const n = Math.min(4, groups.length);
    for (let k = 0; k < n; k++) plan.push({ v: groups[k][0], gap: 0.018 });
    const p = w.slice(letters.length);
    plan[plan.length - 1].gap = /[.!?]/.test(p) ? 0.3 : /[,;:—–-]/.test(p) ? 0.17 : 0.055;
    plan[plan.length - 1].end = /\?/.test(p) ? 'up' : /[.!]/.test(p) ? 'down' : null;
  });
  const parts = [];
  let total = 0;
  plan.forEach((s, i) => {
    const dur = 0.11 + r() * 0.05;
    // A small, smooth wander around the speaker's pitch, easing down over the line.
    let f0 = base * Math.pow(2, (r() - 0.5) * 0.14) * (1 - 0.06 * (i / Math.max(1, plan.length - 1)));
    if (s.end === 'up') f0 *= 1.15;
    if (s.end === 'down') f0 *= 0.92;
    parts.push({ ...s, dur, f0 });
    total += dur + s.gap;
  });
  const out = new Float32Array(Math.ceil((total + 0.1) * SR));
  const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x)));
  let at = 0, ph = 0, last = parts.length ? parts[0].f0 : base, lp = 0;
  const cut = 1 - Math.exp((-TAU * 2800) / SR); // a gentle roll-off of the top end
  for (const s of parts) {
    const [f1, f2] = VOWELS[s.v] || VOWELS.a;
    const r1 = resonator(f1, 160), r2 = resonator(f2, 220);
    const n = Math.round(s.dur * SR), a = 0.025 * SR, d = 0.05 * SR;
    const from = last;
    for (let i = 0; i < n; i++) {
      const t = (at * SR + i) / SR;
      // Glide from the last syllable's pitch over the first part of this one, then the lift or fall.
      let f = from + (s.f0 - from) * ease(i / (0.4 * n));
      if (s.end === 'up') f *= 1 + 0.15 * ease(i / n);
      if (s.end === 'down') f *= 1 - 0.08 * ease(i / n);
      ph = (ph + (f * (1 + 0.007 * Math.sin(TAU * 5 * t))) / SR) % 1;
      // A soft, rounded tone: the fundamental with a few quiet harmonics, not a buzzy saw.
      const w = TAU * ph;
      const src = Math.sin(w) + 0.32 * Math.sin(2 * w) + 0.14 * Math.sin(3 * w) + 0.06 * Math.sin(4 * w) + 0.025 * Math.sin(5 * w);
      const env = ease(i / a) * ease((n - i) / d);
      lp += cut * ((r1(src) * 0.9 + r2(src) * 0.3 + src * 0.35) - lp);
      out[Math.round(at * SR) + i] += lp * env;
    }
    last = s.f0 * (s.end === 'up' ? 1.15 : s.end === 'down' ? 0.92 : 1);
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

module.exports = { SR, HOST_VOICE, GUEST_VOICES, voiceFor, checkLine, speak, babble, mouth };
