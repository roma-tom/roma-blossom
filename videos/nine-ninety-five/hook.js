// This video's own hook.
//
// The idea: a price tag hangs over the counter and flips like a coin, $9.95 on one side and
// $10 on the other, while Maria below turns her head with every flip, trying to decide.
// Frame one shows: the tag already mid-flip, Maria already leaning to look.
// Readable by 0.5 s: "Same price? *Not* to guests." over the spinning tag.
// The open loop: what does each one say to a guest?
//
// props: { label, line, a, b }

const { W, C, kicker, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const { text } = require('../../scripts/lib/marks.js');
const S = require('../../scripts/lib/stage.js');

const NAIL = { x: W / 2, y: 560 }, TW = 660, TH = 360, COUNTER = 1470;
const FLIP = 0.9; // seconds per half turn

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3.5;
  kicker(ctx, props.label || '', W / 2, 260, { seed: 5201 });
  headline(ctx, theme, props.line || '', { x: W / 2, y: 330, size: 108, maxW: 860, appear: S.at(sec, 0, 0.2), seed: 5202 });

  // The tag spins about its string, slowing to rest on the round price near the end.
  const settleAt = 3.0;
  const t0 = (settleAt + 0.25) / FLIP, target = Math.ceil(t0) % 2 ? Math.ceil(t0) : Math.ceil(t0) + 1;
  const turns = sec < settleAt ? (sec + 0.25) / FLIP : t0 + S.at(sec, settleAt, settleAt + 0.6) * (target - t0);
  const ang = turns * Math.PI;
  const sx = Math.cos(ang), face = Math.floor(turns + 0.5) % 2; // 0 shows a, 1 shows b
  const y0 = NAIL.y + 90;
  pen.fill(ctx, pen.ellipse(NAIL.x, NAIL.y, 12, 12, 16), C.ink, { seed: 5203 });
  pen.line(ctx, [{ x: NAIL.x, y: NAIL.y }, { x: NAIL.x, y: y0 + 40 }], { width: 5, seed: 5204 });
  ctx.save();
  ctx.translate(NAIL.x, 0);
  ctx.scale(Math.max(0.04, Math.abs(sx)), 1);
  const tag = [{ x: -TW / 2 + 60, y: y0 }, { x: TW / 2 - 60, y: y0 }, { x: TW / 2, y: y0 + 70 }, { x: TW / 2, y: y0 + TH }, { x: -TW / 2, y: y0 + TH }, { x: -TW / 2, y: y0 + 70 }];
  pen.shape(ctx, tag, { fill: face ? C.card : C.paper, width: 7, seed: 5205 + face, offset: 6 });
  pen.shape(ctx, pen.ellipse(0, y0 + 46, 16, 16, 18), { fill: theme.bg, width: 5, seed: 5207, offset: 0 });
  text(ctx, face ? props.b || '' : props.a || '', 0, y0 + 270, { size: 210, align: 'center', color: theme.accent });
  ctx.restore();

  // Motion lines while it spins.
  if (sec < settleAt) [-1, 1].forEach((d, i) => pen.line(ctx, [{ x: NAIL.x + d * 380, y: y0 + 110 }, { x: NAIL.x + d * 400, y: y0 + 180 }, { x: NAIL.x + d * 380, y: y0 + 250 }], { width: 7, color: theme.text, seed: 5210 + i }));

  // Maria below, turning her head left and right with each flip.
  const look = Math.sin(ang) * 0.14;
  const j = S.jump(sec, settleAt + 0.45, 50);
  tomato(ctx, 'Maria', W / 2, 1290 - j.hop, 560, { squash: j.squash, angle: look * (sec < settleAt ? 1 : 1 - S.at(sec, settleAt, settleAt + 0.4)) });
  S.reaction(ctx, theme, sec < settleAt + 0.4 ? 'think' : 'joy', W / 2 + 60, 1330, sec < settleAt + 0.4 ? S.seg(sec, 0.1, 0.7) : S.seg(sec, settleAt + 0.4, settleAt + 1.0));
  S.counter(ctx, COUNTER, { cupX: 830 });
}

hook.cues = () => [
  { sec: 0, sfx: 'swish', gain: 0.35 }, { sec: 0.9, sfx: 'swish', gain: 0.35 }, { sec: 1.8, sfx: 'swish', gain: 0.35 }, { sec: 2.7, sfx: 'swish', gain: 0.35 },
  { sec: 3.4, sfx: 'ding', gain: 0.45 },
];
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
