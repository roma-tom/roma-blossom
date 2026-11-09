// Publish a finished video as a GitHub Release, so it gets download links without the video
// ever going into git history.
//
//   node scripts/publish.js videos/<slug>
//
// Makes (or updates) the release "video/<slug>" on this repo's GitHub and attaches
// <slug>.mp4, <slug>-cover.jpg and <slug>-caption.txt. The release notes hold the title and
// the caption, ready to copy. Prints the release page and each file's download link, which
// are public (the repo is public), so a social media scheduler can fetch them.
//
// Needs a GitHub token that can write this repo's contents (a fine-grained token with
// "Contents: Read and write" on this repo): GITHUB_TOKEN or GH_TOKEN in the environment, or
// in .env.local at the top of the repo. Never print it.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env.local');
if (!process.env.GITHUB_TOKEN && !process.env.GH_TOKEN && fs.existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node scripts/publish.js videos/<slug>');
  process.exit(1);
}
const slug = path.basename(path.resolve(dir));
const files = [
  { src: path.join(dir, 'video.mp4'), name: `${slug}.mp4`, type: 'video/mp4' },
  { src: path.join(dir, 'cover.jpg'), name: `${slug}-cover.jpg`, type: 'image/jpeg' },
  { src: path.join(dir, 'caption.txt'), name: `${slug}-caption.txt`, type: 'text/plain; charset=utf-8' },
];
for (const f of files) if (!fs.existsSync(f.src)) { console.error(`missing ${f.src}: render the video and write the caption first`); process.exit(1); }
if (!TOKEN) {
  console.error('no GITHUB_TOKEN: add a fine-grained token with "Contents: Read and write" on this repo to .env.local (or the environment)');
  process.exit(1);
}

// owner/repo from the git remote (https or ssh form).
const remote = execSync('git remote get-url origin', { cwd: ROOT }).toString().trim();
const m = remote.replace(/\.git$/, '').match(/github\.com[:/]([^/]+\/[^/]+)$/);
if (!m) { console.error(`origin isn't a GitHub repo: ${remote}`); process.exit(1); }

async function gh(method, url, body, headers = {}) {
  const r = await fetch(url.startsWith('http') ? url : `https://api.github.com${url}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'roma-blossom-publish', ...headers },
    body: body == null ? undefined : Buffer.isBuffer(body) ? body : JSON.stringify(body),
  });
  if (r.status === 404 && method === 'GET') return null;
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${url.split('?')[0]}: ${r.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

(async () => {
  // A renamed repo answers with a redirect; ask once for its current name.
  const repo = (await gh('GET', `/repos/${m[1]}`)).full_name;
  const board = JSON.parse(fs.readFileSync(path.join(dir, 'storyboard.json'), 'utf8'));
  const caption = fs.readFileSync(path.join(dir, 'caption.txt'), 'utf8');
  const tag = `video/${slug}`;
  const notes = `**${board.title || slug}**\n\n\`\`\`\n${caption}\n\`\`\`\n`;

  let rel = await gh('GET', `/repos/${repo}/releases/tags/${encodeURIComponent(tag)}`);
  if (rel) rel = await gh('PATCH', `/repos/${repo}/releases/${rel.id}`, { name: board.title || slug, body: notes });
  else {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT }).toString().trim();
    const sha = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
    // Tag the current commit if GitHub has it (it's been pushed), otherwise the default branch.
    const known = await gh('GET', `/repos/${repo}/commits/${sha}`).catch(() => null);
    rel = await gh('POST', `/repos/${repo}/releases`, {
      tag_name: tag, target_commitish: known ? sha : undefined, name: board.title || slug, body: notes,
      make_latest: 'false',
    });
    if (!known) console.warn(`note: ${branch} at ${sha.slice(0, 7)} isn't on GitHub yet, so the tag points at the default branch`);
  }

  // Replace any earlier upload of the same file, then upload.
  for (const f of files) {
    const old = (rel.assets || []).find((a) => a.name === f.name);
    if (old) await gh('DELETE', `/repos/${repo}/releases/assets/${old.id}`);
    const up = rel.upload_url.replace(/\{.*\}$/, `?name=${encodeURIComponent(f.name)}`);
    const data = fs.readFileSync(f.src);
    const asset = await gh('POST', up, data, { 'Content-Type': f.type, 'Content-Length': String(data.length) });
    f.url = asset.browser_download_url;
  }

  console.log(`release: ${rel.html_url}`);
  for (const f of files) console.log(`${f.name}: ${f.url}`);
})().catch((err) => {
  console.error(`publish failed: ${err.message}`);
  process.exit(1);
});
