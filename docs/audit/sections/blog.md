# SECTION: `/blog` and `/blog/[slug]`

> **Status — 2026-09-08.** Every prose measurement in this document is historical. The article was
> 15px at 80 characters when this was written; it is now 19px at 65 (`83a4b72`, `5c7cca4`), with a
> single 1.25 type scale, line-height 1.70 and no rule under h2. D1 and D7 are fixed. The
> "12 of 20 sections don't render" figure that circulated from this pass is wrong — measured, 6, 6
> and 7 of 20 render across the three published posts.

Deep diagnosis pass, 2026-09-07. **No code was changed.** Everything below is measured, driven, or
read from an image — where a claim is inferred rather than observed, it says so.

Scope: `/blog`, `/blog/[slug]`, `components/blog/`, `components/article/`, the `blogPage` and
`articleUi` singletons. Goals: **G1 directly**, G3 indirectly.

Article measured throughout: `building-my-physical-home-lab-week-2-documentation-and-extensive-researching`.

---

## Three corrections before the findings

**1. The premise "23.6% of text is under 12px and the article page is the worst case" is wrong for this page.**

Measured on the rendered article at 390: **100 text-bearing elements, 12 under 12px** — and ten of
those twelve are global chrome (`⌘K`, `Search`, `Skip to content`, the newsletter hint). Only two
are article content: the `Homelab` tag (9px) and the date (10px). The blog index is the same, 12 of
its own.

The sub-12px problem is real but it lives on `/services` and `/photography`, which I measured in the
inventory — not here.

**2. But the mono-label problem is worse than the inventory said — it's just dormant.**

`components/blog/` contains **43 distinct (size × tracking × colour × weight) label permutations
across 74 call sites**, and 26 badge treatments. The site-wide inventory reported "~44 permutations"
for the *whole site*; almost all of it is this one directory. It doesn't show up in the rendered
measurement because **the components carrying those labels don't render for these posts** (see §1c).
It is a latent defect that becomes visible the moment a post uses the learning blocks.

**3. My "16 dead Studio fields" figure was an undercount, and the method was unsound.**

The inventory found dead fields by grepping each leaf key name. That fails on generic names —
`lede` and `emptyState` exist on a dozen singletons, so any match anywhere marks the field alive.
Hand-checking `blogPage` found **6 more dead fields**: `seriesRail.lede`, `seriesRail.emptyState`,
`readingStrip.lede`, `readingStrip.emptyState`, `notesStrip.lede`, `notesStrip.emptyState` — none
dereferenced anywhere in `BlogDirectory.tsx:226-303`.

Two more are hardcoded overrides: `articleUi.credibility.confidence` and `credibility.reviewStatus`
are queried, passed into `CredibilitySection`, and ignored in favour of local literal maps
(`CredibilitySection.tsx:48-54`, `:69-73`).

Plus dead code: `THEME_OPTIONS[].label` and `.desc` in `lib/articleThemeStyles.ts:13-16` are never
rendered — `ReaderMenu.tsx:170` uses only `.preview` and takes labels from Studio. Eight dead strings.

**Real total is at least 24 dead fields, not 16.** Correction filed against inventory §3.

---

## Part 1 — Measurements

### Type

| Route | Breakpoint | Permutations | Distinct sizes | Line-heights | Letter-spacings | Under 12px |
| --- | --- | --- | --- | --- | --- | --- |
| post | 1440 | 19 | 16 | 19 | 9 | 12 elems / 6 perms |
| post | 768 | 19 | 16 | 19 | 9 | 12 / 6 |
| post | 390 | 19 | 14 | 19 | 9 | 12 / 6 |
| blog | 1440 | 19 | 14 | 18 | 7 | 12 / 7 |
| blog | 390 | 18 | 13 | 18 | 7 | 12 / 7 |

**19 line-heights for 16 sizes** is the number that matters here — line-height is being set
ad-hoc per component rather than derived from the size. Body prose is 15px/`0.15px` tracking.

### Measure — the clearest defect on the page

| Breakpoint | Chars/line (median) | Range | Optimal |
| --- | --- | --- | --- |
| 1440 | **91** | 74–101 | 60–75 |
| 768 | **88** | 74–92 | 60–75 |
| 390 | **42** | 37–44 | 60–75 |

Wrong in both directions. At desktop the line is ~21% too long, which is the single biggest
readability cost on the article. At mobile it's too short, which fragments sentences.

### Rhythm

Adjacent-block gaps in the article body at 1440: **6 distinct values** — 14, 16, 20, 24, 40, 64px.

```
p→p 14   h3→p 16   h2→p 20   p→ul 24   ul→p 24
p→h3 40  p→figure 40  figure→figure 40   p→h2 64
```

This is more systematic than I expected — headings get more space before than after (64 before h2,
20 after), which is correct practice. The defect is `p→p` at **14px against a ~25px line box**:
paragraph spacing is smaller than one line, so paragraphs don't separate. Combined with 91 chars
per line, the body reads as a wall.

### Tap targets under 44×44 at 390

31 on the article, 38 on the index. Worst offenders on the article:

| Element | Size | Where |
| --- | --- | --- |
| Search button | **14×14** | navbar, site-wide |
| Heading anchor "Copy link to this section" | **10×23** | `HeadingAnchor.tsx` |
| TOC entries | 256×**27** | `ArticleToc.tsx` |
| "Reading options" | 40×**32** | `ReaderMenu.tsx` |
| Footer nav links | ~60×**20** | site-wide |

### Contrast

**Zero failures on both routes at every breakpoint.** Every text element passes 4.5:1 (or 3:1 for
large text). The September stone-400 lift did its job — this is the one axis that is genuinely
finished, and no proposal below touches it.

### Overflow

Two elements exceed the viewport at 390 — the parallax hero image and its wrapper
(`scale-[1.15]`, extending −29 to 419). **`document.scrollWidth === clientWidth === 390`**, so it is
contained by `overflow-hidden` and causes no horizontal scroll. Not a defect.

### Weight (390, throttled to 1.6 Mbps / 150 ms RTT)

| Metric | Value |
| --- | --- |
| Requests | 59 |
| Total transferred | **295 KB** |
| `load` | **5.0 s** |
| Network idle | **6.4 s** |

Largest assets: **four font files totalling 163 KB — 55% of page weight.** Lora, Inter, IBM Plex
Mono, and Lexend. Lexend exists only for `a11y-dyslexia`, an opt-in setting, and is downloaded by
every reader regardless.

### 1c — What actually renders (the finding that reframes the section)

The article page defines **20 top-level sections; exactly one is the body**
(`[slug]/page.tsx:154-272`). For the real post, this is what renders:

| Renders | Does not render |
| --- | --- |
| progress bar, hero, mobile TOC, sidebar TOC, **article body**, Ask, citation box, newsletter | series banner, TL;DR, prerequisites, checkpoint, objectives, concept cards, sources, credibility, backlinks, reactions, comments, read-next |

The body itself: **12 paragraphs, 4 headings, 2 images, 0 code blocks.**

So the elaborate learning-block apparatus — quiz, layer explorer, packet animator, Wireshark
callout, concept cards, stress test, glossary popovers — is **entirely dormant**, because the Sanity
documents don't populate those fields. Twelve of twenty sections are conditional and their
conditions are unmet.

---

## Part 2 — What the screenshots actually show

Crops read at native resolution from `docs/audit/screenshots/baseline/` (re-captured this session;
the previous set predated the `/paths` and `/review` deletion and showed reference links that no
longer exist).

**Blog index card grid at 390** (`390/blog-default.jpg`, crop y=2650–3470):

- The card thumbnail is a screenshot of monospace documentation, scaled to 390px wide and **clipped mid-word on both edges** — "…ves for the week / network documentation package / and configure GNS3 virtual lab enviro". At card size it is illegible and reads as a rendering fault rather than an image. This is the single worst visual element on the index.
- `HOMELAB` (9px mono, bordered) and `22 MIN` (9px mono) sit at the top corners. Both read as **decoration, not information** — they are too small to scan and too styled to ignore.
- The title in Lora at ~20px over three lines is the one element that works. Clear, readable, correctly the first thing the eye lands on.
- The excerpt reads well. The date at 10px is near-invisible.
- Below the last card, a **large empty band** then the footer CTA — the grid ends abruptly with no closing element.

**Two content bugs visible in this crop:**

1. The footer CTA renders **"Lets build"** — missing apostrophe. `Footer.tsx:41` has the correct `"Let's build"` as a fallback, but `settings.footerHeadlinePrefix` in the dataset overrides it with the typo. Same class as the `". . ."` fixed last session; a one-field Studio fix.
2. The index card claims **"22 MIN"** while the article's own TOC sums its four sections to **1+1+2+1 = 5 min**. Two different reading-time calculations disagree by 4×. Given the body is 12 paragraphs, 5 min is the plausible one.

---

## Part 3 — Themes

Captured to `docs/audit/screenshots/themes/{1440,390}-{archive,terminal,paper,broadcast}.jpg`, same
scroll position, same crop.

**Correction to my own method first:** my initial run reported Terminal and Broadcast as "not
applying". That was my selector, not the app — the chips render as **Dark / Green / Paper / Light**
(from `articleUi.readerMenu.themeLabels`), not Archive/Terminal/Paper/Broadcast (the names in
`lib/articleThemeStyles.ts`). Two label sets for one feature; you call them by names a reader never
sees. Re-run via `localStorage.sp_theme`, all four apply correctly.

Measured, every theme, both breakpoints:

| Theme | Body bg | Body text | In-body framed block | TOC text | Page bg |
| --- | --- | --- | --- | --- | --- |
| archive | transparent | `rgb(214,211,209)` | `rgb(10,10,10)` | `rgb(214,211,209)` | `#0a0a0a` |
| terminal | `#0d1117` | `rgba(0,255,65,.85)` | **`rgb(10,10,10)`** | `rgb(214,211,209)` | `#0a0a0a` |
| paper | `#f8f4ef` | `#3d2b1f` | **`rgb(10,10,10)`** | `rgb(214,211,209)` | `#0a0a0a` |
| broadcast | `#ffffff` | `#141414` | **`rgb(10,10,10)`** | `rgb(214,211,209)` | `#0a0a0a` |

**The bug is structural, not cosmetic.** Theme classes are applied by `ArticleProvider.tsx:255-281`
to exactly one node — the `<article data-article>` at `[slug]/page.tsx:216` — and `styles/article.css`
only selects prose inside it (`p, h1–h4, strong, em, .article-link, code, blockquote, li`). Two gaps
compound: no learning-block component is targeted even when inside that node, and every other
section renders outside it.

**Your hypothesis was half right.** You suspected Terminal and Paper. In fact:

- **Terminal — would ship.** Prose goes phosphor green on `#0d1117`, headings and links follow, and because the surrounding chrome is already dark the page stays coherent. The monospace body is a readability cost over a long article, but it's a deliberate aesthetic. Complete enough.
- **Paper — would not ship.** The cream sheet reads beautifully in isolation (see `1440-paper.jpg`: drop cap, serif headings, comfortable colour), but the framed image block inside it keeps a black border, and the TOC beside it stays light-on-dark. A near-black card floating on cream.
- **Broadcast — would not ship.** Same failure, more obvious on pure white.
- **Archive — ships.** It's the design everything was actually built for.

One more defect visible in `1440-paper.jpg`: the **"Reading options" chip is clipped at the right
edge** of the sidebar column, its label truncated.

---

## Part 4 — Pattern inventory

| Category | Distinct variants | Should be |
| --- | --- | --- |
| Badges / pills | **26** | 2 shapes × 5 tones = 10 |
| Labels (size×tracking×colour×weight) | **43** across 74 sites | **1** utility + tone |
| Border colours | **37** (20 neutral + 17 semantic) | 2 neutral + 5 semantic |
| Border radii | 5 (+1 directional) | 4 |
| Card treatments | **15** | 4 |

Detail worth seeing:

- **9 different padding pairs** for one conceptual badge — `px-2 py-0.5`, `px-2 py-1`, `px-2.5 py-1`, `px-1.5 py-0.5`, `px-3 py-1`, `px-3 py-1.5`, `px-3 py-2`, `px-3.5 py-2.5`, `px-5 py-2.5`.
- The **same semantic role rendered two ways**: the lane badge is `rounded-sm` in `BlogDirectory.tsx:432` and `rounded-full` in `BlogArticleHeader.tsx:157`.
- **14 distinct size×tracking skeletons** for the mono label: 8px at `.2em`/`.3em`/`.4em`/`widest`, 9px at four trackings, 10px at three, 11px at two.
- Near-identical duplicates that were clearly meant to be one component: `SideNote.tsx:41` (`bg-[#1a1a1e]`) and `GlossaryTerm.tsx:64` (`bg-[#141416]`) are identical in every dimension except background hex. The "tool card" is consistent across `KnowledgeQuiz`, `WiresharkCallout`, `LayerExplorer`, `PacketAnimator` (`border-white/10 rounded-lg bg-[#0f0f0f]`) but `LearningBlocks.tsx:189` breaks both radius and hex for no reason.

**Highest value, lowest risk:** collapse the 43 label permutations onto one utility. Pure typography
— no state, no layout, no conditionals — but it touches 74 call sites, more surface than any other
single fix.

**Correction to my own proposal.** I was going to propose *creating* a `.meta-label` utility. It
already exists — `styles/index.css:121-125`, sans, `0.8rem` (12.8px), `#a8a29e` — and it is used
**zero times**. It was written, presumably during the September refactor, as the answer to exactly
this problem, and never adopted; the 43 permutations grew around it. `.section-label` beside it is
used 44 times, so the pattern demonstrably works when someone reaches for it.

This makes the fix cheaper than proposed: adopt an existing class rather than design one, and its
12.8px already clears the 12px floor. It also means the real defect is process, not design — a
utility landed with no adoption pass, and nothing caught that it had no callers.

---

## Part 5 — Driving the interactions

### The reader menu is substantially non-functional with a mouse

This is the most serious finding in the section, and it only appeared by driving the UI.

Scrolled into the article — the realistic case — with the menu open:

| Breakpoint | Panel | Below fold | Controls | Reachable | Blocked | Offscreen |
| --- | --- | --- | --- | --- | --- | --- |
| 1440 | 320×630 at y=142 | 0 | 24 | **3** | **18** | 3 |
| 390 | 320×591 at y=494 | **241px** | 24 | 9 | 3 | 12 |

At 1440 the panel is **fully visible and 18 of its 24 controls cannot be clicked**.
`document.elementFromPoint` at each control's centre returns
`div.relative.max-w-6xl.mx-auto.px-6.lg:grid` — the article grid wrapper — instead of the button.
The dialog carries `z-index: 1002` but sits inside the sticky sidebar, and the main column's
stacking context paints over it. A real mouse click lands on the grid, not the control.

At 390 the panel opens at y=494 in an 844px viewport and runs 241px past the fold; half its
controls are simply off screen, and scrolling moves the panel with the page.

**So the centrepiece of the reading experience — theme, text size, width, accessibility, share,
read-aloud, bookmark — is mostly unusable.** Theme switching only worked in my automation for the
two or three chips that happen to fall outside the overlapping region. I could not complete a
reader-menu control sweep because of this; that part of Part 5 is **blocked, not passed**.

### What I could verify

- **TOC** renders at both breakpoints, entries are 27px tall (below tap minimum), and clicking scrolls. I could not complete the active-highlight lag test because the run aborted on the menu bug above — **unverified, not passing**.
- **Blog index filter** — chips are URL-driven via `setParam` and `useSearchParams` (`BlogDirectory.tsx:320-370`), so deep links and back should work by construction; the automated confirmation didn't complete for the same reason. Flagged as needs-recheck.
- **Keyboard** — not completed. Same cause.

I'm reporting this as incomplete rather than inferring results. The menu bug should be fixed first,
then Part 5 re-run — it's ~20 minutes once clicks land.

---

## Part 6 — Comparison

Reusing the seven-site research in `2026-09-experience-plan.md` Part 1 rather than re-fetching, per
the agreed scope. Two direct comparisons, both **fetch-grounded this session**.

### vs. gwern.net

Gwern's own design page lists what the article page deliberately **omits**: author bio boxes, share
buttons, sidebar navigation, recommended-article widgets, comments, social integration. Its stated
principle is "anything besides the content is distraction and not design."

Your article page has, or is built to have: reactions, Ask, comments, newsletter, a three-card
read-next grid, a citation box, backlinks, credibility, sources, concept cards, checkpoint,
objectives, prerequisites, TL;DR, series banner. **Gwern's list of things not to include is close to
an inventory of what you built.**

What Gwern does that you don't, and that matters: **epistemic status in the header** — confidence,
importance, and a status of notes/in-progress/finished, compiled from frontmatter. You have the
schema for this (`post.confidenceLevel`, `reviewStatus`) and `CredibilitySection` renders it — but
at the *bottom* of the page, where it can't set expectations, and it doesn't render at all for
either live post.

What Gwern does that wouldn't help you: backlinks with transcluded context, link bibliographies,
recursive popups. All of those are functions of 200+ interlinked pages. With two posts they'd be
empty furniture — the same trap the rest of this site already fell into.

### vs. joshwcomeau.com

His article page before the prose: nav, date, last-updated. After: update timestamp, view count,
author bio, newsletter, footer. That's it. Body is a constrained centre column at ~42rem targeting
**65 characters** — the number he explicitly advocates. Yours measures **91**.

The instructive part is the demos. His interactive components sit inline in the text flow, framed
minimally, at the exact paragraph that needs them. Yours (`KnowledgeQuiz`, `LayerExplorer`,
`PacketAnimator`) are heavier framed cards — `border-white/10 rounded-lg bg-[#0f0f0f]` with their
own headers and mono labels — which is more chrome per idea. And they don't render at all on these
posts.

**Verdict on the comparison:** the gap isn't features, it's that both of them put the writing first
and let everything else be small. That is available to you today at no engineering cost.

---

## Part 7 — Critique

You asked for directness rather than diplomacy, so:

**First impression.** Cold-opening the article at 1440, the eye lands on the full-bleed parallax
hero image — not the title, which is overlaid on it and competing with a photograph for contrast.
Once past the hero, the first real content is the TOC in the right rail, because it is a bordered
box with its own heading while the prose is unframed text. **The table of contents is more visually
prominent than the article.** That's backwards.

**Hierarchy.** Parseable at the top (48/36/30/24 Lora is a clean ladder) and muddled at the bottom,
where 9, 10 and 11px mono labels in five colours all carry different meanings with no consistent
encoding. A reader can't learn which is which because there are 43 variants of it.

**Chrome vs content.** Twenty sections, one of them the writing. Twelve don't render. The honest
description is that this is a **content-management system for articles that don't exist yet**. The
learning blocks are genuinely the most distinctive thing here and I'd keep them — but they were
built for a catalogue of technical explainers, and there are two posts, one of which has 12
paragraphs and no code blocks.

**The mono label question — answering honestly.** It's a tic, and it's hurting the page. Not because
tiny mono labels are inherently wrong — they encode metadata compactly and the aesthetic is
coherent — but because **43 permutations is not a system, it's an accident**. At 8–9px with 0.2–0.4em
tracking, they're below comfortable reading size and word-shape is destroyed by the letter-spacing.
The information in them is real ("Homelab", "22 min", "Seeking peer review") and it is rendered as
the least readable text on the page. A lot of care went into these and the answer is still that
there should be one of them, at 10–11px, in one colour, with semantic tone as the only variable.

**What I'd cut.** In order:

1. **The parallax hero** (`BlogArticleHeader.tsx:76-79,110,121,146,154,182`). It costs a full viewport before any writing, it puts the title over a photo, and it's the reason the sidebar TOC starts at y=785. Replace with a text header.
2. **The three-card read-next grid.** With two posts it can only ever recommend the other one.
3. **Reactions** (`Reactions.tsx`) — localStorage-only, so the count is visible to nobody including you. It's a button that lies.
4. **The citation box.** Nobody is citing a two-post blog; it renders unconditionally.
5. **Comments (Giscus)** — env-gated and currently off. Either turn it on or delete it.
6. **Ask-this-article** — I'd keep this one, but only because it's genuinely unusual. It renders today.
7. **Lexend** from the font bundle — 40KB downloaded by everyone for an opt-in setting. Load on demand.

**What's missing.** Three things a reader would expect and not find:
- **A date and reading time they can actually see** — both exist at 9–10px in the corner of a card.
- **Any indication of what the post is part of.** The series machinery exists; neither post uses it. "Week 2" implies a Week 1 the page never links to.
- **A reason to come back.** The newsletter renders, but nothing tells a reader what they'd be subscribing to or how often.

**The honest verdict.** A working network engineer landing on the home-lab post cold: they would
read it, because the writing is plain and specific and the topic is real. They would probably not
finish comfortably at 1440 — 91 characters per line with 14px paragraph gaps is a wall, and they'd
either zoom or skim. They would **not** trust it more because of the credibility apparatus, because
none of it renders. And they would have no particular reason to return, because nothing on the page
tells them a Week 3 is coming.

The page's problem is not that it lacks features. It's that it has nineteen features around one
article, and the article is set too wide to read comfortably.

---

## Part 8 — Proposals

Ordered cuts → fixes → improvements. Effort in sessions. "Visual impact" = would a reader notice.

### CUT

| # | What changes | Why | Effort | Risk | Visual | Depends |
| --- | --- | --- | --- | --- | --- | --- |
| B1 | **Parallax hero → text header.** `BlogArticleHeader.tsx:76-79,110,121,146,154,182` | §7 first impression; recovers a viewport; fixes the TOC starting at y=785 | 0.5 | Loses the cover image as a design element | **High** | — |
| B2 | **Delete read-next grid.** `[slug]/page.tsx:257-269` | Can only recommend the one other post | 0.1 | None | Med | — |
| B3 | **Delete Reactions.** `Reactions.tsx`, `[slug]/page.tsx:244` | localStorage-only; the count reaches nobody | 0.1 | None | Low | — |
| B4 | **Delete the citation box.** `[slug]/page.tsx:246-249` | Unconditional; nothing cites a 2-post blog | 0.1 | None | Low | — |
| B5 | **Decide Giscus.** Enable or delete `Comments.tsx` | Env-gated, currently invisible | 0.25 | None | Low | Your call |
| B6 | **Lexend out of the global font load** | 40KB of 295KB for an opt-in setting | 0.25 | Dyslexia mode must load it on demand | None | — |
| B7 | **Delete `THEME_OPTIONS[].label`/`.desc`** (`articleThemeStyles.ts:13-16`) | Dead — `ReaderMenu.tsx:170` uses Studio labels | 0.1 | None | None | — |
| B8 | **Delete 8 dead Studio fields** — 6 `blogPage` strip `lede`/`emptyState`, 2 `articleUi.credibility` arrays (or wire the latter) | Correction 3 | 0.25 | Run typegen | None | — |

### FIX

| # | What changes | Why | Effort | Risk | Visual | Depends |
| --- | --- | --- | --- | --- | --- | --- |
| B9 | **Reader menu click-through.** Fix the stacking context so the dialog isn't painted over by the article grid; at 390 open it as a sheet rather than an absolute panel | §5 — 18/24 controls unclickable at 1440 | 0.75 | Touches sticky/z-index layout | **High** | — |
| B10 | **Measure to 66ch, mobile to ~60.** `styles/article.css` | 91 chars/line at 1440, 42 at 390 | 0.25 | Changes every article's height | **High** | — |
| B11 | **Paragraph spacing `p→p` 14px → ~1.4em.** `styles/article.css` | Spacing below one line height | 0.1 | None | **High** | B10 |
| B12 | **Theme scope.** Move theme classes to a wrapper containing the whole article column, and add theme rules for the framed components | §3 — Paper and Broadcast unshippable | 1.5 | Largest change here; needs all four themes re-checked | **High** | — |
| B13 | **Fix the reading-time disagreement** — index says 22 min, TOC sums to 5 | Two calculations, one wrong | 0.25 | None | Med | — |
| B14 | **Fix "Lets build" → "Let's build"** in `settings.footerHeadlinePrefix` (Studio, not code) | Visible typo, every page | 0.05 | None | Low | — |
| B15 | **Tap targets to 24px minimum** — search 14×14, heading anchor 10×23, TOC rows 27px | 31 under 44 on the article | 0.5 | None | Low | — |
| B16 | **Index card thumbnail.** Stop scaling a documentation screenshot into a 390px card | §2 — reads as a rendering fault | 0.25 | Needs a real cover or a designed placeholder | **High** | — |
| B17 | **Unclip the "Reading options" chip** in the sidebar | Truncated label | 0.1 | None | Low | — |

### IMPROVE

| # | What changes | Why | Effort | Risk | Visual | Depends |
| --- | --- | --- | --- | --- | --- | --- |
| B18 | **Adopt the `.meta-label` utility that already exists** — 43 permutations → 1 + tone | §4, and see the correction below | 1.25 | 74 call sites; screenshot-diff per file | **High** | B10-B11 |
| B19 | **Consolidate badges 26 → 10, cards 15 → 4, borders 37 → 7** | §4 | 1.5 | Wide but mechanical | Med | B18 |
| B20 | **Epistemic status into the header** (gwern) — surface `confidenceLevel`/`reviewStatus` above the body | §6; you have the schema and neither post uses it | 0.75 | Needs the posts to actually set it | Med | Content |
| B21 | **Link Week 2 → Week 1 via the series field** | "Week 2" implies a Week 1 the page never links | 0.25 (content) | None | Med | Content |

### On the animation census

The plan's Part 2.2 marked `SectionBreak` for five deletions and the FAQ/booking disclosures for
replacement. On this surface: `SectionBreak.tsx:62-63,68-69,80-81,90-92,102-103` still animates
**letter-spacing** on scroll (`0.2em → 0.5em`), which is animating type and layout-thrashing. It
does not render on either live post. **Delete with B2–B4** rather than retune.

---

## Recommended execution order

**One session, in this order, and stop:** B14 (5 min, Studio), B9 (the menu is broken), B10+B11
(the reading experience), B1 (the hero), B2–B4+B7 (deletions), B13, B16.

That is roughly 2.5 sessions of work and it addresses everything a reader would actually notice.

**Then stop and write the WinRM post.** B12 (themes), B18–B19 (consolidation) and B20 are all
worth doing, but they are worth doing *for a blog that has five posts*, and none of them changes
whether a reader finishes this one. The consolidation work in particular gets cheaper after the
cuts, because there will be fewer call sites left to consolidate.
