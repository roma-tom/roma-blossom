# Hooks

The first second decides whether anyone sees the rest. Instagram counts how many viewers skip
a reel in its first 3 seconds, and that number feeds whether it shows the reel to more people.

## Every video gets its own hook

The hook is the most important scene, so it is never a template. Each video's first scene is
drawn for that video alone, in `videos/<slug>/hook.js` (`"type": "./hook.js"` in the
storyboard). The other scenes keep reusing the templates.

**1. The idea first, in one line, before any code.** What picture, specific to this topic,
makes an owner stop? Write it at the top of `hook.js`:

- *The idea:* one sentence. "Free oat milk pours into a latte, and every drop flips out as a coin."
- *Frame one shows:* something already moving, in the middle of the action.
- *Readable by 0.5 s:* who it's for and what it's about (the line on screen, under about 8 words).
- *The open loop:* the question the rest of the video answers.

Good ideas come from the topic's own objects and moments: the cup, the receipt, the door, the
clock, the line, the guest's face. Make the problem visible: money leaving, a clock running,
a table emptying, a pile growing. If the idea would fit any other video, it isn't the idea yet.

**2. Build it** from `scripts/lib/stage.js`, plus `kit.js` and `marks.js`:

| part | what it is |
| --- | --- |
| `counter`, `cup`, `table`, `clock`, `storefront` | sets and props, drawn by hand like the rest |
| `walk`, `jump`, `rise` | tomatoes walking in with a bob, jumping when something lands, rising like the sun |
| `reaction` | `shock`, `sweat`, `joy` or `think`, drawn around a head |
| `say`, `pointer` | a guest's line in a bubble; a label with an arrow |
| `coin` | a spinning coin flying along an arc (money leaving) |
| `spotlight`, `flash`, `pauseSign`, `circle` | freeze-frame tricks: pale all but one spot, flash, pause, circle it |
| `playScene` | draw any template inside the hook, running or frozen |
| `at`, `pop`, `popIn` | timing in seconds: eased progress, pop-ins that overshoot |
| `tomato`, `headline`, `kicker`, `rays`, `pen` (kit.js) | the cast, the hand-lettered line, the label pill, the sunrise, the wobbly pen |
| `text`, `bubble`, `loop`, `cross`, `check`, `money` (marks.js) | text, bubbles and the marks an owner makes with a pen |

Add a new part to `stage.js` when a hook needs one that others could use (a register, a door,
a phone, a menu). `videos/template-demo-custom-hook/hook.js` is a worked example, and the hook
templates below show more ways to move things. Borrow parts, never a whole hook: the renderer
stops if `hook.js` is the scaffold's starter or a copy of another video's hook.

**3. The rules the hook keeps**

- Time everything in seconds (`info.sec`), not `t`: the scene stretches to fit the spoken line,
  and the words must land at the same moment however long it runs.
- Every word on screen comes from the storyboard's `props`, so the American English check and
  the cover can read it. Export `hook.cover = (props) => ({ kicker, headline, ... })` for the cover.
- Sound on the action: `hook.cues = () => [{ sec, sfx, gain }]`.
- When Roma Tom is in it as the host, he's in the middle of the frame (`W / 2`).
- Text stays out of the safe zones (top 220 px, bottom 380 px, right 140 px).
- Brand colors only (`C` and `theme`), no emoji.

**4. Check frames** at 0.03 s, 0.5 s, 1 s and the end (frame = seconds × 30):
`node scripts/render.js videos/<slug>/storyboard.json --frames 1,15,30,<last>`. Is something moving
on frame one? Is the line readable by frame 15? Does it look like a cartoon, not a slide? Is
anything crowded or off the edge? Fix and check again. A hook usually takes two or three rounds.

## Animated videos for owners: what opens best (researched November 7, 2026)

Roma Tom's niche is **animated videos for cafe and restaurant owners**. An Instagram and TikTok
index turned up no other account doing exactly that: searches for animated restaurant or cafe
content came back empty. So the lessons come from the two nearest neighbors: the biggest
animated explainer and animated relatable accounts, and the owner-education accounts below.

**Animated accounts, most-viewed reels**

| Views | Account | What the first seconds show | Pattern |
| --- | --- | --- | --- |
| 44.9M | an animated news explainer (3D) | "Dangerous Blind Spot": the scene itself, a truck and a scooter, right before it goes wrong | **Freeze on the moment** |
| 37.5M | same | "How Saddam Hussein was captured?": straight into the scene, then the explanation over it | **Freeze on the moment** |
| 9.6M | same | "Petrol vs EV Scooter": two side by side from the first frame | **Split** |
| 19.8M (518k shares) | an animated relatable-skit account | "I can't STAND the morning cold": a character mid-moment that everyone knows, no title | **POV cold open** |
| 7.8M | same | "Why does it ALWAYS work??": the familiar moment, then the reaction | **POV cold open** |
| 9.6M | an animated health explainer | "What your food actually does to your bones (healthy vs unhealthy)": two versions side by side | **Split** |
| 21.5M (1.4M shares) | an animated comedy account | relatable moments, captioned "Tag your friends" | **POV cold open** |

What they have in common:

- **They open inside the scene, not on a title card.** Characters are already doing something on
  frame one: walking in, about to crash, mid-reaction. The words sit over the action.
- **Comparison is instant.** Two versions side by side need no explaining; the eye compares
  before the voice starts.
- **The pause is the hook.** Explainers stop the action at the moment of trouble and point at
  it, which opens a question the rest of the video answers.
- **Relatable beats informative for shares.** The skit accounts get hundreds of thousands of shares a
  reel: people send them with "this is us". For owners, that is the staff group chat.
- Hook guides agree on the mechanics: movement in the first frame, a pattern interrupt, a
  signal of who it's for ("Cafe owners", "POV: two minutes to close"), and an open loop.

Our old hooks all opened on a title card: a kicker pill, a line of text, Roma Tom rising. That
reads as a slide, not a cartoon, and an animated channel's edge is the animation.

## Owner-education accounts: what they say first (researched November 2026)

**Our own reels** (Metricool, Nov 3 to 5; all about 130 to 230 views, so a hint, not proof). This
is the share of viewers who watched past 3 seconds:

| Reel | How it opens | Watched past 3 s |
| --- | --- | --- |
| mobile-ordering | a statement: "Guests don't love the app." | 59% |
| oat-milk-charge | a question with a money answer coming | 54% |
| staff retention | a statement | 50% |
| google-reviews | "How do you get more Google reviews…?" | 30% |
| best-seller (second post) | "Your best seller pays the bills… but…" | 32% |

**The biggest owner-education account we found, @owner** (212k followers, a restaurant owner
teaching other owners), most-viewed reels, from an Instagram index:

| Views | Opening line | Pattern |
| --- | --- | --- |
| 12.9M | Margin and markup sound like the same thing. They're not. | **Sound the same** |
| 5.7M | If "dead food" is the only free food your staff gets, you may be creating the wrong incentive. | **The rule that costs you** |
| 875k | "30 days to pay" sounds free. It isn't. | **The rule that costs you** |
| 734k | We lose $52,740 a year from 3 things most restaurant owners barely notice. | **Number first** |
| 505k | Restaurant advice that sounds smart but can hurt your business. | **The rule that costs you** |
| 466k | The difference between owning a restaurant in Year 0 vs. Year 12 | Then vs now |
| 285k | I can tell a lot about a restaurant before I even taste the food | Insider claim |
| 262k | If you're pricing your menu at 3× food cost, you could be losing money | **The rule that costs you** |
| 128k | McDonald's doesn't make money on burgers. | Surprising claim |
| 46k | Guess how many pizzas a pizzeria has to sell just to pay the bills. | Guess the number |

Others: a practical "Restaurant owners, the lids on squeeze bottles break constantly" got 289k
views and nearly 20k shares (**Callout**). A cafe-founder account's best openers are contrarian
takes: "Customers aren't the real kings of business, employees are."

**What the winners share**

- They open on a **claim**, not a question. Almost none start "Should you…" or "How do you…".
- Each has **one** clear thing: a confusion, a number, a rule to break, or a person to name.
- The text is short and on screen from the first frame. Food-marketing guides agree: about 3 to
  8 words on screen, readable at a glance, and nothing slow before it.
- Our old hook was the same every time: a kicker pill, a "Should you…?" question writing itself
  in word by word, and Roma Tom rising. The text took most of a second to appear.

## Hook templates from earlier videos

Earlier videos opened with these. They are references now: read them for ideas and moves, and
lift their parts into `stage.js`, but a new video's hook is never one of them.

| type | what it does | used by |
| --- | --- | --- |
| `hook-pov` | "POV:" setup; a guest walks up to Roma Tom's counter, says the line, he reacts | `template-demo-hooks-2` |
| `hook-split` | two storefronts side by side; guests pick one door | `template-demo-hooks-2` |
| `hook-freeze` | another template plays, freezes with a record scratch, one spot circled | `template-demo-hooks-2` |
| `hook-same` | two words; the equals sign gets slashed | `markup-vs-margin` |
| `hook-number` | one big number slams in and gets circled | `saturday-at-the-cafe` |
| `hook-rule` | a rule on a sticky note gets stamped | `happy-hour-math`, `staff-come-first` |
| `hook-callout` | "Cafe owners," and a guest's line in a bubble | `one-water-four-hours` |
| `hook` | the original: a question with Roma Tom rising | most videos before November 6 |

**Rules for any hook line**

- Something moves on the first frame, and who it's for is clear in the first second.
- Lead with the claim, the number, the rule or the guest. Not "Should you…".
- A number in the hook must be the video's own worked number, with the same fact note.
- One idea. If the hook needs "and", it's two hooks.
- On screen: under about 8 words. The spoken line can say a little more.
- Still kind: break the rule, not the viewer. "That rule quietly costs you", never "You're doing it wrong".

## Hook bank: the backlog, rewritten

The openers below were the first draft. Each topic in **Up next** (`topics.md`) now carries its
own `Hook:`, so use that; this table stays as examples. A number in brackets means: use the
figure from that video's own worked example.

| Topic | Type | On screen | Said |
| --- | --- | --- | --- |
| Is your happy hour making or losing money? | `hook-rule` | note "Happy hour fills the room", stamp "AT A LOSS?" | "Happy hour fills the room. It might also be emptying the register." |
| What's the real cost of a free refill? | `hook-number` | [yearly cost] / "a year, on *free* refills" | "[Number] dollars a year. That's what free refills can cost." |
| Is your Google profile quietly losing you customers? | `hook-callout` | "Cafe owners," / guest: "It said you were *open*." | (guest) "Your Google page said you were open. I drove twenty minutes." |
| Should you pay a bit above minimum wage? | `hook-number` | "$1" / "an hour that saves you *thousands*" | "One dollar an hour can save you thousands. Here's the math." |
| Should prices end in .95 or a round number? | `hook-same` | "$9.95" ≠ "$10" / "Not the same *signal*" | "Nine ninety-five and ten dollars sound almost the same. Guests don't read them that way." |
| How does portion creep quietly eat your margin? | `hook-number` | [yearly cost] / "lost to *a bigger scoop*" | "[Number] dollars a year, lost to a slightly bigger scoop." |
| Is a bigger menu costing you money? | `hook-rule` | note "More dishes, more sales", stamp "NOPE" | "More dishes, more sales, right? Usually not." |
| Should your staff eat for free? | `hook-rule` | note "Staff get the leftovers", stamp "WRONG MESSAGE" | "If leftovers are the only free food your staff get, you're sending the wrong message." |
| Gift cards: free money or a promise? | `hook-same` | "Gift card sale" ≠ "Income" / "Not yet *yours*" | "A gift card sale and income sound like the same thing. They're not." |
| Card surcharges: pass it on or absorb it? | `hook-callout` | "Cafe owners," / guest: "Wait, what's this *fee*?" | (guest) "Wait. What's this extra fee on my check?" |
| Laptop campers: how long is too long? | `hook-number` | "1 latte" / "four hours at your *best table*" | "One latte. Four hours. Your best table." |
| Why does a free sample sell more than a discount? | `hook-rule` | note "Discounts bring people in", stamp "TRY THIS" | "Everyone reaches for a discount. A free taste usually sells more." |
| Hire for attitude or experience? | `hook-same` | "Experience" ≠ "Good hire" / "Not the *same thing*" | "Lots of experience and a good hire sound like the same thing. Often they're not." |
| How do you turn a one-star review into a regular? | `hook-callout` | "Cafe owners," / guest: "My latte was *cold*." | (guest) "My latte was cold. One star." |
| Where does your $5 latte actually go? | `hook-number` | "$5" / "and you keep *this much*" | "Five dollars a latte. Guess how much you keep." |
| Should you open on Mondays? | `hook-rule` | note "Always open seven days", stamp "NOT ALWAYS" | "Seven days a week sounds like more money. Not always." |
