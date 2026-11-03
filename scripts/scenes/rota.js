// 24. The Rota: a week's shifts, staff by day. Shifts fill in day by day, the headcount runs along
// the bottom, and the thin day gets circled.
//
// props: {
//   caption, days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
//   staff: [{ name: 'Dev', shifts: [1, 1, 0, 1, 1, 1, 0] }, ...] (up to 5),
//   highlight: 5 (index of the day to circle)
// }

const { C, tomato, pen, motion } = require('../lib/kit.js');
const { text, caption, loop } = require('../lib/marks.js');
const { seg, easeOut, spring } = motion;

const X = 130, W = 820, TOP = 500, NAME_W = 230, ROW = 120, HEAD = 90, FILL = [0.14, 0.62];

function rota(ctx, theme, t, props) {
  const days = props.days || ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const staff = (props.staff || []).slice(0, 5);
  const cw = (W - NAME_W - 30) / days.length;
  const h = HEAD + staff.length * ROW + 110;
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  pen.shape(ctx, pen.roundRect(X, TOP, W, h, 24), { fill: C.card, width: 6, seed: 2101, offset: 5 });
  const col = (d) => X + NAME_W + d * cw;
  days.forEach((d, i) => text(ctx, d, col(i) + cw / 2, TOP + 62, { font: 'Inter', size: 28, align: 'center', color: C.muted }));
  pen.line(ctx, [{ x: X + 24, y: TOP + HEAD }, { x: X + W - 24, y: TOP + HEAD }], { width: 3, color: C.line, seed: 2102 });

  staff.forEach((s, r) => {
    const y = TOP + HEAD + r * ROW + ROW / 2;
    tomato(ctx, s.name, X + 60, y + 4, 100);
    text(ctx, s.name, X + 110, y + 16, { size: 50 });
    (s.shifts || []).forEach((on, d) => {
      if (!on) return;
      // Day by day, each row a beat behind the one above.
      const k = spring(seg(t, FILL[0] + (d / days.length) * (FILL[1] - FILL[0]) + r * 0.012, FILL[0] + ((d + 1) / days.length) * (FILL[1] - FILL[0]) + r * 0.012));
      if (k <= 0) return;
      const bw = (cw - 14) * k, bh = 64 * k;
      pen.shape(ctx, pen.roundRect(col(d) + cw / 2 - bw / 2, y - bh / 2, bw, bh, 14), { fill: C.lime, width: 4, seed: 2110 + r * 10 + d, offset: 2 });
    });
  });

  // Headcount per day along the bottom.
  const cy = TOP + HEAD + staff.length * ROW + 64;
  pen.line(ctx, [{ x: X + 24, y: cy - 50 }, { x: X + W - 24, y: cy - 50 }], { width: 3, color: C.line, seed: 2103 });
  const ca = easeOut(seg(t, FILL[1], FILL[1] + 0.08));
  text(ctx, 'On', X + 40, cy + 14, { size: 46, color: C.muted, alpha: ca });
  days.forEach((_, d) => {
    const n = staff.reduce((s, p) => s + (p.shifts?.[d] ? 1 : 0), 0);
    const hi = d === props.highlight;
    text(ctx, String(n), col(d) + cw / 2, cy + 16, { size: 56, align: 'center', alpha: ca, color: hi ? C.rose : C.ink });
    if (hi) loop(ctx, col(d) + cw / 2, cy - 2, cw / 2 - 4, 44, easeOut(seg(t, 0.74, 0.86)), C.rose, 2120);
  });
}

rota.cues = (props) => {
  const n = (props.days || ['M', 'T', 'W', 'T', 'F', 'S', 'S']).length;
  const cues = [];
  for (let d = 0; d < n; d++) cues.push({ t: FILL[0] + (d / n) * (FILL[1] - FILL[0]), sfx: 'tap', gain: 0.5 });
  if (props.highlight != null) cues.push({ t: 0.74, sfx: 'scratch' });
  return cues;
};

module.exports = rota;
