// 23. The Trend: a hand-drawn line chart that draws itself across the weeks, with a pinned note
// where something changed.
//
// props: {
//   caption, label: 'COVERS PER WEEK',
//   labels: ['W1', 'W2', ...], values: [210, 205, ...] (4 to 12),
//   note: { at: 4, text: 'Started replying to reviews' }, last: '340' (shown at the end; default the last value)
// }

const { C, pen, motion } = require('../lib/kit.js');
const { text, wrapText, caption } = require('../lib/marks.js');
const { seg, easeOut, spring } = motion;

const L = 160, R = 900, T = 640, B = 1240, DRAW = [0.14, 0.7];

function trend(ctx, theme, t, props) {
  const values = props.values || [];
  const n = values.length;
  if (n < 2) return;
  const lo = Math.min(...values), hi = Math.max(...values), pad = (hi - lo) * 0.15 || 1;
  const X = (i) => L + (i * (R - L)) / (n - 1);
  const Y = (v) => B - ((v - (lo - pad)) / (hi + pad - (lo - pad))) * (B - T);
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  text(ctx, props.label || '', L - 30, T - 60, { font: 'Inter', size: 28, spacing: 4, color: theme.soft });
  const ax = easeOut(seg(t, 0.04, 0.16));
  pen.line(ctx, [{ x: L - 30, y: T - 20 }, { x: L - 30, y: B + 20 }, { x: R + 30, y: B + 20 }], { width: 6, seed: 2001, upto: ax });
  for (let g = 1; g <= 3; g++) {
    const y = B + 20 - (g * (B - T + 40)) / 4;
    pen.line(ctx, [{ x: L - 20, y }, { x: R + 20, y }], { width: 3, color: theme.rule, seed: 2002 + g, alpha: ax * 0.8 });
  }
  (props.labels || []).forEach((lb, i) => {
    if (n > 8 && i % 2) return;
    text(ctx, lb, X(i), B + 70, { font: 'Inter', weight: 600, size: 26, align: 'center', color: theme.soft, alpha: ax });
  });

  // The line draws itself left to right; dots pop as it passes them.
  const p = easeOut(seg(t, DRAW[0], DRAW[1]));
  const pts = values.map((v, i) => ({ x: X(i), y: Y(v) }));
  pen.line(ctx, pts, { width: 9, color: theme.accent, amp: 2, seed: 2010, upto: p });
  pts.forEach((pt, i) => {
    const k = spring(seg(p, i / (n - 1) - 0.02, i / (n - 1) + 0.1));
    if (k > 0) pen.shape(ctx, pen.ellipse(pt.x, pt.y, 13 * k, 13 * k, 16), { fill: theme.swash === C.lime ? C.card : C.paper, width: 5, seed: 2020 + i, offset: 0 });
  });

  // The note: a dashed drop line and a little card above the point.
  const note = props.note;
  if (note && note.at < n) {
    const k = spring(seg(t, 0.72, 0.84));
    if (k > 0) {
      const pt = pts[note.at];
      for (let y = pt.y + 26; y < B + 10; y += 26) pen.line(ctx, [{ x: pt.x, y }, { x: pt.x, y: Math.min(B + 10, y + 12) }], { width: 4, color: theme.soft, seed: 2030 + y });
      const lines = wrapText(note.text, 320, { size: 44, balance: true }).slice(0, 3);
      const w = 360, h = lines.length * 50 + 40;
      // Put the note in whichever half of the chart the line isn't in at that point.
      const nx = Math.min(R - w + 40, Math.max(L - 20, pt.x - w / 2));
      const ny = pt.y > (T + B) / 2 ? T : B - h - 10;
      ctx.save();
      ctx.translate(pt.x, pt.y - 30);
      ctx.scale(k, k);
      ctx.translate(-pt.x, -(pt.y - 30));
      pen.shape(ctx, pen.roundRect(nx, ny, w, h, 18), { fill: C.card, width: 5, seed: 2040, offset: 3 });
      const below = ny > pt.y;
      pen.line(ctx, [{ x: pt.x, y: below ? ny : ny + h }, { x: pt.x, y: pt.y + (below ? 22 : -22) }], { width: 5, seed: 2041 });
      lines.forEach((ln, i) => text(ctx, ln, nx + 22, ny + 56 + i * 50, { size: 44 }));
      ctx.restore();
    }
  }

  // The latest number, at the end of the line.
  const end = easeOut(seg(t, DRAW[1], DRAW[1] + 0.08));
  if (end > 0) {
    const last = pts[n - 1];
    text(ctx, props.last ?? String(values[n - 1]), last.x, last.y - 40, { size: 76, align: 'center', color: theme.accent, alpha: end });
  }
}

trend.cues = (props) => [
  { t: 0.04, sfx: 'tick', gain: 0.5 },
  { t: DRAW[0], sfx: 'sprout', gain: 0.35 },
  { t: DRAW[1], sfx: 'pop', gain: 0.6 },
  ...(props.note ? [{ t: 0.72, sfx: 'pop', gain: 0.5 }] : []),
];

module.exports = trend;
