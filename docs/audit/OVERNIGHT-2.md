# Overnight session 2 — report, 2026-09-09

Ten commits, `3155358` → `baf5c20`. Everything below is committed and pushed.

| Part | Output |
| --- | --- |
| 1 — ship the three code-only items | `3155358`, `8f266cb`, `1b0fb5b` |
| 2 — spec what isn't specced | `docs/audit/SPECS.md` |
| 3 — the two decisions | `docs/audit/decisions/` (README + 15 rendered screenshots) |
| 4 — fresh baseline and audit | `03fdeb8`–`baf5c20` (997 frames, 57.2MB → 29.0MB), `UI-AUDIT-2.md`, `UI-INVENTORY.md` |

---

## Judgment calls, marked so you can overrule

1. **Item 2 shipped at 9 of 60, not 28.** The premise was wrong — see below. I swapped the
   decorative icons and left the 42 typographic arrows. **Overrule by asking for the other 42.**
2. **Taxonomy pills included the series badge**, which was not named in the brief but is taxonomy
   and was at 8px. "Featured" (a status) and read time (metadata) were left as mono.
3. **Nothing from Part 2 or 3 was implemented**, per the brief — including the h1 fix, which is a
   one-line change I could have shipped. It is a decision, so it stayed a decision.
4. **The old capture baseline was deleted rather than kept alongside.** You asked for replacement;
   the old set is recoverable from git history if you want a diff against the pre-change site.

---

## Part 1 — the three code-only items

### 1. The 45 inline focus literals → `FOCUS` (`3155358`)

22 files, all 45 occurrences folded. 42 were plain double-quoted attributes converted to template
literals, 2 were already template literals, 1 was a standalone `const` string.

**Method failure worth recording.** My first attempt applied the regex file-wide and **corrupted 12
of the 22 files** — in Python `[^"]*` matches newlines, so the pattern ran past the closing quote
and swallowed whole blocks. Reverted with `git checkout` and redone per line with `[^"\n]*`.

**Verified as a true A/B**, since production still ran the pre-fold code:

- Keyboard Tab-walk on 8 routes × 2 breakpoints: amber-ring counts **identical on all 16**.
- Rendered class attributes for every element carrying the focus classes, sorted and compared string
  by string across 7 routes: **byte-identical** (24/31/47/49/30/30/31 elements).

### 2. Glyphs → lucide (`8f266cb`) — shipped at 9, not 28

**Both halves of my earlier claim were wrong.** I had written "28 glyph icons sit alongside the
lucide set that CLAUDE.md mandates." The count came from a narrow grep — there are **60** glyph
lines. And `CLAUDE.md:35` says *"Icons are lucide … never emoji"*. `→` (U+2192), `✓` (U+2713),
`▸` (U+25B8) are typographic and geometric symbols, **not emoji**. The convention does not prohibit
them.

Classified all 60:

```
 6  comment or doc string          left   ("Copy from Studio -> Site -> ...")
 2  content or data text           left   (SYN -> SYN-ACK -> ACK; a date range)
 1  keyboard hint                  left   (the arrow keys themselves)
 9  decorative icon, aria-hidden   SWAPPED
42  glyph appended to a text run   left, deliberately
```

The 42 are arrows inside a text run — "Library →", "Read more →" — mostly appended in JSX to a
CMS-driven label. Replacing them is not a refactor: an SVG in a text run changes line metrics and
needs per-site flex alignment, so it would move spacing in 42 places overnight for a convention that
does not require it.

### 3. Taxonomy → one pill (`1b0fb5b`)

Lane, category and series now use `font-sans text-xs px-3 py-1.5 rounded-full border` on the card,
the hero and the article — five sites. Measured: every taxonomy pill computes to 12px, removing 5
sub-12px instances.

### The focus-ring counts you asked for

| Spelling | Call sites |
| --- | --- |
| `FOCUS` from `lib/ui.ts` | **163**, across 51 importing files |
| `.focus-ring` in `styles/index.css:49` | **0** |

`.focus-ring` is referenced only by `CLAUDE.md` and by a comment I wrote in `lib/ui.ts`. It is dead
CSS. So this is not two competing spellings — it is one universal spelling and one unused utility
that happens to include an `outline-offset-2` the constant lacks. Your decision is therefore simpler
than I framed it: delete `.focus-ring` and the CLAUDE.md line, or adopt the offset into `FOCUS` and
change every focus ring on the site by 2px.

### e2e counts

**Every run this session reported 33 passed.** Six full runs across four commits, all 33. The
single `24 passed` came from the previous session and did not recur; nothing was skipped here.

---

## Part 2 — the five specs

Full document: `docs/audit/SPECS.md`. Headlines:

- **a. 12px floor.** 328 in source / 465 rendered, but **232 (71%) are one idea spelled 232 ways** —
  `font-mono` + `uppercase` + one of eight tracking values. Proposes a `.meta-label` utility at
  12px/0.12em, maps the rest by purpose, and **deletes rather than resizes** the 10 instances at 8px
  or below. Corrects my earlier note that `.section-label` was their home: it is a serif 16.8px
  section heading, already correct and unrelated.
- **b. Button primitive.** Four variants, three sizes, two radii replacing four, with a migration map
  from the 25+ existing padding combinations. `Label` turns out to be a CSS class, not a component.
- **c. Palette.** 58 border + 53 background tokens → **six role-named tokens**.
- **d. Type scale.** 26 sizes → 10. Argues *against* extending the 1.25 article ratio upward: 60px
  and 72px page headers are doing impact, not reading rhythm.
- **e. D5 theme scope.** A palette per theme across ground, surfaces, text, borders, links and focus
  ring — and the observation that doing (c) first turns a theme from 40 selectors into 6 overrides.

Suggested order `a → c → b → d → e`; each makes the next cheaper.

---

## Part 3 — the two decisions

Full document plus 15 rendered screenshots: `docs/audit/decisions/`. Rendered against production by
injecting CSS at runtime; no application code changed.

### The h1

**Two more of my claims were wrong.** `text-wrap: balance` is **already applied to every heading** at
`styles/index.css:21` — which is why the balance-only option is byte-identical to the baseline.
Balance is not the missing lever; width is. And `max-width` alone cannot work: the h1 sits inside a
`max-w-[36rem]` wrapper and resolves to the parent's 576px. It needs an explicit `width`.

| Option | 1440 |
| --- | --- |
| A — baseline | 48px, 576px, **4 lines**, 192px |
| B — `max-w` only | identical to A |
| **C — `lg:w-[52rem]`** | 48px, 832px, **3 lines**, 144px |
| D — C plus 40px | 40px, 832px, **2 lines**, 80px |

Tablet and mobile are untouched in C and D (gated at `lg`), no overflow. **Recommend C** — it fixes
the "Week / 2:" split without shrinking the display type, and it is one class.

### Chrome in the reading column

Four of seven reference sites keep **nothing** in the reading column; one keeps a collapsed control.

| Config | Chrome | Prose x | Width | Space to the right |
| --- | --- | --- | --- | --- |
| 1 — current | TOC list + reader menu + progress bar | 298 | 576 | 566 |
| **2 — collapsed** | "Contents" + reader-menu chip, no list, no progress bar | 298 | 576 | 566 |
| 3 — none | nothing | 266 | 640 | 534 |

**Recommend Config 2.** It is the only option that keeps every current capability — the reader menu
already lives in that row, so it needs no re-homing, which is the real cost of Config 3.

**Caveat found while rendering:** removing the TOC does *not* centre the prose. It moves from x=298
to x=266 and still leaves 534px to its right, because the centring comes from the `max-w-6xl`
container, not the sidebar. Config 3 needs a container change too, or it just shifts the imbalance.

---

## Part 4 — fresh baseline and audit

Full document: `docs/audit/UI-AUDIT-2.md`.

### Capture run

**997 frames**, 31 routes × 1440/768/390, production. Zero capture failures, zero JS errors on
any route. Compressed 57.2MB → 29.0MB and committed in four batches. The previous baseline was
deleted; it remains recoverable from git history if you want a pre-change diff.

### What is clean

Zero horizontal overflow, zero JS errors, zero images without `alt`, zero real clipping, zero
actionable contrast failures, zero non-200 routes — across 16 routes × 2 breakpoints.

### What is not

- **465 rendered sub-12px nodes**, 70% on three routes: `/services` (61), `/blog/osi-model` (61),
  `/graph` (48).
- **44 tap targets below 24×24**, identical at both breakpoints — genuinely small controls, not
  responsive collapses. WCAG 2.5.8 failures.
- **Graph node labels truncated to illegibility**: 44px boxes holding up to 421px of text.
- **Read-time meta** is 9px mono beside the new 12px pill.

### And a warning about my own numbers

**Two of four defect metrics were ~95% false on the first pass.** Contrast read 322 because I
treated a semi-transparent `rgba(255,255,255,0.02)` overlay as an opaque background instead of
compositing alpha — the real ratio is ~13:1, and the true count is 4 (all one decorative
`aria-hidden` separator). Clipping read 105 because I counted `sr-only` labels and every
`.truncate` element; the true count is 0. Corrected before publishing. That is the 11th and 12th
measurement artifact on this project.

### What the captures do not cover

`h4`, `blockquote`, `figure` and 11 other article sections **render for no published post** — 6 of
20 sections render for the home-lab post, 6 for The Field, 7 for the portfolio post. Those frames
are an absence, not a passing state, and the typography shipped for them in `5c7cca4` has never been
seen on a page.

---

## Still outstanding on your side

- `/paths` and `/review` in Studio — **now moot.** `referenceLinks` had exactly one consumer and it
  was deleted with the directory panel in `c5fc828`. Those entries are inert data with no reader.
- The `test` page document (`/test` is public, in the sitemap, crawlable).
- Section breaks into a post — the `subtle` variant is now the 96px centred rule and is ready.
- The two decisions above.
- The `.focus-ring` question, now a one-line call.
