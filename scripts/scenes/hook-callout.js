// Hook, the callout: names who it's for ("Cafe owners,") and opens on a line a guest really says
// at the counter, in a speech bubble. Set the scene's speaker to the guest so the hook is
// spoken in their voice. For "the question every owner gets asked" hooks.
//
// props: { callout: 'Cafe owners,', speaker: 'Maria', quote: 'Can I get oat milk for *free*?' }

const { C, THEMES, headline, tomato, motion } = require('../lib/kit.js');
const { text, wrapText, bubble } = require('../lib/marks.js');
const { seg, easeOut, spring, breathe } = motion;

const X = 120, BW = 800, TOP = 620, SIZE = 104;

function hookCallout(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3.5;
  const guest = props.speaker || 'Maria';

  headline(ctx, theme, props.callout || '', { x: 520, y: 360, size: 140, maxW: 820, appear: easeOut(seg(sec, 0, 0.25)), seed: 2401 });

  const lines = wrapText((props.quote || '').replace(/\*/g, ''), BW - 150, { size: SIZE, balance: true }).length;
  const h = 130 + lines * SIZE * 1.02 + 60;
  const tx = 330, ty = TOP + h + 110;
  const k = spring(seg(sec, 0.15, 0.45));
  if (k > 0) {
    ctx.save();
    ctx.translate(tx, ty); ctx.scale(k, k); ctx.translate(-tx, -ty);
    bubble(ctx, X, TOP, BW, h, tx, ty, C.card, 2402);
    text(ctx, '“', X + 36, TOP + 160, { size: 220, color: C.rose });
    headline(ctx, { ...THEMES.paper, swash: C.lime }, props.quote || '', { x: X + BW / 2 + 20, y: TOP + 100, size: SIZE, maxW: BW - 150, appear: 1, seed: 2403 });
    ctx.restore();
  }

  const g = spring(seg(sec, 0.05, 0.35));
  tomato(ctx, guest, tx + 20, ty + 300, 580, { scale: g, squash: breathe(sec), angle: Math.sin(sec * 2) * 0.04 });
}

hookCallout.cues = () => [
  { sec: 0, sfx: 'tap', gain: 0.6 },
  { sec: 0.05, sfx: 'sprout', gain: 0.4 },
  { sec: 0.15, sfx: 'pop', gain: 0.6 },
];
hookCallout.cover = (p) => ({ kicker: (p.callout || '').replace(/[,*]/g, '').toUpperCase(), headline: p.quote, name: p.speaker });

module.exports = hookCallout;
