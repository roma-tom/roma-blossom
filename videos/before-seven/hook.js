// This video's own hook.
//
// The idea: dawn, Roma Tom asleep in bed; on the nightstand the alarm clock says 6:12 and the
// phone lights up and buzzes across the table, text after text, faster and faster, until he
// bolts upright.
// Frame one shows: the phone already lit and buzzing, Roma Tom asleep with his zzz.
// Readable by 0.5 s: "6:12 am. The phone *buzzes*." over the dark room.
// The open loop: who's texting, and what broke?
//
// props: { label, line, time }

const { W, C, kicker, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const { text } = require('../../scripts/lib/marks.js');
const S = require('../../scripts/lib/stage.js');

const BUZZ = [0, 0.8, 1.4, 1.9, 2.3, 2.6, 2.85];
const WAKE = 3.0, STAND_Y = 1180, BED_Y = 1250;

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;

  // The window: night sky turning to dawn, with a moon going down.
  const dawn = S.at(sec, 0, 4);
  pen.shape(ctx, pen.roundRect(560, 560, 360, 330, 14), { fill: dawn > 0.5 ? C.butter : C.ink, width: 7, seed: 8101, offset: 0 });
  pen.line(ctx, [{ x: 740, y: 560 }, { x: 742, y: 890 }], { width: 6, seed: 8102 });
  pen.line(ctx, [{ x: 560, y: 725 }, { x: 920, y: 723 }], { width: 6, seed: 8103 });
  pen.shape(ctx, pen.ellipse(650, 640 + dawn * 60, 30, 30, 20), { fill: dawn > 0.5 ? C.card : C.butter, width: 4, seed: 8104, offset: 0 });

  kicker(ctx, props.label || '', W / 2, 260, { seed: 8105 });
  headline(ctx, theme, props.line || '', { x: W / 2, y: 330, size: 112, maxW: 860, appear: S.at(sec, 0, 0.2), seed: 8106 });

  // The bed, with Roma Tom asleep until the buzzing gets to him; then he bolts upright.
  const up = S.pop(sec, WAKE, 0.45);
  pen.shape(ctx, pen.roundRect(380, BED_Y - 30, 700, 260, 30), { fill: C.card, width: 7, seed: 8110, offset: 0 });
  pen.shape(ctx, pen.roundRect(860, BED_Y - 110, 200, 100, 40), { fill: C.card, width: 6, seed: 8111, offset: 0 });
  tomato(ctx, 'Roma Tom', 900 - up * 180, BED_Y - 150 - up * 130, 440, { angle: -1.35 * (1 - up), squash: up > 0 ? 1 : 1 + Math.sin(sec * 2) * 0.02 });
  pen.shape(ctx, [{ x: 400, y: BED_Y - 40 }, { x: 760 - up * 60, y: BED_Y - 60 }, { x: 780, y: BED_Y + 200 }, { x: 400, y: BED_Y + 200 }], { fill: C.blush, width: 7, seed: 8112, offset: 0 });
  if (sec < WAKE) [0, 1, 2].forEach((i) => {
    const ph = (sec * 0.7 + i / 3) % 1;
    text(ctx, 'z', 960 + ph * 40 + i * 6, BED_Y - 300 - ph * 160, { size: 46 + i * 10, alpha: 1 - ph, color: theme.soft });
  });
  if (sec >= WAKE) S.reaction(ctx, theme, 'shock', 720, BED_Y - 280, S.seg(sec, WAKE, WAKE + 0.4));

  // The nightstand, the alarm clock and the buzzing phone.
  pen.shape(ctx, pen.roundRect(40, STAND_Y, 320, 300, 14), { fill: C.card, width: 7, seed: 8120, offset: 0 });
  pen.shape(ctx, pen.roundRect(70, STAND_Y - 120, 170, 120, 18), { fill: C.ink, width: 6, seed: 8121, offset: 0 });
  text(ctx, props.time || '', 155, STAND_Y - 38, { size: 66, align: 'center', color: C.lime });
  const last = BUZZ.filter((b) => b <= sec).length - 1;
  const since = last >= 0 ? sec - BUZZ[last] : 9;
  const buzzing = since < 0.35;
  const px = 270 - Math.min(6, last + 1) * 6 + (buzzing ? Math.sin(sec * 90) * 7 : 0);
  ctx.save(); ctx.translate(px, STAND_Y - 18); ctx.rotate(-0.08);
  pen.shape(ctx, pen.roundRect(-80, -34, 160, 52, 12), { fill: C.ink, width: 4, seed: 8122, offset: 0 });
  pen.fill(ctx, pen.roundRect(-70, -27, 140, 38, 8), since < 1.2 ? C.card : C.muted, { seed: 8123 });
  ctx.restore();
  if (buzzing) [-1, 1].forEach((d, i) => pen.line(ctx, [{ x: px + d * 105, y: STAND_Y - 60 }, { x: px + d * 122, y: STAND_Y - 26 }, { x: px + d * 105, y: STAND_Y + 6 }], { width: 6, color: theme.text, seed: 8130 + i }));
  // A pile of unread message bubbles floating up from the phone.
  BUZZ.forEach((b, i) => {
    const k = S.pop(sec, b, 0.3);
    if (k <= 0) return;
    const bx = 120 + (i % 2) * 120, by = STAND_Y - 200 - i * 70;
    S.popIn(ctx, k, bx, by + 30, () => {
      pen.shape(ctx, pen.roundRect(bx - 90, by - 26, 180, 56, 26), { fill: C.card, width: 5, seed: 8140 + i, offset: 0 });
      pen.line(ctx, [{ x: bx - 60, y: by + 2 }, { x: bx + 40 - (i % 3) * 20, y: by + 2 }], { width: 6, color: C.muted, seed: 8150 + i });
    });
  });
}

hook.cues = () => [...BUZZ.map((sec) => ({ sec, sfx: 'blip', gain: 0.45 })), { sec: WAKE, sfx: 'boing', gain: 0.5 }];
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
