// Hook, the number first: one big, specific number slams in on the very first frame, gets circled,
// and the line under it says what it is. For "We lose $52,740 a year from 3 things" style hooks.
//
// props: { kicker, number: '$8,100', line: 'a year, given away on *oat milk*', host = 'Roma Tom' }

const { W, kicker, headline, rays, tomato, motion } = require('../lib/kit.js');
const { text, measure, loop } = require('../lib/marks.js');
const { seg, easeOut, spring, settle, breathe } = motion;

const X = 520, NY = 900, LOOP = 0.55;

function hookNumber(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3.5;
  const host = props.host || 'Roma Tom';
  const num = String(props.number || '');
  let size = 300;
  while (size > 140 && measure(num, { size }) > 760) size -= 10;
  const w = measure(num, { size });

  rays(ctx, theme, { cx: X, cy: NY - size * 0.3, spin: sec * 0.15, reach: 1000 });
  if (props.kicker) {
    const k = spring(seg(sec, 0.1, 0.35));
    ctx.save(); ctx.translate(X, 540); ctx.scale(k, k); kicker(ctx, props.kicker, 0, 0); ctx.restore();
  }

  // The number lands big and settles; it's legible from frame one.
  const slam = spring(seg(sec, 0, 0.3));
  const scale = 1.5 - 0.5 * slam;
  ctx.save();
  ctx.translate(X, NY - size * 0.32);
  ctx.scale(scale, scale);
  text(ctx, num, 0, size * 0.32, { size, align: 'center', color: theme.accent });
  ctx.restore();
  loop(ctx, X, NY - size * 0.32, w / 2 + 50, size * 0.62, easeOut(seg(sec, LOOP, LOOP + 0.4)), theme.accent, 2201, 9);

  headline(ctx, theme, props.line || '', { x: X, y: NY + size * 0.45, size: 100, maxW: 800, appear: easeOut(seg(sec, 0.2, 0.7)), seed: 2202 });

  // The host leans in from the bottom, wide-eyed, with a jolt when the number lands.
  const rise = spring(seg(sec, 0.15, 0.55));
  const squash = 1 + 0.1 * settle(seg(sec, 0.15, 0.8)) + (breathe(sec) - 1);
  tomato(ctx, host, X + 150, 1680 + (1 - rise) * 600, 660, { squash, angle: -0.12 });
}

hookNumber.cues = () => [
  { sec: 0, sfx: 'boing', gain: 0.5 },
  { sec: 0.02, sfx: 'ding', gain: 0.55 },
  { sec: LOOP, sfx: 'scratch', gain: 0.45 },
  { sec: 0.2, sfx: 'sprout', gain: 0.3 },
];
hookNumber.cover = (p) => ({ kicker: p.kicker, headline: p.line, number: p.number });

module.exports = hookNumber;
