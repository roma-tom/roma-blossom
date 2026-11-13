// This video's own hook.
//
// The idea: the cafe's three pendant lamps click off one by one and the sign on the glass door
// flips from OPEN to CLOSED, and then a guest bumps right up against the glass, squashed flat,
// knocking, with "Just one coffee? Please?"
// Frame one shows: the first lamp clicking off and the door sign already mid-flip.
// Readable by 0.5 s: CLOSING TIME on the pill and CLOSED on the door.
// The open loop: does the owner let him in, and what happens in the hour after the sign flips?
//
// props: { label, open, closed, quote, guest }

const { W, C, kicker, tomato, pen } = require('../../scripts/lib/kit.js');
const { text } = require('../../scripts/lib/marks.js');
const S = require('../../scripts/lib/stage.js');

const LAMPS = [{ x: 170, off: 0.05 }, { x: 540, off: 0.2 }, { x: 910, off: 0.35 }];
const BULB_Y = 400, FLIP = [0.0, 0.32], BUMP = 0.42, KNOCKS = [0.75, 0.95], BUBBLE = 0.5;
const DOOR = { x: 250, y: 560, w: 580, h: 1000 };

function lamp(ctx, theme, x, on, i) {
  pen.line(ctx, [{ x, y: -20 }, { x, y: BULB_Y - 70 }], { width: 5, seed: 7010 + i });
  // The shade: a little wobbly cone.
  pen.shape(ctx, [{ x: x - 30, y: BULB_Y - 76 }, { x: x + 30, y: BULB_Y - 76 }, { x: x + 76, y: BULB_Y - 10 }, { x: x - 76, y: BULB_Y - 10 }],
    { fill: C.tomato, width: 6, seed: 7020 + i, offset: 0 });
  pen.shape(ctx, pen.ellipse(x, BULB_Y + 8, 28, 24, 18), { fill: on ? C.butter : C.line, width: 5, seed: 7030 + i, offset: 0 });
  if (on > 0) {
    // Doodled light rays under a lit bulb.
    [-0.9, -0.45, 0, 0.45, 0.9].forEach((a, j) => {
      const r0 = 52, r1 = 52 + 46 * on;
      pen.line(ctx, [{ x: x + Math.sin(a) * r0, y: BULB_Y + 8 + Math.cos(a) * r0 }, { x: x + Math.sin(a) * r1, y: BULB_Y + 8 + Math.cos(a) * r1 }],
        { width: 5, color: theme.soft, seed: 7040 + i * 10 + j });
    });
  }
}

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3;
  const d = DOOR;

  // The lamps, clicking off one at a time.
  LAMPS.forEach((l, i) => lamp(ctx, theme, l.x, sec < l.off ? 1 : 0, i));
  kicker(ctx, props.label || '', W / 2, 262, { seed: 7001 });

  // The glass door: frame, glass, handle.
  pen.shape(ctx, pen.roundRect(d.x, d.y, d.w, d.h, 18), { fill: C.card, width: 7, seed: 7101, offset: 0 });
  pen.shape(ctx, pen.roundRect(d.x + 40, d.y + 40, d.w - 80, d.h - 120, 12), { fill: C.sky, width: 5, seed: 7102, offset: 0 });
  pen.line(ctx, [{ x: d.x + 120, y: d.y + 120 }, { x: d.x + 200, y: d.y + 40 + 0 }], { width: 5, color: C.card, seed: 7103 });
  pen.line(ctx, [{ x: d.x + 110, y: d.y + 220 }, { x: d.x + 280, y: d.y + 50 }], { width: 5, color: C.card, seed: 7104 });
  pen.shape(ctx, pen.roundRect(d.x + d.w - 76, d.y + d.h / 2 + 40, 22, 120, 10), { fill: C.line, width: 5, seed: 7105, offset: 0 });

  // The guest, outside, bumping right up against the glass and squashing flat on it.
  const g = S.pop(sec, BUMP, 0.35);
  if (g > 0) {
    const knock = KNOCKS.reduce((s, k) => s + Math.max(0, Math.sin(Math.PI * S.seg(sec, k, k + 0.14))), 0);
    tomato(ctx, props.guest || 'Leo', 590, 1330, 460, { scale: g, squash: 1.22 + 0.06 * knock });
    // Knock lines beside the glass.
    KNOCKS.forEach((k, i) => {
      const p = S.seg(sec, k, k + 0.35);
      if (p > 0 && p < 1) [-0.5, 0, 0.5].forEach((a, j) =>
        pen.line(ctx, [{ x: 812 + Math.cos(a) * 30, y: 1210 + i * 60 + Math.sin(a) * 30 }, { x: 812 + Math.cos(a) * (60 + 30 * p), y: 1210 + i * 60 + Math.sin(a) * (60 + 30 * p) }],
          { width: 6, color: theme.text, seed: 7200 + i * 10 + j }));
    });
  }

  // The sign on the door, flipping from OPEN to CLOSED.
  const f = S.seg(sec, FLIP[0], FLIP[1]);
  const sy = Math.abs(Math.cos(Math.PI * f));
  const word = f < 0.5 ? props.open || '' : props.closed || '';
  const cx = W / 2, cy = d.y + 150;
  pen.line(ctx, [{ x: cx - 90, y: d.y + 40 }, { x: cx, y: cy - 70 }, { x: cx + 90, y: d.y + 40 }], { width: 4, seed: 7301 });
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1, Math.max(0.04, sy)); ctx.translate(-cx, -cy);
  pen.shape(ctx, pen.roundRect(cx - 190, cy - 66, 380, 132, 16), { fill: f < 0.5 ? C.lime : C.card, width: 6, seed: 7302, offset: 0 });
  text(ctx, word, cx, cy + 30, { size: 92, align: 'center', color: f < 0.5 ? C.ink : theme.accent });
  ctx.restore();

  // Roma Tom inside, by the door, startled by the knock.
  const j = S.jump(sec, KNOCKS[0], 30);
  tomato(ctx, 'Roma Tom', 170, 1480 - j.hop, 360, { squash: j.squash, angle: -0.06 });
  S.reaction(ctx, theme, 'sweat', 150, 1440, S.seg(sec, KNOCKS[0], KNOCKS[0] + 0.5));

  // The guest's line.
  S.say(ctx, props.quote || '', { x: 300, y: 800, w: 660, tx: 620, ty: 1170, k: S.pop(sec, BUBBLE, 0.3), size: 78, seed: 7401 });
}

hook.cues = () => [
  ...LAMPS.map((l) => ({ sec: l.off, sfx: 'tap', gain: 0.45 })),
  { sec: FLIP[0] + 0.05, sfx: 'swish', gain: 0.35 },
  { sec: BUMP, sfx: 'squish', gain: 0.5 },
  ...KNOCKS.map((k) => ({ sec: k, sfx: 'tap', gain: 0.6 })),
];
hook.cover = (p) => ({ kicker: p.label, headline: p.quote });

module.exports = hook;
