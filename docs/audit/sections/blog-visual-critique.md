# Blog — visual and experience critique (2026-09-08)

Captured against **production** (`60d18c5`), not the dev server, so everything here is what a
reader actually gets. 85 frames in `docs/audit/screenshots/blog-critique/{1440,768,390}/`.

Measurements come from a Playwright probe against the same production pages. Where a number
appears below, it was measured, not eyeballed — three separate findings this week turned out to
be artifacts of my own measuring commands, so nothing here rests on a screenshot alone.

---

## 0. Six shipped defects, found while capturing

These are bugs, not taste. They come first because four of them silently undo work already done.

| # | Defect | Evidence |
| --- | --- | --- |
| **V1** | **Every first-time reader gets the smallest text size.** `ArticleProvider.tsx:98` does `Number(localStorage.getItem('sp_font_size'))`. For a new reader the key is absent, `getItem` returns `null`, and `Number(null) === 0` — which passes every guard on line 102 (`isFinite`, `>= 0`, `< 4`). `DEFAULT_SETTINGS.fontSize = 1` is therefore **unreachable**. | Measured `--article-fs: 0.9375rem` (15px) at all three breakpoints. Reader menu highlights `S` in a context where nothing was seeded. |
| **V2** | **The measure fix is undone by V1.** The 36rem column was sized for 17px prose to land at ~68 chars. At the 15px it actually renders, it measures **80 characters per line** at 768 and 1440 — back outside the 60–75 target. | `charsPerLine: 80` at both breakpoints. |
| **V3** | **The directory links to two routes that 404.** "Learning paths" → `/paths` and "Review deck" → `/review` were deleted on 2026-09-07; the blog directory panel still advertises both. | `curl` → `/paths 404`, `/review 404`. Both present in the rendered DOM. |
| **V4** | **Three different post counts on one page.** The header says "3 posts", "All posts" says "2 posts", and four distinct post URLs are linked from the page. `osi-model` is reachable and linked but appears in neither count nor the grid. | `headerCount: "3"`, `allPostsCount: "2 posts"`, `distinctSlugs: 4`. |
| **V5** | **The TOC's own arithmetic contradicts the header.** Per-section estimates read 1 + 1 + 2 + 1 = **5 min**; the header says **3 min read**. | Both strings measured in the same DOM. |
| **V6** | **Multi-line inline code renders as damage.** The `systeminfo` output is marked up as inline `code` inside a list item. When it wraps, each line gets its own background box with ragged edges, reading as strikethrough. | `1440/post-mid.jpg`. Content fix (should be a fenced block), not a CSS fix. |

V1 is the highest-value line of code on the site right now. One character (`Number(x ?? 1)` or an
explicit `null` check) restores the intended reading size everywhere and takes the measure from
80 back to ~68 without touching a single style.

---

## 1. Typography

**The type scale is not a scale.** Measured ratios between adjacent steps at 1440:

```
h1 48px → h2 32px    1.50
h2 32px → h3 25.6px  1.25
h3 25.6px → h4 20px  1.28
h4 20px → body 15px  1.33
```

Four steps, four different ratios. Nothing ties them together, so the hierarchy reads as four
arbitrary sizes rather than a system. A single ratio (1.25 or 1.333) applied consistently would
cost nothing and immediately look considered.

**The headline is set to the body measure, and it's the worst thing on the article page.** The h1
is constrained to the same 36rem column as the prose, so at 1440 a 48px display face wraps to
**four lines**, breaking as:

```
Building My Physical
Home Lab -- Week
2: Documentation &
Extensive Researching
```

"Week" and "2:" are split across a line break. Display type needs its own, wider measure —
headlines want 20–30 characters per line, not the 60–75 that body text wants. This is a
one-property fix and it is the single biggest visual upgrade available.

**`--` is rendering literally** in the title, on the card, and in the tab. It's content, not code,
but it appears at 48px at the top of the page.

**The same taxonomy is styled two different ways.** On the index, categories are uppercase mono
micro-labels (`HOMELAB`, `NETWORK & INFRASTRUCTURE`); on the article, the identical values are
sentence-case pills (`Homelab`, `Network & Infrastructure`). A reader cannot learn the visual
language because it changes between the two pages that use it most.

**114 instances of sub-12px text** across `components/blog`, `components/article` and
`app/(archive)/blog` (`text-[9px]`, `text-[10px]`, `text-[11px]`). The stats column sets counts at
10px mono. That isn't restraint, it's illegibility used as a texture.

---

## 2. Spacing and rhythm

**The article's vertical rhythm is fine.** 1.6em paragraph spacing at 1.85 line-height is genuinely
comfortable, and the drop cap is a nice touch that survives all four themes. Credit where due —
this part works.

**The lead-in does not.** Measured distance from the top of the document to the first sentence of
writing:

| Breakpoint | First paragraph | Viewport | Result |
| --- | --- | --- | --- |
| 1440 | y = 890 | 900 | first sentence is at the very bottom edge |
| 768 | y = 1008 | 1024 | same |
| 390 | y = **911** | **844** | **first sentence is below the fold** |

On mobile the reader scrolls past nav, a back link that visually collides with the logo, three
category pills, a four-line title, a meta row, an unreadable screenshot, and a ~250px "In this
article" box before reaching a single word of the article. That is a lot of furniture in front of
a three-minute read.

**The 1440 layout is unbalanced.** The prose column sits left of centre, the TOC floats far right,
and there is ~180px of dead space between them plus ~175px after the TOC. Above the fold the
entire right half of the article page is empty — the TOC doesn't begin until y≈760. The page
doesn't use the width it reserves.

**Two cards in a three-column grid** leave the right third of "All posts" empty, and the directory
panel above it has visibly empty cells. The layout is built for a volume of content that doesn't
exist yet, so emptiness is the dominant visual impression.

**"0 series" is displayed as a statistic.** Advertising a zero is worse than omitting the row.

---

## 3. Motion — the honest answer on "cinematic"

I counted every animation and transition class in `components/blog`, `components/article` and
`app/(archive)/blog`:

```
52  transition-colors
15  transition-all
 9  transition-transform
 2  transition-opacity
 1  motion-safe:*        ← one, in the entire blog surface
 1  animate-pulse
```

**Exactly one `motion-safe:` gate exists in the whole blog section**, and 56% of all motion is a
colour fade on hover. There is no scroll-linked motion, no entrance choreography, no stagger, no
shared-element continuity between the card and the article it opens. `BlogBackground` is
explicitly documented as *"No animation, no cursor tracking."* The parallax hero was removed (for
good reasons) and nothing replaced it.

So: **the blog currently has no motion design at all.** It has hover feedback. The gap between
where it is and "cinematic" is not a tuning problem, it's a greenfield.

Worse, the motion tokens you already built — `EASE.outExpo`, `DURATION.fast/base/slow`, `STAGGER`,
`fadeUp`, `staggerChildren` in `lib/motion.ts` — are essentially **unused by the blog**. Six
`framer-motion` importers are all learning-block components that don't render for either published
post. You have the vocabulary and none of the sentences.

The `transition-all` × 15 is a separate, smaller problem: it animates every animatable property
including layout ones, which is both a jank risk and a sign the transitions weren't chosen
deliberately.

**State transitions specifically:** the reader menu appears with no entrance and no scrim. The
panel is cut off mid-glyph at its bottom edge ("Copy as Markdown" is sliced) with no fade or
scroll affordance, and on 1440 the TOC's right-aligned minute labels poke out from behind it, so
orphaned "1 min / 1 min / 2 min" float beside the open panel. On mobile the sheet opens over fully
legible page content with no backdrop dim, so it reads as unanchored rather than modal.

**Route transitions:** `animate-page-enter` is a 400ms opacity+8px translate on the whole page.
That's a competent default and nothing more — there's no continuity between a card and the article
it opens, which is the single most "cinematic" affordance available to a blog and the one readers
actually feel.

---

## 4. Templated vs. designed

The article page is well-engineered and under-art-directed. Concretely:

- **The featured image is stock.** A generic data-centre photograph of a stranger at a laptop,
  fronting a personal site about this author's own lab and career. Nothing undermines a personal
  archive faster than a stock photo of someone else.
- **The hero "image" on the article is a screenshot of a markdown file** — line numbers 1–11,
  several of them blank, ending on an empty line. At 390 it is entirely illegible. It communicates
  nothing and looks accidental.
- **The card thumbnail is that same screenshot, cropped mid-word** (`al - - April 5th`,
  `ves for the week`), so the grid's first impression is a broken image.
- **The brightest element on every page is the search button's amber border.** Above the fold on
  both `/blog` and the article, the highest-contrast object is a utility affordance, not the
  writing. The focus-ring colour has become permanent chrome.
- **28 glyph icons** (`→`, `✕`, `↑`, `↓`) sit alongside the lucide set that CLAUDE.md mandates.
  Mixed icon languages read as unfinished.

There *is* real design intent here — the dark archive palette, Lora, the drop cap, the topology
diagram, the high-contrast mode (which is genuinely well executed: pure white on black, yellow
links). The problem is that the intent stops at the component boundary and never becomes a page.

**The theme system proves this structurally.** `theme-green` applies only to `<article
data-article>`, so the body turns green-on-dark inside a hard-edged rectangle while the TOC beside
it stays in the dark theme, and the page background stays a third value. Same with high contrast.
The themes aren't half-styled; they're scoped to the wrong element. Any theme other than the
default will always look broken until that scope moves up to the page.

---

## 5. Reference points

Named specifically, and what to take from each:

| Site | What it does that this doesn't |
| --- | --- |
| **maggieappleton.com** | Hand-drawn assets and per-essay illustration make a two-post garden feel intentional rather than empty. The lesson is that *one* bespoke asset beats five stock ones. |
| **stripe.com/blog** and **increment.com** (archive) | Display type on its own measure, well above the body column. Directly fixes the four-line-headline problem. |
| **paco.me** / **rauno.me** | The reference for "cinematic": shared-element transitions, spring-based state changes, motion that is *continuous* rather than discrete. Rauno's interaction detail is the closest thing to the standard you're describing. |
| **linear.app/blog** | Restraint at scale — one accent, one motion idiom, tight type scale. Good counter-model to 26 badge styles. |
| **anthropic.com/research** | Long-form dark-mode reading with generous measure and near-zero chrome around the text. |
| **every.to** and **thecreativeindependent.com** | Reading-experience furniture (progress, TOC, settings) that stays out of the way until wanted. |

The through-line: every one of these has **fewer** components than this blog and more identity.

---

## 6. What's achievable here vs. what needs restructuring

**Achievable in this codebase, no restructuring (highest value first):**

1. V1 — the `Number(null)` font-size bug. One line; fixes text size and measure sitewide.
2. Give the h1 its own measure. One class on the header's inner div.
3. V3 — remove the two 404 links from the directory defaults.
4. V4/V5 — reconcile the post counts and the read-time arithmetic (both are query/derivation bugs).
5. Unify the taxonomy treatment between index and article. Pick the pill.
6. Raise the sub-12px text to 12px minimum. Mechanical.
7. Replace the stock featured image and the markdown-screenshot hero. Content, not code.
8. Move the theme class from `<article>` up to the page shell so themes stop clipping.
9. Add a scrim + entrance to the reader menu, and fix the bottom-edge clipping.
10. Swap the 28 glyph arrows for lucide.

**Needs real restructuring:**

- **Shared-element transition from card → article.** This is the "cinematic" centrepiece and it
  needs a View Transitions API pass (or framer-motion layout IDs) plus matching DOM structure
  between the card and the article header. Non-trivial but very high impact.
- **Scroll-linked choreography** (section entrances, TOC activation, progress). Needs a motion
  layer the blog currently doesn't have, built on `lib/motion.ts` which is already sitting there
  unused.
- **The 1440 layout.** Left-hugging prose with a floating TOC and dead space either side needs a
  compositional decision, not a padding tweak.
- **Reducing chrome.** Nineteen surrounding sections for one body of writing; twelve of them don't
  render for either published post. That ratio is a structural choice, not a style issue.

---

## 7. On "cinematic" — what I need to make it concrete

"Cinematic" is too vague to build from, and I'd rather say so than guess and burn a session. It
currently reads three incompatible ways:

1. **Continuity** — elements persist and transform between states and routes (Rauno, Linear). The
   reader never sees a hard cut. This is the interpretation I'd recommend, because it directly
   serves "gets out of the way".
2. **Atmosphere** — ambient depth, grain, parallax, light. Visually dramatic, but you already
   removed a parallax hero for good reasons, and this fights "highly convenient".
3. **Pacing** — content revealed in a deliberate sequence as you scroll, like a shot list.

To turn this into work I can execute, I need one thing from you: **pick which of those three you
mean** (or tell me it's a blend and in what proportion). If you pick continuity, the concrete
deliverable is a card→article shared-element transition plus a motion pass on the reader menu and
TOC, using the tokens already in `lib/motion.ts`.

One caution I'd be wrong not to state: motion is the *last* layer. With V1 unfixed, the site is
serving 15px text at an 80-character measure — no amount of choreography compensates for prose
that's slightly too small and slightly too wide. The ordered list in §6 is deliberately ordered.

---

## 8. The unavoidable observation

Four posts now, up from two. The article page renders 19 sections of chrome around one body of
writing, and 12 of those don't render at all for the published posts. The most striking frame in
this entire capture set is `1440/post-theme-green.jpg` — not because of the theme, but because the
whole right half of the screen is empty.

Nothing in §6 changes that ratio. Fixing V1 through V6 is worth doing because they're defects, and
the h1 measure is worth doing because it's ten minutes. Beyond that, the honest read is that this
blog's largest available improvement is a fifth post, not a motion system.
