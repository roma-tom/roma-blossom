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
**Length:** about 18 s

## Scenes

| # | Template | On screen | Time |
| --- | --- | --- | --- |
| 1 | hook | Kicker: … / Headline: … | 2.8 s |
| 2 | … | … | 4 s |
| 3 | fix | The fix: … / … / … | 4 s |
| 4 | endcard | Follow for more *owner* tips | 2.6 s |

## Fact notes

Every number on screen, with its source (a link or a named report) or the worked calculation.
Mark example figures as examples.

- …

## Post caption

…

#cafeowner #restaurantowner …
`);

fs.writeFileSync(path.join(dir, 'caption.txt'), 'The post caption, ready to paste.\n\n#cafeowner #restaurantowner\n');

// Variety: start from a background and a music mood the last three videos didn't use.
const BACKGROUNDS = ['paper', 'sky', 'butter', 'blush', 'mint', 'lime'];
const MOODS = ['bright', 'lofi', 'jazzy', 'bounce', 'dreamy', 'warm'];
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
const mood = fresh(MOODS, recent.map((b) => b.music?.mood || 'warm'));

fs.writeFileSync(path.join(dir, 'storyboard.json'), JSON.stringify({
  title: 'A Concise Post Title',
  background,
  music: { mood },
  output: 'video.mp4',
  scenes: [
    { type: 'hook', duration: 2.8, props: { kicker: 'CAFE MATH', headline: 'Your *question* goes here?' } },
    { type: 'fix', duration: 4, props: { title: 'The fix', steps: ['First step', 'Second step', 'Third step'] } },
    { type: 'endcard', duration: 2.6, props: {} },
  ],
}, null, 2) + '\n');

console.log(dir);
