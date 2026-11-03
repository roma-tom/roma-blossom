// 19. The Scale: two things on a balance. The heavier side sinks and the beam wobbles to rest.
//
// props: {
//   caption,
//   left: { label: 'A cheaper price', weight: 1 }, right: { label: 'A friendly hello', weight: 3 },
//   verdict: 'Guests weigh the *visit*, not the price'
// }

const { C, headline, pen, motion } = require('../lib/kit.js');
const { text, wrapText, caption } = require('../lib/marks.js');
const { seg, easeOut, spring, settle } = motion;

const PIVOT = { x: 540, y: 760 }, HALF = 330, STRING = 300, BASE = 1380;

function pan(ctx, cx, top, item, seed, appear, block) {
  // Strings from the beam end to the pan.
  pen.line(ctx, [{ x: cx, y: top }, { x: cx - 110, y: top + STRING }], { width: 4, seed });
  pen.line(ctx, [{ x: cx, y: top }, { x: cx + 110, y: top + STRING }], { width: 4, seed: seed + 1 });
  const bowl = [];
  for (let i = 0; i <= 20; i++) {
    const a = Math.PI * (i / 20);
    bowl.push({ x: cx - 140 * Math.cos(a), y: top + STRING + 50 * Math.sin(a) });
  }
  pen.shape(ctx, bowl, { fill: C.card, width: 6, seed: seed + 2, offset: 0 });
  // The thing being weighed: a label block sitting in the pan.
  if (appear <= 0) return;
  const lines = wrapText(item.label || '', 210, { size: 48, balance: true }).slice(0, 3);
  const h = lines.length * 54 + 40, bw = 250;
  ctx.save();
  ctx.translate(cx, top + STRING);
  ctx.scale(appear, appear);
  pen.shape(ctx, pen.roundRect(-bw / 2, -h, bw, h, 16), { fill: block, width: 5, seed: seed + 3, offset: 3 });
  lines.forEach((ln, i) => text(ctx, ln, 0, -h + 58 + i * 54, { size: 48, align: 'center' }));
  ctx.restore();
}

function scale(ctx, theme, t, props) {
  const l = props.left || {}, r = props.right || {};
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  // The stand.
  pen.shape(ctx, [{ x: 540 - 150, y: BASE }, { x: 540 + 150, y: BASE }, { x: 540 + 40, y: BASE - 60 }, { x: 540 - 40, y: BASE - 60 }], { fill: C.ink, width: 6, seed: 1601, offset: 0 });
  pen.line(ctx, [{ x: 540, y: BASE - 60 }, { x: 540, y: PIVOT.y }], { width: 14, seed: 1602 });

  // Tip towards the heavier side once both are on, then wobble to rest.
  const lw = l.weight ?? 1, rw = r.weight ?? 1;
  const target = Math.max(-0.32, Math.min(0.32, ((rw - lw) / (lw + rw)) * 0.5));
  const tip = seg(t, 0.4, 0.75);
  const angle = target * spring(tip) + 0.05 * settle(seg(t, 0.2, 0.4));
  const ends = [-1, 1].map((s) => ({ x: PIVOT.x + s * HALF * Math.cos(angle), y: PIVOT.y + s * HALF * Math.sin(angle) }));
  pen.line(ctx, ends, { width: 14, seed: 1603 });
  pen.shape(ctx, pen.ellipse(PIVOT.x, PIVOT.y, 22, 22, 20), { fill: C.ink, width: 4, seed: 1604, offset: 0 });

  // Lime blocks on paper; card blocks on lime, where lime would vanish.
  const block = theme.bg === C.lime ? C.card : C.lime;
  pan(ctx, ends[0].x, ends[0].y, l, 1610, spring(seg(t, 0.08, 0.24)), block);
  pan(ctx, ends[1].x, ends[1].y, r, 1620, spring(seg(t, 0.2, 0.36)), block);

  if (props.verdict) {
    headline(ctx, theme, props.verdict, { y: BASE + 20, size: 64, maxW: 840, appear: easeOut(seg(t, 0.76, 0.92)), seed: 1630 });
  }
}

scale.cues = (props) => [
  { t: 0.08, sfx: 'squish', gain: 0.6 },
  { t: 0.2, sfx: 'squish', gain: 0.6 },
  { t: 0.42, sfx: 'whoosh', gain: 0.25 },
  { t: 0.56, sfx: 'clink', gain: 0.5 },
  ...(props.verdict ? [{ t: 0.76, sfx: 'chime', gain: 0.4 }] : []),
];

module.exports = scale;
