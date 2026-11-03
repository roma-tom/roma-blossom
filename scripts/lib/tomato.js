/*
 * tomato.js — procedural tomato characters.
 *
 * A name is hashed to 32 bits. Each bit field (LSB first) picks one trait:
 *
 *   bits  0-4   color          (5)  32 hues: mostly reds, some orange, yellow, green
 *   bits  5-9   shape          (5)  8 polar-equation families x 4 parameter steps
 *   bits 10-12  rotation       (3)  body tilt
 *   bits 13-14  noise          (2)  hand-drawn style: wavy, jittery, loopy, offset
 *   bits 15     faceSize       (1)  regular or big face
 *   bits 16-18  face           (3)  8 smiley faces
 *   bits 19-21  stem           (3)  8 simple star-calyx variations
 *   bits 22-23  stemColor      (2)  4 greens
 *   bits 24-25  size           (2)  4 sizes
 *   bits 26-27  stemPlacement  (2)  stem angle on top
 *   bits 28-31  faceLayout     (4)  4 eye spacings x 4 face heights
 *
 * The 32-bit value also seeds the wobble, so the same genes always give the same drawing.
 */
(function (root) {
  'use strict';

  const TAU = Math.PI * 2;
  const UP = Math.PI / 2;
  const DOWN = -Math.PI / 2;
  const INK = '#2b1b17';

  // Set by render() for opts.outline: every line and label is drawn in this color and
  // fills are skipped, leaving only the line art.
  let outlineColor = null;
  // Set by render() for opts.labelColor: the label text and side bar use it instead of INK
  // (for lockups on dark backgrounds). The tomato's own lines keep their colors.
  let labelInk = null;

  // ---------------------------------------------------------------- hashing

  // Hand-picked tomatoes for specific names (keys are trimmed + lowercased).
  const NAME_OVERRIDES = {
    'roma tom': 0x4510a108,
  };

  // FNV-1a over UTF-8 bytes, finished with murmur3's fmix32 for avalanche.
  function hashName(name) {
    const key = String(name).trim().toLowerCase();
    if (Object.hasOwn(NAME_OVERRIDES, key)) return NAME_OVERRIDES[key];
    const bytes = new TextEncoder().encode(key);
    let h = 0x811c9dc5;
    for (const b of bytes) {
      h ^= b;
      h = Math.imul(h, 0x01000193);
    }
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Independent random stream per drawing layer, so layers don't disturb each other.
  function stream(code, salt) {
    return mulberry32((code ^ Math.imul(salt, 0x9e3779b1)) >>> 0);
  }

  // ---------------------------------------------------------------- genes

  const FIELDS = [
    { key: 'color', label: 'Color', bits: 5 },
    { key: 'shape', label: 'Shape', bits: 5 },
    { key: 'rotation', label: 'Rotation', bits: 3 },
    { key: 'noise', label: 'Hand noise', bits: 2 },
    { key: 'faceSize', label: 'Face size', bits: 1 },
    { key: 'face', label: 'Face', bits: 3 },
    { key: 'stem', label: 'Stem type', bits: 3 },
    { key: 'stemColor', label: 'Stem color', bits: 2 },
    { key: 'size', label: 'Size', bits: 2 },
    { key: 'stemPlacement', label: 'Stem tilt', bits: 2 },
    { key: 'faceLayout', label: 'Face layout', bits: 4 },
  ];

  let shift = 0;
  for (const f of FIELDS) {
    f.shift = shift;
    shift += f.bits;
  }

  function decode(code) {
    const genes = {};
    for (const f of FIELDS) genes[f.key] = (code >>> f.shift) & ((1 << f.bits) - 1);
    return genes;
  }

  function encode(genes) {
    let code = 0;
    for (const f of FIELDS) code |= (genes[f.key] & ((1 << f.bits) - 1)) << f.shift;
    return code >>> 0;
  }

  // ---------------------------------------------------------------- color

  // One name per gradient step, in order.
  const COLOR_NAMES = {
    Red: ['Merlot', 'Garnet', 'Cranberry', 'Raspberry', 'Ruby', 'Crimson', 'Cardinal', 'Carmine', 'Rose', 'Cherry', 'Strawberry',
      'Lipstick', 'Brick', 'Chili', 'Salsa', 'Firetruck', 'Scarlet', 'Poppy', 'Paprika', 'Lava', 'Vermilion', 'Ember'],
    Orange: ['Persimmon', 'Tangerine', 'Apricot', 'Marigold'],
    Yellow: ['Amber', 'Goldie', 'Sunbeam'],
    Green: ['Lime', 'Pickle', 'Basil'],
  };

  function hsl(h, s, l) {
    const c = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    return `hsl(${Math.round(((h % 360) + 360) % 360)}, ${Math.round(c(s, 0, 100))}%, ${Math.round(c(l, 0, 100))}%)`;
  }

  // A single gradient red → orange → yellow → green. Steps 0-21 (~70%) stay in the reds,
  // the last 10 steps sweep through orange and yellow to green.
  // Each stop is [step, hue, saturation, lightness]; hue runs past 360 so reds don't wrap.
  const COLOR_STOPS = [
    [0, 350, 72, 40],
    [21, 368, 86, 52],
    [22, 378, 90, 54],
    [25, 390, 92, 55],
    [28, 408, 92, 57],
    [31, 455, 55, 46],
  ];
  const COLOR_GROUPS = [['Red', 0], ['Orange', 22], ['Yellow', 26], ['Green', 29]];

  function palette(c) {
    let k = 0;
    while (k < COLOR_STOPS.length - 2 && c > COLOR_STOPS[k + 1][0]) k++;
    const [c0, h0, s0, l0] = COLOR_STOPS[k], [c1, h1, s1, l1] = COLOR_STOPS[k + 1];
    const t = (c - c0) / (c1 - c0);
    const h = h0 + (h1 - h0) * t, s = s0 + (s1 - s0) * t, l = l0 + (l1 - l0) * t;

    let g = 0;
    while (g < COLOR_GROUPS.length - 1 && c >= COLOR_GROUPS[g + 1][1]) g++;
    const [group, start] = COLOR_GROUPS[g];
    return {
      group,
      name: COLOR_NAMES[group][c - start],
      fill: hsl(h, s, l),
      line: hsl(h - 4, s + 5, l - 28),
    };
  }

  // ---------------------------------------------------------------- shape

  function angDiff(a, b) {
    let d = (a - b) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
  }

  function bump(th, center, width) {
    const d = angDiff(th, center) / width;
    return Math.exp(-d * d);
  }

  // Each family is a polar equation r(θ) plus a horizontal aspect; t ∈ [0,1]
  // comes from the low 3 shape bits and sweeps the family's parameter.
  const SHAPES = [
    { name: 'Globe', aspect: (t) => 1.04 + 0.14 * t, r: () => 1 },
    {
      name: 'Beefsteak',
      aspect: (t) => 1.16 + 0.1 * t,
      r: (th, t) => {
        const n = 5 + Math.round(t * 3);
        return 1 + (0.035 + 0.04 * t) * (Math.abs(Math.cos((n * th) / 2)) - 0.64);
      },
    },
    { name: 'Roma', aspect: (t) => 0.76 - 0.1 * t, r: (th, t) => 1 + (0.04 + 0.08 * t) * bump(th, DOWN, 0.6) },
    {
      name: 'Oxheart',
      aspect: (t) => 0.98 + 0.06 * t,
      r: (th, t) => 1 + (0.12 + 0.18 * t) * bump(th, DOWN, 0.5) + 0.06 * (bump(th, 0.55, 0.6) + bump(th, Math.PI - 0.55, 0.6)),
    },
    { name: 'Pumpkin', aspect: (t) => 1.3 + 0.14 * t, r: (th, t) => 1 + (0.02 + 0.035 * t) * Math.cos(4 * th) },
    { name: 'Pear', aspect: () => 0.86, r: (th, t) => 1 - (0.12 + 0.14 * t) * Math.sin(th) },
    {
      name: 'Heirloom',
      aspect: () => 1.1,
      r: (th, t) => 1 + (0.025 + 0.025 * t) * Math.cos(3 * th + 0.7),
    },
    {
      name: 'Cherry',
      aspect: (t) => 1 + 0.06 * t,
      r: (th, t) => {
        const n = 2.1 + 0.5 * t; // polar superellipse, just a touch fuller than a circle
        return Math.pow(Math.pow(Math.abs(Math.cos(th)), n) + Math.pow(Math.abs(Math.sin(th)), n), -1 / n);
      },
    },
  ];

  // Returns at(θ, dr) → [x, y] in unit space (canvas y-down), normalized so
  // the shape's bounding box has half-extent 1 and is centered on the origin.
  function buildShape(code) {
    const fam = SHAPES[code >> 2];
    const t = (code & 3) / 3;
    const ax = fam.aspect(t);
    const dip = 0.05 + 0.05 * t; // the dimple where the stem sits
    const radius = (th) => fam.r(th, t) - dip * bump(th, UP, 0.3);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < 360; i++) {
      const th = (i / 360) * TAU, r = radius(th);
      const x = ax * r * Math.cos(th), y = -r * Math.sin(th);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    const ox = (minX + maxX) / 2, oy = (minY + maxY) / 2;
    const k = 2 / Math.max(maxX - minX, maxY - minY);

    return {
      name: fam.name,
      variant: (code & 3) + 1,
      at(th, dr = 0) {
        const r = radius(th) + dr;
        return [(ax * r * Math.cos(th) - ox) * k, (-r * Math.sin(th) - oy) * k];
      },
    };
  }

  // Smooth periodic radial noise built from the given harmonics, so closed shapes stay seamless.
  function makeWobble(rng, amp, harmonics) {
    const terms = harmonics.map((k) => ({ k, a: (rng() * 2 - 1) / Math.sqrt(k), p: rng() * TAU }));
    return (th) => amp * terms.reduce((s, w) => s + w.a * Math.sin(w.k * th + w.p), 0);
  }

  // ---------------------------------------------------------------- pen

  function resample(pts, step) {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
      for (let j = 1; j <= n; j++) out.push({ x: a.x + ((b.x - a.x) * j) / n, y: a.y + ((b.y - a.y) * j) / n });
    }
    return out;
  }

  // Constant-width line. With o.jitter (px) and o.rng it drifts gently side to side.
  function stroke(ctx, pts, o) {
    if (o.jitter) {
      const p = resample(pts, 2.5), n = p.length, rng = o.rng;
      const f1 = TAU / (35 + rng() * 40), f2 = TAU / (12 + rng() * 10), p1 = rng() * TAU, p2 = rng() * TAU;
      let s = 0;
      pts = p.map((pt, i) => {
        if (i) s += Math.hypot(pt.x - p[i - 1].x, pt.y - p[i - 1].y);
        const a = p[Math.max(0, i - 1)], b = p[Math.min(n - 1, i + 1)];
        const nx = -(b.y - a.y), ny = b.x - a.x, nl = Math.hypot(nx, ny) || 1;
        const off = o.jitter * (0.7 * Math.sin(s * f1 + p1) + 0.3 * Math.sin(s * f2 + p2));
        return { x: pt.x + (nx / nl) * off, y: pt.y + (ny / nl) * off };
      });
    }
    ctx.save();
    ctx.strokeStyle = outlineColor || o.color || INK;
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.lineWidth = o.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    tracePath(ctx, pts, o.closed);
    ctx.stroke();
    ctx.restore();
  }

  function tracePath(ctx, pts, close) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    if (close) ctx.closePath();
  }

  function fillPoly(ctx, pts, color, alpha) {
    if (outlineColor) return;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = color;
    tracePath(ctx, pts, true);
    ctx.fill();
    ctx.restore();
  }

  // Unit-space helpers: return [x, y] arrays.
  function ellipse(cx, cy, rx, ry, a0 = 0, a1 = TAU, n = 40) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return out;
  }

  function quad(a, c, b, n = 24) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
    }
    return out;
  }

  // Leaf / sepal outline grown along a curving spine.
  function leaf(ox, oy, ang, len, wid, curl, n = 30) {
    const left = [], right = [], spine = [];
    let x = ox, y = oy, h = ang;
    const ds = len / n;
    for (let i = 0; i <= n; i++) {
      if (i) {
        h += curl / n;
        x += Math.cos(h) * ds;
        y += Math.sin(h) * ds;
      }
      const u = i / n;
      const w = wid * Math.pow(Math.sin(Math.PI * Math.min(u, 0.999)), 0.7) * (1 - 0.35 * u);
      spine.push([x, y]);
      left.push([x - Math.sin(h) * w, y + Math.cos(h) * w]);
      right.push([x + Math.sin(h) * w, y - Math.cos(h) * w]);
    }
    return { outline: left.concat(right.reverse()), spine };
  }

  // Tapered stalk growing up (-y) from the origin.
  function stalk(h, w, bend, n = 16) {
    const left = [], right = [], spine = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const x = bend * u * u * h, y = -h * u;
      const dx = 2 * bend * u, nl = Math.hypot(1, dx);
      const ww = w * (1 - 0.3 * u);
      spine.push([x, y]);
      left.push([x - ww / nl, y - (ww * dx) / nl]);
      right.push([x + ww / nl, y + (ww * dx) / nl]);
    }
    const top = spine[n];
    const cap = [top[0] + bend * w * 0.4, top[1] - w * 0.55];
    return { outline: left.concat([cap], right.reverse()), spine, top };
  }

  // ---------------------------------------------------------------- catalogs

  const FACE_SIZE_NAMES = ['Regular', 'Big'];
  // Four kinds of hand wobble, all tuned to roughly the same strength.
  const NOISE_STYLES = [
    { name: 'Wavy', amp: 0.021, harmonics: [2, 3, 4, 5] },
    { name: 'Jittery', amp: 0.0095, harmonics: [7, 9, 11, 13, 16] },
    { name: 'Loopy', amp: 0.012, harmonics: [2, 3, 5], overshoot: 0.35 },
    { name: 'Offset', amp: 0.012, harmonics: [2, 3, 5], offset: 5 },
  ];
  const SIZE_NAMES = ['Petite', 'Small', 'Medium', 'Large'];
  const SIZE_SCALE = [0.7, 0.8, 0.9, 1];
  // Low 2 bits pick eye spacing, high 2 bits pick how high the face sits.
  const FACE_SPREADS = [['Close-set', 0.78], ['Classic', 1], ['Wide', 1.18], ['Extra-wide', 1.36]];
  const FACE_HEIGHTS = [['high', -0.06], ['middle', 0], ['low', 0.07], ['very low', 0.14]];
  const FACE_LAYOUTS = [];
  for (const [hName, drop] of FACE_HEIGHTS) {
    for (const [sName, spread] of FACE_SPREADS) FACE_LAYOUTS.push({ name: `${sName}, ${hName}`, spread, drop });
  }
  const STEM_COLORS = [
    { name: 'Forest', fill: '#3f8f3a', line: '#1f4f1c' },
    { name: 'Leaf', fill: '#6cbf45', line: '#3a7322' },
    { name: 'Olive', fill: '#7d8c2e', line: '#444d14' },
    { name: 'Pine', fill: '#2f6f55', line: '#173d2e' },
  ];
  const FACES = [
    { name: 'Content', eyes: 'line', mouth: 'smile' },
    { name: 'Grinning', eyes: 'line', mouth: 'open' },
    { name: 'Joyful', eyes: 'happy', mouth: 'open' },
    { name: 'Winky', eyes: 'wink', mouth: 'smirk' },
    { name: 'Dozy', eyes: 'sleepy', mouth: 'o' },
    { name: 'Surprised', eyes: 'tall', mouth: 'o' },
    { name: 'Excited', eyes: 'chevron', mouth: 'wide' },
    { name: 'Silly', eyes: 'line', mouth: 'tongue' },
  ];
  // All plain star calyxes: a short stem with sepals splayed over the top.
  const STEMS = [
    { name: 'Classic', sepals: 5, len: 0.3, wid: 0.07, droop: 0.35, h: 0.2, bend: 0.2 },
    { name: 'Six-point', sepals: 6, len: 0.28, wid: 0.06, droop: 0.35, h: 0.2, bend: 0.15 },
    { name: 'Four-point', sepals: 4, len: 0.3, wid: 0.075, droop: 0.35, h: 0.2, bend: 0.2 },
    { name: 'Stubby', sepals: 5, len: 0.21, wid: 0.075, droop: 0.2, h: 0.13, bend: 0.1 },
    { name: 'Long sepals', sepals: 5, len: 0.38, wid: 0.065, droop: 0.6, h: 0.2, bend: 0.2 },
    { name: 'Curled', sepals: 5, len: 0.3, wid: 0.065, droop: 1.0, h: 0.2, bend: 0.2 },
    { name: 'Tall stem', sepals: 5, len: 0.28, wid: 0.065, droop: 0.35, h: 0.3, bend: 0.25 },
    { name: 'Bent stem', sepals: 5, len: 0.28, wid: 0.065, droop: 0.35, h: 0.24, bend: 0.7 },
  ];

  function rotationDeg(v) {
    return (v - 3.5) * 10;
  }
  function placementDeg(v) {
    return Math.round((v - 1.5) * 5);
  }

  function describe(genes) {
    const pal = palette(genes.color);
    const shape = buildShape(genes.shape);
    const rot = rotationDeg(genes.rotation);
    const place = placementDeg(genes.stemPlacement);
    const text = {
      color: `${pal.name} (${pal.group})`,
      shape: `${shape.name} #${shape.variant}`,
      rotation: `${rot > 0 ? '+' : ''}${rot}°`,
      noise: NOISE_STYLES[genes.noise].name,
      faceSize: FACE_SIZE_NAMES[genes.faceSize],
      face: FACES[genes.face].name,
      stem: STEMS[genes.stem].name,
      stemColor: STEM_COLORS[genes.stemColor].name,
      size: SIZE_NAMES[genes.size],
      stemPlacement: `${place > 0 ? '+' : ''}${place}°`,
      faceLayout: FACE_LAYOUTS[genes.faceLayout].name,
    };
    return {
      title: `${pal.name} ${shape.name}`,
      traits: FIELDS.map((f) => ({ ...f, value: genes[f.key], text: text[f.key] })),
    };
  }

  // ---------------------------------------------------------------- render

  function drawBackground(ctx, kind, rng) {
    if (kind === 'transparent') return;
    ctx.fillStyle = { paper: '#fbf5e9', white: '#ffffff' }[kind] || kind;
    ctx.fillRect(0, 0, 512, 512);
    if (kind !== 'paper') return;
    ctx.fillStyle = '#8a6a4a';
    for (let i = 0; i < 1400; i++) {
      ctx.globalAlpha = 0.03 + rng() * 0.05;
      ctx.fillRect(rng() * 512, rng() * 512, 0.6 + rng(), 0.6 + rng());
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Draw a tomato into ctx, filling a size×size square (or opts.width×opts.height).
   * opts.background: 'paper' (default) | 'white' | 'transparent' | any CSS color
   * opts.label: optional text; the tomato shrinks to make room for it
   * opts.labelStyle: 'below' (default) puts it under the tomato; 'side' stacks its words
   *   left-aligned to the right of the tomato, with a bar between
   * opts.hideTomato: leave the tomato out and center the label on its own
   * opts.textScale: label size multiplier (default 1); text still shrinks if it wouldn't fit
   * opts.trim: crop to the artwork and fit it to the canvas (always on for non-square sizes)
   * opts.padding: margin when trimmed, as a fraction of the shorter side (default 0.1)
   * opts.lineWeight: multiplier for outline, face and stem lines (default 1); raise it for
   *   tiny sizes like favicons, where normal lines shrink below a pixel and blur away
   * opts.hideFace: leave the face off (for the tiniest icons, where it only reads as smudge)
   * opts.outline: a color; draw only the lines (outline, face, stem, label) in it, no fills
   * opts.labelColor: color for the label and side bar (default INK)
   * opts.mouth: 0 to 1; above 0 the face's mouth is swapped for an open, talking one this wide
   */
  function render(ctx, genes, opts = {}) {
    const outer = [outlineColor, labelInk];
    outlineColor = opts.outline || null;
    labelInk = opts.labelColor || null;
    try {
      renderInner(ctx, genes, opts);
    } finally {
      [outlineColor, labelInk] = outer;
    }
  }

  function renderInner(ctx, genes, opts) {
    const w = opts.width || opts.size || 512, h = opts.height || opts.size || 512;
    if (w !== h || opts.trim) return renderFitted(ctx, genes, opts, w, h);
    const size = w;
    const code = encode(genes);
    const label = String(opts.label || '').trim();
    const side = opts.labelStyle === 'side';
    const ts = opts.textScale || 1;
    ctx.save();
    ctx.scale(size / 512, size / 512);
    drawBackground(ctx, opts.background || 'paper', stream(code, 1));
    if (opts.hideTomato) {
      if (label) drawTextOnly(ctx, label, side, ts);
    } else if (label && side) {
      drawSideLayout(ctx, genes, code, label, ts);
    } else if (label) {
      drawBelowLayout(ctx, genes, code, label, ts);
    } else {
      drawTomato(ctx, genes, code, opts.lineWeight, opts.hideFace, opts.mouth);
    }
    ctx.restore();
  }

  // The tomato itself (no background), in 512×512 space.
  function drawTomato(ctx, genes, code, weight = 1, hideFace = false, mouth = 0) {
    const pal = palette(genes.color);
    const shape = buildShape(genes.shape);
    const rot = (rotationDeg(genes.rotation) * Math.PI) / 180;
    const R = 165 * SIZE_SCALE[genes.size];
    const lw = (5.2 + R / 27) * weight;
    const cx = 256, cy = 276;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const P = ([x, y]) => ({ x: cx + R * (x * cr - y * sr), y: cy + R * (x * sr + y * cr) });
    const M = (pts) => pts.map(P);

    const style = NOISE_STYLES[genes.noise];
    const rBody = stream(code, 2), rPen = stream(code, 3);
    const wob = makeWobble(rBody, style.amp, style.harmonics);
    const jit = weight > 1 ? 0 : 1.2; // small drift on face and stem lines; off for heavy icon lines

    // --- body
    const N = 240;
    const body = [];
    for (let i = 0; i < N; i++) body.push(P(shape.at((i / N) * TAU, wob((i / N) * TAU))));
    const offA = rBody() * TAU, off = style.offset || 0;
    fillPoly(ctx, body.map((p) => ({ x: p.x + Math.cos(offA) * off, y: p.y + Math.sin(offA) * off })), pal.fill);

    if (style.overshoot) {
      // Start and end of the loop don't quite meet, so the ends cross.
      const s0 = rBody() * TAU, steps = 260, pts = [];
      for (let i = 0; i <= steps; i++) {
        const u = i / steps, th = s0 + u * (TAU + style.overshoot);
        pts.push(P(shape.at(th, wob(th) + 0.016 * (u - 0.5))));
      }
      stroke(ctx, pts, { width: lw, color: pal.line });
    } else {
      stroke(ctx, body, { width: lw, color: pal.line, closed: true });
    }

    const FACE = [1.3, 1.5][genes.faceSize]; // features are designed small, then scaled up as a group
    // The face only follows a fraction of the body's tilt, so it stays mostly upright.
    const fr = rot * 0.25, fcr = Math.cos(fr), fsr = Math.sin(fr);
    const Mf = (pts) => pts.map(([x, y]) => {
      x *= FACE;
      y = y * FACE - 0.08;
      return { x: cx + R * (x * fcr - y * fsr), y: cy + R * (x * fsr + y * fcr) };
    });
    if (!hideFace) drawFace(ctx, FACES[genes.face], { M: Mf, R: R * FACE, layout: FACE_LAYOUTS[genes.faceLayout], rng: rPen, jit, weight, mouth });

    // --- stem
    {
      const place = genes.stemPlacement - 1.5;
      const aStem = UP - place * 0.07;
      const [ax, ay] = shape.at(aStem, wob(aStem));
      const A = P([ax * 0.97, ay * 0.97]);
      const tilt = rot + place * 0.09;
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      const k = R * 1.3;
      const S = (pts) => pts.map(([x, y]) => ({ x: A.x + k * (x * ct - y * st), y: A.y + k * (x * st + y * ct) }));
      drawStem(ctx, STEMS[genes.stem], {
        S,
        fill: STEM_COLORS[genes.stemColor].fill,
        line: STEM_COLORS[genes.stemColor].line,
        lw: lw * 0.85,
        rng: rPen,
        jit,
      });
    }
  }

  // Trimmed output: draw the square artwork (tomato + label) off-screen at high resolution,
  // trim it to its ink, and fit that into w×h with a little padding.
  function renderFitted(ctx, genes, opts, w, h) {
    const res = Math.max(256, Math.ceil(Math.max(w, h) * 2)); // tiny icons still get a detailed source
    const src = makeCanvas(res, res);
    render(src.getContext('2d'), genes, { ...opts, size: res, width: 0, height: 0, trim: false, background: 'transparent' });
    const b = inkBounds(src.getContext('2d'), res);

    ctx.save();
    const k = Math.max(w, h) / 512; // background is drawn in 512 space; this covers the whole w×h
    ctx.scale(k, k);
    drawBackground(ctx, opts.background || 'paper', stream(encode(genes), 1));
    ctx.restore();
    if (b.x1 <= b.x0) return; // nothing to place (tomato hidden, no label)

    const pad = Math.min(w, h) * (opts.padding ?? 0.1);
    const s = Math.min((w - 2 * pad) / (b.x1 - b.x0), (h - 2 * pad) / (b.y1 - b.y0));
    const dw = (b.x1 - b.x0) * s, dh = (b.y1 - b.y0) * s;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  function makeCanvas(w, h) {
    return typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(w, h)
      : Object.assign(document.createElement('canvas'), { width: w, height: h });
  }

  // Where the tomato's ink actually lands, found by drawing it off-screen and scanning pixels.
  // Shape, size, rotation and stem all move its edges, so this is the only reliable measure.
  function tomatoBounds(genes, code) {
    const g = makeCanvas(512, 512).getContext('2d');
    drawTomato(g, genes, code);
    return inkBounds(g, 512);
  }

  // Bounding box of every non-transparent pixel in an n×n canvas.
  function inkBounds(g, n) {
    const d = g.getImageData(0, 0, n, n).data;
    let x0 = n, y0 = n, x1 = 0, y1 = 0;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (d[(y * n + x) * 4 + 3] > 16) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    return { x0, y0, x1: x1 + 1, y1: y1 + 1 };
  }

  // Just the label, centered: one line, or (side style) one word per line.
  function drawTextOnly(ctx, text, stacked, ts) {
    const lines = stacked ? text.split(/\s+/) : [text];
    let px = 84 * ts;
    ctx.font = `700 ${px}px Gaegu, cursive`;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest > 440) {
      px *= 440 / widest;
      ctx.font = `700 ${px}px Gaegu, cursive`;
    }
    const m = lines.map((l) => ctx.measureText(l));
    const lineH = px * 1.05;
    const ascent = Math.max(...m.map((t) => t.actualBoundingBoxAscent));
    const inkH = ascent + lineH * (lines.length - 1) + m[m.length - 1].actualBoundingBoxDescent;
    const top = 256 - inkH / 2;
    ctx.fillStyle = outlineColor || labelInk || INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    lines.forEach((l, i) => ctx.fillText(l, 256, top + ascent + lineH * i));
  }

  // Tomato with the label a short, fixed gap under its actual bottom edge; the pair is
  // centered in the square.
  function drawBelowLayout(ctx, genes, code, text, ts) {
    const scale = 0.82, gap = 20;
    let px = 56 * ts;
    ctx.font = `700 ${px}px Gaegu, cursive`;
    let t = ctx.measureText(text);
    if (t.width > 460) {
      px *= 460 / t.width;
      ctx.font = `700 ${px}px Gaegu, cursive`;
      t = ctx.measureText(text);
    }
    const textH = t.actualBoundingBoxAscent + t.actualBoundingBoxDescent;

    const b = tomatoBounds(genes, code);
    const tomH = (b.y1 - b.y0) * scale;
    const top = 256 - (tomH + gap + textH) / 2;

    ctx.save();
    ctx.translate(256 - ((b.x0 + b.x1) / 2) * scale, top - b.y0 * scale);
    ctx.scale(scale, scale);
    drawTomato(ctx, genes, code);
    ctx.restore();

    ctx.fillStyle = outlineColor || labelInk || INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, 256, top + tomH + gap + t.actualBoundingBoxAscent);
  }


  // Tomato | bar | words stacked and left-aligned. The gap from the tomato's edge to the bar
  // matches the gap from the bar to the text, and tomato, bar and text share one center line.
  function drawSideLayout(ctx, genes, code, text, ts) {
    const scale = 0.6, gap = 32, barW = 6, barOver = 14, midY = 256;
    const rng = stream(code, 5);
    const b = tomatoBounds(genes, code);
    const tomW = (b.x1 - b.x0) * scale;

    // Text: measure the real ink of each line so alignment is exact. It may be as wide as
    // the room left beside the tomato, but no wider.
    const lines = text.split(/\s+/);
    const maxW = Math.min(160 * ts, 488 - tomW - gap * 2 - barW);
    let px = 56 * ts;
    ctx.font = `700 ${px}px Gaegu, cursive`;
    let m = lines.map((l) => ctx.measureText(l));
    let textW = Math.max(...m.map((t) => t.actualBoundingBoxLeft + t.actualBoundingBoxRight));
    if (textW > maxW) {
      px *= maxW / textW;
      ctx.font = `700 ${px}px Gaegu, cursive`;
      m = lines.map((l) => ctx.measureText(l));
      textW = Math.max(...m.map((t) => t.actualBoundingBoxLeft + t.actualBoundingBoxRight));
    }
    const lineH = px * 1.05;
    const ascent = Math.max(...m.map((t) => t.actualBoundingBoxAscent));
    const descent = m[m.length - 1].actualBoundingBoxDescent;
    const inkH = ascent + lineH * (lines.length - 1) + descent;
    const inkTop = midY - inkH / 2;

    // Lay the three pieces out as one group centered in the square.
    const x0 = 256 - (tomW + gap + barW + gap + textW) / 2;

    ctx.save();
    ctx.translate(x0 - b.x0 * scale, midY - ((b.y0 + b.y1) / 2) * scale);
    ctx.scale(scale, scale);
    drawTomato(ctx, genes, code);
    ctx.restore();

    // The bar runs a little past the text's ink at both ends, with the same gentle wobble as the tomato's lines.
    const barX = x0 + tomW + gap + barW / 2;
    const tilt = (rng() - 0.5) * 3;
    stroke(ctx, [{ x: barX - tilt, y: inkTop - barOver }, { x: barX + tilt, y: inkTop + inkH + barOver }], { width: barW, rng, jitter: 1.2, color: labelInk || INK });

    const textX = barX + barW / 2 + gap;
    ctx.fillStyle = outlineColor || labelInk || INK;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    lines.forEach((l, i) => ctx.fillText(l, textX + m[i].actualBoundingBoxLeft, inkTop + ascent + lineH * i));
  }


  // Faces are plain strokes: no fills, no highlights.
  function drawFace(ctx, face, o) {
    const { M, R, rng, jit, weight = 1 } = o;
    const { spread, drop } = o.layout;
    const ey = 0.02 + drop, ex = 0.21 * spread, my = 0.24 + drop;
    const ink = (pts) => stroke(ctx, M(pts), { width: R * 0.058 * weight, rng, jitter: jit });
    const happy = (x) => ink(ellipse(x, ey + 0.035, 0.065, 0.06, Math.PI * 1.1, Math.PI * 1.9, 14));

    // side is -1 for the left eye, +1 for the right.
    const eye = (kind, side) => {
      const x = side * ex;
      if (kind === 'line') ink([[x, ey - 0.05], [x, ey + 0.04]]);
      else if (kind === 'tall') ink([[x, ey - 0.075], [x, ey + 0.05]]);
      else if (kind === 'happy') happy(x);
      else if (kind === 'sleepy') ink(ellipse(x, ey - 0.02, 0.065, 0.045, Math.PI * 0.1, Math.PI * 0.9, 14));
      else if (kind === 'chevron') ink([[x + side * 0.045, ey - 0.05], [x - side * 0.035, ey], [x + side * 0.045, ey + 0.05]]);
    };
    if (face.eyes === 'wink') {
      eye('line', -1);
      happy(ex);
    } else {
      eye(face.eyes, -1);
      eye(face.eyes, 1);
    }

    // Talking: an open mouth that grows down from where the smile sits, as an outline with a
    // dark inside so it still reads at small sizes.
    if (o.mouth > 0) {
      const h = 0.028 + 0.06 * o.mouth, w = 0.09 + 0.045 * o.mouth;
      const pts = M(ellipse(0, my - 0.02 + h, w, h, 0, TAU, 28));
      fillPoly(ctx, pts, '#4f0810');
      ink(ellipse(0, my - 0.02 + h, w, h, 0, TAU, 28));
      return;
    }

    switch (face.mouth) {
      case 'smile':
        ink(ellipse(0, my - 0.08, 0.13, 0.1, Math.PI * 0.15, Math.PI * 0.85, 20));
        break;
      case 'wide':
        ink(ellipse(0, my - 0.1, 0.18, 0.13, Math.PI * 0.12, Math.PI * 0.88, 24));
        break;
      case 'open': // a "D" turned on its side: flat top, round bottom
        ink(ellipse(0, my - 0.04, 0.12, 0.11, 0, Math.PI, 24).concat([[0.12, my - 0.04]]));
        break;
      case 'smirk':
        ink(quad([-0.11, my - 0.01], [0.02, my + 0.06], [0.13, my - 0.05]));
        break;
      case 'o':
        ink(ellipse(0, my + 0.01, 0.055, 0.065, 0, TAU, 24));
        break;
      case 'tongue':
        ink(ellipse(0, my - 0.08, 0.13, 0.1, Math.PI * 0.15, Math.PI * 0.85, 20));
        ink(ellipse(0.06, my + 0.015, 0.065, 0.075, 0, Math.PI, 14));
        break;
    }
  }

  // a + (b − a)·t for two #rrggbb colors.
  function mixHex(a, b, t) {
    const ch = (hex, i) => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16);
    return '#' + [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t).toString(16).padStart(2, '0')).join('');
  }

  function drawStem(ctx, stem, o) {
    const { S, fill, line, lw, rng, jit } = o;
    const ink = (pts) => stroke(ctx, S(pts), { width: lw, color: line, rng, jitter: jit });

    // Sepals fan from just above horizontal on one side to the other, drooping toward
    // the front; the ones pointing at the viewer look shorter.
    for (let i = 0; i < stem.sepals; i++) {
      const a = -0.15 + (i * (Math.PI + 0.3)) / (stem.sepals - 1);
      const fore = 1 - 0.45 * Math.max(0, Math.sin(a));
      const l = leaf(0, 0, a, stem.len * fore, stem.wid, stem.droop * (Math.cos(a) >= 0 ? 1 : -1));
      fillPoly(ctx, S(l.outline), fill);
      ink(l.outline.concat([l.outline[1]]));
    }

    const st = stalk(stem.h, 0.05, stem.bend);
    fillPoly(ctx, S(st.outline), fill);
    // Shade on one side of the stalk: 25% of a dark green over the fill, as a solid color so
    // vector exports have no transparency (single-ink print, embroidery).
    fillPoly(ctx, S(st.outline.slice(Math.floor(st.outline.length / 2))), mixHex(fill, '#14280a', 0.25));
    ink(st.outline.concat([st.outline[0]]));
  }

  // ---------------------------------------------------------------- SVG

  // A stand-in for a canvas 2D context that records what render() draws as SVG paths, so the
  // same drawing code that paints the canvas also produces the vector master. It covers what
  // the square (untrimmed) render path uses: save/restore, scale/translate, polylines, fills,
  // strokes, fillRect, fillText and measureText. Colors come out as hex.
  const SVG_STATE = ['m', 'strokeStyle', 'fillStyle', 'lineWidth', 'globalAlpha', 'lineCap', 'lineJoin', 'font', 'textAlign', 'textBaseline'];
  const num = (v) => String(Math.round(v * 100) / 100);

  // Ramer–Douglas–Peucker: drop points that sit within eps (512-space units) of the line
  // through their neighbors. The pen lays points every few units; most of them are redundant
  // in a vector file, and eps 0.06 stays well under a pixel even at 2048 px exports.
  function simplify(pts, eps) {
    if (pts.length < 3) return pts;
    const keep = new Uint8Array(pts.length);
    keep[0] = keep[pts.length - 1] = 1;
    const todo = [[0, pts.length - 1]];
    while (todo.length) {
      const [i0, i1] = todo.pop();
      const [ax, ay] = pts[i0], [bx, by] = pts[i1];
      const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
      let far = -1, farD = eps;
      for (let i = i0 + 1; i < i1; i++) {
        const [px, py] = pts[i];
        const d = len ? Math.abs(dy * px - dx * py + bx * ay - by * ax) / len : Math.hypot(px - ax, py - ay);
        if (d > farD) [far, farD] = [i, d];
      }
      if (far > 0) {
        keep[far] = 1;
        todo.push([i0, far], [far, i1]);
      }
    }
    return pts.filter((_, i) => keep[i]);
  }

  class SvgContext {
    constructor(glyphs) {
      this.glyphs = glyphs || null; // an opentype.js Font; when set, text is drawn as outlines
      this.liveText = false; // true if any text had to stay as <text>
      this.parts = [];
      this.box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
      this.stack = [];
      this.subpaths = [];
      this.m = [1, 0, 0, 1, 0, 0];
      Object.assign(this, { strokeStyle: '#000', fillStyle: '#000', lineWidth: 1, globalAlpha: 1, lineCap: 'butt', lineJoin: 'miter' });
      Object.assign(this, { font: '10px sans-serif', textAlign: 'start', textBaseline: 'alphabetic' });
      // For measuring text and normalizing colors. A DOM canvas when there is one, so it sees
      // the page's web fonts and measures text exactly like the canvas render does.
      this.real = (typeof document !== 'undefined' ? document.createElement('canvas') : makeCanvas(8, 8)).getContext('2d');
    }
    save() { this.stack.push(Object.fromEntries(SVG_STATE.map((k) => [k, k === 'm' ? [...this.m] : this[k]]))); }
    restore() { if (this.stack.length) Object.assign(this, this.stack.pop()); }
    scale(x, y) { const m = this.m; m[0] *= x; m[1] *= x; m[2] *= y; m[3] *= y; }
    translate(x, y) { const m = this.m; m[4] += m[0] * x + m[2] * y; m[5] += m[1] * x + m[3] * y; }
    pt(x, y) { const m = this.m; return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
    beginPath() { this.subpaths = []; }
    moveTo(x, y) { this.subpaths.push({ pts: [this.pt(x, y)], closed: false }); }
    lineTo(x, y) {
      if (!this.subpaths.length) return this.moveTo(x, y);
      this.subpaths[this.subpaths.length - 1].pts.push(this.pt(x, y));
    }
    closePath() { if (this.subpaths.length) this.subpaths[this.subpaths.length - 1].closed = true; }
    measureText(t) { this.real.font = this.font; return this.real.measureText(t); }

    // '#rrggbb' plus an opacity, folding in globalAlpha.
    paint(c) {
      this.real.fillStyle = '#000';
      this.real.fillStyle = c;
      const v = this.real.fillStyle;
      let hex = v, a = 1;
      const rgba = /^rgba?\(([^)]+)\)$/.exec(v);
      if (rgba) {
        const [r, g, b, alpha = 1] = rgba[1].split(',').map(Number);
        hex = '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
        a = alpha;
      }
      a *= this.globalAlpha;
      return { hex, opacity: a < 0.999 ? ` opacity="${num(a)}"` : '' };
    }
    grow(x, y, r = 0) {
      const b = this.box;
      b.x0 = Math.min(b.x0, x - r); b.y0 = Math.min(b.y0, y - r);
      b.x1 = Math.max(b.x1, x + r); b.y1 = Math.max(b.y1, y + r);
    }
    d(r = 0) {
      return this.subpaths.map(({ pts, closed }) => {
        pts.forEach(([x, y]) => this.grow(x, y, r));
        pts = simplify(pts, 0.06);
        return 'M' + pts.map(([x, y]) => `${num(x)} ${num(y)}`).join('L') + (closed ? 'Z' : '');
      }).join('');
    }
    stroke() {
      const m = this.m, w = this.lineWidth * Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
      const p = this.paint(this.strokeStyle);
      this.parts.push(`<path d="${this.d(w / 2)}" fill="none" stroke="${p.hex}" stroke-width="${num(w)}" stroke-linecap="${this.lineCap}" stroke-linejoin="${this.lineJoin}"${p.opacity}/>`);
    }
    fill() {
      const p = this.paint(this.fillStyle);
      this.parts.push(`<path d="${this.d()}" fill="${p.hex}"${p.opacity}/>`);
    }
    fillRect(x, y, w, h) {
      this.beginPath();
      this.moveTo(x, y); this.lineTo(x + w, y); this.lineTo(x + w, y + h); this.lineTo(x, y + h);
      this.closePath();
      this.fill();
    }
    fillText(text, x, y) {
      const px = parseFloat(/([\d.]+)px/.exec(this.font)[1]);
      const p = this.paint(this.fillStyle);
      const width = this.measureText(text).width;
      const x0 = this.textAlign === 'center' ? x - width / 2 : this.textAlign === 'right' || this.textAlign === 'end' ? x - width : x;
      if (this.glyphs) {
        const cmds = this.glyphs.getPath(text, x0, y, px).commands;
        let d = '';
        for (const c of cmds) {
          if (c.type === 'Z') { d += 'Z'; continue; }
          const xy = (k) => { const [tx, ty] = this.pt(c['x' + k], c['y' + k]); this.grow(tx, ty); return `${num(tx)} ${num(ty)}`; };
          d += c.type === 'C' ? `C${xy(1)} ${xy(2)} ${xy('')}` : c.type === 'Q' ? `Q${xy(1)} ${xy('')}` : c.type + xy('');
        }
        this.parts.push(`<path d="${d}" fill="${p.hex}"${p.opacity}/>`);
      } else {
        // No font file: keep live text (needs Gaegu installed to render; outline before print).
        this.liveText = true;
        const m = this.m;
        const t = this.measureText(text);
        const [ax, ay] = this.pt(x0, y - t.actualBoundingBoxAscent), [bx, by] = this.pt(x0 + width, y + t.actualBoundingBoxDescent);
        this.grow(ax, ay); this.grow(bx, by);
        const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
        this.parts.push(`<text transform="matrix(${m.map(num).join(' ')})" x="${num(x0)}" y="${num(y)}" font-family="Gaegu, cursive" font-weight="700" font-size="${num(px)}" fill="${p.hex}"${p.opacity}>${esc}</text>`);
      }
    }
  }

  /**
   * The same drawing as render(), as an SVG string. Takes render()'s options (label,
   * labelStyle, hideTomato, textScale, outline, labelColor, lineWeight, hideFace) plus:
   * opts.glyphs: an opentype.js Font for Gaegu Bold, so the label becomes outlines
   * opts.padding: margin around the artwork, as a fraction of its longer side (default 0.01)
   * opts.square: pad the shorter side so the viewBox is square, artwork centered
   * opts.title: <title> for accessibility
   * Returns { svg, box, liveText }: box is the viewBox ({ x, y, w, h }, in 512-space units),
   * and liveText is true if text could not be outlined.
   */
  function toSVG(genes, opts = {}) {
    const g = new SvgContext(opts.glyphs);
    render(g, genes, { ...opts, size: 512, width: 0, height: 0, trim: false, background: opts.background || 'transparent' });
    const b = g.box;
    let w = b.x1 - b.x0, h = b.y1 - b.y0;
    const pad = Math.max(w, h) * (opts.padding ?? 0.01);
    let x = b.x0 - pad, y = b.y0 - pad;
    w += 2 * pad; h += 2 * pad;
    if (opts.square) {
      const s = Math.max(w, h);
      x -= (s - w) / 2; y -= (s - h) / 2;
      w = h = s;
    }
    // Whole units, rounded outward, for a clean grid.
    const [x1, y1] = [Math.ceil(x + w), Math.ceil(y + h)];
    [x, y] = [Math.floor(x), Math.floor(y)];
    [w, h] = [x1 - x, y1 - y];
    if (opts.square) w = h = Math.max(w, h);
    const box = { x, y, w, h };
    const title = opts.title ? `<title>${String(opts.title).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>` : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${[x, y, w, h].map(num).join(' ')}" width="${num(w)}" height="${num(h)}">${title}${g.parts.join('')}</svg>\n`;
    return { svg, box, liveText: g.liveText };
  }

  // Every color a tomato uses, as CSS colors: its body fill and line, stem fill and line,
  // and the ink used for faces and labels.
  function colors(genes) {
    const pal = palette(genes.color), stem = STEM_COLORS[genes.stemColor];
    return [
      { role: `Body · ${pal.name}`, color: pal.fill },
      { role: 'Body outline', color: pal.line },
      { role: `Stem · ${stem.name}`, color: stem.fill },
      { role: 'Stem outline', color: stem.line },
      { role: 'Ink (face, text)', color: INK },
    ];
  }

  // ---------------------------------------------------------------- export

  function fromName(name) {
    const code = hashName(name);
    return { code, genes: decode(code) };
  }

  const Tomato = { FIELDS, hashName, decode, encode, describe, render, toSVG, colors, fromName, palette };
  if (typeof module !== 'undefined' && module.exports) module.exports = Tomato;
  else root.Tomato = Tomato;
})(typeof window !== 'undefined' ? window : globalThis);
