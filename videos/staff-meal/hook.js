// This video's own hook.
//
// The idea: beautiful plates glide past along the pass toward the guests, sparkling, while
// below, Dev on his break gets a plate of burnt ends slid in front of him from the side.
// Frame one shows: a perfect plate already gliding across, sparkle and all.
// Readable by 0.5 s: "Guests get this. Staff get *that*?"
// The open loop: what does that tell your team, and what should staff eat instead?
//
// props: { label, line }

const { W, C, kicker, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const S = require('../../scripts/lib/stage.js');

const LANE = 760, V = 340, GAP = 560, SLIDE = 1.0, COUNTER = 1470;

function nicePlate(ctx, x, y, seed) {
  pen.shape(ctx, pen.ellipse(x, y, 150, 46, 32), { fill: C.card, width: 6, seed, offset: 0 });
  pen.shape(ctx, pen.ellipse(x - 20, y - 14, 60, 22, 20), { fill: C.butter, width: 4, seed: seed + 1, offset: 0 });
  pen.shape(ctx, pen.ellipse(x + 40, y - 18, 34, 18, 16), { fill: C.tomato, width: 4, seed: seed + 2, offset: 0 });
  pen.shape(ctx, pen.ellipse(x + 10, y - 34, 18, 10, 12), { fill: C.forest, width: 3, seed: seed + 3, offset: 0 });
  pen.sparkle(ctx, x + 110, y - 70, 22, { fill: C.lime, seed: seed + 4 });
}

function burntPlate(ctx, x, y, seed) {
  pen.shape(ctx, pen.ellipse(x, y, 130, 40, 28), { fill: C.card, width: 6, seed, offset: 0 });
  [[-40, -8, 26], [10, -14, 20], [45, -4, 16], [-5, 4, 14]].forEach(([dx, dy, r], i) =>
    pen.shape(ctx, pen.ellipse(x + dx, y + dy, r, r * 0.6, 12), { fill: C.ink, width: 3, seed: seed + 1 + i, offset: 0 }));
  [-30, 10].forEach((dx, i) => pen.line(ctx, [{ x: x + dx, y: y - 40 }, { x: x + dx + 8, y: y - 70 }, { x: x + dx, y: y - 100 }], { width: 4, color: C.muted, seed: seed + 8 + i }));
}

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  kicker(ctx, props.label || '', W / 2, 260, { seed: 13101 });
  headline(ctx, theme, props.line || '', { x: W / 2, y: 330, size: 112, maxW: 860, appear: S.at(sec, 0, 0.2), seed: 13102 });

  // The pass, with perfect plates gliding right toward the dining room.
  pen.shape(ctx, [{ x: -40, y: LANE + 30 }, { x: 1120, y: LANE + 24 }, { x: 1120, y: LANE + 80 }, { x: -40, y: LANE + 86 }], { fill: C.card, width: 6, seed: 13103, offset: 0 });
  for (let i = 0; i < 4; i++) {
    const x = 380 + V * sec - i * GAP;
    if (x > -260 && x < W + 260) { ctx.save(); ctx.translate(x, LANE); ctx.scale(1.4, 1.4); nicePlate(ctx, 0, 0, 13110 + i * 10); ctx.restore(); }
  }

  // Dev on his break below, and the burnt ends slid in front of him.
  const k = S.at(sec, SLIDE, SLIDE + 0.4);
  const disappointed = sec > SLIDE + 0.4;
  tomato(ctx, 'Dev', W / 2 - 150, 1270, 540, { squash: S.breathe(sec), angle: disappointed ? 0.12 : Math.sin(sec * 2) * 0.04, mouth: disappointed ? 0.7 : undefined });
  S.counter(ctx, COUNTER);
  ctx.save(); ctx.translate(-260 + (W / 2 + 460) * k, COUNTER + 10); ctx.scale(1.4, 1.4); burntPlate(ctx, 0, 0, 13150); ctx.restore();
  if (disappointed) S.reaction(ctx, theme, 'sweat', W / 2 - 170, 1200, S.seg(sec, SLIDE + 0.4, SLIDE + 1.0));
  else S.reaction(ctx, theme, 'think', W / 2 - 150, 1220, S.seg(sec, 0.1, 0.6));
}

hook.cues = () => [
  { sec: 0, sfx: 'chime', gain: 0.3 }, { sec: 1.5, sfx: 'chime', gain: 0.3 }, { sec: 3.0, sfx: 'chime', gain: 0.3 },
  { sec: SLIDE, sfx: 'swish', gain: 0.4 }, { sec: SLIDE + 0.4, sfx: 'squish', gain: 0.5 },
];
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
