// 1. Hook: the question in big Gaegu, a kicker pill, and the host tomato rising like the sun.
//
// props: { kicker, headline, host = 'Roma Tom' }
// t runs 0..1 over the scene; info.sec is seconds into it.

const { W, kicker, headline, rays, tomato, motion } = require('../lib/kit.js');
const { seg, easeOut, spring, settle, breathe } = motion;

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3.5;
  const host = props.host || 'Roma Tom';
  const sunX = W / 2, sunY = 1500;

  // The rays turn slowly the whole time.
  rays(ctx, theme, { cx: sunX, cy: sunY - 40, spin: -Math.PI / 2 + t * 0.35, reach: 1150 });

  // The host springs up from below, squashes as it settles, then breathes.
  const rise = spring(seg(t, 0, 0.3));
  const squash = 1 + 0.1 * settle(seg(t, 0.12, 0.55)) + (breathe(sec) - 1);
  tomato(ctx, host, sunX, sunY + (1 - rise) * 800, 800, { squash });

  // The kicker pops, then the question writes itself in word by word.
  const k = spring(seg(t, 0, 0.12));
  if (k > 0) {
    ctx.save();
    ctx.translate(W / 2, 560);
    ctx.scale(k, k);
    kicker(ctx, props.kicker, 0, 0);
    ctx.restore();
  }
  headline(ctx, theme, props.headline, { y: 650, size: 132, appear: easeOut(seg(t, 0.04, 0.32)), seed: 9 });
}

hook.cues = () => [
  { t: 0, sfx: 'sprout', gain: 0.6 },
  { t: 0.02, sfx: 'pop', gain: 0.6 },
  { t: 0.16, sfx: 'squish', gain: 0.7 },
];

module.exports = hook;
