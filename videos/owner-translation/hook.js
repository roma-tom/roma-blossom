// This video's own hook.
//
// The idea: Maria asks "Busy weekend?", Roma Tom beams "Great!", and then a subtitle bar slides
// up under him like a foreign film, translating what he really means.
// Frame one shows: Maria's bubble already popping up at the counter.
// Readable by 0.5 s: "Owner *translation*" and "Busy weekend?"
// The open loop: what else do owners say that means something else?
//
// props: { label, line, ask, say, tag, means }

const { W, C, kicker, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const { text, wrapText } = require('../../scripts/lib/marks.js');
const S = require('../../scripts/lib/stage.js');

const ANSWER = 0.9, SUB = 1.7, FLOOR = 1330;

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  kicker(ctx, props.label || '', W / 2, 260, { seed: 16101 });
  headline(ctx, theme, props.line || '', { x: W / 2, y: 320, size: 120, maxW: 860, appear: S.at(sec, 0, 0.2), seed: 16102 });

  // Maria and Roma Tom side by side, Roma Tom beaming no matter what.
  tomato(ctx, 'Maria', 250, 1190, 400, { squash: S.breathe(sec), angle: 0.06 });
  const j = S.jump(sec, ANSWER, 30);
  tomato(ctx, 'Roma Tom', 740, 1140 - j.hop, 520, { squash: j.squash, angle: -0.05 });
  pen.line(ctx, [{ x: -40, y: FLOOR }, { x: 1120, y: FLOOR - 4 }], { width: 7, seed: 16103 });
  if (sec > SUB + 0.3) S.reaction(ctx, theme, 'sweat', 760, 1080, S.seg(sec, SUB + 0.3, SUB + 0.9));

  // The two bubbles.
  S.say(ctx, props.ask || '', { x: 60, y: 560, w: 470, tx: 260, ty: 1010, k: S.pop(sec, 0, 0.3), size: 76, seed: 16110 });
  S.say(ctx, props.say || '', { x: 560, y: 600, w: 380, tx: 700, ty: 900, k: S.pop(sec, ANSWER, 0.3), size: 92, seed: 16120 });

  // The subtitle bar sliding up under them: the translation.
  const k = S.at(sec, SUB, SUB + 0.35);
  if (k > 0) {
    const y = 1390 + (1 - k) * 200;
    ctx.save(); ctx.globalAlpha *= k;
    const lines = wrapText(props.means || '', 760, { size: 62 });
    const h = 70 + lines.length * 66;
    pen.shape(ctx, pen.roundRect(100, y, 800, h, 18), { fill: C.ink, width: 5, seed: 16130, offset: 0 });
    lines.forEach((ln, i) => text(ctx, ln, 500, y + 92 + i * 66, { size: 62, align: 'center', color: C.card }));
    ctx.restore();
    S.popIn(ctx, S.pop(sec, SUB + 0.2, 0.3), 260, y, () => kicker(ctx, props.tag || '', 260, y, { seed: 16131 }));
  }
}

hook.cues = () => [
  { sec: 0, sfx: 'pop', gain: 0.4 }, { sec: ANSWER, sfx: 'chime', gain: 0.45 },
  { sec: SUB, sfx: 'swish', gain: 0.4 }, { sec: SUB + 0.2, sfx: 'tap', gain: 0.4 },
];
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
