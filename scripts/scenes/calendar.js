// 11. The Calendar: a month on the wall. Days get circled, crossed out, dotted or ticked.
//
// props: {
//   caption, month: 'March', start: 0 (weekday of the 1st, Monday = 0), days: 31,
//   marks: { "4": "cross", "14": "circle", "20": "dot", "28": "tick" },
//   legend: [{ mark: 'cross', label: 'slow' }, { mark: 'circle', label: 'event night' }]
// }

const { C, pen, motion } = require('../lib/kit.js');
const { text, caption, loop, cross, check } = require('../lib/marks.js');
const { seg, easeOut, spring } = motion;

const X = 130, WIDTH = 820, TOP = 480, CELL_W = (WIDTH - 40) / 7, CELL_H = 96, GRID = TOP + 190;
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function mark(ctx, kind, cx, cy, p, seed, good) {
  if (kind === 'circle') loop(ctx, cx, cy, 44, 38, p, C.rose, seed, 6);
  if (kind === 'cross') cross(ctx, cx, cy, 56, p, C.rose, seed);
  if (kind === 'tick') check(ctx, cx, cy, 60, p, good, seed);
  if (kind === 'dot') {
    const r = 20 * spring(p);
    if (r > 0) pen.fill(ctx, pen.ellipse(cx, cy, r, r, 20), good, { amp: 1, seed });
  }
}

function calendar(ctx, theme, t, props) {
  const days = props.days ?? 31, start = props.start ?? 0;
  const rows = Math.ceil((start + days) / 7);
  const h = 190 + rows * CELL_H + 30;
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  pen.shape(ctx, pen.roundRect(X, TOP, WIDTH, h, 24), { fill: C.card, width: 6, seed: 801, offset: 5 });
  // Two rings at the top, as if it hangs on the wall.
  for (const rx of [X + 200, X + WIDTH - 200]) pen.line(ctx, pen.ellipse(rx, TOP, 16, 28, 24), { width: 6, seed: 802 + rx, closed: true });

  text(ctx, props.month || 'This month', X + WIDTH / 2, TOP + 100, { size: 84, align: 'center' });
  DAYS.forEach((d, i) => text(ctx, d, X + 20 + (i + 0.5) * CELL_W, TOP + 165, { font: 'Inter', weight: 600, size: 26, align: 'center', color: C.muted }));

  const appear = easeOut(seg(t, 0.06, 0.3));
  for (let d = 1; d <= days; d++) {
    const i = start + d - 1, col = i % 7, row = Math.floor(i / 7);
    const x = X + 20 + col * CELL_W, y = GRID + row * CELL_H;
    const a = Math.min(1, Math.max(0, appear * (days + 6) - d));
    text(ctx, String(d), x + CELL_W / 2, y + 62, { size: 44, align: 'center', alpha: a, color: col >= 5 ? C.muted : C.ink });
  }

  // Marks go on in date order.
  const marked = Object.keys(props.marks || {}).map(Number).sort((a, b) => a - b);
  marked.forEach((d, m) => {
    const p = easeOut(seg(t, 0.36 + (m / marked.length) * 0.45, 0.36 + ((m + 0.8) / marked.length) * 0.45));
    if (p <= 0) return;
    const i = start + d - 1, col = i % 7, row = Math.floor(i / 7);
    mark(ctx, props.marks[d], X + 20 + (col + 0.5) * CELL_W, GRID + row * CELL_H + 46, p, 810 + d, C.forest);
  });

  // The legend under the calendar.
  (props.legend || []).forEach((l, i) => {
    const al = easeOut(seg(t, 0.8 + i * 0.04, 0.9 + i * 0.04));
    if (al <= 0) return;
    const y = TOP + h + 90 + i * 76;
    mark(ctx, l.mark, 200, y - 16, al, 880 + i, theme.good);
    text(ctx, l.label, 260, y, { size: 56, alpha: al });
  });
}

calendar.cues = (props) => {
  const marked = Object.keys(props.marks || {}).length;
  const cues = [{ t: 0.06, sfx: 'whoosh', gain: 0.25 }];
  for (let m = 0; m < marked; m++) cues.push({ t: 0.36 + (m / marked) * 0.45, sfx: 'scratch', gain: 0.5 });
  return cues;
};

module.exports = calendar;
