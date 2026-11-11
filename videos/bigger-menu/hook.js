// This video's own hook.
//
// The idea: a menu unfolds, and unfolds, and keeps unfolding, panel after panel off the bottom
// of the screen, while Dev peeks out of the kitchen door, sweating harder with every fold.
// Frame one shows: the first panel already flipping open.
// Readable by 0.5 s: "More dishes, more sales? *Usually not.*"
// The open loop: why not, and what does all that menu cost?
//
// props: { label, line }

const { W, C, kicker, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const S = require('../../scripts/lib/stage.js');

const X = 130, MW = 560, TOP = 680, PH = 230, EVERY = 0.3;

function panel(ctx, y, k, i) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(0, y); ctx.scale(1, k);
  pen.shape(ctx, pen.roundRect(X, 0, MW, PH, 10), { fill: C.card, width: 6, seed: 10110 + i, offset: 0 });
  for (let r = 0; r < 3; r++) {
    const ry = 55 + r * 62, len = 200 + ((i * 3 + r) * 47) % 160;
    pen.line(ctx, [{ x: X + 40, y: ry }, { x: X + 40 + len, y: ry + 2 }], { width: 7, color: C.ink, seed: 10200 + i * 5 + r });
    pen.shape(ctx, pen.ellipse(X + MW - 60, ry, 14, 14, 14), { fill: C.butter, width: 4, seed: 10300 + i * 5 + r, offset: 0 });
  }
  ctx.restore();
}

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;

  // Panels unfold one after another, running off the bottom of the screen.
  const n = 9;
  const opened = (i) => S.at(sec, i * EVERY - 0.25, i * EVERY + 0.05);
  for (let i = 0; i < n; i++) panel(ctx, TOP + i * (PH + 14), opened(i), i);
  // The menu's title band.
  pen.shape(ctx, pen.roundRect(X, TOP - 70, MW, 70, 12), { fill: theme.mark, width: 6, seed: 10100, offset: 0 });

  // Dev peeking out of the kitchen door, sweating more as it grows.
  pen.shape(ctx, pen.roundRect(740, 760, 360, 840, 10), { fill: C.ink, width: 6, seed: 10101, offset: 0 });
  const nervous = Math.min(1, sec / 3);
  tomato(ctx, 'Dev', 860, 1120, 470, { angle: 0.15 + Math.sin(sec * (8 + nervous * 20)) * 0.03 * (1 + nervous * 2) });
  S.reaction(ctx, theme, 'sweat', 780, 1060, S.seg(sec, 0.6, 1.4));

  kicker(ctx, props.label || '', W / 2, 260, { seed: 10102 });
  headline(ctx, theme, props.line || '', { x: W / 2, y: 320, size: 104, maxW: 880, appear: S.at(sec, 0, 0.2), seed: 10103 });
}

hook.cues = () => Array.from({ length: 6 }, (_, i) => ({ sec: Math.max(0, i * EVERY - 0.2), sfx: 'rustle', gain: 0.4 })).concat([{ sec: 2.4, sfx: 'boing', gain: 0.4 }]);
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
