// 6. The Review: a phone with a review card. Stars fill in, the guest's review types out,
// then the owner's reply.
//
// props: { caption, name: 'Sam', stars: 3, text, reply, owner: 'Roma Tom' }

const { C, tomato, pen, motion } = require('../lib/kit.js');
const { text, wrapText, caption, star } = require('../lib/marks.js');
const { seg, easeOut, spring } = motion;

const PX = 230, PW = 620, PY = 470, PH = 1040;
const STARS = [0.14, 0.3], TYPE = [0.3, 0.55], REPLY = [0.62, 0.66, 0.9];

function typed(str, p) {
  return str.slice(0, Math.round(str.length * p));
}

function review(ctx, theme, t, props) {
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  // The phone: a hand-drawn outline, a screen and a notch.
  pen.shape(ctx, pen.roundRect(PX, PY, PW, PH, 70), { fill: C.ink, width: 6, seed: 301, offset: 0 });
  pen.fill(ctx, pen.roundRect(PX + 22, PY + 22, PW - 44, PH - 44, 50), C.card, { seed: 302 });
  pen.fill(ctx, pen.roundRect(PX + PW / 2 - 70, PY + 38, 140, 30, 15), C.ink, { seed: 303, amp: 0.5 });

  const L = PX + 60, R = PX + PW - 60;
  text(ctx, 'REVIEWS', L, PY + 140, { font: 'Inter', size: 26, spacing: 4, color: C.muted });
  pen.line(ctx, [{ x: L, y: PY + 168 }, { x: R, y: PY + 168 }], { width: 3, color: C.line, seed: 304 });

  // The guest, their stars, and the review typing out.
  const top = PY + 200;
  tomato(ctx, props.name || 'Sam', L + 55, top + 60, 150);
  text(ctx, props.name || 'Sam', L + 140, top + 52, { size: 56 });
  const filled = seg(t, STARS[0], STARS[1]) * 5;
  for (let i = 0; i < 5; i++) {
    const on = i < (props.stars ?? 5) && filled > i;
    const cx = L + 158 + i * 50, cy = top + 92;
    if (on) star(ctx, cx, cy, 21 * spring(Math.min(1, filled - i)), C.tomato, 310 + i, 4);
    else star(ctx, cx, cy, 21, C.card, 310 + i, 4);
  }
  const body = wrapText(typed(props.text || '', seg(t, TYPE[0], TYPE[1])), R - L, { size: 46 });
  body.forEach((ln, i) => text(ctx, ln, L, top + 190 + i * 56, { size: 46 }));

  // The owner's reply, in a lime bubble.
  const pop = spring(seg(t, REPLY[0], REPLY[1]));
  if (pop > 0 && props.reply) {
    const full = wrapText(props.reply, R - L - 70, { size: 44 });
    const y = top + 190 + Math.max(2, wrapText(props.text || '', R - L, { size: 46 }).length) * 56 + 30;
    const bh = 110 + full.length * 52;
    ctx.save();
    ctx.translate(L + 10, y);
    ctx.scale(pop, pop);
    pen.shape(ctx, pen.roundRect(0, 0, R - L - 10, bh, 28), { fill: C.lime, width: 5, seed: 320, offset: 3 });
    tomato(ctx, props.owner || 'Roma Tom', 46, 52, 110);
    text(ctx, 'OWNER REPLY', 96, 62, { font: 'Inter', size: 22, spacing: 3, color: C.forestDark });
    const lines = wrapText(typed(props.reply, seg(t, REPLY[1], REPLY[2])), R - L - 70, { size: 44 });
    lines.forEach((ln, i) => text(ctx, ln, 30, 128 + i * 52, { size: 44 }));
    ctx.restore();
  }
}

review.cues = (props) => {
  const cues = [];
  for (let i = 0; i < (props.stars ?? 5); i++) cues.push({ t: STARS[0] + (i / 5) * (STARS[1] - STARS[0]), sfx: 'tap', gain: 0.7 });
  const typing = (a, b, str) => {
    const n = Math.min(14, Math.ceil((str || '').length / 5));
    for (let i = 0; i < n; i++) cues.push({ t: a + (i / n) * (b - a), sfx: 'tick', gain: 0.25 });
  };
  typing(TYPE[0], TYPE[1], props.text);
  if (props.reply) {
    cues.push({ t: REPLY[0], sfx: 'pop' });
    typing(REPLY[1], REPLY[2], props.reply);
  }
  return cues;
};

module.exports = review;
