# Reading experience and visual language — research and specification

6 September 2026. Works from `2026-09-full-inventory.md` (site-wide measurements and Recommended
Cuts) and `2026-09-services-audit.md`. **No code changes.** Everything here is a specification a
later session executes.

Your four goals, referenced throughout as **G1–G4**:

| | Goal | Current state (inventory §2) |
| --- | --- | --- |
| G1 | Blog | 2 posts |
| G2 | Library | **0 items** |
| G3 | Projects + resume | Populated |
| G4 | Photography services | Populated; worst mobile page (9,923px) |

---

# PART 1 — What good looks like

**Sourcing.** `gwern.net/design` and `maggieappleton.com/garden` were fetched and their techniques
are quoted from what those pages state about themselves. The other six could not be verified by
fetching — their homepages carry no implementation notes — so those entries describe techniques
from familiarity with the sites and are marked *(unverified)*. Costs are estimates against **this**
codebase, and those I do stand behind: they come from the file-level survey in the inventory.

### gwern.net — annotation density, epistemic status, backlinks *(fetched)*

| Technique | What it actually is | Cost here |
| --- | --- | --- |
| **Link popups** | A custom JS library (`popups.js`) keyed on unique per-link IDs, backed by a separate annotation database, partly auto-populated from Wikipedia/arXiv. Recursive — you can hover a link inside a popup. | **You already have 80% of this.** `GlossaryTerm` hover cards exist and `/glossary` is empty. Populating 20–30 terms is content work, not engineering: **0 sessions of code, 1–2 of writing.** Extending popups to internal post links is ~1.5 sessions. |
| **Epistemic status block** | YAML frontmatter → compile-time HTML: created/modified dates, confidence, importance 0–10, status (notes / in progress / finished). Rendered above the abstract. | Directly transferable and **the highest-value idea in this document for G1**. You have `note.status` taxonomy already. Adding `confidence` + `importance` to the `post` schema and a header block: **1 session.** |
| **Backlinks with transcluded context** | Nightly batch job over URL+ID pairs; renders the *linking snippet*, not just the link, so relevance is visible without clicking. | `Backlinks.tsx` exists but shows links only. Adding the surrounding sentence needs the excerpt captured at build: **1.5 sessions.** Worth it only once G1 has ~10 posts. |
| **Sidenotes** | Markdown footnotes → margin notes on wide screens via `sidenotes.js`, degrading to floating footnotes on narrow. | Real cost: your article body is Portable Text, so this is a `CustomPortableText` mark plus a layout column. **2 sessions.** Defer — it competes with the TOC for the same margin. |
| **Progressive enhancement** | "JavaScript is *not* required for the core reading experience." | A useful test to adopt, not a feature to build. Your article page currently fails it: the TOC, reader menu and progress bar are all client components. |

### notes.andymatuschak.org — sliding panes *(unverified)*

Notes open as horizontally stacked columns rather than replacing the page, with the open stack
encoded in the URL so a chain of notes is shareable; on narrow screens it collapses to one column.

**Cost here: 2 sessions and a restructure of `/garden/[slug]` into a stack-aware route, plus URL
state.** **Do not do this.** It is the single most expensive idea in this document, it only pays
off at high note density and interlink counts, and `/garden` currently has **zero notes**. Revisit
if the garden ever passes ~40 interlinked notes.

### maggieappleton.com — digital garden conventions *(fetched)*

Three maturity stages (**Seedling / Budding / Evergreen**) exposed as *filters*, not just badges;
each entry shows content type, relative age ("about 2 months ago"), and topic tags; filtering works
across topic, type and growth stage together.

**You have already built all of this** — `garden/status.ts`, the status taxonomy, tag filters,
`GrowthTimeline`. The gap is content, not capability. Two transferable refinements: **relative
dates** ("tended 2 months ago") read as honesty where absolute dates read as staleness — **0.25
sessions** using `lib/dates.ts`; and stage-as-filter rather than stage-as-badge, which you have.

### ciechanow.ski — interactive explainers *(unverified)*

Bespoke canvas figures interleaved with prose at the exact paragraph that needs them, each one
user-driven rather than scroll-driven, and each earning its place by showing something prose cannot.

**Cost: each figure is 1–3 sessions of bespoke work.** The honest read: `LayerExplorer` and
`PacketAnimator` are already your version of this, and they are genuinely the most distinctive
thing on the site. Do not build more of them until G1 has the posts to hang them on. The
transferable discipline is the rule, not the code: *a figure must show something the paragraph
cannot say.*

### joshwcomeau.com — typography and embedded interactivity *(unverified)*

Generous body size (~19–21px) with a measure around 65 characters, comfortable line height, and
interactive widgets embedded mid-article. Motion is used deliberately and reduced-motion is
respected as a first-class state, not an afterthought.

**Directly applicable and cheap. Your body text is 14px and 16px with no rule** (inventory §4).
Moving article body to 18–19px with a 66ch measure is **0.5 sessions** and is the largest
readability gain available for G1. See Part 3.

### stripe.com/docs — information architecture *(unverified)*

Persistent left-hand navigation showing where you are in the whole tree, content in the middle,
and a contextual right column. The valuable part is that the reader always knows the shape of the
thing they are inside.

**Applicable to G2, not to the blog.** A library of 0 items has no shape to show. Once G2 has ~30
items, a persistent facet rail is **1.5 sessions**. The side-by-side code/prose layout is not
relevant to your content.

### linear.app/changelog — short-form technical writing *(unverified)*

Dated entries, one idea each, heavy restraint: few type sizes, almost no chrome, no decoration
competing with the text.

**The most relevant model for `/now` and for G3.** Costs nothing to adopt — it is a constraint, not
a feature. Compare against your own `/uses` (4,140px at 390) and `/services` (9,923px).

### every.to — subscription reading experience *(unverified)*

Clear article/author hierarchy, a subscription ask that arrives after the reader has had something,
and consistent typographic rhythm across a multi-author catalogue.

**Applicable to the newsletter placement.** Your newsletter form currently sits in the article
footer, which is correct. No work needed; note `settings.newsletter.successMessage` is a dead field
(inventory §3b).

### What Part 1 actually concludes

Three of the eight ideas are worth doing, and all three are cheap: **epistemic status on posts (1
session)**, **article body typography (0.5)**, and **relative dates in the garden (0.25)**. Two more
— glossary popups and backlink context — are already 80% built and blocked on content, not code.
The expensive ideas (sliding panes, sidenotes, more interactive figures) are all blocked on content
density this site does not have. **The binding constraint on reading experience here is that there
are two articles, not that the reading experience lacks features.**

---

# PART 2 — Motion specification

## 2.1 The specification

**Principle.** Motion exists to explain a change of state — where something came from, what it
became, what is still loading. Motion that decorates a static thing has no job. *An animation the
reader consciously notices has usually failed.*

### Named scale

Already defined in `lib/motion.ts` and mirrored in `tailwind.config.ts:22-32`. **Keep these
exactly; the problem is not the tokens, it is that components ignore them.**

| Token | Value | Use |
| --- | --- | --- |
| `duration-fast` | 180ms | Hover, focus, toggle — anything the pointer drives |
| `duration-base` | 400ms | Enter, disclosure, route change |
| `duration-slow` | 700ms | Deliberate, rare; SVG draw only |
| `ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Enter — arrives fast, settles |
| `ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | Large surfaces |
| `ease-in-out-quart` | `cubic-bezier(0.65, 0, 0.35, 1)` | Reversible state (toggles) |
| `STAGGER` | 60ms | Between siblings, **max 5 items**, then flat |

**Rule: no numeric duration or cubic-bezier may appear inline in a component.** Every current
violation is listed in 2.3.

### On page enter
One thing: the route container fades and rises 8px, `duration-base`, `ease-out-expo`
(`animate-page-enter`, already implemented in `PageTransition.tsx`). Nothing inside it animates
separately. Rationale: a single enter reads as the page arriving; twelve staggered enters read as
the page assembling itself, which is slower to read and impossible to skim.

### On scroll
**Default: nothing.** Scroll-triggered animation is permitted in exactly one case: a
first-view-only fade-up on media-heavy grids where images pop in anyway (`CinematicGallery`).
Threshold: fire once at 15% visible, `once: true`, never reverse, never on text.
Text must never animate on scroll — it is unreadable while moving and it fights find-in-page.

### On hover
Colour and border only, `duration-fast`. Movement is capped at **2px** and is only for genuinely
liftable objects (cards linking somewhere). No scale on text, no shadow blooms, no letter-spacing
changes. Hover styling must never be the only signal — it needs a focus-visible twin.

### What never animates
Body text · headings · the type scale (size, weight, letter-spacing) · page height on scroll ·
anything above the fold on first paint · anything the reader is actively typing into · progress
bars that jump backwards · layout of a form the user is filling in.

### Reduced motion
`MotionProvider` wraps the app in `MotionConfig reducedMotion="user"`, which neutralises transform
animation but **not opacity**. So the contract is:

| Category | Full motion | `prefers-reduced-motion: reduce` |
| --- | --- | --- |
| Page enter | Fade + 8px rise | Instant, no fade |
| Disclosure (FAQ, add-ons) | Height + opacity | Instant open, `hidden` toggled |
| Scroll reveal | Fade + 40px rise, once | Rendered at rest |
| Hover | Colour, ≤2px | Colour only |
| Spinners | Spin | **Still spin** — a loading indicator must indicate loading; cap to 1 rev/sec |
| D3 graph | Live simulation | Pre-tick 300 steps, paint settled (already done, `KnowledgeGraph.tsx:307-313`) |

Every CSS animation carries `motion-safe:`. The five that do not are listed below.

## 2.2 Audit — verdicts

**Keep 14 · Retune 9 · Delete 12.**

### Delete

| Animation | File:Line | Why |
| --- | --- | --- |
| FAQ accordion height | `services/ServiceFAQ.tsx:36-50` | `<details>` does this natively, free, keyboard- and find-in-page-friendly |
| Booking: availability field reveal | `BookingSection.tsx:187-206` | Animates a field the visitor is trying to fill in |
| Booking: add-ons reveal | `BookingSection.tsx:216-247` | Same |
| `SectionBreak` letter-spacing 0.2em → 0.5em | `blog/SectionBreak.tsx:68-69` | **Animates type.** Layout-thrashing and directly against the spec |
| `SectionBreak` rule width 0 → 100% | `:62-63` | Decoration on a static divider |
| `SectionBreak` rule width 0 → 60% | `:102-103` | Second copy of the same idea |
| `SectionBreak` heading rise | `:80-81` | Text animating on scroll |
| `SectionBreak` sub rise | `:91-92` | Text animating on scroll |
| Gallery "developing" loader | `CinematicGallery.tsx:142`, `:146-160` | An artificial delay in front of content the reader asked for |
| Garden note chevron rotate | `garden/GardenClient.tsx:66` | Route is empty; the `<details>` replacement gets this via CSS |
| Garden note expand height | `GardenClient.tsx:113-118` | Route is empty; `<details>` |
| `njitSavings()` (not motion, adjacent dead code) | `lib/pricing.ts:309-313` | Dead |

`SectionBreak.tsx` loses 5 of its animations — it becomes a static rule and heading. That is the
intended outcome; it is a divider.

### Retune

| Animation | File:Line | Change |
| --- | --- | --- |
| Gallery scroll reveal | `CinematicGallery.tsx:178-179` | Keep, but `once: true`, threshold 15%, 40px → 16px |
| Lightbox scale 0.97 → 1 | `CinematicGallery.tsx:264-265` | Keep; move duration to `DURATION.fast` |
| Lightbox backdrop fade | `:222-223` | Keep; token duration |
| Booking panel disclosure | `BookingSection.tsx:312-317` | Keep — this one *is* a state change; retune to `duration-base` + `ease-out-expo` |
| Quiz reveal | `blog/KnowledgeQuiz.tsx:141-142`, `:163` | Keep — explains a state change; token durations |
| Credibility disclosure | `blog/CredibilitySection.tsx:253-254` | Keep; token durations |
| Learning block disclosures ×2 | `blog/LearningBlocks.tsx:237-238`, `:249-250` | Keep; token durations |
| NJIT toggle `transition-all duration-300` | `ServicePackages.tsx:116` | `transition-colors duration-fast` + knob transform. `transition-all` on a 358×113 card animates layout properties |
| 5 ungated spinners | `PostCardSkeleton.tsx:5`, `BookingSection.tsx:271`, `CinematicGallery.tsx:151`, `KnowledgeGraph.tsx:430`, `SearchModal.tsx:218` | Keep spinning under reduced motion (see contract) but cap to 1 rev/sec and document the deliberate exception |

### Keep unchanged

`PageTransition.tsx` route enter · `KnowledgeGraph.tsx` simulation and its reduced-motion pre-tick ·
`SearchModal.tsx` overlay · `ArticleProvider.tsx` progress · `BlogArticleHeader.tsx` hero ·
`LayerExplorer.tsx:148-149`, `:198-199` · `PacketAnimator.tsx:90-91` · `GrowthTimeline.tsx` (content-bearing,
blocked on content) · the four Tailwind keyframes.

## 2.3 Inline-value violations

Durations written inline instead of using the tokens — 12 sites:
`ServiceFAQ.tsx:42` (0.3) · `BookingSection.tsx:193` (0.2), `:222` (0.25), `:318` (0.35, plus an
inline cubic-bezier `[0.25,0.46,0.45,0.94]` that exists in no token) · `GardenClient.tsx:66` ·
`ServicePackages.tsx:116` (`duration-300`), `:101` (`duration-200`), `:176` (`duration-300`),
`:271` (`duration-200`) · `CinematicGallery.tsx` ×2 · `ServiceFAQ.tsx:18` (`duration-200`).

Fixing these is mechanical and belongs with the retunes.

---

# PART 3 — Typography

## 3.1 Assessment

Measured across 17 routes at 390px: **1,407 text-bearing elements, 19 font sizes, 17 letter-spacing
values** (inventory §4). There is no scale. Sizes are picked per component from Tailwind's
arbitrary-value syntax — `text-[8px]`, `text-[9px]`, `text-[10px]` — which is exactly the mechanism
that lets a scale drift.

**Is the scale coherent?** No. 19 sizes for a site with roughly 6 semantic levels. Three sizes
(13.125, 14.4, 16.8px) are not authored at all — they are `rem` multiples inherited from prose
styles, which is a symptom of two type systems (Tailwind classes and `@tailwind/typography`)
overlapping without a shared source.

**Body text at 390px.** Split between 14px (471 elements) and 16px (239) with no rule. **14px is
too small for body copy** and it is the more common of the two. Article prose measure is bounded by
`max-w-*` containers rather than `ch`, so measure drifts with viewport rather than holding at a
readable character count.

**Hierarchy.** Parseable at the top (48/36/30/24 Lora is clear), muddled at the bottom: 10, 11 and
12px all carry real information in three different families, and a reader cannot tell rank from
size because tracking and case vary independently.

## 3.2 The uppercase mono micro-label — verdict

**It is a stylistic tic, and it is costing comprehension.** Not a close call:

- **157 elements render below 10px**; 332 below 12px — 23.6% of all text on the site.
- It is **not one motif**. It is ~44 permutations of size × tracking (7px/0.7 · 8px/0.8 · 8px/2.4 · 8px/3 · 9px/0.9 · 9px/1.8 · 9px/2.7 · 10px/1 · 10px/1.5 · 10px/2 · 10px/2.5 · 10px/3 · 11px/1.1 · 11px/2.2 · 11px/2.75 · 11px/3.3 · 12px/6). Readers cannot learn a system with 44 states; it reads as texture.
- Three legibility penalties stack: uppercase removes word-shape cues, wide tracking breaks words into characters, and 7–9px is below comfortable resolution for most readers.
- **The content is real.** These are field names — "Planted", "Delivery", "Ideal for", "Tech stack" — genuinely useful metadata rendered as the least readable text on the page. That is the definition of decoration pretending to be information.

Evidence the site already knows better: `.section-label` (`styles/index.css:113-119`) was rewritten
in September to **serif, 16.8px, no tracking, no uppercase**, and it is used 54 times. The good
pattern exists and is not being followed by the ad-hoc inline classes.

**Verdict: keep one micro-label style, delete the other 43.**

## 3.3 Proposed named scale

Six roles. Defined once in `tailwind.config.ts` under `fontSize`, used by name everywhere.
**Arbitrary `text-[Npx]` becomes a lint-level mistake.**

| Token | Size / line-height | Family | Role |
| --- | --- | --- | --- |
| `display` | 48 / 1.05, `-0.02em` | Lora | Page `h1` |
| `title` | 30 / 1.15 | Lora | Section `h2` |
| `subtitle` | 20 / 1.3 | Lora | Card and block `h3` |
| `body` | 17 / 1.65 (**19 / 1.7 in article prose**) | Inter | All running text |
| `small` | 14 / 1.5 | Inter | Secondary text, captions, form help |
| `label` | **12 / 1.4, `0.08em`, uppercase** | IBM Plex Mono | **The one** micro-label |

Measure: `max-width: 66ch` on article prose, `74ch` elsewhere.

### What changes, and where

| Change | Scope | Effort |
| --- | --- | --- |
| **12px floor.** Every `text-[7px]` / `[8px]` / `[9px]` / `[10px]` / `[11px]` becomes `label` (if a field name) or `small` | 332 elements; heaviest in `ServicePackages.tsx`, `BookingSection.tsx`, `GardenClient.tsx`, `BlogDirectory.tsx`, `graph/KnowledgeGraph.tsx` | 1.5 |
| **One tracking value** (`0.08em`) for every mono label; delete 16 others | site-wide | included above |
| **Body 14 → 17px**, article prose → 19px | `styles/article.css`, prose config, card bodies | 0.5 |
| **Measure in `ch`** rather than `max-w-*` | `styles/article.css` | 0.25 |
| **Delete the 3 unauthored sizes** by removing the prose/Tailwind overlap | `tailwind.config.ts` typography block | 0.5 |

Net: 19 sizes → 6, 17 tracking values → 1, nothing below 12px. **~2.75 sessions**, and it is the
single largest change to how finished the site feels.

---

# PART 4 — Implementation plan

Ordered cuts → fixes → improvements. Effort in sessions. Every item is executable from this
document plus the two audits without re-deriving the reasoning.

## Milestone 1 — Cuts and fixes: the site is honest and works

*Goal: nothing on the site advertises something that is not there, and nothing in Studio lies.*

| # | What changes | Why (goal) | Effort | Risk | Depends on |
| --- | --- | --- | --- | --- | --- |
| 1.1 | **Unpublish the 4 empty knowledge routes.** Remove `/glossary`, `/paths`, `/review`, `/garden` from the `navigation` singleton and `app/sitemap.ts`; keep routes reachable by URL | G1, G2 — stops the site advertising empty rooms | 0.5 | Low. Reversible in Studio. Verify `RESERVED_SLUGS` still blocks the slugs | — |
| 1.2 | **Fix the 9 hardcoded Studio overrides** (inventory §3a) — one-line substitutions in `ServicePackages.tsx:238,258`, `BookingSection.tsx:235`, `garden/[slug]/page.tsx:131,132,148,193`, `projects/page.tsx:95`, `HomeSections.tsx:174`, `CinematicGallery.tsx:159` | All four — Studio stops silently ignoring edits | 0.5 | Low | — |
| 1.3 | **Delete the 7 fields with no rendering site** (inventory §3b) from defaults, queries and schemas | All four | 0.5 | Low. Run `npm run typegen` after | 1.2 |
| 1.4 | **Seed the dataset** — fresh Editor token, `npx tsx scripts/seed-content.ts` | All four. **Blocks nothing but unblocks everything editorial** | 0.25 | Low. Dry-run first; `--force` overwrites edits | A valid `SANITY_API_WRITE_TOKEN` |
| 1.5 | **Services cuts C2, C3, C9** — physical-product lists out of cards, `comingSoon` cards hidden, middot triplets and `inquiryEyebrow` reworded | G4. ~2 screens of mobile height | 1 | Low | Services audit approved |
| 1.6 | **Airtable robustness** — `typecast: true` on both `airtableCreate` calls, reconcile `'Framed print set'`, confirm the `'Not sure yet'` option exists | G4. Each rejection currently loses a lead | 0.5 | **Medium** — touches the live booking path. Test with a real submission | 1.5 |
| 1.7 | **Tap targets** — search button 14×14, footer links 20px, heading anchors 10×23, NJIT checkbox 13×16 → 24px minimum | All four | 0.5 | Low | — |
| 1.8 | **Cap the 5 spinners to 1 rev/sec** and document the deliberate reduced-motion exception | All four | 0.25 | Low | Part 2 contract |

**Milestone 1 total: ~4 sessions.**

## Milestone 2 — Reading experience: the site is good to read

*Goal: the type system is one system, and the article page is worth arriving at.*

| # | What changes | Why (goal) | Effort | Risk | Depends on |
| --- | --- | --- | --- | --- | --- |
| 2.1 | **Define the 6-token type scale** in `tailwind.config.ts` (Part 3.3) | G1–G4 | 0.5 | Low — additive | — |
| 2.2 | **Apply the 12px floor.** 332 elements; delete 43 of 44 micro-label permutations | G1–G4. The single largest perceived-quality change | 1.5 | **Medium** — touches most components. Do it route by route with a screenshot diff each time | 2.1, baseline captures |
| 2.3 | **Body 14 → 17px, article prose 19px, measure in `ch`** | G1 | 0.75 | Medium — changes every page's height; re-run the baseline | 2.1 |
| 2.4 | **Resolve the Tailwind/prose overlap** removing the 3 unauthored sizes | G1 | 0.5 | Medium — prose styles affect all article bodies | 2.3 |
| 2.5 | **Epistemic status block on posts** — `confidence` + `importance` + status on the `post` schema, rendered above the article (Part 1, gwern) | G1. The best single idea in Part 1 | 1 | Low | 1.4 |
| 2.6 | **Photography mobile density** (C4) — cap the recent grid, lazy-load below the fold. 9,509px → target < 5,000px | G4 | 1 | Medium — do not regress the lightbox or `photo-utils` ordering | 2.2 |

**Milestone 2 total: ~5.25 sessions.**

## Milestone 3 — Motion and polish: the site feels made

| # | What changes | Why (goal) | Effort | Risk | Depends on |
| --- | --- | --- | --- | --- | --- |
| 3.1 | **Execute the 12 deletions** in Part 2.2 — `SectionBreak` loses 5, `ServiceFAQ` and the two booking disclosures become `<details>`/`hidden`, gallery loader goes | G1, G4 | 1 | Low. Verify `<details>` keeps the focus-visible ring | Part 2 approved |
| 3.2 | **Execute the 9 retunes** and replace all 12 inline durations with tokens (Part 2.3) | All four | 0.75 | Low | 3.1 |
| 3.3 | **Hover contract** — cap movement at 2px, colour/border only, focus-visible twin for every hover state | All four | 0.5 | Low | 3.2 |
| 3.4 | **Relative dates in the garden** ("tended 2 months ago") via `lib/dates.ts` (Part 1, Appleton) | G1 | 0.25 | Low. Must stay UTC-formatted to avoid hydration mismatch | 1.4 |
| 3.5 | **Drop framer-motion where it is now unused** and re-check the bundle | All four | 0.5 | Medium — confirm no remaining import first | 3.1, 3.2 |

**Milestone 3 total: ~3 sessions.**

## Milestone 4 — Remaining, and explicitly deferred

| # | What changes | Effort | Verdict |
| --- | --- | --- | --- |
| 4.1 | **Prices and package copy into Studio**, keeping `id` + `airtableName` code-owned (Services audit §3) | 2 | Do once G4 pricing stabilises |
| 4.2 | **Glossary popups populated** — 20–30 terms | 1–2 (writing) | Do; unblocks a built feature |
| 4.3 | **Backlinks with transcluded context** (gwern) | 1.5 | Defer until G1 ≥ 10 posts |
| 4.4 | **Library facet rail** (Stripe) | 1.5 | Defer until G2 ≥ 30 items |
| 4.5 | **`/blog/osi-model` into Studio** | 1.5 | Defer — low traffic, high effort |
| 4.6 | **Sidenotes** (gwern) | 2 | Defer — competes with the TOC for the margin |
| 4.7 | **Sliding panes** (Matuschak) | 2+ | **Do not do.** Needs ~40 interlinked notes; you have 0 |

## The dependency that dominates everything

Milestones 1–3 are ~12 sessions and will produce a site that is honest, readable and considered.
**They will not make it feel finished, because the site has 2 articles and 0 library items.**

The inventory's blunt finding stands: the constraint is content, not craft. If only one thing
happens next, it should be **1.4 (seed the dataset)** followed by writing — the eight planned posts
in the ShowFab backlog would do more for G1 than every item in Milestone 2 combined. The right
reading of this plan is that Milestone 1 is urgent (the site currently misrepresents itself),
Milestone 2 is high-value whenever there is content to read, and Milestone 3 is genuine polish that
can wait.
