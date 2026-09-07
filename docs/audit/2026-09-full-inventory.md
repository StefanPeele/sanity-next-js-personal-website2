# stefanpeele.com — full site inventory (6 September 2026)

What is on the site, what is behind it, and what is not earning its place. Companion to
`2026-09-site-audit.md` (September's Studio-editability pass) and `2026-09-services-audit.md`
(the Services page in depth). No code was changed to produce this.

**Method.** Static analysis of every route and its components, plus three measured passes against
the production build (`npm run build` → `next start`) at 1440 / 768 / 390:

- **Page geometry** — scroll height per route per breakpoint.
- **Type census** — every text-bearing element on 17 routes at 390px, grouped by rendered font size, family, transform and letter-spacing. 1,407 elements.
- **Content census** — `innerText` of `#content` per route, item counts, empty-state detection. Read from the live DOM, not the RSC payload; a grep of the HTML source finds Studio strings that are serialised into props but never rendered.
- **Dead-field detection** — walked all 598 leaf fields in `lib/cms/defaults/*`, then searched `app/` and `components/` for each key name.

Baseline captures referenced throughout: `docs/audit/screenshots/baseline/{1440,768,390}/`.

---

## 1. Route inventory

`screens` = page height ÷ 844px viewport at 390px.

| Route | Shell | 1440 | 768 | 390 | screens | Content state |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | personal | 4860 | 5748 | 5855 | 6.9 | Populated |
| `/blog` | archive | 3415 | 3521 | 4745 | 5.6 | **2 posts** |
| `/blog/[slug]` | archive | 5603 | 5991 | 7669 | 9.1 | 2 available |
| `/blog/osi-model` | archive | 3116 | 3192 | 4445 | 5.3 | Hand-built page |
| `/garden` | archive | 1945 | 2125 | 2553 | 3.0 | **Empty** — "No notes yet" |
| `/graph` | standalone | 900 | 1024 | 844 | 1.0 | Renders; nodes from 2 posts |
| `/library` | archive | 1925 | 2125 | 2585 | 3.1 | **0 items** |
| `/glossary` | archive | 1925 | 2125 | 2417 | 2.9 | **Empty** — "0 terms" |
| `/paths` | archive | 1925 | 2125 | 2444 | 2.9 | **Empty** — "No paths yet" |
| `/review` | archive | 1925 | 2125 | 2566 | 3.0 | **Empty deck** |
| `/projects` | personal | 2204 | 2350 | 2779 | 3.3 | Populated |
| `/resume` | personal | 2005 | 2523 | 2948 | 3.5 | Populated |
| `/photography` | personal | 4527 | 3435 | **9509** | 11.3 | 7 albums, 219 photos |
| `/services` | personal | 6661 | 7328 | **9923** | 11.8 | Populated |
| `/contact` | personal | 2164 | 2700 | 3299 | 3.9 | Populated |
| `/now` | personal | 2005 | 2205 | 2497 | 3.0 | Populated |
| `/uses` | personal | 3291 | 3390 | 4140 | 4.9 | Populated |

Two observations. `/photography` is **2.8× taller at 390 than at 768** (9509 vs 3435) because the
three-column masonry collapses to one column with no corresponding reduction in what is shown — it
is the worst mobile regression on the site, worse than Services, and it was not previously flagged.
And `/services` and `/photography` together account for more mobile scroll than the other fifteen
routes combined.

## 2. Content reality

**Five of the seven knowledge routes have nothing in them.**

| Route | State | Consequence |
| --- | --- | --- |
| `/garden` | No notes | The garden tool, `GrowthTimeline`, `WikiLinks`, `Backlinks`, note status taxonomy and the `/garden/[slug]` route all ship with nothing to render |
| `/glossary` | 0 terms | `GlossaryTerm` hover cards and `GlossaryList` never fire |
| `/paths` | No paths | `PathSteps` unused |
| `/review` | Empty deck | `ReviewDeck`, `lib/anki.ts` export, spaced repetition unused |
| `/library` | 0 items | `LibraryClient`, `MediaCard`, media-type taxonomy unused. **This is one of your four goals** |
| `/blog` | 2 posts | Filters, lanes, sort, series rail and the reading strip all operate on 2 items |

This is the single most important fact in the inventory. The September audit made every string on
these pages editable, and the pages are well built — but the reason the site does not feel finished
is not design, it is that roughly a third of it has no content. `/graph` draws its map from 2 posts.

The cost is not neutral: each empty route is code to maintain, a route in the sitemap, a nav entry
competing for attention, and a page a visitor can land on and find nothing.

## 3. Studio editability

598 leaf fields across 11 singletons; 337 distinct key names. **16 fields are editable in Studio and
read by no component.** An editor can change any of them, publish, and see no change on the site.

### 3a. Overridden by a hardcoded literal

The component renders the same string as a constant. Highest-confidence bugs — the fix is a
one-line substitution.

| Field | Defaults | Hardcoded at | Literal |
| --- | --- | --- | --- |
| `servicesPage.packageCard.includesNote` | `servicesPage.ts:69` | `ServicePackages.tsx:258` | "Full three-part delivery + physical product of your choice" |
| `servicesPage.packageCard.wip` | `servicesPage.ts:70` | `ServicePackages.tsx:238` | `WIP` |
| `servicesPage.booking.selectedLabel` | `servicesPage.ts:85` | `BookingSection.tsx:235` | `{n} selected` |
| `knowledgePages.garden.note.plantedLabel` | — | `app/(archive)/garden/[slug]/page.tsx:131` | "Planted" |
| `knowledgePages.garden.note.tendedLabel` | — | `garden/[slug]/page.tsx:132` | "Last tended" |
| `knowledgePages.garden.note.linksHere` | — | `garden/[slug]/page.tsx:193`, `GardenClient.tsx:194` | "Notes that link here" |
| `knowledgePages.garden.note.staleWarning` | — | `garden/[slug]/page.tsx:148` | "Not tended in {n} days — details may be stale." |
| `personalPages.projects.card.techLabel` | — | `projects/page.tsx:95`, `HomeSections.tsx:174` | `aria-label="Tech stack"` |
| `personalPages.photography.loader.skipLabel` | — | `CinematicGallery.tsx:159` | "Skip" |

### 3b. No rendering site found

The field is queried and typed, but nothing consumes it — the UI it was written for either was
never built or was removed. Decide per field: build it, or delete the field, query line and schema entry.

`blogPage.directory.noTopics` · `knowledgePages.garden.note.statusLabel` ·
`knowledgePages.garden.note.graphHeading` · `knowledgePages.series.partsLabel` ·
`knowledgePages.series.publishedLabel` · `personalPages.photography.index.filterAllLabel` ·
`settings.newsletter.successMessage`

> `noTopics` is a good illustration of why the live DOM matters: "No topics yet" *does* appear in
> `/blog`'s HTML source, because the GROQ query selects it into the props payload. It is never
> rendered. Grepping the response would have called this field healthy.

### 3c. Still code-only

Beyond `lib/pricing.ts` (covered in the Services audit): the article-page learning components
(`Checkpoint`, `TldrBlock`, `LayerExplorer`, `PacketAnimator`) carry their own labels, and
`/blog/osi-model` is entirely hand-written — the September audit swept its jargon but never made it
editable.

## 4. Type system

Measured across 17 routes at 390px: **1,407 text-bearing elements, 19 distinct font sizes, 17
distinct letter-spacing values.** There is no scale; sizes are chosen per component.

Sizes in use: 7, 8, 9, 10, 11, 12, 13.125, 14, 14.4, 15, 16, 16.8, 18, 20, 24, 30, 36, 48, 60px.
Letter-spacing in use: 0.7, 0.8, 0.9, 1, 1.1, 1.5, 1.8, 2, 2.2, 2.4, 2.5, 2.7, 2.75, 3, 3.3, 4, 6px.

**332 of 1,407 elements (23.6%) render below 12px.**

| Size | Elements | Character |
| --- | --- | --- |
| 7px | 21 | Mono, uppercase, 0.7px tracking |
| 8px | 54 | Mono; 44 uppercase with 0.8–3px tracking |
| 9px | 82 | Mono; 42 uppercase |
| 10px | 81 | Mono and Inter; 63 uppercase |
| 11px | 75 | Mono; 23 uppercase |
| **< 12px total** | **332** | Almost entirely IBM Plex Mono, mostly uppercase, mostly tracked |

Body text is split between 14px (471 elements) and 16px (239) with no rule distinguishing them.

**On the uppercase mono micro-label.** It is not one motif used consistently — it is 44 different
size/tracking permutations. At 7–9px, uppercase, with 2–3px of tracking, it fails on three counts
at once: uppercase removes word-shape cues, tracking breaks words into characters, and the size is
below what most readers resolve comfortably. The information in these labels is almost always a
field name ("Planted", "Delivery", "Ideal for") — genuinely useful, and currently the least
readable text on the page. This is a stylistic tic that is costing comprehension, and it is the
clearest single lever on how finished the site feels.

## 5. Motion

**CSS keyframes** (`tailwind.config.ts:33-60`): `fade-up`, `fade-in`, `draw`, `page-enter`. Only
three usages across the codebase, all correctly `motion-safe:` gated.

**Ungated animations** — five, all spinners or skeletons, against the project rule that every
animation carries `motion-safe:`:

`components/blog/PostCardSkeleton.tsx:5` · `components/BookingSection.tsx:271` ·
`components/CinematicGallery.tsx:151` · `components/graph/KnowledgeGraph.tsx:430` ·
`components/SearchModal.tsx:218`

**framer-motion — 17 files.** `MotionProvider` wraps the app in `MotionConfig reducedMotion="user"`,
so transform animations respect the preference; opacity animations still run.

| File | What it animates | First read |
| --- | --- | --- |
| `components/services/ServiceFAQ.tsx:36-50` | Accordion height | Replaceable by `<details>` |
| `components/BookingSection.tsx:187-206`, `:216-247` | Two form disclosures | Delays a field the visitor is filling in |
| `components/garden/GrowthTimeline.tsx` | Timeline reveal | Route is empty |
| `components/garden/GardenClient.tsx` | Note expand | Route is empty |
| `components/blog/{KnowledgeQuiz,LayerExplorer,PacketAnimator,LearningBlocks,SectionBreak,CredibilitySection}.tsx` | Article learning blocks | Content-bearing; keep |
| `components/CinematicGallery.tsx` | Lightbox, "developing" loader | Keep the lightbox; the loader is theatre |
| `components/SearchModal.tsx`, `PageTransition.tsx`, `ArticleProvider.tsx`, `BlogArticleHeader.tsx`, `KnowledgeGraph.tsx` | Overlay, route enter, progress, hero, simulation | Keep |

## 6. Tap targets at 390px

Below the WCAG 2.5.8 minimum of 24×24:

| Element | Size | File |
| --- | --- | --- |
| Navbar search button | **14×14** | site-wide |
| Footer nav links (8) | 20px tall | `components/Footer.tsx` |
| Heading anchor "Copy link to this section" | **10×23**, **9×19** | `components/article/HeadingAnchor.tsx` |
| NJIT affiliate checkbox | **13×16** | `BookingSection.tsx:209` |
| "All projects →" / "All writing →" | 20px tall | `components/home/HomeSections.tsx` |

## 7. Recommended Cuts

Ordered by value returned per unit of effort. Every item is a deletion or a downgrade; none
requires new design. Effort is in sessions.

| # | Cut | Where | Effort | Returns |
| --- | --- | --- | --- | --- |
| C1 | **Unpublish the four empty knowledge routes** from nav and sitemap — `/glossary`, `/paths`, `/review`, and `/garden` — keeping the code behind a flag until there is content | `navigation` singleton, `app/sitemap.ts`, `lib/site.ts` RESERVED_SLUGS | 0.5 | Removes 4 dead-end landing pages and 4 nav entries; the site stops advertising empty rooms |
| C2 | **Physical-product lists out of the package cards** | `ServicePackages.tsx:246`, `:32-55` | 0.5 | ~2 screens of mobile height; kills 2 of 3 duplicate copies |
| C3 | **`comingSoon` package cards** | `lib/pricing.ts:113`, `:167` | 0.25 | 2 greyscale unbuyable cards |
| C4 | **Photography mobile density** — cap the recent grid and lazy-load below the fold | `app/(personal)/photography/page.tsx`, `CinematicGallery.tsx` | 1 | 9509px → target under 5000px; the largest single mobile win |
| C5 | **The sub-10px type tier** — raise 7/8/9px to a named scale with an 11px floor | ad-hoc inline classes site-wide (`font-mono text-[8px] uppercase tracking-[...]`), *not* `.section-label`, which is already correct serif 16.8px | 1.5 | 157 elements become readable; see §4 |
| C6 | **framer-motion from `ServiceFAQ` and the two booking disclosures** | `ServiceFAQ.tsx:36-50`, `BookingSection.tsx:187-206`, `:216-247` | 0.5 | 3 animations, one library dependency closer to removable |
| C7 | **The 7 fields with no rendering site** (§3b) — delete field, query line and schema entry | `defaults/*`, `queries-*.ts`, `schemas/singletons/*` | 0.5 | Studio stops offering controls that do nothing |
| C8 | **`njitSavings()`** — dead since `njitToggle.savingsCopy` landed | `lib/pricing.ts:309-313` | 0.1 | Dead code |
| C9 | **Middot slogan triplets and the `inquiryEyebrow`** | `defaults/servicesPage.ts:41`, `:51`, `:73` | 0.25 | The last of the label-pattern voice |
| C10 | **The "developing" loader on the gallery** | `CinematicGallery.tsx:146-160` | 0.25 | An artificial delay in front of the content |

**Not cuts, but fixes that belong with them:** the 9 hardcoded overrides in §3a (one line each), the
5 ungated spinners in §5, and the 5 tap-target sizes in §6.

**Explicitly not recommended for cutting:** the article learning blocks. They are the only part of
the site doing something no template does, they are content-bearing, and `/blog` is your first
goal. The problem with the article page is that there are 2 articles, not that it does too much.

---

## 8. Empty route dispositions

> **Executed 2026-09-07.** `/paths` and `/review` are deleted (commit `f72b535`). `/glossary`,
> `/library` and `/garden` are unchanged and still carry the dispositions below. Sections 1 and 2
> above are a point-in-time record of 6 September and deliberately still list all nine routes.

Added 2026-09-07, after the dataset was seeded. Recommendations, not descriptions. Writing time is
**your** hours at a keyboard, not engineering sessions; engineering is called out separately.

The premise: four good pages beat nine empty ones. Two of these five are worth filling, one is worth
waiting on, and two should be deleted despite the effort already spent on them.

| Route | Goal served | Content to stop being embarrassing | Your writing time | Disposition |
| --- | --- | --- | --- | --- |
| `/glossary` | **G1, directly** | 25–30 networking terms, 1–3 sentences each | **2.5–3 h** | **FILL** |
| `/library` | **G2 — a stated goal** | See below: change the implementation, not the effort | **~1 h** + 1.5 sessions code | **FILL, reimplemented** |
| `/garden` | G1, indirectly | 15–20 interlinked notes | 6–8 h | **DEFER** |
| `/paths` | G1, downstream | Needs 15+ posts before a path exists to draw | n/a | **DELETE** |
| `/review` | None honestly | Needs returning readers a 2-post site does not have | n/a | **DELETE** |

### `/glossary` — FILL

**The best ratio on the site.** It is the cheapest content here and the only one that improves pages
that already exist: `GlossaryTerm` hover cards fire inside articles, so 25 definitions make both
current posts better the day they land, and every future post better for free.

Terms you already have standing: the OSI layers, VLAN, subnet, DHCP, DNS, NAT, BGP, OSPF, trunk,
LACP, SAN, iSCSI, VLAN tagging, MTU, ARP, TLS handshake, WinRM, Kerberos. That is most of 25 without
inventing anything.

Definitions must be **1–3 sentences and in your own words** — a glossary of copied vendor
definitions is worse than no glossary. Budget 6 minutes a term.

### `/library` — FILL, but reimplement

You cannot delete a stated goal, so the question is what implementation actually serves it.

**Why the current one will fail.** It is a manually maintained reading log. That format needs
continuous input to look alive, decays visibly the moment you stop, and competes for exactly the
scarce writing hours G1 needs. A reading log last updated four months ago is a worse signal than no
reading log.

**Reimplement it as a derived page, not a maintained one.** Two sources, both of which already
exist:

1. **Article sources.** `post.sources` is already in the schema (`sanity/schemas/documents/post.ts:194`) and already rendered by `CredibilitySection`. Aggregate every source cited across every post into the library, grouped by media type, each linking back to the post that cited it. The library then fills itself as G1 grows and **can never be stale**, because it is a view over your own writing.
2. **A short "currently reading" shelf.** 8–10 hand-entered `mediaItem` documents. `components/knowledge/CurrentlyReading.tsx` already takes pre-fetched items, and the `mediaItem` schema already has `status`, `progressPercent`, `coverImage`, `startedAt`. That is ~1 hour of entry and it is the only part you maintain.

**Engineering: ~1.5 sessions** — a GROQ query aggregating `post.sources`, a grouping by media type,
and a merge with hand-entered `mediaItem`s. Nothing new to design; `LibraryClient` and `MediaCard`
already render this shape.

The goal survives; the maintenance burden does not. This is the item to do straight after the
glossary.

### `/garden` — DEFER

The only empty route with a real long-term job: it feeds backlinks, wiki-links and the knowledge
graph, all of which are built and all of which need note density to mean anything.

But it is a **second content stream competing with the blog for the same hours**, and G1 is the
first goal with eight posts already planned. A garden with three notes looks worse than no garden —
it reads as an abandoned experiment rather than a working notebook.

**Unpublish from nav and sitemap now** (plan item 1.1), keep every line of code, and revisit only
once G1 has its eight posts. At that point the garden has raw material — the offcuts of those posts
are exactly what a garden is for — and 15–20 notes is 6–8 hours rather than a cold start.

Cost of deferring: zero. Cost of filling it now: the blog does not get written.

### `/paths` — DELETE

A learning path is a **curation layer over content that does not exist.** With 2 posts there is
nothing to sequence, and even at 10 posts you would get one thin path. The feature only becomes
honest somewhere north of 15 posts with genuine prerequisite structure — which may never happen, and
should not be a debt you carry until it does.

**Delete:** the `/paths` and `/paths/[slug]` routes, `components/knowledge/PathSteps.tsx`, the
`learningPath` schema, its queries and its `knowledgePages.paths` copy block.

This is the "willing to delete things that took effort" case. The rebuild cost later is roughly what
the original build cost, and paying it later — with real posts to sequence — produces a better
feature than preserving a guess made with no content.

### `/review` — DELETE

The most elaborate machinery on the site with the least plausible payoff: a spaced-repetition deck
assembled from article checkpoints, with Anki export.

It requires a reader to **return to your site repeatedly, on a schedule, to revise someone else's
material.** That is a behaviour that essentially does not occur on a personal site, at any post
count. It is not blocked on content; it is blocked on an assumption about readers that will not come
true. Filling it would not fix it.

**Delete:** the `/review` route, `components/knowledge/ReviewDeck.tsx`, the review query and the
`knowledgePages.review` copy block.

**Keep `lib/anki.ts`** and keep the per-article checkpoint export. A button on an article that says
"export these terms to Anki" is genuinely useful and costs nothing — the reader takes the cards into
a tool they already use, which is where revision actually happens. It is the site-wide deck that has
no audience, not the export.

### What this adds up to

Nine routes become six. Of your scarce writing hours, **~4 buy both a working glossary and a library
shelf** — the two that serve a goal directly. The garden waits for the blog to feed it. Two features
go away entirely, and the site stops advertising four rooms with nothing in them.

Sequenced against the plan: this is item **1.1**, and the deletions should land in the same session
as the unpublishing, before any of the Milestone 2 typography work — deleting four routes removes
their sub-12px elements from the retype pass entirely.

**One adjacent note:** `sanity/schemas/documents/mediaItem.ts:11-13` uses emoji in its field-group
titles (📖 💭 🔗). The September sweep removed emoji from the site but not from Studio. Cosmetic, and
worth folding into whichever session touches the library.
