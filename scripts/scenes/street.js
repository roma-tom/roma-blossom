// 25. The Street: two shops on the same street, one above the other, with the same guests
// walking past both, day after day. Some turn in at a shop's door; its "came in" counter ticks
// up. A pill at the top shows the day. At the end the winner's count is circled.
// For positioning, signs and offers: same foot traffic, different results.
//
// props: {
//   caption,
//   days: ['MON', 'TUE', 'WED'] (1 to 7; the pill steps through them),
//   top:    { label: 'FOR EVERYONE', sign: 'Lunch for *everyone*', owner: 'Sam',
//             counts: [0, 1, 1] (came in, running total at the end of each day),
//             start: 0 (count before the first day), awning: 'red' | 'green' (default red on top, green below),
//             shouts: ['Something for all!', ...] (one short line per day, optional) },
//   bottom: { ...the same },
//   passers: 5 (guests walking by each lane per day; both lanes get the same street),
//   winner: 'top' | 'bottom' (optional: circled at the end)
// }

const { C, THEMES, kicker, headline, tomato, pen, motion } = require('../lib/kit.js');
const { text, measure, wrapText, caption, loop, bubble } = require('../lib/marks.js');
const { seg, easeOut, spring, breathe, clamp } = motion;

const LANES = { top: 560, bottom: 1060 }; // lane top y; each lane is 480 tall
const GROUND = 440; // ground line, from the lane top
const SHOP_X = 560, SHOP_W = 350, DOOR_X = 852;
const WALK0 = 0.1, WALK1 = 0.86; // the days run across this part of the scene
const CROSS = 0.3; // share of the scene a guest takes to cross the whole street
const SPEED = 1400 / CROSS; // px per unit of t
const SIZE = 128, MAX_IN = 4; // walker size; at most this many walkers turn in per day
const NAMES = ['Maria', 'Dev', 'Ana', 'Sam', 'Lee', 'Kim', 'Jo', 'Priya', 'Leo', 'Nia', 'Omar', 'Ruth', 'Ivy', 'Ben', 'Zoe', 'Max', 'Eli', 'Rosa', 'Kai', 'Tess'];

const daysOf = (p) => (p.days?.length ? p.days : ['MON', 'TUE', 'WED', 'THU', 'FRI']).slice(0, 7);
const dayWindow = (p, d) => {
  const n = daysOf(p).length, span = (WALK1 - WALK0) / n;
  return [WALK0 + d * span, WALK0 + (d + 1) * span];
};

// Everyone who walks down a lane: when they reach the door, whether they turn in, and how
// many of the count each one carries (a busy day shows a few walkers for a big jump).
function walkers(p, lane) {
  const o = p[lane] || {}, days = daysOf(p), passers = Math.max(2, Math.min(8, p.passers ?? 5));
  const list = [];
  let prev = o.start ?? 0;
  days.forEach((_, d) => {
    const now = o.counts?.[d] ?? prev, gain = Math.max(0, now - prev);
    const k = Math.min(gain, MAX_IN, passers);
    // Spread the ones who turn in evenly through the day, the rest walk past.
    const enters = new Set();
    for (let j = 0; j < k; j++) enters.add(Math.floor(((j + 0.5) * passers) / k));
    const [a, b] = dayWindow(p, d);
    let carried = 0;
    for (let i = 0; i < passers; i++) {
      const at = a + ((i + 0.6) / passers) * (b - a);
      const share = enters.has(i) ? Math.round((gain * (carried + 1)) / k) - Math.round((gain * carried) / k) : 0;
      if (enters.has(i)) carried++;
      // Same street, same people: the name depends on the day and slot, not the lane.
      list.push({ at, enter: enters.has(i), share, name: NAMES[(d * 7 + i * 3) % NAMES.length], phase: i * 1.7 + d });
    }
    prev = now;
  });
  // The street stays busy after the last day: more guests walk past, and nobody turns in.
  const span = (WALK1 - WALK0) / days.length;
  for (let i = 0; i < passers; i++) {
    list.push({ at: WALK1 + ((i + 0.6) / passers) * span, enter: false, share: 0, name: NAMES[(days.length * 7 + i * 3) % NAMES.length], phase: i * 1.7 });
  }
  return list;
}

function count(p, lane, t) {
  const o = p[lane] || {};
  let n = o.start ?? 0;
  for (const w of walkers(p, lane)) if (w.enter && t >= w.at) n += w.share;
  return n;
}

function shop(ctx, theme, o, top, seed, sec, appear, stripe) {
  const g = top + GROUND, x = SHOP_X, w = SHOP_W;
  ctx.save();
  ctx.globalAlpha *= appear;
  // The front wall, the door and the window.
  pen.shape(ctx, pen.roundRect(x + 10, g - 270, w - 20, 270, 6), { fill: C.card, width: 6, seed, offset: 4 });
  pen.shape(ctx, pen.roundRect(DOOR_X - 38, g - 200, 76, 200, 8), { fill: C.line, width: 5, seed: seed + 1, offset: 0 });
  pen.line(ctx, pen.ellipse(DOOR_X + 22, g - 100, 5, 5, 12), { width: 4, seed: seed + 2, closed: true, amp: 0.4 });
  // The owner behind the counter.
  tomato(ctx, o.owner || 'Sam', x + 120, g - 150, 150, { squash: breathe(sec + seed) });
  pen.shape(ctx, pen.roundRect(x + 30, g - 105, 200, 105, 6), { fill: theme.mark, width: 6, seed: seed + 3, offset: 0 });
  // A coffee cup on the counter, with steam.
  pen.shape(ctx, pen.roundRect(x + 175, g - 145, 34, 40, 6), { fill: C.card, width: 4, seed: seed + 4, offset: 0 });
  const s = pen.getBoil() % 2;
  pen.line(ctx, [{ x: x + 190, y: g - 155 }, { x: x + 182 + s * 4, y: g - 172 }, { x: x + 194, y: g - 190 }], { width: 4, color: C.muted, amp: 1.5, seed: seed + 5 });
  // The awning: stripes in tomato and card, scalloped at the bottom.
  const ay = g - 300, n = 7, sw = (w + 20) / n;
  for (let i = 0; i < n; i++) {
    const sx = x - 10 + i * sw;
    const pts = [{ x: sx, y: ay }, { x: sx + sw, y: ay }, { x: sx + sw, y: ay + 44 }];
    for (let j = 1; j < 8; j++) pts.push({ x: sx + sw - (sw * j) / 8, y: ay + 44 + Math.sin((j / 8) * Math.PI) * 16 });
    pts.push({ x: sx, y: ay + 44 });
    pen.shape(ctx, pts, { fill: i % 2 ? C.card : stripe, width: 5, seed: seed + 10 + i, offset: 0, amp: 1 });
  }
  // The sign above the awning.
  const sy = g - 430;
  pen.shape(ctx, pen.roundRect(x, sy, w, 118, 14), { fill: C.card, width: 6, seed: seed + 20, offset: 4 });
  const plain = (o.sign || '').replace(/\*/g, '');
  const size = wrapText(plain, w - 40, { size: 50 }).length > 2 ? 40 : 50;
  const lines = wrapText(plain, w - 40, { size, balance: true }).slice(0, 3);
  headline(ctx, { ...THEMES.paper, swash: C.lime }, o.sign || '', {
    x: x + w / 2, y: sy + 59 - (lines.length * size * 1.02) / 2 - 4, size, maxW: w - 40, seed: seed + 21,
  });
  ctx.restore();
}

function lane(ctx, theme, t, p, key, sec) {
  const o = p[key] || {}, top = LANES[key], g = top + GROUND, seed = key === 'top' ? 2500 : 2600;
  const appear = 1; // shops and counts are there from the first frame, so the scene can open a video
  const winner = p.winner === key, loser = p.winner && !winner;
  const fade = easeOut(seg(t, 0.88, 0.96));

  ctx.save();
  ctx.globalAlpha *= loser ? 1 - fade * 0.45 : 1;
  // The pavement.
  pen.line(ctx, [{ x: -20, y: g }, { x: 1100, y: g }], { width: 6, color: theme.text, amp: 2, seed: seed + 30 });
  shop(ctx, theme, o, top, seed, sec, appear, o.awning === 'green' || (!o.awning && key === 'bottom') ? C.forest : C.tomato);

  // What the owner shouts that day, in a bubble to the left of the shop.
  const days = daysOf(p);
  const d = clamp(Math.floor((t - WALK0) / ((WALK1 - WALK0) / days.length)), 0, days.length - 1);
  const shout = o.shouts?.[d];
  if (shout && t > WALK0) {
    const [a, b] = dayWindow(p, d);
    const k = spring(seg(t, a, a + 0.05)) * (1 - easeOut(seg(t, b - 0.03, b)));
    if (k > 0) {
      // One line, shrunk to fit, so it never reaches the counter above it.
      const fs = Math.max(34, Math.min(46, Math.floor(46 * 330 / Math.max(1, measure(shout, { size: 46 })))));
      const bw = 360, bh = 92, bx = 190, by = top + 162;
      ctx.save();
      ctx.translate(SHOP_X, by + bh);
      ctx.scale(k, k);
      ctx.translate(-SHOP_X, -(by + bh));
      bubble(ctx, bx, by, bw, bh, SHOP_X + 62, g - 140, C.card, seed + 40 + d);
      text(ctx, shout, bx + bw / 2, by + 60, { size: fs, align: 'center' });
      ctx.restore();
    }
  }

  // The label and the counter, top left.
  text(ctx, o.label || '', 60, top + 40, { font: 'Inter', size: 26, spacing: 4, color: theme.soft, alpha: appear });
  const n = count(p, key, t);
  // The counter jumps a little each time someone comes in.
  const last = walkers(p, key).filter((w) => w.enter && t >= w.at).pop();
  const bump = last ? 1 + 0.25 * (1 - spring(seg(t, last.at, last.at + 0.04))) : 1;
  ctx.save();
  ctx.translate(60, top + 150);
  ctx.scale(bump, bump);
  text(ctx, String(n), 0, 0, { size: 120, color: winner && fade > 0 ? theme.good : theme.text, alpha: appear });
  ctx.restore();
  const nw = measure(String(n), { size: 120 });
  text(ctx, 'came in', 60 + nw * bump + 18 + (winner ? 34 * fade : 0), top + 140, { size: 46, color: theme.soft, alpha: appear });
  if (winner) loop(ctx, 60 + nw / 2, top + 108, nw / 2 + 26, 58, fade, theme.good, seed + 50);

  // The guests walking by. Those who turn in shrink into the door.
  for (const w of walkers(p, key)) {
    let x = DOOR_X + (t - w.at) * SPEED, alpha = 1, scale = 1;
    if (w.enter && t > w.at) {
      const go = seg(t, w.at, w.at + 0.035);
      x = DOOR_X;
      scale = 1 - go * 0.45;
      alpha = 1 - go;
    }
    if (x < -100 || x > 1180 || alpha <= 0) continue;
    const step = (x / 70) + w.phase;
    const hop = Math.abs(Math.sin(step * Math.PI));
    tomato(ctx, w.name, x, g - SIZE / 2 - 4 - hop * 16, SIZE, { squash: 1 + (1 - hop) * 0.06, angle: Math.sin(step * Math.PI) * 0.06, alpha, scale });
  }
  ctx.restore();
}

function street(ctx, theme, t, props, info = {}) {
  const sec = info.sec ?? t * 8;
  caption(ctx, theme, props.caption, easeOut(seg(t, 0, 0.1)));
  lane(ctx, theme, t, props, 'top', sec);
  lane(ctx, theme, t, props, 'bottom', sec + 3);
  // The divider between the two shops' stretches of street.
  pen.line(ctx, [{ x: 40, y: LANES.bottom - 22 }, { x: 1040, y: LANES.bottom - 22 }], { width: 3, color: theme.rule, amp: 1.5, seed: 2701 });
  // The day pill.
  const days = daysOf(props);
  const d = clamp(Math.floor((t - WALK0) / ((WALK1 - WALK0) / days.length)), 0, days.length - 1);
  kicker(ctx, days[d], 540, 488, { seed: 2710 + d });
}

street.cues = (props) => {
  const cues = [];
  const days = daysOf(props);
  days.forEach((_, d) => cues.push({ t: dayWindow(props, d)[0], sfx: 'tick', gain: 0.5 }));
  for (const key of ['top', 'bottom']) {
    for (const w of walkers(props, key)) if (w.enter) cues.push({ t: w.at, sfx: 'pop', gain: 0.4 });
    (props[key]?.shouts || []).forEach((s, d) => s && cues.push({ t: dayWindow(props, d)[0], sfx: 'boing', gain: 0.3 }));
  }
  if (props.winner) cues.push({ t: 0.88, sfx: 'chime', gain: 0.5 });
  return cues;
};

module.exports = street;
