// Find a scene's draw function. Built-in templates live in scripts/scenes/<type>.js; a video's
// own scene (its custom hook) is a path starting with "./", relative to its storyboard:
//   { "type": "./hook.js", ... }  →  videos/<slug>/hook.js

const path = require('path');

function loadScene(type, dir) {
  const t = String(type);
  if (t.startsWith('./') || t.startsWith('../')) return require(path.resolve(dir || '.', t));
  return require(path.join(__dirname, '..', 'scenes', `${t}.js`));
}

// The video's hook: a custom hook file, or one of the hook templates.
const isHook = (type) => /^(\.\.?\/|hook)/.test(String(type));

module.exports = { loadScene, isHook };
