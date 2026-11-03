// 4. The Rush: the day as hourly bars, the peak in rose, and a queue of guests at the door.
//
// props: {
//   caption, label: 'GUESTS PER HOUR',
//   hours: ['7', '8', ...], values: [14, 32, ...],
//   queue: ['Maria', 'Dev', ...] (up to 5), queueLabel: "THE 12 O'CLOCK LINE"
// }

const { C, kicker, tomato, pen, motion } = require('../lib/kit.js');
const { text, caption } = require('../lib/marks.js');
const { seg, easeOut, spring } = motion;

const LEFT = 130, RIGHT = 950, BASE = 1130, TALL = 440;

function clock(ctx, cx, cy, r, t) {
  pen.shape(ctx, pen.ellipse(cx, cy, r, r), { fill: C.card, width: 6, seed: 141, offset: 0 });
  const hand = (a, len, w) =>
    pen.line(ctx, [{ x: cx, y: cy }, { x: cx + len * Math.sin(a), y: cy - len * Math.cos(a) }], { width: w, amp: 0.5, seed: 142 });
  hand(t * Math.PI * 2 * 4, r * 0.72, 5);
  hand(t * Math.PI * 1.2 + 0.4, r * 0.48, 7);
}

function rush(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  const values = props.values || [];
  const hours = props.hours || values.map((_, i) => String(i + 1));
  const n = values.length;
  const max = Math.max(...values);
  const peak = values.indexOf(max);

  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));
  text(ctx, props.label || 'GUESTS PER HOUR', LEFT, BASE - TALL - 110, { font: 'Inter', size: 28, spacing: 4, color: theme.soft });
  clock(ctx, RIGHT - 80, BASE - TALL - 120, 60, t);

  const slot = (RIGHT - LEFT) / n, bw = slot * 0.64;
  values.forEach((v, i) => {
    const g = easeOut(seg(t, 0.12 + i * 0.03, 0.34 + i * 0.03));
    const x = LEFT + i * slot + (slot - bw) / 2;
    const bh = Math.max(6, (v / max) * TALL * g);
    if (g > 0) pen.shape(ctx, pen.roundRect(x, BASE - bh, bw, bh, 10), { fill: i === peak ? C.rose : theme.swash, width: 5, seed: 150 + i, offset: 3 });
    text(ctx, hours[i], x + bw / 2, BASE + 48, { font: 'Inter', weight: 600, size: 28, align: 'center', color: theme.soft });
  });
  pen.line(ctx, [{ x: LEFT - 20, y: BASE }, { x: RIGHT + 10, y: BASE }], { width: 6, seed: 160 });

  // The peak gets its number.
  const pk = spring(seg(t, 0.5, 0.62));
  if (pk > 0) {
    const x = LEFT + peak * slot + slot / 2;
    ctx.save();
    ctx.translate(x, BASE - TALL - 24);
    ctx.scale(pk, pk);
    text(ctx, String(max), 0, 0, { size: 72, align: 'center', color: theme.accent });
    ctx.restore();
  }

  // The queue forms at the door.
  const queue = (props.queue || []).slice(0, 5);
  if (queue.length) {
    const ql = easeOut(seg(t, 0.55, 0.65));
    if (ql > 0 && props.queueLabel) {
      ctx.save();
      ctx.globalAlpha = ql;
      kicker(ctx, props.queueLabel, 540, 1250, { seed: 171 });
      ctx.restore();
    }
    const step = 170, x0 = 540 - ((queue.length - 1) * step) / 2;
    queue.forEach((name, i) => {
      const k = spring(seg(t, 0.6 + i * 0.06, 0.72 + i * 0.06));
      const hop = Math.abs(Math.sin(sec * 3 + i * 1.3)) * 10;
      tomato(ctx, name, x0 + i * step, 1420 - hop, 210, { scale: k, angle: Math.sin(sec * 2 + i) * 0.05 });
    });
  }
}

rush.cues = (props) => {
  const cues = [{ t: 0.5, sfx: 'pop' }];
  (props.queue || []).slice(0, 5).forEach((_, i) => cues.push({ t: 0.6 + i * 0.06, sfx: 'sprout', gain: 0.35 }));
  return cues;
};

module.exports = rush;
