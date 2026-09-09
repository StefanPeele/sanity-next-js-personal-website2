# Two decisions, made decidable — 2026-09-09

Rendered against production by injecting CSS at runtime. **No application code was changed.**
Every option below is a real screenshot of the real article, not a mockup.

---

## Decision 1 — the h1 measure (D4)

**First, a correction.** My proposal said to add `text-balance`. It is already there:
`styles/index.css:21` applies `text-wrap: balance` to every `h1`–`h6`. That is why option B
below is byte-identical to the baseline. Balance is not the missing lever — **width is**. Balance
can only choose better break points inside the width it is given, and 576px is too narrow for this
title at 48px.

Second correction: `max-width` alone cannot help. The h1 sits inside a `max-w-[36rem]` wrapper, so
a larger `max-width` on the child still resolves to the parent's 576px. The headline needs an
explicit `width` to exceed its parent — which it may do, because the parent does not clip.

### The options, measured

| Option | What changes | 1440 | 768 | 390 |
| --- | --- | --- | --- | --- |
| **A — baseline** | nothing | 48px, 576px, **4 lines**, 192px tall | 36px, 3 lines | 30px, 4 lines |
| **B — `max-w` only** | `lg:max-w-[44rem]` on the h1 | identical to A | identical | identical |
| **C — widen** | `lg:w-[52rem] lg:max-w-none` on the h1 | 48px, 832px, **3 lines**, 144px | unchanged | unchanged |
| **D — widen + 40px** | C plus `lg:text-[40px]` | 40px, 832px, **2 lines**, 80px | unchanged | unchanged |

No horizontal overflow in any option — the widening is gated at `lg`, so tablet and mobile keep the
prose measure and are untouched by both C and D.

### What they look like

`d4-A-1440.jpg` · `d4-C-1440.jpg` · `d4-D-1440.jpg` (and `-768`, `-390` for each)

- **A** breaks as `Building My Physical / Home Lab -- Week / 2: Documentation & / Extensive
  Researching`. "Week" and "2:" are split across a line.
- **C** breaks as `Building My Physical Home / Lab -- Week 2: Documentation / & Extensive
  Researching`. The split is gone, the headline keeps its 48px presence, and it now extends past
  the prose column — which reads as deliberate asymmetry rather than a wrapping accident.
- **D** breaks as `Building My Physical Home Lab -- Week 2: / Documentation & Extensive
  Researching`. Two lines, tightest block, but the display type loses about a fifth of its size.

### Recommendation

**C.** It fixes the defect without shrinking the display type, and it is one class on one element.
D is also correct and is the better choice only if you want the header block compressed; it buys
64px of vertical space at the cost of headline presence.

**Cost:** C is a one-line change in `components/blog/BlogArticleHeader.tsx`. D is the same line plus
a font-size. Either is minutes.

**What could break:** a much longer title would still wrap to 4 lines at 832px — this fixes the
measure, not every possible title. Nothing else in the header moves, because only the h1 changes.

**Not fixed by either:** the literal `--` in the title. That is content, in Sanity.

---

## Decision 2 — chrome in the reading column

### What the reference sites actually do

| Site | In the reading column |
| --- | --- |
| craigmod.com | nothing |
| linear.app/blog | nothing |
| ciechanow.ski | nothing |
| stephango.com | nothing |
| maggieappleton.com | one collapsed control in the margin |
| gwern.net | sidenotes |
| docs.stripe.com | persistent nav + TOC — but its job is lookup, not reading |
| **this site** | **TOC + reader menu + progress bar** |

### The configurations, measured at 1440

| Config | Chrome | Prose x | Prose width | Space right of prose |
| --- | --- | --- | --- | --- |
| **1 — current** | full TOC list, reader menu, progress bar | 298 | 576 | 566 |
| **2 — collapsed** | "Contents" + reader-menu chip only, no list, no progress bar | 298 | 576 | 566 |
| **3 — none** | nothing | 266 | 640 | 534 |

Screenshots: `chrome-1-current.jpg`, `chrome-2-collapsed-toc.jpg`, `chrome-3-no-chrome.jpg`.

### Config 1 — keep everything

**Costs the reader:** three persistent objects competing with the prose, and 566px of the viewport
given to a 220px sidebar that is empty above y≈760.
**Costs to build:** nothing.
**Verdict:** this is the docs.stripe.com shape, and this is not a documentation site.

### Config 2 — collapse the TOC to a marginal control *(recommended)*

Maggie Appleton's pattern. The TOC becomes a small "Contents" affordance that expands on demand;
the reader menu stays where it already is, beside it; the progress bar goes.

**Costs the reader:** one extra click to reach the heading list. Nothing else.
**Costs to build:** ~1 session. `ArticleToc` currently renders two variants — a sidebar and a mobile
`<details>` — and this collapses them to one behaviour at both breakpoints. The reader menu already
lives in that row, so it does not need re-homing. This is the only option that keeps every current
capability.
**What could break:** the `data-toc="sidebar"` / `data-toc="mobile"` distinction is asserted by the
Playwright suite ("keeps one TOC per breakpoint"), so that test needs updating with the component.

### Config 3 — remove it entirely

**Costs the reader:** no in-page navigation, and the reader menu loses its home — theme, text size,
width, and the four accessibility toggles would all need somewhere else to live. That is the real
cost, and it is not small: the accessibility modes are the best-built thing in the section.
**Costs to build:** ~1–2 sessions, most of it re-homing the reader menu rather than deleting the TOC.
**Measured caveat:** removing the TOC does *not* centre the prose. It moves from x=298 to x=266 and
still leaves 534px to its right, because the centring is done by the `max-w-6xl` container, not the
sidebar. Config 3 therefore needs a container change too, or it just shifts the imbalance.

### Recommendation

**Config 2.** It gets the reading column to one quiet control — matching the only reference site
that keeps anything at all — without losing the accessibility work. Config 3 is the purer answer and
the right one eventually, but only after the reader menu has a home that is not the TOC.

**Sequencing note:** do Decision 1 first. It is minutes and independent. Config 2 is a component
rewrite and should be its own session.
