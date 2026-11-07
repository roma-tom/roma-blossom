// Hook, the cold open: the video starts inside a moment every owner knows. Roma Tom is behind
// the counter, a guest walks up and says the line, and Roma Tom reacts. "POV:" and the setup
// are on screen from the first frame. For relatable openers ("POV: two minutes to close…").
//
// props: { pov: 'Two minutes to close.', guest: 'Ivan', quote: 'Are you still doing *food*?',
//          react: 'shock' | 'sweat' | 'joy', host = 'Roma Tom' }
// Set the scene's speaker to the guest so the line is said in their voice.

const { W, C, THEMES, kicker, headline, tomato, motion } = require('../lib/kit.js');
const { wrapText, bubble } = require('../lib/marks.js');
const { counter, reaction } = require('../lib/stage.js');
const { seg, easeOut, spring, settle, breathe } = motion;

const COUNTER = 1440, REACT = 1.25; // y of the counter top; seconds until the reaction

function hookPov(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3.5;
  const host = props.host || 'Roma Tom', guest = props.guest || 'Ivan';
  const react = props.react || 'shock';

  // The setup, readable at once.
  ctx.save(); ctx.translate(520, 250); ctx.scale(spring(seg(sec, 0, 0.2)), spring(seg(sec, 0, 0.2))); kicker(ctx, 'POV', 0, 0); ctx.restore();
  headline(ctx, theme, props.pov || '', { x: 520, y: 310, size: 104, maxW: 820, appear: easeOut(seg(sec, 0, 0.3)), seed: 2540 });

  // Roma Tom behind the counter, in the middle; he jumps when the line lands.
  const jump = settle(seg(sec, REACT, REACT + 0.7));
  const hop = Math.max(0, Math.sin(Math.PI * seg(sec, REACT, REACT + 0.3))) * 60;
  tomato(ctx, host, W / 2, 1300 - hop, 560, { squash: 1 + 0.12 * jump + (breathe(sec) - 1) });
  counter(ctx, COUNTER, { cupX: 250 });

  // The guest walks up from the right, with a little bob, and stops at the counter.
  const walk = easeOut(seg(sec, 0, 0.6));
  const gx = 1250 - walk * 400, bob = walk < 1 ? Math.abs(Math.sin(sec * 14)) * 18 : 0;
  tomato(ctx, guest, gx, 1580 - bob, 360, { squash: breathe(sec, 0.9), angle: walk < 1 ? -0.08 : Math.sin(sec * 2) * 0.03 });

  // Their line, in a bubble pointing at them.
  const lines = wrapText((props.quote || '').replace(/\*/g, ''), 640, { size: 88, balance: true }).length;
  const BX = 130, BY = 600, BW = 780, BH = 100 + lines * 90 + 50;
  const k = spring(seg(sec, 0.55, 0.85));
  if (k > 0) {
    const tx = 830, ty = BY + BH + 150;
    ctx.save(); ctx.translate(tx, ty); ctx.scale(k, k); ctx.translate(-tx, -ty);
    bubble(ctx, BX, BY, BW, BH, tx, ty, C.card, 2550);
    headline(ctx, { ...THEMES.paper, swash: C.lime }, props.quote || '', { x: BX + BW / 2, y: BY + 70, size: 88, maxW: 660, seed: 2551 });
    ctx.restore();
  }
  // Drawn last, so the bubble never covers it.
  reaction(ctx, theme, react, W / 2, 1260 - hop, seg(sec, REACT, REACT + 0.6));
}

hookPov.cues = () => [
  { sec: 0, sfx: 'tap', gain: 0.5 },
  { sec: 0.15, sfx: 'tap', gain: 0.4 },
  { sec: 0.3, sfx: 'tap', gain: 0.4 },
  { sec: 0.55, sfx: 'pop', gain: 0.6 },
  { sec: REACT, sfx: 'boing', gain: 0.6 },
];
hookPov.cover = (p) => ({ kicker: 'POV', headline: p.pov, name: p.guest });

module.exports = hookPov;
