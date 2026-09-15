# Two proposals, written before building, as asked

Both were decided in principle and both said "propose the shape first". Neither is built.

---

# 1. `/blog/featured` — a browsable archive of what I have highlighted

> **DECIDED AND SHIPPED: option B.** Stefan took `featuredAt` + `featuredNote`, replacing
> the boolean. The note is required whenever `featuredAt` is set, the same discipline the
> digest applies to its entries.
>
> Migrated: the one flagged post carries `featuredAt` = its `publishedAt`, because inventing
> "now" would stamp today on a decision made in May. **It has no note yet, deliberately** —
> a migration that wrote one would put words in his mouth on the one page whose entire value
> is that the words are his. The Studio flags it until he writes it.
>
> `isFeatured` is gone from the schema and unset on every document.

**The decision that has to come first, and it is not about the route.**

`isFeatured` is a boolean today, and the schema says "only one post should be featured at a
time". The index takes the newest post carrying it and makes that the hero. So right now
"every post I have flagged" means "the post that is flagged", and the moment you feature
something else, the previous one leaves the archive as if it had never been there.

A curated highlight with history needs to record **when**, not just **whether**.

## Three shapes

| | What it is | History | Cost |
| --- | --- | --- | --- |
| **A** | Keep the boolean. `/blog/featured` lists everything with `isFeatured == true` | **None.** Unflagging erases it. With "one at a time", the archive has one entry | Nothing to build but the page |
| **B** | Add `featuredAt` (datetime) and `featuredNote` (text). Newest `featuredAt` is the hero | **Real.** Featuring something new does not erase what came before | One field pair, one migration line |
| **C** | A `featureRun` document: post reference, start, end, reason | Full, including how long each ran | A second document type to maintain for a personal blog |

## Recommendation: B

A is not an archive, it is a filter that happens to have one row in it. C is the right answer
for a publication with an editor and a rota, and this is not that yet.

B is one field pair and it makes the archive true:

```
featuredAt    datetime   when you featured it. Its presence IS "featured".
featuredNote  text       one or two sentences: why this one, now.
```

`featuredAt` replaces `isFeatured` the same way `sentAt` replaced a status enum on the
digest, and for the same reason: one field cannot disagree with itself.

**`featuredNote` is the part that makes the page worth visiting.** A list of posts you
already have an index for is not a reason to build a route. A list of posts each carrying a
line about why it mattered at the time is a record of editorial judgement, and it is the
single cheapest thing on this site that would make it read as a publication with a beat
rather than a blog with a flag.

**The trade B does not cover, stated plainly:** a post featured twice keeps only the later
date. That is C's problem to solve, and it is not worth a document type until it happens.

## The route

```
/blog/featured
  h1            Featured
  lede          Why these, and when. One or two sentences from the Studio.
  <list>        newest featuredAt first
                  date      14px mono, the meta floor
                  title     24px w600, the card treatment from 2.6
                  note      the why, in prose
```

No cards, no cover images, no filters. The note is the content here and an image grid would
bury it. `/blog` gets "All featured →" beside the FEATURED section label, using the same
quiet-link treatment as the series rail.

**Migration:** the one post currently flagged gets `featuredAt` set to its `publishedAt`.
`isFeatured` stays in the schema for one release, reading as deprecated, then goes.

---

# 2. The first-visit tour

> **DECIDED AND SHIPPED**, copy as drafted with two lines made plainer.
>
> **ONE DEVIATION FROM THIS PROPOSAL, and it is a correction.** I proposed gating the tour
> behind a pointer-capable check so a screen-reader user would not be walked through a
> visual highlight sequence. That was the wrong fix: it excludes people from the explanation
> instead of making the explanation work for them. The tour now runs for everyone, and the
> requirement it turned into is that **every sentence stands on its own without naming a
> position on screen** — enforced in the Studio field description, since the copy is
> editable. The highlight is decoration on top of text that works without it.
>
> `docs/audit/measure-tour.mjs` drives all of it: **19/19**, including the two requirements
> a code review cannot check. Clearing the cookie mid-visit does not resurrect it, and
> Escape counts as done rather than "ask again".

## The trigger is the part most tours get wrong

Showing a tour the second someone arrives asks them to learn the furniture of a room they
have not decided to sit in. It also lands before the thing it describes is on screen.

**Show it on the first ARTICLE view, once the reader has committed.** Whichever comes first:
they have scrolled past 25% of the article, or they have been on the page 20 seconds. Never
on the index, never on a route with no toolbar, and never twice.

## Shape: a quiet bar first, the tour only if they say yes

| | Option | Why not |
| --- | --- | --- |
| A | A modal tour that opens by itself | It interrupts reading to explain reading. The most disliked pattern on the web, and it fails "declining must be as easy as accepting" the moment it steals focus |
| B | A dismissible bar offering the tour, which runs only on yes | — |
| C | Coach marks on every element at once | Five simultaneous callouts over an article is noise, and there is nowhere to look first |

**Recommendation: B, then coach marks.** One line at the bottom of the viewport, two buttons
of equal weight. If they accept, the tour highlights each element in turn. If they decline,
it never appears again and nothing else is shown.

```
┌──────────────────────────────────────────────────────────────┐
│  This page has a few reading tools most sites do not.        │
│  Want a quick look?            [ No thanks ]  [ Show me ]    │
└──────────────────────────────────────────────────────────────┘
```

Both buttons dismiss permanently. **"No thanks" is not "ask me later"**, and the bar has no
close X, because an X that means something different from the decline button is how a reader
ends up seeing it twice.

## The five steps, in the order a reader meets them

1. **The reading toolbar.** "Text size, width, spacing and theme all live here, and whatever you pick is remembered for next time."
2. **The Contents column.** "Every section, with how long each one takes. It tracks where you are as you read."
3. **Status marks.** "A mark on a post says whether it has been peer reviewed, fact checked, or is still open to comment. It is a claim about the writing, not decoration."
4. **Sidenotes.** "A dotted underline has a note attached in the margin. Definitions come from the glossary, the rest are mine."
5. **Corrections.** "When something turns out to be wrong it gets marked in place, with credit to whoever caught it. Nothing is quietly edited."

Five is the ceiling. Step 5 is the one that explains the site's whole argument, so if it ever
needs to be four, cut 2.

## The requirements, and how each is met

| Requirement | How |
| --- | --- |
| Cookie-gated, shown once | A cookie records the decision. Accepting and declining write the same cookie, because both are final |
| Never twice even if the cookie is cleared mid-visit | The cookie alone cannot do this. A `sessionStorage` flag is set at the same time, and either one suppresses the bar. Clearing cookies mid-session then hits the session flag |
| Declining as easy as accepting | Two buttons, same size, same row, neither styled as the primary. No X |
| Never nags | There is no "later" state to return from. One decision, stored, done |
| Keyboard accessible | The bar is a `role="region"` with a label, reachable by Tab. The tour is a `role="dialog"` with `aria-modal` |
| Focus-trapped | Focus moves into the tour on open and is trapped until it ends. Escape ends it and counts as DONE, not as "ask again" |
| `prefers-reduced-motion` | No movement and no fades. Highlights appear instantly, and the bar has no slide-in |

**Two things I would add that were not asked for, because leaving them out would be a defect:**

- **A permanent way back in.** If a tour is worth showing once it is worth finding again, so
  the reader menu gets one entry at the bottom: "Show the reading tips". Without it the tour
  is a thing you get one chance at, which punishes the reader who declined while busy.
- **It must not run for a screen-reader user as a visual highlight sequence.** The coach
  marks describe where things are on screen, which is meaningless non-visually. The tour is
  gated behind a pointer-capable, non-reduced-motion check, and the same five sentences are
  available as plain text from the reader menu entry above.

## What I would not build

Progress dots, a step counter, a "skip tour" link separate from declining, or any second
appearance after an update. A tour that returns to announce a new feature is a newsletter
nobody subscribed to.

---

# 3. The reading toolbar covers the prose at 1024, and Phase 5.4 says it never does

> **DECIDED 2026-09-15: option D.** Stefan: "I use the toolbar before reading, not during, so
> the overlap costs me nothing." The 5.4 claim is corrected in `ReadingToolbar.tsx`,
> `styles/reader.css` and the brief to what is actually true: the RAIL never overlaps prose at
> any width; the OPEN PANEL clears it from 1280 up and covers the last 106px of every line at
> 1024, behind a scrim, for as long as the panel is open.
>
> **Option C is logged as the fallback**, with its risk stated where someone would reach for
> it: a transform on an ancestor of the prose makes that element a containing block for every
> `position: fixed` descendant, which is the trap that silently un-stuck this project's own
> reading rail once. The trigger for revisiting it is Stefan's habit changing -- using the
> panel WHILE reading rather than before.

**Asked for as a proposal, not a build, 2026-09-14.** Measured by
`docs/audit/measure-toolbar-legibility.mjs`, which reports it as a NOTE rather than asserting
it, so that widening an assertion cannot quietly bury it.

## The measurement

At 1024x900, with an article open and the panel open:

| | x range | width |
| --- | --- | --- |
| The prose | ends at **714** | measure is ~600px of a 708px column |
| The open panel | **608 to 928** | 320px (`lg:w-80`) |
| The rail behind it | 928 to ~984 | ~56px |

**The panel covers the last 106px of every line.** The margin to the right of the text at
1024 is about 310px; the rail takes 56 of it; the panel is 320. It has never fitted. At 1280
and up there is over 500px of margin and the same panel clears the text with room to spare,
which is the case Phase 5.4 was measured in.

This is pre-existing. The 2026-09-14 legibility pass widened the panel only at `xl` and
above, specifically to avoid making this worse.

## Why it has gone unnoticed

The panel opens over a scrim and closes on the next click outside it, so the overlap lasts
exactly as long as a reader is changing a setting. Nobody reads and adjusts at the same time.
The cost is real but it is small and brief, which is worth saying plainly before proposing to
spend anything on it.

## Option A: keep the bottom sheet until xl

Move the breakpoint at which the panel stops being a bottom sheet from `lg` (1024) to `xl`
(1280). Between 1024 and 1279 a reader gets the same bottom sheet as a phone.

**What it costs.**

- The sheet is `inset-x-4 bottom-4 max-h-[75vh]`. At 1024 that is a 992px-wide panel holding
  controls designed for a 320px column, so every group becomes a very short row in a very
  wide box. It would need a two- or three-column layout at that width to not look broken,
  which is new layout rather than a moved breakpoint.
- A sheet covers the BOTTOM of the viewport, including the prose behind it. It trades
  106px of horizontal overlap for roughly 500px of vertical overlap. Whether that is better
  is genuinely arguable; it is not obviously better.
- `docs/audit/measure-toolbar.mjs` asserts the lg dropdown's geometry in several of its 50
  checks, and `.reader-menu-anchor` is `display: contents` below lg in CSS. Both move.
- Tablet landscape is a real reading width for this site. It would be the only width where
  the toolbar behaves like a phone while the article behaves like a desktop.

**What it buys:** the 5.4 claim becomes true at every width.

## Option B: narrow the panel at lg only

`lg:w-64` (256px) clears the prose by exactly 2px at 1024. It also puts the text-size chips
(seven of them) and the spacing rows into a column narrower than they were designed for, so
they wrap. Chips wrapping mid-row is the thing the legibility pass just measured away. **Not
recommended, and listed because it is the obvious idea and it does not survive contact with
the numbers.**

## Option C, the third option: let the panel push the column instead of covering it

At lg only, when the panel is open, shift the article column left by the overlap. One class
toggled on `[data-article-root]`, a transform of about -110px with a transition, reverted on
close.

**Why this is worth considering.** The reader keeps every line of text AND the panel; nothing
is hidden by anything. It is also the honest reading of what a settings panel is for: the
reader is adjusting the text, so the text moving in response is feedback rather than
disruption.

**What it costs.** A transform on an ancestor of the prose makes that element a containing
block for `position: fixed` descendants -- the exact trap that cost this project the reading
rail once already and is documented at length in `ReadingToolbar.tsx`. The rail is portalled
to `<body>` so it is out of reach, but sidenotes, the progress bar and the TOC would all need
checking. It also has to be gated behind `motion-safe:`, and the reduced-motion path then
needs an answer that is not "move it instantly", which is worse than not moving it.

## Option D: do nothing, and say so in the record

Change Phase 5.4's claim from "can never overlap prose" to what is actually true: "clears the
prose from 1280 up; at 1024 the panel covers the last ~100px of the measure while open,
behind a scrim". The harness already reports the number on every run.

**What it costs:** nothing, and a slightly less impressive sentence in the design record.

## Recommendation

**D now, C if it ever becomes annoying in use.**

The overlap exists only while a panel is open that a reader opens for a few seconds every few
articles, and every option that removes it spends more than it saves: A trades a small
horizontal overlap for a large vertical one plus a new layout, B undoes a legibility fix, and
C touches the one CSS property this codebase has already been bitten by. What the situation
actually deserves is an accurate claim rather than an inaccurate one plus a fix.

The one thing that would change this: if you find at tablet width that you use the panel
while reading rather than before reading. That is a question about your own habit, which is
why it is the check I asked you to make yourself.
