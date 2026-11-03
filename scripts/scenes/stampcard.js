// 20. The Stamp Card: a loyalty card fills up one stamp at a time; the last box is the reward.
//
// props: {
//   caption, title: 'Coffee club', stamps: 8 (boxes before the reward, 4 to 10), filled: 8,
//   reward: '9th coffee *free*', name: 'Maria'
// }

const { C, tomato, headline, pen, motion } = require('../lib/kit.js');
const { text, caption, star } = require('../lib/marks.js');
const { seg, easeOut, spring, settle, breathe } = motion;

const X = 130, Y = 520, W = 820, H = 520, FILL = [0.2, 0.7];

function stampcard(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  const stamps = Math.max(4, Math.min(10, props.stamps ?? 8));
  const filled = Math.min(stamps, props.filled ?? stamps);
  const slots = stamps + 1, cols = Math.ceil(slots / 2);
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  const k = spring(seg(t, 0.04, 0.18));
  if (k <= 0) return;
  ctx.save();
  ctx.translate(X + W / 2, Y + H / 2);
  ctx.rotate(-0.03);
  ctx.scale(k, k);
  ctx.translate(-W / 2, -H / 2);
  pen.shape(ctx, pen.roundRect(0, 0, W, H, 34), { fill: C.card, width: 6, seed: 1701, offset: 6 });
  text(ctx, props.title || 'Loyalty card', 50, 100, { size: 80 });
  tomato(ctx, 'Roma Tom', W - 80, 70, 130);

  const gx = (W - 100) / cols, r = Math.min(54, gx / 2 - 10);
  for (let i = 0; i < slots; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    const cx = 50 + gx * (col + 0.5), cy = 220 + row * 160;
    if (i === stamps) {
      // The reward box.
      pen.line(ctx, pen.roundRect(cx - r, cy - r, r * 2, r * 2, 14), { width: 5, color: C.rose, seed: 1710, closed: true });
      star(ctx, cx, cy, r * 0.6 * (filled === stamps ? 1 + 0.25 * settle(seg(t, FILL[1], FILL[1] + 0.2)) : 1), C.tomato, 1711);
      continue;
    }
    pen.line(ctx, pen.ellipse(cx, cy, r, r, 30), { width: 4, color: C.line, seed: 1720 + i, closed: true });
    if (i >= filled) continue;
    // Each stamp thumps down: big and faint, then pressed into place.
    const p = seg(t, FILL[0] + (i / stamps) * (FILL[1] - FILL[0]), FILL[0] + ((i + 0.6) / stamps) * (FILL[1] - FILL[0]));
    if (p <= 0) continue;
    const s = 1.5 - 0.5 * easeOut(p);
    ctx.save();
    ctx.globalAlpha = Math.min(1, p * 2);
    ctx.translate(cx, cy);
    ctx.rotate(((i * 37) % 11 - 5) * 0.04);
    ctx.scale(s, s);
    pen.shape(ctx, pen.ellipse(0, 0, r - 4, r - 4, 30), { fill: C.rose, width: 4, color: C.roseDark, seed: 1730 + i, offset: 0 });
    pen.line(ctx, pen.ellipse(0, 0, r - 16, r - 16, 24), { width: 3, color: C.card, seed: 1740 + i, closed: true });
    ctx.restore();
  }
  ctx.restore();

  if (props.reward) headline(ctx, theme, props.reward, { y: Y + H + 70, size: 88, maxW: 840, appear: easeOut(seg(t, 0.72, 0.86)), seed: 1750 });
  const g = spring(seg(t, 0.12, 0.3));
  tomato(ctx, props.name || 'Maria', 540, 1430, 260, { scale: g, squash: breathe(sec) + 0.06 * settle(seg(t, FILL[1], FILL[1] + 0.25)) });
}

stampcard.cues = (props) => {
  const stamps = Math.max(4, Math.min(10, props.stamps ?? 8));
  const filled = Math.min(stamps, props.filled ?? stamps);
  const cues = [{ t: 0.04, sfx: 'pop', gain: 0.6 }];
  for (let i = 0; i < filled; i++) cues.push({ t: FILL[0] + ((i + 0.3) / stamps) * (FILL[1] - FILL[0]), sfx: 'squish', gain: 0.55 });
  if (filled === stamps) cues.push({ t: FILL[1], sfx: 'ding', gain: 0.6 });
  return cues;
};

module.exports = stampcard;
