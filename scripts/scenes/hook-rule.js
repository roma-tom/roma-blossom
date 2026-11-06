// Hook, the rule that costs you: a common piece of advice on a sticky note gets a rose stamp
// slammed across it. For "advice that sounds smart but hurts", "sounds free, it isn't" and
// "Stop doing X" hooks.
//
// props: { line: 'The rule that quietly *costs you*', note: 'Price everything at 3× food cost',
//          label: 'THE RULE', stamp: 'COSTS YOU', host = 'Roma Tom' }

const { W, C, THEMES, headline, tomato, pen, motion } = require('../lib/kit.js');
const { text, wrapText, measure } = require('../lib/marks.js');
const { seg, easeOut, spring, settle, breathe } = motion;

const NX = 140, NY = 620, NW = 780, STAMP = 1.0;

function hookRule(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3.5;
  const host = props.host || 'Roma Tom';

  headline(ctx, theme, props.line || '', { x: 530, y: 330, size: 108, maxW: 820, appear: easeOut(seg(sec, 0, 0.45)), seed: 2301 });

  // The note drops in with a little tape on top.
  const lines = wrapText(`“${props.note || ''}”`, NW - 120, { size: 96, balance: true }).slice(0, 4);
  const NH = 190 + lines.length * 100 + 60;
  const k = spring(seg(sec, 0, 0.3));
  const shake = settle(seg(sec, STAMP, STAMP + 0.5)) * 0.03;
  ctx.save();
  ctx.translate(NX + NW / 2, NY + NH / 2);
  ctx.rotate(-0.035 + shake);
  ctx.scale(k, k);
  ctx.translate(-(NX + NW / 2), -(NY + NH / 2));
  pen.shape(ctx, pen.roundRect(NX, NY, NW, NH, 14), { fill: theme.mark === C.card ? C.butter : C.card, width: 6, seed: 2302, offset: 6 });
  pen.fill(ctx, pen.roundRect(NX + NW / 2 - 90, NY - 26, 180, 52, 6), C.line, { seed: 2303, alpha: 0.85 });
  text(ctx, props.label || 'THE RULE', NX + 60, NY + 100, { font: 'Inter', size: 30, spacing: 5, color: C.muted });
  lines.forEach((ln, i) => text(ctx, ln, NX + 60, NY + 210 + i * 100, { size: 96 }));
  ctx.restore();

  // The stamp slams down across the note: big, then hard to its size.
  const s = seg(sec, STAMP, STAMP + 0.14);
  if (s > 0) {
    const label = props.stamp || 'COSTS YOU';
    const size = 92, tw = measure(label, { font: 'Inter', size, spacing: 6 });
    const sw = tw + 90, sh = 160, cx = NX + NW / 2 + 10, cy = NY + NH - 30;
    const sc = 1 + 1.2 * (1 - easeOut(s));
    ctx.save();
    ctx.globalAlpha = Math.min(1, s * 2);
    ctx.translate(cx, cy);
    ctx.rotate(-0.16);
    ctx.scale(sc, sc);
    pen.shape(ctx, pen.roundRect(-sw / 2, -sh / 2, sw, sh, 22), { fill: theme === THEMES.lime ? C.card : C.paper, width: 10, color: C.rose, seed: 2304, offset: 0 });
    text(ctx, label, 0, size * 0.36, { font: 'Inter', size, spacing: 6, color: C.rose, align: 'center', weight: 800 });
    ctx.restore();
  }

  // The host rises in the middle at the bottom and winces at the stamp.
  const rise = spring(seg(sec, 0.3, 0.7));
  const squash = 1 + 0.14 * settle(seg(sec, STAMP, STAMP + 0.6)) + (breathe(sec) - 1);
  tomato(ctx, host, W / 2, 1700 + (1 - rise) * 600, 620, { squash, angle: Math.sin(sec * 1.6) * 0.03 });
}

hookRule.cues = () => [
  { sec: 0, sfx: 'rustle', gain: 0.6 },
  { sec: 0.05, sfx: 'pop', gain: 0.4 },
  { sec: STAMP + 0.1, sfx: 'squish', gain: 0.9 },
  { sec: STAMP + 0.1, sfx: 'tap', gain: 0.9 },
];
hookRule.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hookRule;
