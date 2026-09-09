# UI audit against the fresh capture baseline — 2026-09-09

Measured against production at `e880405`, after the font fix, the typography block, the focus
extraction, the directory-panel removal, the glyph swaps and the taxonomy pills.

Captures: `docs/audit/screenshots/site-inventory/`, replacing the stale baseline entirely.

---

## 0. Read this before the numbers

**Two of my four defect metrics were ~95% false on the first pass, and I nearly published them.**

| Metric | First pass | Corrected | Why the first number was wrong |
| --- | --- | --- | --- |
| Low contrast | 322 | **4** | I read the first non-transparent ancestor background — usually `rgba(255,255,255,0.02)` — and treated it as opaque white. The real ground is 2% white composited over `#0a0a0a` ≈ `#0d0d0d`. Fixed by compositing alpha down the ancestor chain. |
| Clipped text | 105 | **0** | I counted `sr-only` labels (`clientWidth: 1`) and every `.truncate` element. `overflow: hidden` was not in my exclusion list, only `auto` and `scroll`. |
| Sub-12px rendered | 537 | 465 | First pass counted hidden elements. |
| Tap target < 24px | 58 | 44 | Same. |

That is the 11th and 12th measurement artifact on this project. The rule holds: when a number looks
alarming, suspect the number.

---

## 1. Errors and defects

32 route × breakpoint combinations, 16 routes at 1440 and 390, measured on production.

### Clean

| Check | Result |
| --- | --- |
| Horizontal overflow | **0** across all 32 |
| JavaScript page errors | **0** across all 32 |
| `<img>` without an `alt` attribute | **0** |
| Clipped text | **0** real (16 flagged, all intentional truncation) |
| Low contrast | **4 flagged, 0 actionable** — all the same decorative `·` / `•` separator at `stone-600`, ratio 2.60, `aria-hidden="true"`. WCAG exempts purely decorative content. |
| Routes returning non-200 | **0** of the 16 audited |

### Real findings

**F1 — 465 rendered sub-12px text nodes, and they are concentrated.**

| Route | 1440 | 390 |
| --- | --- | --- |
| `/services` | 61 | 59 |
| `/blog/osi-model` | 61 | 52 |
| `/graph` | 48 | 46 |
| `/photography` | 24 | 22 |
| `/projects` | 11 | 9 |
| `/resume` | 10 | 8 |
| everything else | 3–7 | 1–5 |

Three routes carry 70% of it. `/blog` and the article are already down to 6 and 3 — the pages that
have had passes are clean; the ones that haven't are not. Spec in `SPECS.md` §a.

**F2 — 44 tap targets below 24×24.**

`/blog/osi-model` 7, `/graph` 4, `/garden` 3, `/library` 3, `/` 2, `/resume` 2, `/services` 1 — the
same at both breakpoints, so these are not responsive collapses but genuinely small controls. These
are WCAG 2.5.8 (AA) failures, not just style issues.

**F3 — graph node labels are truncated to illegibility.**

On `/graph`, four `span.truncate` elements hold 232–421px of text in a **44px box** (one in 30px).
At that width roughly three characters are visible. The SVG `<text>` labels are separately truncated
to 55px with an ellipsis. Not a clipping bug — the truncation is deliberate — but the labels convey
nothing, which defeats the point of a knowledge graph.

**F4 — the read-time meta is now inconsistent with its neighbour.**

The taxonomy pill next to it is 12px sans in a rounded border; "3 MIN" is still 9px mono uppercase.
Introduced by the pill change in `1b0fb5b` and flagged in that commit. Belongs with `SPECS.md` §a.

---

## 2. Customisable versus hardcoded

**Studio-editable surface: 10 singletons, roughly 440 fields**, in `lib/cms/defaults/` with matching
schemas and GROQ. Every string in them can be changed without a deploy.

| Singleton | Covers |
| --- | --- |
| `settings` | site name, tagline, description, socials, footer headline, newsletter copy, OG image |
| `navigation` | primary and secondary nav, footer Pages list, search quick links |
| `taxonomy` | article lanes and their colours, media types, vocabularies |
| `articleUi` | 47 fields — every label on the article page, reader menu, TOC, credibility |
| `blogPage` | header, stats labels, featured, series/reading/notes strips, list and filter labels |
| `knowledgePages` | garden, library, glossary copy |
| `personalPages` | projects, photography, resume, now, uses, contact |
| `servicesPage` | packages, FAQ, testimonials, booking |
| `home` | home sections |
| `errorPages` | 404 and error copy |

### What is hardcoded but should not be

These are user-visible strings a reader sees, with no Studio field behind them:

| String | Where |
| --- | --- |
| `Clear filters`, `No categories yet` | `BlogDirectory.tsx` |
| `Featured` badge on the hero card | `app/(archive)/blog/page.tsx:124` (the *section heading* is editable, the badge is not) |
| `Post`, `Note`, `Project`, `Library`, `Term` type chips | `SearchModal.tsx:16-22` |
| `Filter by lane` / `by category` / `by tag` / `Sort` | `BlogDirectory.tsx` — these are `aria-label`s, so they are screen-reader copy |
| `Name`, `Email`, `Message`, `Website` | `ContactForm.tsx` |
| `Type`, `Status`, `Clear`, `All` | `LibraryClient.tsx` |
| `Search notes`, `Related posts`, `Related notes`, `Notes that link here` | `GardenClient.tsx` |
| `Key idea`, `Influenced` | `MediaCard.tsx` |
| `Active recall`, `Hint`, `Answer` | `LearningBlocks.tsx`, `KnowledgeQuiz.tsx` |
| `Post`, `Project` labels | `Backlinks.tsx` |

Roughly 25 strings. The garden, library and contact surfaces are the least editable parts of the
site — notable because `knowledgePages` and `personalPages` exist and could hold them.

### What is Studio-editable but arguably should not be

- **`ctaHref` on the series, reading and notes strips.** Free-text paths in Studio with no
  validation — a typo silently produces a dead link, which is exactly how `/paths` and `/review` got
  advertised for two days after those routes were deleted.
- **Icon names** (`lib/cms/icons.tsx`). An editor can type a lucide name that does not exist; the
  failure is a silently missing icon rather than an error.

### Not editable and correctly so

Layout, spacing, the type scale, colours, motion, and the focus ring. All code.

---

## 3. Scalability — where it breaks, specifically

**S1 — `/blog` has no pagination and no query limit.**
`blogIndexQuery` line 318 is `*[_type == "post"] | order(publishedAt desc)` with **no slice**, and
`BlogDirectory` renders `filtered.map(...)` with no cap. At 50 posts the page ships 50 cards and 50
images in one document; at 200 it ships 200. **Breaking point: roughly 30 posts**, where the page
exceeds a reasonable payload and the filter row stops being the fastest way to find anything.
Contrast: `feedQuery` correctly caps at `[0...50]`.

**S2 — card titles have no `line-clamp`.**
`BlogDirectory.tsx:351` renders `{post.title}` in an `<h3>` with no clamp, while the excerpt below
it is `line-clamp-2`. **Breaking point: a 12-word title.** It grows the card and breaks row
alignment in the grid, because sibling cards do not match its height.

**S3 — the featured hero assumes a cover image exists.**
The grid card has an `EmptyThumbnail` fallback; the hero has a gradient fallback but still reserves
`min-h-[480px]`. A featured post with no image renders 480px of gradient. **Breaking point: the
first featured post without a cover.**

**S4 — an empty category cannot occur, but an empty *filter result* can.**
`categories` is derived from posts, so no orphan categories exist. But lane + tag can be combined
into a zero-result state, which renders `copy.list.emptyState` — this path exists and is correct.

**S5 — a 40-item TOC is handled.**
`ArticleToc` has `max-h-[calc(100vh-7rem)]` with `overflow-y-auto`, and the mobile `<details>`
starts collapsed above 8 headings. No breaking point found.

**S6 — `/graph` degrades with node count.** Already illegible at 4 nodes (F3). More nodes make the
44px label boxes worse, not better.

---

## 4. Future overhaul notes — backlog, not recommendations

Recorded so a later pass does not rediscover them. **None of these are proposed for now.**

- **The article page defines 20 top-level sections; 6–7 render.** The chrome-to-writing ratio is a
  structural choice that no styling pass changes.
- **`framer-motion` is close to dead weight on the blog route.** 16 importers site-wide, but the
  blog ones are learning-block components that render for no published post. If those stay dormant,
  the library could leave the article bundle entirely.
- **`BlogBackground` is `fixed inset-0 -z-20` behind everything** and is not theme-aware. Any
  page-level theme work (SPECS §e) has to deal with it.
- **Two spellings of the focus ring exist**: `FOCUS` in `lib/ui.ts` at 163 call sites, and
  `.focus-ring` in `styles/index.css` with **zero** usages. The dead one includes
  `outline-offset-2`; adopting or deleting it is a one-line decision nobody has made.
- **The `data-toc="sidebar"` / `data-toc="mobile"` split is asserted by the Playwright suite.** Any
  TOC consolidation has to update that test in the same commit.
- **`/blog/osi-model` is a hand-built route**, not a post. It carries 61 sub-12px nodes and 7
  undersized tap targets — the worst per-page numbers on the site — because it never went through
  the component system.
- **Studio has no validation on path fields**, so dead links are creatable by editors.

---

## 5. What the captures do NOT cover

**Flagged so an empty frame is not read as a passing frame.**

These article components render for **no published post**, so every capture of them is an absence,
not a state:

`h4` headings · `blockquote` · `figure` (in-body images) · TL;DR · prerequisites · checkpoint ·
objectives · concept cards · credibility · backlinks · Ask this article · read-next · reactions ·
comments · series banner (no series exists)

Measured: **6 of 20 sections render for the home-lab post, 6 for The Field, 7 for the portfolio
post.** The typography shipped in `5c7cca4` for `h4`, `blockquote` and `figure` is therefore
verified only as generated CSS and a type-check — it has never been seen on a page.

Also absent from the captures by nature: `/studio` authenticated (login screen only), and any
multi-series or multi-tag state, because the dataset has three posts, zero series and a small tag
set.
