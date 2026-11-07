// Props and moves for building a video's own hook (videos/<slug>/hook.js). Each video gets a
// hook made for it; these are the parts it can be built from, alongside kit.js (tomato,
// headline, kicker, rays, pen) and marks.js (text, bubble, loop, cross, check, money).
//
// Every function draws at the size and place you give it. Timing helpers work in seconds:
// build hooks on info.sec, not t, so text lands at the same moment however long the line is.

const { W, C, THEMES, headline, kicker, tomato, pen, motion } = require('./kit.js');
const { text, wrapText, bubble, loop } = require('./marks.js');
const { seg, easeOut, easeInOut, spring, settle, breathe } = motion;

// ---- Timing ----

// Progress (0..1) through the window from a to b seconds, eased.
const at = (sec, a, b, ease = easeOut) => ease(seg(sec, a, b));
// A pop-in that overshoots and settles, from a for `len` seconds.
const pop = (sec, a, len = 0.3) => spring(seg(sec, a, a + len));

// Draw something popping in from its anchor point (x, y): fn() draws it at full size.
function popIn(ctx, k, x, y, fn) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-x, -y); fn(); ctx.restore();
}

// ---- Characters ----

// A tomato walking from x0 to x1 between seconds a and b, bobbing as it goes.
// Returns { x, y, angle } to pass to tomato(); y is the ground line given.
function walk(sec, x0, x1, a, b, y) {
  const p = easeOut(seg(sec, a, b));
  const moving = p > 0 && p < 1;
  return {
    x: x0 + (x1 - x0) * p,
    y: y - (moving ? Math.abs(Math.sin(sec * 14)) * 18 : 0),
    angle: moving ? Math.sign(x1 - x0) * 0.08 : Math.sin(sec * 2) * 0.03,
  };
}

// A jump at second a: returns { hop (px up), squash } for the tomato landing.
function jump(sec, a, height = 60) {
  return {
    hop: Math.max(0, Math.sin(Math.PI * seg(sec, a, a + 0.3))) * height,
    squash: 1 + 0.12 * settle(seg(sec, a, a + 0.7)) + (breathe(sec) - 1),
  };
}

// Roma Tom (or anyone) rising from below the frame like the sun, centered on x.
function rise(ctx, name, sec, o = {}) {
  const { x = W / 2, y = 1660, size = 700, a = 0.2 } = o;
  const r = spring(seg(sec, a, a + 0.45));
  tomato(ctx, name, x, y + (1 - r) * 600, size, { squash: o.squash ?? breathe(sec), angle: o.angle ?? Math.sin(sec * 1.6) * 0.03 });
}

// A reaction drawn around a head at (x, y): 'shock' (lines on both sides), 'sweat' (two
// drops), 'joy' (sparkles) or 'think' (three dots). p (0..1) plays it in.
function reaction(ctx, theme, kind, x, y, p) {
  if (p <= 0) return;
  if (kind === 'joy') {
    [[-190, -150, 34], [180, -170, 28], [210, -40, 22], [-210, -20, 24]].forEach(([dx, dy, s], i) =>
      pen.sparkle(ctx, x + dx, y + dy, s * spring(seg(p, i * 0.1, 0.5 + i * 0.1)), { fill: C.lime, seed: 2510 + i }));
  } else if (kind === 'sweat') {
    [[150, -150], [185, -95]].forEach(([dx, dy], i) => {
      const k = easeOut(seg(p, i * 0.15, 0.5 + i * 0.15)), dy2 = dy + k * 26;
      const d = [{ x: x + dx, y: y + dy2 - 34 }, { x: x + dx + 17, y: y + dy2 }, { x: x + dx, y: y + dy2 + 14 }, { x: x + dx - 17, y: y + dy2 }];
      if (k > 0) pen.shape(ctx, d, { fill: C.sky, width: 4, seed: 2520 + i, offset: 0, alpha: k });
    });
  } else if (kind === 'think') {
    [0, 1, 2].forEach((i) => {
      const k = spring(seg(p, i * 0.2, 0.3 + i * 0.2));
      if (k > 0) pen.shape(ctx, pen.ellipse(x + 150 + i * 40, y - 200 - i * 30, 12 * k + i * 4 * k, 12 * k + i * 4 * k, 16), { fill: C.card, width: 4, seed: 2540 + i, offset: 0 });
    });
  } else {
    [-1.05, -0.6, 0.6, 1.05].forEach((a, i) => {
      const k = easeOut(seg(p, (i % 2) * 0.06, 0.35 + (i % 2) * 0.06));
      const r0 = 240, r1 = 240 + 70 * k;
      if (k > 0) pen.line(ctx, [{ x: x + r0 * Math.sin(a), y: y - r0 * Math.cos(a) }, { x: x + r1 * Math.sin(a), y: y - r1 * Math.cos(a) }],
        { width: 10, color: theme.accent, seed: 2530 + i });
    });
  }
}

// ---- Words ----

// A guest's line in a speech bubble at (x, y, w), its tail pointing to (tx, ty). k pops it in.
// The quote is a headline, so *word* gets the lime swash. Returns the bubble's height.
function say(ctx, quote, o) {
  const { x, y, w, tx, ty, k = 1, size = 88, seed = 2550 } = o;
  const lines = wrapText(String(quote).replace(/\*/g, ''), w - 140, { size, balance: true }).length;
  const h = 100 + lines * size * 1.02 + 50;
  popIn(ctx, k, tx, ty, () => {
    bubble(ctx, x, y, w, h, tx, ty, C.card, seed);
    headline(ctx, { ...THEMES.paper, swash: C.lime }, quote, { x: x + w / 2, y: y + 70, size, maxW: w - 120, seed: seed + 1 });
  });
  return h;
}

// A pill label with a hand-drawn arrow from it to (x1, y1). p draws the arrow on.
function pointer(ctx, theme, label, lx, ly, x1, y1, k, p, seed = 2704) {
  popIn(ctx, k, lx, ly, () => kicker(ctx, label, lx, ly, { seed }));
  const ay0 = ly + (y1 > ly ? 46 : -46);
  if (p > 0) pen.line(ctx, [{ x: lx, y: ay0 }, { x: (lx + x1) / 2 + 20, y: (ay0 + y1) / 2 }, { x: x1, y: y1 }], { width: 8, color: theme.accent, seed: seed + 1, upto: p });
}

// ---- Effects ----

// Fade everything but an ellipse toward the background color (a spotlight). p 0..1.
function spotlight(ctx, theme, f, p) {
  if (p <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(-50, -50, W + 100, 2100);
  ctx.ellipse(f.x, f.y, f.rx * 1.12, f.ry * 1.12, 0, 0, Math.PI * 2, true);
  ctx.fillStyle = theme.bg;
  ctx.globalAlpha = 0.62 * p;
  ctx.fill('evenodd');
  ctx.restore();
}

// A white flash over the frame (p from 1 down to 0).
function flash(ctx, p) {
  if (p <= 0) return;
  ctx.save(); ctx.globalAlpha = 0.6 * p; ctx.fillStyle = C.card; ctx.fillRect(0, 0, W, 1920); ctx.restore();
}

// A pause sign (two bars) at (x, y), popping in with k.
function pauseSign(ctx, theme, x, y, k) {
  popIn(ctx, k, x, y, () => {
    pen.shape(ctx, pen.roundRect(x - 34, y - 44, 26, 88, 8), { fill: theme.text, width: 4, seed: 2701, offset: 0 });
    pen.shape(ctx, pen.roundRect(x + 8, y - 44, 26, 88, 8), { fill: theme.text, width: 4, seed: 2702, offset: 0 });
  });
}

// Circle a spot (the way you'd circle a number), drawn on with p.
const circle = (ctx, theme, f, p, seed = 2703) => loop(ctx, f.x, f.y, f.rx, f.ry, p, theme.accent, seed, 10);

// Play another template as part of the hook, frozen or running: draws scene type at its own t.
function playScene(ctx, theme, type, props, t) {
  require(`../scenes/${type}.js`)(ctx, theme, t, props || {}, { sec: t * 4, dur: 4 });
}

// ---- Sets ----

// A cafe counter whose top edge runs across the screen at y, with an optional cup at cupX.
function counter(ctx, y, o = {}) {
  pen.shape(ctx, [{ x: -40, y }, { x: 1120, y: y - 6 }, { x: 1120, y: 1980 }, { x: -40, y: 1980 }], { fill: C.card, width: 7, seed: 2501, offset: 0 });
  pen.line(ctx, [{ x: -40, y: y + 46 }, { x: 1120, y: y + 40 }], { width: 4, color: C.line, seed: 2502 });
  if (o.cupX != null) cup(ctx, o.cupX, y);
}

// A cup on a saucer standing on y, with steam.
function cup(ctx, x, y, s = 1) {
  pen.shape(ctx, pen.ellipse(x, y + 4, 70 * s, 14 * s), { fill: C.card, width: 5, seed: 2503, offset: 0 });
  pen.shape(ctx, [{ x: x - 45 * s, y: y - 74 * s }, { x: x + 45 * s, y: y - 74 * s }, { x: x + 32 * s, y: y - 2 }, { x: x - 32 * s, y: y - 2 }], { fill: C.card, width: 5, seed: 2504, offset: 0 });
  pen.line(ctx, [{ x: x - 14 * s, y: y - 100 * s }, { x: x - 6 * s, y: y - 120 * s }, { x: x - 14 * s, y: y - 140 * s }], { width: 4, color: C.muted, seed: 2505 });
}

// A storefront w wide at x, with a sign above (sign text), an awning, and an open door with
// the owner tomato `name` in it. top is the sign's middle, awn the awning, floor the street.
function storefront(ctx, theme, o) {
  const { x, w = 420, sign = '', name = 'Leo', sec = 0, dim = 0, seed = 2610, top = 640, awn = 760, floor = 1240 } = o;
  const cx = x + w / 2;
  const lines = wrapText(sign, w - 70, { size: 52, balance: true }).slice(0, 2);
  const sh = 40 + lines.length * 56;
  pen.shape(ctx, pen.roundRect(x + 10, top - sh / 2 - 20, w - 20, sh, 16), { fill: C.card, width: 5, seed, offset: 4 });
  lines.forEach((ln, i) => text(ctx, ln, cx, top - sh / 2 + 34 + i * 56, { size: 52, align: 'center' }));
  pen.shape(ctx, pen.roundRect(x, awn, w, floor - awn, 10), { fill: C.paper, width: 6, seed: seed + 1, offset: 0 });
  const n = 5, sw = w / n;
  for (let i = 0; i < n; i++) {
    const sx = x + i * sw;
    const pts = [{ x: sx, y: awn - 50 }, { x: sx + sw, y: awn - 50 }, { x: sx + sw, y: awn + 30 }];
    for (let j = 0; j <= 8; j++) pts.push({ x: sx + sw - (sw * j) / 8, y: awn + 30 + Math.sin((Math.PI * j) / 8) * 26 });
    pen.shape(ctx, pts, { fill: i % 2 ? C.card : C.rose, width: 5, seed: seed + 10 + i, offset: 0 });
  }
  pen.shape(ctx, pen.roundRect(cx - 110, awn + 120, 220, floor - awn - 120, 12), { fill: C.card, width: 5, seed: seed + 2, offset: 0 });
  tomato(ctx, name, cx, floor - 120, 230, { squash: breathe(sec) });
  if (dim > 0) {
    ctx.save(); ctx.globalAlpha = 0.45 * dim; ctx.fillStyle = theme.bg;
    ctx.fillRect(x - 10, top - 120, w + 20, floor - top + 140); ctx.restore();
  }
}

// A table seen from the front at (x, y) with chairs; empty chairs can be crossed out later.
function table(ctx, x, y, o = {}) {
  const { w = 360, seed = 2800 } = o;
  pen.shape(ctx, pen.roundRect(x - w / 2, y - 24, w, 36, 12), { fill: C.card, width: 6, seed, offset: 0 });
  pen.line(ctx, [{ x: x - w / 2 + 40, y: y + 12 }, { x: x - w / 2 + 50, y: y + 200 }], { width: 7, seed: seed + 1 });
  pen.line(ctx, [{ x: x + w / 2 - 40, y: y + 12 }, { x: x + w / 2 - 50, y: y + 200 }], { width: 7, seed: seed + 2 });
}

// A clock face at (x, y) showing h:m, its hands drawn on with p.
function clock(ctx, theme, x, y, r, h, m, p = 1, seed = 2820) {
  pen.shape(ctx, pen.ellipse(x, y, r, r, 40), { fill: C.card, width: 6, seed, offset: 0 });
  const am = (m / 60) * Math.PI * 2 - Math.PI / 2, ah = ((h % 12) / 12 + m / 720) * Math.PI * 2 - Math.PI / 2;
  pen.line(ctx, [{ x, y }, { x: x + Math.cos(ah) * r * 0.5, y: y + Math.sin(ah) * r * 0.5 }], { width: 8, seed: seed + 1, upto: p });
  pen.line(ctx, [{ x, y }, { x: x + Math.cos(am) * r * 0.78, y: y + Math.sin(am) * r * 0.78 }], { width: 6, color: theme.accent, seed: seed + 2, upto: p });
}

// A coin r px across flying from (x0, y0) to (x1, y1) along an arc as p goes 0..1, spinning.
function coin(ctx, theme, x0, y0, x1, y1, p, seed = 2840, r = 30, arc = 160) {
  if (p <= 0 || p >= 1) return;
  const x = x0 + (x1 - x0) * p, y = y0 + (y1 - y0) * p - Math.sin(Math.PI * p) * arc;
  const sq = Math.abs(Math.cos(p * 12));
  pen.shape(ctx, pen.ellipse(x, y, r * sq + 6, r, 24), { fill: theme.mark === C.lime ? C.lime : C.butter, width: 4, seed, offset: 0 });
}

module.exports = {
  at, pop, popIn, walk, jump, rise, reaction, say, pointer, spotlight, flash, pauseSign, circle,
  playScene, counter, cup, storefront, table, clock, coin, seg, easeOut, easeInOut, spring, settle, breathe,
};
