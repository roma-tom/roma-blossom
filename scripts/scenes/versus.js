// 9. Versus: two options side by side, each with a tomato, a label and a number. The winner is
// circled; the other fades back.
//
// props: {
//   caption,
//   left: { name: 'Dev', label: 'Delivery app', value: '$7.20', note: 'after 30% commission' },
//   right: { ... }, winner: 'left' | 'right'
// }

const { C, tomato, pen, motion } = require('../lib/kit.js');
const { text, measure, wrapText, caption, loop } = require('../lib/marks.js');
const { seg, easeOut, spring, breathe } = motion;

const TOP = 520, BOT = 1380, CW = 385;
const CARDS = { left: 130, right: 950 - CW };

function card(ctx, side, o, k, alpha, sec, isWinner, t) {
  const x = CARDS[side], cx = x + CW / 2, cy = (TOP + BOT) / 2;
  if (k <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.scale(k, k);
  ctx.translate(-cx, -cy);
  pen.shape(ctx, pen.roundRect(x, TOP, CW, BOT - TOP, 30), { fill: C.card, width: 6, seed: side === 'left' ? 601 : 611, offset: 5 });
  tomato(ctx, o.name || (side === 'left' ? 'Dev' : 'Maria'), cx, TOP + 170, 250, { squash: breathe(sec + (side === 'left' ? 0 : 1)) });
  const label = wrapText(o.label || '', CW - 50, { size: 58, balance: true }).slice(0, 2);
  label.forEach((ln, i) => text(ctx, ln, cx, TOP + 400 + i * 62, { size: 58, align: 'center' }));
  const vy = TOP + 430 + label.length * 62 + 110;
  text(ctx, o.value || '', cx, vy, { size: 104, align: 'center', color: isWinner ? C.forestDark : C.ink, alpha: easeOut(seg(t, 0.4, 0.5)) });
  if (isWinner) loop(ctx, cx, vy - 36, Math.min(CW / 2 - 30, measure(o.value || '', { size: 104 }) / 2 + 14), 70, easeOut(seg(t, 0.66, 0.8)), C.forest, 621);
  wrapText(o.note || '', CW - 60, { size: 40, balance: true }).slice(0, 2).forEach((ln, i) =>
    text(ctx, ln, cx, vy + 80 + i * 46, { size: 40, align: 'center', color: C.muted, alpha: easeOut(seg(t, 0.48, 0.58)) }));
  ctx.restore();
}

function versus(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));
  const fade = easeOut(seg(t, 0.66, 0.8));
  for (const side of ['left', 'right']) {
    const win = props.winner === side;
    const alpha = props.winner && !win ? 1 - fade * 0.5 : 1;
    const k = spring(seg(t, side === 'left' ? 0.06 : 0.16, side === 'left' ? 0.22 : 0.32));
    card(ctx, side, props[side] || {}, k, alpha, sec, win, t);
  }
  // The "vs" badge between the cards.
  const v = spring(seg(t, 0.28, 0.38));
  if (v > 0) {
    ctx.save();
    ctx.translate(540, TOP + 250);
    ctx.scale(v, v);
    pen.shape(ctx, pen.ellipse(0, 0, 58, 58), { fill: theme.mark, width: 6, seed: 631, offset: 0 });
    text(ctx, 'vs', 0, 20, { size: 64, align: 'center' });
    ctx.restore();
  }
}

versus.cues = () => [
  { t: 0.06, sfx: 'pop', gain: 0.6 },
  { t: 0.16, sfx: 'pop', gain: 0.6 },
  { t: 0.28, sfx: 'squish', gain: 0.5 },
  { t: 0.4, sfx: 'tick', gain: 0.6 },
  { t: 0.66, sfx: 'scratch' },
  { t: 0.8, sfx: 'chime', gain: 0.5 },
];

module.exports = versus;
