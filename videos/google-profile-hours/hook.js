// This video's own hook.
//
// The idea: a phone fills the screen with a map pin bouncing and "OPEN NOW" glowing green; the
// camera pulls back, the phone shrinks into Ivan's hand, and he's standing in front of a cafe
// with its shutter down and a CLOSED sign swinging on the door.
// Frame one shows: the pin mid-bounce on the map, the OPEN NOW dot pulsing.
// Readable by 0.5 s: CAFE OWNERS, and Ivan's line, "It said you were *open*."
// The open loop: why did Google say open, and what does that cost the cafe?
//
// props: { label, line, status, closed }

const { W, C, kicker, tomato, pen } = require('../../scripts/lib/kit.js');
const { text, star } = require('../../scripts/lib/marks.js');
const S = require('../../scripts/lib/stage.js');

const FLOOR = 1500;
const SHOP = { x: 470, w: 520, top: 840 };
const IVAN = { x: 250, y: FLOOR - 235, size: 470 };
const PULL = [0.9, 1.7];

// The cafe, shut: walls, a rolled-down shutter over the window and door, a CLOSED sign.
function shop(ctx, theme, sec, closed) {
  const { x, w, top } = SHOP;
  pen.shape(ctx, pen.roundRect(x, top, w, FLOOR - top, 10), { fill: C.card, width: 6, seed: 4101, offset: 0 });
  // Awning (folded up flat: the cafe is closed).
  const n = 5, sw = w / n;
  for (let i = 0; i < n; i++) {
    const sx = x + i * sw;
    pen.shape(ctx, [{ x: sx, y: top - 40 }, { x: sx + sw, y: top - 40 }, { x: sx + sw, y: top + 20 }, { x: sx, y: top + 20 }],
      { fill: i % 2 ? C.card : C.rose, width: 5, seed: 4110 + i, offset: 0 });
  }
  // The shutter: a gray-ish slatted panel, drawn in the soft line color.
  const sx0 = x + 40, sx1 = x + w - 40, sy0 = top + 80, sy1 = FLOOR - 10;
  pen.shape(ctx, pen.roundRect(sx0, sy0, sx1 - sx0, sy1 - sy0, 8), { fill: C.line, width: 6, seed: 4120, offset: 0 });
  for (let y = sy0 + 50, i = 0; y < sy1 - 20; y += 50, i++) {
    pen.line(ctx, [{ x: sx0 + 12, y }, { x: sx1 - 12, y: y + 2 }], { width: 4, color: C.muted, seed: 4130 + i, alpha: 0.6 });
  }
  // The CLOSED sign, hanging from two strings and swinging to rest.
  const swing = Math.sin(sec * 7) * 0.18 * Math.exp(-Math.max(0, sec - 1.4) * 1.2);
  const cx = x + w / 2, cy = top + 300;
  ctx.save();
  ctx.translate(cx, top + 150); ctx.rotate(swing); ctx.translate(-cx, -(top + 150));
  pen.line(ctx, [{ x: cx - 90, y: cy - 50 }, { x: cx, y: top + 150 }, { x: cx + 90, y: cy - 50 }], { width: 4, seed: 4140 });
  pen.shape(ctx, pen.roundRect(cx - 150, cy - 50, 300, 110, 14), { fill: C.card, width: 6, seed: 4141, offset: 3 });
  text(ctx, closed, cx, cy + 22, { size: 64, align: 'center', color: C.rose });
  ctx.restore();
}

// The phone: a map with streets and a bouncing pin, and a listing card saying OPEN NOW.
function phone(ctx, theme, sec, status) {
  const pw = 470, ph = 820, x = -pw / 2, y = -ph / 2;
  pen.shape(ctx, pen.roundRect(x, y, pw, ph, 56), { fill: C.ink, width: 6, seed: 4201, offset: 0 });
  pen.shape(ctx, pen.roundRect(x + 22, y + 60, pw - 44, ph - 120, 30), { fill: C.paper, width: 0, seed: 4202, offset: 0 });
  // Streets.
  [[-200, -260, 200, -200], [-200, -60, 200, -120], [-90, -380, -40, 60], [110, -380, 70, 60]].forEach(([a, b, c, d], i) =>
    pen.line(ctx, [{ x: a, y: b }, { x: c, y: d }], { width: 22, color: C.line, seed: 4210 + i }));
  // The pin, bouncing.
  const hop = Math.abs(Math.sin(sec * 6)) * 34 * (1 - S.at(sec, PULL[0], PULL[1]));
  const px = 20, py = -170 - hop;
  const pin = [];
  for (let i = 0; i <= 20; i++) { const a = Math.PI * 0.8 + (Math.PI * 1.4 * i) / 20; pin.push({ x: px + Math.cos(a) * 52, y: py - 70 + Math.sin(a) * 52 }); }
  pin.push({ x: px, y: py });
  pen.shape(ctx, pin, { fill: C.rose, width: 5, seed: 4220, offset: 0 });
  pen.shape(ctx, pen.ellipse(px, py - 72, 18, 18, 16), { fill: C.card, width: 4, seed: 4221, offset: 0 });
  // Listing card: stars and the status, a green dot pulsing beside it.
  pen.shape(ctx, pen.roundRect(x + 46, 60, pw - 92, 230, 22), { fill: C.card, width: 5, seed: 4230, offset: 0 });
  for (let i = 0; i < 5; i++) star(ctx, x + 110 + i * 62, 120, 22, C.tomato, 4240 + i, 4);
  const pulse = 1 + 0.25 * Math.max(0, Math.sin(sec * 8));
  pen.shape(ctx, pen.ellipse(x + 100, 215, 20 * pulse, 20 * pulse, 16), { fill: C.forest, width: 0, seed: 4250, offset: 0 });
  text(ctx, status, x + 140, 236, { size: 58, color: C.forestDark });
}

function hook(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 3.5;
  const k = S.at(sec, PULL[0], PULL[1], S.easeInOut);

  kicker(ctx, props.label || '', W / 2, 250, { seed: 4301 });

  // The world behind, zoomed in at first, pulling back to full size.
  const zoom = 1.5 - 0.5 * k, ox = 540, oy = 1150;
  ctx.save();
  ctx.translate(ox, oy); ctx.scale(zoom, zoom); ctx.translate(-ox, -oy);
  pen.line(ctx, [{ x: -60, y: FLOOR }, { x: 1140, y: FLOOR - 4 }], { width: 7, seed: 4302 });
  shop(ctx, theme, sec, props.closed || '');
  const turn = S.at(sec, 1.8, 2.2);
  tomato(ctx, 'Ivan', IVAN.x, IVAN.y, IVAN.size, { squash: S.breathe(sec), angle: 0.05 + 0.08 * turn });
  ctx.restore();

  // Ivan's head on screen after the zoom, for the reaction and the bubble's tail.
  const hx = ox + (IVAN.x - ox) * zoom, hy = oy + (IVAN.y - 90 - oy) * zoom;
  S.reaction(ctx, theme, 'sweat', hx, hy, S.seg(sec, 1.8, 2.3));

  // The phone: full screen at first, then shrinking down into Ivan's hand.
  const ph = { x: 540 + (hx + 215 - 540) * k, y: 1080 + (hy + 150 - 1080) * k, s: 1 - 0.7 * k, a: 0.16 * k };
  ctx.save();
  ctx.translate(ph.x, ph.y); ctx.rotate(ph.a); ctx.scale(ph.s, ph.s);
  phone(ctx, theme, sec, props.status || '');
  ctx.restore();

  // His line, readable from the start.
  S.say(ctx, props.line || '', { x: 110, y: 340, w: 860, tx: hx + 40, ty: Math.max(640, hy - 200), k: S.pop(sec, 0, 0.3), size: 92, seed: 4310 });
}

hook.cues = () => [
  { sec: 0.05, sfx: 'blip', gain: 0.45 },
  { sec: 0.55, sfx: 'tap', gain: 0.3 },
  { sec: 0.95, sfx: 'whoosh', gain: 0.45 },
  { sec: 1.75, sfx: 'clink', gain: 0.4 },
];
hook.cover = (p) => ({ kicker: p.label, headline: p.line });

module.exports = hook;
