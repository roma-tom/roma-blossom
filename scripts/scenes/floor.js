// 21. The Floor: the dining room from above. Guests sit, leave and new ones sit again, turn
// after turn, while the turn counter ticks up.
//
// props: {
//   caption, tables: 9 (4 to 9), turns: 3 (1 to 3), fill: 0.8 (share of tables used each turn),
//   guests: ['Maria', 'Dev', ...] (names to seat; defaults to a built-in list),
//   stat: { value: '3 turns', label: 'on a good Friday' }
// }

const { C, kicker, tomato, headline, pen, motion } = require('../lib/kit.js');
const { caption, text } = require('../lib/marks.js');
const { seg, easeOut, spring } = motion;

const X = 130, Y = 500, W = 820, H = 760, ROWS = 3, COLS = 3;
const NAMES = ['Maria', 'Dev', 'Ana', 'Sam', 'Lee', 'Kim', 'Jo', 'Priya', 'Leo', 'Nia', 'Omar', 'Ruth', 'Ivy', 'Ben', 'Zoe', 'Max', 'Eli', 'Rosa'];

function floor(ctx, theme, t, props) {
  const tables = Math.max(4, Math.min(9, props.tables ?? 9));
  const turns = Math.max(1, Math.min(3, props.turns ?? 3));
  const names = props.guests?.length ? props.guests : NAMES;
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  // The room, with the counter along the top wall.
  pen.shape(ctx, pen.roundRect(X, Y, W, H, 20), { fill: C.card, width: 7, seed: 1801, offset: 5 });
  pen.shape(ctx, pen.roundRect(X + 60, Y + 30, W - 120, 60, 10), { fill: C.line, width: 5, seed: 1802, offset: 0 });
  text(ctx, 'COUNTER', X + W / 2, Y + 70, { font: 'Inter', size: 22, spacing: 4, align: 'center', color: C.muted });

  // Each turn gets an equal slice of the scene: guests sit, stay, then leave (except the last turn).
  const span = 0.72 / turns;
  const turn = Math.min(turns, Math.floor(Math.max(0, t - 0.1) / span) + 1);
  for (let i = 0; i < tables; i++) {
    const col = i % COLS, row = Math.floor(i / COLS);
    const cx = X + W / 2 + (col - 1) * 250, cy = Y + 230 + row * 200;
    pen.shape(ctx, pen.ellipse(cx, cy, 70, 70, 32), { fill: C.paper, width: 5, seed: 1810 + i, offset: 0 });
    for (let k = 0; k < turns; k++) {
      // Not every table fills every turn.
      const used = ((i * 7 + k * 3) % 10) / 10 < (props.fill ?? 0.8);
      if (!used) continue;
      const a = 0.1 + k * span;
      const sit = spring(seg(t, a + (i % 5) * 0.012, a + 0.08 + (i % 5) * 0.012));
      const leave = k < turns - 1 ? easeOut(seg(t, a + span * 0.8, a + span * 0.98)) : 0;
      if (sit <= 0 || leave >= 1) continue;
      tomato(ctx, names[(i + k * tables) % names.length], cx, cy - 6 - leave * 40, 160, { scale: sit, alpha: 1 - leave });
    }
  }

  // The turn counter above the room.
  if (t > 0.08) kicker(ctx, `TURN ${turn}`, X + W / 2, Y - 52, { seed: 1830 + turn });
  if (props.stat) {
    headline(ctx, theme, `*${props.stat.value}* ${props.stat.label}`, { y: Y + H + 40, size: 84, maxW: 840, appear: easeOut(seg(t, 0.84, 0.95)), seed: 1840 });
  }
}

floor.cues = (props) => {
  const turns = Math.max(1, Math.min(3, props.turns ?? 3)), span = 0.72 / turns;
  const cues = [];
  for (let k = 0; k < turns; k++) {
    cues.push({ t: 0.1 + k * span, sfx: 'pop', gain: 0.5 }, { t: 0.13 + k * span, sfx: 'pop', gain: 0.4 });
    if (k < turns - 1) cues.push({ t: 0.1 + k * span + span * 0.8, sfx: 'whoosh', gain: 0.25 });
  }
  if (props.stat) cues.push({ t: 0.84, sfx: 'chime', gain: 0.5 });
  return cues;
};

module.exports = floor;
