// Start a new video folder with a script.md, a caption.txt and a starter storyboard.json.
//
//   node scripts/new.js tuesday-slump

const fs = require('fs');
const path = require('path');

const slug = (process.argv[2] || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
if (!slug) {
  console.error('usage: node scripts/new.js <slug>');
  process.exit(1);
}
const dir = path.join(__dirname, '..', 'videos', slug);
if (fs.existsSync(dir)) {
  console.error(`${dir} already exists`);
  process.exit(1);
}
fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(path.join(dir, 'script.md'), `# ${slug}

**Question:** the one thing an owner would ask out loud.
**Background:** paper
**Length:** about 30 s

## Scenes

| # | Template | On screen | Says | Time |
| --- | --- | --- | --- | --- |
| 1 | ./hook.js (this video's own hook) | The idea: … / On screen: … | The hook line, out loud. | 3 s |
| 2 | … | … | … | 4 s |
| 3 | fix | The fix: … / … / … | The steps, in words. | 4 s |
| 4 | endcard | Follow for more *owner* tips | Follow for more owner tips. | 2.6 s |

## Fact notes

Every number on screen, with its source (a link or a named report) or the worked calculation.
Mark example figures as examples here (not in the post caption).

- …

## Post caption

…

#cafeowner #restaurantowner …
`);

fs.writeFileSync(path.join(dir, 'caption.txt'), 'The post caption, ready to paste.\n\n#cafeowner #restaurantowner');

// The hook is made for each video: a starter to replace (the renderer refuses it as it is).
fs.writeFileSync(path.join(dir, 'hook.js'), "// STARTER: replace this file with the hook made for this video, then delete this line.\n// (The renderer stops while this line is here.)\n//\n// This video's own hook: the most important scene, made for this topic only. Read\n// style/HOOKS.md first. Write the idea here in one line before drawing anything:\n//\n// The idea: …\n// Frame one shows: …    Readable by 0.5 s: …    The open loop: …\n//\n// Build from scripts/lib/stage.js (counter, cup, table, storefront, clock, coin, walk, jump,\n// rise, reaction, say, pointer, spotlight, freeze tricks, playScene), kit.js (tomato,\n// headline, kicker, rays, pen) and marks.js (text, bubble, loop, cross, check, money).\n// Put every word that shows on screen in the storyboard's props, not in this file.\n// videos/template-demo-custom-hook/hook.js is a worked example.\n\nconst { W, headline } = require('../../scripts/lib/kit.js');\nconst S = require('../../scripts/lib/stage.js');\n\nfunction hook(ctx, theme, t, props, info = {}) {\n  const sec = info.sec ?? t * 3.5;\n  headline(ctx, theme, props.line || '', { x: 520, y: 300, size: 110, maxW: 820, appear: S.at(sec, 0, 0.35), seed: 3001 });\n  S.rise(ctx, 'Roma Tom', sec, { x: W / 2 });\n}\n\n// Sound on the action, in seconds: [{ sec, sfx, gain }].\nhook.cues = () => [{ sec: 0, sfx: 'pop', gain: 0.5 }];\n// What the cover shows: { kicker, headline } and optionally number/label or name/names.\nhook.cover = (p) => ({ headline: p.line });\n\nmodule.exports = hook;\n");

// Variety: start from a background and a pad the last three videos didn't use.
const BACKGROUNDS = ['paper', 'sky', 'butter', 'blush', 'mint', 'lime'];
const videos = path.join(__dirname, '..', 'videos');
const order = (() => { // folders newest first: by when git first saw them, else by file time
  try {
    const log = require('child_process').execSync('git log --format= --name-only --diff-filter=A -- "videos/*/storyboard.json"', { cwd: videos, encoding: 'utf8' });
    return [...new Set(log.split('\n').filter(Boolean).map((f) => f.split('/')[1]))];
  } catch {
    return [];
  }
})();
const recent = fs.readdirSync(videos)
  .filter((d) => !d.startsWith('template-demo') && d !== slug && fs.existsSync(path.join(videos, d, 'storyboard.json')))
  .map((d) => ({ d, rank: order.includes(d) ? order.indexOf(d) : -1, at: fs.statSync(path.join(videos, d, 'storyboard.json')).mtimeMs }))
  .sort((a, b) => (a.rank === -1 || b.rank === -1 ? b.at - a.at : a.rank - b.rank)).slice(0, 3)
  .map(({ d }) => JSON.parse(fs.readFileSync(path.join(videos, d, 'storyboard.json'), 'utf8')));
const fresh = (all, used) => {
  const left = all.filter((x) => !used.includes(x));
  const pool = left.length ? left : all;
  return pool[[...slug].reduce((h, c) => h * 31 + c.charCodeAt(0), 7) % pool.length];
};
const background = fresh(BACKGROUNDS, recent.map((b) => [].concat(b.background || 'paper')[0]));
const pad = fresh(Object.keys(require('./lib/sound.js').PADS), recent.map((b) => b.mix?.pad || 'warm'));

fs.writeFileSync(path.join(dir, 'storyboard.json'), JSON.stringify({
  title: 'A Concise Post Title',
  background,
  output: 'video.mp4',
  mix: { pad },
  scenes: [
    { type: './hook.js', duration: 3, say: 'The hook line, the way you would say it out loud.', props: { line: 'The *hook* line' } },
    { type: 'fix', duration: 4, say: 'So: the first step. The second step. And the third step.', props: { title: 'The fix', steps: ['First step', 'Second step', 'Third step'] } },
    { type: 'endcard', duration: 2.6, say: 'Follow for more owner tips.', props: {} },
  ],
}, null, 2) + '\n');

console.log(dir);
