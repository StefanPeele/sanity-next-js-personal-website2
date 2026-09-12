# Accessibility audit — Phase 10

Run 2026-09-12 against a clean local build of `de6a46e`+, on the eight routes below, at
1440 / 640 / 320 CSS px. Harness: `docs/audit/measure-a11y.mjs`. Raw numbers:
`docs/audit/a11y.json`.

**What this covers that the suite does not.** `tests/smoke.spec.ts` already runs axe on `/`,
`/blog`, `/services` and the first post, at critical/serious, under `prefers-reduced-motion`.
This audit deliberately went elsewhere: focus **visibility** (axe cannot see a ring), touch
target **size** (WCAG 2.5.8 is 2.2 and is not in the tags the suite uses), heading order on
every route, composited contrast, zoom to 200% and 400%, and the interactive surfaces axe
never opens.

**Started with 8 findings. Ended with 1, and that one is content.** Six were fixed in this
pass; one was a false positive produced by this audit's own code, which is recorded below
rather than quietly deleted.

---

## The one finding still open

### The published article's section headings are `<h5>`

`/blog/the-field-…` renders:

```
h1  The Field, The Moment, and What it Means for Us
h5  The First Transmission
h5  Laying The Foundation
h5  What The Numbers Actually Say
h5  Where $725 Billion Is Going
h5  Why The Pipeline Can't Keep Up
h5  The Part Nobody Else Can Write
h5  Test Yourself
h2  Responses
h2  Contents
```

Two problems, and the second is worse than the first.

**The skip.** `h1 → h5` means a screen-reader user navigating by heading level is told this
article has no second-, third- or fourth-level sections at all. They are there; they are
just labelled as if they were four levels deep in a hierarchy that does not exist.

**The inversion.** The article's own sections are `h5` while the machinery around it —
"Responses", "Contents" — is `h2`. The apparatus outranks the piece. Read as an outline, the
comment form is a more important part of this page than "What The Numbers Actually Say".

This is **content, not code**: the author chose "Heading 5" in the Studio. The renderer is
doing exactly what it was told.

**`scripts/migrate-heading-levels.mjs`** fixes it, dry-run by default. It maps distinct
*levels* rather than positions — seven headings an author gave the same level are seven
siblings, and all seven become `h2`, preserving hierarchy where an author used one. A post
that already uses h2/h3 correctly is left untouched, which is what makes it safe to run over
everything. Fixtures are excluded; `fixture-kitchen-sink`'s body `h1` exists to prove the
renderer converts it.

**It has not been applied, and that is deliberate.** An `h5` renders at 19/20px and an `h2`
at 32/38px, so this changes how a published article *looks*, not only how it is marked up.
That is a call about Stefan's writing, not a defect fix. If the h2 reads as too loud
afterwards, the answer is the h2 **style** in `components/CustomPortableText.tsx`, not the
level.

---

## Fixed in this pass

### 1. The reader menu did nothing on `/blog` — including every accessibility toggle

**The most serious finding in the audit, and it was invisible.**

Phase 5.1 put the reading toolbar on the blog index as well as on articles. But
`styles/article.css` is imported *only* by the article page, so on `/blog`:

| | `/blog` before | article |
| --- | --- | --- |
| The trigger | **18×18, `inline-block`, at x=0, y=2985** — in normal flow, near the bottom of the page | 44×44, fixed, at 1376,478 |
| Selecting the light theme | root gets `theme-paper`, background stays `rgb(10,10,10)` | background `rgb(244,241,234)` |
| High contrast | `--surface` stays `#0a0a0a` | `--surface: #000` |

So the menu on the index offered Theme, Text size, Width, Density **and the accessibility
toggles** — high contrast, the dyslexia font, the reading ruler, the larger focus ring — and
every one of them set a class that nothing implemented. A reader who turned on high contrast
got nothing, and nothing looked broken.

Axe never caught it because an 18px button with an accessible name is valid HTML.

**Fixed** by splitting `styles/reader.css` out of `styles/article.css`: themes, accessibility
modes and the toolbar are not article-only, and are now imported by both surfaces. Article-
only rules — the measure, the prose, sidenotes, corrections, print — stayed behind.

Importing `article.css` into the index instead would not have worked: it carries the 7.2
width system, whose `main#content > :not([data-article])` rule would have collapsed the
directory grid from 1280px to 832px. Verified after the split: the grid is still 1280.

The cascade is guarded by the three harnesses that exist for exactly this — **87 assertions,
all passing**: `measure-themes.mjs` (15), `measure-toolbar.mjs` (50),
`measure-reading-controls.mjs` (22).

### 2. Touch targets under 24×24 — six links and one label

WCAG 2.5.8 (AA) requires 24×24. These were all 20px tall, being `text-sm` at its natural
line height:

| Where | What |
| --- | --- |
| `/` | "All projects →", "All posts →" |
| `/garden`, `/library` | the footer nav row — "Blog", "Knowledge graph", "Learning paths" |
| `/glossary` | "← Blog" |
| `/resume` | the email and GitHub links — the two things a recruiter taps |
| the comment form | "Post without my name" |

**Fixed** with `py-1` on `QUIET_LINK` and at the four remaining call sites. Vertical padding
on an *inline* element grows the hit area without affecting the line box, so the target
becomes 28px and **nothing moves** — confirmed at 1440, 768 and 390.

WCAG exempts a link inline in a sentence, because its size follows the text around it. None
of these are that: they stand alone at the end of a row.

---

## The false positive, recorded rather than deleted

The audit reported the comment form's anonymity checkbox as a 16×16 failure. It is not: the
checkbox is wrapped in a `<label>`, and **the label is the activation target** — verified by
clicking 120px away from the box and watching it toggle. The harness was measuring the wrong
element.

The first attempt to verify *that* was also wrong, in a more interesting way: it clicked at
page coordinates ~14,000px down a 1,000px viewport and concluded the label was not clickable.
`elementFromPoint` and mouse events are **viewport** coordinates. Scroll first.

The exemption is now in the harness, with both mistakes written beside it.

There *was* a real finding underneath: the label itself was 832×**20**, so the target failed
on height. Fixed with the same `py-1`.

---

## Passing, measured rather than assumed

| Area | Result |
| --- | --- |
| **One `<h1>` per page** | 8 of 8 routes |
| **Heading order** | 7 of 8 routes have no skipped levels; the 8th is the content finding above |
| **Landmarks** | one `<main>` on every route; `#content` present on every route, so the skip link always lands |
| **Contrast** | **0 failures across every visible text node on all 8 routes**, composited through every ancestor's alpha to the page ground |
| **Focus visibility** | 89 elements reached by real `Tab` across `/blog` and an article — **every one shows a ring**. Settled 350ms before reading, because a transitioned ring reads as a different colour if sampled early |
| **Zoom** | 200% and 400%: no horizontal scroll, no unreachable controls, on both the index and an article |
| **Touch targets, AAA** | 22–29 elements per route are under 44×44. That is WCAG 2.5.5 **AAA** and is not a failure at AA; recorded because the brief asked for both numbers |

---

## Not covered by this pass, and why

**A real screen reader.** Everything here reasons from the accessibility tree and the DOM.
The tree is not the experience — the highest-risk claim in this brief is that the toolbar and
the sidenotes are usable non-visually, and neither has been driven with NVDA or VoiceOver.
That is the single largest remaining gap in Phase 10 and it needs a person, not a harness.

**The comment thread at volume.** The audit ran with an empty thread. A long conversation
adds a large number of headings and controls; the heading order and focus order at 50 comments
have not been measured.

**The margin column.** `.margin-notes` is `aria-hidden` by design — it is a second visual
presentation of note text already in the prose — and the audit asserts nothing focusable is
inside it (verified in Phase 8.4). What it does not establish is whether a screen-reader user
*reaches the note text in the prose* at a sensible point. That is the same gap as the first
item: it needs a real screen reader.
