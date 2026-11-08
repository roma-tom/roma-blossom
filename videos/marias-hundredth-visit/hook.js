// This video's own hook.
//
// The idea: Maria stands at an empty counter on her very first visit, tapping the bell again and
// again while the wall clock's hands spin; nobody comes, and she turns toward the door.
// Frame one shows: Maria mid-tap, the bell shaking, the clock already spinning.
// Readable by 0.5 s: her line, "Um, hello? Is anyone *working*?", and the label MARIA'S FIRST
// VISIT.    The open loop: does she walk out? (She doesn't, and becomes a regular.)
//
// props: { label, line }

const { W, C, kicker, tomato, pen } = require('../../scripts/lib/kit.js');
const S = require('../../scripts/lib/stage.js');

const TOP = 1170, FLOOR = 1520, BELL = { x: 860, y: TOP }, TAPS = [0.05, 0.6, 1.15];

function door(ctx, theme, open) {
  pen.shape(ctx, pen.roundRect(40, 820, 250, FLOOR - 820, 12), { fill: C.card, width: 6, seed: 3210, offset: 0 });
  pen.shape(ctx, pen.roundRect(80, 860, 170, 240, 10), { fill: C.sky, width: 5, seed: 3211, offset: 0, alpha: 0.9 });
  pen.shape(ctx, pen.ellipse(250, 1190, 16 + 4 * open, 16 + 4 * open, 16), { fill: theme.text, width: 0, seed: 3212, offset: 0 });
}

function counter(ctx) {
  pen.shape(ctx, [{ x: -40, y: FLOOR }, { x: 1120, y: FLOOR - 4 }, { x: 1120, y: 1980 }, { x: -40, y: 1980 }], { fill: C.line, width: 6, seed: 3222, offset: 0 });
  pen.shape(ctx, [{ x: 640, y: TOP - 30 }, { x: 1120, y: TOP - 36 }, { x: 1120, y: TOP + 14 }, { x: 640, y: TOP + 20 }], { fill: C.card, width: 6, seed: 3223, offset: 0 });
  pen.shape(ctx, [{ x: 670, y: TOP + 20 }, { x: 1120, y: TOP + 14 }, { x: 1120, y: FLOOR }, { x: 670, y: FLOOR }], { fill: C.card, width: 6, seed: 3220, offset: 0 });
  pen.line(ctx, [{ x: 700, y: TOP + 120 }, { x: 1120, y: TOP + 116 }], { width: 4, color: C.line, seed: 3221 });
}

function bell(ctx, theme, x, y, shake, ring) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(Math.sin(shake * 40) * 0.12 * shake);
  pen.shape(ctx, pen.ellipse(0, -8, 70, 14, 24), { fill: C.ink, width: 4, seed: 3230, offset: 0 });
  const dome = [];
  for (let i = 0; i <= 16; i++) { const a = Math.PI + (Math.PI * i) / 16; dome.push({ x: Math.cos(a) * 58, y: -14 + Math.sin(a) * 60 }); }
  pen.shape(ctx, dome, { fill: C.butter, width: 5, seed: 3231, offset: 0 });
  pen.line(ctx, [{ x: 0, y: -74 }, { x: 0, y: -94 - 12 * (1 - shake) }], { width: 9, seed: 3232 });
  ctx.restore();
  if (ring > 0) [-0.9, -0.5, 0.5, 0.9].forEach((a, i) => {
    const r0 = 110, r1 = 110 + 50 * ring;
    pen.line(ctx, [{ x: x + r0 * Math.sin(a), y: y - 60 - r0 * Math.cos(a) }, { x: x + r1 * Math.sin(a), y: y - 60 - r1 * Math.cos(a) }],
      { width: 7, color: theme.accent, seed: 3240 + i, alpha: 1 - ring * 0.6 });
  });
}

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3;

  kicker(ctx, props.label || '', W / 2, 250, { seed: 3201 });

  // The wall clock, spinning: time passing with nobody coming.
  const mins = 8 * 60 + sec * 420;
  S.clock(ctx, theme, 870, 880, 100, Math.floor(mins / 60), mins % 60, 1, 3250);

  door(ctx, theme, S.at(sec, 1.9, 2.4));
  counter(ctx);

  let shake = 0, ring = 0;
  TAPS.forEach((a) => { shake = Math.max(shake, 1 - S.seg(sec, a, a + 0.4)); ring = Math.max(ring, S.seg(sec, a, a + 0.35) * (sec < a + 0.35 ? 1 : 0)); });
  if (sec < TAPS[0]) shake = 0;
  bell(ctx, theme, BELL.x, BELL.y - 30, shake, ring);

  // Maria leans in to tap, waits, then turns toward the door.
  const lean = TAPS.reduce((m, a) => Math.max(m, Math.sin(Math.PI * S.seg(sec, a - 0.05, a + 0.25))), 0);
  const w = S.walk(sec, 470, 380, 1.9, 2.7, 1330);
  const mx = w.x + lean * 30;
  const angle = sec < 1.9 ? 0.06 + lean * 0.14 : -0.1 + w.angle;
  tomato(ctx, 'Maria', mx, w.y - 20, 580, { squash: S.breathe(sec), angle });
  S.reaction(ctx, theme, sec < 1.9 ? 'think' : 'sweat', mx, w.y - 60, S.seg(sec, 1.3, 1.9));

  // Her line, in a bubble over her head, readable from the start.
  S.say(ctx, props.line || '', { x: 110, y: 380, w: 820, tx: mx - 40, ty: w.y - 290, k: S.pop(sec, 0, 0.3), size: 92, seed: 3260 });
}

hook.cues = () => [
  ...TAPS.map((sec) => ({ sec, sfx: 'ding', gain: 0.5 })),
  { sec: 0.3, sfx: 'tick', gain: 0.3 }, { sec: 0.9, sfx: 'tick', gain: 0.3 }, { sec: 1.5, sfx: 'tick', gain: 0.3 },
  { sec: 1.95, sfx: 'swish', gain: 0.35 },
];
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
