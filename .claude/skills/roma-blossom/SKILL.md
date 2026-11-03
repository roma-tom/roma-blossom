---
name: roma-blossom
description: Make a short, hand-drawn vertical explainer video (1080×1920 MP4 with sound) for cafe and restaurant owners in the Roma Tom style, hosted by tomato characters. Use when asked for a Roma Tom video, reel, short or explainer about running a cafe, bar or restaurant (menu pricing, food cost, staff, rush hour, reviews, regulars, waste, delivery apps and so on).
---

# Roma Blossom videos

Short explainers that help independent cafe and restaurant owners with one real problem at a
time. They are drawn by hand on paper or lime, hosted by Roma Tom (a tomato), and posted to grow
a following. They are advice, not ads: never pitch a Roma Tom product.

Everything lives in this repository's root: the folder that holds `.claude/`, three
levels up from this file. This file may be reached through a symlink in `~/.claude/skills`;
resolve its real path first. Run every command below from the project root.

- `style/STYLE.md`: palette, type, motion, cast, safe zones. **Read it before writing a script.**
- `scripts/`: the renderer, scene templates and sound. Node only; no API keys.
- `videos/<slug>/`: one folder per video, with `script.md`, `storyboard.json` and the output.
- `videos/best-seller/`: the worked example. Copy its shape.

One-time setup (if `scripts/node_modules` is missing):

```bash
npm install --prefix scripts
```

## Workflow

1. **Pick the question.** Turn the topic into one question an owner would ask out loud, such as
   "Is a 10% off coupon worth it?" One idea per video. If the user gave only a broad area
   ("staffing"), pick the strongest question yourself and say which one you chose when you hand over.
2. **Scaffold the folder:** `node scripts/new.js <slug>` creates `videos/<slug>/` with a
   `script.md`, a `caption.txt` and a starter `storyboard.json`.
3. **Write `script.md`:** the hook, 3 to 5 beats and the takeaway, with the exact on-screen
   text for each, and the template each beat uses. Every number gets a fact note: a source
   (a link or a named report) or a worked calculation. When you use example figures (a made-up
   cafe's costs), say so on screen or in the caption ("for a typical burger…") and in the notes.
   **Never invent a statistic** ("70% of guests…") without a source; reframe it as an example
   calculation instead.
4. **Check the script yourself, then keep going.** Run the whole workflow through to the finished
   video without stopping to ask for approval. Before moving on, reread the script as the owner
   would: is every number backed by a fact note, is anything an invented statistic, is the tone
   kind and practical? Fix it yourself. The user reviews the finished video and can ask for changes.
5. **Write `storyboard.json`** from the script (format below). Aim for 12 to 22 s in all.
6. **Check frames before the full render.** Render the end of each scene (where everything is on
   screen) and look at them:
   ```bash
   node scripts/render.js videos/<slug>/storyboard.json --frames 80,200,320
   ```
   Frame n is at n / 30 seconds. Look for text that overflows, wraps badly or sits in a safe
   zone, and for overlaps. Fix the props (shorter text, fewer items) rather than the template.
   Delete the `frame-*.png` files when done.
7. **Render:**
   ```bash
   node scripts/render.js videos/<slug>/storyboard.json
   ```
   This writes `video.mp4`, `sound.wav` and `sfx/*.wav` in the video folder (about 1 s of render
   per 1.5 s of video).
8. **Write `caption.txt`** in the video folder: the post caption from `script.md` with its 3 to 5
   hashtags, as plain text ready to paste, and nothing else.
9. **Commit and push** the video folder: `script.md`, `storyboard.json`, `caption.txt` and
   `video.mp4` (WAVs and frames are ignored). In a cloud session, push the session's branch.
   Pushing a video can take a few minutes on a slow connection, so run the push with a
   10-minute timeout rather than the default 2.
10. **Hand it over:**
   - the public link to the video, for the user's social media scheduler. It is the raw file at the commit you just
     pushed, so it keeps pointing at this exact video even if the branch changes later:
     ```bash
     echo "https://raw.githubusercontent.com/$(git remote get-url origin | sed -E 's#\.git$##; s#.*[:/]([^/:]+/[^/:]+)$#\1#')/$(git rev-parse HEAD)/videos/<slug>/video.mp4"
     ```
   - the caption in a code block (one tap to copy)
   - the on-screen text, and which question you picked if you chose it (step 1)

   The link works for anyone because the repo is public; say so if a check of the link fails.
   Remind the user not to delete the branch until the post has gone out. The user posts it
   themselves.

## Storyboard format

```json
{
  "background": "paper",
  "output": "video.mp4",
  "sound": true,
  "mix": { "padGain": 0.22, "sfxGain": 0.7 },
  "scenes": [
    { "type": "hook", "duration": 3, "props": { "kicker": "MENU MATH", "headline": "…" } },
    { "type": "endcard", "duration": 2.6, "props": {} }
  ]
}
```

- `background`: `paper` (default, calm) or `lime` (bold). One per video; the end card is always lime.
- `duration` is seconds. Each scene after the first wipes in over the one before it with a
  whoosh during its first 0.5 s.
- Optional per scene: `push` (slow camera push, default 0.03; 0 for none).
- `--bg lime` on the command line overrides the background; `--silent` leaves out the sound.
- In any headline or caption, `*word*` or `*several words*` gets the marker swash. Use it once
  per line, on the word that carries the point.
- No emoji anywhere: the fonts don't have them, so they render as blank boxes.

## Templates

There are 24. `videos/template-demo/` (the first 8) and `videos/template-demo-2/` (the other 16)
show each one with example content; copy their props as a starting point.

Every scene except the hook and end card takes an optional `caption`: one short line at the top
(keep it under about 40 characters). The minimum comfortable durations are a guide; give
reading-heavy scenes more.

| type | use for | props | min |
| --- | --- | --- | --- |
| `hook` | the question, first scene | `kicker` (2 to 3 words, caps), `headline` (under about 60 characters), `host` | 2.8 s |
| `receipt` | where the money goes | `title`, `items` [{`label`, `amount`}] (up to 7; the price as a positive first line, then costs as negatives), `totalLabel`, `total` (default: the sum), `currency` | 4 s |
| `menu` | menu engineering, pricing | `title`, `items` [{`name`, `price` (a string), `mark`: `star`/`circle`/`cross`/`underline`, `note`}] (up to 4; names under about 16 characters) | 4 s |
| `rush` | the shape of a day, staffing | `label`, `hours` [], `values` [] (6 to 10 bars; the highest is the peak, in rose), `queue` [names] (up to 5), `queueLabel` | 4 s |
| `regulars` | retention, loyalty, word of mouth | `guests` [{`name`, `back`}] (up to 9), `stat` {`value`, `label`} | 4 s |
| `review` | reviews and replies (light tech) | `name`, `stars` (1 to 5), `text` (under about 90 characters), `reply` (under about 110 characters), `owner` | 5 s |
| `jar` | small changes adding up | `lines` [] (up to 3 lines of the sum, such as "× 200 plates a day"), `total` (a number), `currency`, `label` ("a year") | 4 s |
| `fix` | the takeaway, before the end card | `title`, `steps` [] (up to 3, under about 34 characters each) | 4 s |
| `versus` | two options head to head (delivery app vs your own ordering) | `left`, `right`: {`name` (tomato), `label`, `value`, `note`}, `winner`: `left`/`right` | 4.5 s |
| `plate` | where each dollar goes | `slices` [{`label`, `value`}] (up to 6; values are shares, any scale), `highlight` (index, pops out in rose) | 4.5 s |
| `calendar` | slow days, events, a month's pattern | `month`, `start` (weekday of the 1st, Monday = 0), `days`, `marks` {"day": `cross`/`circle`/`dot`/`tick`}, `legend` [{`mark`, `label`}] (up to 2) | 4.5 s |
| `gauge` | one number against good and bad ranges (food cost %) | `value`, `min`, `max`, `unit`, `label`, `zones` [{`to`, `kind`: `good`/`ok`/`bad`}], `verdict` (caps) | 4.5 s |
| `tickets` | ticket times, the pass | `tickets` [{`table`, `items` [] (up to 4), `minutes`}] (up to 3), `limit` (later is late), `goal` (caps), `cook` | 4.5 s |
| `day` | the shape of a day, a process | `steps` [{`time`, `label`}] (up to 5), `highlight` (index), `host` | 4.5 s |
| `chat` | staff or supplier messages (light tech) | `contact`, `status` (caps), `messages` [{`from`: `them`/`me`, `text`}] (up to 6) | 5 s |
| `myth` | busting a common belief | `myth` (under about 50 characters), `fact` (under about 80) | 5 s |
| `quote` | a guest's point of view | `name`, `role`, `quote` (under about 70 characters; `*swash*` allowed) | 4.5 s |
| `countdown` | a top 3 to 5 | `items` [] (from last place to number 1; under about 40 characters each) | 4.5 s |
| `scale` | weighing one thing against another | `left`, `right`: {`label`, `weight`} (the heavier side sinks), `verdict` | 4.5 s |
| `stampcard` | loyalty cards | `title`, `stamps` (4 to 10), `filled`, `reward` (`*swash*` allowed), `name` | 4.5 s |
| `floor` | table turns, covers | `tables` (4 to 9), `turns` (1 to 3), `fill` (0 to 1), `guests` [names], `stat` {`value`, `label`} | 5 s |
| `pricetag` | price rises, price psychology | `item`, `from`, `to` (strings with the currency), `note` | 4.5 s |
| `trend` | a number changing over time | `label` (caps), `labels` [], `values` [] (4 to 12), `note` {`at` (index), `text`}, `last` | 4.5 s |
| `rota` | scheduling, cover | `days` [], `staff` [{`name`, `shifts` [0/1 per day]}] (up to 5), `highlight` (day index, circled) | 4.5 s |
| `endcard` | always last | `cta` (default "Follow for more *owner* tips"), `site` (default "romatom.com") | 2.6 s |

## The cast

- `host` defaults to Roma Tom. Leave it unless the user asks.
- Guests are tomatoes made from names: the same name always draws the same tomato. Reuse
  recurring names across videos (`Maria` the regular, `Dev` the line cook, `Sam` the reviewer)
  so the audience gets to know them. Use plain first names, never real people's full names.

## Rules

- The brand is **Roma Tom**, and it is the only name that appears on screen.
- Only the brand palette and the two fonts (see `style/STYLE.md`). The templates already follow
  it; don't add colors in props.
- Keep text out of the safe zones: the top 220 px, the bottom 380 px, and the right 140 px.
  The templates do this; long props can break it, so check frames.
- Kind, practical tone. No fear-mongering, no "you're doing it wrong". A friend who has run a kitchen.
- If the user wants a scene the templates can't show, write a new template in
  `scripts/scenes/<type>.js` with the same shape: `function draw(ctx, theme, t, props, info)`,
  plus `draw.cues = (props) => [{ t, sfx, gain }]`. Build it from `lib/kit.js` (backgrounds,
  rays, headline, tomato), `lib/marks.js` (text, ticks, loops, stars) and `lib/pen.js` (wobbly
  lines). The sound effects are `pop`, `sprout`, `squish`, `chime`, `whoosh`, `tap`, `tick`, `scratch`, `clink` and `ding`.
  Check it with `--frames` on both backgrounds, then add it to the table above.
