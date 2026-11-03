// Text helpers and the hand-drawn marks owners would make with a pen: ticks, circles,
// stars, crossings-out, underlines, dashed rules. Every mark takes p (0..1) so it can draw itself on.

const { createCanvas } = require('@napi-rs/canvas');
const { C, headline, pen } = require('./kit.js');

const scratch = createCanvas(8, 8).getContext('2d');

function setFont(ctx, o) {
  const size = o.size ?? 56, font = o.font ?? 'Gaegu';
  ctx.font = `${o.weight ?? 700} ${size}px ${font}, Inter`; // Inter fills in glyphs Gaegu lacks, like × and −
  ctx.letterSpacing = `${o.spacing ?? (font === 'Gaegu' ? -size * 0.02 : 0)}px`;
}

// One line of text. o: { size, font ('Gaegu' | 'Inter'), weight, color, align, alpha, spacing }
// Returns its width.
function text(ctx, str, x, y, o = {}) {
  if ((o.alpha ?? 1) <= 0) return 0;
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  setFont(ctx, o);
  ctx.fillStyle = o.color || C.ink;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
  const w = ctx.measureText(str).width;
  ctx.letterSpacing = '0px'; // not part of save/restore in @napi-rs/canvas
  ctx.restore();
  return w;
}

function measure(str, o = {}) {
  setFont(scratch, o);
  const w = scratch.measureText(str).width;
  scratch.letterSpacing = '0px';
  return w;
}

// Break str into lines no wider than maxW. o.balance narrows the block as far as it goes
// without adding a line, so no word is left on its own (for short text like checklist steps).
function wrapText(str, maxW, o = {}) {
  const words = String(str).split(/\s+/).filter(Boolean);
  const greedy = (limit) => {
    const lines = [];
    let cur = '';
    for (const word of words) {
      const next = cur ? `${cur} ${word}` : word;
      if (cur && measure(next, o) > limit) {
        lines.push(cur);
        cur = word;
      } else cur = next;
    }
    if (cur) lines.push(cur);
    return lines;
  };
  let lines = greedy(maxW);
  if (o.balance) {
    // Stop once every word has its own line: narrowing further can't change anything.
    for (let limit = maxW - 10; lines.length > 1 && lines.length < words.length; limit -= 10) {
      const next = greedy(limit);
      if (next.length > lines.length) break;
      lines = next;
    }
  }
  return lines;
}

// The line of story at the top of a scene, below the app's top bar. *word* gets a swash.
function caption(ctx, theme, str, appear) {
  if (!str) return 250;
  return headline(ctx, theme, str, { y: 250, size: 76, maxW: 860, appear, seed: 41 });
}

// 4.5 → "$4.50", -0.85 → "−$0.85", 21600 → "$21,600".
function money(v, cur = '$', dp) {
  const neg = v < 0;
  v = Math.abs(v);
  dp = dp ?? (Number.isInteger(v) && v >= 100 ? 0 : 2);
  const s = v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  return `${neg ? '−' : ''}${cur}${s}`;
}

function check(ctx, x, y, s, p, color = C.forest, seed = 1) {
  const pts = [{ x: x - s * 0.45, y: y - s * 0.02 }, { x: x - s * 0.12, y: y + s * 0.36 }, { x: x + s * 0.55, y: y - s * 0.5 }];
  pen.line(ctx, pts, { width: s * 0.17, color, amp: 1.5, seed, upto: p });
}

// A loose loop around something, the way you'd circle a number on a receipt.
function loop(ctx, cx, cy, rx, ry, p, color = C.rose, seed = 1, width = 7) {
  const pts = [];
  const a0 = -2.6, turns = 1.12, n = 80;
  for (let i = 0; i <= n; i++) {
    const u = i / n, a = a0 + u * turns * Math.PI * 2, grow = 1 + 0.08 * u;
    pts.push({ x: cx + rx * grow * Math.cos(a), y: cy + ry * grow * Math.sin(a) });
  }
  pen.line(ctx, pts, { width, color, amp: 3, seed, upto: p });
}

function star(ctx, cx, cy, r, fill = C.tomato, seed = 1, width = 5) {
  if (r <= 0) return;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    pts.push({ x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a) });
  }
  pen.shape(ctx, pts, { fill, width, amp: 1, seed, offset: 0 });
}

function strike(ctx, x0, x1, y, p, color = C.rose, seed = 1) {
  pen.line(ctx, [{ x: x0, y: y + 6 }, { x: x1, y: y - 6 }], { width: 8, color, amp: 3, seed, upto: p });
}

// A wavy underline.
function squiggle(ctx, x0, x1, y, p, color = C.rose, seed = 1, width = 6) {
  const pts = [];
  for (let x = x0; x <= x1; x += 6) pts.push({ x, y: y + Math.sin((x - x0) / 14) * 5 });
  pen.line(ctx, pts, { width, color, amp: 1, seed, upto: p });
}

function dashed(ctx, x0, x1, y, color = C.muted, seed = 1) {
  for (let x = x0, i = 0; x < x1; x += 30, i++) {
    pen.line(ctx, [{ x, y }, { x: Math.min(x1, x + 16), y }], { width: 4, color, amp: 0.6, seed: seed + i });
  }
}

// An X, drawn as two strokes one after the other.
function cross(ctx, x, y, s, p, color = C.rose, seed = 1, width = 7) {
  const h = s / 2;
  pen.line(ctx, [{ x: x - h, y: y - h }, { x: x + h, y: y + h }], { width, color, amp: 1, seed, upto: Math.min(1, p * 2) });
  pen.line(ctx, [{ x: x + h, y: y - h }, { x: x - h, y: y + h }], { width, color, amp: 1, seed: seed + 1, upto: Math.max(0, p * 2 - 1) });
}

// A hand-drawn phone: ink body, card screen, notch. Returns the screen's inner box.
function phone(ctx, x, y, w, h, seed = 301) {
  pen.shape(ctx, pen.roundRect(x, y, w, h, 70), { fill: C.ink, width: 6, seed, offset: 0 });
  pen.fill(ctx, pen.roundRect(x + 22, y + 22, w - 44, h - 44, 50), C.card, { seed: seed + 1 });
  pen.fill(ctx, pen.roundRect(x + w / 2 - 70, y + 38, 140, 30, 15), C.ink, { seed: seed + 2, amp: 0.5 });
  return { x: x + 22, y: y + 22, w: w - 44, h: h - 44 };
}

// A speech bubble: a rounded box with a tail ending at (tx, ty) below it.
function bubble(ctx, x, y, w, h, tx, ty, fill = C.card, seed = 1) {
  const box = pen.roundRect(x, y, w, h, 36);
  // Splice the tail into the bottom edge (points 9..17 run along the bottom-right corner,
  // 18..26 the bottom-left), between the two bottom corners.
  const base = Math.min(Math.max(tx, x + 70), x + w - 70);
  const tail = [{ x: base + 40, y: y + h }, { x: tx, y: ty }, { x: base - 40, y: y + h }];
  const pts = [...box.slice(0, 18), ...tail, ...box.slice(18)];
  pen.shape(ctx, pts, { fill, width: 6, seed, offset: 4 });
}

module.exports = { text, measure, wrapText, caption, money, check, loop, star, strike, squiggle, dashed, cross, phone, bubble };
