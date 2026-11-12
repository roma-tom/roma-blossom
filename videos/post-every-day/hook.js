// This video's own hook.
//
// The idea: a phone stamps a post onto every day of the month, faster and faster, while Roma
// Tom beside the calendar gets smaller and smaller, until the stamping is a blur and he's tiny.
// Frame one shows: the phone already slamming down on day one.
// Readable by 0.5 s: "Post every day? *No.*"
// The open loop: then how often, and why not every day?
//
// props: { label, line }

const { W, C, kicker, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const S = require('../../scripts/lib/stage.js');

const G = { x: 120, y: 700, cw: 120, ch: 108 }, DAYS = 30, START = 6, RUN = 3.4;

function cell(i) {
  const k = i + START;
  return { x: G.x + (k % 7) * G.cw, y: G.y + Math.floor(k / 7) * G.ch };
}

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  kicker(ctx, props.label || '', W / 2, 260, { seed: 12101 });
  headline(ctx, theme, props.line || '', { x: W / 2, y: 330, size: 124, maxW: 860, appear: S.at(sec, 0, 0.2), seed: 12102 });

  // How many days are stamped: slow at first, then a blur.
  const f = Math.min(1, (sec + 0.15) / RUN);
  const n = Math.min(DAYS, Math.floor(DAYS * f * f) + 1);

  // The calendar page.
  pen.shape(ctx, pen.roundRect(G.x - 20, G.y - 30, G.cw * 7 + 40, G.ch * 6 + 50, 16), { fill: C.card, width: 7, seed: 12103, offset: 0 });
  for (let i = 0; i < DAYS; i++) {
    const c = cell(i);
    const done = i < n;
    pen.shape(ctx, pen.roundRect(c.x + 6, c.y + 6, G.cw - 12, G.ch - 12, 10), { fill: done ? theme.mark : C.card, width: 3, seed: 12110 + i, offset: 0 });
    if (done) pen.shape(ctx, pen.roundRect(c.x + 42, c.y + 22, 36, 56, 8), { fill: C.ink, width: 3, seed: 12150 + i, offset: 0 });
  }

  // The phone slamming down on the newest day.
  const c = cell(n - 1), beat = (sec * (2 + 10 * f)) % 1;
  const lift = Math.abs(Math.sin(beat * Math.PI)) * 70;
  pen.shape(ctx, pen.roundRect(c.x + 30, c.y - 70 - lift, 60, 110, 14), { fill: C.ink, width: 5, seed: 12190, offset: 0 });
  pen.fill(ctx, pen.roundRect(c.x + 38, c.y - 60 - lift, 44, 86, 8), C.sky, { seed: 12191 });
  if (lift < 12) [-1, 1].forEach((d, i) => pen.line(ctx, [{ x: c.x + 48 + d * 50, y: c.y + 30 }, { x: c.x + 48 + d * 72, y: c.y + 14 }], { width: 6, color: theme.text, seed: 12192 + i }));

  // Roma Tom shrinks as the month fills up.
  const size = 420 - 300 * f;
  tomato(ctx, 'Roma Tom', W / 2, 1560 - size * 0.4, size, { squash: S.breathe(sec), angle: Math.sin(sec * 9) * 0.04 * f });
}

hook.cues = () => {
  const cues = [];
  for (let i = 0; i < 14; i++) cues.push({ sec: RUN * Math.sqrt(i / 14), sfx: 'tap', gain: 0.4 });
  return cues.concat([{ sec: RUN, sfx: 'boing', gain: 0.4 }]);
};
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
