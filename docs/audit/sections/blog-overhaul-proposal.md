# Blog overhaul — research and proposal (2026-09-08)

Proposal only. Nothing in this document has been applied.

Direction taken as given: **pacing** (typography and space) is the substrate, **continuity**
(removing jolts) is second, **atmosphere** is a thin restrained third, effects are out.

---

## Part 0 — Re-adjudicating the six defects

You listed six from my critique. Three stand, one is a Studio fix rather than a code fix, and
**two are not defects at all**. I got two of them wrong and I'd rather say so before you spend a
session on them.

| # | Claim | Verdict |
| --- | --- | --- |
| D1 | `Number(null) === 0` → 15px, measure 80 chars | **Stands.** Confirmed in code and at runtime. Worse than I said — see below. |
| D2 | `/paths` and `/review` 404 from the directory | **Stands, but it's a Studio fix.** `lib/cms/defaults/blogPage.ts` is already clean (6 links). The *published* `blogPage` document has 8, including both dead ones, and overrides the defaults. No code change. |
| D3 | Three post counts; `osi-model` in neither | **Withdrawn — not a bug.** There are exactly 3 `post` documents. `osi-model` is a hand-built route at `app/(archive)/blog/osi-model/page.tsx`, not a post. "3 posts" is the total; "2 posts" is the grid, which correctly excludes the featured one. The only real issue is that both use the word "posts" for different sets — a copy fix. |
| D4 | h1 set to the body measure, splitting "Week / 2:" | **Stands.** |
| D5 | `theme-green` scoped to `<article data-article>` | **Stands.** |
| D6 | Lexend still loaded on the article page | **Withdrawn — not a defect.** Measured the article page: 6 font files requested, none Lexend; `document.fonts` reports `Lexend:unloaded`. `preload: false` works exactly as documented. My earlier "17KB non-preloaded Lexend" counted a declared `@font-face`, not a network request. |

That is now **five** claims this week that were artifacts of my own measurement rather than the code
(B13 read time, reader menu 20/22, "Also open", D3, D6). The pattern is consistent enough to be
worth a standing rule, which I've added to the section log: *when a measurement contradicts
observed behaviour, suspect the measurement first.*

### A seventh defect, found while verifying the sixth

While checking whether the amber search border was styling or a focus ring, I found it is neither
of the things I assumed.

**D7 — the search button is auto-focused on every page load.** `SearchModal.tsx:97`. The effect is
keyed on `[open]`; on mount `open` is `false`, so it skips the open-branch and falls straight
through to the focus-restore-on-close call:

```tsx
useEffect(() => {
  if (open) { /* …reset dialog, focus input… */ return () => { … } }
  triggerRef.current?.focus({ preventScroll: true })   // ← runs on mount
}, [open])
```

Measured on production: `document.activeElement` is the search button and it matches
`:focus-visible`, so the 2px `amber-400` outline renders on first paint. Three consequences:

1. The brightest element above the fold on every page is a utility control. (My critique said this
   was "the focus colour used as permanent chrome" — wrong diagnosis, real symptom.)
2. **The skip link is defeated.** Focus starts past it, so a keyboard user's first Tab lands on
   whatever follows the search button.
3. It is site-wide, not blog-specific — `Navbar` is in both shells.

Proposed fix — track whether the dialog has ever opened:

```tsx
const hasOpened = useRef(false)
useEffect(() => {
  if (open) { hasOpened.current = true; /* …existing open branch… */ }
  else if (hasOpened.current) triggerRef.current?.focus({ preventScroll: true })
}, [open])
```

### The fixes, proposed not applied

**D1 —** `components/article/ArticleProvider.tsx:98`

```ts
// before
const fs = Number(localStorage.getItem(STORAGE.fontSize))
// after — Number(null) is 0, which passes every guard below and makes the default unreachable
const rawFs = localStorage.getItem(STORAGE.fontSize)
const fs = rawFs === null ? DEFAULT_SETTINGS.fontSize : Number(rawFs)
```

D1 is worth more than a size fix. Because the server renders at the stylesheet's `1.0625rem` and
`ArticleProvider` then writes an inline `--article-fs: 0.9375rem` after hydration, **every article
load visibly reflows smaller.** That is the single largest continuity jolt on the site, and it is
the same one-line fix. Pacing and continuity both start here.

**D2 —** Studio → Blog Page → Reference links: delete "Learning paths" and "Review deck".

**D3 —** copy only: the grid heading should read "More posts", not "All posts", or the stats row
should say "3 published".

**D4 —** `components/blog/BlogArticleHeader.tsx:71`. The header's inner wrapper is
`max-w-[36rem]`, matching the prose. Give display type its own measure:

```tsx
<div className="w-full max-w-[36rem] mx-auto">        {/* meta, back link, badges */}
  <h1 className="… max-w-[20ch] …">                    {/* headline breaks at ~20–30 chars */}
```

**D5 —** `ArticleProvider.tsx:257-262` applies the theme class to `document.querySelector('[data-article]')`.
Apply it to `#content` (or `document.documentElement`) instead, and re-scope the `[data-article].theme-*`
selectors in `styles/article.css` to match. This is the change that makes any non-default theme
stop looking broken.

**D6 —** no action.

---

## Part 1 — Research

Ten sites captured at 1440 and measured on the same probe. Screenshots are in the scratchpad
(`…/scratchpad/refs/`); they are reference material, not committed to the repo.

| Site | Body | LH | Column | ~CPL | Ground | Face |
| --- | --- | --- | --- | --- | --- | --- |
| ciechanow.ski | 19.2px | 1.60 | 704px | 84 | `#f8f8f8` | IBM Plex Sans |
| craigmod.com | 20px | 1.50 | 746px | 89 | `#ffffff` | Meta Serif |
| gwern.net | 20px | 1.60 | 895px | 103 | white | Source Serif 4 |
| maggieappleton.com | 22px | **2.00** | 792px | 84 | `#f6f5f1` | Canela Text |
| notes.andymatuschak.org | 17px | 1.41 | 561px | 79 | `#fafafc` | system sans |
| worksinprogress.co | 12px* | 1.60 | 897px | 120 | `#fff7f4` | GT America Mono |
| stephango.com | 18.6px | 1.50 | 688px | 84 | `#fffcf0` | system sans |
| **stefanpeele.com** | **15px** | 1.85 | 576px | 80 | `#0a0a0a` | Inter |

\* Works in Progress' 12px is a caption element my probe picked up, not its body.

Three facts fall out of that table immediately.

**Your prose is the smallest in the set by 2px, and by 4px against the median.** The 2026 norm the
search results also gave independently is 18–20px. This matters more than measure: at 15px your
576px column reads 80 characters; at 19px a 640px column reads ~70. You get a *wider* column and a
*shorter* line simply by fixing D1 and moving the default up one step.

**Nobody is achieving this on a dark ground.** Eight for eight are light, and five of the eight are
warm off-whites rather than pure white (`#fffcf0`, `#f6f5f1`, `#fff7f4`, `#f8f8f8`, `#fafafc`). See
Part 4 — this is the part of your direction I want to push on.

**Chars-per-line is not the constraint you think it is.** The classic 60–75 rule is violated by
every site here (79–103). What they share is *angular* size — a 19–22px face on a 690–790px
column. Optimising CPL at 15px was solving the wrong variable.

### Honest reactions

**craigmod.com — the closest match, and the most copyable.** This is what you described. It is
almost entirely type and space: 20px serif, `hyphens: auto` (visible as "engi-neering", "sec-onds",
"pre-cisely" — that hyphenation is what gives it its book-like density and it is a one-line CSS
change), italic rather than bold for emphasis, and **a short thin centred rule with ~70px of air on
each side** as a section break. Inline code sits in the line as small mono with no background box —
directly the fix for your ragged-code defect. No sidebar, no TOC, no progress bar, no reader menu.

**stephango.com — the most relevant, because it's your genre.** A technical writer documenting a
system, built from nothing but type and space. The lesson I'd most want you to take: **his h2 is
21.5px against 18.6px body — a ratio of 1.15.** Hierarchy comes from *space above* and *weight*,
not size. Your h1→h2 jump is 1.50. His code blocks are a 1px border, a barely-there fill, generous
padding, no syntax colour. His ground is `#fffcf0`, a warm cream — not white.

**maggieappleton.com — the best pacing devices, the least copyable assets.** 22px at line-height
**2.00** is the most generous setting in the set and it is most of why it feels unhurried. Her
section break is a short coral rule, ~160px wide, with ~100px above and ~90px below. And her table
of contents is **collapsed by default into a small marginal control** — present, silent, out of the
way. That is the answer to your TOC problem. The hand-drawn illustrations are the part you can't
have and shouldn't try to fake.

**ciechanow.ski — right spirit, wrong model.** The gold standard for "digesting genuinely important
information," but its power is bespoke WebGL diagrams. Strip those and the typography is
unremarkable: plain IBM Plex Sans, grey on off-white. What *is* transferable is that his pacing
comes from **space around figures** — 130px+ of air before and after each one — and that there is no
chrome in the reading column at all.

**gwern.net — I'd steer you away from this one.** It is genuinely authored and it does take its
time, but full justification at 103 CPL with indented first lines and no paragraph gaps produces a
wall. It serves a reference document, not a read. Two specifics against it: the archaic
indent-instead-of-gap convention reads as affectation on screen, and in my capture his empty
sidenote column leaves exactly the same unbalanced left void that your 1440 layout has on the
right. Take the *idea* of marginal apparatus; don't take this execution.

**rauno.me — wrong for this brief, and I put it on the original list, so this is my correction.** I
named it as the "cinematic" reference last session. Looking at `/craft` against the direction you've
now set: it is a dense masonry grid of interaction demos in bright yellow, restless and
demonstrative. It is a craft portfolio, not a reading experience, and it is the opposite of "takes
its time." Its individual interaction mechanics are worth learning from; its feel is not what you
want.

**notes.andymatuschak.org — one idea worth stealing, one to reject.** The stacked-panes navigation
is the most literal implementation of "continuity" on the web: following a link slides a new column
in beside the old one and nothing is ever replaced. But it's a research interface for a notes
graph, it's disorienting at first contact, and at 17px/1.41 the typography itself is the weakest
here. Reject the aesthetic; note the pattern for `/garden` some day, not for the blog.

### What these contradict in your current choices

1. **The reading furniture.** Craig Mod, Steph Ango and Ciechanowski have *zero* chrome in the
   reading column. Maggie has one collapsed control. You have a persistent sidebar TOC, a reader
   menu, a progress bar, and 19 top-level sections around one body of writing. Your "highly
   convenient" instinct produced furniture, and furniture is anti-pacing: every control is a
   decision the reader has to decline.
2. **Dark.** Eight for eight are light. Discussed in Part 4.
3. **Small type.** Discussed above.
4. **The rule under every h2.** `CustomPortableText.tsx:107` puts `border-b border-white/5 pb-4` on
   every h2. None of the references rule their headings. It converts every section start into a
   horizontal line, which flattens rather than paces.
5. **Uppercase mono micro-labels.** 114 instances of sub-12px text across the blog. None of the
   references use a mono micro-label system at all.
6. **The blockquote is dimmer than the body** (`text-stone-400` against `stone-300` body). A pull
   quote that recedes is backwards.

---

## Part 2 — Pacing (most of the work)

Values, not adjectives. All of this is CSS and Tailwind classes; none of it is new architecture.

### Type scale

Current ratios are 1.50 / 1.25 / 1.28 / 1.33 — four steps, four ratios. Proposed: **a single 1.25
(major third) anchored on a 19px body.** It happens to land h1 exactly where it already is.

| Step | Now | Proposed |
| --- | --- | --- |
| body | 15px | **19px** |
| h4 | 20px | **24px** |
| h3 | 25.6px | **30px** |
| h2 | 32px | **38px** |
| h1 | 48px | **48px** (unchanged) |

19px is already in your scale — `FONT_SIZES[2]`, labelled **L**. So this is not a new value: it is
`DEFAULT_SETTINGS.fontSize: 1 → 2`, plus the D1 null fix. Two lines.

### Measure, line height, rhythm

| Property | Now | Proposed | Why |
| --- | --- | --- | --- |
| `--article-fs` | 15px (bug) | 19px | Field median is 19–20. |
| line-height | 1.85 | **1.70** | 1.85 at 19px is 35px — loose enough to break the block. 1.70 = 32px, between Craig (1.50) and Maggie (2.00). |
| standard width | 36rem / 576px | **40rem / 640px** | ~70 CPL at 19px. |
| narrow width | 32rem | **34rem** | ~60 CPL. |
| wide width | 44rem | **46rem** | ~80 CPL, matches Craig. |
| paragraph gap | 1.6em | **1.5em** | Craig 30px@20, Maggie 33px@22 — both 1.5em. |
| `hyphens` | none | **`auto`** on `[data-article] p` | The single cheapest change that makes prose look set rather than flowed. |

### Space around things

The pacing lever. Values in `rem` so they hold across font-size settings.

| Element | Now | Proposed |
| --- | --- | --- |
| h2 margin-top | 4rem (`mt-16`) | **5rem** |
| h2 margin-bottom | 1.25rem + `pb-4` + rule | **1.25rem, rule removed** |
| h3 margin-top | 2.5rem | **3rem** |
| h4 margin-top | 2rem | **2.25rem** |
| blockquote margin | 2.5rem | **3.5rem**, left border removed, colour → `stone-200`, size 1.15em |
| figure margin | 2rem | **4rem** — Ciechanowski's device, and the cheapest way to make images feel placed |
| section break | unused | **5rem above / 4.5rem below**, 96px centred rule at `rgba(255,255,255,0.18)` |

**The section break already exists.** `components/blog/SectionBreak.tsx` is wired into
`CustomPortableText.tsx:243` as the `sectionBreak` Portable Text type. Neither published post uses
it. This is the highest-value *content* action available: adding two or three section breaks to an
existing post costs nothing in code and is the clearest pacing device in the reference set.

### Code

`V6` — multi-line inline code renders as ragged stacked boxes. Two fixes, both small:

- Inline: drop the background entirely; set `font-size: 0.9em`, colour `stone-200`. If the
  background stays, `box-decoration-break: clone` at minimum. (Craig's approach is no background.)
- Blocks: 1px border `white/10`, fill `#0d0d0d`, `padding: 1.25rem`, `line-height: 1.5`. Steph
  Ango's pattern. The real fix for the `systeminfo` output is content — it should be a fenced block
  in Sanity, not inline code inside a list item.

---

## Part 3 — Continuity

Holding you to **your own** definition: *removing the jolts, so nothing breaks immersion.* That
reading is subtractive and cheap. The expensive reading — building shared-element transitions — is
not supported by any reference site here, and I'd rather not sell it to you.

| Jolt | Cause | Fix | Cost |
| --- | --- | --- | --- |
| **Text reflows smaller on every article load** | D1: server renders 17px, client writes 15px inline after hydration | The D1 fix | free, already counted |
| **Theme flash** | Settings hydrate post-mount, so a saved terminal theme flips in after paint | Tiny blocking inline script in `<head>` that reads the same `sp_*` keys and sets the class before first paint — the standard dark-mode-flash pattern | ~20 lines |
| **Reader menu appears from nowhere** | No transform-origin, no transition | `transform-origin: top right`, scale `0.96 → 1` + opacity over 180ms `ease-out-expo`; on mobile, translate up from the bottom edge | ~10 lines CSS |
| **Reader menu bottom edge cuts mid-glyph** | `max-h-[70vh]` + `overflow-y-auto`, no affordance | Add a mask-image fade at the bottom | 2 lines |
| **No backdrop on the mobile sheet** | — | `bg-black/40` scrim, fade 150ms | 3 lines |
| **Orphaned TOC minute labels beside the open panel** | Panel is narrower than the TOC rows behind it | Widen panel to match, or dim the TOC while open | small |
| **Route change is a hard cut** | `animate-page-enter` is a blanket 400ms fade on everything | Scope the enter animation to the article body only, so persistent chrome doesn't re-fade | small |

**TOC persistence** is worth naming as *not worth doing*. Making the sidebar TOC survive navigation
between articles means hoisting it into a layout, but its contents are per-article, so it would
have to re-render anyway. The gain is nil.

**Is `lib/motion.ts` the right foundation?** Partly. Keep `EASE` and `DURATION` — they're already
mirrored in `tailwind.config.ts` and every value above should reference them. Do **not** build this
layer on the framer-motion variants (`fadeUp`, `staggerChildren`): every item in the table is a CSS
transition, and pulling framer-motion onto the article page for them would add JS to solve a
stylesheet problem. Its six current importers are learning-block components that don't render for
either published post, so the library is already close to dead weight on this route.

If you later want card→article continuity, the right tool is the **View Transitions API** (CSS-only,
no library), not framer-motion layout IDs. Next.js 16 supports it. But it is not in this proposal —
it's additive, and the references don't need it.

---

## Part 4 — Atmosphere (subtractive only)

**Remove first:**

1. **D7** — stop auto-focusing search. Fixes the hierarchy problem at its source.
2. **The rule under every h2.** One line.
3. **The featured card's three stacked badges** (`FEATURED` / `NETWORK & INFRASTRUCTURE` /
   `PERSPECTIVE`). Keep one.
4. **The uppercase mono micro-label system.** 114 sub-12px instances. Raise everything to 12px
   minimum and cut the count hard — the stats column setting numbers at 10px mono is illegibility
   used as texture.
5. **"0 series."** Don't advertise a zero; hide the row when the count is 0.
6. **The double taxonomy treatment.** Index uses uppercase mono, article uses sentence-case pills,
   for identical values. Pick the pill.
7. **The 28 glyph arrows** (`→`, `✕`, `↑`) alongside the mandated lucide set.

**Then, and only then, one addition:** warm the ground. Every light reference is a warm off-white,
not pure white. The dark equivalent of `#fffcf0` is not `#0a0a0a` — it's a near-black with a trace
of warmth, e.g. `#0b0a09`. It is a two-character change and it is the whole of what I'd add.

Leave `BlogBackground`'s two radial gradients alone. They're already restrained and they're the
only atmosphere on the page.

---

## Part 5 — Where your direction is wrong

You asked. Three things.

**1. The dark palette is the biggest single obstacle to what you described, and you should decide
that deliberately rather than by inheritance.**

Eight of eight reference sites are light. That is not a coincidence of my sampling — it's that the
qualities you named ("takes its time", "digesting", "considered") depend on generous line-height and
open space, and on a dark ground generous space reads as *void* rather than *air*. Your own capture
set demonstrates it: the most striking frame in the whole critique is `1440/post-theme-green.jpg`,
striking because half the screen is empty black.

I am not telling you to abandon dark — it's the site's identity and it works on the index, the
graph, and the photography. But there are only two honest options:

- **Keep dark and pay for it:** 19px minimum, line-height no looser than 1.7, body text at
  `stone-300` not `stone-400`, and a warm near-black. Dark reading demands larger type than light
  reading for the same comfort; the current 15px is roughly two steps too small for its ground.
- **Or make the article route light and leave everything else dark.** This is the option I'd
  actually recommend and the one you'll like least. You already have the machinery — `theme-*` on
  the article element, plus D5's fix to widen its scope. A warm `#fffcf0`-family reading theme,
  default on `/blog/[slug]` only, would put you in the same room as every site you're aiming at,
  and the dark archive would still frame it.

I'd rather flag this now than have you spend five sessions on typography and find the ceiling was
the background all along.

**2. Continuity probably belongs third, not second.**

By your own definition it's jolt-removal, and the whole table in Part 3 costs less than one session.
Meanwhile the atmosphere layer contains D7, which is currently the most visually damaging single
thing on the page. Reorder to pacing → atmosphere-subtraction → continuity.

**3. "Highly convenient" and "takes its time" are in tension, and convenience has been winning.**

Not one reference site has a reader menu. One of eight has a table of contents, collapsed. You have
both, plus a progress bar, plus 19 sections of which 12 don't render for either published post. The
reader menu is genuinely good work — the mobile sheet and the high-contrast mode are the best-built
things in the section — but every control is furniture in the reading room. Consider collapsing the
TOC to Maggie's marginal control, and treating the reader menu as a preference panel reachable from
one place rather than a persistent sidebar fixture.

---

## Part 6 — Sequencing and estimates

Each block is scoped to be reviewable on its own.

| # | Block | Scope | Est. | Supported as-is? |
| --- | --- | --- | --- | --- |
| **1** | **Type and rhythm** — D1 null fix, default → L, the 1.25 scale, measure 40rem, LH 1.70, para 1.5em, `hyphens: auto` | `ArticleProvider.tsx`, `styles/article.css`, `CustomPortableText.tsx` | **½ session** | Yes. Values only. |
| **2** | **Subtraction** — D7 autofocus, h2 rule, badge reduction, 12px floor, "0 series", taxonomy unification, glyph→lucide | `SearchModal.tsx`, `CustomPortableText.tsx`, `BlogDirectory.tsx` | **1 session** | Yes. |
| **3** | **Space and blocks** — heading margins, blockquote, figure margins, code inline+block (V6) | `styles/article.css`, `CustomPortableText.tsx` | **½ session** | Yes. |
| **4** | **Continuity** — theme-flash script, reader-menu origin + mask + scrim, scoped route enter | `app/layout.tsx`, `ReaderMenu.tsx`, `PageTransition.tsx` | **1 session** | Yes. |
| **5** | **Header and lead-in** — D4 h1 measure, mobile chrome reduction, TOC → collapsed marginal control | `BlogArticleHeader.tsx`, `ArticleToc.tsx` | **1 session** | Mostly. TOC collapse is a component rewrite. |
| **6** | **D5 theme scope** — move theme class to `#content`, re-scope selectors | `ArticleProvider.tsx`, `styles/article.css` | **½–1 session** | Yes, but touches every themed selector. |
| **—** | **Studio / content** — delete the two dead reference links, add section breaks to both posts, replace the stock featured image and the markdown-screenshot hero, fix `--` → em dash | Studio only | **1 sitting** | n/a |
| **7** | *If you choose it:* light reading theme for `/blog/[slug]` | after #6 | **1–2 sessions** | Needs #6 first. |
| **8** | *Optional, additive:* View Transitions card→article | new | **1–2 sessions** | Needs restructuring. Not recommended yet. |

**One session:** blocks 1 and 3 together, or block 2 alone.
**Five sessions:** blocks 1–6, which is the whole proposal minus the light-theme question.

### Needs restructuring, flagged plainly

- **Block 5's TOC collapse** — `ArticleToc` currently renders two variants (sidebar + mobile
  `<details>`). Collapsing to a marginal control means one component with one behaviour.
- **Block 6** — theme selectors are written against `[data-article]` throughout `styles/article.css`;
  moving the scope touches all of them at once. Low risk, but not a two-line change.
- **Block 8** — shared-element transitions need matching DOM between card and article header.
- **The chrome ratio** — 19 sections around one body of writing is a structural choice. Nothing in
  blocks 1–6 changes it; only deleting sections does.

---

## Part 7 — The recommendation

Do **block 1 first and stop**. It is half a session, it is entirely values, and it fixes the
font-size bug, the reflow jolt, the measure, the line height and the type scale in one pass. Look at
it for a week before committing to the rest — everything downstream is calibrated against how 19px
at 1.70 on `#0a0a0a` actually feels, and I can't tell you that from a screenshot.

Then answer the dark-ground question in Part 5, because blocks 3, 5 and 6 are all cheaper to do once
than twice.

And the standing note from the last three sessions still applies: three posts, nineteen sections of
chrome. Block 1 makes the writing better to read. It doesn't make there be more of it.
