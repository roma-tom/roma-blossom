// This video's own hook.
//
// The idea: closing time. The lamps click off one by one, Roma Tom flips the door sign from
// OPEN to CLOSED and finally exhales, and then a knock: Leo's face squashed against the glass.
// Frame one shows: the first lamp clicking off, the room already dimming.
// Readable by 0.5 s: "Closed. *Almost.*" over the dimming cafe.
// The open loop: does Leo get his coffee, and what happens in the hour after close?
//
// props: { label, line, open, closed }

const { W, C, kicker, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const { text } = require('../../scripts/lib/marks.js');
const S = require('../../scripts/lib/stage.js');

const LAMPS = [[200, 0.15], [540, 0.55], [880, 0.95]];
const FLIP = 1.4, KNOCK = 2.3, FLOOR = 1500;
const DOOR = { x: 580, y: 720, w: 340, h: FLOOR - 720 };

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;

  // The room dims with each lamp that goes off.
  const off = LAMPS.filter(([, s]) => sec >= s).length;
  ctx.save(); ctx.globalAlpha = 0.06 * off; ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, 1920); ctx.restore();

  LAMPS.forEach(([x, s], i) => {
    pen.line(ctx, [{ x, y: 470 }, { x, y: 560 }], { width: 4, color: theme.soft, seed: 9101 + i });
    pen.shape(ctx, [{ x: x - 60, y: 560 }, { x: x + 60, y: 560 }, { x: x + 90, y: 630 }, { x: x - 90, y: 630 }], { fill: C.ink, width: 4, seed: 9105 + i, offset: 0 });
    pen.shape(ctx, pen.ellipse(x, 640, 26, 18, 16), { fill: sec >= s ? C.muted : C.butter, width: 4, seed: 9110 + i, offset: 0 });
  });

  kicker(ctx, props.label || '', W / 2, 260, { seed: 9120 });
  headline(ctx, theme, props.line || '', { x: W / 2, y: 320, size: 120, maxW: 860, appear: S.at(sec, 0, 0.2), seed: 9121 });

  // The door, rattling when Leo knocks.
  const rattle = sec > KNOCK && sec < KNOCK + 0.5 ? Math.sin(sec * 80) * 6 : 0;
  ctx.save(); ctx.translate(rattle, 0);
  pen.shape(ctx, pen.roundRect(DOOR.x, DOOR.y, DOOR.w, DOOR.h, 12), { fill: C.card, width: 7, seed: 9130, offset: 0 });
  const g = { x: DOOR.x + 40, y: DOOR.y + 40, w: DOOR.w - 80, h: 380 };
  pen.shape(ctx, pen.roundRect(g.x, g.y, g.w, g.h, 10), { fill: C.ink, width: 5, seed: 9131, offset: 0 });
  // Leo pressed to the glass, squashed, after the knock.
  if (sec > KNOCK) {
    ctx.save(); ctx.beginPath(); ctx.rect(g.x, g.y, g.w, g.h); ctx.clip();
    const k = S.pop(sec, KNOCK, 0.3);
    tomato(ctx, 'Leo', g.x + g.w / 2, g.y + 230 + (1 - k) * 300, 300, { squash: 1.25 });
    ctx.restore();
    S.reaction(ctx, theme, 'sweat', g.x + g.w / 2 + 20, g.y + 220, S.seg(sec, KNOCK + 0.2, KNOCK + 0.8));
  }
  // The sign hangs inside the glass and flips over.
  const fl = S.at(sec, FLIP, FLIP + 0.35);
  const sx = Math.abs(Math.cos(fl * Math.PI)), word = fl < 0.5 ? props.open : props.closed;
  const sy = g.y + g.h + 90;
  pen.line(ctx, [{ x: DOOR.x + DOOR.w / 2 - 50, y: sy - 60 }, { x: DOOR.x + DOOR.w / 2, y: sy - 100 }, { x: DOOR.x + DOOR.w / 2 + 50, y: sy - 60 }], { width: 4, seed: 9132 });
  ctx.save(); ctx.translate(DOOR.x + DOOR.w / 2, sy); ctx.scale(Math.max(0.05, sx), 1);
  pen.shape(ctx, pen.roundRect(-120, -60, 240, 110, 14), { fill: fl < 0.5 ? C.lime : C.blush, width: 5, seed: 9133, offset: 0 });
  text(ctx, word || '', 0, 18, { size: 56, align: 'center' });
  ctx.restore();
  pen.shape(ctx, pen.ellipse(DOOR.x + 50, DOOR.y + DOOR.h / 2 + 140, 14, 14, 14), { fill: C.butter, width: 4, seed: 9134, offset: 0 });
  ctx.restore();

  // Roma Tom: reaches to flip the sign, exhales, then turns at the knock.
  const lean = sec < FLIP + 0.4 ? 0.12 * S.at(sec, FLIP - 0.4, FLIP) : 0.12 * (1 - S.at(sec, FLIP + 0.4, FLIP + 0.8));
  const j = S.jump(sec, KNOCK, 70);
  tomato(ctx, 'Roma Tom', 320, 1260 - j.hop, 560, { squash: j.squash, angle: lean });
  if (sec > FLIP + 0.5 && sec < KNOCK) S.reaction(ctx, theme, 'joy', 320, 1180, S.seg(sec, FLIP + 0.5, FLIP + 1.0));
  if (sec >= KNOCK) S.reaction(ctx, theme, 'shock', 320, 1180, S.seg(sec, KNOCK, KNOCK + 0.4));
  pen.line(ctx, [{ x: -40, y: FLOOR }, { x: 1120, y: FLOOR - 4 }], { width: 7, seed: 9140 });
}

hook.cues = () => [
  ...LAMPS.map(([, s]) => ({ sec: s, sfx: 'tick', gain: 0.5 })),
  { sec: FLIP, sfx: 'swish', gain: 0.4 },
  { sec: KNOCK, sfx: 'tap', gain: 0.7 }, { sec: KNOCK + 0.15, sfx: 'tap', gain: 0.7 }, { sec: KNOCK + 0.3, sfx: 'tap', gain: 0.7 },
];
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
