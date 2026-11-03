// The music bed, made in code: a few moods, each a chord progression played by a small band of
// synthesized instruments at a tempo, in any key. Everything is seeded, so a storyboard always
// sounds the same.
//
//   bed(sec, { mood: 'lofi', key: 'D', bpm: 82, seed })  → Float32Array at SR
//
// Moods:
//   warm    the original soft pad, one chord swelling (no beat)
//   bright  strummed plucks, shaker and a light kick: sunny, upbeat
//   lofi    electric piano sevenths, lazy swung hats, vinyl crackle: chill, late night
//   bounce  pizzicato bass, marimba on the offbeats, claps: playful, quick
//   dreamy  music box arpeggios over a slow pad (no drums): gentle, reflective
//   jazzy   walking bass, brushed snare, piano comping: cafe, warm and busy

const { rng } = require('./pen.js');

const SR = 48000;
const TAU = Math.PI * 2;
const RMS = 0.17; // the loudness of the original pad

const KEYS = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// Chord shapes, as semitones above the chord root.
const SHAPES = {
  maj: [0, 4, 7], min: [0, 3, 7], add9: [0, 4, 7, 14], madd9: [0, 3, 7, 14],
  maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], dom7: [0, 4, 7, 10], m9: [0, 3, 7, 10, 14], maj9: [0, 4, 7, 11, 14], sus2: [0, 2, 7],
};

// A progression is a list of [semitones above the key root, shape], one per bar.
const MOODS = {
  warm: { bpm: 70, key: 'F', prog: [[0, 'maj9']], wipe: 'whoosh' },
  bright: { bpm: 112, key: 'G', prog: [[0, 'add9'], [7, 'maj'], [9, 'min'], [5, 'add9']], wipe: 'swish' },
  lofi: { bpm: 80, key: 'D', prog: [[2, 'm9'], [7, 'dom7'], [0, 'maj9'], [9, 'm7']], wipe: 'rustle', swap: { pop: 'blip' } },
  bounce: { bpm: 120, key: 'C', prog: [[0, 'maj'], [9, 'min'], [5, 'maj'], [7, 'maj']], wipe: 'swish', swap: { squish: 'boing' } },
  dreamy: { bpm: 88, key: 'E', prog: [[0, 'maj7'], [5, 'maj7'], [9, 'm7'], [5, 'maj9']], wipe: 'swish', swap: { ding: 'chime' } },
  jazzy: { bpm: 104, key: 'Bb', prog: [[0, 'maj7'], [9, 'm7'], [2, 'm7'], [7, 'dom7']], wipe: 'rustle' },
};

// ---- small DSP helpers ----

function lowpass(x, fc) {
  const a = 1 - Math.exp((-TAU * fc) / SR);
  let y = 0;
  for (let i = 0; i < x.length; i++) x[i] = y += a * (x[i] - y);
  return x;
}
function highpass(x, fc) {
  const a = 1 - Math.exp((-TAU * fc) / SR);
  let y = 0;
  for (let i = 0; i < x.length; i++) {
    y += a * (x[i] - y);
    x[i] -= y;
  }
  return x;
}
function addAt(out, src, t0, gain) {
  const at = Math.round(t0 * SR);
  for (let i = 0; i < src.length && at + i < out.length; i++) if (at + i >= 0) out[at + i] += src[i] * gain;
}

// ---- instruments: each returns a short buffer for one note ----

// A plucked string (Karplus-Strong): guitar or ukulele, or a pizzicato bass when dark.
function pluck(f, dur, seed, bright = 0.5) {
  const n = Math.ceil((dur + 0.4) * SR), out = new Float32Array(n);
  const p = Math.max(2, Math.round(SR / f)), line = new Float32Array(p), r = rng(seed);
  for (let i = 0; i < p; i++) line[i] = r() * 2 - 1;
  lowpass(line, 1500 + bright * 6000);
  const damp = 0.996 - (1 - bright) * 0.006;
  let k = 0;
  for (let i = 0; i < n; i++) {
    const nx = (k + 1) % p, v = line[k];
    line[k] = damp * 0.5 * (v + line[nx]);
    k = nx;
    const rel = i / SR > dur ? Math.exp(-(i / SR - dur) * 18) : 1;
    out[i] = v * rel;
  }
  return out;
}

// An electric piano: two-operator FM with a bell-ish attack that mellows, and a slow tremolo.
function keys(f, dur) {
  const n = Math.ceil((dur + 0.6) * SR), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR, idx = 1.6 * Math.exp(-t * 5) + 0.25;
    const env = Math.min(1, t / 0.004) * Math.exp(-t * 1.4) * (t > dur ? Math.exp(-(t - dur) * 8) : 1);
    const trem = 1 + 0.12 * Math.sin(TAU * 4.5 * t);
    out[i] = Math.sin(TAU * f * t + idx * Math.sin(TAU * f * t)) * env * trem;
  }
  return out;
}

// A marimba or kalimba bar: a strong fundamental and quick inharmonic overtones.
function mallet(f, ratio = 3.93) {
  const n = Math.ceil(0.9 * SR), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR, a = Math.min(1, t / 0.0015);
    out[i] = a * (Math.sin(TAU * f * t) * Math.exp(-t * 6) + 0.35 * Math.sin(TAU * f * ratio * t) * Math.exp(-t * 28));
  }
  return out;
}

// A music box tine: high, pure, long ring.
function tine(f) {
  const n = Math.ceil(1.8 * SR), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR, a = Math.min(1, t / 0.001);
    out[i] = a * (Math.sin(TAU * f * t) * Math.exp(-t * 2.2) + 0.25 * Math.sin(TAU * f * 2.01 * t) * Math.exp(-t * 5) + 0.1 * Math.sin(TAU * f * 5.4 * t) * Math.exp(-t * 14));
  }
  return out;
}

// A round sine bass with a soft attack.
function sub(f, dur) {
  const n = Math.ceil((dur + 0.1) * SR), out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (TAU * f) / SR;
    const env = Math.min(1, t / 0.01) * Math.exp(-t * 2.5) * (t > dur ? Math.exp(-(t - dur) * 30) : 1);
    out[i] = (Math.sin(ph) + 0.25 * Math.sin(2 * ph)) * env;
  }
  return out;
}

// A soft chord pad: detuned sines with a slow swell.
function padNote(f, dur) {
  const n = Math.ceil((dur + 0.8) * SR), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.min(1, t / 0.5) * (t > dur ? Math.exp(-(t - dur) * 4) : 1);
    let s = 0;
    for (const d of [-0.2, 0.2]) {
      const ph = TAU * (f + d) * t;
      s += Math.sin(ph) + 0.3 * Math.sin(2 * ph) + 0.08 * Math.sin(3 * ph);
    }
    out[i] = s * 0.5 * env;
  }
  return out;
}

// Drums, made from noise and sines.
function noiseBuf(sec, seed) {
  const r = rng(seed), out = new Float32Array(Math.ceil(sec * SR));
  for (let i = 0; i < out.length; i++) out[i] = r() * 2 - 1;
  return out;
}
const DRUMS = {
  kick() {
    const n = Math.ceil(0.35 * SR), out = new Float32Array(n);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      ph += (TAU * (48 + 110 * Math.exp(-t * 30))) / SR;
      out[i] = Math.sin(ph) * Math.exp(-t * 9);
    }
    return out;
  },
  hat() {
    const b = highpass(noiseBuf(0.06, 3), 7000);
    return b.map((v, i) => v * Math.exp((-i / SR) * 70) * 1.5);
  },
  shaker() {
    const b = highpass(noiseBuf(0.09, 5), 5000);
    return b.map((v, i) => v * Math.sin((Math.PI * i) / b.length) * 0.9);
  },
  snare() {
    const b = highpass(noiseBuf(0.2, 7), 1200);
    return b.map((v, i) => {
      const t = i / SR;
      return v * Math.exp(-t * 22) * 0.9 + Math.sin(TAU * 190 * t) * Math.exp(-t * 30) * 0.5;
    });
  },
  brush() {
    const b = lowpass(highpass(noiseBuf(0.22, 11), 1500), 6000);
    return b.map((v, i) => v * Math.pow(Math.sin((Math.PI * i) / b.length), 0.6) * Math.exp((-i / SR) * 8) * 1.4);
  },
  clap() {
    const b = highpass(noiseBuf(0.18, 13), 900);
    return b.map((v, i) => {
      const t = i / SR, burst = t < 0.03 ? 0.6 + 0.4 * Math.cos(TAU * 100 * t) : 1;
      return v * Math.exp(-t * 25) * burst * 1.2;
    });
  },
};

// Vinyl crackle: sparse soft clicks and a faint hiss.
function crackle(sec, seed) {
  const out = new Float32Array(Math.ceil(sec * SR)), r = rng(seed);
  const hiss = lowpass(highpass(noiseBuf(sec, seed + 1), 2000), 6000);
  for (let i = 0; i < out.length; i++) {
    out[i] = hiss[i] * 0.03;
    if (r() < 0.00025) {
      const g = 0.15 + r() * 0.35, len = 20 + Math.floor(r() * 60);
      for (let k = 0; k < len && i + k < out.length; k++) out[i + k] += (r() * 2 - 1) * g * (1 - k / len);
    }
  }
  return out;
}

// ---- voicing ----

// The chord's notes as MIDI numbers, placed near `center` so changes move as little as possible.
function voice(rootPc, shape, center) {
  return SHAPES[shape].map((iv) => {
    let m = rootPc + iv;
    while (m < center - 6) m += 12;
    while (m > center + 6) m -= 12;
    return m;
  }).sort((a, b) => a - b);
}

// ---- the moods' parts ----
// Each part is called once per bar: (out, bar) with bar = { t0, beat (s), chord, notes, bass, i, r }

const PARTS = {
  warm: [
    (out, b, sec) => {
      if (b.i) return; // one long chord over the whole video
      const notes = [b.bass - 12, b.bass, ...b.notes];
      for (const m of notes) addAt(out, padNote(hz(m), sec), 0, m === b.bass - 12 ? 0.5 : 0.3);
    },
  ],
  bright: [
    (out, b) => { // strum on 1, the "and" of 2, 3 and 4
      [0, 1.5, 2, 3].forEach((at, k) => b.notes.forEach((m, j) => addAt(out, pluck(hz(m + 12), b.beat * 0.9, 100 + b.i * 9 + k * 3 + j, 0.75), b.t0 + (at + j * 0.03) * b.beat, k === 0 ? 0.32 : 0.22)));
    },
    (out, b) => [0, 2].forEach((at) => addAt(out, sub(hz(b.bass - 12), b.beat * 1.6), b.t0 + at * b.beat, 0.55)),
    (out, b) => { for (let e = 0; e < 8; e++) addAt(out, DRUMS.shaker(), b.t0 + (e * b.beat) / 2, e % 2 ? 0.25 : 0.14); },
    (out, b) => [0, 2].forEach((at) => addAt(out, DRUMS.kick(), b.t0 + at * b.beat, 0.6)),
  ],
  lofi: [
    (out, b) => { // a lazy chord, pushed a little late, and a softer repeat
      b.notes.forEach((m, j) => addAt(out, keys(hz(m), b.beat * 2.6), b.t0 + (0.06 + j * 0.012) * b.beat, 0.22));
      b.notes.forEach((m, j) => addAt(out, keys(hz(m), b.beat * 1.2), b.t0 + (2.5 + j * 0.012) * b.beat, 0.13));
    },
    (out, b) => [[0, 1.8], [2.5, 1.2]].forEach(([at, d]) => addAt(out, sub(hz(b.bass - 12), b.beat * d), b.t0 + at * b.beat, 0.6)),
    (out, b) => { // swung eighths
      for (let e = 0; e < 8; e++) addAt(out, DRUMS.hat(), b.t0 + (Math.floor(e / 2) + (e % 2 ? 0.66 : 0)) * b.beat, e % 2 ? 0.12 : 0.2);
    },
    (out, b) => {
      addAt(out, DRUMS.kick(), b.t0, 0.6);
      addAt(out, DRUMS.kick(), b.t0 + 2.66 * b.beat, 0.45);
      [1, 3].forEach((at) => addAt(out, DRUMS.snare(), b.t0 + at * b.beat, 0.3));
    },
  ],
  bounce: [
    (out, b) => { // root, fifth, octave, fifth in eighths
      const line = [0, 7, 12, 7, 0, 7, 12, 14];
      line.forEach((iv, e) => addAt(out, pluck(hz(b.bass - 12 + iv), b.beat * 0.4, 300 + b.i * 8 + e, 0.25), b.t0 + (e * b.beat) / 2, 0.55));
    },
    (out, b) => { // marimba on the offbeats, climbing the chord
      for (let q = 0; q < 4; q++) addAt(out, mallet(hz(b.notes[q % b.notes.length] + 12)), b.t0 + (q + 0.5) * b.beat, 0.28);
    },
    (out, b) => [1, 3].forEach((at) => addAt(out, DRUMS.clap(), b.t0 + at * b.beat, 0.3)),
    (out, b) => [0, 2].forEach((at) => addAt(out, DRUMS.kick(), b.t0 + at * b.beat, 0.55)),
  ],
  dreamy: [
    (out, b) => { const all = [b.bass - 12, ...b.notes]; all.forEach((m) => addAt(out, padNote(hz(m), b.beat * 4), b.t0, 0.13)); },
    (out, b) => { // a slow arpeggio up and back, high on the music box
      const up = [...b.notes, b.notes[0] + 12, b.notes[1] + 12];
      const order = [0, 1, 2, 3, 4, 3, 2, 1];
      order.forEach((k, e) => addAt(out, tine(hz(up[k % up.length] + 12)), b.t0 + (e * b.beat) / 2, e === 0 ? 0.24 : 0.16));
    },
  ],
  jazzy: [
    (out, b) => { // walking bass: root, chord tone, chord tone, then a step toward the next root
      const ns = b.next - b.bass, approach = b.bass + (ns > 0 ? ns - 1 : ns + 1) + (Math.abs(ns) < 2 ? 2 : 0);
      [b.bass, b.bass + SHAPES[b.shape][1], b.bass + 7, approach].forEach((m, q) => addAt(out, pluck(hz(m - 12), b.beat * 0.85, 500 + b.i * 4 + q, 0.3), b.t0 + q * b.beat, 0.65));
    },
    (out, b) => { // piano comping: short chords on 2 and the "and" of 3
      [1, 2.5].forEach((at) => b.notes.forEach((m) => addAt(out, keys(hz(m), b.beat * 0.45), b.t0 + at * b.beat, 0.15)));
    },
    (out, b) => { // brushes: swish on every beat, ride-ish hat swung
      for (let q = 0; q < 4; q++) addAt(out, DRUMS.brush(), b.t0 + q * b.beat, q % 2 ? 0.28 : 0.18);
      for (let q = 0; q < 4; q++) addAt(out, DRUMS.hat(), b.t0 + (q + 0.66) * b.beat, 0.08);
    },
  ],
};

function bed(sec, o = {}) {
  const mood = MOODS[o.mood] ? o.mood : 'warm';
  const m = MOODS[mood];
  const bpm = o.bpm ?? m.bpm, beat = 60 / bpm, barLen = beat * 4;
  const key = KEYS[o.key ?? m.key];
  if (key == null) throw new Error(`unknown key "${o.key}"`);
  const out = new Float32Array(Math.ceil(sec * SR));
  const r = rng(o.seed ?? 1);
  const bars = mood === 'warm' ? 1 : Math.ceil(sec / barLen) + 1;
  const prog = m.prog;
  const bassOf = (k) => 48 + ((key + prog[k % prog.length][0]) % 12) - (((key + prog[k % prog.length][0]) % 12) > 6 ? 12 : 0);
  for (let i = 0; i < bars; i++) {
    const [deg, shape] = prog[i % prog.length];
    const rootPc = (key + deg) % 12;
    const b = { i, t0: i * barLen, beat, shape, notes: voice(rootPc, shape, 64), bass: bassOf(i), next: bassOf(i + 1), r };
    for (const part of PARTS[mood]) part(out, b, sec);
  }
  if (mood === 'lofi') addAt(out, crackle(sec, 31), 0, 1);
  if (mood === 'lofi') lowpass(out, 3200);
  if (mood === 'warm') lowpass(out, 1400);
  highpass(out, 30);

  // Fade in and out, then bring every mood to the same loudness (RMS), the original pad's,
  // so a mix's musicGain means the same whatever the mood.
  const fadeIn = mood === 'warm' ? 1.2 : 0.4;
  let sum = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] *= Math.max(0, Math.min(1, t / fadeIn, (sec - t) / 1.5));
    sum += out[i] * out[i];
  }
  const rms = Math.sqrt(sum / out.length);
  if (rms > 0) for (let i = 0; i < out.length; i++) out[i] *= RMS / rms;
  return out;
}

module.exports = { MOODS, KEYS, bed, SR };
