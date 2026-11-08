// This video's own hook.
//
// The idea: a coffee pot keeps swooping in to top up Leo's mug, and every refill pops the
// register drawer open and a coin flies out of it, off the left edge, while a tally of free
// refills ticks up on a little card.
// Frame one shows: the pot already tilted and pouring.    Readable by 0.5 s: "Free refills.
// Free for *who*?"    The open loop: what do those "free" refills actually cost?
//
// props: { line, label }

const { W, C, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const { text } = require('../../scripts/lib/marks.js');
const S = require('../../scripts/lib/stage.js');

const TOP = 1430, MUG = { x: 650, y: TOP }, REG = { x: 220, y: TOP };
const EVERY = 0.62, POUR = 0.42, POURS = 5;

// The coffee pot, pivoting on its handle at (x, y), tilted by angle.
function pot(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle);
  pen.shape(ctx, [{ x: -150, y: -90 }, { x: -40, y: -90 }, { x: -20, y: 40 }, { x: -60, y: 130 }, { x: -200, y: 130 }, { x: -230, y: 40 }, { x: -190, y: -60 }],
    { fill: C.card, width: 6, seed: 3110, offset: 4 });
  pen.shape(ctx, [{ x: -226, y: 50 }, { x: -24, y: 50 }, { x: -58, y: 126 }, { x: -198, y: 126 }], { fill: C.roseDark, width: 0, seed: 3111, offset: 0 });
  pen.line(ctx, [{ x: -190, y: -60 }, { x: -250, y: -100 }], { width: 7, seed: 3112 }); // spout
  pen.line(ctx, [{ x: -40, y: -70 }, { x: 20, y: -40 }, { x: 20, y: 60 }, { x: -24, y: 80 }], { width: 9, seed: 3113 }); // handle
  ctx.restore();
}

// The register: a box on the counter with a drawer that slides out by `open` (0..1).
function register(ctx, theme, x, y, open) {
  const dy = open * 34;
  pen.shape(ctx, pen.roundRect(x - 120, y + 10 + dy, 240, 56, 10), { fill: C.card, width: 5, seed: 3120, offset: 0 });
  pen.shape(ctx, pen.ellipse(x, y + 38 + dy, 14, 8, 16), { fill: theme.text, width: 0, seed: 3121, offset: 0 });
  pen.shape(ctx, [{ x: x - 110, y: y - 150 }, { x: x + 110, y: y - 150 }, { x: x + 128, y: y + 14 }, { x: x - 128, y: y + 14 }], { fill: C.card, width: 6, seed: 3122, offset: 3 });
  pen.shape(ctx, pen.roundRect(x - 80, y - 128, 160, 52, 8), { fill: C.forestDark, width: 4, seed: 3123, offset: 0 });
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++)
    pen.shape(ctx, pen.ellipse(x - 66 + c * 44, y - 50 + r * 34, 14, 10, 14), { fill: C.line, width: 3, seed: 3130 + r * 4 + c, offset: 0 });
}

// Tally marks in groups of five.
function tally(ctx, theme, x, y, n, k) {
  for (let i = 0; i < n; i++) {
    const g = Math.floor(i / 5), j = i % 5, gx = x + g * 120;
    const p = i === n - 1 ? k : 1;
    if (j < 4) pen.line(ctx, [{ x: gx + j * 22, y: y - 34 }, { x: gx + j * 22 + 3, y: y + 34 }], { width: 7, color: theme.accent, seed: 3140 + i, upto: p });
    else pen.line(ctx, [{ x: gx - 14, y: y + 22 }, { x: gx + 82, y: y - 22 }], { width: 7, color: theme.accent, seed: 3140 + i, upto: p });
  }
}

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3;

  headline(ctx, theme, props.line || '', { x: 540, y: 270, size: 112, maxW: 820, appear: S.at(sec, 0, 0.3), seed: 3101 });

  // The tally card, upper right.
  const done = Math.min(POURS, Math.max(0, Math.floor((sec - POUR) / EVERY) + 1));
  pen.shape(ctx, pen.roundRect(560, 600, 360, 200, 16), { fill: C.card, width: 5, seed: 3150, offset: 4 });
  text(ctx, props.label || '', 740, 650, { font: 'Inter', size: 30, weight: 700, spacing: 3, align: 'center', color: C.muted });
  if (done > 0) tally(ctx, theme, 640, 730, done, S.at(sec, POUR + (done - 1) * EVERY, POUR + (done - 1) * EVERY + 0.18));

  // Leo behind the counter, sipping happily between refills.
  const sip = Math.sin(sec * 5) * 0.04;
  tomato(ctx, 'Leo', 470, 1200, 560, { squash: S.breathe(sec), angle: sip });
  S.counter(ctx, TOP);

  // Each pour: the pot tilts in, pours, and the register spits a coin out to the left.
  const i = Math.min(POURS - 1, Math.max(0, Math.floor(sec / EVERY)));
  const p = S.seg(sec, i * EVERY, i * EVERY + POUR);
  const tilt = -0.25 - 0.55 * Math.sin(Math.PI * Math.min(1, p * 1.1 + 0.25));
  const px = 900, py = 1000;
  pot(ctx, px, py, tilt);
  if (p > 0 && p < 0.92) {
    const sx = px + (-250 * Math.cos(tilt) - -100 * Math.sin(tilt)), sy = py + (-250 * Math.sin(tilt) + -100 * Math.cos(tilt));
    const wob = Math.sin(sec * 20) * 6;
    const stream = [{ x: sx, y: sy }, { x: (sx + MUG.x) / 2 + wob, y: (sy + MUG.y - 150) / 2 + 30 }, { x: MUG.x + 10, y: MUG.y - 140 }];
    pen.line(ctx, stream, { width: 18, color: C.roseDark, seed: 3160 });
  }
  S.cup(ctx, MUG.x, MUG.y, 1.9);

  let open = 0;
  for (let n = 0; n < POURS; n++) {
    const a = n * EVERY + POUR;
    open = Math.max(open, Math.sin(Math.PI * S.seg(sec, a, a + 0.4)));
    S.coin(ctx, { ...theme, mark: C.lime }, REG.x, REG.y - 40, -100, 700 + (n % 2) * 120, S.seg(sec, a, a + 1.0), 3170 + n, 46, 380);
  }
  register(ctx, theme, REG.x, REG.y, open);
}

hook.cues = () => {
  const cues = [{ sec: 0, sfx: 'swish', gain: 0.35 }];
  for (let n = 0; n < POURS; n++) {
    cues.push({ sec: n * EVERY + POUR, sfx: 'ding', gain: 0.35 });
    cues.push({ sec: n * EVERY + POUR + 0.1, sfx: 'clink', gain: 0.4 });
  }
  return cues;
};
hook.cover = (p) => ({ kicker: 'CAFE MATH', headline: p.line });

module.exports = hook;
