// 7. The Jar: the sum written out line by line, then coins drop into a jar while the total counts up.
//
// props: {
//   caption, lines: ['$0.30 less waste a plate', '× 200 plates a day', '× 360 days'],
//   total: 21600, currency: '$', label: 'a year'
// }

const { W, C, pen, motion } = require('../lib/kit.js');
const { text, caption, money } = require('../lib/marks.js');
const { seg, easeOut, easeInOut } = motion;

const COINS = 30, FALL = [0.4, 0.85];
const JX = 540, JW = 420, JTOP = 1030, JBOT = 1470;

function jarOutline(ctx, seed) {
  const neck = 150, lipH = 44, body = JW / 2, r = 70;
  const pts = [
    { x: JX - neck, y: JTOP }, { x: JX + neck, y: JTOP }, { x: JX + neck, y: JTOP + lipH },
    { x: JX + body - 20, y: JTOP + lipH + 30 }, { x: JX + body, y: JTOP + lipH + 90 },
    ...pen.roundRect(JX - body, JTOP + lipH + 90, JW, JBOT - JTOP - lipH - 90, r).slice(9, 27),
    { x: JX - body, y: JTOP + lipH + 90 }, { x: JX - body + 20, y: JTOP + lipH + 30 }, { x: JX - neck, y: JTOP + lipH },
  ];
  return pts;
}

// Where coin i comes to rest, stacking up from the bottom of the jar.
function rest(i) {
  const row = Math.floor(i / 5), col = i % 5;
  const r = pen.rng(900 + i);
  return { x: JX + (col - 2) * 66 + (row % 2 ? 22 : -12) + (r() - 0.5) * 18, y: JBOT - 44 - row * 26 + (r() - 0.5) * 10 };
}

// A coin seen from above at an angle: its edge, its face, and a ring stamped into the face.
// squeeze (0..1) narrows it as it spins while falling.
function coin(ctx, x, y, squeeze, fill, edge, seed) {
  const rx = 34 * squeeze + 4, ry = 14 + (1 - squeeze) * 18;
  pen.shape(ctx, pen.ellipse(x, y + 8, rx, ry, 28), { fill: edge, width: 4, amp: 0.6, seed: seed + 1, offset: 0 });
  pen.shape(ctx, pen.ellipse(x, y, rx, ry, 28), { fill, width: 4, amp: 0.6, seed, offset: 0 });
  if (squeeze > 0.5) pen.line(ctx, pen.ellipse(x, y, rx * 0.62, ry * 0.55, 20), { width: 3, amp: 0.4, seed: seed + 2, closed: true });
}

function jar(ctx, theme, t, props) {
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  (props.lines || []).forEach((ln, i) => {
    text(ctx, ln, W / 2, 520 + i * 74, { size: 62, align: 'center', alpha: easeOut(seg(t, 0.08 + i * 0.09, 0.18 + i * 0.09)) });
  });

  // The total counts up as the coins land.
  const count = easeInOut(seg(t, FALL[0], FALL[1]));
  if (t >= FALL[0]) {
    text(ctx, money(Math.round((props.total || 0) * count), props.currency ?? '$', 0), W / 2, 900, { size: 168, align: 'center', color: theme.accent });
    text(ctx, props.label || '', W / 2, 975, { size: 60, align: 'center', alpha: easeOut(seg(t, 0.8, 0.9)) });
  }

  // Coins: lime with a forest edge where lime shows, else card with a line-colored edge.
  const fill = theme.mark, edge = theme.mark === C.lime ? C.forest : C.line;
  const shape = jarOutline(ctx, 401);
  pen.fill(ctx, shape, C.card, { seed: 402, alpha: 0.55 });
  for (let i = 0; i < COINS; i++) {
    const a = FALL[0] + (i / COINS) * (FALL[1] - FALL[0] - 0.06);
    const p = seg(t, a, a + 0.06);
    if (p <= 0) continue;
    const end = rest(i);
    const y = 960 + (end.y - 960) * p * p;
    coin(ctx, end.x, y, p < 1 ? Math.abs(Math.cos(p * 9 + i)) : 1, fill, edge, 410 + i * 3);
  }
  pen.line(ctx, shape, { width: 7, seed: 401, closed: true });
  // A glint on the glass.
  pen.line(ctx, [{ x: JX - JW / 2 + 40, y: JTOP + 170 }, { x: JX - JW / 2 + 40, y: JTOP + 300 }], { width: 8, color: C.card, seed: 403 });
}

jar.cues = (props) => {
  const cues = (props.lines || []).map((_, i) => ({ t: 0.08 + i * 0.09, sfx: 'tick', gain: 0.5 }));
  for (let i = 0; i < COINS; i += 2) {
    const a = FALL[0] + (i / COINS) * (FALL[1] - FALL[0] - 0.06);
    cues.push({ t: a + 0.06, sfx: 'clink', gain: 0.35 + ((i * 7) % 5) / 20 });
  }
  cues.push({ t: FALL[1], sfx: 'ding', gain: 0.6 });
  return cues;
};

module.exports = jar;
