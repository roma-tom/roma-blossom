// This video's own hook.
//
// The idea: during the rush a tower of dirty plates grows and sways up the middle of the frame;
// a swish and a splash of suds, and it drops to one small, clean, sparkling stack while Dev
// rises beside it, relieved.
// Frame one shows: the first dirty plates already stacking, the tower swaying.
// Readable by 0.5 s: "Plates are back. *All* clean." and the kicker SHOUT-OUT.
// The open loop: who just made that happen?
//
// props: { label, line }

const { W, C, kicker, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const S = require('../../scripts/lib/stage.js');

const MID = W / 2, BASE = 1450, STEP = 46, N = 18, FLIP = 1.9;

function plate(ctx, x, y, dirty, k, seed) {
  pen.shape(ctx, pen.ellipse(x, y, 230, 40), { fill: C.card, width: 6, seed, offset: 0 });
  pen.shape(ctx, pen.ellipse(x, y - 3, 150, 20), { fill: C.card, width: 4, seed: seed + 1, offset: 0 });
  if (dirty) {
    pen.shape(ctx, pen.ellipse(x - 70 + (seed % 5) * 20, y - 2, 46, 11), { fill: C.muted, width: 3, seed: seed + 2, offset: 0 });
    pen.shape(ctx, pen.ellipse(x + 90 - (seed % 3) * 25, y + 6, 30, 8), { fill: C.rose, width: 3, seed: seed + 3, offset: 0, alpha: 0.8 });
  }
}

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3.5;
  kicker(ctx, props.label || '', MID, 260, { seed: 5101 });
  headline(ctx, theme, props.line || '', { x: MID, y: 340, size: 118, maxW: 860, appear: S.at(sec, 0, 0.2), seed: 5102 });

  S.counter(ctx, BASE + 40);

  const dirtyP = 1 - S.at(sec, FLIP, FLIP + 0.25);
  if (dirtyP > 0.01) {
    // The tower: swaying more as it grows, then dropping out.
    const grown = Math.min(N, Math.floor(sec / 0.09) + 3);
    ctx.save();
    ctx.translate(0, (1 - dirtyP) * 500);
    ctx.globalAlpha = dirtyP;
    for (let i = 0; i < grown; i++) {
      const sway = Math.sin(sec * 9 + i * 0.35) * (i * 1.6);
      plate(ctx, MID + sway, BASE - i * STEP, true, 1, 5110 + i * 4);
    }
    ctx.restore();
  }

  // After the swish: one small clean stack, sparkling.
  const clean = S.pop(sec, FLIP + 0.1, 0.35);
  S.popIn(ctx, clean, MID, BASE, () => {
    for (let i = 0; i < 5; i++) plate(ctx, MID, BASE - i * STEP, false, 1, 5200 + i * 4);
  });
  if (sec > FLIP + 0.1) {
    [[-190, -330, 36], [200, -300, 30], [110, -420, 24]].forEach(([dx, dy, s], i) =>
      pen.sparkle(ctx, MID + dx, BASE + dy, s * S.pop(sec, FLIP + 0.3 + i * 0.1, 0.3), { fill: C.lime, seed: 5220 + i }));
  }
  // The swish across the stack.
  const sw = S.seg(sec, FLIP - 0.1, FLIP + 0.3);
  if (sw > 0 && sw < 1) pen.line(ctx, [{ x: -50 + sw * 1200, y: 900 }, { x: 100 + sw * 1200, y: 1100 }], { width: 14, color: C.sky, seed: 5230 });
  S.flash(ctx, 1 - S.seg(sec, FLIP, FLIP + 0.3));

  // Dev rises beside it, relieved.
  S.rise(ctx, 'Dev', sec, { x: 830, y: 1650, size: 560, a: FLIP + 0.1 });
  if (sec > FLIP + 0.6) S.reaction(ctx, theme, 'joy', 830, 1330, S.seg(sec, FLIP + 0.6, FLIP + 1.3));
}

hook.cues = () => [
  ...Array.from({ length: 12 }, (_, i) => ({ sec: i * 0.15, sfx: 'clink', gain: 0.25 })),
  { sec: FLIP - 0.1, sfx: 'swish', gain: 0.6 },
  { sec: FLIP + 0.15, sfx: 'chime', gain: 0.45 },
];
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
