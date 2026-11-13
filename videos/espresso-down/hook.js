// This video's own hook.
//
// The idea: Saturday morning, a line out the door, and the espresso machine starts shaking,
// its pressure needle spinning, puffing smoke, until it goes BANG and the whole line flinches.
// Frame one shows: the machine already rattling, the needle already climbing.
// Readable by 0.5 s: "7:02 am. *Bang.*"
// The open loop: what does the cafe do now, with a line out the door?
//
// props: { label, line }

const { W, C, kicker, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const S = require('../../scripts/lib/stage.js');

const BANG = 2.3, COUNTER = 1300;
const M = { x: 300, y: 820, w: 480, h: 420 };
const LINE = [['Maria', 160], ['Leo', 380], ['Ana', 600], ['Priya', 820]];

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  kicker(ctx, props.label || '', W / 2, 260, { seed: 14101 });
  headline(ctx, theme, props.line || '', { x: W / 2, y: 330, size: 124, maxW: 860, appear: S.at(sec, 0, 0.2), seed: 14102 });

  // Smoke puffs rising from the machine, thicker as it builds, a big cloud at the bang.
  const banged = sec >= BANG;
  for (let i = 0; i < 10; i++) {
    const start = 0.6 + i * 0.22;
    if (sec < start) continue;
    const ph = ((sec - start) * 0.8) % 1, r = 26 + (i % 3) * 12 + ph * 30;
    pen.shape(ctx, pen.ellipse(M.x + 80 + ((i * 113) % 320), M.y - 20 - ph * 260, r, r * 0.85, 18), { fill: C.card, width: 4, seed: 14110 + i, offset: 0, alpha: 1 - ph });
  }
  if (banged) {
    const k = S.pop(sec, BANG, 0.35), fade = 1 - S.seg(sec, BANG + 0.6, BANG + 1.6);
    if (fade > 0) [[-150, -60, 120], [0, -120, 150], [150, -50, 120]].forEach(([dx, dy, r], i) =>
      pen.shape(ctx, pen.ellipse(M.x + M.w / 2 + dx, M.y + dy, r * k, r * 0.8 * k, 24), { fill: C.card, width: 6, seed: 14130 + i, offset: 0, alpha: fade }));
  }

  // The machine, shaking harder until the bang, then slumped and still.
  const shake = banged ? 0 : Math.sin(sec * 60) * 10 * S.at(sec, 0, BANG, (x) => x);
  ctx.save(); ctx.translate(shake, banged ? 6 : 0); ctx.rotate(banged ? -0.03 : 0);
  pen.shape(ctx, pen.roundRect(M.x, M.y, M.w, M.h, 24), { fill: C.rose, width: 7, seed: 14140, offset: 0 });
  pen.shape(ctx, pen.roundRect(M.x + 30, M.y + 30, M.w - 60, 110, 14), { fill: C.card, width: 5, seed: 14141, offset: 0 });
  // The pressure gauge, its needle climbing into the red.
  const gx = M.x + M.w / 2, gy = M.y + 85, a = -2.4 + (banged ? 4.6 : 4.4 * S.at(sec, 0, BANG, (x) => x * x));
  pen.shape(ctx, pen.ellipse(gx, gy, 44, 44, 24), { fill: C.card, width: 5, seed: 14142, offset: 0 });
  pen.line(ctx, [{ x: gx, y: gy }, { x: gx + Math.cos(a - Math.PI / 2) * 36, y: gy + Math.sin(a - Math.PI / 2) * 36 }], { width: 5, color: C.rose, seed: 14143 });
  // Two group heads with cups under them.
  [M.x + 130, M.x + M.w - 130].forEach((x, i) => {
    pen.shape(ctx, pen.roundRect(x - 50, M.y + 200, 100, 60, 10), { fill: C.ink, width: 4, seed: 14150 + i, offset: 0 });
    S.cup(ctx, x, M.y + M.h - 20, 0.7);
  });
  ctx.restore();
  if (banged) S.flash(ctx, 1 - S.seg(sec, BANG, BANG + 0.3));

  // The line of guests at the counter, flinching at the bang.
  S.counter(ctx, COUNTER);
  LINE.forEach(([name, x], i) => {
    const j = S.jump(sec, BANG + 0.03 * i, 80);
    tomato(ctx, name, x, 1560 - j.hop, 300, { squash: j.squash, angle: banged ? (i % 2 ? 0.12 : -0.12) * (1 - S.seg(sec, BANG + 0.6, BANG + 1.2)) : Math.sin(sec * 2 + i) * 0.04 });
  });
  if (banged) S.reaction(ctx, theme, 'shock', 380, 1520, S.seg(sec, BANG, BANG + 0.4));
}

hook.cues = () => [
  { sec: 0, sfx: 'tick', gain: 0.3 }, { sec: 0.6, sfx: 'tick', gain: 0.35 }, { sec: 1.1, sfx: 'tick', gain: 0.4 },
  { sec: 1.5, sfx: 'tick', gain: 0.45 }, { sec: 1.8, sfx: 'tick', gain: 0.5 }, { sec: 2.05, sfx: 'tick', gain: 0.55 },
  { sec: BANG, sfx: 'boing', gain: 0.7 }, { sec: BANG + 0.05, sfx: 'scratch', gain: 0.5 },
];
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
