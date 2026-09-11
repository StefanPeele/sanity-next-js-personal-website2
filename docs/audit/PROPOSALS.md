# Proposals awaiting Stefan

Everything here is written and committed but **not applied**. The brief says: produce the
proposal, commit it, continue. Each entry says what I would do and why, so a yes is one
word and a no costs nothing.

Ordered by phase. `OVERHAUL-PROGRESS.md` indexes these alongside the research findings.

---

## 2.2 The blog description — three versions

**Current** (`blogPage.header.lede`, live):

> Perspective pieces, deep dives, and field notes on network engineering, infrastructure,
> and the work of learning it.

Two problems beyond tone. It **hardcodes the lane names**, and Phase 4.3 renames "field
notes" — so this string needs editing again the moment that lands. And it describes the
*formats* rather than saying anything about the person writing them.

The brief asks the description to carry four things: this is where the thinking goes; a
perspective on the industry being entered and trying to be understood; anything adjacent;
and an invitation to professional critique, framed as learning in public.

All three below avoid lane names on purpose.

### A — plain

> Notes on network engineering and the industry I'm about to enter: what I'm learning, what
> I've got wrong, and what I'm still working out. Written in public so it can be corrected.

*Closest to the current line and the lowest-risk change. "Written in public so it can be
corrected" does the invitation in six words and sets up Phase 3's status marks without
explaining them.*

### B — first person, invitation forward

> I'm learning network engineering and writing it down as I go — deep dives, working
> theories, and the occasional opinion about an industry I haven't joined yet. If something
> here is wrong, I'd like to know.

*The most human of the three and the most explicit invitation. "an industry I haven't joined
yet" is the honest framing of a student writing about a profession, and it disarms the
obvious objection before a reader makes it. Risk: "I'd like to know" is softer than a
professional critique invitation might want to be.*

### C — states the contract

> Where my thinking goes: network engineering, infrastructure, and an industry I'm trying to
> understand before I'm in it. Nothing here is authoritative. Every post carries how sure I
> am, and every one of them can be corrected.

*The only version that advertises the epistemic-status system Phase 3 builds. That makes the
description and the status marks one idea instead of two features. Risk: it promises
something that does not exist yet — do not ship C until Phase 3 is live.*

**My recommendation: A now, C after Phase 3.** A is true today. C becomes true once
confidence marks and corrections ship, and at that point it is the strongest of the three
because it is the only one that tells a reader what the site *does* rather than what it is
about.

`metaDescription` should stay distinct from the lede — it is search-result copy, not a
banner. For A:

> Network engineering, infrastructure, and the work of learning a field from outside it.
> Written in public and open to correction.

---

## 2.3 The critique invitation

The brief asks for an affordance near the header with opening guidelines — tell me where
I'm wrong, share your perspective, what am I missing — and asks me to choose between an
inline note, a tooltip, and a small panel, with reasoning.

### Recommendation: an inline note, directly under the lede

**Reasoning, in order of weight:**

1. **An invitation that has to be discovered is not an invitation.** A tooltip hides the
   thing behind a hover, which on touch does not exist at all (§1.8 settled that there is no
   good touch equivalent for hover). An invitation to critique is the *least* appropriate
   candidate for a hover-gated affordance.
2. **§1.1 measured that we have the room.** Ours renders **9 links above the fold** against
   a reference median of 26 — the lowest in the set. A one-line note costs about 24px of a
   fold that is currently the emptiest of thirteen measured pages.
3. **§1.4's principle says quiet, not hidden.** Document-level statements belong in the
   header at low volume. A panel is louder than a one-line invitation deserves and competes
   with the featured post immediately below it.
4. **It is copy, so it belongs in Studio** and can be turned off with an `enabled` boolean
   like every other optional section, per `CLAUDE.md`.

### Copy

> **Found something wrong?** I'd rather know. Corrections, disagreements and things I've
> missed all welcome — <stefan@…> — and anything that changes a post gets credited on it.

The second clause is the part that matters and it is the part most sites omit: it tells the
reader *what happens* to their correction. That is a promise Phase 8.8 has to keep, so this
copy and that feature ship together or not at all.

**Shorter variant** if the above is too long for the header:

> Corrections and disagreements welcome — they get credited on the post.

### Shape

- One line, `font-sans text-sm`, `text-stone-400`, directly beneath the lede, above the
  header's bottom rule.
- A mailto link on the address, using `QUIET_LINK` from `lib/ui.ts`.
- New Studio fields on `blogPage.header`: `critiqueInvite.enabled` (boolean),
  `critiqueInvite.text`, `critiqueInvite.email`.
- **No icon.** `CLAUDE.md` rules out decorative glyphs, and an icon here would make a
  sentence look like an alert.

**Not building it yet** — it is a proposal per the brief, and its second clause depends on
Phase 8.8 existing.

---

## 2.4 Meta type scale — the audit, before changing anything

The brief asks for the full list of blog-surface text nodes under 14px with proposed sizes,
**before** any change. Measured against production at 1440 across `/blog`, a full article,
and `/blog/series` — walking text nodes, recording the rendered shape of each.

**31 nodes below 14px. Every one of them is exactly 12px — nothing is below the floor.**
They fall into three shapes:

| # | Shape | Count | What it actually is |
| --- | --- | --- | --- |
| 1 | **12px Inter, sentence case, normal tracking** | **15** | Taxonomy pills ("Network & Infrastructure", "Perspective"), filter-row labels ("Type", "Topic", "Sort"), the photo-credit badge |
| 2 | **12px IBM Plex Mono, uppercase, 1.44px** (`.meta-label`) | **12** | Skip link, "Search", ⌘K, "Featured", the card reading times |
| 3 | 12px IBM Plex Mono, sentence case, normal | 4 | Newsletter fine print |

### Where the brief and the measured evidence disagree

The brief sets **"minimum 14px for all meta: dates, reading time, 'Read →', counts,
kickers."** §1.2 measured the kicker band across six publications as **10–15px, clustering
at 12 and 14** — NYT at 10–11, Defector and FT at 12, 404 Media / Increment / Ars at 14.

So **12px is inside the professional band, not below it.** A blanket 14px floor is
defensible as *the top* of that band, but it is not what the evidence requires, and it
would put our kicker larger than Defector's and NYT's.

Where the evidence is unambiguous is not size at all:

- **Shape 1 has three different jobs wearing one costume.** A taxonomy pill, a filter-row
  label, and a photo credit all render 12px Inter sentence case. §1.2 established that a
  tag, a section label and a badge are three different forms. This is the same conflation
  as the FEATURED badge, one level down.
- **Reading time still disagrees with itself** (§1.3): 14px Inter sentence case on the hero,
  12px mono uppercase on the cards, and the cards drop the word "read". That is a defect at
  any size, and fixing the size without fixing the split would leave it.

### Proposed sizes

| Element | Now | Proposed | Reason |
| --- | --- | --- | --- |
| Card reading time | 12px mono upper, "3 min" | **14px sans sentence, "3 min read"** | Matches the hero, which is already correct. §1.3: the two coherent positions are NYT-chrome or Aeon-content; ours should pick one, and sentence-case sans is the content position |
| Hero reading time | 14px sans, "18 min read" | **unchanged** | Already the target |
| Date | 14px sans | unchanged | Already ≥14 |
| Post count / "Latest" | 14px sans | unchanged | Already ≥14 |
| "Read →" | 14px sans | **keep 14px, change the arrow** — see below | Size is fine; the glyph is the defect |
| Taxonomy pills | 12px sans | **13px sans** *(or 12px kept)* | Low confidence. 12px is inside the measured band; 13px is not a Tailwind step and would reintroduce a bracketed size that `dab10fe` just removed. **Recommend leaving at 12px** and fixing the *role* confusion instead |
| Filter-row labels ("Type", "Topic", "Sort") | 12px sans | **`.meta-label` at 12px** | These are micro-labels, not content. Giving them the mono label face separates them from the pills they sit beside, which is the actual problem |
| Kicker (when 2.5 builds it) | — | **12px mono, coloured** | §1.2's measured band, and `.meta-label` already matches it on every axis except colour |
| Newsletter fine print | 12px mono | unchanged | Fine print is fine print |
| Skip link | 12px mono | unchanged | Raised from 11px in `dab10fe` |

### The "Read →" arrow

The brief says it "currently looks like a stray glyph" and asks for a button treatment. Two
observations before that becomes a button:

1. The arrow is a literal `→` appended in JSX — one of the 42 typographic arrows that
   commit `8f266cb` deliberately left, having established they are *not* emoji and so not
   covered by the icon rule. The spacing complaint is real: `{label} →` puts a normal space
   between word and glyph, so the arrow sits at text baseline with no optical adjustment.
2. **A button treatment may be wrong here.** `buttonClass()` exists and would take it, but
   §1.1 measured that the essay-camp sites use no button on an index card — the whole card
   is the target. Adding a button inside a card that is already a link creates a nested
   interactive target, which is both an accessibility problem and a duplicate.

**Recommendation: not a button.** Keep it a text affordance, give the arrow
`ml-1 inline-block transition-transform group-hover:translate-x-0.5` so it moves with the
hover the card already has, and set the gap in CSS rather than as a literal space.

### What I would change, in one sentence

**Nothing about the floor — 12px is correct and inside the professional band. Unify reading
time on 14px sans sentence case, move the filter-row labels onto `.meta-label` so they stop
impersonating taxonomy pills, and fix the arrow's spacing rather than making it a button.**

Not applied — the brief says report first, and two of these depend on 2.5's decisions about
the pills and the kicker.

---

## 2.6 The "AI-looking" problem — diagnosed

The brief calls this the single most important aesthetic item, states a theory — *"every
element on the cards carries similar weight with similar spacing, so nothing leads"* — and
asks me to test it, say so if it is wrong, and give the real one.

### The theory is right about the card and wrong about the page

Those are two different measurements and they point in opposite directions.

**At page level, we lead harder than almost anyone** (§1.1): lead:body **5.14×**, second
highest of thirteen measured pages, ahead of Quanta, Increment, The Atlantic and the FT.
Nothing about the page is timid.

**At card level, we have the smallest contrast in the set.** Measured with
`docs/audit/measure-cards.mjs` — every text node inside one post card, its size, weight and
the gap above it:

| Site | Card | Distinct sizes | **Spread (max:min)** | Title | **Title:excerpt** |
| --- | --- | --- | --- | --- | --- |
| **Ours** | 389×533 | 20 / 14 / 12 | **1.67× — lowest** | **20px w400** Lora | **1.43× — lowest** |
| 404 Media | 393×522 | 26.5 / 17.6 / 14.1 | 1.88× | 26.5px w400 Space Grotesk | 1.51× |
| Quanta | 260×399 | 18 / 13 / 10 / 9 | 2.00× | 18px **w700** Noe Display | 1.38× |
| Defector | 284×381 | 24 / 12 | 2.00× | 24px **w700** degular | — (no excerpt) |
| Ars Technica | 1152×324 | 39.1 / 18 / 14 / 12 | **3.26×** | 39.1px **w700** Faustina | 2.17× |

So the real diagnosis is narrower and more useful than the theory as stated:

> **The page shouts and the card mumbles.** Two levers are sitting unused on the card —
> **size spread** and **weight** — and we are last in the set on both.

Three of the four references set the card title at **w700**. Ours is **w400**. The one that
also uses w400 — 404 Media — compensates with a much larger size (26.5px) and a display
face. We do neither.

**Defector is the instructive counter-example.** It runs only **two** sizes on a card and
still achieves a 2.0× spread, because it carries no excerpt at all. Contrast came from
*removing* the middle term, not from adding sizes. That is the opposite of the instinct to
fix this by introducing more steps.

### Rendered options

Four, against production, CSS injected at runtime — no application code changed, the same
technique `docs/audit/decisions/` used. `docs/audit/render-card-options.mjs`, captured at
1440 / 768 / 390 in `docs/audit/screenshots/card-options/`.

| Option | Title | Pill row | Measured spread |
| --- | --- | --- | --- |
| **A** baseline | 20px w400 | unchanged | 1.67× |
| **B** | **24px w600** | unchanged | **2.00×** |
| **C** | **24px w600** | first pill becomes a mono kicker, rest hidden | **2.00×** |
| **D** | 28px w600 | same as C | 2.33× |

### Recommendation: C

**24px, weight 600, and the category pill restyled as a kicker above the headline.**

Why C over B: the pill and the title were competing. Turning the bordered pill into a
12px mono uppercase kicker directly above the headline is the structure §1.2 measured at
404 Media, Defector, Ars and NYT — kicker, headline, excerpt, footer — and it removes a
bordered box from the one place a card needs its title to win.

Why C over D: 28px is a 2.33× spread, past Quanta and Defector and short of only Ars, which
runs a 1152px-wide full-bleed card we do not have. At 390 the 28px title wraps to five
lines on the longer post. 24px holds at three.

**Specific values**, all existing Tailwind steps:

```
h3:  text-xl font-serif            ->  text-2xl font-serif font-semibold
     (20px w400)                        (24px w600)
pill: font-sans text-xs px-3 py-1.5 rounded-full border [inline colour]
     ->  meta-label, coloured with the lane colour it already has, no border, no fill
```

The lane colour is **already in the data** — `articleTypeMeta().color` — and the card
already uses it, but only on the badge floating over the image. A kicker in that colour
costs nothing new.

### One thing the render exposed that was not in the brief

With the kicker in mono uppercase, **"3 MIN" on the same row now reads as a second kicker.**
Both are 12px mono uppercase, both grey, sitting at opposite ends of one line. The eye pairs
them.

That strengthens §2.4's recommendation independently: reading time should become
**14px sans sentence case, "3 min read"**, so it stops impersonating a kicker. C and that
change belong in the same commit — shipping C alone would make the reading-time problem
more visible, not less.

### Two corrections to my own §2.4 note

1. I wrote that `"Read →"` is a literal glyph with a plain space. **On the card it is not** —
   it is `<ArrowRight size={14} className="group-hover:translate-x-0.5 …" />`, a lucide icon
   with a real gap and a hover translate, already correct. The literal-glyph version is on
   the **hero** (`blog/page.tsx`, `{copy.featured.readLabel} →`). I generalised from one
   instance to both; only the hero needs fixing.
2. I described the card meta row as carrying up to three pills plus reading time. On the
   live posts it renders **one** pill — the lane pill is absent because `articleType` does
   not resolve to a lane for these posts. The three-pill case is possible, not current.
   Worth knowing before optimising for crowding that is not there.

**Not applied.** All four options are rendered and committed; the change itself is one line
of Tailwind on the `h3` plus a pill restyle, and it should land together with the
reading-time fix rather than alone.

---

## 2.5 Hierarchy on the index

### Dividers — rendered, and the evidence already decided it

§1.1 counted bordered blocks >200px wide on every measured index. Two camps, and they map
exactly onto publication type:

| Camp | Sites | Count |
| --- | --- | --- |
| News density | Verge 89, FT 51, Atlantic 50, Defector 23, Guardian 23 | many |
| **Essay / magazine** | **Increment 0, Asterisk 2, Aeon 2, Ars 2, 404 Media 3, Quanta 4** | ~0 |
| Ours | — | 16 |

Every site this one wants to resemble is in the second camp. Rendered anyway, because the
brief asks for both options shown rather than argued:
`docs/audit/render-divider-options.mjs`, captured at 1440 / 768 / 390 in
`docs/audit/screenshots/divider-options/`.

| Option | What it does | Bordered blocks in `<main>` |
| --- | --- | --- |
| **A** baseline | — | 7 |
| **B** strengthen | `--edge-faint` 5% → 14% | 7 (louder, not fewer) |
| **C** space only | section rules removed, 5rem margins instead | **4** |
| **D** space + label | C, plus `.section-label` as a 12px mono kicker | **4** |

**Recommendation: D.** C is the evidence-backed change; D adds the thing that makes it
work. Once the rule under the header is gone, *something* has to mark where a section
starts — and §1.2 measured that the answer at every comparable site is a small mono label,
not a line. D moves the work from a border to a word.

B is the option to reject explicitly: it makes the page louder without making it clearer,
and it moves us further from the camp we are trying to join.

### "Featured" is on the page twice

Found in the render, not looked for. With D applied it is unmissable:

- The **section label** above the hero reads `FEATURED`.
- The **badge inside the hero card** also reads `FEATURED`.

Same word, 40px apart, in two different typographic systems — a 12px mono label and a 12px
mono uppercase white-filled box. §1.2 established that a status flag is a legitimate form,
but a flag that repeats the section heading directly above it is carrying no information.

**Three ways out, in the order I would try them:**

1. **Drop the badge, keep the section label.** The hero's position already says "featured";
   the label above it already says so in words. This is the cheapest and it is what Aeon,
   Asterisk and Increment do — the lead story is identified by placement, not by a sticker.
2. **Drop the section label, keep the badge.** Works, but it wastes the section label slot
   that D just made useful.
3. **Keep both and make them different things** — label stays `Featured`, badge becomes the
   *lane* (`Perspective`), coloured. This is the §1.2 recommendation applied: a flag for
   status, a kicker for section, never the same word twice.

**I would do 1.** It is subtraction, it is what the reference set does, and it removes an
element rather than restyling one.

### Featured and Latest are different things

The brief is right that these are different and that both belong above the fold. Two
constraints the measurement adds:

- **§1.1: our fold is the emptiest in the set** — 9 links above it against a median of 26,
  the lowest of thirteen. There is room for a second tier; the problem is not crowding.
- **§1.1: our tiers are 72 / 60 / — / 24.** A "Latest" strip placed above the fold has to
  live in the missing middle, which is precisely the gap that makes the page read as
  unedited. This is the same finding as 2.6 from the other end.

**Proposed structure**, which fills the middle rather than adding a fourth shout:

```
Blog                      h1, currently 72px -> 48px   (see below)
lede + critique invite
FEATURED                  12px mono kicker (option D)
  <hero>                  headline 60px  -- now the largest thing on the page
LATEST                    12px mono kicker
  <3 cards in a row>      headline 24px w600 (2.6 option C)
```

**The h1 has to come down.** §1.1 measured that of twelve reference sites, **none** renders
its own section name larger than its lead story; ours renders "Blog" at 72px above a 60px
story headline. Dropping the h1 to 48px makes the hero the largest thing on the page and
creates the tier ladder 60 / 48 / 24 that the page currently lacks.

That is a change to `text-5xl md:text-7xl` on `blog/page.tsx` — but it is **not rendered
yet**, and it is a bigger aesthetic call than the card change, so it belongs in its own
round of options rather than being folded in here.

### What is ready to ship from 2.5, and what is not

| Item | State |
| --- | --- |
| Dividers → space + mono section labels (D) | **Rendered, recommended, not applied** |
| Drop the duplicate FEATURED badge | **Recommended, not applied** — subtraction, one line |
| h1 72px → 48px | **Not rendered.** Needs its own options round |
| Latest strip as a real second tier | **Not designed.** Depends on the h1 decision |

---

# Phase 5.6 — Summaries. The full proposal.

Written 2026-09-11. Nothing here is built yet; this answers the six questions 5.6 asks,
with the arithmetic done against the real corpus rather than a guess at it.

## What already exists, so none of it gets rebuilt

- **`@anthropic-ai/sdk` is already a dependency**, and `app/actions/ask.ts` already calls it
  for "Ask this article" — gated on `ANTHROPIC_API_KEY`, rate-limited per IP, fed article
  text through `portableTextToPlain`. The summary feature reuses that shape.
- **A publish webhook already exists**, at `app/api/draft-mode/enable/revalidate/route.ts`.
  Sanity calls it on every create/update/delete and it revalidates the affected paths. This
  is the hook the summary generation attaches to.
  *(Aside, outside 5.6: that route lives at `/api/draft-mode/enable/revalidate`, nested
  inside the draft-mode enable route. It works, and the path is misleading — it has nothing
  to do with enabling draft mode. Worth moving to `/api/revalidate` with a redirect, but not
  as part of this.)*

## 1. When does it generate?

**At publish time, from the existing webhook. Stored in Sanity.** Not at build time, not on
first request.

The three options and why this one:

| | Where it runs | Cost driver | Latency for a reader | Fails how |
| --- | --- | --- | --- | --- |
| Build time | `npm run build` | **every build**, × every post | none | build breaks or ships empty |
| First request, cached | edge/server | cache misses | **first reader of each post waits** | reader sees a spinner or nothing |
| **Publish webhook → Sanity** | once, out of band | **every material edit** | none | nothing renders; the failure is visible in Studio |

The decisive number is the second column, and it is worked out below: build-time generation
costs more *every month* than the webhook approach costs *in total, ever*.

The second-order reason is just as strong. Storing the summary in Sanity makes it a piece of
content rather than a cache entry — which is what makes question 6 (hand-written override)
answerable at all, and what makes a failure something Stefan can see rather than something a
reader can.

## 2. Is it cached, and where?

It is not cached; it is **stored**, as a field on the post. The distinction matters: a cache
can be evicted and silently regenerated, and this must not be, because the field is
editable and an eviction would throw away a hand-written override.

Schema:

```
summary        text        the summary itself
summarySource  'generated' | 'authored'
summaryModel   string      which model wrote it, e.g. claude-haiku-4-5
summaryAt      datetime    when
summaryOfHash  string      hash of the body text it describes
```

`summaryOfHash` is what makes staleness detectable rather than assumed — see question 4.

## 3. What does it cost?

**Measured against the real corpus**, not estimated from a typical blog post. The three
published posts are 4,760, 24,281 and 3,037 characters of body text: mean 10,693 chars,
about **2,673 tokens each**, with the longest at about **6,070**.

Per generation: roughly **2,900 input tokens** (post + a short system prompt) on average,
**6,300 worst case**, and **100–150 output tokens** for a summary of 60–90 words.

Lifetime, assuming the blog reaches 50 posts and each is regenerated three times (first
publish plus two material edits):

- 150 generations × ~2,900 in ≈ **435,000 input tokens**
- 150 × ~130 out ≈ **20,000 output tokens**

That is the *total, forever* figure, not a monthly one.

**Per month at realistic traffic: zero.** Generation is decoupled from requests entirely, so
a thousand readers and one reader cost the same. This is the whole argument for option three.

Contrast build-time generation: 50 posts × 2,900 ≈ **145,000 input tokens per build**, and
the publish webhook triggers a rebuild on every content change. At a few dozen content edits
a month that is **3–5 million input tokens per month** — roughly ten times the *lifetime*
cost of the webhook approach, every month, forever.

**Model: Haiku 4.5, not Opus.** `ask.ts` uses `claude-opus-5`, which is right for answering
an arbitrary reader question from a long article and wrong for compressing a document into
80 words. Summarisation is the cheapest capable model's job.

**On dollar figures:** the token arithmetic above is exact and derived from the real corpus.
I have deliberately not converted it to dollars, because I would be quoting a price list
from memory and this project has a standing rule about confident numbers that turn out to be
wrong. Multiply by the current published per-token price — at any plausible price this is a
rounding error, and that conclusion is robust to being wrong about the exact rate.

## 4. What happens when generation fails?

**Nothing renders, and publishing is never blocked.**

- The webhook writes nothing on failure. `summary` stays empty, and every surface that would
  show it — the hover preview, the toolbar panel — simply omits it. No spinner, no
  placeholder, no "summary unavailable". A missing summary is not an error state for a
  reader; it is the absence of an optional convenience.
- The failure is logged and **visible in Studio**: `summaryAt` stays empty while `summaryOfHash`
  does not match the body, which is exactly the "stale" condition below. Stefan sees a post
  with no summary, not a reader seeing a broken panel.
- Retries are not automatic. An automatic retry on a webhook that fires on every edit is how
  a bad prompt turns into a bill.

**Staleness is the harder failure, and it matters more here than on most sites.** If the body
changes and the summary does not, the page shows a machine's description of a version of the
post that no longer exists. `summaryOfHash` detects it: when it does not match the current
body, the summary is **suppressed, not shown stale**, and Studio marks it for regeneration.

**This connects directly to Phase 3B.** A post that gains a *correction* has, by definition,
said something wrong. A summary generated before that correction may well repeat the thing
that was corrected — the site would then be marking an error in place, in the body, while
an AI summary two panels away confidently restates it. **A correction must invalidate the
summary.** That is one line in the webhook's rule table and it is not optional.

## 5. Is it labelled as machine-generated?

**Yes, visibly, in the panel itself — not in a tooltip and not in the page source.**

The label is not a disclaimer bolted on; it is the first line of the panel:

```
Summary · generated by claude-haiku-4-5, 11 Sep 2026
```

Three commitments behind that:

- **It is never styled like prose.** Different family, different colour, inside a bordered
  panel — closer to the correction card than to the article body.
- **It never appears in the feeds.** RSS and JSON Feed strip context, and a label that
  survives in one reader is lost in the next. The feeds already carry an authored `excerpt`;
  that is what a subscriber gets.
- **When Stefan writes it himself, the label goes away entirely** — because then it is simply
  his summary, and labelling authored text as generated would be its own kind of dishonesty.

A blog whose subject is epistemic honesty, which now marks its own errors in place with
attribution, cannot present a model's paraphrase as the author's. This is the one requirement
in 5.6 with no trade-off to weigh.

## 6. Can it be overridden by hand?

**Yes, and the override must be unclobberable.** That is the part worth being careful about.

- Editing `summary` in Studio sets `summarySource: 'authored'`.
- **The webhook refuses to write when `summarySource === 'authored'`.** Not "prefers not
  to" — refuses. A regeneration that silently overwrote a hand-written summary would be the
  same class of bug as a correction whose anchor no longer matches: invisible, and only
  noticed later by a reader.
- Clearing the field resets it to `generated`, and the next publish regenerates it.

This also gives the honest default for a post Stefan has thought hard about: write the
summary yourself, and the machine never touches it.

## What I would build first

Not the generation. **The field, the label and the suppression rules** — schema, the panel,
`summaryOfHash`, and the correction-invalidates-summary rule — with summaries written by
hand. That ships the reader-facing half with zero API cost and zero failure modes, and it
means the generation step, when it lands, is a webhook that fills in a field whose every
consumer already works.

---

# Phase 6 — Sidenotes. The design, before the build.

Written 2026-09-11, against the code as it stands rather than from the brief alone.

## What already exists, measured not assumed

| 6.x | Status today |
| --- | --- |
| **6.1 Authoring** | **Done.** A `sidenote` markDef on Portable Text, authored in Studio by selecting a phrase — exactly the mechanism the brief guesses at. `CustomPortableText` renders it as `<SideNote>`. |
| **6.2 Glossary** | Half done, and **the half that exists is already the brief's "hybrid"** — see below. |
| **6.3 Placement** | **Not the margin.** It is a tooltip anchored `bottom-full` above the phrase, `pointer-events: none`, `hidden lg:group-hover:block`. None of 6.3's three questions has an answer today. |
| **6.4 Mobile** | One of the two options is built: click toggles an inline expansion at the anchor. The footnote-style alternative is not. |
| **6.5 Expansion** | Not built. |

## 6.2 — the recommendation: **hybrid, and it is already written**

`lib/glossary.ts` marks **the first prose occurrence of each term per article**, case-insensitively, longest term first, and never inside a heading, a code span, a link, another glossary mark or a sidenote. That is precisely the brief's third option:

> *Hybrid: first occurrence per article is automatic, subsequent ones are not.*

So the decision 6.2 asks for has effectively been made and shipped; what is missing is that glossary marks and sidenotes are **two different components with two different treatments** — a dotted amber underline with a hover card versus a dashed underline with a `※` and a tooltip. A reader meets two annotation systems and has to learn both.

**Recommendation: keep the hybrid matching exactly as it is, and unify the PRESENTATION.** One margin column, two sources:

- a **hand-authored** note is the author talking about this passage;
- a **glossary-derived** note is a definition that happens to apply here.

They differ by a label and a colour, not by a mechanism. That answers "without me doing the work twice": the glossary is authored once in its own document type and surfaces automatically; sidenotes are authored only where the author has something to say that the glossary does not already say.

**The opt-in option is rejected** with a reason: it makes every glossary term a second authoring decision, and the brief itself says this choice "materially affects how much work authoring becomes". Automatic-everywhere is rejected for the reason the brief gives — noise and repetition — which the first-occurrence rule already solves.

**One gap in the current matcher, worth fixing while here:** it skips headings, code, links and sidenotes, but not **proper nouns**. "The Field" as a title and "the field" as a concept are the same string to it.

## 6.3 — placement, with the three edge cases answered

**The column.** Sidenotes go in the **right margin, shared with the TOC**, not replacing it. The TOC is sticky and short; sidenotes are anchored and sparse. Measured from `decisions/README.md`: at 1440 the prose ends at x=874 and the viewport is 1440, so there are ~530px to its right, of which the TOC occupies 220. A 260px sidenote column fits beside it.

**When they would collide, the sidenote wins the space and the TOC yields** — the TOC is navigation a reader consults deliberately and can reopen; a sidenote is about the sentence they are reading right now.

**Anchor scrolls out of view → the note scrolls away with it.** Not stick, not fade. A sidenote is a comment on one passage; a note that outlives its passage is a note pointing at nothing, and "stick" turns the margin into a second, laggy reading column. This also makes the rule trivial to reason about: the note is positioned at its anchor's offset, full stop.

**Two anchors close enough to overlap → the later note is pushed down.** A simple top-to-bottom pass: each note is placed at `max(anchorTop, previousNoteBottom + gap)`. This is what Tufte CSS and gwern.net both do. It means a dense cluster drifts below its anchors, which is the lesser harm — the alternative is notes overlapping, where neither is readable.

**A note longer than the space available → it truncates with a "more" affordance that opens 6.5's window.** Not a scrolling margin box: a scroll region in the margin is a second scrollable thing on the page and readers do not find it. Cap at roughly 12 lines.

## 6.4 — mobile, both designed, one recommended

At 390px there is no margin, so:

- **Option A — inline collapse/expand at the anchor.** What exists today. The reader stays in place; the note appears where they are looking; the paragraph reflows.
- **Option B — footnote style.** A numbered marker at the anchor, all notes collected at the foot of the article.

**Recommendation: A.** B is the better *print* convention and the worse *screen* one — it costs a round trip away from the sentence and back, on the device where losing your place is easiest. A's one real cost is that the paragraph reflows under the reader's thumb, which is mitigated by expanding **below** the current line rather than at the tapped word.

Both will be rendered at 390 before this is settled, because the brief asks for both and because a reflow is the kind of thing that reads differently than it describes.

## 6.5 — the expansion window

The margin text is the complete note; the window holds what will not fit.

- Opens on click of the note (or its "more" affordance), **centred and focused**, over a scrim.
- **Focus-trapped while open**, returns focus to the note on close, closes on `Escape` and on scrim click — the same contract the correction card and the reading toolbar already use, so it is a third instance of one pattern rather than a new one.
- Respects `prefers-reduced-motion`: no scale-in, opacity only.
- Carries a **"Learn more"** action that asks a model for further reading.

**"Learn more" is subject to 5.6's rules, not new ones.** It is machine-generated text on a blog about epistemic honesty, so: clearly labelled in the panel itself and not in a tooltip; never styled as prose; never cached into content where it could later be mistaken for authored text. Unlike a summary it is *generated on demand* — it is a reader's action, not a property of the post — so it needs no field and no webhook, and it must never be stored as one.

**The honest risk to state now:** a model surfacing "further reading and links on the term" can produce links that do not exist. Any URL it returns must be presented as a suggestion to search for, not as a link to click, unless it can be verified — and verifying it means fetching it, which the CSP forbids from the browser. The safe version returns *titles and authors to look up*, not hyperlinks.
