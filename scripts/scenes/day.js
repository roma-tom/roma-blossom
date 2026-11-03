// 14. The Day: a wobbly path down the screen with stops along it, and the host walking it.
//
// props: {
//   caption,
//   steps: [{ time: '6:00', label: 'Prep starts' }, ...] (up to 5),
//   highlight: 2 (index of the stop that matters most)
// }

const { C, tomato, pen, motion } = require('../lib/kit.js');
const { text, wrapText, caption } = require('../lib/marks.js');
const { seg, easeOut, spring } = motion;

const LX = 290, TOP = 540, BOT = 1440, DRAW = [0.1, 0.8];

function path() {
  const pts = [];
  for (let y = TOP; y <= BOT; y += 10) pts.push({ x: LX + Math.sin((y - TOP) / 90) * 18, y });
  return pts;
}

function day(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 4;
  const steps = (props.steps || []).slice(0, 5);
  const n = steps.length;
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.12)));

  const p = easeOut(seg(t, DRAW[0], DRAW[1]));
  pen.line(ctx, path(), { width: 8, color: theme.soft, amp: 1, seed: 1101, upto: p });

  const yAt = (i) => (n > 1 ? TOP + (i * (BOT - TOP)) / (n - 1) : TOP);
  steps.forEach((s, i) => {
    const reach = n > 1 ? i / (n - 1) : 0;
    const k = spring(seg(p, reach - 0.02, reach + 0.12));
    if (k <= 0) return;
    const y = yAt(i), x = LX + Math.sin((y - TOP) / 90) * 18;
    const hi = i === props.highlight;
    pen.shape(ctx, pen.ellipse(x, y, 26 * k, 26 * k, 24), { fill: hi ? C.rose : theme.swash, width: 5, seed: 1110 + i, offset: 0 });
    const lines = wrapText(s.label || '', 560, { size: 60, balance: true }).slice(0, 2);
    lines.forEach((ln, j) => text(ctx, ln, LX + 70, y + 18 + j * 64, { size: 60, alpha: Math.min(1, k), color: hi ? theme.accent : theme.text }));
    text(ctx, s.time || '', LX + 72, y + 18 + lines.length * 64 - 10, { font: 'Inter', weight: 600, size: 28, spacing: 2, color: theme.soft, alpha: Math.min(1, k) });
  });

  // The host walks down the path, a little ahead of the line.
  const at = TOP + p * (BOT - TOP);
  const hop = Math.abs(Math.sin(sec * 6)) * 12 * (p < 1 ? 1 : 0);
  tomato(ctx, props.host || 'Roma Tom', LX - 160, Math.min(BOT, at) - hop, 170, {
    scale: spring(seg(t, 0.02, 0.14)), angle: Math.sin(sec * 6) * 0.06 * (p < 1 ? 1 : 0),
  });
}

day.cues = (props) => {
  const n = Math.min(5, (props.steps || []).length);
  const cues = [];
  for (let i = 0; i < n; i++) {
    const reach = n > 1 ? i / (n - 1) : 0;
    // p is eased, so a stop is reached a little earlier than a linear share of the window.
    const u = 1 - Math.cbrt(1 - reach);
    cues.push({ t: DRAW[0] + u * (DRAW[1] - DRAW[0]), sfx: i === props.highlight ? 'ding' : 'pop', gain: 0.5 });
  }
  return cues;
};

module.exports = day;
