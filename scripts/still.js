// Render a single still frame of a scene, on paper and on lime (or the backgrounds you list).
//
//   node still.js                      → out/hook-paper.png, out/hook-lime.png at t = 1
//   node still.js hook 0.4             → the same scene at 40% through
//   node still.js hook 1 butter,sky    → on other backgrounds

const fs = require('fs');
const path = require('path');
const { frame, drawScene, THEMES } = require('./lib/kit.js');

const type = process.argv[2] || 'hook';
const t = Number(process.argv[3] ?? 1);

const props = {
  hook: { kicker: 'CAFE MATH', headline: 'Why does your best seller make the *least* money?' },
  street: {
    caption: 'Same street. *Same* guests.',
    days: ['MON', 'TUE', 'WED'],
    top: { label: 'FOR EVERYONE', sign: 'Lunch for *everyone*', owner: 'Sam', counts: [0, 1, 2], shouts: ['Something for all!', 'Now with soup!', 'Tacos too!'] },
    bottom: { label: 'FOR SOMEONE', sign: 'Lunch in *10 minutes*', owner: 'Dev', counts: [2, 7, 15] },
    winner: 'bottom',
  },
}[type] || {};
const scene = { type, draw: require(`./scenes/${type}.js`), props, push: 0 };

const outDir = path.join(__dirname, '..', 'out');
fs.mkdirSync(outDir, { recursive: true });
for (const name of (process.argv[4] || 'paper,lime').split(',')) {
  const { canvas, ctx } = frame();
  drawScene(ctx, scene, THEMES[name], t, {});
  const file = path.join(outDir, `${type}-${name}.png`);
  fs.writeFileSync(file, canvas.toBuffer('image/png'));
  console.log(file);
}
