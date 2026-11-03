// 15. The Chat: a text thread on a phone. Messages pop in with a typing dot bubble before each
// one from the other side. For staff messages, suppliers, a guest's DM.
//
// props: {
//   caption, contact: 'Dev', status: 'line cook',
//   messages: [{ from: 'them' | 'me', text: '...' }, ...] (up to 6)
// }

const { C, tomato, pen, motion } = require('../lib/kit.js');
const { text, measure, wrapText, caption, phone } = require('../lib/marks.js');
const { seg, easeOut, spring } = motion;

const PX = 230, PW = 620, PY = 470, PH = 1040, MSGS = [0.12, 0.86];
const SIZE = 42, LH = 50, MAXW = 360;

function slots(n) {
  const d = (MSGS[1] - MSGS[0]) / Math.max(1, n);
  return Array.from({ length: n }, (_, i) => MSGS[0] + i * d);
}

function chat(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  const msgs = (props.messages || []).slice(0, 6);
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  const s = phone(ctx, PX, PY, PW, PH, 1201);
  // Header: who you're talking to.
  tomato(ctx, props.contact || 'Dev', s.x + 80, s.y + 115, 120);
  text(ctx, props.contact || 'Dev', s.x + 150, s.y + 112, { size: 50 });
  text(ctx, props.status || '', s.x + 150, s.y + 150, { font: 'Inter', weight: 600, size: 22, color: C.muted, spacing: 1 });
  pen.line(ctx, [{ x: s.x + 30, y: s.y + 180 }, { x: s.x + s.w - 30, y: s.y + 180 }], { width: 3, color: C.line, seed: 1205 });

  // Lay out every bubble that has appeared, then scroll so the newest stays on screen.
  const times = slots(msgs.length);
  const laid = [];
  let y = 0;
  msgs.forEach((m, i) => {
    const lines = wrapText(m.text, MAXW, { size: SIZE });
    const w = Math.min(MAXW, Math.max(64, ...lines.map((ln) => measure(ln, { size: SIZE })))) + 56;
    const h = lines.length * LH + 34;
    laid.push({ m, lines, w, h, y, at: times[i] });
    y += h + 22;
  });
  const visible = laid.filter((b) => t >= b.at);
  const area = { top: s.y + 205, bottom: s.y + s.h - 40 };
  const last = visible[visible.length - 1];
  const scroll = last ? Math.max(0, last.y + last.h - (area.bottom - area.top)) : 0;

  ctx.save();
  pen.trace(ctx, pen.roundRect(s.x, area.top - 10, s.w, area.bottom - area.top + 10, 30), true);
  ctx.clip();
  laid.forEach((b, i) => {
    const me = b.m.from === 'me';
    const x = me ? s.x + s.w - 30 - b.w : s.x + 30;
    const by = area.top + b.y - scroll;
    // Typing dots before a message from them.
    if (!me && t >= b.at - 0.07 && t < b.at) {
      pen.shape(ctx, pen.roundRect(x, by, 120, 64, 30), { fill: C.line, width: 4, seed: 1210 + i, offset: 0 });
      for (let d = 0; d < 3; d++) {
        const lift = Math.max(0, Math.sin(sec * 12 - d * 0.9)) * 8;
        pen.fill(ctx, pen.ellipse(x + 34 + d * 26, by + 34 - lift, 8, 8, 12), C.muted, { amp: 0.5, seed: 1220 + d });
      }
      return;
    }
    const k = spring(seg(t, b.at, b.at + 0.05));
    if (k <= 0) return;
    ctx.save();
    ctx.translate(me ? x + b.w : x, by);
    ctx.scale(k, k);
    ctx.translate(me ? -b.w : 0, 0);
    pen.shape(ctx, pen.roundRect(0, 0, b.w, b.h, 26), { fill: me ? C.lime : C.line, width: 4, seed: 1230 + i, offset: 0 });
    b.lines.forEach((ln, j) => text(ctx, ln, 28, 56 + j * LH, { size: SIZE }));
    ctx.restore();
  });
  ctx.restore();
}

chat.cues = (props) => {
  const msgs = (props.messages || []).slice(0, 6);
  return slots(msgs.length).map((at, i) => ({ t: at, sfx: msgs[i].from === 'me' ? 'tap' : 'pop', gain: 0.6 }));
};

module.exports = chat;
