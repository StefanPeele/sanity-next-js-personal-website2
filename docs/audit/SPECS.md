# Implementation-ready specs — 2026-09-09

Five items that were previously headings. Each has values, file paths, an approach, a cost and a
break risk. **None of these are implemented.** Measured against `1b0fb5b`.

---

## a. The 12px floor

### What is actually there

328 sub-12px instances. Broken down by *purpose*, not just size:

| Purpose | Count | Sizes |
| --- | --- | --- |
| **Mono micro-label** (`font-mono` + `uppercase` + `tracking-[…]`) | **232** | 9px ×94, 10px ×75, 8px ×50, 7px ×7, 11px ×6 |
| Plain small text (no mono, no uppercase) | 91 | 9px ×40, 10px ×33, 8px ×10, 11px ×8 |
| Mono without uppercase | 5 | — |

**71% is one idea spelled 232 ways.** That is the real finding: this is not 328 independent
decisions, it is one missing primitive plus ~96 genuine one-offs.

**Correction to my earlier note:** I implied `.section-label` was the home for these. It is not —
`styles/index.css` defines it as **serif, 1.05rem, weight 600, no tracking, no uppercase**, used 37
times. It is a *section heading*, already correct, and unrelated to micro-labels.

### The policy

Add one utility beside `.section-label` in `styles/index.css`:

```css
.meta-label {
  font-family: var(--font-mono), ui-monospace, monospace;
  font-size: 0.75rem;        /* 12px — the floor, not a suggestion */
  letter-spacing: 0.12em;    /* replaces 8 different tracking values */
  text-transform: uppercase;
  color: rgb(168 162 158);   /* stone-400 */
}
```

Then map by purpose, not by current size:

| Current | Becomes | Why |
| --- | --- | --- |
| Mono micro-label at 8–11px, any tracking (**232**) | `.meta-label` | One class, one size, one tracking |
| Plain small text at 11px (**8**) | `text-xs` (12px) | Smallest legitimate body-adjacent size |
| Plain small text at 9–10px (**73**) | `text-xs` (12px) | Same |
| Plain small text at 8px or below (**10**) | **delete the element** | At 8px on `#0a0a0a` it is texture, not information. If the datum matters it deserves 12px; if it does not, it should not render. |
| Mono without uppercase (**5**) | `text-xs font-mono` | Keep the face, raise the size |

### Where

Top offenders, all of which render: `GardenClient` 27, `LearningBlocks` 24, `KnowledgeGraph` 20,
`ServicePackages` 19, `SearchModal` 19, `MediaCard` 14, `LibraryClient` 14, `CredibilitySection` 13,
`BlogDirectory` 12, `PacketAnimator` 9.

**`/graph` is the worst page on the site and needs its own pass** — 50 sub-12px elements render
there, against 6–9 on every other route.

### Cost and risk

**2 sessions.** One for the utility plus the 232 mechanical swaps, one for the ~96 judgement calls
and the `/graph` pass.

**What could break:** `.meta-label` at 12px with 0.12em tracking is *wider* than the same text at
9px with 0.3em. Badges, table cells and the card meta row will reflow. The blog card's read-time
("3 MIN") sits beside a 12px pill and will need to become a pill or a `.meta-label`, not stay mono
at 9px. Expect a layout pass on cards, not just a find-and-replace.

---

## b. Button and Label primitives

### What is there

No button primitive. **25+ distinct padding combinations** — `px-4 py-3` ×14, `px-3 py-1.5` ×14,
`px-3 py-2` ×10, `px-2 py-1` ×8, `px-5 py-3` ×7, `px-4 py-2` ×7, `px-2 py-0.5` ×7, `px-6 py-4` ×6 …
each paired with an ad-hoc border, radius and colour. Radius splits four ways: `rounded-sm` ×127,
`rounded-full` ×77, `rounded-lg` ×55, `rounded-xl` ×53.

### The API

`components/ui/Button.tsx`:

```tsx
type Variant = 'primary' | 'secondary' | 'ghost' | 'chip'
type Size    = 'sm' | 'md' | 'lg'

const VARIANT = {
  primary:   'bg-white text-black border border-white hover:bg-stone-200',
  secondary: 'border border-white/15 text-stone-200 hover:border-white/30 hover:bg-white/[0.04]',
  ghost:     'text-stone-300 hover:text-white',
  chip:      'rounded-full border border-white/10 text-stone-300 hover:border-white/30',
}
const SIZE = {
  sm: 'text-xs px-3 py-1.5 min-h-[32px]',    // the taxonomy pill, filter chips
  md: 'text-sm px-4 py-2.5 min-h-[40px]',    // default
  lg: 'text-base px-6 py-3.5 min-h-[48px]',  // page-level CTA
}
// radius: rounded-full for `chip`, rounded-lg for everything else. Two, not four.
// every variant composes FOCUS from lib/ui.ts
```

### Migration map

| Current call sites | Variant / size |
| --- | --- |
| Filter chips, taxonomy pills, reader-menu chips (`px-3 py-1.5`, `rounded-full`) | `chip` / `sm` |
| Newsletter and booking submits, "Read" CTAs (`px-5 py-3`, `px-6 py-4`) | `primary` / `lg` |
| Card and panel actions (`px-4 py-2`, `px-4 py-3`) | `secondary` / `md` |
| Icon-only and text-only controls (`px-2 py-1`, `p-2`) | `ghost` / `sm` |

`Label` is smaller and is really the `.meta-label` utility from (a) — a CSS class, not a component,
because it is only ever applied to a `<span>`.

### Cost and risk

**1 session** to build the primitive and migrate the ~40 clearest call sites; a second to finish.
Do it *after* (a), because `SIZE.sm` bakes in the 12px floor.

**What could break:** `min-h` on every size changes the vertical rhythm of chip rows — the blog
filter bar has three rows and will grow. Nothing is currently below 24×24 except one intentional
1×1 `sr-only` button, so tap targets improve rather than regress.

---

## c. Border and background consolidation

### What is there

**58 border tokens, 53 background tokens.** The heads dominate and the tails are one-offs:

```
borders     white/10 ×93   white/5 ×91   white/[0.08] ×40   white/30 ×37
            white/20 ×18   white/15 ×14  stone-700 ×14      + 51 more
backgrounds white ×30      white/[0.02] ×27  white/5 ×23    [#111] ×15
            stone-200 ×13  stone-900 ×11 [#0a0a0a] ×11      + 47 more
```

Near-black alone is spelled three ways: `#0a0a0a`, `#0f0f0f`, `#111`.

### The palette

Six tokens, in `tailwind.config.ts` under `theme.extend.colors`, named by role:

| Token | Value | Replaces | Use |
| --- | --- | --- | --- |
| `edge-faint` | `rgb(255 255 255 / 0.05)` | `white/5`, `white/[0.04]`, `white/[0.06]` | section dividers |
| `edge` | `rgb(255 255 255 / 0.10)` | `white/10`, `white/[0.08]` | default card and control border |
| `edge-strong` | `rgb(255 255 255 / 0.20)` | `white/15`, `white/20`, `white/25`, `white/30` | hover and active borders |
| `surface` | `#0a0a0a` | `[#0a0a0a]` | page ground |
| `surface-raised` | `#111111` | `[#111]`, `[#0f0f0f]`, `stone-900` | panels, sheets, code blocks |
| `surface-veil` | `rgb(255 255 255 / 0.02)` | `white/[0.02]`, `white/[0.03]` | faint fills inside cards |

58 + 53 → **6**, plus the semantic accents (lane colours, `amber-*`, `emerald-*` for review states)
which stay as they are because they carry meaning.

### Cost and risk

**1–2 sessions**, mechanical but wide (roughly 400 occurrences).

**What could break:** collapsing `white/5` and `white/10` into two steps changes contrast on nested
cards that currently rely on a third intermediate value — the reading-strip and notes-strip panels
sit on `white/[0.02]` inside a `white/10` border and will flatten slightly. Check nested surfaces
visually rather than trusting the diff.

---

## d. Site-wide type scale

### What is there

**26 distinct sizes.** Named Tailwind steps (`text-sm` ×157, `text-xs` ×75, `text-base` ×38,
`text-lg` ×28, `text-2xl` ×23, `text-3xl` ×21, `text-4xl` ×20, `text-5xl` ×19, `text-6xl` ×17,
`text-xl` ×16, `text-7xl` ×5) plus 15 bracketed one-offs, of which six are the article scale
shipped in `5c7cca4` and the rest are sub-12px or stragglers (`text-[17px]`, `text-[15px]`,
`text-[13px]`).

### Should the 1.25 article ratio extend site-wide?

**Partly, and not by extending upward.** The article scale is 19 / 24 / 30 / 38 / 48 on a 1.25
ratio. Continuing upward gives 60 / 75 / 94, but `text-6xl` (60px) and `text-7xl` (72px) are used 22
times on page headers and hero titles where the job is impact, not reading rhythm — forcing them
onto the ratio buys nothing and would resize every page header.

Proposed: **one scale for reading, a short display set above it.**

```
reading   12  14  16  19  24  30  38  48        (1.25 from 19, plus 12/14/16 below)
display   60  72                                 page headers and hero titles only
```

That is 10 sizes, replacing 26. The bracketed one-offs map: `text-[17px]`→16, `text-[15px]`→14,
`text-[13px]`→12, and every sub-12px value is handled by (a).

### Cost and risk

**1 session** after (a), because the sub-12px removals take 328 of the occurrences out first.

**What could break:** `text-sm` is 14px and used 157 times — it stays. The visible change is
`text-base` 16px → unchanged, and `text-lg` 18px → 19px, which nudges 28 call sites into line with
the article body. Low risk, wide diff.

---

## e. D5 — theme scope at page level

### The mechanical part

`ArticleProvider.tsx:257` applies the theme class to `document.querySelector('[data-article]')`.
Move it to `#content` (or `documentElement`), and re-scope the **40** theme/a11y selectors in
`styles/article.css` — 17 `theme-terminal`, 13 `a11y-high-contrast`, 10 `a11y-dyslexia`.

### The open question, answered

Today `theme-terminal` colours only the prose, so the article becomes a green-on-dark rectangle
while the TOC, navbar, footer and page ground stay in the default theme. Proposed values so the
theme covers the page:

| Surface | Default (archive) | Terminal | High contrast |
| --- | --- | --- | --- |
| page ground | `#0a0a0a` | `#0d1117` | `#000000` |
| raised surface | `#111111` | `#0f1620` | `#0a0a0a` |
| body text | `stone-200` | `rgb(0 255 65 / 0.82)` | `#ffffff` |
| headings | `#ffffff` | `#00ff41` | `#ffffff` |
| meta / secondary | `stone-400` | `rgb(0 255 65 / 0.55)` | `#d4d4d4` |
| borders | `white/10` | `rgb(0 255 65 / 0.18)` | `#ffffff` at 0.4 |
| links | `#ffffff` | `#00ff41` | `#ffff00` |
| focus ring | `amber-400` | `#00ff41` | `#ffff00` |

Implement by having each theme redefine the six palette tokens from (c) rather than restating 40
selectors. That is the reason to do (c) first: with role tokens, a theme is six overrides.

### Cost and risk

**1 session if (c) is done first, 2 if not.**

**What could break:** the navbar and footer are shared with non-article routes, so the theme class
must be scoped to the article route only or a saved terminal theme will leak sitewide. `BlogBackground`
is `fixed inset-0 -z-20` behind everything and would need to become theme-aware or be hidden under a
non-default theme. And the focus ring changing colour per theme interacts with `lib/ui.ts` — it
would have to become a token rather than a literal class string.

---

## Suggested order

`a` → `c` → `b` → `d` → `e`. Each one makes the next cheaper: the floor removes 328 occurrences
before the scale pass, the palette turns the theme work from 40 selectors into 6 overrides, and the
button primitive depends on the floor for its `sm` size.

### Status, 2026-09-10

`a` shipped `5370ca9`, `c` shipped `1fef26f`, `e` shipped `c4ca8c9`, `b` shipped this session — see
`SECTION-LOG.md`, which records where the built primitive departs from the spec above (no
`<Button>` component, no `ghost` variant, `chip` selected on tokens rather than a white fill, and
`NewsletterForm` left out). **Only `d`, the site-wide type scale, is still open.**
