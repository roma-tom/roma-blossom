// 12. The Gauge: a dial with good, okay and bad zones. The needle swings to the value.
//
// props: {
//   caption, value: 34, min: 0, max: 50, unit: '%', label: 'food cost',
//   zones: [{ to: 30, kind: 'good' }, { to: 35, kind: 'ok' }, { to: 50, kind: 'bad' }],
//   verdict: 'A LITTLE HIGH'
// }

const { C, kicker, pen, motion } = require('../lib/kit.js');
const { text, caption } = require('../lib/marks.js');
const { seg, easeOut, spring } = motion;

const CX = 540, CY = 1080, R = 330, BAND = 58;

function arc(r, a0, a1) {
  const pts = [], n = Math.max(2, Math.ceil((a1 - a0) * 30));
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push({ x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) });
  }
  return pts;
}

function gauge(ctx, theme, t, props) {
  const min = props.min ?? 0, max = props.max ?? 100, value = props.value ?? 50;
  const zones = props.zones || [{ to: max, kind: 'ok' }];
  const angle = (v) => Math.PI + ((v - min) / (max - min)) * Math.PI;
  const zoneFill = { good: C.forest, ok: theme.mark, bad: C.rose };
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  // Zone bands, drawn on one after another.
  const draw = easeOut(seg(t, 0.06, 0.32));
  let from = min;
  zones.forEach((z, i) => {
    const a0 = angle(from), a1 = Math.min(angle(z.to), Math.PI + draw * Math.PI);
    from = z.to;
    if (a1 <= a0) return;
    pen.line(ctx, arc(R - BAND / 2, a0, a1), { width: BAND, color: zoneFill[z.kind] || C.line, amp: 1.5, seed: 901 + i });
  });
  if (draw > 0) {
    pen.line(ctx, arc(R, Math.PI, Math.PI + draw * Math.PI), { width: 6, seed: 911 });
    pen.line(ctx, arc(R - BAND, Math.PI, Math.PI + draw * Math.PI), { width: 6, seed: 912 });
  }

  // Ticks and numbers at the ends and the zone edges.
  const tl = easeOut(seg(t, 0.25, 0.35));
  [min, ...zones.map((z) => z.to)].forEach((v, i) => {
    const a = angle(v);
    pen.line(ctx, [{ x: CX + (R + 6) * Math.cos(a), y: CY + (R + 6) * Math.sin(a) }, { x: CX + (R + 30) * Math.cos(a), y: CY + (R + 30) * Math.sin(a) }], { width: 5, seed: 920 + i, alpha: tl });
    text(ctx, `${v}`, CX + (R + 64) * Math.cos(a), CY + (R + 64) * Math.sin(a) + 12, { font: 'Inter', weight: 600, size: 28, align: 'center', color: theme.soft, alpha: tl });
  });

  // The needle swings up from the minimum and settles, overshooting a little.
  const swing = spring(seg(t, 0.32, 0.62));
  const v = min + (value - min) * swing;
  const a = angle(Math.min(max, Math.max(min, v)));
  if (t > 0.3) {
    pen.line(ctx, [{ x: CX, y: CY }, { x: CX + (R - 80) * Math.cos(a), y: CY + (R - 80) * Math.sin(a) }], { width: 12, amp: 0.8, seed: 931 });
    pen.shape(ctx, pen.ellipse(CX, CY, 28, 28, 24), { fill: C.ink, width: 4, seed: 932, offset: 0 });
  }

  // The value, colored by the zone it lands in.
  const zone = zones.find((z) => value <= z.to) || zones[zones.length - 1];
  const valueColor = { good: theme.good, bad: theme.accent }[zone.kind] || theme.text;
  if (t > 0.32) {
    const shown = Math.round(min + (value - min) * Math.min(1, seg(t, 0.32, 0.55)));
    text(ctx, `${shown}${props.unit ?? ''}`, CX, CY + 160, { size: 150, align: 'center', color: valueColor });
    text(ctx, props.label || '', CX, CY + 230, { size: 60, align: 'center', alpha: easeOut(seg(t, 0.5, 0.6)) });
  }
  const vk = spring(seg(t, 0.72, 0.84));
  if (vk > 0 && props.verdict) {
    ctx.save();
    ctx.translate(CX, CY - R - 150);
    ctx.scale(vk, vk);
    kicker(ctx, props.verdict, 0, 0, { seed: 941 });
    ctx.restore();
  }
}

gauge.cues = (props) => [
  { t: 0.06, sfx: 'whoosh', gain: 0.3 },
  { t: 0.32, sfx: 'sprout', gain: 0.4 },
  { t: 0.5, sfx: 'squish', gain: 0.5 },
  ...(props.verdict ? [{ t: 0.72, sfx: 'pop' }] : []),
];

module.exports = gauge;
