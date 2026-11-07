// Hook, two cafes: the screen is split from the first frame into two storefronts side by side,
// each with its own sign. Guests stroll past, and all of them turn into one door. For "same
// street, one is full" comparisons: two signs, two prices, two ways of doing the same thing.
//
// props: { line: 'Same street. Same coffee.', left: { name: 'Leo', sign: 'Lunch for everyone' },
//          right: { name: 'Roma Tom', sign: 'Lunch in 10 minutes' }, winner: 'right',
//          payoff: 'Only one is *full*.', guests: ['Maria', 'Ivan', 'Ana'] }
// winner: 'none' keeps it a question: the guests stop between the two and look both ways.

const { headline, tomato, pen, motion } = require('../lib/kit.js');
const { storefront } = require('../lib/stage.js');
const { seg, easeOut, easeInOut, spring, breathe } = motion;

const PW = 420, PANELS = [{ x: 60 }, { x: 520 }], TOP = 640, AWN = 760, FLOOR = 1240;
const TURN = 1.3; // seconds until the guests turn into the winning door

function hookSplit(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3.5;
  const none = props.winner === 'none';
  const win = props.winner === 'left' ? 0 : none ? -1 : 1;
  headline(ctx, theme, props.line || '', { x: 500, y: 280, size: 104, maxW: 820, appear: easeOut(seg(sec, 0, 0.3)), seed: 2601 });

  const dimLoser = easeOut(seg(sec, TURN + 0.5, TURN + 0.9));
  [props.left || {}, props.right || {}].forEach((side, i) => {
    const k = spring(seg(sec, i * 0.06, 0.3 + i * 0.06));
    ctx.save();
    ctx.translate(PANELS[i].x + PW / 2, FLOOR); ctx.scale(k, k); ctx.translate(-(PANELS[i].x + PW / 2), -FLOOR);
    storefront(ctx, theme, { x: PANELS[i].x, w: PW, sign: side.sign, name: side.name, sec, dim: none || i === win ? 0 : dimLoser, seed: 2610 + i * 40, top: TOP, awn: AWN, floor: FLOOR });
    ctx.restore();
  });
  // The street, and the divider between the two cafes.
  pen.line(ctx, [{ x: 20, y: FLOOR + 6 }, { x: 960, y: FLOOR }], { width: 6, seed: 2690 });

  // Guests stroll along the street, then all turn into the winner's door.
  const door = none ? 500 : PANELS[win].x + PW / 2;
  (props.guests || ['Maria', 'Ivan', 'Ana']).slice(0, 3).forEach((g, i) => {
    const stroll = seg(sec, 0, TURN);
    const x0 = -150 - i * 160, stop = none ? door - (i - 1) * 190 : door + i * 30;
    const xs = x0 + stroll * (stop - x0);
    const turn = none ? 0 : easeInOut(seg(sec, TURN + i * 0.12, TURN + 0.5 + i * 0.12));
    const x = xs + (door - xs) * turn, y = FLOOR + 110 - turn * 150;
    const walking = none ? stroll < 1 : turn < 1;
    const bob = walking ? Math.abs(Math.sin(sec * 12 + i)) * 14 : 0;
    const look = none && !walking ? Math.sin(sec * 3 + i) * 0.12 : Math.sin(sec * 10 + i) * 0.05;
    tomato(ctx, g, x, y - bob, 200 - turn * 60, { alpha: 1 - Math.max(0, turn - 0.7) / 0.3, angle: look });
  });

  headline(ctx, theme, props.payoff || '', { x: 500, y: FLOOR + 170, size: 96, maxW: 820, appear: easeOut(seg(sec, TURN + 0.5, TURN + 0.9)), seed: 2602 });
}

hookSplit.cues = () => [
  { sec: 0, sfx: 'pop', gain: 0.5 },
  { sec: 0.06, sfx: 'pop', gain: 0.5 },
  { sec: 0.4, sfx: 'tap', gain: 0.35 },
  { sec: 0.8, sfx: 'tap', gain: 0.35 },
  { sec: TURN + 0.4, sfx: 'chime', gain: 0.5 },
];
hookSplit.cover = (p) => ({ kicker: 'TWO CAFES', headline: `${p.line || ''} ${p.payoff || ''}`.trim(), names: [p.left?.name, p.right?.name, (p.guests || [])[0]].filter(Boolean) });

module.exports = hookSplit;
