// This video's own hook.
//
// The idea: Roma Tom finally sits down with a coffee in a dead-empty cafe while the wall clock
// ticks from 2:04 to 2:05, and the door bursts open on a line of tomatoes pouring in.
// Frame one shows: Roma Tom mid-sip behind the counter, steam rising, the clock hand already moving.
// Readable by 0.5 s: "2:04 empty. 2:05 *bus tour.*" over the quiet room.
// The open loop: what does the next ten minutes look like?
//
// props: { label, line }

const { W, C, kicker, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const S = require('../../scripts/lib/stage.js');

const FLOOR = 1520, BURST = 3.1, CTR = 1250;
const CROWD = [['Ana', 0.0, 330], ['Leo', 0.18, 280], ['Priya', 0.34, 330], ['Ivan', 0.5, 270], ['Maria', 0.66, 310]];
const STOPS = [330, 470, 610, 150, 760];

function door(ctx, theme, open) {
  pen.shape(ctx, pen.roundRect(40, 820, 250, FLOOR - 820, 12), { fill: open > 0.5 ? C.ink : C.card, width: 6, seed: 3310, offset: 0, alpha: 1 });
  if (open < 0.5) pen.shape(ctx, pen.roundRect(80, 860, 170, 240, 10), { fill: C.sky, width: 5, seed: 3311, offset: 0 });
}

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3.5;
  kicker(ctx, props.label || '', W / 2, 260, { seed: 3301 });
  headline(ctx, theme, props.line || '', { x: 520, y: 390, size: 104, maxW: 860, appear: S.at(sec, 0, 0.2), seed: 3302 });

  // The wall clock: 2:04 for the whole quiet stretch, then the minute hand jumps to 2:05.
  const jumped = S.at(sec, BURST - 0.15, BURST + 0.1);
  const min = 4 + jumped + Math.sin(sec * 9) * 0.04;
  S.clock(ctx, theme, 860, 790, 110, 2, min, 1, 3320);

  door(ctx, theme, jumped);
  pen.shape(ctx, [{ x: -40, y: FLOOR }, { x: 1120, y: FLOOR - 4 }, { x: 1120, y: 1980 }, { x: -40, y: 1980 }], { fill: C.line, width: 6, seed: 3322, offset: 0 });

  // Roma Tom behind the counter with his coffee, taking a sip, bobbing gently.
  const sip = Math.sin(sec * 3.2) * 0.04;
  tomato(ctx, 'Roma Tom', 700, 1150, 520, { squash: S.breathe(sec), angle: -0.05 + sip });
  pen.shape(ctx, [{ x: 440, y: CTR + 60 }, { x: 1120, y: CTR + 54 }, { x: 1120, y: FLOOR + 40 }, { x: 440, y: FLOOR + 40 }], { fill: C.card, width: 6, seed: 3323, offset: 0 });
  S.cup(ctx, 640, CTR + 60, 0.9);
  S.reaction(ctx, theme, jumped > 0.2 ? 'shock' : 'think', 700, 1130, jumped > 0.2 ? S.seg(sec, BURST, BURST + 0.4) : S.seg(sec, 0.2, 0.6));

  // The bus tour pours in through the door.
  CROWD.forEach(([name, delay, size], i) => {
    const a = BURST + 0.05 + delay;
    if (sec < a) return;
    const w = S.walk(sec, 160, STOPS[i], a, a + 1.0, FLOOR - 40);
    tomato(ctx, name, w.x, w.y - size * 0.25, size, { squash: S.breathe(sec + i), angle: w.angle });
  });
}

hook.cues = () => [
  { sec: 0, sfx: 'tick', gain: 0.3 }, { sec: 0.6, sfx: 'tick', gain: 0.3 }, { sec: 1.2, sfx: 'tick', gain: 0.3 }, { sec: 1.8, sfx: 'tick', gain: 0.3 },
  { sec: 3.1, sfx: 'boing', gain: 0.5 }, { sec: 3.2, sfx: 'pop', gain: 0.4 }, { sec: 3.4, sfx: 'pop', gain: 0.4 }, { sec: 3.6, sfx: 'pop', gain: 0.4 },
];
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
