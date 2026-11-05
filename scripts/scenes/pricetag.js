// 22. The Price Tag: a swinging tag. The old price gets crossed out and the new one is
// written in below it.
//
// props: { caption, item: 'Flat white', from: '$4.50', to: '$4.80', note: '*30¢* more, same smile' }

const { C, headline, pen, motion } = require('../lib/kit.js');
const { text, measure, caption, strike, squiggle } = require('../lib/marks.js');
const { seg, easeOut, spring, settle } = motion;

const NAIL = { x: 540, y: 470 }, TW = 640, TH = 560, DROP = 120;

function pricetag(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  // It drops in, swings, and keeps a gentle sway.
  const k = spring(seg(t, 0.04, 0.22));
  const swing = 0.12 * settle(seg(t, 0.1, 0.6)) + Math.sin(sec * 1.7) * 0.015;
  pen.fill(ctx, pen.ellipse(NAIL.x, NAIL.y, 12, 12, 16), C.ink, { seed: 1901 });
  ctx.save();
  ctx.translate(NAIL.x, NAIL.y - (1 - k) * 600);
  ctx.rotate(swing);
  // String from the nail to the hole, and the tag hanging below.
  pen.line(ctx, [{ x: 0, y: 0 }, { x: -60, y: DROP }], { width: 4, seed: 1902 });
  pen.line(ctx, [{ x: 0, y: 0 }, { x: 60, y: DROP }], { width: 4, seed: 1903 });
  const x0 = -TW / 2, y0 = DROP, x1 = TW / 2, y1 = DROP + TH;
  const tag = [{ x: -90, y: y0 }, { x: 90, y: y0 }, { x: x1, y: y0 + 130 }, { x: x1, y: y1 }, { x: x0, y: y1 }, { x: x0, y: y0 + 130 }];
  pen.shape(ctx, tag, { fill: C.card, width: 7, seed: 1904, offset: 6 });
  pen.shape(ctx, pen.ellipse(0, y0 + 60, 18, 18, 18), { fill: theme.bg, width: 5, seed: 1905, offset: 0 });

  text(ctx, props.item || '', 0, y0 + 190, { size: 76, align: 'center' });
  const from = props.from || '', to = props.to || '';
  text(ctx, from, 0, y0 + 330, { size: 130, align: 'center', color: C.ink });
  const fw = measure(from, { size: 130 });
  strike(ctx, -fw / 2 - 20, fw / 2 + 20, y0 + 285, easeOut(seg(t, 0.36, 0.48)), C.rose, 1906);

  // The new price, written in with a little tilt.
  const w = easeOut(seg(t, 0.5, 0.64));
  if (w > 0) {
    ctx.save();
    ctx.translate(30, y0 + 480);
    ctx.rotate(-0.06);
    ctx.globalAlpha = Math.min(1, w * 1.5);
    ctx.scale(0.9 + 0.1 * w, 0.9 + 0.1 * w);
    text(ctx, to, 0, 0, { size: 150, align: 'center', color: C.rose });
    const tw = measure(to, { size: 150 });
    squiggle(ctx, -tw / 2, tw / 2, 26, easeOut(seg(t, 0.62, 0.72)), C.rose, 1907, 6);
    ctx.restore();
  }
  ctx.restore();

  if (props.note) headline(ctx, theme, props.note, { y: NAIL.y + DROP + TH + 80, size: 78, maxW: 840, appear: easeOut(seg(t, 0.74, 0.9)), seed: 1910 });
}

pricetag.cues = (props) => [
  { t: 0.04, sfx: 'whoosh', gain: 0.3 },
  { t: 0.16, sfx: 'clink', gain: 0.4 },
  { t: 0.36, sfx: 'scratch' },
  { t: 0.5, sfx: 'scratch', gain: 0.6 },
  { t: 0.64, sfx: 'ding', gain: 0.5 },
];

module.exports = pricetag;
