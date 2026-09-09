# UI and feature inventory — stefanpeele.com (2026-09-08)


> **Status — re-measured 2026-09-09 against `e880405`.** This document now describes the site as
> shipped, not the pre-change site. Everything below reflects: the 19px prose default and the
> typography block, the `FOCUS` extraction and the fold of all 45 inline literals, the removal of
> the Topics / Explore / At a glance panel, the 9 glyph-to-lucide swaps, and taxonomy rendering as
> one pill. Defect measurements live in `UI-AUDIT-2.md`; implementation specs in `SPECS.md`.

Built from static analysis of `components/` and `app/`, plus the production capture run in
`docs/audit/screenshots/site-inventory/`. Counts are from `grep -r` over `*.tsx` and are
reproducible; where a count contradicts observed behaviour, re-measure before acting on it.

**Scale:** 64 components — 20 top-level, 22 `blog/`, 5 `article/`, 3 `services/`.

---

## The headline numbers

| Dimension | Distinct values in use | Comment |
| --- | --- | --- |
| Type sizes | **26** | 6 of them are the shipped article scale; no site-wide scale. See §2. |
| Sub-12px in source | **328** | `9px` ×137, `10px` ×109, `8px` ×60, `11px` ×15, `7px` ×7 |
| Sub-12px **rendered** | **465** | across 16 routes × 2 breakpoints; 70% on 3 routes |
| Border colour tokens | **58** | Top 3 cover 224 of ~400 uses; the tail is 50+ one-offs |
| Background fill tokens | **53** | Near-black alone is spelled three ways |
| Mono + uppercase class strings | **172** | One visual idea, 172 spellings |
| Letter-spacing values | **8** | `tracking-wide` ×163 plus 7 bracketed variants |
| Button padding combinations | **25+** | No button primitive exists |
| `const FOCUS` re-declarations | **0** | Was 29. Now one export in `lib/ui.ts`, 51 importers, **163 call sites** |
| `.focus-ring` usages | **0** | Dead CSS in `styles/index.css:49`; includes an `outline-offset-2` the constant lacks |
| Border-radius tokens | **9** | `rounded-sm` ×127, `rounded-full` ×77, `rounded-lg` ×55, `rounded-xl` ×53 |

The pattern across every row: the site has a consistent *visual intent* and no *shared
primitives*. Each component re-implements the intent from memory, so drift is silent and
compounding.

---

## 1. Navigation

**Components:** `Navbar`, `Header`, `Footer`, `SearchModal` (trigger lives in Navbar).

| Element | Where | States | Consistency |
| --- | --- | --- | --- |
| Primary nav links | Both shells | default, hover, active (bold white), focus-visible | Consistent |
| Logo "S.P." | Navbar | default, hover | Consistent |
| Mobile hamburger | < lg | closed, open | Consistent |
| Search trigger | Navbar | default, hover, focus, open | **Defect — see §10 D7** |
| Footer "Pages" grid | Footer | default, hover | Consistent |
| Back link ("← Writing") | Article header | default, hover, focus | **Collides with the logo at 390** — sits directly under it, reads as nav chrome rather than article chrome |

**Glyphs, re-counted 2026-09-09.** The earlier "28 glyph arrows … that CLAUDE.md mandates" was
wrong twice: the count came from a narrow grep (there are 60 glyph lines), and CLAUDE.md says
"never emoji" — none of these are emoji. Current split: 6 comments, 2 content strings, 1 keyboard
hint, **9 decorative icons swapped to lucide in `8f266cb`**, and 42 typographic arrows inside text
runs, deliberately left. See that commit for the reasoning.

---

## 2. Typography

**22 distinct type sizes.** Named Tailwind steps (`text-sm` ×163, `text-xs` ×74, `text-base` ×39,
`text-lg` ×28 … `text-7xl` ×5) mixed with 10 bracketed one-offs (`text-[17px]`, `text-[15px]`,
`text-[13px]`, `text-[2rem]`, `text-[1.6rem]`, `text-[12px]`).

Measured article scale at 1440, **as shipped in `5c7cca4`**: h1 48 / h2 38 / h3 30 / h4 24 /
body 19 — a single **1.25** ratio. Line-height 1.70, paragraph gap 1.5em, `hyphens: auto`, 65
characters per line. The site-wide scale outside the article is still 26 sizes; spec in `SPECS.md` §d.

**The sub-12px problem is the single largest consistency defect on the site.** 339 instances, and
the distribution matters: 62 at 8px and 7 at 7px are below the threshold at which the stone palette
is legible at all on `#0a0a0a`. Worst offenders by file:

```
GardenClient.tsx        27    LearningBlocks.tsx      24
KnowledgeGraph.tsx      20    ServicePackages.tsx     19
SearchModal.tsx         19    MediaCard.tsx           14
LibraryClient.tsx       14    CredibilitySection.tsx  13
BlogDirectory.tsx       12    PacketAnimator.tsx       9
```

**Corrected 2026-09-08.** An earlier version of this table listed only `components/blog` and
concluded the drift was concentrated in learning-block components no reader has seen. That is true
of the 114-instance blog subset and false of the 339-instance site total: `GardenClient`,
`KnowledgeGraph`, `SearchModal`, `ServicePackages`, `MediaCard` and `LibraryClient` all render.

**Mono label system:** 172 distinct `font-mono … uppercase …` class strings expressing one idea,
across 8 letter-spacing values (`tracking-[0.3em]` ×54, `[0.4em]` ×14, `[0.2em]` ×15, `[0.35em]`,
`[0.25em]`, `[0.15em]`, `[0.5em]`). `.section-label` exists in `styles/index.css` and is correct;
almost nothing uses it.

**Fonts:** Lora (serif), Inter (sans), IBM Plex Mono (mono), Lexend (dyslexia, `preload: false`).
Verified on production: 6 font files requested on an article; Lexend is `unloaded` and only fetches
when a reader enables the toggle. Working as designed.

---

## 3. Cards

| Card | Where | States |
| --- | --- | --- |
| Featured post card | `/blog` | default, hover (image scale 700ms, grayscale 70%) , focus |
| Post card | `/blog` grid | default, hover, focus, read/unread |
| `PostCardSkeleton` | loading | shimmer (`animate-pulse`) |
| `EmptyThumbnail` | missing image | static |
| Series card | series rail | default, hover |
| Project card | `/projects` | default, hover |
| Photography album card | `/photography` | default, hover |
| Reading-strip item | `/blog` | default + `role="progressbar"` |
| Note card | `/blog` notes strip, `/garden` | default, hover |

**Inconsistencies:**
- ~~Category taxonomy is rendered two different ways for the same data.~~ **Fixed `1b0fb5b`** —
  lane, category and series all use one pill (`font-sans text-xs px-3 py-1.5 rounded-full border`)
  on the card, the hero and the article. Read time is still 9px mono beside a 12px pill.
- Card borders drift across `border-white/5`, `/10`, `/15`, `/[0.08]`, `/20`, `/30` with no rule
  distinguishing them.
- The featured card stacks three badges (`FEATURED`, `NETWORK & INFRASTRUCTURE`, `PERSPECTIVE`).
- Two cards render into a three-column grid, leaving the right third empty.

---

## 4. Forms and inputs

**Components:** `NewsletterForm`, `BookingSection`, `AskArticle`, contact form, `SearchModal` input.

| Form | States present |
| --- | --- |
| Newsletter | idle, focus, filled, submitting, success, error, honeypot |
| Booking (`/services`) | idle, per-field validation, submitting, success, error |
| Ask this article | idle, submitting, answer, error |
| Search | empty, typing, results, no-results, recent |

Server actions follow the documented pattern — zod, honeypot, `rateLimit`, `{ status, message }`
returns. This is the most consistent subsystem on the site.

**Inconsistency:** input chrome is re-declared per form rather than shared; border and focus
treatment drift between the newsletter and booking forms.

---

## 5. Buttons

No button primitive exists. **25+ distinct padding combinations** (`px-4 py-3` ×14, `px-3 py-1.5`
×14, `px-3 py-2` ×10, `px-2 py-1` ×8, `px-5 py-3` ×7 …), each paired with an ad-hoc border, radius
and colour.

Radius is split four ways: `rounded-sm` ×127, `rounded-full` ×77, `rounded-lg` ×55, `rounded-xl` ×53.

**Tap targets:** only two explicit `min-h-[24px]` declarations exist site-wide. Everything else
relies on padding, which is why the earlier audit found controls under 24×24.

**Focus:** `const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'`
is declared **30 times**, 29 of them byte-identical. It is never exported from a shared module.
This is the clearest single candidate for extraction on the site.

---

## 6. Overlays and sheets

| Overlay | Trigger | Backdrop | Entrance |
| --- | --- | --- | --- |
| Search modal | Navbar / ⌘K | `bg-black/70 backdrop-blur-sm` | framer-motion |
| Reader menu (desktop) | TOC chip | n/a (dropdown) | scale from top-right, 180ms (`5c7cca4`) |
| Reader menu (mobile sheet) | TOC chip | `bg-black/40` — added `5c7cca4` | rises from bottom edge, 180ms |
| Mobile nav | hamburger | yes | yes |
| Lightbox | `CinematicGallery` | yes | yes |

**Inconsistency:** the search modal has a scrim and an animated entrance; the reader menu has
neither, on either breakpoint. The reader-menu panel is also clipped mid-glyph at its bottom edge
(`max-h-[70vh]` + `overflow-y-auto`, no fade or scroll affordance), and at 1440 the TOC's
right-aligned minute labels remain visible beside it.

---

## 7. Feedback and empty states

26 `emptyState` references across defaults and components. Copy is centralised in
`lib/cms/defaults/*` per the project convention — correct.

**Inconsistency:** empty states are inconsistently *reachable*. `/glossary`, `/library` and
`/garden` return 200 with little or no content, and `/blog` advertises "0 series" as a statistic
rather than hiding the row. Displaying a zero is worse than omitting it.

Toast feedback is `sonner`, mounted once in the root layout — consistent.

---

## 8. Reading tools

**Components:** `ArticleProvider`, `ArticleToc` (sidebar + mobile `<details>`), `ReaderMenu`,
`ReadingProgressBar`, `HeadingAnchor`, plus in-body learning blocks.

`ReaderMenu` offers theme (Dark/Green), text size (S/M/L/XL), width (Narrow/Standard/Wide),
four accessibility toggles, reset, share/export, read-aloud, and position — 22 controls, all
verified functional.

**Defects:**
- **Text size defaults to S, not M** — `ArticleProvider.tsx:98`, `Number(null) === 0`. See §10.
- **Themes are scoped to `<article data-article>`**, so `theme-green` and `a11y-high-contrast`
  render as a hard-edged rectangle while the TOC beside them stays in the default theme.
- The article page defines 20 top-level sections; **13-14 do not render for any published post**
  (measured 2026-09-08: 6, 6 and 7 render across the three posts).
- Per-section TOC estimates sum to 5 min on a post whose header reads "3 min read".

---

## 9. Motion

Site-wide census over `components/` and `app/`:

```
134  transition-colors      14  duration-300       4  animate-spin
 46  transition-all         13  duration-500       3  transition-opacity
 18  transition-transform    9  duration-200       2  duration-150
                             8  duration-700
  3  motion-safe:*  ← total
```

219 transition/animation declarations; **3 carry a `motion-safe:` gate.** 16 files import
framer-motion.

**Correction to my earlier reporting:** I initially recorded this as an accessibility defect. It is
not. `styles/index.css:54` contains a complete `@media (prefers-reduced-motion: reduce)` block
zeroing `animation-duration` and `transition-duration` on `*`, and `styles/article.css:203` mirrors
it for the in-app toggle via `html.sp-reduced-motion`. Reduced motion is handled correctly at both
layers. My first reading truncated the media query at its first `}` — the same `sed`-range error
that produced the "Also open" artifact. The `motion-safe:` convention in `CLAUDE.md` is
belt-and-braces, and the gap is a style-guide inconsistency, not an a11y bug.

**The real motion finding is absence, not gating.** 61% of all motion on the site is a colour fade
on hover. There is no scroll-linked motion, no entrance choreography, no stagger, and no continuity
between states or routes. `lib/motion.ts` (`EASE`, `DURATION`, `STAGGER`, `fadeUp`,
`staggerChildren`) is imported by no blog or article component that renders.

`transition-all` ×46 is a separate, smaller problem: it animates layout properties and is a sign
the transitions were not chosen deliberately.

---

## 10. Cross-cutting defects

| # | Defect | Location | Status |
| --- | --- | --- | --- |
| D1 | `Number(null) === 0` → every new reader got 15px, measure 80 chars, and the text visibly reflowed smaller after hydration | `ArticleProvider.tsx:98` | **Fixed `83a4b72`** — now 19px at 65 chars, no reflow |
| D2 | `/paths` and `/review` 404 but are still linked | published `blogPage` doc, **not** the code defaults | Confirmed |
| D4 | h1 constrained to the 36rem body measure; wraps to 4 lines, splits "Week / 2:" | `BlogArticleHeader.tsx:71` | Confirmed |
| D5 | Theme class applied to `[data-article]` only | `ArticleProvider.tsx:257` | Confirmed |
| D7 | Search button auto-focused on mount → amber ring above the fold, and the skip link bypassed | `SearchModal.tsx:97` | **Fixed `f78e1b7`** — verified on production: `activeElement` is `BODY`, skip link is the first Tab stop |
| D8 | `/test` is publicly reachable and returns 200 | `app/test/` | New |
| D9 | Multi-line inline code renders as ragged stacked boxes | `CustomPortableText.tsx` + content | Confirmed |

**Withdrawn after verification:** the "three disagreeing post counts" (there are exactly 3 `post`
documents; `osi-model` is a hand-built route, and the two figures correctly mean *total* and *grid
excluding featured*), and "Lexend still loaded" (measured `unloaded`).

---

## 11. Features the site has that most personal sites don't

Worth stating, because the inventory above is mostly critical: knowledge graph (`/graph`, D3),
per-article Anki deck export, reading progress + bookmark restore, offline article caching via
`public/sw.js`, full-text search with grouped results, dyslexia and high-contrast reading modes,
JSON Feed + RSS, webmention scaffolding, glossary hover cards, and a Studio-editable copy layer
covering essentially every string on the site.

The accessibility work in particular is better than most commercial sites: the high-contrast mode
is genuinely well-executed, reduced motion is handled at both the OS and app layer, and the skip
link exists — though D7 currently defeats it.
