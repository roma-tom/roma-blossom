// This video's own hook.
//
// The idea: 6:12 am, Roma Tom asleep in bed; the phone on the nightstand is already buzzing
// itself across the wood, lit up, its badge counting up, and Dev's text pops out of it in a
// bubble. Roma Tom jolts awake.
// Frame one shows: the phone mid-buzz, shaking with motion lines, the clock reading 6:12.
// Readable by 0.5 s: "Owners, 6:12 am. *Buzz.*" and Dev's message.
// The open loop: what else lands before seven?
//
// props: { label, line, time, message }

const { W, C, kicker, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const { text, bubble } = require('../../scripts/lib/marks.js');
const S = require('../../scripts/lib/stage.js');

const BED_Y = 1240, STAND = { x: 600, y: 1120, w: 420 };
const BUZZES = [0.0, 0.7, 1.35, 1.95, 2.5];

function phoneOnStand(ctx, theme, x, y, sec, count) {
  // Buzzing: a fast shake while a buzz is on, with motion lines either side.
  const on = BUZZES.some((b) => sec >= b && sec < b + 0.4);
  const dx = on ? Math.sin(sec * 90) * 10 : 0, a = on ? Math.sin(sec * 70) * 0.06 : 0;
  ctx.save(); ctx.translate(x + dx, y); ctx.rotate(a);
  pen.shape(ctx, pen.roundRect(-90, -26, 180, 40, 14), { fill: C.ink, width: 5, seed: 5101, offset: 0 });
  pen.fill(ctx, pen.roundRect(-78, -22, 156, 30, 10), on ? C.butter : C.card, { seed: 5102 });
  ctx.restore();
  if (on) {
    [-1, 1].forEach((s, i) => [0, 1].forEach((j) =>
      pen.line(ctx, [{ x: x + s * (112 + j * 22), y: y - 30 + j * 6 }, { x: x + s * (112 + j * 22), y: y + 10 - j * 6 }], { width: 5, color: theme.text, seed: 5110 + i * 2 + j })));
  }
  // The unread badge.
  if (count > 0) {
    const k = S.pop(sec, BUZZES[count - 1], 0.25);
    S.popIn(ctx, k, x + 80, y - 40, () => {
      pen.shape(ctx, pen.ellipse(x + 80, y - 40, 30, 30, 24), { fill: C.rose, width: 4, seed: 5120 + count, offset: 0 });
      text(ctx, String(count), x + 80, y - 26, { font: 'Inter', weight: 800, size: 34, align: 'center', color: C.card });
    });
  }
}

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3.5;
  const count = BUZZES.filter((b) => sec >= b).length;

  kicker(ctx, props.label || '', W / 2, 260, { seed: 5001 });
  headline(ctx, theme, props.line || '', { x: W / 2, y: 330, size: 116, maxW: 820, appear: S.at(sec, 0, 0.2), seed: 5002 });

  // Dev's message, popping out of the phone, with Dev as the sender.
  const bx = 130, by = 520, bw = 800, bh = 330;
  S.popIn(ctx, S.pop(sec, 0.1, 0.35), STAND.x + 280, STAND.y - 60, () => {
    bubble(ctx, bx, by, bw, bh, STAND.x + 280, STAND.y - 70, C.card, 5010);
    tomato(ctx, 'Dev', bx + 120, by + 150, 230, { angle: Math.sin(sec * 3) * 0.04 });
    headline(ctx, { ...theme, swash: C.lime }, props.message || '', { x: bx + bw / 2 + 70, y: by + 60, size: 70, maxW: bw - 250, seed: 5011 });
  });

  // The nightstand, with the alarm clock and the phone.
  pen.shape(ctx, pen.roundRect(STAND.x, STAND.y, STAND.w, 460, 12), { fill: C.card, width: 6, seed: 5030, offset: 0 });
  pen.line(ctx, [{ x: STAND.x + 30, y: STAND.y + 160 }, { x: STAND.x + STAND.w - 30, y: STAND.y + 164 }], { width: 4, color: C.line, seed: 5031 });
  pen.shape(ctx, pen.ellipse(STAND.x + STAND.w / 2, STAND.y + 90, 22, 12, 16), { fill: C.line, width: 4, seed: 5032, offset: 0 });
  // Alarm clock: a box with the time on it.
  pen.shape(ctx, pen.roundRect(STAND.x + 20, STAND.y - 110, 170, 110, 22), { fill: C.ink, width: 5, seed: 5040, offset: 0 });
  text(ctx, props.time || '', STAND.x + 105, STAND.y - 35, { font: 'Inter', weight: 800, size: 54, align: 'center', color: C.rose });
  phoneOnStand(ctx, theme, STAND.x + 300, STAND.y - 14, sec, count);

  // The bed: pillow, Roma Tom, blanket over him.
  pen.shape(ctx, pen.roundRect(40, BED_Y - 230, 440, 150, 60), { fill: C.card, width: 6, seed: 5050, offset: 0 });
  const wake = S.jump(sec, 0.45, 90);
  const sink = 1 - S.at(sec, 0.35, 0.6);
  tomato(ctx, 'Roma Tom', 300, BED_Y - 20 + sink * 80 - wake.hop, 520, { squash: wake.squash, angle: -0.12 + Math.sin(sec * 2) * 0.02 });
  S.reaction(ctx, theme, 'shock', 300, BED_Y - 180 - wake.hop, S.seg(sec, 0.5, 0.9));
  S.reaction(ctx, theme, 'sweat', 300, BED_Y - 120, S.seg(sec, 1.6, 2.4));
  pen.shape(ctx, [{ x: -40, y: BED_Y + 60 }, { x: 560, y: BED_Y + 45 }, { x: 610, y: 1980 }, { x: -40, y: 1980 }], { fill: C.blush, width: 7, seed: 5060, offset: 0 });
  [0, 1, 2].forEach((i) => pen.line(ctx, [{ x: 20 + i * 180, y: BED_Y + 150 }, { x: 80 + i * 180, y: BED_Y + 380 }], { width: 4, color: C.tomato, seed: 5061 + i }));
}

hook.cues = () => [
  ...BUZZES.map((s) => ({ sec: s, sfx: 'blip', gain: 0.45 })),
  { sec: 0.1, sfx: 'pop', gain: 0.4 },
  { sec: 0.45, sfx: 'boing', gain: 0.4 },
];
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
