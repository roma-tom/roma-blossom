// This video's own hook.
//
// The idea: plates of fries slide along the pass one after another, and each scoop is a little
// bigger than the last; as every plate goes by, a coin quietly slips off its edge and drops.
// Frame one shows: a plate already sliding, a coin already falling.
// Readable by 0.5 s: "A little extra, *every plate*." over the pass.
// The open loop: how much does that little extra add up to?
//
// props: { label, line }

const { W, C, kicker, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const S = require('../../scripts/lib/stage.js');

const PASS = 1060, V = 300, GAP = 400, X0 = 600, DROP_X = 540;

function plateOfFries(ctx, x, y, size, seed) {
  pen.shape(ctx, pen.ellipse(x, y, 165, 50, 32), { fill: C.card, width: 6, seed, offset: 0 });
  pen.shape(ctx, pen.ellipse(x, y - 4, 118, 33, 28), { fill: C.card, width: 3, seed: seed + 1, offset: 0 });
  // The fries: a pile of sticks that grows with size (0..1).
  const n = 4 + Math.round(size * 22), r = pen.rng(seed + 2);
  for (let i = 0; i < n; i++) {
    const a = -0.9 + r() * 1.8, len = 60 + r() * 30, cx = x + (r() - 0.5) * (50 + size * 170), cy = y - 6 - r() * (10 + size * 90);
    pen.line(ctx, [{ x: cx - Math.sin(a) * len / 2, y: cy + Math.cos(a) * len / 4 }, { x: cx + Math.sin(a) * len / 2, y: cy - Math.cos(a) * len / 4 }], { width: 20, color: C.ink, seed: seed + 10 + i });
    pen.line(ctx, [{ x: cx - Math.sin(a) * len / 2, y: cy + Math.cos(a) * len / 4 }, { x: cx + Math.sin(a) * len / 2, y: cy - Math.cos(a) * len / 4 }], { width: 12, color: C.butter, seed: seed + 60 + i, amp: 0.5 });
  }
}

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  kicker(ctx, props.label || '', W / 2, 260, { seed: 7101 });
  headline(ctx, theme, props.line || '', { x: W / 2, y: 330, size: 112, maxW: 860, appear: S.at(sec, 0, 0.2), seed: 7102 });

  // The heat lamp and the pass shelf.
  pen.shape(ctx, pen.roundRect(-40, 650, 1160, 34, 14), { fill: C.ink, width: 5, seed: 7103, offset: 0 });
  [180, 540, 900].forEach((x, i) => pen.shape(ctx, [{ x: x - 70, y: 684 }, { x: x + 70, y: 684 }, { x: x + 40, y: 724 }, { x: x - 40, y: 724 }], { fill: C.butter, width: 4, seed: 7104 + i, offset: 0 }));
  pen.shape(ctx, [{ x: -40, y: PASS + 20 }, { x: 1120, y: PASS + 14 }, { x: 1120, y: PASS + 70 }, { x: -40, y: PASS + 76 }], { fill: C.card, width: 6, seed: 7110, offset: 0 });

  // Dev below the pass, plating happily.
  tomato(ctx, 'Dev', W / 2, 1380, 520, { squash: S.breathe(sec), angle: Math.sin(sec * 2.4) * 0.05 });

  // The plates slide left to right; each scoop is bigger than the one before it.
  for (let i = 0; i < 9; i++) {
    const x = X0 + V * sec - i * GAP;
    if (x < -220 || x > W + 220) continue;
    plateOfFries(ctx, x, PASS, Math.min(1, i * 0.25), 7120 + i * 37);
    // As it passes the middle, a coin slips off its edge and falls.
    const t0 = (DROP_X - X0 + i * GAP) / V;
    if (t0 > -0.5) S.coin(ctx, theme, DROP_X + 150, PASS + 10, DROP_X + 230, 1560, S.seg(sec, t0, t0 + 0.8), 7300 + i, 40, 70);
  }
}

hook.cues = () => {
  const cues = [{ sec: 0, sfx: 'swish', gain: 0.3 }];
  for (let i = 1; i < 9; i++) { const s = (DROP_X - X0 + i * GAP) / V; if (s >= 0 && s < 8) cues.push({ sec: s + 0.15, sfx: 'clink', gain: 0.4 }); }
  return cues;
};
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
