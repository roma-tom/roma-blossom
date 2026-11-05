// Sound design, made in code: a warm pad under the whole video and short effects on cues.
// Everything is seeded, so a storyboard always sounds the same.

const { rng } = require('./pen.js');

const SR = 48000;
const TAU = Math.PI * 2;

const buf = (sec) => new Float32Array(Math.ceil(sec * SR));

// Seeded white noise, -1..1.
function noise(n, seed) {
  const r = rng(seed), out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = r() * 2 - 1;
  return out;
}

// One-pole lowpass with a cutoff (Hz) that may change per sample.
function lowpass(x, cutoff) {
  const out = new Float32Array(x.length);
  let y = 0;
  for (let i = 0; i < x.length; i++) {
    const fc = typeof cutoff === 'function' ? cutoff(i / SR) : cutoff;
    const a = 1 - Math.exp((-TAU * fc) / SR);
    y += a * (x[i] - y);
    out[i] = y;
  }
  return out;
}

// A sum of decaying sine partials: bells, chimes, coins. parts: [freq, amp, decay per second]
function bell(sec, parts, attack = 0.002) {
  const b = buf(sec);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR, a = Math.min(1, t / attack);
    let s = 0;
    for (const [f, amp, d] of parts) s += amp * Math.sin(TAU * f * t) * Math.exp(-d * t);
    b[i] = s * a;
  }
  return b;
}

const SFX = {
  // A tomato or label popping in: a quick pitch drop.
  pop() {
    const b = buf(0.14);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / SR, f = 260 + 900 * Math.exp(-t * 28);
      ph += (TAU * f) / SR;
      b[i] = Math.sin(ph) * Math.exp(-t * 32) * Math.min(1, t * 900) * 0.9;
    }
    return b;
  },
  // Something growing: a rising, wobbling whistle.
  sprout() {
    const b = buf(0.38);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / SR, u = t / 0.38;
      const f = 300 + 650 * Math.pow(u, 0.7) + Math.sin(TAU * 16 * t) * 25;
      ph += (TAU * f) / SR;
      b[i] = (Math.sin(ph) + 0.25 * Math.sin(2 * ph)) * Math.min(1, t * 120) * Math.pow(1 - u, 1.5) * 0.6;
    }
    return b;
  },
  // A soft landing thump.
  squish() {
    const b = buf(0.2), n = lowpass(noise(b.length, 5), 900);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / SR, f = 55 + 120 * Math.exp(-t * 14);
      ph += (TAU * f) / SR;
      b[i] = Math.sin(ph) * Math.exp(-t * 18) + n[i] * Math.exp(-t * 30) * 1.2;
    }
    return b;
  },
  // A soft two-note chime: "got it".
  chime() {
    const a = bell(1.4, [[1318.5, 0.5, 3], [2637, 0.12, 6], [3951, 0.05, 9]]);
    const b = bell(1.2, [[1975.5, 0.4, 3.5], [3951, 0.1, 7]]);
    const out = buf(1.6), gap = Math.round(0.11 * SR);
    a.forEach((v, i) => (out[i] += v));
    b.forEach((v, i) => (out[i + gap] += v));
    return out;
  },
  // Air moving past: the scene wipe.
  whoosh() {
    const T = 0.55, n = noise(Math.ceil(T * SR), 9);
    const f = lowpass(n, (t) => 300 + 2600 * Math.sin(Math.PI * Math.min(1, t / T)));
    return f.map((v, i) => v * Math.pow(Math.sin((Math.PI * i) / f.length), 2) * 2.2);
  },
  // A finger on glass.
  tap() {
    const b = buf(0.05), n = noise(b.length, 13);
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      b[i] = Math.sin(TAU * 1700 * t) * Math.exp(-t * 110) * 0.6 + n[i] * Math.exp(-t * 400) * 0.3;
    }
    return b;
  },
  // A receipt printer step, a key press.
  tick() {
    const b = buf(0.03), n = noise(b.length, 17), lp = lowpass(n, 2500);
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      b[i] = (n[i] - lp[i]) * Math.exp(-t * 350) * 0.8 + Math.sin(TAU * 3100 * t) * Math.exp(-t * 220) * 0.25;
    }
    return b;
  },
  // A pen scribbling.
  scratch() {
    const T = 0.32, n = noise(Math.ceil(T * SR), 21);
    const hi = lowpass(n, 5000), lo = lowpass(n, 1200);
    return hi.map((v, i) => {
      const t = i / SR, strokes = Math.pow(0.5 + 0.5 * Math.sin(TAU * 21 * t), 2);
      return (v - lo[i]) * strokes * Math.sin((Math.PI * t) / T) * 1.6;
    });
  },
  // A coin landing on coins.
  clink() {
    return bell(0.25, [[3150, 0.35, 26], [4210, 0.25, 30], [5530, 0.18, 36], [6810, 0.1, 44]], 0.0005);
  },
  // The till: a bright bell.
  ding() {
    const b = bell(1.1, [[2093, 0.5, 4], [2637, 0.25, 5], [4186, 0.15, 8], [5310, 0.08, 10]], 0.001);
    const n = noise(400, 25);
    n.forEach((v, i) => (b[i] += v * (1 - i / 400) * 0.2));
    return b;
  },
  // A quicker, airier wipe than the whoosh.
  swish() {
    const T = 0.32, n = noise(Math.ceil(T * SR), 33);
    const lo = lowpass(n, 1500);
    const f = lowpass(n.map((v, i) => v - lo[i]), (t) => 2500 + 6000 * Math.sin(Math.PI * Math.min(1, t / T)));
    return f.map((v, i) => v * Math.pow(Math.sin((Math.PI * i) / f.length), 3) * 3);
  },
  // Paper sliding over paper: a grainy, papery wipe.
  rustle() {
    const T = 0.5, n = noise(Math.ceil(T * SR), 37), r = rng(41);
    const lo = lowpass(n, 900), hi = lowpass(n, 7000);
    let grit = 0;
    return hi.map((v, i) => {
      if (i % 240 === 0) grit = 0.4 + r() * 0.6;
      return (v - lo[i]) * grit * Math.sin((Math.PI * i) / hi.length) * 2.4;
    });
  },
  // A springy landing.
  boing() {
    const b = buf(0.4);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / SR, f = 180 + 140 * Math.exp(-t * 6) + 40 * Math.sin(TAU * 14 * t) * Math.exp(-t * 5);
      ph += (TAU * f) / SR;
      b[i] = (Math.sin(ph) + 0.3 * Math.sin(2 * ph)) * Math.min(1, t * 400) * Math.exp(-t * 7) * 0.7;
    }
    return b;
  },
  // A soft, round blip: a gentler pop.
  blip() {
    const b = buf(0.12);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / SR, f = 520 + 380 * Math.exp(-t * 40);
      ph += (TAU * f) / SR;
      b[i] = Math.sin(ph) * Math.exp(-t * 30) * Math.min(1, t * 500) * 0.8;
    }
    return b;
  },
};

// The beds: soft chords, gently detuned, swelling slowly, under the whole video. Each is one
// chord, or two that drift into each other every `every` seconds. Notes in Hz, lowest first;
// the lowest is the root and sits a little louder. cutoff is the lowpass (Hz) that keeps it warm.
const PADS = {
  // The original: Fmaj9, warm and round.
  warm: { chords: [[87.31, 174.61, 220, 261.63, 329.63, 392]], cutoff: 1400 },
  // Cmaj9, open and a little brighter: sunny mornings, good news.
  sunny: { chords: [[65.41, 130.81, 196, 246.94, 293.66, 329.63]], cutoff: 1700 },
  // Dm9, soft and thoughtful: careful money talk.
  mellow: { chords: [[73.42, 146.83, 174.61, 220, 261.63, 329.63]], cutoff: 1250 },
  // Abmaj9, deep and cosy: evenings, regulars.
  cosy: { chords: [[103.83, 155.56, 196, 233.08, 261.63, 311.13]], cutoff: 1300 },
  // Fmaj9 drifting to Dm9 and back: gentle movement for longer videos.
  drift: { chords: [[87.31, 174.61, 220, 261.63, 329.63, 392], [73.42, 146.83, 174.61, 220, 261.63, 329.63]], every: 6, cutoff: 1400 },
  // Cmaj9 swaying to Am9: light and hopeful.
  sway: { chords: [[65.41, 130.81, 196, 246.94, 293.66, 329.63], [110, 164.81, 196, 246.94, 261.63, 329.63]], every: 5, cutoff: 1600 },
};

// How loud chord j of n is at time t (0 to 1): each holds for `every` s, crossfading over 2 s.
function chordWeight(t, j, n, every) {
  if (n === 1) return 1;
  const fade = Math.min(2, every / 2);
  const pos = t / every, k = Math.floor(pos), u = (pos - k) * every; // seconds into chord k
  const cur = k % n, next = (k + 1) % n;
  const x = Math.max(0, (u - (every - fade)) / fade); // 0 until the crossfade, then to 1
  const into = 0.5 - 0.5 * Math.cos(Math.PI * x);
  return (j === cur ? 1 - into : 0) + (j === next ? into : 0);
}

// The bed under everything, by name (see PADS; default warm).
function pad(sec, name = 'warm') {
  const def = PADS[name];
  if (!def) throw new Error(`unknown pad "${name}" (one of: ${Object.keys(PADS).join(', ')})`);
  const { chords, every = 6, cutoff } = def;
  const b = buf(sec);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    let s = 0;
    chords.forEach((notes, j) => {
      const w = chordWeight(t, j, chords.length, every);
      if (w <= 0) return;
      notes.forEach((f, k) => {
        const swell = 0.75 + 0.25 * Math.sin(TAU * (0.07 + k * 0.013) * t + k);
        for (const d of [-0.18, 0.18]) {
          const ph = TAU * (f + d) * t;
          s += w * swell * (Math.sin(ph) + 0.3 * Math.sin(2 * ph) + 0.08 * Math.sin(3 * ph)) / (k === 0 ? 1.2 : 2);
        }
      });
    });
    const fade = Math.min(1, t / 1.2, (sec - t) / 1.5);
    b[i] = (s / chords[0].length) * Math.max(0, fade);
  }
  return lowpass(b, cutoff);
}

// How much to duck the bed under the voice, per sample (0 to 1): fast in, slow out.
function duckEnvelope(voice, n) {
  const out = new Float32Array(n);
  if (!voice) return out;
  const att = 1 - Math.exp(-1 / (0.03 * SR)), rel = 1 - Math.exp(-1 / (0.35 * SR));
  let e = 0;
  for (let i = 0; i < n; i++) {
    const v = i < voice.length ? Math.min(1, Math.abs(voice[i]) * 6) : 0;
    e += (v - e) * (v > e ? att : rel);
    out[i] = e;
  }
  return out;
}

// Mix the pad, every cue ({ at: seconds, sfx, gain }) and the voice into one track. Under the
// voice the pad drops by o.duck (default 0.6) and the effects by half that.
// o: { pad, padGain, sfxGain, voiceGain, duck, swap: { pop: 'blip' } }
function mix(sec, cues, o = {}, voice = null) {
  const out = buf(sec);
  const bed = pad(sec, o.pad);
  const gain = o.padGain ?? 0.22;
  const duck = duckEnvelope(voice, out.length), depth = o.duck ?? 0.6;
  for (let i = 0; i < out.length; i++) out[i] = bed[i] * gain * (1 - depth * duck[i]);

  const swap = o.swap || {};
  const cache = {}, used = new Set();
  for (const c of cues) {
    const name = swap[c.sfx] || c.sfx;
    if (!SFX[name]) throw new Error(`unknown sound effect "${name}"`);
    used.add(name);
    const s = (cache[name] ||= SFX[name]());
    const at = Math.round(c.at * SR), g = (c.gain ?? 0.8) * (o.sfxGain ?? 0.7);
    for (let i = 0; i < s.length && at + i < out.length; i++) if (at + i >= 0) out[at + i] += s[i] * g * (1 - 0.5 * depth * duck[at + i]);
  }
  if (voice) {
    const vg = o.voiceGain ?? 1;
    for (let i = 0; i < out.length && i < voice.length; i++) out[i] += voice[i] * vg;
  }
  // Gentle limiter so stacked effects never clip.
  for (let i = 0; i < out.length; i++) out[i] = Math.tanh(out[i] * 1.1) * 0.9;
  out.used = used; // the effects actually heard, after swaps
  return out;
}

// 16-bit mono WAV.
function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

module.exports = { SR, SFX, PADS, pad, mix, wav };
