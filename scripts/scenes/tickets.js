// 13. The Tickets: order tickets slide onto the kitchen rail, their timers count up, and the
// late one turns rose and shakes.
//
// props: {
//   caption,
//   tickets: [{ table: 'T4', items: ['2 flat white', '1 toastie'], minutes: 6 }, ...] (up to 3),
//   limit: 12, goal: 'GOAL: UNDER 12 MIN', cook: 'Dev'
// }

const { C, kicker, tomato, pen, motion } = require('../lib/kit.js');
const { text, caption, dashed } = require('../lib/marks.js');
const { seg, easeOut, spring, breathe } = motion;

const RAIL = 520, TW = 250, GAP = 30, X0 = 130, TH = 440;

function tickets(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  const list = (props.tickets || []).slice(0, 3);
  const limit = props.limit ?? 12;
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  list.forEach((tk, i) => {
    const k = spring(seg(t, 0.08 + i * 0.08, 0.24 + i * 0.08));
    if (k <= 0) return;
    const late = tk.minutes > limit;
    const counting = seg(t, 0.36, 0.72);
    const mins = Math.round(tk.minutes * counting);
    const lateNow = late && mins > limit;
    const shake = lateNow ? Math.sin(sec * 40) * 0.025 * (1 - seg(t, 0.85, 1)) : 0;
    const x = X0 + i * (TW + GAP) + (1 - k) * 900;
    ctx.save();
    ctx.translate(x + TW / 2, RAIL);
    ctx.rotate(shake + (i - 1) * 0.015);
    ctx.translate(-TW / 2, 0);
    pen.shape(ctx, pen.roundRect(0, 0, TW, TH, 8), { fill: C.card, width: 5, seed: 1001 + i, offset: 4 });
    text(ctx, tk.table, TW / 2, 90, { size: 70, align: 'center' });
    dashed(ctx, 24, TW - 24, 120, C.muted, 1010 + i * 10);
    (tk.items || []).slice(0, 4).forEach((it, j) => text(ctx, it, 26, 176 + j * 50, { size: 40 }));
    dashed(ctx, 24, TW - 24, TH - 110, C.muted, 1020 + i * 10);
    if (counting > 0) {
      text(ctx, `${mins} min`, TW / 2, TH - 36, { size: 68, align: 'center', color: lateNow ? C.rose : C.ink });
    }
    ctx.restore();
  });

  // The rail they hang from, drawn over the tops of the tickets.
  pen.line(ctx, [{ x: 100, y: RAIL + 6 }, { x: 960, y: RAIL + 6 }], { width: 16, color: C.ink, amp: 1, seed: 1031 });

  const g = easeOut(seg(t, 0.78, 0.88));
  if (g > 0 && props.goal) {
    ctx.save();
    ctx.globalAlpha = g;
    kicker(ctx, props.goal, 540, RAIL + TH + 110, { seed: 1041 });
    ctx.restore();
  }
  if (props.cook) {
    const c = spring(seg(t, 0.2, 0.4));
    tomato(ctx, props.cook, 540, RAIL + TH + 330 + (1 - c) * 400, 300, { squash: breathe(sec), angle: Math.sin(sec * 2.4) * 0.04 });
  }
}

tickets.cues = (props) => {
  const list = (props.tickets || []).slice(0, 3);
  const cues = list.map((_, i) => ({ t: 0.08 + i * 0.08, sfx: 'whoosh', gain: 0.25 }));
  list.forEach((_, i) => cues.push({ t: 0.14 + i * 0.08, sfx: 'tick', gain: 0.6 }));
  if (list.some((tk) => tk.minutes > (props.limit ?? 12))) cues.push({ t: 0.66, sfx: 'ding', gain: 0.5 });
  if (props.goal) cues.push({ t: 0.78, sfx: 'pop', gain: 0.6 });
  return cues;
};

module.exports = tickets;
