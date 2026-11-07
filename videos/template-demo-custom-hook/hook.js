// A worked example of a video's own hook (made for the oat milk topic, which is already
// covered, so it's here to learn from, not to reuse).
//
// The idea in one line: free oat milk pours into a latte, and every drop that lands flips out
// of the cup as a coin and flies away, while the tally of what it cost climbs.
// Each coin arcs over Roma Tom's head and off the right edge.
// Frame one: the carton is already pouring. By 0.4 s: the line is readable. 1.2 s: Roma Tom
// sweats. The open loop: how much does it add up to? (the video answers).
//
// props: { line, per: 0.75, cups: 4 }

const { W, C, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const { text, money } = require('../../scripts/lib/marks.js');
const S = require('../../scripts/lib/stage.js');

const COUNTER = 1440, CUP = { x: 270, y: COUNTER }, EVERY = 0.38, FIRST = 0.3;

function carton(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle); ctx.scale(1.45, 1.45);
  pen.shape(ctx, [{ x: -70, y: -150 }, { x: 0, y: -210 }, { x: 70, y: -150 }, { x: 70, y: 130 }, { x: -70, y: 130 }], { fill: C.card, width: 6, seed: 2901, offset: 4 });
  pen.line(ctx, [{ x: -70, y: -150 }, { x: 70, y: -150 }], { width: 4, seed: 2902 });
  text(ctx, 'OAT', 0, 20, { font: 'Inter', size: 44, weight: 800, spacing: 4, align: 'center', color: C.forestDark });
  text(ctx, 'milk', 0, 70, { size: 42, align: 'center', color: C.muted });
  ctx.restore();
}

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3.5;
  const per = props.per ?? 0.75;

  headline(ctx, theme, props.line || '', { x: 520, y: 260, size: 104, maxW: 820, appear: S.at(sec, 0, 0.35), seed: 2910 });

  // Roma Tom behind the counter, in the middle, watching the money go.
  const j = S.jump(sec, 1.2, 30);
  tomato(ctx, 'Roma Tom', W / 2, 1290 - j.hop, 660, { squash: j.squash, angle: -0.06 });
  S.counter(ctx, COUNTER);
  S.cup(ctx, CUP.x, CUP.y, 2);

  // The carton pours from the first frame: a wobbling stream into the cup.
  carton(ctx, CUP.x + 170, CUP.y - 590, -2.2);
  const wob = Math.sin(sec * 9) * 8;
  const stream = [{ x: CUP.x + 85, y: CUP.y - 460 }, { x: CUP.x + 30 + wob, y: CUP.y - 300 }, { x: CUP.x + wob / 2, y: CUP.y - 150 }];
  pen.line(ctx, stream, { width: 26, color: C.ink, seed: 2911 });
  pen.line(ctx, stream, { width: 18, color: C.card, seed: 2912 });

  // Every drop flips out as a coin and flies off; the tally climbs with each one.
  const landed = Math.max(0, Math.floor((sec - FIRST) / EVERY) + 1);
  for (let i = 0; i < Math.min(landed + 1, 12); i++) {
    const a = FIRST + i * EVERY;
    S.coin(ctx, theme, CUP.x + 40, CUP.y - 160, 1160, 980 + (i % 3) * 60, S.seg(sec, a, a + 0.9), 2920 + i, 44, 170);
  }
  const shown = Math.min(landed, props.cups ?? 4);
  if (shown > 0) {
    const k = S.pop(sec, FIRST + (shown - 1) * EVERY, 0.2);
    S.popIn(ctx, k, 790, 560, () => text(ctx, `−${money(per * shown)}`, 790, 600, { size: 120, align: 'center', color: theme.accent }));
  }
  S.reaction(ctx, theme, 'sweat', W / 2, 1260 - j.hop, S.seg(sec, 1.2, 1.8));
}

hook.cues = (props) => {
  const cues = [{ sec: 0, sfx: 'swish', gain: 0.4 }];
  for (let i = 0; i < (props.cups ?? 4); i++) cues.push({ sec: FIRST + i * EVERY, sfx: 'clink', gain: 0.5 });
  cues.push({ sec: 1.2, sfx: 'boing', gain: 0.4 });
  return cues;
};
hook.cover = (p) => ({ kicker: 'CAFE MATH', headline: p.line, number: `−${money((p.per ?? 0.75) * (p.cups ?? 4))}`, label: 'in free oat milk' });

module.exports = hook;
