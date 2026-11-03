// 10. The Plate: where each dollar goes, as slices of a dinner plate. One slice pops out.
//
// props: {
//   caption,
//   slices: [{ label: 'Food', value: 30 }, { label: 'Staff', value: 32 }, ...] (up to 6),
//   highlight: 4 (index of the slice that pops out, in rose)
// }

const { C, pen, motion } = require('../lib/kit.js');
const { text, caption } = require('../lib/marks.js');
const { seg, easeOut, spring } = motion;

const CX = 540, CY = 830, RIM = 300, R = 245;
const FILLS = [C.line, C.lime, C.card, C.paper, C.line, C.lime];

function wedge(cx, cy, r, a0, a1) {
  const pts = [{ x: cx, y: cy }];
  const n = Math.max(2, Math.ceil(((a1 - a0) / (Math.PI * 2)) * 60));
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
}

function plate(ctx, theme, t, props) {
  const slices = (props.slices || []).slice(0, 6);
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  // The plate and its rim.
  const k = spring(seg(t, 0.04, 0.2));
  if (k <= 0) return;
  ctx.save();
  ctx.translate(CX, CY);
  ctx.scale(k, k);
  ctx.translate(-CX, -CY);
  pen.shape(ctx, pen.ellipse(CX, CY, RIM, RIM, 72), { fill: C.card, width: 6, seed: 701, offset: 5 });
  pen.line(ctx, pen.ellipse(CX, CY, R + 18, R + 18, 72), { width: 3, color: C.line, seed: 702, closed: true });
  ctx.restore();

  // Slices sweep round one after another.
  const sweep = easeOut(seg(t, 0.18, 0.55)) * Math.PI * 2;
  const pop = spring(seg(t, 0.6, 0.72));
  let a = -Math.PI / 2;
  slices.forEach((s, i) => {
    const span = (s.value / total) * Math.PI * 2;
    const a0 = a, a1 = Math.min(a + span, -Math.PI / 2 + sweep);
    a += span;
    if (a1 <= a0) return;
    const hi = i === props.highlight;
    const mid = (a0 + a0 + span) / 2, out = hi ? pop * 28 : 0;
    const cx = CX + Math.cos(mid) * out, cy = CY + Math.sin(mid) * out;
    pen.shape(ctx, wedge(cx, cy, R, a0, a1), { fill: hi && pop > 0 ? C.rose : FILLS[i], width: 5, seed: 710 + i, offset: 0, amp: 1.2 });
    const pct = Math.round((s.value / total) * 100);
    if (a1 >= a0 + span - 0.01 && pct >= 7) {
      text(ctx, `${pct}%`, cx + Math.cos(mid) * R * 0.62, cy + Math.sin(mid) * R * 0.62 + 16, {
        size: 48, align: 'center', color: hi && pop > 0 ? C.card : C.ink,
      });
    }
  });

  // The legend, in two columns under the plate.
  slices.forEach((s, i) => {
    const al = easeOut(seg(t, 0.5 + i * 0.03, 0.6 + i * 0.03));
    if (al <= 0) return;
    const col = i % 2, row = Math.floor(i / 2);
    const x = 170 + col * 400, y = 1220 + row * 78;
    const hi = i === props.highlight;
    ctx.save();
    ctx.globalAlpha = al;
    pen.shape(ctx, pen.roundRect(x, y - 36, 40, 40, 8), { fill: hi ? C.rose : FILLS[i], width: 4, seed: 720 + i, offset: 0 });
    ctx.restore();
    text(ctx, s.label, x + 60, y, { size: 54, alpha: al, color: hi ? theme.accent : theme.text });
  });
}

plate.cues = (props) => {
  const cues = [{ t: 0.04, sfx: 'pop', gain: 0.6 }, { t: 0.18, sfx: 'whoosh', gain: 0.3 }];
  if (props.highlight != null) cues.push({ t: 0.6, sfx: 'squish', gain: 0.7 }, { t: 0.62, sfx: 'ding', gain: 0.4 });
  return cues;
};

module.exports = plate;
