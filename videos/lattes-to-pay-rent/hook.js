// This video's own hook.
//
// The idea: the month's rent bill unrolls down the screen like an endless receipt while to-go
// lattes stack up beside it, racing to reach the top; the stack runs out of steam well short,
// and a big question mark lands on top.
// Frame one shows: the bill already unrolling and the first cups landing.
// Readable by 0.5 s: "How many lattes pay the *rent*?"    The open loop: the number (the
// video's answer: 1,000 a month).
//
// props: { line, bill, amount }

const { C, headline, pen } = require('../../scripts/lib/kit.js');
const { text, dashed } = require('../../scripts/lib/marks.js');
const S = require('../../scripts/lib/stage.js');

const BILL = { x: 110, w: 380, top: 560, bottom: 1500 };
const STACK = { x: 760, base: 1500, h: 74 }, EVERY = 0.17, CUPS = 7, Q = CUPS * EVERY + 0.15;

// A to-go cup with a lid and sleeve, standing on (x, y).
function togo(ctx, x, y, seed) {
  pen.shape(ctx, [{ x: x - 52, y: y - 70 }, { x: x + 52, y: y - 70 }, { x: x + 40, y }, { x: x - 40, y }], { fill: C.card, width: 5, seed, offset: 0 });
  pen.shape(ctx, [{ x: x - 49, y: y - 50 }, { x: x + 49, y: y - 50 }, { x: x + 45, y: y - 24 }, { x: x - 45, y: y - 24 }], { fill: C.tomato, width: 4, seed: seed + 1, offset: 0 });
  pen.shape(ctx, pen.roundRect(x - 60, y - 84, 120, 18, 8), { fill: C.card, width: 5, seed: seed + 2, offset: 0 });
}

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3;

  headline(ctx, theme, props.line || '', { x: 540, y: 270, size: 112, maxW: 840, appear: S.at(sec, 0, 0.3), seed: 3301 });

  // The rent bill unrolls downward, with a curl at its moving bottom edge.
  const u = S.at(sec, 0, 1.3, S.easeInOut);
  const bottom = BILL.top + 60 + (BILL.bottom - BILL.top - 60) * u;
  pen.shape(ctx, pen.roundRect(BILL.x - 20, BILL.top - 40, BILL.w + 40, 50, 20), { fill: C.line, width: 6, seed: 3310, offset: 0 });
  pen.shape(ctx, [{ x: BILL.x, y: BILL.top }, { x: BILL.x + BILL.w, y: BILL.top }, { x: BILL.x + BILL.w, y: bottom }, { x: BILL.x, y: bottom }], { fill: C.card, width: 5, seed: 3311, offset: 0 });
  text(ctx, props.bill || '', BILL.x + BILL.w / 2, BILL.top + 70, { font: 'Inter', size: 28, weight: 800, spacing: 4, align: 'center' });
  for (let y = BILL.top + 130; y < bottom - 150; y += 70) {
    pen.line(ctx, [{ x: BILL.x + 40, y }, { x: BILL.x + BILL.w - 40 - ((y * 7) % 90), y }], { width: 5, color: C.line, seed: 3320 + y });
  }
  pen.shape(ctx, pen.ellipse(BILL.x + BILL.w / 2, bottom, BILL.w / 2 + 14, 24, 32), { fill: C.card, width: 5, seed: 3312, offset: 0 });
  const k = S.pop(sec, 1.25, 0.35);
  if (k > 0) {
    dashed(ctx, BILL.x + 30, BILL.x + BILL.w - 30, bottom - 130, C.muted, 3313);
    S.popIn(ctx, k, BILL.x + BILL.w / 2, bottom - 70, () => text(ctx, props.amount || '', BILL.x + BILL.w / 2, bottom - 40, { size: 96, align: 'center', color: theme.accent }));
  }

  // Lattes drop onto the stack one by one, then stop short.
  const landed = Math.min(CUPS, Math.floor(sec / EVERY) + 1);
  for (let i = 0; i < landed; i++) {
    const a = i * EVERY, drop = (1 - S.at(sec, a, a + 0.12)) * 160;
    togo(ctx, STACK.x + Math.sin(i * 1.7) * 10, STACK.base - i * STACK.h - drop, 3330 + i * 3);
  }
  const top = STACK.base - CUPS * STACK.h - 110;
  S.popIn(ctx, S.pop(sec, Q, 0.4), STACK.x, top, () => text(ctx, '?', STACK.x, top + 60, { size: 220, align: 'center', color: theme.accent }));
}

hook.cues = () => {
  const cues = [{ sec: 0, sfx: 'rustle', gain: 0.45 }];
  for (let i = 0; i < CUPS; i++) cues.push({ sec: i * EVERY + 0.1, sfx: 'tap', gain: 0.35 });
  cues.push({ sec: 1.25, sfx: 'pop', gain: 0.4 }, { sec: Q, sfx: 'boing', gain: 0.4 });
  return cues;
};
hook.cover = (p) => ({ kicker: 'QUICK QUIZ', headline: p.line });

module.exports = hook;
