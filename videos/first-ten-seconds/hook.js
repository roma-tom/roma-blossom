// This video's own hook.
//
// The idea: a ten-second timer drains across the top while Priya, a new guest, steps in and
// looks around; everything her eyes land on gets a tick or a cross, as if she's marking the
// place: the menu board, a sticky table, and Roma Tom waving hello.
// Frame one shows: the timer already draining, Priya mid-step through the door.
// Readable by 0.5 s: "Ten seconds. *Decided.*"
// The open loop: what is she deciding on?
//
// props: { label, line, seconds }

const { W, C, kicker, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const { text, check, cross } = require('../../scripts/lib/marks.js');
const S = require('../../scripts/lib/stage.js');

const BAR = { x: 170, y: 600, w: 780, h: 46 }, LEN = 4.0;
// What she notices: [x, y, at second, good?]
const SPOTS = [[230, 790, 0.9, true], [230, 1270, 1.8, false], [860, 1040, 2.7, true]];

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  kicker(ctx, props.label || '', W / 2, 260, { seed: 11101 });
  headline(ctx, theme, props.line || '', { x: W / 2, y: 330, size: 116, maxW: 860, appear: S.at(sec, 0, 0.2), seed: 11102 });

  // The timer: ten seconds squeezed into the hook, draining from the right.
  const total = Number(props.seconds) || 10;
  const left = Math.max(0, 1 - sec / LEN);
  pen.shape(ctx, pen.roundRect(BAR.x, BAR.y, BAR.w, BAR.h, 23), { fill: C.card, width: 5, seed: 11103, offset: 0 });
  if (left > 0.02) pen.fill(ctx, pen.roundRect(BAR.x + 6, BAR.y + 6, (BAR.w - 12) * left, BAR.h - 12, 17), left < 0.3 ? theme.accent : C.forest, { seed: 11104 });
  text(ctx, `${Math.ceil(left * total)}`, BAR.x - 50, BAR.y + 40, { size: 56, align: 'center' });

  // The room: the menu board, a table, the counter with Roma Tom.
  pen.shape(ctx, pen.roundRect(110, 710, 240, 170, 10), { fill: C.ink, width: 6, seed: 11110, offset: 0 });
  [750, 790, 830].forEach((y, i) => pen.line(ctx, [{ x: 140, y }, { x: 300 - i * 30, y }], { width: 6, color: C.card, seed: 11111 + i }));
  S.table(ctx, 230, 1290, { w: 280, seed: 11120 });
  pen.fill(ctx, pen.ellipse(200, 1276, 30, 7, 12), C.muted, { seed: 11125 });
  tomato(ctx, 'Roma Tom', 870, 1090, 360, { squash: S.breathe(sec), angle: Math.sin(sec * 5) * 0.08 });
  pen.shape(ctx, [{ x: 700, y: 1200 }, { x: 1120, y: 1196 }, { x: 1120, y: 1500 }, { x: 700, y: 1504 }], { fill: C.card, width: 6, seed: 11130, offset: 0 });

  // Priya steps in through the door and looks from spot to spot.
  const w = S.walk(sec, 540, 540, 0, 0.1, 1520);
  const look = sec < 2.3 ? -0.14 * S.at(sec, 0.4, 0.8) : -0.14 + 0.32 * S.at(sec, 2.3, 2.6);
  const k = S.pop(sec, 0, 0.35);
  tomato(ctx, 'Priya', w.x - 20, 1400 + (1 - k) * 120, 480, { angle: look, squash: S.breathe(sec) });
  S.reaction(ctx, theme, sec < LEN - 0.3 ? 'think' : 'joy', 400, 1380, sec < LEN - 0.3 ? S.seg(sec, 0.2, 0.8) : S.seg(sec, LEN - 0.3, LEN + 0.3));

  SPOTS.forEach(([x, y, s, good], i) => {
    const p = S.at(sec, s, s + 0.3);
    if (p <= 0) return;
    if (good) check(ctx, x + 120, y - 60, 90, p, C.forest, 11140 + i);
    else cross(ctx, x + 110, y - 70, 80, p, theme.accent, 11150 + i, 10);
  });
}

hook.cues = () => [
  ...[0, 1, 2, 3].map((sec) => ({ sec, sfx: 'tick', gain: 0.35 })),
  ...SPOTS.map(([, , s, good]) => ({ sec: s, sfx: good ? 'ding' : 'scratch', gain: 0.45 })),
];
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
