// 3. The Menu Board: a hand-drawn menu, then the owner's pen marks what sells and what earns.
//
// props: {
//   caption, title: 'Lunch',
//   items: [{ name, price: '16', mark: 'star' | 'circle' | 'cross' | 'underline', note }]
// }
// Prices are strings, so you can show "16" vs "$16" on purpose.

const { C, pen, motion } = require('../lib/kit.js');
const { text, measure, caption, loop, star, strike, squiggle } = require('../lib/marks.js');
const { seg, easeOut, spring } = motion;

const X = 150, WIDTH = 780, TOP = 480, HEAD = 190, ROW = 128, MARKS = [0.45, 0.88];

function menu(ctx, theme, t, props) {
  const items = props.items || [];
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  const h = HEAD + items.length * ROW + 40;
  pen.shape(ctx, pen.roundRect(X, TOP, WIDTH, h, 26), { fill: C.card, width: 6, seed: 91, offset: 5 });

  const title = props.title || 'Menu';
  text(ctx, title, X + WIDTH / 2, TOP + 110, { size: 100, align: 'center' });
  const tw = measure(title, { size: 100 });
  squiggle(ctx, X + WIDTH / 2 - tw / 2, X + WIDTH / 2 + tw / 2, TOP + 138, easeOut(seg(t, 0.06, 0.18)), C.ink, 92, 5);

  const marked = items.filter((it) => it.mark).length;
  let m = 0;
  items.forEach((it, i) => {
    const a = easeOut(seg(t, 0.1 + i * 0.06, 0.2 + i * 0.06));
    const y = TOP + HEAD + i * ROW + 40;
    const nx = X + 70, px = X + WIDTH - 60;
    const nw = text(ctx, it.name, nx, y, { size: 62, alpha: a });
    const pw = text(ctx, it.price, px, y, { size: 62, alpha: a, align: 'right' });
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = C.muted;
      for (let x = nx + nw + 22; x < px - pw - 18; x += 22) {
        ctx.beginPath();
        ctx.arc(x, y - 8, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (!it.mark) return;

    // Marks go on one by one after the menu is written.
    const d = (MARKS[1] - MARKS[0]) / marked;
    const p = easeOut(seg(t, MARKS[0] + m * d, MARKS[0] + (m + 0.7) * d));
    m++;
    if (p <= 0) return;
    const seed = 100 + i * 7;
    if (it.mark === 'star') star(ctx, X + 34, y - 20, 26 * spring(p), C.tomato, seed);
    if (it.mark === 'circle') loop(ctx, px - pw / 2, y - 20, pw / 2 + 34, 46, p, C.rose, seed);
    if (it.mark === 'cross') strike(ctx, nx - 14, px + 14, y - 22, p, C.rose, seed);
    if (it.mark === 'underline') squiggle(ctx, nx, nx + nw, y + 14, p, C.rose, seed);
    if (it.note) text(ctx, it.note, nx, y + 52, { size: 40, color: C.muted, alpha: p });
  });
}

menu.cues = (props) => {
  const items = props.items || [];
  const cues = [];
  items.forEach((_, i) => cues.push({ t: 0.1 + i * 0.06, sfx: 'tick', gain: 0.5 }));
  const marked = items.filter((it) => it.mark);
  const d = (MARKS[1] - MARKS[0]) / Math.max(1, marked.length);
  marked.forEach((it, m) => cues.push({ t: MARKS[0] + m * d, sfx: it.mark === 'star' ? 'pop' : 'scratch' }));
  return cues;
};

module.exports = menu;
