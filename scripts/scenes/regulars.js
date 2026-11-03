// 5. The Regulars: a crowd of named tomatoes. The ones who come back fill a stamp card;
// the rest fade away. Then the number.
//
// props: {
//   caption,
//   guests: [{ name: 'Maria', back: true }, ...] (up to 9),
//   stat: { value: '1 in 3', label: 'come back' }
// }

const { C, tomato, headline, pen, motion } = require('../lib/kit.js');
const { caption } = require('../lib/marks.js');
const { seg, easeOut, spring, breathe } = motion;

const COLS = 3, DX = 290, DY = 280, SIZE = 230, STAMPS = 5;

function stampCard(ctx, x, y, filled, seed) {
  const w = 190, h = 54;
  pen.shape(ctx, pen.roundRect(x - w / 2, y - h / 2, w, h, 12), { fill: C.card, width: 4, seed, offset: 2 });
  for (let i = 0; i < STAMPS; i++) {
    const cx = x - w / 2 + 25 + i * 35, f = Math.min(1, Math.max(0, filled - i));
    pen.line(ctx, pen.ellipse(cx, y, 11, 11, 20), { width: 3, color: C.muted, amp: 0.5, seed: seed + i, closed: true });
    if (f > 0) pen.fill(ctx, pen.ellipse(cx, y, 12 * spring(f), 12 * spring(f), 20), C.rose, { amp: 1, seed: seed + 10 + i });
  }
}

function regulars(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  const guests = (props.guests || []).slice(0, 9);
  const rows = Math.ceil(guests.length / COLS);
  const y0 = 600 + ((3 - rows) * DY) / 2;

  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  const split = easeOut(seg(t, 0.42, 0.62));
  guests.forEach((g, i) => {
    const row = Math.floor(i / COLS), inRow = Math.min(COLS, guests.length - row * COLS);
    const x = 540 + ((i % COLS) - (inRow - 1) / 2) * DX, y = y0 + row * DY;
    const k = spring(seg(t, 0.08 + i * 0.03, 0.22 + i * 0.03));
    if (g.back) {
      tomato(ctx, g.name, x, y, SIZE, { scale: k, squash: breathe(sec + i) });
      if (split > 0) {
        ctx.save();
        ctx.globalAlpha = split;
        stampCard(ctx, x, y + 120, seg(t, 0.5, 0.8) * STAMPS, 200 + i * 20);
        ctx.restore();
      }
    } else {
      tomato(ctx, g.name, x, y + split * 40, SIZE, { scale: k, alpha: 1 - split * 0.8, angle: split * 0.25 });
    }
  });

  if (props.stat) {
    headline(ctx, theme, `*${props.stat.value}* ${props.stat.label}`, {
      y: y0 + rows * DY - 20, size: 104, maxW: 860, appear: easeOut(seg(t, 0.72, 0.88)), seed: 211,
    });
  }
}

regulars.cues = (props) => {
  const cues = [];
  (props.guests || []).slice(0, 9).forEach((_, i) => cues.push({ t: 0.08 + i * 0.03, sfx: 'pop', gain: 0.35 }));
  cues.push({ t: 0.42, sfx: 'whoosh', gain: 0.35 });
  for (let i = 0; i < STAMPS; i++) cues.push({ t: 0.5 + (i / STAMPS) * 0.3, sfx: 'tap', gain: 0.6 });
  cues.push({ t: 0.74, sfx: 'chime', gain: 0.5 });
  return cues;
};

module.exports = regulars;
