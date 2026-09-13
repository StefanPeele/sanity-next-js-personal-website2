# Launch checklist

**What this is:** everything that must be true before I would call stefanpeele.com shippable,
each marked **DONE**, **NEEDS STEFAN**, or **AT RISK**. It replaces the accumulation of
per-phase claims in `OVERHAUL-PROGRESS.md` with one statement you can check.

**Measured 2026-09-13 against `b38d9ce`, live on production.** Everything below with a number
in it was re-run today; nothing is carried forward from an earlier phase's write-up.

**The short version.** The code is shippable. The content is not, and that is the only thing
standing between this site and launch. There are **no AT RISK items in the code** — the four
open items are a dashboard setting, a mailbox, a person with a screen reader, and writing.

---

## 1. Build and correctness

| | Item | Evidence |
| --- | --- | --- |
| **DONE** | `npm run check` exits 0 with **zero warnings** | Re-run today. Zero eslint output, typegen clean: 43 queries, 84 schema types |
| **DONE** | `npm run build` succeeds from a clean `.next` | Re-run today after `rm -rf .next` |
| **DONE** | Suite green | **131 passing** — 92 chromium + 39 screenshots |
| **DONE** | The suite can actually fail | `tests/screenshots.spec.ts` had **no `expect` at all** until today; 39 of the 131 could not fail. It now fails on any uncaught exception or unexpected failed request. See §7 |
| **DONE** | No content route is cached without an expiry | `tests/caching.spec.ts`, asserted against the build manifest, negative control run |
| **DONE** | The per-phase harnesses still pass, re-run today | `measure-themes` 15/15 · `measure-toolbar` 50/50 · `measure-corrections` 27/27 · `measure-reading-controls` 22/22 · `measure-article-layout` no problems · `verify-fixture-render` **41/41**, which is the only proof the anonymity contract holds |

## 2. Production health

| | Item | Evidence |
| --- | --- | --- |
| **DONE** | Every public route renders at every breakpoint | **69/69** — 21 routes × 1440/768/390 + 6 machine surfaces. `docs/audit/verify-production.mjs`, raw in `production-verify.json` |
| **DONE** | One `<h1>`, one `<main>`, `#content` on every route | Part of the 69 |
| **DONE** | No horizontal overflow at any breakpoint | Part of the 69 |
| **DONE** | No uncaught exception, failed request or CSP violation on any route | Part of the 69. The only error the harnesses ever see is Sanity's live-events stream CORS-blocked on `127.0.0.1`, which is allow-listed in production — verified by preflight returning 204 |
| **DONE** | Feeds, sitemap, robots, manifest, health all valid | 6/6. `feed.xml` and `feed.json` 37KB each with full `content:encoded` |
| **DONE** | Content changes reach the live site | Comment created in Sanity appeared in **17s**, deleted disappeared in **308s** — the 300s floor |

## 3. The four things only you can do

| | Item | Why it is yours |
| --- | --- | --- |
| **NEEDS STEFAN** | **The Sanity webhook does not reach production** | Dashboard → API → Webhooks. Its delivery log settles it: 401s mean the secret, 404s the URL, no attempts means the trigger or filter. Triggers must include **Delete**; filter empty; secret must equal Vercel's `SANITY_REVALIDATE_SECRET`. Both API tokens lack `sanity.project.webhooks/read` and the Vercel CLI is not logged in, so this is unreachable from here. **Not blocking launch** — the 300s floor means content is at worst five minutes stale instead of stale for ever |
| **NEEDS STEFAN** | **Resend has never delivered to a real mailbox** | Every probe used `@example.invalid`. The full path is exercised — form, rate limit, token, confirm route, unsubscribe on GET and POST — but no real email has been sent. Subscribe with your own address once and confirm the link works |
| **NEEDS STEFAN** | **No screen-reader pass** | `A11Y-AUDIT.md` names this as the largest remaining gap. Everything there reasons from the accessibility tree, and the tree is not the experience. Highest-risk claim: that the reading toolbar and the sidenotes are usable non-visually. Needs NVDA or VoiceOver and a person |
| **NEEDS STEFAN** | **`/test` is a live, indexable page** | A `page` document titled "test", slug `test`, created 2026-03-26. Returns 200, carries `robots: index, follow`, listed in `sitemap.xml`. The code is doing exactly what a page document asks — this is content, so deleting it is your call. **Delete it before launch** |

## 4. Accessibility

| | Item | Evidence |
| --- | --- | --- |
| **DONE** | axe: no critical/serious violations | `/`, `/blog`, `/services`, first post, under `prefers-reduced-motion` |
| **DONE** | Contrast | 0 failures across every visible text node on 8 routes, composited through every ancestor's alpha |
| **DONE** | Focus visible on everything reachable by `Tab` | 89 elements across `/blog` and an article, every one shows a ring |
| **DONE** | Touch targets ≥ 24×24 (WCAG 2.5.8 AA) | Six links and one label were 20px tall; fixed with `py-1`, nothing moved |
| **DONE** | Zoom to 200% and 400% | No horizontal scroll, no unreachable controls |
| **AT RISK** | **Heading levels in the published article** | `/blog/the-field-…` renders `h1` then seven `h5` section headings, while "Responses" and "Contents" are `h2` — the machinery outranks the writing. A screen-reader user navigating by level is told the article has no sections. `scripts/migrate-heading-levels.mjs` fixes it, dry-run by default. **NEEDS STEFAN**: an `h5` renders 19/20px and an `h2` 32/38px, so it changes how a published piece *looks* |
| **NEEDS STEFAN** | Real screen reader | §3 above |

## 5. Content — the actual blocker

| | Item | Detail |
| --- | --- | --- |
| **AT RISK** | **Most of the site's surface has never rendered for a real post** | Three published posts carry only: title, slug, excerpt, categories, a cover image, and body text. Every other field is null on all three. See **`CONTENT-TO-WRITE.md`** for the complete list and what would exercise each |
| **AT RISK** | **Five of the knowledge routes are empty** | `note` 0, `mediaItem` 0, `glossaryTerm` 0, `series` 0, `tag` 0. `/garden`, `/library`, `/glossary`, `/blog/series` all render their empty states correctly — but they render empty |
| **AT RISK** | `/resume` is thin | 1 `skill` document; `experience`, `certification`, `education` are all 0 |
| **AT RISK** | `/services` has no testimonials | `testimonial` 0 |
| **NEEDS STEFAN** | Set `articleType` and `reviewStatus` on the three existing posts | **The single highest-leverage action on this list.** Two dropdowns per post, no writing, and it turns on the lane kickers, the lane filter, the status badges, the status aura, the "Checked" facet row, the credibility section, the RSS status vocabulary and the OG card kicker — all of which are built, tested, and currently invisible |

## 6. Infrastructure

| | Item | Evidence |
| --- | --- | --- |
| **DONE** | Sanity data is not cached for ever | `fetchOptions.revalidate` = 300 in production. Before: 31 of 36 prerendered routes had `initialRevalidateSeconds: false` |
| **DONE** | The service worker's cache is bounded | Static cache capped at 150 entries. It was unbounded at 1.7 MB/deploy — enough that a browser would eventually evict the whole origin, taking the offline articles with it |
| **DONE** | Offline reading works and does not serve stale articles | Network-first for article navigations, cache-first only for content-hashed assets |
| **DONE** | CSP enforced, no violations | Asserted in the suite and re-checked across all 21 routes today |
| **DONE** | `robots.txt` and `noindex` correct | `/studio`, `/api`, `/_next` disallowed; `/studio` and `/offline` `noindex` |
| **DONE** | Secrets are not in the client bundle | `SANITY_API_WRITE_TOKEN`, `RESEND_API_KEY`, `SANITY_REVALIDATE_SECRET` are all server-only |

## 7. Things that are shipped but have never been exercised by real content

**This is the section most likely to embarrass us after launch, so it is stated plainly.**

| Feature | Built and tested by | Never seen with real content |
| --- | --- | --- |
| The whole status/credibility system | `fixture-kitchen-sink` (draft), `measure-aura.mjs` 23/23 | No published post has a `reviewStatus` |
| Reviewer attribution + the anonymity contract | `verify-fixture-render.mjs` **41/41 today** | No published post has a `reviewers` array. The contract that an anonymous reviewer's name never enters the RSC payload has only ever been proven against a fixture |
| Sidenotes and the margin column (all of Phase 6) | `measure-sidenotes-margin.mjs` 30/30 | **No published post contains a single `sidenote` mark.** The only mark used anywhere in production is one `link` |
| Corrections in place (Phase 3B) | `measure-corrections.mjs` 27/27 | No post has ever been corrected |
| Comments, reactions, moderation (Phase 8) | 58/58 local, verified on production with probe comments | **Zero real comments exist.** Every article renders an empty thread |
| The newsletter | 20/21 checks | No real subscriber, no real send |
| Eleven custom body blocks | The kitchen-sink fixture | None appears in a published post — see `CONTENT-TO-WRITE.md` |
| The knowledge graph | Renders | 3 posts, 0 tags, 0 notes, 0 glossary terms — it draws almost nothing |
| Series presentation | Built: banner, index, prev/next, part numbers | 0 series documents. "Home lab Week 2" exists with no Week 1 |

**What this means for launch.** None of it is broken; all of it is unproven against anything
but fixtures. The risk is not that these features fail — it is that the site launches looking
like a plain three-post blog while carrying the machinery of a much more ambitious one.

## 8. Deliberately not built, with the reason

| Item | Decision |
| --- | --- |
| Reading position synced across devices | **No.** It needs an identity, which would turn a local convenience into an account system holding a stranger's reading position against their email. Revisit only if a reader asks |
| A "start here" page | **Not yet.** The trigger is the index no longer fitting one screen at 1440. Measured today: it still fits |
| Series presentation work | **Not yet.** The presentation is built; the trigger is writing Week 1 |
| A "popular posts" list | **No.** The site has no analytics and wants none |
| The digest / newsletter archive (9.2–9.5) | **NEEDS STEFAN** — a whole feature, and sending is the first irreversible action on this site |
| AI-generated summaries (5.6) | **NEEDS STEFAN** — cost, labelling and editorial policy are all yours |

---

## The order I would do it in

1. **Delete `/test`.** One minute, and it is currently indexable.
2. **Set `articleType` + `reviewStatus` on the three posts.** No writing; turns on the most surface for the least work.
3. **Add tags to the three posts.** Turns on the facet row and gives the graph edges to draw.
4. **Answer the webhook question** in the Sanity dashboard.
5. **Subscribe yourself** and confirm the email arrives.
6. Then write — in the order `CONTENT-TO-WRITE.md` argues for.
