// The hand-drawn pen: seeded wobbly lines and shapes, the same way tomato.js draws.
// Every function takes a seed, so a frame always redraws identically.

const TAU = Math.PI * 2;
const INK = '#2b1b17';

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Mix a string or number into a seed.
function seedOf(...parts) {
  let h = 0x811c9dc5;
  for (const ch of parts.join('|')) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193);
  return h >>> 0;
}

function resample(pts, step) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
    for (let j = 1; j <= n; j++) out.push({ x: a.x + ((b.x - a.x) * j) / n, y: a.y + ((b.y - a.y) * j) / n });
  }
  return out;
}

// The "boil": the renderer bumps this every few frames so every line redraws a little
// differently, like hand-drawn animation. 0 for stills.
let boil = 0;
function setBoil(n) {
  boil = n;
}
function getBoil() {
  return boil;
}

// Push points sideways by a smooth, seeded drift along the path, so straight lines look drawn.
function wobble(pts, amp, seed, closed = false) {
  if (!amp) return pts;
  const r = rng(seed + Math.imul(boil, 0x9e3779b9));
  const p = resample(closed ? [...pts, pts[0]] : pts, 4);
  const f1 = TAU / (180 + r() * 160), f2 = TAU / (50 + r() * 40), p1 = r() * TAU, p2 = r() * TAU;
  let s = 0;
  return p.map((pt, i) => {
    if (i) s += Math.hypot(pt.x - p[i - 1].x, pt.y - p[i - 1].y);
    const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
    const nx = -(b.y - a.y), ny = b.x - a.x, nl = Math.hypot(nx, ny) || 1;
    const off = amp * (0.7 * Math.sin(s * f1 + p1) + 0.3 * Math.sin(s * f2 + p2));
    return { x: pt.x + (nx / nl) * off, y: pt.y + (ny / nl) * off };
  });
}

function trace(ctx, pts, closed) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  if (closed) ctx.closePath();
}

// The first fraction f (0..1) of a polyline, by length: lines that draw themselves on.
function slice(pts, f) {
  if (f >= 1) return pts;
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  let left = total * f;
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b.x - a.x, b.y - a.y);
    if (d >= left) {
      const k = d ? left / d : 0;
      out.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
      return out;
    }
    left -= d;
    out.push(b);
  }
  return out;
}

// o: { width, color, amp, seed, closed, alpha, upto }
// upto (0..1) draws only the first part of the line, for lines that draw themselves on.
function line(ctx, pts, o = {}) {
  let p = wobble(pts, o.amp ?? 2, o.seed ?? 1, o.closed);
  let closed = o.closed;
  if (o.upto != null) {
    if (o.upto <= 0) return;
    if (o.upto < 1) {
      p = slice(closed ? [...p, p[0]] : p, o.upto);
      closed = false;
    }
  }
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1; // layer onto any group fade
  ctx.strokeStyle = o.color || INK;
  ctx.lineWidth = o.width ?? 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  trace(ctx, p, closed);
  ctx.stroke();
  ctx.restore();
}

function fill(ctx, pts, color, o = {}) {
  const p = wobble(pts, o.amp ?? 2, o.seed ?? 1, true);
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.fillStyle = color;
  trace(ctx, p, true);
  ctx.fill();
  ctx.restore();
}

// Outline points of a rounded rectangle.
function roundRect(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  const pts = [];
  const corner = (cx, cy, a0) => {
    for (let i = 0; i <= 8; i++) {
      const a = a0 + (i / 8) * (Math.PI / 2);
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  };
  corner(x + w - r, y + r, -Math.PI / 2);
  corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, Math.PI / 2);
  corner(x + r, y + r, Math.PI);
  return pts;
}

function ellipse(cx, cy, rx, ry, n = 48) {
  const pts = [];
  for (let i = 0; i < n; i++) pts.push({ x: cx + rx * Math.cos((i / n) * TAU), y: cy + ry * Math.sin((i / n) * TAU) });
  return pts;
}

// A filled shape with an ink outline, drawn slightly off-register like a hand-coloured sketch.
function shape(ctx, pts, o = {}) {
  const seed = o.seed ?? 1;
  if (o.fill) fill(ctx, pts.map((p) => ({ x: p.x + (o.offset ?? 3), y: p.y + (o.offset ?? 3) })), o.fill, { seed: seed + 7, amp: o.amp });
  line(ctx, pts, { width: o.width ?? 6, color: o.color, amp: o.amp ?? 2, seed, closed: true });
}

// A four-point sparkle doodle.
function sparkle(ctx, x, y, size, o = {}) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU - Math.PI / 2;
    const r = i % 2 ? size * 0.22 : size;
    pts.push({ x: x + r * Math.cos(a), y: y + r * Math.sin(a) });
  }
  shape(ctx, pts, { fill: o.fill, width: o.width ?? 5, amp: 1, seed: o.seed, offset: 0, color: o.color });
}

// Paper grain: faint speckles, like printed paper.
function grain(ctx, w, h, color, seed = 1, density = 1) {
  const r = rng(seed);
  ctx.save();
  ctx.fillStyle = color;
  const n = Math.round((w * h) / 190 * density);
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = 0.03 + r() * 0.05;
    const s = 0.8 + r() * 1.6;
    ctx.fillRect(r() * w, r() * h, s, s);
  }
  ctx.restore();
}

module.exports = { TAU, INK, rng, seedOf, setBoil, getBoil, trace, slice, wobble, line, fill, shape, roundRect, ellipse, sparkle, grain };
