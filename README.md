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
style/STYLE.md        palette, type, motion, cast, safe zones, the 25 templates
scripts/
  render.js           storyboard.json → video.mp4 and cover.jpg (+ sound.wav, voice.wav, sfx/)
  cover.js            the crop-safe cover image alone, with --guides to see the crops
  new.js              scaffold videos/<slug>/
  publish.js          upload a finished video, cover and caption as a GitHub Release
  still.js            one still of a scene on any backgrounds → out/
  scenes/             the 25 templates and the end card
  lib/
    kit.js            canvas, brand colors, fonts, backgrounds, rays, headlines, tomatoes
    marks.js          text helpers and pen marks: ticks, loops, stars, strikes, underlines
    pen.js            the seeded hand-drawn pen and the line "boil"
    motion.js         easing, springs, settle, breathe
    sound.js          the warm pad, 14 sound effects, the mixer (with the voice ducking the pad) and WAV writer
    voice.js          the voiceover: ElevenLabs speech (Kokoro fallback) or babble, mouths, line checks
    tomato.js         the tomato character generator: any name draws its own tomato
  fonts/              Gaegu and Inter (SIL Open Font License)
topics.md             the backlog of video ideas, and the ones already made
videos/
  best-seller/        the worked example: script.md, storyboard.json, hook and caption
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
another background with `--bg sky`, and leave out the sound with `--silent`. Set the look in
`storyboard.json` with `"background"` (paper, sky, butter, blush, mint, lime).

## The voice

The tomatoes speak each scene's `say` line, and each scene stretches to fit its line. The voice is
[ElevenLabs](https://elevenlabs.io) (`eleven_v4`), using `ELEVENLABS_API_KEY` from `.env.local`
at the top of the repo. To set that up, run `npx -y @elevenlabs/cli@latest onboard init` here and
follow what it prints. Roma Tom is Chris, one of ElevenLabs' premade voices (library voices
need a paid plan to use over the API).

If there's no key or ElevenLabs fails (no network, out of credits), the whole video falls back to
[Kokoro](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX), a small text-to-speech
model that runs on this computer, so one video never mixes the two. `--kokoro` (or
`"engine": "kokoro"`) asks for Kokoro directly. Kokoro's model (about 330 MB) downloads from
Hugging Face the first time and is kept. Each spoken line is cached in `scripts/.cache/voice/`,
so later renders only ask for lines that changed.

`--babble` swaps the words for cartoon babble with the same timing (or set `"voice": "babble"`),
and `--no-voice` leaves the voice out.

Rendering needs Node 18+ and nothing else: `@napi-rs/canvas` draws the frames,
`ffmpeg-static` encodes them and `@elevenlabs/elevenlabs-js` or `kokoro-js` speaks, all installed by npm. The output is 1080 × 1920, 30 fps H.264
with AAC audio normalised to about -14 LUFS.

## Using the skill

The skill lives inside the repo, so any Claude Code session that opens this repo has it,
including cloud sessions. To use it from any folder on your own machine, link
`.claude/skills/roma-blossom` into `~/.claude/skills/`.

## Video links

Finished videos and covers are not committed (`.gitignore` skips `video.mp4` and `cover.jpg`),
so the repo stays small. Instead, each video is published as a GitHub Release:

```bash
node scripts/publish.js videos/<slug>
```

This makes the release `video/<slug>` and attaches `<slug>.mp4`, `<slug>-cover.jpg` and
`<slug>-caption.txt`, with the title and caption in the release notes. It prints the release
page (download buttons, easy on a phone) and a public download link for each file, ready for a
social media scheduler. Running it again after a re-render replaces the files.

It needs `GITHUB_TOKEN`: a fine-grained token with "Contents: Read and write" on this repo, in
`.env.local` or the environment (for cloud sessions, the environment's settings).

Videos committed before this change are still in git history, at their old commit links.
