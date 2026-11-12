// This video's own hook.
//
// The idea: chicken bowls slide along the pass one after another, and the scoop on each one is
// a little bigger than the last; as each bowl passes Dev, a coin quietly slips off the edge of
// the pass and drops away, until the yearly number lands under the pass.
// Frame one shows: bowls already sliding across the pass, Dev behind it watching them go.
// Readable by 0.5 s: "A bigger scoop, *every* plate." over the pass.
// The open loop: how much can one slightly bigger scoop really cost?
//
// props: { label, line, number, unit }

const { W, C, kicker, headline, tomato, pen } = require('../../scripts/lib/kit.js');
const { text } = require('../../scripts/lib/marks.js');
const S = require('../../scripts/lib/stage.js');

const PASS = 1180, SPEED = 330, GAP = 400, DROP_X = 760, NUMBER_AT = 3.2;

// A bowl standing on y at x, with a mound of chicken scaled by s.
function bowl(ctx, theme, x, y, s, seed) {
  const mw = 96 + 14 * (s - 1), mh = 40 * s, my = y - 110 - mh * 0.45;
  // The mound: sliced chicken piling up above the rim, with a couple of green leaves.
  pen.shape(ctx, pen.ellipse(x, my, mw, mh, 28), { fill: C.butter, width: 5, seed, offset: 0 });
  pen.line(ctx, [{ x: x - mw * 0.55, y: my + mh * 0.1 }, { x: x - mw * 0.15, y: my - mh * 0.6 }], { width: 4, seed: seed + 1 });
  pen.line(ctx, [{ x: x + mw * 0.0, y: my + mh * 0.2 }, { x: x + mw * 0.45, y: my - mh * 0.5 }], { width: 4, seed: seed + 2 });
  pen.shape(ctx, pen.ellipse(x - 104, y - 116, 24, 12, 14), { fill: C.forest, width: 4, seed: seed + 3, offset: 0 });
  pen.shape(ctx, pen.ellipse(x + 106, y - 114, 22, 11, 14), { fill: C.forest, width: 4, seed: seed + 4, offset: 0 });
  // The bowl itself.
  const pts = [{ x: x - 130, y: y - 110 }, { x: x + 130, y: y - 110 }];
  for (let j = 0; j <= 10; j++) {
    const a = (Math.PI * j) / 10;
    pts.push({ x: x + Math.cos(a) * 130 * (j <= 5 ? 1 : 1), y: y - 110 + Math.sin(a) * 100 });
  }
  pen.shape(ctx, pts, { fill: C.card, width: 6, seed: seed + 5, offset: 0 });
  pen.line(ctx, [{ x: x - 112, y: y - 82 }, { x: x + 112, y: y - 82 }], { width: 4, color: C.line, seed: seed + 6 });
}

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  kicker(ctx, props.label || '', W / 2, 260, { seed: 6101 });
  headline(ctx, theme, props.line || '', { x: W / 2, y: 330, size: 108, maxW: 860, appear: S.at(sec, 0, 0.2), seed: 6102 });

  // Dev behind the pass, eyes following the bowls, sweating once the coins start to go.
  const look = Math.sin(sec * 2.2) * 0.06;
  const j = S.jump(sec, NUMBER_AT, 36);
  tomato(ctx, 'Dev', W / 2, 830 - j.hop, 440, { squash: j.squash, angle: look });
  S.reaction(ctx, theme, 'sweat', W / 2 + 40, 810, S.seg(sec, 1.0, 1.5));

  // The pass: a steel shelf across the screen.
  pen.shape(ctx, [{ x: -40, y: PASS }, { x: 1120, y: PASS - 6 }, { x: 1120, y: PASS + 44 }, { x: -40, y: PASS + 50 }], { fill: C.card, width: 7, seed: 6103, offset: 0 });

  // Bowls slide left to right; each later bowl carries a bigger scoop.
  const shift = sec * SPEED;
  for (let k = -2; k < 9; k++) {
    const x = 560 + shift - k * GAP;
    if (x < -200 || x > W + 200) continue;
    const s = Math.min(2.6, 1 + 0.25 * (k + 1));
    bowl(ctx, theme, x, PASS, s, 6200 + ((k + 20) % 7) * 10);
  }

  // As each bowl passes DROP_X, a coin slips off the front edge of the pass and falls.
  for (let k = -1; k < 9; k++) {
    const a = (DROP_X - 560 + k * GAP) / SPEED;
    const p = S.seg(sec, a, a + 0.9);
    if (p <= 0 || p >= 1) continue;
    S.coin(ctx, theme, DROP_X + 40, PASS - 10, DROP_X + 170, 2000, p, 6300 + k, 46, 90);
  }

  // The year's cost lands under the pass.
  const k = S.pop(sec, NUMBER_AT, 0.35);
  S.popIn(ctx, k, W / 2 - 40, 1420, () => {
    text(ctx, props.number || '', W / 2 - 40, 1440, { size: 170, align: 'center', color: theme.accent });
    text(ctx, props.unit || '', W / 2 - 40, 1515, { font: 'Inter', size: 34, spacing: 4, align: 'center', color: theme.text });
  });
}

hook.cues = () => {
  const cues = [{ sec: 0, sfx: 'swish', gain: 0.3 }];
  for (let k = -1; k < 6; k++) {
    const a = (DROP_X - 560 + k * GAP) / SPEED;
    if (a >= 0 && a < NUMBER_AT) cues.push({ sec: a + 0.15, sfx: 'clink', gain: 0.4 });
  }
  cues.push({ sec: NUMBER_AT, sfx: 'ding', gain: 0.5 });
  return cues;
};
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
