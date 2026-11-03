# Roma Blossom

Hand-drawn vertical explainer videos for cafe and restaurant owners, in the Roma Tom style,
hosted by tomato characters.

It is also a Claude Code skill: `.claude/skills/roma-blossom/SKILL.md` teaches Claude the workflow, from question to
`script.md` to `storyboard.json` to MP4. Ask Claude for "a Roma Tom video about <topic>".

## Layout

```
.claude/skills/
  roma-blossom/
    SKILL.md          the skill: workflow, storyboard format, template props, rules
style/STYLE.md        palette, type, motion, cast, safe zones, the 24 templates
scripts/
  render.js           storyboard.json → video.mp4 and cover.jpg (+ sound.wav, sfx/)
  cover.js            the crop-safe cover image alone, with --guides to see the crops
  new.js              scaffold videos/<slug>/
  still.js            one still of a scene on any backgrounds → out/
  scenes/             the 24 templates and the end card
  lib/
    kit.js            canvas, brand colors, fonts, backgrounds, rays, headlines, tomatoes
    marks.js          text helpers and pen marks: ticks, loops, stars, strikes, underlines
    pen.js            the seeded hand-drawn pen and the line "boil"
    motion.js         easing, springs, settle, breathe
    music.js          the music bed: six moods, each a chord progression and a small band
    sound.js          14 sound effects, the mixer and WAV writer
    tomato.js         the tomato character generator: any name draws its own tomato
  fonts/              Gaegu and Inter (SIL Open Font License)
topics.md             the backlog of video ideas, and the ones already made
videos/
  best-seller/        the worked example: script.md, storyboard.json, video.mp4
  template-demo/      the first 8 templates, with example content
  template-demo-2/    the other 16 templates
```

## Use it

```bash
npm install --prefix scripts
```

```bash
node scripts/new.js tuesday-slump
```

```bash
node scripts/render.js videos/tuesday-slump/storyboard.json
```

Check frames before a full render with `--frames 80,200,320` (frame n is at n / 30 s), try
another background with `--bg sky`, and leave out the sound with `--silent`. Set the look and
sound in `storyboard.json` with `"background"` (paper, sky, butter, blush, mint, lime) and
`"music": { "mood": "lofi" }` (bright, lofi, jazzy, bounce, dreamy, warm).

Rendering needs Node 18+ and nothing else: `@napi-rs/canvas` draws the frames and
`ffmpeg-static` encodes them, both installed by npm. The output is 1080 × 1920, 30 fps H.264
with AAC audio normalised to about -14 LUFS.

## Using the skill

The skill lives inside the repo, so any Claude Code session that opens this repo has it,
including cloud sessions. To use it from any folder on your own machine, link
`.claude/skills/roma-blossom` into `~/.claude/skills/`.

## Public video links

Every committed `video.mp4` has a public link, ready for a social media scheduler:

```
https://raw.githubusercontent.com/roma-tom/roma-blossom/<commit>/videos/<slug>/video.mp4
```

Using the commit (rather than a branch name) keeps the link pointing at that exact video. The
skill prints this link when it hands a video over.
