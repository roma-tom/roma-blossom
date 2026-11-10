// This video's own hook.
//
// The idea: in the middle of the rush a tower of dirty plates grows taller and wobblier beside
// the sink, then Rosa the dishwasher's hands blur in a cloud of bubbles and the tower drains
// away into one neat, clean stack.
// Frame one shows: the dirty tower already climbing, a plate landing on top with a clatter.
// Readable by 0.5 s: "Who *really* runs the rush?" over the kitchen.
// The open loop: who is it? (The dish pit.)
//
// props: { label, line }

const { W, C, kicker, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const S = require('../../scripts/lib/stage.js');

const COUNTER = 1400, PLATE_H = 30;
const DIRTY_X = 220, CLEAN_X = 830, ROSA_X = 545;
const GROW = [0, 2.6], WASH = [2.9, 4.4];

function plate(ctx, x, y, w, dirty, seed) {
  pen.shape(ctx, pen.ellipse(x, y, w / 2, 17, 28), { fill: C.card, width: 5, seed, offset: 0 });
  if (dirty) pen.fill(ctx, pen.ellipse(x - w * 0.12 + (seed % 3) * 14, y - 2, w * 0.14, 6, 14), C.muted, { seed: seed + 1 });
}

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  kicker(ctx, props.label || '', W / 2, 260, { seed: 6101 });
  headline(ctx, theme, props.line || '', { x: W / 2, y: 330, size: 112, maxW: 860, appear: S.at(sec, 0, 0.2), seed: 6102 });

  const grown = 4 + Math.floor(22 * S.at(sec, GROW[0], GROW[1], (x) => x));
  const washed = S.at(sec, WASH[0], WASH[1], (x) => x);
  const dirty = Math.max(0, Math.round(grown * (1 - washed)));
  const clean = Math.round(9 * washed);

  // The dirty tower, swaying more the taller it gets.
  const sway = Math.sin(sec * 6) * 0.003 * dirty;
  ctx.save(); ctx.translate(DIRTY_X, COUNTER); ctx.rotate(sway);
  for (let i = 0; i < dirty; i++) plate(ctx, (i % 2 ? 6 : -6), -20 - i * PLATE_H, 270, true, 6110 + i * 3);
  ctx.restore();

  // Rosa at the sink.
  const scrubbing = sec > WASH[0] && sec < WASH[1];
  const bob = scrubbing ? Math.sin(sec * 30) * 10 : 0;
  tomato(ctx, 'Rosa', ROSA_X + bob, 1150, 760, { squash: S.breathe(sec), angle: scrubbing ? Math.sin(sec * 26) * 0.05 : -0.06 });
  if (!scrubbing && sec < WASH[0]) S.reaction(ctx, theme, 'sweat', ROSA_X - 40, 1060, S.seg(sec, 0.6, 1.3));
  if (sec >= WASH[1]) S.reaction(ctx, theme, 'joy', ROSA_X, 1100, S.seg(sec, WASH[1], WASH[1] + 0.6));

  // The counter and the sink, with bubbles boiling up while she scrubs.
  S.counter(ctx, COUNTER);
  pen.shape(ctx, pen.roundRect(ROSA_X - 190, COUNTER - 30, 380, 70, 16), { fill: C.sky, width: 6, seed: 6190, offset: 0 });
  if (scrubbing) {
    for (let i = 0; i < 9; i++) {
      const ph = (sec * 1.8 + i * 0.37) % 1;
      const bx = ROSA_X - 160 + ((i * 97) % 320), by = COUNTER - 30 - ph * 220;
      pen.shape(ctx, pen.ellipse(bx, by, 14 + (i % 3) * 8, 14 + (i % 3) * 8, 16), { fill: C.card, width: 4, seed: 6200 + i, offset: 0, alpha: 1 - ph });
    }
    [-1, 1].forEach((d, i) => pen.line(ctx, [{ x: ROSA_X + d * 330, y: 960 }, { x: ROSA_X + d * 360, y: 1050 }, { x: ROSA_X + d * 330, y: 1140 }], { width: 8, color: theme.text, seed: 6210 + i }));
  }

  // The clean stack: neat, straight, growing.
  for (let i = 0; i < clean; i++) plate(ctx, CLEAN_X, COUNTER - 20 - i * PLATE_H, 230, false, 6230 + i * 3);
}

hook.cues = () => [
  ...[0, 0.4, 0.8, 1.15, 1.5, 1.8, 2.1, 2.4].map((sec) => ({ sec, sfx: 'clink', gain: 0.3 })),
  { sec: 2.9, sfx: 'swish', gain: 0.4 }, { sec: 3.4, sfx: 'swish', gain: 0.4 }, { sec: 3.9, sfx: 'swish', gain: 0.4 },
  { sec: 4.4, sfx: 'chime', gain: 0.45 },
];
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
