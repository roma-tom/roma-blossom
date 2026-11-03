// End card: always on lime. Roma Tom pops up in the sunrise, then the name and the follow line.
//
// props: { cta = 'Follow for more *owner* tips', site = 'romatom.com' }

const { W, C, THEMES, rays, tomato, headline, motion } = require('../lib/kit.js');
const { seg, easeOut, spring, settle, breathe } = motion;

function endcard(ctx, _theme, t, props, info = {}) {
  const theme = THEMES.lime;
  const sec = info.sec ?? t * 3;
  const cx = W / 2, cy = 840;

  rays(ctx, theme, { cx, cy, spin: t * 0.3, reach: 1250 });

  const pop = spring(seg(t, 0, 0.3));
  const squash = 1 + 0.08 * settle(seg(t, 0.15, 0.6)) + (breathe(sec) - 1);
  tomato(ctx, 'Roma Tom', cx, cy, 660, { scale: pop, squash });

  // The name, in the logo's Gaegu.
  const name = easeOut(seg(t, 0.18, 0.4));
  if (name > 0) {
    ctx.save();
    ctx.globalAlpha = name;
    ctx.font = '700 150px Gaegu';
    ctx.letterSpacing = '-3px';
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'center';
    ctx.fillText('Roma Tom', cx, 1220 + (1 - name) * 30);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  headline(ctx, theme, props.cta || 'Follow for more *owner* tips', {
    y: 1270, size: 88, maxW: 640, appear: easeOut(seg(t, 0.32, 0.6)), seed: 17,
  });

  const site = easeOut(seg(t, 0.55, 0.72));
  if (site > 0) {
    ctx.save();
    ctx.globalAlpha = site;
    ctx.font = '600 38px Inter';
    ctx.letterSpacing = '3px';
    ctx.fillStyle = C.forestDark;
    ctx.textAlign = 'center';
    ctx.fillText(props.site || 'romatom.com', cx, 1520);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }
}

endcard.cues = () => [
  { t: 0.02, sfx: 'pop' },
  { t: 0.2, sfx: 'squish', gain: 0.6 },
  { t: 0.34, sfx: 'chime', gain: 0.6 },
];

module.exports = endcard;
