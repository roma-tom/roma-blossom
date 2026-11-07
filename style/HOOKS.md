# Hooks

The first second decides whether anyone sees the rest. Instagram counts how many viewers skip
a reel in its first 3 seconds, and that number feeds whether it shows the reel to more people.

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

## The hook templates

**Open on a scene.** Use one of the three animated hooks for most videos, and change the type from
one video to the next, so no two videos in a row open the same way. The text-card hooks stay for
when the words really are the scene (a number so big it is the picture), at most one video in three.

**Animated (the default)**

| type | what happens on screen | fits | say it like |
| --- | --- | --- | --- |
| `hook-pov` | "POV:" and the setup on screen; a guest walks up to Roma Tom's counter and says the line; Roma Tom jumps (shock, sweat or joy) | relatable, guests, story, a problem every owner knows | (the guest) "Hi! Are you guys still doing food?" |
| `hook-split` | two storefronts side by side with different signs; guests stroll past and all turn into one door | any choice between two ways (signs, prices, menus, hours) | "Same street, same coffee. Only one of these cafes is full at lunch." |
| `hook-freeze` | any other template plays, then stops with a record scratch; everything goes pale but one spot, circled, with a label and an arrow | advice and quizzes: the receipt line, the late ticket, the empty table, the dial in the red | "Stop. See table four? That ticket is about to cost you a regular." |

`videos/template-demo-hooks-2/` shows them back to back.

**Text cards (sometimes)**

| type | pattern | say it like |
| --- | --- | --- |
| `hook-same` | two things owners mix up; the equals gets slashed | "Markup and margin sound like the same thing. They're not." |
| `hook-number` | one big number slams in first, then what it is | "Eight thousand one hundred dollars a year. That's what free oat milk can cost you." |
| `hook-rule` | a common rule on a sticky note, stamped | "Never raise your prices, people say. That rule quietly costs you." |
| `hook-callout` | "Cafe owners," plus a line a guest really says | (the guest speaks) "You remembered my name? Okay, I'm coming back tomorrow." |
| `hook` | the original: a question with Roma Tom rising | Rarely; a short, sharp question only. |

`videos/template-demo-hooks/` shows the text cards.

**Rules for any hook**

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
