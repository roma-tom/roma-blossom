// Hook, "they sound the same": two words side by side with an equals sign between them. The
// equals gets slashed into "not equal", the cards tip apart, and the line underneath says why it
// matters. For two things owners mix up (markup vs margin, revenue vs profit, busy vs profitable).
// Everything is readable within half a second.
//
// props: { kicker, left: 'Markup', right: 'Margin', line: "Sound the same. They're *not*.", host = 'Roma Tom' }

const { W, C, kicker, headline, rays, tomato, pen, motion } = require('../lib/kit.js');
const { text, measure } = require('../lib/marks.js');
const { seg, easeOut, spring, settle, breathe } = motion;

const CW = 360, CH = 260, CY = 720, GAP = 100;
const LX = W / 2 - GAP / 2 - CW - 20, RX = W / 2 + GAP / 2 - 20; // shifted left to clear the right safe zone
const MID = (LX + CW + RX) / 2;
const SLASH = 0.95; // seconds

function wordSize(word) {
  let s = 120;
  while (s > 60 && measure(word, { size: s }) > CW - 50) s -= 4;
  return s;
}

function card(ctx, x, word, k, angle, seed) {
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x + CW / 2, CY + CH / 2);
  ctx.rotate(angle);
  ctx.scale(k, k);
  pen.shape(ctx, pen.roundRect(-CW / 2, -CH / 2, CW, CH, 30), { fill: C.card, width: 6, seed, offset: 5 });
  const s = wordSize(word);
  text(ctx, word, 0, s * 0.32, { size: s, align: 'center' });
  ctx.restore();
}

function hookSame(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3.5;
  const host = props.host || 'Roma Tom';
  rays(ctx, theme, { cx: MID, cy: CY + CH / 2, spin: sec * 0.1, reach: 900 });

  if (props.kicker) {
    const k = spring(seg(sec, 0, 0.25));
    ctx.save(); ctx.translate(MID, 580); ctx.scale(k, k); kicker(ctx, props.kicker, 0, 0); ctx.restore();
  }

  // The cards slide in from either side, then tip apart once the equals is slashed.
  const apart = easeOut(seg(sec, SLASH + 0.1, SLASH + 0.5));
  const inL = spring(seg(sec, 0, 0.3)), inR = spring(seg(sec, 0.06, 0.36));
  card(ctx, LX - (1 - inL) * 500 - apart * 20, props.left || '', Math.min(1, inL + 0.3), -apart * 0.07, 2101);
  card(ctx, RX + (1 - inR) * 500 + apart * 20, props.right || '', Math.min(1, inR + 0.3), apart * 0.07, 2102);

  // The equals sign, and the slash that makes it "not equal".
  const eq = easeOut(seg(sec, 0.2, 0.4));
  const ey = CY + CH / 2;
  pen.line(ctx, [{ x: MID - 30, y: ey - 18 }, { x: MID - 30 + 60 * eq, y: ey - 18 }], { width: 12, color: theme.text, seed: 2103 });
  pen.line(ctx, [{ x: MID - 30, y: ey + 18 }, { x: MID - 30 + 60 * eq, y: ey + 18 }], { width: 12, color: theme.text, seed: 2104 });
  const sl = easeOut(seg(sec, SLASH, SLASH + 0.15));
  if (sl > 0) pen.line(ctx, [{ x: MID + 30, y: ey - 60 }, { x: MID - 30, y: ey + 60 }], { width: 14, color: theme.accent, seed: 2105, upto: sl });

  headline(ctx, theme, props.line || '', { x: MID, y: CY + CH + 90, size: 112, maxW: 820, appear: easeOut(seg(sec, 0.15, 0.6)), seed: 2106 });

  // The host pops up below and flinches when the slash lands.
  const rise = spring(seg(sec, 0.25, 0.7));
  const squash = 1 + 0.12 * settle(seg(sec, SLASH, SLASH + 0.6)) + (breathe(sec) - 1);
  tomato(ctx, host, MID, 1660 + (1 - rise) * 600, 720, { squash, angle: Math.sin(sec * 1.6) * 0.03 });
}

hookSame.cues = () => [
  { sec: 0, sfx: 'swish', gain: 0.5 },
  { sec: 0.06, sfx: 'pop', gain: 0.5 },
  { sec: 0.3, sfx: 'sprout', gain: 0.35 },
  { sec: SLASH, sfx: 'scratch', gain: 0.8 },
  { sec: SLASH + 0.08, sfx: 'boing', gain: 0.35 },
];
hookSame.cover = (p) => ({ kicker: p.kicker, headline: `${p.left} vs ${p.right}: ${p.line || ''}` });

module.exports = hookSame;
