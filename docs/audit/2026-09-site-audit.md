# stefanpeele.com — Studio editability and UI audit (4 Sept 2026)

Companion to the screenshots in `docs/audit/screenshots/{before,after}/`. Baseline = production at commit `d544239` (3 Sept). Now = `main` after commits `af1bc26` … `9985337`.

## 1. Summary

- Every heading, lede, label, empty state, button and optional section on the site now comes from a Studio singleton, with code defaults in `lib/cms/defaults/*.ts` so an empty or deleted document never breaks a page.
- The "archive/terminal" jargon is gone: no eyebrow mini-headers, no `Directory / Index`, `Intelligence // Archive`, `Transmission`, `Curriculum vitae`, `System // Error`, no telemetry block or watermark in the footer, no emoji glyph sets.
- The article page keeps one TOC per breakpoint, one thin progress bar, one "Reading options" menu, the learning blocks, read-next, newsletter, Ask, comments and reactions. Nine floating widgets were deleted.
- Studio has a **Site** desk group: Identity & SEO, Navigation, Home, Writing page, Knowledge pages, Pages, Services page, Article UI, Taxonomy, Error pages.
- `npm run build` passes, all 26 routes return 200 (404 for unknown slugs), `npx tsc --noEmit` is clean, lint has 0 errors (32 pre-existing warnings).

## 2. Baseline — what existed on 3 Sept

| Area | State before |
| --- | --- |
| Editable in Studio | `home` (title, overview, currently, location, showcase) and `settings` (social links, OG image). `settings.menuItems` existed but the Navbar ignored it. |
| Copy in code | `lib/site.ts` (nav, article types), `lib/pricing.ts`, and JSX on every page: ~16 eyebrow labels, 12 hard-coded lists/stat blocks, 5 pages with zero CMS content (`/uses`, `/services`, `/blog/osi-model`, 404, error). |
| Jargon | `Directory / Index`, `Intelligence // Archive`, `Featured // Latest Report`, `Archive // Volume`, `Transmission`, `Curriculum vitae`, `Visual archive`, `System // Error`, `Signal lost`, `Initiate contact`, footer telemetry `<dl>` with build SHA/region, watermark. |
| Article page widgets | ArticleFloatingToolbar (rail), ArticleProgressRail, MobileTOC sheet, FloatingQuizTrigger pill, ReadingRuler, SwipeNavigation cards, ResumePill, ThemePrompt, ArticleEffects (cursor spotlight, magnetic buttons, runtime Lexend fetch, CRT overlay, flicker). |
| Icons | Emoji sets in garden statuses (🌱🌿🌲), library media types (📚📰📑🏭…), sources list, failure notes, service badges (✦ ◈), series glyph (≡). |
| Background | Animated gradient repainting every frame (froze Chrome captures). |

## 3. What changed (by commit)

| Commit | Scope |
| --- | --- |
| `af1bc26` CMS foundation | `lib/cms/{withDefaults,loaders,icons}`, `defaults/{navigation,taxonomy,settings,errorPages}`, shared objects (`navLink`, `pageHeader`, `sectionCopy`, `labelValue`, `faqItem`, `usesItem/Section`, `vocabEntry`), singletons `navigation`/`taxonomy`/`errorPages`, schema barrels, Site desk group, `RESERVED_SLUGS` validation on `page.slug`, `.section-label` utility. |
| `3e4c56a` Chrome + home + errors | Navbar/Footer/SearchModal read `navigation` + `settings`; footer telemetry, watermark, "Transmission" removed; home `sections[]` (toggle + drag order) rendered by `components/home/HomeSections.tsx`; 404/error copy from `errorPages`; static `BlogBackground`; Lexend via `next/font`; presentation locations for every singleton. |
| `38a045d` Article page | New `ReadingProgressBar`, `ArticleToc`, `ReaderMenu` (theme, text size, width, accessibility, share/export, read aloud, bookmark); nine widgets deleted; `articleUi` singleton drives every label (header, TOC, menu, TL;DR, prerequisites, checkpoint, concept cards, sources, credibility, backlinks, cite, read next, Ask, comments, reactions, series banner); cursor/CRT/focus-mode CSS removed; `post.recommendedTheme` honoured as initial theme. |
| `c2c74b9` Blog index + knowledge | `blogPage` singleton (header, stats labels, featured, directory columns, reference links with lucide icons, series/reading/notes strips each with `enabled`, list + filter labels, empty state); `knowledgePages` singleton for garden, library, glossary, paths, review, series, graph (header, stat labels, empty state, related nav); taxonomy labels for lanes, note statuses, media types. |
| `82baf4a` Personal pages + services | `personalPages` singleton (projects index + case-study labels, resume section labels/legend/cert statuses/fallback education/toggles, contact, now, uses sections, photography index/albums/gallery/loader); `servicesPage` singleton (hero + stats with `valueSource`, packages copy, tab labels, NJIT toggle copy, standard delivery, package-card labels, physical products, promise pillars, FAQ, testimonials, entire booking form copy). |
| `7764f9b` Icons + jargon sweep | All emoji → lucide via `lib/cms/icons.tsx`; OG image and global error strings de-jargoned; email preheaders plain. |
| `f0330dc` Seed + revalidate + docs | `scripts/seed-content.ts` (`--dry-run`/`--force`, patches `home`/`settings` by type so the random-id home doc is found); table-driven revalidate route covering every singleton and document type; README, `.env.local.example`, `CLAUDE.md` updated. |
| `9985337` Audit assets | "After" screenshots; removed a stray `group` on nested settings fields that broke `sanity manifest extract`. |

Net: 144 files, +14,787 / −6,497 lines. Deleted: the nine article widgets. Added: 3 loaders/helpers, 10 defaults modules, 8 singletons, 3 query files, 3 schema barrels, 3 article components, 3 providers, seed script.

## 4. Before / after captures

Desktop captures at the same Chrome viewport (958 × 944 CSS px — Chrome refused the 1440 resize both times, so the pairs are like-for-like). Files: `docs/audit/screenshots/{before,after}/{route}-1440-{top,mid}.jpg` for home, blog (top + mid), post (top + mid), garden, library, projects, resume, contact, services, photography, graph.

Mobile (390 px) captures are **not available**: the Chrome extension could not resize the window below its desktop width. Mobile behaviour was verified by the responsive classes and the smoke test only.

## 5. Not yet applied

| Item | Why | Where it lives now |
| --- | --- | --- |
| Package prices and add-ons in Studio (`servicePackage` / `serviceAddOn` documents) | Names must match Airtable option names exactly; a typo in Studio would silently break bookings. Decided to keep them in code. | `lib/pricing.ts` |
| `/blog/osi-model` copy | Long interactive reference page; only the jargon was swept. | `app/(archive)/blog/osi-model/` |
| Offline page copy (`sw.js`) | Service worker is a static file; made plain, not editable. | `public/sw.js` |
| Knowledge-graph legend labels | Reads taxonomy colours; legend strings still in the component. | `components/graph/KnowledgeGraph.tsx` |
| Seeding the production dataset | The local `SANITY_API_WRITE_TOKEN` is invalid (`Unauthorized - Session not found`). The dry run works with the read token. Until seeded, Studio shows the defaults as `initialValue` when a singleton is first opened, and the site renders the same defaults. | Run `npx tsx scripts/seed-content.ts` after replacing the token. |
| Mobile screenshots | Chrome extension could not resize to 390 px. | — |
| Home overview text ends in ". ." | Content in the `home.overview` field, not code. | Studio → Site → Home |
| Studio on localhost | `localhost:3111` is not a CORS origin for the project; Studio works on stefanpeele.com/studio. | Sanity → API → CORS origins if local Studio is wanted. |

## 6. Customizability matrix

Columns: heading · lede · labels · empty state · buttons · section on/off · section order · nav. Y = editable in Studio, P = partial, — = not applicable, N = code only.

| Page / area | Heading | Lede | Labels | Empty | Buttons | On/off | Order | Studio path |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Navbar, drawer, search | — | — | Y | — | Y | — | Y | Site → Navigation |
| Footer | Y | — | Y | — | Y | — | — | Site → Identity & SEO → Footer |
| Newsletter | Y | Y | Y | — | Y | — | — | Site → Identity & SEO → Newsletter |
| Home | Y | Y | Y | — | Y | Y | Y (drag) | Site → Home → Sections |
| Writing index | Y | Y | Y | Y | Y | Y (3 strips + directory) | N | Site → Writing page |
| Article page | Y | — | Y | Y | Y | P (comments/Ask depend on env) | N | Site → Article UI |
| Garden, Library, Glossary, Paths, Review, Series, Graph | Y | Y | Y | Y | Y | — | — | Site → Knowledge pages |
| Projects + case study | Y | Y | Y | Y | Y | — | — | Site → Pages → Projects |
| Resume | Y | Y | Y | Y | Y | Y (email/GitHub) | Y (skill categories) | Site → Pages → Resume |
| Contact | Y | Y | Y | — | Y | Y (photo call-out) | — | Site → Pages → Contact |
| Now | Y | Y | Y | Y | Y | — | — | Site → Pages → Now |
| Uses | Y | Y | Y | Y | — | — | Y (sections array) | Site → Pages → Uses |
| Photography index / albums / album | Y | Y | Y | — | Y | — | — | Site → Pages → Photography |
| Services | Y | Y | Y | — | Y | Y (products, promise, FAQ, testimonials) | N | Site → Services page |
| Booking form | Y | Y | Y | — | Y | — | — | Site → Services page → Booking form |
| Package prices | N | — | Y (card labels) | — | Y | — | N | `lib/pricing.ts` |
| 404 / error | Y | Y | Y | — | Y | — | — | Site → Error pages |
| Article lanes, note statuses, media types, skill levels | — | — | Y (keys fixed) | — | — | — | — | Site → Taxonomy |
| OSI model page | N | N | N | — | — | — | — | code |

## 7. Verification log

- `npx tsc --noEmit`: clean. `eslint`: 0 errors, 32 warnings (pre-existing `set-state-in-effect`, unused `SITE`).
- `npm run build`: passes, Studio manifest extracted.
- Route smoke against `next start -p 3111`: 25 routes 200, `/definitely-missing` 404 with "Page not found" copy, `/studio` 200.
- Grep gates: no `Directory /`, `Intelligence //`, `Transmission`, `Curriculum vitae`, `Visual archive` in `app/` or `components/` (outside osi-model); no emoji glyphs in `app/`, `components/`, `lib/`.
- Seed dry run: 8 to create, 2 to patch (`home` by its random id, `settings`), 0 failed.
