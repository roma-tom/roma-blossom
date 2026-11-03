// 16. Myth vs Fact: the myth card gets crossed out and tips back; the fact card slides up.
//
// props: { caption, myth: 'Discounts build loyalty', fact: 'Discounts build discount hunters…', host }

const { C, tomato, pen, motion } = require('../lib/kit.js');
const { text, wrapText, caption, strike, measure, check } = require('../lib/marks.js');
const { seg, easeOut, spring, breathe } = motion;

const X = 140, W = 800, SIZE = 64, LH = 72;

function tag(ctx, label, x, y, fill) {
  const w = measure(label, { font: 'Inter', size: 28, spacing: 4 }) + 50;
  pen.shape(ctx, pen.roundRect(x, y - 26, w, 52, 26), { fill, width: 4, seed: 1301 + label.length, offset: 0 });
  text(ctx, label, x + 25, y + 11, { font: 'Inter', size: 28, spacing: 4, color: C.card });
}

function card(ctx, y, label, fill, lines) {
  const h = 120 + lines.length * LH + 30;
  pen.shape(ctx, pen.roundRect(X, y, W, h, 26), { fill: C.card, width: 6, seed: 1310 + y, offset: 5 });
  tag(ctx, label, X + 40, y + 60, fill);
  lines.forEach((ln, i) => text(ctx, ln, X + 44, y + 160 + i * LH, { size: SIZE }));
  return h;
}

function myth(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));
  const mLines = wrapText(props.myth || '', W - 90, { size: SIZE, balance: true }).slice(0, 3);
  const fLines = wrapText(props.fact || '', W - 90, { size: SIZE, balance: true }).slice(0, 4);

  // The myth: pops in, gets struck through line by line, then tips back and fades.
  const mk = spring(seg(t, 0.05, 0.2));
  const back = easeOut(seg(t, 0.48, 0.6));
  const my = 480;
  if (mk > 0) {
    ctx.save();
    ctx.globalAlpha = 1 - back * 0.45;
    ctx.translate(X + W / 2, my);
    ctx.rotate(-back * 0.04);
    ctx.scale(mk * (1 - back * 0.06), mk * (1 - back * 0.06));
    ctx.translate(-(X + W / 2), -my);
    card(ctx, my, 'MYTH', C.rose, mLines);
    mLines.forEach((ln, i) => {
      const p = easeOut(seg(t, 0.28 + i * 0.05, 0.36 + i * 0.05));
      strike(ctx, X + 34, X + 54 + measure(ln, { size: SIZE }), my + 140 + i * LH, p, C.rose, 1320 + i);
    });
    ctx.restore();
  }

  // The fact slides up into place below.
  const fk = spring(seg(t, 0.5, 0.66));
  if (fk > 0) {
    const fy = my + 120 + mLines.length * LH + 90 + (1 - fk) * 500;
    ctx.save();
    ctx.globalAlpha = Math.min(1, fk);
    const h = card(ctx, fy, 'FACT', C.forestDark, fLines);
    check(ctx, X + W - 70, fy + 60, 64, easeOut(seg(t, 0.7, 0.8)), C.forest, 1330);
    ctx.restore();
    const hk = spring(seg(t, 0.72, 0.86));
    tomato(ctx, props.host || 'Roma Tom', X + W - 40, Math.min(1500, fy + h + 70), 220, { scale: hk, squash: breathe(sec), angle: 0.12 });
  }
}

myth.cues = (props) => {
  const lines = wrapText(props.myth || '', W - 90, { size: SIZE, balance: true }).slice(0, 3).length;
  const cues = [{ t: 0.05, sfx: 'pop' }];
  for (let i = 0; i < lines; i++) cues.push({ t: 0.28 + i * 0.05, sfx: 'scratch', gain: 0.5 });
  cues.push({ t: 0.5, sfx: 'whoosh', gain: 0.35 }, { t: 0.7, sfx: 'chime', gain: 0.5 }, { t: 0.72, sfx: 'sprout', gain: 0.3 });
  return cues;
};

module.exports = myth;
