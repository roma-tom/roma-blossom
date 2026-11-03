// A still cover image for a video: the hook's question and one focal point, big and centered,
// so it survives every platform's crop.
//
//   node scripts/cover.js videos/<slug>/storyboard.json            → videos/<slug>/cover.jpg
//   node scripts/cover.js videos/<slug>/storyboard.json --guides   → also out/<slug>-cover-guides.png
//
// The image is 1080 × 1920, but everything that matters sits inside the center square
// (y 420 to 1500): Instagram and TikTok grids crop covers to about 3:4, feeds and some
// previews to 4:5 or 1:1, and Facebook shows the whole frame. --guides draws those crops.
//
// The text comes from the first hook scene. The focal point under it ("hero") varies so a feed
// of covers doesn't repeat:
//   tomato    one guest tomato from the video (or cover.name)
//   crowd     three guest tomatoes in a row (or cover.names)
//   number    the video's key number, circled (or cover.number and cover.label)
//   headline  no picture: the question alone, bigger
//   host      Roma Tom (only when chosen, or when nothing else fits)
// Without cover.hero, it picks one from what the video contains, varied by the folder name.
// "cover": { hero, name, names, number, label, kicker, headline, background } overrides any of it.

const fs = require('fs');
const path = require('path');
const { W, H, C, THEMES, frame, background, rays, kicker, headline, tomato, pen } = require('./lib/kit.js');
const { text, measure, money, loop } = require('./lib/marks.js');

const SQUARE = { top: (H - W) / 2, bottom: (H + W) / 2 }; // 420 … 1500
const CROPS = [
  { label: '1:1', h: W },
  { label: '4:5', h: (W * 5) / 4 },
  { label: '3:4', h: (W * 4) / 3 },
];
const HOST = 'Roma Tom';

// The largest headline size (up to `max` px) that fits in `lines` lines and maxH pixels.
function fitHeadline(theme, str, maxH, lines = 3, max = 168) {
  const { ctx } = frame();
  for (let size = max; size >= 96; size -= 8) {
    const bottom = headline(ctx, theme, str, { y: 0, size, maxW: 900 });
    if (bottom <= maxH && bottom <= size * 1.02 * lines + 1) return size;
  }
  return 96;
}

// Guest names used anywhere in the video's scenes (not the host), in order of appearance.
function guestNames(board) {
  const names = [];
  const add = (n) => typeof n === 'string' && n.trim() && n !== HOST && !names.includes(n) && names.push(n);
  for (const sc of board.scenes || []) {
    const p = sc.props || {};
    [p.name, p.contact, p.cook, p.left?.name, p.right?.name].forEach(add);
    (p.guests || []).forEach((g) => add(typeof g === 'string' ? g : g.name));
    (p.queue || []).forEach(add);
    (p.staff || []).forEach((st) => add(st.name));
  }
  return names;
}

// The video's headline number, with a short label, from the scenes that carry one.
function keyNumber(board) {
  for (const sc of board.scenes || []) {
    const p = sc.props || {};
    const cur = p.currency ?? '$';
    if (sc.type === 'jar' && p.total != null) return { number: money(p.total, cur, 0), label: p.label || '' };
    if (sc.type === 'receipt' && (p.items || []).length) {
      return { number: money(p.total ?? p.items.reduce((s, it) => s + it.amount, 0), cur), label: (p.totalLabel || '').toLowerCase() };
    }
    if (sc.type === 'gauge' && p.value != null) return { number: `${p.value}${p.unit ?? ''}`, label: p.label || '' };
    if (sc.type === 'regulars' && p.stat) return { number: p.stat.value, label: p.stat.label };
    if (sc.type === 'floor' && p.stat) return { number: p.stat.value, label: p.stat.label };
  }
  return null;
}

// Which focal point to use, and what it shows.
function pickHero(board, o, slug) {
  const names = o.names || guestNames(board);
  const num = o.number ? { number: o.number, label: o.label || '' } : keyNumber(board);
  const options = {
    tomato: names.length || o.name ? { name: o.name || names[0] } : null,
    crowd: names.length >= 3 ? { names: names.slice(0, 3) } : null,
    number: num,
    headline: {},
    host: {},
  };
  if (o.hero && options[o.hero]) return { kind: o.hero, ...options[o.hero] };
  const choices = ['tomato', 'crowd', 'number', 'headline'].filter((k) => options[k]);
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const kind = choices[h % choices.length];
  return { kind, ...options[kind] };
}

// Draw the focal point into the box from y0 to y1 (inside the square).
function drawHero(ctx, theme, hero, y0, y1) {
  const room = y1 - y0;
  // A tomato `s` wide reaches about 0.38 s above its center (stem) and 0.36 s below (body).
  if (hero.kind === 'tomato' || hero.kind === 'host') {
    const s = Math.max(300, Math.min(640, room / 0.74));
    const cy = y0 + 0.38 * s;
    rays(ctx, theme, { cx: W / 2, cy, spin: -Math.PI / 2 + 0.2, reach: 1100 });
    tomato(ctx, hero.kind === 'host' ? HOST : hero.name, W / 2, cy, s);
  } else if (hero.kind === 'crowd') {
    const s = Math.max(260, Math.min(330, room / 0.74));
    const cy = y0 + 0.38 * s;
    rays(ctx, theme, { cx: W / 2, cy, spin: -Math.PI / 2 + 0.2, reach: 1100 });
    hero.names.forEach((n, i) => {
      const side = i === 0 ? 0 : i === 1 ? -1 : 1;
      tomato(ctx, n, W / 2 + side * 300, cy + Math.abs(side) * 24, side ? s * 0.9 : s, { angle: side * 0.12 });
    });
  } else if (hero.kind === 'number') {
    // The circle reaches about 0.62 × size above and below the number's middle; the label sits
    // under the circle. Shrink the number until all of it fits the room.
    const labelH = hero.label ? 90 : 0;
    let size = 260;
    while (size > 100 && (measure(hero.number, { size }) > 760 || size * 1.3 + labelH > room)) size -= 10;
    const cy = y0 + (room - labelH) / 2;
    rays(ctx, theme, { cx: W / 2, cy, spin: 0.3, reach: 1000 });
    const w = measure(hero.number, { size });
    text(ctx, hero.number, W / 2, cy + size * 0.32, { size, align: 'center', color: theme.accent });
    loop(ctx, W / 2, cy, w / 2 + 50, size * 0.62, 1, theme.accent, 77, 9);
    if (hero.label) text(ctx, hero.label, W / 2, cy + size * 0.65 + 70, { size: 64, align: 'center' });
  }
}

function renderCover(board, slug = '') {
  const hook = (board.scenes || []).find((s) => s.type === 'hook')?.props || {};
  const o = { ...hook, ...(board.cover || {}) };
  const theme = THEMES[o.background || board.background || 'paper'];
  const hero = pickHero(board, o, slug);
  const { canvas, ctx } = frame();
  pen.setBoil(0);
  background(ctx, theme);

  // Kicker, then the question, then the focal point in whatever room is left in the square.
  const kickerY = SQUARE.top + 80;
  const top = kickerY + 70;
  const alone = hero.kind === 'headline';
  const size = alone
    ? fitHeadline(theme, o.headline || '', SQUARE.bottom - 60 - top, 5, 200)
    : fitHeadline(theme, o.headline || '', 520);
  const { ctx: probe } = frame();
  const height = headline(probe, theme, o.headline || '', { y: 0, size, maxW: 900 });
  // On its own, the question sits in the middle of the square's remaining space.
  const headTop = alone ? top + (SQUARE.bottom - 40 - top - height) / 2 : top;
  if (alone) rays(ctx, theme, { cx: W / 2, cy: SQUARE.bottom + 200, spin: -Math.PI / 2, reach: 1300 });
  else drawHero(ctx, theme, hero, headTop + height + 10, SQUARE.bottom - 20);
  if (o.kicker) kicker(ctx, o.kicker, W / 2, kickerY);
  headline(ctx, theme, o.headline || '', { y: headTop, size, maxW: 900, seed: 9 });

  // The name, below the square: crops hide it, but full-frame views (Facebook) show it.
  ctx.save();
  ctx.font = '700 96px Gaegu';
  ctx.letterSpacing = '-2px';
  ctx.fillStyle = C.ink;
  ctx.textAlign = 'center';
  ctx.fillText(HOST, W / 2, SQUARE.bottom + 190);
  ctx.letterSpacing = '0px';
  ctx.restore();
  return { canvas, hero: hero.kind };
}

// The same image with each crop outlined, for checking.
function guides(cover) {
  const { canvas, ctx } = frame();
  ctx.drawImage(cover, 0, 0);
  CROPS.forEach((c, i) => {
    const y = (H - c.h) / 2;
    ctx.save();
    ctx.strokeStyle = ['#cb1a23', '#1f4f1c', '#2b1b17'][i];
    ctx.lineWidth = 6;
    ctx.setLineDash([24, 14]);
    ctx.strokeRect(8 + i * 10, y, W - 16 - i * 20, c.h);
    ctx.font = '700 34px Inter';
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillText(c.label, 30 + i * 10, y + 44);
    ctx.restore();
  });
  return canvas;
}

function writeCover(file, o = {}) {
  const board = JSON.parse(fs.readFileSync(file, 'utf8'));
  const dir = path.dirname(file);
  const { canvas: cover, hero } = renderCover(board, path.basename(path.resolve(dir)));
  const out = path.join(dir, 'cover.jpg');
  fs.writeFileSync(out, cover.toBuffer('image/jpeg', 92));
  if (o.guides) {
    const outDir = path.join(__dirname, '..', 'out');
    fs.mkdirSync(outDir, { recursive: true });
    const g = path.join(outDir, `${path.basename(path.resolve(dir))}-cover-guides.png`);
    fs.writeFileSync(g, guides(cover).toBuffer('image/png'));
    return [out, g, hero];
  }
  return [out, hero];
}

module.exports = { renderCover, writeCover };

if (require.main === module) {
  const file = process.argv[2];
  if (!file || !fs.existsSync(file)) {
    console.error('usage: node scripts/cover.js videos/<slug>/storyboard.json [--guides]');
    process.exit(1);
  }
  const res = writeCover(path.resolve(file), { guides: process.argv.includes('--guides') });
  console.log(`${res.slice(0, -1).join('\n')}\n(cover focal point: ${res[res.length - 1]})`);
}
