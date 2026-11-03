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

fs.writeFileSync(path.join(dir, 'storyboard.json'), JSON.stringify({
  title: 'A Concise Post Title',
  background: 'paper',
  output: 'video.mp4',
  scenes: [
    { type: 'hook', duration: 2.8, props: { kicker: 'CAFE MATH', headline: 'Your *question* goes here?' } },
    { type: 'fix', duration: 4, props: { title: 'The fix', steps: ['First step', 'Second step', 'Third step'] } },
    { type: 'endcard', duration: 2.6, props: {} },
  ],
}, null, 2) + '\n');

console.log(dir);
