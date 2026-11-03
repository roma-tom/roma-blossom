// 18. The Countdown: a numbered list that counts down to number 1, which gets the rose badge.
//
// props: { caption, items: ['…', '…', '…'] (3 to 5, in order from the last place to number 1) }

const { C, pen, motion } = require('../lib/kit.js');
const { text, wrapText, caption, star } = require('../lib/marks.js');
const { seg, easeOut, spring } = motion;

const TOP = 560, BOT = 1420, NX = 210, TX = 320, SIZE = 64;

function countdown(ctx, theme, t, props) {
  const items = (props.items || []).slice(0, 5);
  const n = items.length;
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));
  const step = n > 1 ? (BOT - TOP) / (n - 1) : 0;
  const d = 0.7 / Math.max(1, n);

  items.forEach((it, i) => {
    const num = n - i, first = num === 1;
    const k = spring(seg(t, 0.1 + i * d, 0.1 + i * d + 0.12));
    if (k <= 0) return;
    const y = TOP + i * step;
    ctx.save();
    ctx.translate(NX, y);
    ctx.scale(k, k);
    pen.shape(ctx, pen.ellipse(0, 0, 70, 70, 36), { fill: first ? C.rose : theme.swash, width: 6, seed: 1501 + i, offset: 0 });
    text(ctx, String(num), 0, 38, { size: 110, align: 'center', color: first ? C.card : C.ink });
    ctx.restore();
    if (first) star(ctx, NX + 62, y - 62, 24 * k, C.tomato, 1510);
    const lines = wrapText(it, 610, { size: SIZE, balance: true }).slice(0, 2);
    const y0 = y + 22 - ((lines.length - 1) * 68) / 2;
    lines.forEach((ln, j) => text(ctx, ln, TX + (1 - Math.min(1, k)) * 60, y0 + j * 68, { size: SIZE, alpha: Math.min(1, k), color: first ? theme.accent : theme.text }));
  });
}

countdown.cues = (props) => {
  const n = Math.min(5, (props.items || []).length), d = 0.7 / Math.max(1, n);
  return Array.from({ length: n }, (_, i) => ({ t: 0.1 + i * d, sfx: i === n - 1 ? 'ding' : 'pop', gain: i === n - 1 ? 0.6 : 0.5 }));
};

module.exports = countdown;
