// This video's own hook.
//
// The idea: Roma Tom split down the middle: his year-one half shakes and sweats while sticky
// notes and empty coffee cups pile up around him; his year-ten half breathes easy beside one
// short checklist that ticks itself off.
// Frame one shows: the left half already jittering, the first sticky notes slapping on.
// Readable by 0.5 s: "Year 1 vs *year 10*" over the two halves, labelled YEAR 1 and YEAR 10.
// The open loop: what changed between the two?
//
// props: { label, line, left, right }

const { W, C, kicker, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const { check } = require('../../scripts/lib/marks.js');
const S = require('../../scripts/lib/stage.js');

const MID = W / 2, BODY_Y = 1170, SIZE = 820, COUNTER = 1420;

// Sticky notes on the year-one side: [x, y, angle, color, appears at second].
const NOTES = [
  [150, 700, -0.18, C.butter, 0.0], [370, 640, 0.12, C.card, 0.15], [110, 950, 0.1, C.blush, 0.35],
  [300, 820, -0.06, C.butter, 0.55], [130, 1200, -0.14, C.card, 0.8], [260, 1060, 0.2, C.butter, 1.05],
  [460, 760, 0.08, C.blush, 1.3], [250, 1290, -0.2, C.card, 1.6], [60, 560, 0.05, C.blush, 1.9],
];
// Cups stacking on the counter: [x, appears at second].
const CUPS = [[200, 0.4], [320, 1.2], [440, 2.0]];

function note(ctx, x, y, a, color, k, seed) {
  S.popIn(ctx, k, x, y, () => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    pen.shape(ctx, pen.roundRect(-70, -70, 140, 140, 8), { fill: color, width: 5, seed, offset: 0 });
    [-28, 0, 28].forEach((dy, i) => pen.line(ctx, [{ x: -44, y: dy }, { x: 30 - i * 14, y: dy + 2 }], { width: 5, color: C.muted, seed: seed + 1 + i }));
    ctx.restore();
  });
}

function clip(ctx, x0, x1, fn) {
  ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, 1920); ctx.clip(); fn(); ctx.restore();
}

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3.5;

  kicker(ctx, props.label || '', MID, 260, { seed: 4101 });
  headline(ctx, theme, props.line || '', { x: MID, y: 340, size: 118, maxW: 860, appear: S.at(sec, 0, 0.2), seed: 4102 });

  // The year-one side: notes slapping on, then cups piling up on the counter.
  NOTES.forEach(([x, y, a, color, s0], i) => note(ctx, x, y, a + Math.sin(sec * 7 + i) * 0.03, color, S.pop(sec, s0, 0.25), 4110 + i * 5));

  // The year-ten side: one short checklist, ticking itself off.
  const cx = 840, cy = 760;
  S.popIn(ctx, S.pop(sec, 0.1, 0.35), cx, cy, () => {
    pen.shape(ctx, pen.roundRect(cx - 120, cy - 160, 240, 320, 14), { fill: C.card, width: 6, seed: 4160, offset: 0 });
    [-90, 0, 90].forEach((dy, i) => {
      pen.shape(ctx, pen.roundRect(cx - 92, cy + dy - 26, 52, 52, 8), { fill: C.card, width: 5, seed: 4161 + i, offset: 0 });
      pen.line(ctx, [{ x: cx - 20, y: cy + dy + 4 }, { x: cx + 84, y: cy + dy }], { width: 5, color: C.muted, seed: 4165 + i });
      check(ctx, cx - 64, cy + dy, 56, S.at(sec, 0.8 + i * 0.7, 1.15 + i * 0.7), C.forest, 4170 + i);
    });
  });

  // Roma Tom, split down the middle. Left: jittery and sweating. Right: calm and breathing.
  const shake = Math.sin(sec * 38) * 6;
  clip(ctx, -50, MID, () => {
    tomato(ctx, 'Roma Tom', MID + shake, BODY_Y, SIZE, { squash: 1.03 + Math.sin(sec * 22) * 0.02, angle: -0.03 + Math.sin(sec * 31) * 0.015 });
    S.reaction(ctx, theme, 'sweat', MID - 330, BODY_Y - 40, S.seg(sec, 0.3, 1.0));
  });
  clip(ctx, MID, W + 50, () => {
    tomato(ctx, 'Roma Tom', MID, BODY_Y, SIZE, { squash: S.breathe(sec * 0.6), angle: Math.sin(sec * 1.4) * 0.02 });
    S.reaction(ctx, theme, 'joy', MID + 80, BODY_Y + 120, S.seg(sec, 2.6, 3.4));
  });
  // The seam between the two years.
  pen.line(ctx, [{ x: MID, y: 520 }, { x: MID + 4, y: 1000 }, { x: MID - 3, y: COUNTER }], { width: 6, color: theme.text, seed: 4190 });

  // The counter, with the year-one coffee cups stacking up.
  S.counter(ctx, COUNTER);
  CUPS.forEach(([x, s0], i) => S.popIn(ctx, S.pop(sec, s0, 0.3), x, COUNTER, () => S.cup(ctx, x, COUNTER, 0.75)));

  // The two labels.
  S.popIn(ctx, S.pop(sec, 0.05, 0.3), 270, 1490, () => kicker(ctx, props.left || '', 270, 1490, { seed: 4195 }));
  S.popIn(ctx, S.pop(sec, 0.15, 0.3), 810, 1490, () => kicker(ctx, props.right || '', 810, 1490, { seed: 4196 }));
}

hook.cues = () => [
  ...NOTES.map(([, , , , s]) => ({ sec: s, sfx: 'tap', gain: 0.35 })),
  ...CUPS.map(([, s]) => ({ sec: s, sfx: 'clink', gain: 0.3 })),
  { sec: 1.0, sfx: 'tick', gain: 0.35 }, { sec: 1.7, sfx: 'tick', gain: 0.35 }, { sec: 2.4, sfx: 'tick', gain: 0.35 },
  { sec: 2.7, sfx: 'chime', gain: 0.4 },
];
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
