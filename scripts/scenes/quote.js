// 17. The Quote: a guest says it in their own words, in a big speech bubble above them.
//
// props: { caption, name: 'Maria', role: 'regular, 3 years', quote: 'I stay because you *know my name*.' }

const { C, THEMES, tomato, headline, pen, motion } = require('../lib/kit.js');
const { text, wrapText, caption, bubble } = require('../lib/marks.js');
const { seg, easeOut, spring, breathe } = motion;

const X = 140, W = 800, TOP = 470, SIZE = 80;

function quote(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));
  const plain = (props.quote || '').replace(/\*/g, '');
  const lines = wrapText(plain, W - 140, { size: SIZE, balance: true }).length;
  const h = 150 + lines * SIZE * 1.02 + 70;
  const tx = 400, ty = TOP + h + 120;

  const k = spring(seg(t, 0.04, 0.2));
  if (k > 0) {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(k, k);
    ctx.translate(-tx, -ty);
    bubble(ctx, X, TOP, W, h, tx, ty, C.card, 1401);
    text(ctx, '“', X + 40, TOP + 170, { size: 220, color: C.rose });
    // The bubble is always card colored, so the swash is lime whatever the background.
    headline(ctx, { ...THEMES.paper, swash: C.lime }, props.quote || '', {
      y: TOP + 120, size: SIZE, maxW: W - 140, appear: easeOut(seg(t, 0.16, 0.6)), seed: 1402,
    });
    ctx.restore();
  }

  // The guest who said it, with their name beside them.
  const g = spring(seg(t, 0.1, 0.28));
  tomato(ctx, props.name || 'Maria', tx - 20, ty + 160, 320, { scale: g, squash: breathe(sec), angle: Math.sin(sec * 1.8) * 0.03 });
  const n = easeOut(seg(t, 0.62, 0.74));
  text(ctx, props.name || 'Maria', tx + 170, ty + 150, { size: 72, alpha: n });
  text(ctx, props.role || '', tx + 170, ty + 210, { size: 46, alpha: n, color: theme.soft });
}

quote.cues = () => [
  { t: 0.04, sfx: 'pop' },
  { t: 0.1, sfx: 'sprout', gain: 0.4 },
  { t: 0.62, sfx: 'chime', gain: 0.4 },
];

module.exports = quote;
