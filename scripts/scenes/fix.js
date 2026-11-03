// 8. The Fix: a sticky note checklist that gets ticked off, with the host nodding along.
//
// props: { caption, title: 'The fix', steps: ['...', '...', '...'] (up to 3), host: 'Roma Tom' }

const { C, tomato, pen, motion } = require('../lib/kit.js');
const { text, measure, wrapText, caption, check, squiggle } = require('../lib/marks.js');
const { seg, easeOut, spring, breathe } = motion;

const X = 150, Y = 480, S = 780, WRITE = 0.12, TICK = 0.5, STEP = 0.12;

function fix(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  const steps = (props.steps || []).slice(0, 3);
  const onLime = theme.bg === C.lime;
  const note = onLime ? C.card : C.lime;
  const tickColor = onLime ? C.forest : C.forestDark;

  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  ctx.save();
  ctx.translate(X + S / 2, Y + S / 2);
  ctx.rotate(-0.025);
  ctx.translate(-S / 2, -S / 2);
  pen.shape(ctx, pen.roundRect(0, 0, S, S, 14), { fill: note, width: 6, seed: 501, offset: 5 });
  // A strip of tape holding it up.
  ctx.save();
  ctx.translate(S / 2, 0);
  ctx.rotate(0.05);
  pen.fill(ctx, pen.roundRect(-120, -28, 240, 56, 4), C.line, { seed: 502, alpha: 0.85 });
  ctx.restore();

  const title = props.title || 'The fix';
  text(ctx, title, 60, 130, { size: 100 });
  squiggle(ctx, 60, 60 + measure(title, { size: 100 }), 158, easeOut(seg(t, 0.04, 0.14)), C.ink, 503, 5);

  steps.forEach((s, i) => {
    const y = 270 + i * 170;
    const a = easeOut(seg(t, WRITE + i * STEP, WRITE + (i + 0.8) * STEP));
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    pen.shape(ctx, pen.roundRect(60, y - 44, 60, 60, 10), { fill: C.card, width: 5, seed: 510 + i, offset: 0 });
    ctx.restore();
    wrapText(s, S - 230, { size: 56, balance: true }).slice(0, 2).forEach((ln, j) => text(ctx, ln, 150, y + j * 60, { size: 56, alpha: a }));
    check(ctx, 92, y - 16, 64, easeOut(seg(t, TICK + i * STEP, TICK + (i + 0.6) * STEP)), tickColor, 520 + i);
  });
  ctx.restore();

  // The host pops up and nods at each tick.
  const k = spring(seg(t, 0.06, 0.24));
  const nod = seg(t, TICK, TICK + steps.length * STEP) > 0 && t < TICK + steps.length * STEP ? Math.sin(sec * 9) * 0.07 : 0;
  tomato(ctx, props.host || 'Roma Tom', 860, 1440 + (1 - k) * 500, 380, { angle: nod, squash: breathe(sec) });
}

fix.cues = (props) => {
  const cues = [{ t: 0.06, sfx: 'sprout', gain: 0.4 }];
  (props.steps || []).slice(0, 3).forEach((_, i) => {
    cues.push({ t: WRITE + i * STEP, sfx: 'scratch', gain: 0.4 });
    cues.push({ t: TICK + i * STEP, sfx: 'pop', gain: 0.7 });
  });
  cues.push({ t: TICK + 3 * STEP, sfx: 'chime', gain: 0.5 });
  return cues;
};

module.exports = fix;
