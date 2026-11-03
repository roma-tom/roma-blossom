// Timing helpers. Scenes get t from 0 to 1 and slice it into steps with seg().

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// Progress of t through the window [a, b], clamped to 0..1.
const seg = (t, a, b) => clamp((t - a) / (b - a));

const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);
const easeInOut = (x) => {
  x = clamp(x);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

// Shoots past 1 and settles back: pop-ins and landings.
const spring = (x) => {
  x = clamp(x);
  return x >= 1 ? 1 : 1 - Math.exp(-6 * x) * Math.cos(9 * x);
};

// A decaying wiggle from 1 down to 0: the squash after a tomato lands.
const settle = (x) => (x <= 0 || x >= 1 ? 0 : Math.exp(-5 * x) * Math.sin(x * 14));

// Slow idle breathing for a tomato at rest, from seconds.
const breathe = (sec, rate = 0.7) => 1 + 0.015 * Math.sin(sec * Math.PI * 2 * rate);

module.exports = { clamp, seg, easeOut, easeInOut, spring, settle, breathe };
