# Roma Blossom: style guide

Short vertical explainers for cafe and restaurant owners, drawn by hand, hosted by a cast of
tomatoes. The goal is a following: every video should feel like advice from a friend who has
run a kitchen, not a pitch. Roma Tom products are never the topic; the owner's problem is.

## Audience and topics

Independent cafe, bakery, bar and restaurant owners and managers. They care about:

- **Money:** food cost, margins, menu pricing, waste, the real cost of a dish, cash flow
- **People:** hiring, keeping staff, scheduling, training, tips, burnout
- **Guests:** regulars, reviews, slow days, no-shows, word of mouth, loyalty
- **The room and the pass:** rush hour, ticket times, table turns, prep, the walk-in
- **A little tech:** online ordering fees, delivery apps, QR menus, Google profile, email lists

A good topic is a question an owner has asked out loud at 11 pm doing the books:
"Why does my best seller make the least money?" "Is a 10% off coupon worth it?"
"Why do people come once and never again?"

Every number shown needs a source or a worked calculation, kept in `script.md`.

## Format

- 1080 × 1920 (9:16), 30 fps, 12 to 20 s by default
- Music made in code in one of six moods (bright, lofi, jazzy, bounce, dreamy, warm), with sound
  effects on the action; the mood changes from video to video like the background
- Captions carry the story; a voiceover is optional
- One idea per video, a hook in the first second, a takeaway at the end

## Palette

Only the Roma Tom brand tokens:

| Token | Hex | Use |
| --- | --- | --- |
| paper | `#FBF5E9` | background (calm) |
| lime | `#ADDB30` | background (bold, high-energy topics, end card) |
| sky | `#C3DFE9` | soft background (cool) |
| butter | `#F6D66B` | soft background (sunny) |
| blush | `#F5C8BB` | soft background (friendly) |
| mint | `#D3E9C4` | soft background (fresh) |
| card | `#FFFAF0` | cards, receipts, menu boards |
| line | `#E2D4BD` | soft dividers, ruled lines |
| ink | `#2B1B17` | all text, all outlines |
| muted | `#7A6455` | secondary text (paper only) |
| rose | `#CB1A23` | the key number, prices, "bad" marks |
| rose-dark | `#4F0810` | deep red text, rose on lime |
| tomato | `#D8402F` | large accents only |
| forest | `#3F8F3A` | ticks, "good" marks, large only |
| forest-dark | `#1F4F1C` | green text |

Rules:

- Six backgrounds: **paper**, **sky**, **butter**, **blush**, **mint** and **lime**. Text on all of
  them is ink; the end card is always lime.
- **Vary them:** a video uses a different background (and music mood) from the last three, so the
  feed doesn't look like one video posted over and over. One background per video, or two
  alternating by scene.
- On lime, text is ink, rose-dark or forest-dark only. On the soft backgrounds, rose is fine for
  numbers; "good" green text is forest-dark.
- The highlighted word in a headline gets a marker swash behind it: lime on paper, sky and blush;
  paper on lime, butter and mint. The text itself stays ink.

## Type

- **Gaegu Bold** for headlines, numbers and anything a character "says". 110 to 140 px headlines.
- **Inter** (600) for small labels and the kicker pill, uppercase with wide letter spacing.
- No other fonts.

## The hand-drawn rules

- Every line wobbles. Nothing is a perfect rectangle or circle: use the pen in `scripts/lib/pen.js`.
- Ink outlines are 5 to 8 px with round ends, like the tomatoes.
- The wobble is seeded, so a frame always redraws the same way. In motion it "boils": the seed
  changes every 4 frames (about 7.5 times a second), as in hand-drawn animation.
- Paper grain on every background.
- Doodles allowed: steam squiggles, motion lines, arrows, underlines.
- Nothing glossy: no gradients on objects, no drop shadows, no glow. The only soft effect is the
  "sunrise": pale rays fanning out behind the host tomato, fading out before the text.

## The cast

- **The host is Roma Tom** (`Tomato.fromName('Roma Tom')`). Same face in every video.
- **Everyone else is a named tomato.** A guest, a barista or a supplier is `fromName('<name>')`,
  so a name always gives the same character. Reuse names across videos to build recurring characters
  (for example "Maria" the regular, "Dev" the line cook).
- Tomatoes bounce in, blink and lean. They are never hurt or sad in a way that is cruel; "tired"
  and "confused" are fine.

## Safe zones (Reels, TikTok, Shorts)

- Top 220 px and bottom 380 px are covered by the app's interface: keep text out of them.
- Right 140 px holds the like and comment buttons: keep key text out of it.
- The headline lives between y = 520 and y = 1100.

## Scene templates

Twenty-four templates, each a function `(ctx, theme, t, props, info)` in `scripts/scenes/`, where `t` runs
from 0 to 1 over the scene. Each one also lists its sound cues in `draw.cues(props)`. The props
for each are in `.claude/skills/roma-blossom/SKILL.md`.

1. **Hook.** The question in big Gaegu with one word on a marker swash, a kicker pill above it
   ("CAFE MATH", "STAFF", "GUESTS"), and Roma Tom rising like the sun at the bottom, with pale rays behind.
2. **The Receipt.** A paper till receipt prints line by line: the price of a dish, then food cost,
   labour, rent, card fees… and the small number left at the bottom, circled in rose. For margins,
   the real cost of a coffee, and why a discount hurts.
3. **The Menu Board.** A hand-drawn menu card with items and prices. Items get stars, crosses,
   arrows and circled prices to show menu engineering: what sells, what earns, where the eye goes,
   price anchoring, "$12" vs "12".
4. **The Rush.** A day drawn as a row of hourly bars, with a little queue of tomato guests growing
   at the door during the peak and a clock face. For staffing, slow afternoons, prep timing, ticket times.
5. **The Regulars.** A crowd of named tomatoes. Some get a stamp card that fills and keep coming
   back; others fade away. Counts tick up beside them. For retention, loyalty, "it costs more to win a new
   guest than to keep one", word of mouth.
6. **The Review.** A phone with a hand-drawn Google-style review card: stars fill in, a tomato
   guest's review types out, then the owner's reply appears. For reviews, replying, and the star rating that loses
   you customers. (The light tech scene.)
7. **The Jar.** A tip jar or cash jar fills with coins while a big number counts up beside it.
   For "small changes add up": $0.30 less waste per plate × 200 plates × 360 days.
8. **The Fix.** A sticky note checklist: three hand-written steps get ticked off one by one in forest
   green, with the host tomato nodding beside them. The takeaway scene, usually last before the end card.

9. **Versus.** Two cards head to head, each with a tomato, a label and a number; the winner's number gets
   circled and the other card fades back. Delivery app vs your own ordering, cash vs card.
10. **The Plate.** A dinner plate as a pie chart of where each dollar goes; one slice pops out in rose.
11. **The Calendar.** A month on the wall; days get crossed out, circled, dotted or ticked. Slow days, events.
12. **The Gauge.** A dial with good, okay and bad zones and a needle that swings to the number. Food cost %.
13. **The Tickets.** Order tickets slide onto the kitchen rail and their timers count up; the late one turns rose and shakes.
14. **The Day.** A wobbly path with stops (time and label), and the host walking it. Opening routines, a day's rhythm.
15. **The Chat.** A text thread on a phone with typing dots. Staff swaps, suppliers, a guest's message. (Light tech.)
16. **Myth vs Fact.** The myth card is struck through and tips back; the fact card slides up with a tick.
17. **The Quote.** A guest's words in a big speech bubble above them, with their name and how long they've been coming.
18. **The Countdown.** A list counting down to number 1, which gets the rose badge.
19. **The Scale.** Two things on a balance; the heavier side sinks and the beam wobbles to rest.
20. **The Stamp Card.** A loyalty card stamping up box by box to the reward.
21. **The Floor.** The dining room from above; guests sit, leave and new ones sit, turn after turn.
22. **The Price Tag.** A swinging tag: the old price is crossed out and the new one written in.
23. **The Trend.** A line chart drawing itself across the weeks, with a pinned note where something changed.
24. **The Rota.** A week of shifts filling in, with the headcount underneath and the thin day circled.

Plus a fixed **end card** on lime: the Roma Tom tomato, "Follow for more owner tips" and the handle.
