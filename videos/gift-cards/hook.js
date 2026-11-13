// This video's own hook.
//
// The idea: a gift card slides into the register, the cash drawer springs open, and the bills
// inside are see-through ghosts with a little IOU tag swinging off them.
// Frame one shows: the card already sliding toward the register.
// Readable by 0.5 s: "Gift card sold. *Not yours yet.*"
// The open loop: if it's not yours yet, whose is it, and what does it cost you later?
//
// props: { label, line, tag }

const { W, C, kicker, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const { text } = require('../../scripts/lib/marks.js');
const S = require('../../scripts/lib/stage.js');

const R = { x: 150, y: 820, w: 640, h: 400 }, IN = 0.7, OPEN = 1.0, TAG = 1.5;

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  kicker(ctx, props.label || '', W / 2, 260, { seed: 15101 });
  headline(ctx, theme, props.line || '', { x: W / 2, y: 330, size: 112, maxW: 860, appear: S.at(sec, 0, 0.2), seed: 15102 });

  // The register: a body with a screen and keys, and a drawer that springs open.
  const drawer = S.pop(sec, OPEN, 0.4);
  const dy = R.y + R.h, dh = 170, out = drawer * 170;
  pen.shape(ctx, pen.roundRect(R.x - 20, dy - 10, R.w + 40, dh + out, 14), { fill: C.card, width: 6, seed: 15110, offset: 0 });
  if (drawer > 0) {
    // Ghost bills: outlines only, faint, see-through.
    [0, 1, 2].forEach((i) => {
      ctx.save(); ctx.globalAlpha = 0.45;
      pen.line(ctx, pen.roundRect(R.x + 30 + i * 205, dy + out + 20, 170, 100, 10), { width: 5, color: C.forest, seed: 15111 + i, closed: true });
      ctx.restore();
    });
    // The IOU tag swinging from the middle bill.
    const k = S.pop(sec, TAG, 0.3), sw = Math.sin(sec * 4) * 0.15;
    S.popIn(ctx, k, R.x + 320, dy + out + 70, () => {
      ctx.save(); ctx.translate(R.x + 320, dy + out + 70); ctx.rotate(sw);
      pen.line(ctx, [{ x: 0, y: 0 }, { x: 0, y: 70 }], { width: 4, seed: 15120 });
      pen.shape(ctx, pen.roundRect(-80, 70, 160, 80, 12), { fill: C.butter, width: 5, seed: 15121, offset: 0 });
      text(ctx, props.tag || '', 0, 128, { size: 56, align: 'center', color: theme.accent });
      ctx.restore();
    });
  }
  pen.shape(ctx, pen.roundRect(R.x, R.y, R.w, R.h, 20), { fill: C.rose, width: 7, seed: 15130, offset: 0 });
  pen.shape(ctx, pen.roundRect(R.x + 40, R.y + 50, 320, 120, 12), { fill: C.ink, width: 5, seed: 15131, offset: 0 });
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++)
    pen.shape(ctx, pen.roundRect(R.x + 50 + c * 80, R.y + 210 + r * 80, 60, 56, 8), { fill: C.card, width: 4, seed: 15140 + r * 4 + c, offset: 0 });
  // The card slot, and the gift card sliding into it.
  pen.line(ctx, [{ x: R.x + 410, y: R.y + 4 }, { x: R.x + 590, y: R.y + 4 }], { width: 12, seed: 15150 });
  const slide = S.at(sec, 0, IN);
  const cx = R.x + 500, cy = R.y - 320 + slide * 360;
  if (sec < IN + 0.05) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, R.y); ctx.clip();
    pen.shape(ctx, pen.roundRect(cx - 70, cy - 110, 140, 220, 14), { fill: C.lime, width: 5, seed: 15151, offset: 0 });
    pen.sparkle(ctx, cx, cy - 40, 20, { fill: C.card, seed: 15152 });
    ctx.restore();
  }

  // Roma Tom beside the register, puzzled.
  tomato(ctx, 'Roma Tom', 900, 1470, 360, { squash: S.breathe(sec), angle: -0.1 + Math.sin(sec * 2) * 0.03 });
  S.reaction(ctx, theme, 'think', 770, 1330, S.seg(sec, TAG, TAG + 0.6));
}

hook.cues = () => [
  { sec: 0, sfx: 'swish', gain: 0.4 }, { sec: IN, sfx: 'blip', gain: 0.4 },
  { sec: OPEN, sfx: 'ding', gain: 0.55 }, { sec: OPEN + 0.05, sfx: 'clink', gain: 0.4 },
  { sec: TAG, sfx: 'pop', gain: 0.45 },
];
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
