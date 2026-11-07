// Hook, the cold open: the video starts inside a moment every owner knows. Roma Tom is behind
// the counter, a guest walks up and says the line, and Roma Tom reacts. "POV:" and the setup
// are on screen from the first frame. For relatable openers ("POV: two minutes to close…").
//
// props: { pov: 'Two minutes to close.', guest: 'Ivan', quote: 'Are you still doing *food*?',
//          react: 'shock' | 'sweat' | 'joy', host = 'Roma Tom' }
// Set the scene's speaker to the guest so the line is said in their voice.

const { W, C, THEMES, kicker, headline, tomato, pen, motion } = require('../lib/kit.js');
const { wrapText, bubble } = require('../lib/marks.js');
const { seg, easeOut, spring, settle, breathe } = motion;

const COUNTER = 1440, REACT = 1.25; // y of the counter top; seconds until the reaction

function counter(ctx) {
  pen.shape(ctx, [{ x: -40, y: COUNTER }, { x: 1120, y: COUNTER - 6 }, { x: 1120, y: 1980 }, { x: -40, y: 1980 }],
    { fill: C.card, width: 7, seed: 2501, offset: 0 });
  pen.line(ctx, [{ x: -40, y: COUNTER + 46 }, { x: 1120, y: COUNTER + 40 }], { width: 4, color: C.line, seed: 2502 });
  // A cup and its saucer on the counter.
  pen.shape(ctx, pen.ellipse(250, COUNTER + 4, 70, 14), { fill: C.card, width: 5, seed: 2503, offset: 0 });
  pen.shape(ctx, [{ x: 205, y: COUNTER - 74 }, { x: 295, y: COUNTER - 74 }, { x: 282, y: COUNTER - 2 }, { x: 218, y: COUNTER - 2 }],
    { fill: C.card, width: 5, seed: 2504, offset: 0 });
  pen.line(ctx, [{ x: 236, y: COUNTER - 100 }, { x: 244, y: COUNTER - 120 }, { x: 236, y: COUNTER - 140 }], { width: 4, color: C.muted, seed: 2505 });
}

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
  } else {
    // Shock: lines bursting out on both sides of the head.
    [-1.05, -0.6, 0.6, 1.05].forEach((a, i) => {
      const k = easeOut(seg(p, (i % 2) * 0.06, 0.35 + (i % 2) * 0.06));
      const r0 = 240, r1 = 240 + 70 * k;
      if (k > 0) pen.line(ctx, [{ x: x + r0 * Math.sin(a), y: y - r0 * Math.cos(a) }, { x: x + r1 * Math.sin(a), y: y - r1 * Math.cos(a) }],
        { width: 10, color: theme.accent, seed: 2530 + i });
    });
  }
}

function hookPov(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3.5;
  const host = props.host || 'Roma Tom', guest = props.guest || 'Ivan';
  const react = props.react || 'shock';

  // The setup, readable at once.
  ctx.save(); ctx.translate(520, 250); ctx.scale(spring(seg(sec, 0, 0.2)), spring(seg(sec, 0, 0.2))); kicker(ctx, 'POV', 0, 0); ctx.restore();
  headline(ctx, theme, props.pov || '', { x: 520, y: 310, size: 104, maxW: 820, appear: easeOut(seg(sec, 0, 0.3)), seed: 2540 });

  // Roma Tom behind the counter, in the middle; he jumps when the line lands.
  const jump = settle(seg(sec, REACT, REACT + 0.7));
  const hop = Math.max(0, Math.sin(Math.PI * seg(sec, REACT, REACT + 0.3))) * 60;
  tomato(ctx, host, W / 2, 1300 - hop, 560, { squash: 1 + 0.12 * jump + (breathe(sec) - 1) });
  counter(ctx);

  // The guest walks up from the right, with a little bob, and stops at the counter.
  const walk = easeOut(seg(sec, 0, 0.6));
  const gx = 1250 - walk * 400, bob = walk < 1 ? Math.abs(Math.sin(sec * 14)) * 18 : 0;
  tomato(ctx, guest, gx, 1580 - bob, 360, { squash: breathe(sec, 0.9), angle: walk < 1 ? -0.08 : Math.sin(sec * 2) * 0.03 });

  // Their line, in a bubble pointing at them.
  const lines = wrapText((props.quote || '').replace(/\*/g, ''), 640, { size: 88, balance: true }).length;
  const BX = 130, BY = 600, BW = 780, BH = 100 + lines * 90 + 50;
  const k = spring(seg(sec, 0.55, 0.85));
  if (k > 0) {
    const tx = 830, ty = BY + BH + 150;
    ctx.save(); ctx.translate(tx, ty); ctx.scale(k, k); ctx.translate(-tx, -ty);
    bubble(ctx, BX, BY, BW, BH, tx, ty, C.card, 2550);
    headline(ctx, { ...THEMES.paper, swash: C.lime }, props.quote || '', { x: BX + BW / 2, y: BY + 70, size: 88, maxW: 660, seed: 2551 });
    ctx.restore();
  }
  // Drawn last, so the bubble never covers it.
  reaction(ctx, theme, react, W / 2, 1260 - hop, seg(sec, REACT, REACT + 0.6));
}

hookPov.cues = () => [
  { sec: 0, sfx: 'tap', gain: 0.5 },
  { sec: 0.15, sfx: 'tap', gain: 0.4 },
  { sec: 0.3, sfx: 'tap', gain: 0.4 },
  { sec: 0.55, sfx: 'pop', gain: 0.6 },
  { sec: REACT, sfx: 'boing', gain: 0.6 },
];
hookPov.cover = (p) => ({ kicker: 'POV', headline: p.pov, name: p.guest });

module.exports = hookPov;
