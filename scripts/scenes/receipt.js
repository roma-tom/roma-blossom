// 2. The Receipt: a till receipt prints line by line, and what's left at the bottom gets circled.
//
// props: {
//   caption, title: 'LATTE · $5.00', currency: '$', host: 'Roma Tom',
//   items: [{ label: 'Price', amount: 5 }, { label: 'Milk', amount: -0.4 }, ...],
//   totalLabel: 'You keep', total (defaults to the sum of the items)
// }

const { C, tomato, pen, motion } = require('../lib/kit.js');
const { text, caption, money, loop, dashed } = require('../lib/marks.js');
const { seg, easeOut, spring, breathe } = motion;

const X = 230, WIDTH = 620, TOP = 470, HEAD = 140, ROW = 76, PRINT = [0.12, 0.6];

function receipt(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  const cur = props.currency ?? '$';
  const items = props.items || [];
  const n = items.length;
  const total = props.total ?? items.reduce((s, it) => s + it.amount, 0);

  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  // The paper grows as it prints, with a torn zigzag bottom.
  const rows = seg(t, PRINT[0], PRINT[1]) * n;
  const tot = easeOut(seg(t, PRINT[1], PRINT[1] + 0.08));
  const h = HEAD + rows * ROW + 30 + tot * 160;
  const pts = [{ x: X, y: TOP }, { x: X + WIDTH, y: TOP }, { x: X + WIDTH, y: TOP + h }];
  for (let i = 0, teeth = 16; i <= teeth; i++) {
    pts.push({ x: X + WIDTH - (WIDTH * i) / teeth, y: TOP + h + (i % 2 ? 16 : 0) });
  }
  pen.shape(ctx, pts, { fill: C.card, width: 6, seed: 51, offset: 4 });

  text(ctx, props.title || 'RECEIPT', X + WIDTH / 2, TOP + 74, { font: 'Inter', size: 30, spacing: 4, align: 'center' });
  dashed(ctx, X + 36, X + WIDTH - 36, TOP + 112, C.muted, 61);

  items.forEach((it, i) => {
    const a = Math.min(1, rows - i);
    if (a <= 0) return;
    const y = TOP + HEAD + i * ROW + 50;
    text(ctx, it.label, X + 40, y, { size: 50, alpha: a });
    text(ctx, money(it.amount, cur), X + WIDTH - 40, y, { size: 50, alpha: a, align: 'right', color: it.amount < 0 ? C.rose : C.ink });
  });

  if (tot > 0) {
    const y = TOP + HEAD + n * ROW + 30;
    dashed(ctx, X + 36, X + WIDTH - 36, y, C.muted, 71);
    text(ctx, props.totalLabel || 'You keep', X + 40, y + 100, { size: 58, alpha: tot });
    const amount = money(total, cur);
    text(ctx, amount, X + WIDTH - 40, y + 112, { size: 104, alpha: tot, align: 'right', color: C.rose });
    loop(ctx, X + WIDTH - 150, y + 80, 150, 70, easeOut(seg(t, 0.7, 0.84)), C.rose, 81);
  }

  // The host peeks in from the right, under the receipt.
  const k = spring(seg(t, 0.05, 0.25));
  tomato(ctx, props.host || 'Roma Tom', 920 + (1 - k) * 400, 1560, 360, { angle: -0.18, squash: breathe(sec) });
}

receipt.cues = (props) => {
  const n = (props.items || []).length;
  const cues = [{ t: 0.05, sfx: 'sprout', gain: 0.4 }];
  for (let i = 0; i < n; i++) cues.push({ t: PRINT[0] + (i / n) * (PRINT[1] - PRINT[0]), sfx: 'tick', gain: 0.7 });
  cues.push({ t: PRINT[1], sfx: 'pop' }, { t: 0.7, sfx: 'scratch' }, { t: 0.84, sfx: 'ding', gain: 0.5 });
  return cues;
};

module.exports = receipt;
