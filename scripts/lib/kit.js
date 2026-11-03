// Shared building blocks for every scene: canvas, brand colors, fonts, backgrounds,
// the sunrise rays, headlines and the tomato cast.

const path = require('path');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const Tomato = require('./tomato.js');
const pen = require('./pen.js');
const motion = require('./motion.js');

const W = 1080, H = 1920, FPS = 30;

// Roma Tom brand tokens.
const C = {
  paper: '#fbf5e9',
  card: '#fffaf0',
  line: '#e2d4bd',
  ink: '#2b1b17',
  muted: '#7a6455',
  rose: '#cb1a23',
  roseDark: '#4f0810',
  tomato: '#d8402f',
  forest: '#3f8f3a',
  forestDark: '#1f4f1c',
  lime: '#addb30',
  // Soft backgrounds: light enough that ink text, rose numbers and the card stay clear on them.
  butter: '#f6d66b',
  blush: '#f5c8bb',
  sky: '#c3dfe9',
  mint: '#d3e9c4',
};

const fonts = path.join(__dirname, '..', 'fonts');
GlobalFonts.registerFromPath(path.join(fonts, 'gaegu-700.woff2'), 'Gaegu');
GlobalFonts.registerFromPath(path.join(fonts, 'inter-variable.woff2'), 'Inter');

// Per-background colors: what a swash, the rays and the grain use on paper vs lime.
// accent and good are the rose and green that are safe as text on that background.
// mark is the fill for highlight blocks drawn on the background (bars, sticky notes, coins);
// rule is a faint grid line on the background.
const THEMES = {
  paper: { bg: C.paper, swash: C.lime, mark: C.lime, rule: C.line, rays: C.lime, raysAlpha: 0.26, grain: '#8a6a4a', text: C.ink, soft: C.muted, accent: C.rose, good: C.forest },
  lime: { bg: C.lime, swash: C.paper, mark: C.card, rule: C.paper, rays: C.paper, raysAlpha: 0.38, grain: '#2f4a10', text: C.ink, soft: C.forestDark, accent: C.roseDark, good: C.forestDark },
  butter: { bg: C.butter, swash: C.paper, mark: C.card, rule: C.paper, rays: C.paper, raysAlpha: 0.42, grain: '#7a5a10', text: C.ink, soft: C.roseDark, accent: C.rose, good: C.forestDark },
  blush: { bg: C.blush, swash: C.lime, mark: C.lime, rule: C.paper, rays: C.paper, raysAlpha: 0.42, grain: '#8a3a2a', text: C.ink, soft: C.roseDark, accent: C.rose, good: C.forestDark },
  sky: { bg: C.sky, swash: C.lime, mark: C.lime, rule: C.paper, rays: C.paper, raysAlpha: 0.45, grain: '#2a5a6a', text: C.ink, soft: '#1f4a5a', accent: C.rose, good: C.forestDark },
  mint: { bg: C.mint, swash: C.paper, mark: C.card, rule: C.paper, rays: C.paper, raysAlpha: 0.45, grain: '#3a5a2a', text: C.ink, soft: C.forestDark, accent: C.rose, good: C.forestDark },
};

function frame() {
  const canvas = createCanvas(W, H);
  return { canvas, ctx: canvas.getContext('2d') };
}

function background(ctx, theme) {
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);
  pen.grain(ctx, W, H, theme.grain, 11);
}

// The sunrise: pale wedges fanning out from (cx, cy), faded out with distance so text stays clear.
// spin turns the fan (radians); reach is where the fade reaches zero.
function rays(ctx, theme, o) {
  const { cx, cy, count = 14, spin = 0, reach = 1300, seed = 3 } = o;
  const layer = createCanvas(W, H), g = layer.getContext('2d');
  const step = (Math.PI * 2) / count, R = 2600;
  for (let i = 0; i < count; i++) {
    const a0 = spin + i * step, a1 = a0 + step * 0.5;
    const pts = [{ x: cx, y: cy }];
    for (let j = 0; j <= 6; j++) {
      const a = a0 + ((a1 - a0) * j) / 6;
      pts.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
    }
    pen.fill(g, pts, theme.rays, { amp: 6, seed: seed + i });
  }
  // Fade with distance from the center.
  g.globalCompositeOperation = 'destination-in';
  const grad = g.createRadialGradient(cx, cy, 0, cx, cy, reach);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(0.45, 'rgba(0,0,0,0.75)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = theme.raysAlpha;
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}

// A small uppercase label in a wobbly pill, centered on x.
function kicker(ctx, text, x, y, o = {}) {
  ctx.save();
  ctx.font = '700 34px Inter';
  ctx.letterSpacing = '5px';
  const tw = ctx.measureText(text).width;
  const w = tw + 70, h = 72;
  pen.shape(ctx, pen.roundRect(x - w / 2, y - h / 2, w, h, h / 2), { fill: C.card, width: 5, seed: o.seed ?? 21, offset: 0 });
  ctx.fillStyle = C.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 2.5, y + 2);
  ctx.letterSpacing = '0px'; // not part of save/restore in @napi-rs/canvas
  ctx.restore();
}

// Split "Why is your *Tuesday* so slow?" into words, marking the *starred* ones.
// A starred span can cover several words: "*1 in 3* come back".
function parseWords(text) {
  let inside = false;
  return text.split(/\s+/).filter(Boolean).map((w) => {
    const opens = w.startsWith('*');
    const hi = inside || opens;
    const stars = (w.match(/\*/g) || []).length;
    if (stars % 2) inside = !inside;
    return { text: w.replace(/\*/g, ''), hi };
  });
}

// Wrap words into lines no wider than maxW at the current font, then narrow the block as far
// as it goes without adding a line, so lines come out even and no word is left on its own.
function wrap(ctx, words, maxW) {
  const space = ctx.measureText(' ').width;
  for (const w of words) w.w = ctx.measureText(w.text).width;
  const greedy = (limit) => {
    const lines = [[]];
    let x = 0;
    for (const w of words) {
      const line = lines[lines.length - 1];
      if (line.length && x + space + w.w > limit) {
        lines.push([w]);
        x = w.w;
      } else {
        x += (line.length ? space : 0) + w.w;
        line.push(w);
      }
    }
    return lines;
  };
  let lines = greedy(maxW);
  // Stop once every word has its own line: narrowing further can't change anything.
  for (let limit = maxW - 10; lines.length > 1 && lines.length < words.length; limit -= 10) {
    const next = greedy(limit);
    if (next.length > lines.length) break;
    lines = next;
  }
  return { lines, space };
}

// A centered Gaegu headline. Starred words get a marker swash behind them.
// Each word sits at a tiny seeded angle and height, so it reads as written by hand.
// appear (0..1) reveals words in order; returns the bottom y of the block.
function headline(ctx, theme, text, o) {
  const { x = W / 2, y, size = 128, maxW = 860, seed = 5, appear = 1 } = o;
  ctx.save();
  ctx.font = `700 ${size}px Gaegu, Inter`; // Inter fills in glyphs Gaegu lacks, like × and −
  ctx.letterSpacing = `${-size * 0.02}px`; // Gaegu runs wide at headline sizes

  const { lines, space } = wrap(ctx, parseWords(text), maxW);
  const lh = size * 1.02;
  const total = lines.flat().length;
  const r = pen.rng(seed);
  let k = 0;
  lines.forEach((line, li) => {
    const lw = line.reduce((s, w) => s + w.w, 0) + space * (line.length - 1);
    let wx = x - lw / 2;
    const by = y + li * lh + size * 0.78;
    line.forEach((w, wi) => {
      const tilt = (r() - 0.5) * 0.06, lift = (r() - 0.5) * 8;
      // A swash runs on through the space when the next word is highlighted too.
      const joins = w.hi && line[wi + 1]?.hi;
      const shown = Math.min(1, Math.max(0, appear * total - k));
      k++;
      if (shown > 0) {
        ctx.save();
        ctx.globalAlpha *= shown;
        ctx.translate(wx + w.w / 2, by + lift + (1 - shown) * 30);
        ctx.rotate(tilt);
        if (w.hi) {
          const sx = -w.w / 2 - 6, ex = w.w / 2 + (joins ? space + 6 : 6), my = -size * 0.2;
          pen.line(ctx, [{ x: sx, y: my + 6 }, { x: sx + (ex - sx) * shown, y: my - 4 * shown }], {
            width: size * 0.42, color: theme.swash, amp: 3, seed: seed + k * 13,
          });
        }
        ctx.fillStyle = theme.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(w.text, 0, 0);
        ctx.restore();
      }
      wx += w.w + space;
    });
  });
  ctx.letterSpacing = '0px';
  ctx.restore();
  return y + lines.length * lh;
}

// Tomatoes are rendered once per name and size, then stamped into frames.
const tomatoCache = new Map();
function tomatoImage(name, size) {
  const key = `${name}|${size}`;
  if (!tomatoCache.has(key)) {
    const c = createCanvas(size, size);
    Tomato.render(c.getContext('2d'), Tomato.fromName(name).genes, { size, background: 'transparent' });
    tomatoCache.set(key, c);
  }
  return tomatoCache.get(key);
}

// Draw the tomato for `name` centered at (x, y), `size` px across its 512-unit box.
// squash > 1 flattens and widens it (landing), < 1 stretches it (jumping); angle tilts it;
// scale grows it from its base (pop-ins). It boils with the lines: a tiny seeded tilt and
// stretch that changes with the pen's boil counter.
function tomato(ctx, name, x, y, size, o = {}) {
  const { squash = 1, angle = 0, alpha = 1, scale = 1 } = o;
  if (scale <= 0) return;
  const img = tomatoImage(name, size);
  const b = pen.rng(pen.seedOf(name, pen.getBoil()));
  const jitterA = pen.getBoil() ? (b() - 0.5) * 0.02 : 0, jitterS = pen.getBoil() ? 1 + (b() - 0.5) * 0.012 : 1;
  ctx.save();
  ctx.globalAlpha *= alpha;
  // The tomato's body sits at (256, 276) in its 512 box; pivot around its bottom so squash looks grounded.
  const bottom = (276 + 165) / 512 * size;
  ctx.translate(x, y - size / 2 + bottom);
  ctx.rotate(angle + jitterA);
  ctx.scale(squash * scale * jitterS, (scale * jitterS) / squash);
  ctx.drawImage(img, -size / 2, -bottom);
  ctx.restore();
}

// Draw one scene's frame: its background, then the scene under a slow camera push.
// info: { sec (seconds into the scene), dur (scene length) }
function drawScene(ctx, scene, theme, t, info) {
  background(ctx, theme);
  const push = 1 + (scene.push ?? 0.03) * motion.easeInOut(t);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(push, push);
  ctx.translate(-W / 2, -H / 2);
  scene.draw(ctx, theme, t, scene.props || {}, info);
  ctx.restore();
}

module.exports = { W, H, FPS, C, THEMES, frame, background, rays, kicker, headline, tomato, drawScene, Tomato, pen, motion };
