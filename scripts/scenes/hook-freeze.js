// Hook, the freeze frame: the video opens in the middle of any other scene (a receipt printing,
// tickets piling up, a dial swinging), then it stops with a record scratch. The picture goes
// pale except one spot, which gets circled with an arrow and a label, and the line below says
// why it matters. Pick the scene with the problem in it and point at the problem.
//
// props: {
//   scene: { type: 'tickets', props: {...} },   any template except the hooks and end card
//   at: 0.85,                                    how far through that scene to freeze (0..1)
//   focus: { x: 540, y: 900, rx: 200, ry: 120 }, the spot to circle (find it with a frame check)
//   label: 'THIS ONE', line: 'This ticket is about to cost you a *regular*'
// }
// The line takes the top of the screen, where captions go, so leave the inner scene's caption out.

const { W, C, kicker, headline, pen, motion } = require('../lib/kit.js');
const { loop } = require('../lib/marks.js');
const { seg, easeOut, spring } = motion;

const FREEZE = 0.7; // seconds of the scene playing before it stops

function hookFreeze(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3.5;
  const inner = props.scene || {};
  const draw = require(`./${inner.type}.js`);
  const at = props.at ?? 0.85;
  const f = props.focus || { x: 540, y: 900, rx: 200, ry: 120 };

  // The scene runs into the freeze point, then holds.
  const tIn = Math.max(0, at - 0.25) + 0.25 * Math.min(1, sec / FREEZE);
  draw(ctx, theme, tIn, inner.props || {}, { sec: tIn * 4, dur: 4 });

  if (sec < FREEZE) return;
  // A white flash, then everything but the focus goes pale.
  const flash = 1 - seg(sec, FREEZE, FREEZE + 0.12);
  const pale = easeOut(seg(sec, FREEZE, FREEZE + 0.2));
  ctx.save();
  ctx.beginPath();
  ctx.rect(-50, -50, W + 100, 2100);
  ctx.ellipse(f.x, f.y, f.rx * 1.12, f.ry * 1.12, 0, 0, Math.PI * 2, true);
  ctx.fillStyle = theme.bg;
  ctx.globalAlpha = 0.62 * pale;
  ctx.fill('evenodd');
  ctx.restore();
  if (flash > 0) { ctx.save(); ctx.globalAlpha = 0.6 * flash; ctx.fillStyle = C.card; ctx.fillRect(0, 0, W, 1920); ctx.restore(); }

  // A pause sign, the circle, and the label with an arrow to it.
  const pk = spring(seg(sec, FREEZE, FREEZE + 0.25));
  if (pk > 0) {
    ctx.save(); ctx.translate(110, 300); ctx.scale(pk, pk);
    pen.shape(ctx, pen.roundRect(-34, -44, 26, 88, 8), { fill: theme.text, width: 4, seed: 2701, offset: 0 });
    pen.shape(ctx, pen.roundRect(8, -44, 26, 88, 8), { fill: theme.text, width: 4, seed: 2702, offset: 0 });
    ctx.restore();
  }
  loop(ctx, f.x, f.y, f.rx, f.ry, easeOut(seg(sec, FREEZE + 0.1, FREEZE + 0.5)), theme.accent, 2703, 10);
  if (props.label) {
    const above = f.y - f.ry > 520;
    const ly = above ? f.y - f.ry - 150 : f.y + f.ry + 150;
    const lx = Math.min(760, Math.max(280, f.x));
    const lk = spring(seg(sec, FREEZE + 0.35, FREEZE + 0.6));
    if (lk > 0) {
      ctx.save(); ctx.translate(lx, ly); ctx.scale(lk, lk); kicker(ctx, props.label, 0, 0, { seed: 2704 }); ctx.restore();
      const ay0 = above ? ly + 46 : ly - 46, ay1 = above ? f.y - f.ry - 14 : f.y + f.ry + 14;
      pen.line(ctx, [{ x: lx, y: ay0 }, { x: (lx + f.x) / 2 + 20, y: (ay0 + ay1) / 2 }, { x: f.x, y: ay1 }],
        { width: 8, color: theme.accent, seed: 2705, upto: easeOut(seg(sec, FREEZE + 0.45, FREEZE + 0.7)) });
    }
  }

  // The line, at the top where a caption would go, written in once the picture stops.
  if (props.line) headline(ctx, theme, props.line, { x: 575, y: 235, size: 76, maxW: 700, appear: easeOut(seg(sec, FREEZE + 0.15, FREEZE + 0.5)), seed: 2707 });
}

hookFreeze.cues = () => [
  { sec: 0, sfx: 'tick', gain: 0.4 },
  { sec: 0.35, sfx: 'tick', gain: 0.4 },
  { sec: FREEZE, sfx: 'scratch', gain: 0.9 },
  { sec: FREEZE + 0.35, sfx: 'pop', gain: 0.5 },
];
hookFreeze.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hookFreeze;
