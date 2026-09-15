# Launch checklist

**What this is:** everything that must be true before I would call stefanpeele.com shippable,
each marked **DONE**, **NEEDS STEFAN**, or **AT RISK**. It replaces the accumulation of
per-phase claims in `OVERHAUL-PROGRESS.md` with one statement you can check.

**Most numbers below were measured 2026-09-13 against `b38d9ce`; the ones re-measured since
carry their own date.** There has been real code since — the revalidate route move, the
progress fix, the style menu, the tour badge and the toolbar legibility pass — so this file
no longer claims that everything after `b38d9ce` is documentation only. To check what is
actually live rather than trust any of it:

```
curl -s https://stefanpeele.com/api/health
```

**Updated 2026-09-15. The webhook is repointed at `/api/revalidate`, the alias is deleted,
and deliveries were measured arriving in about 4 seconds.** That was the last open defect.
Numbers dated 2026-09-13 below were not re-run since and say so.

## What remains, and what it blocks

**Nothing in the code blocks launch.** Four things are open and here is what each one
actually holds up:

| | What | Blocks |
| --- | --- | --- |
| 1 | **The writing.** `CONTENT-TO-WRITE.md`, items 1-5 first, each under an hour | **The launch itself.** Everything else is ready for content that is not there yet. This is the only item on the list that gates the site |
| 2 | **`articleType` + `reviewStatus` on the three posts.** Two dropdowns per post, no writing | Nothing, but it is the highest-leverage twenty minutes available: it turns on the lane kickers, the status badges and aura, the credibility section, the "Checked" facet row, the RSS status vocabulary and the OG kicker, all of which are built and currently invisible |
| 3 | **The heading fix.** `HEADING-FIX.md`, seven dropdowns, Legacy H5 to Section | Nothing, but it is a live accessibility defect on a published post: a screen-reader user is told that article has no sections. The CAUSE is fixed, so it cannot recur |
| 4 | **`DIGEST_SEND_SECRET` in Vercel** | Only sending a digest. The route returns 500 until it exists, which is the safe direction |

**One thing that is open and is not a task:** the screen-reader pass. `A11Y-AUDIT.md` reasons
from the accessibility tree, and the tree is not the experience. It needs a person with NVDA
or VoiceOver, and it blocks a *claim* rather than a launch.

**Two decisions, neither blocking:** whether a commenter may withdraw their own comment, and
whether a Correction can be promoted into a 3B correction.

---

## 1. Build and correctness

| | Item | Evidence |
| --- | --- | --- |
| **DONE** | `npm run check` exits 0 with **zero warnings** | Re-run 2026-09-15. Zero eslint output, typegen clean: **47 queries, 85 schema types** |
| **DONE** | `npm run build` succeeds from a clean `.next` | Re-run today after `rm -rf .next` |
| **DONE** | Suite green | **146** — 107 chromium, re-run 2026-09-14, plus 39 screenshots last run 2026-09-13. Two new guards today: the revalidate webhook probe and the progress bar reaching 100% at the end of the article |
| **DONE** | The suite can actually fail | `tests/screenshots.spec.ts` had **no `expect` at all** until today; 39 of the 131 could not fail. It now fails on any uncaught exception or unexpected failed request. See §7 |
| **DONE** | No content route is cached without an expiry | `tests/caching.spec.ts`, asserted against the build manifest, negative control run |
| **DONE** | The per-phase harnesses still pass, re-run today | `measure-themes` 15/15 · `measure-toolbar` 50/50 · `measure-corrections` 27/27 · `measure-reading-controls` 22/22 · `measure-article-layout` no problems · `verify-fixture-render` **41/41**, which is the only proof the anonymity contract holds |

## 2. Production health

| | Item | Evidence |
| --- | --- | --- |
| **DONE** | Every public route renders at every breakpoint | **78/78, re-run 2026-09-14 against `4a43a49`** — 23 routes × 1440/768/390 + 6 machine surfaces + 3 webhook probes. `docs/audit/verify-production.mjs`, raw in `production-verify.json` |
| **DONE** | One `<h1>`, one `<main>`, `#content` on every route | Part of the 78 |
| **DONE** | No horizontal overflow at any breakpoint | Part of the 78 |
| **DONE** | No uncaught exception, failed request or CSP violation on any route | Part of the 78. The only error the harnesses ever see is Sanity's live-events stream CORS-blocked on `127.0.0.1`, which is allow-listed in production — verified by preflight returning 204 |
| **DONE** | Feeds, sitemap, robots, manifest, health all valid | 6/6. `feed.xml` and `feed.json` 37KB each with full `content:encoded` |
| **DONE** | Content changes reach the live site | **About 4 seconds, measured 2026-09-15** with the webhook repointed: a `blogPage` mutation replaced the CDN entry for `/blog` that fast. The older figures — a comment appearing in 17s and a deletion clearing in 308s — were taken with **no working webhook at all** and are the worst case, not the normal one |
| **DONE** | **Reading progress means the article** | The bar reaches 100% when the last line of the prose meets the fold, with 2,339px of apparatus and footer still below it on the longest post, and "0 min left" at the same moment. Guarded in `tests/smoke.spec.ts` and `docs/audit/measure-progress-readout.mjs` 28/28 |
| **DONE** | **The webhook target itself is checked** | An unsigned POST to `/api/revalidate` must return **401**, not 404. In `docs/audit/verify-production.mjs` after a deploy and `tests/smoke.spec.ts` before one, each with a control probe of a route that does not exist. This is the check that did not exist for the week the webhook was dead |

## 3. The things only you can do

| | Item | Why it is yours |
| --- | --- | --- |
| **DONE** | ~~The Sanity webhook does not reach production~~ | **Cause found by Stefan 2026-09-14, and it was the URL, not the secret.** The webhook was configured with `/api/revalidate`; the handler lived at `/api/draft-mode/enable/revalidate`. Every publish from **7 September** 404d, silently, because a dead webhook does not break a page — it leaves the page as it was. Measured before the fix: `POST /api/revalidate` **404**, `POST /api/draft-mode/enable/revalidate` **401**. Stefan repointed the webhook; the handler then moved to `/api/revalidate`, where it belongs, with the old path kept as a delegating alias so nothing broke during the deploy |
| **DONE** | ~~Repoint the webhook at `/api/revalidate`~~ | **Done by Stefan 2026-09-15**, and the alias is deleted. Verified by behaviour rather than by the dashboard, which no token here can read: a `blogPage` mutation replaced the CDN entry for `/blog` **about 4 seconds later**, measured through the `age` header, which is a delivery and not the 300s floor. Re-run with the alias deleted, so only one URL could have served it: age 66s → **0 with `x-vercel-cache: REVALIDATED`, 11 seconds after the mutation**. The old path now returns 404, asserted in `tests/smoke.spec.ts` and `verify-production.mjs` rather than merely dropped from them |
| **DONE** | ~~Resend has never delivered to a real mailbox~~ | **Confirmed end to end 2026-09-14, by Stefan, against a real mailbox: subscribe, confirm, unsubscribe.** Every probe before this used `@example.invalid` and could prove the code path but never delivery. What is still unproven is a *digest* send, which is a different route and needs the variable below |
| **NEEDS STEFAN** | **No screen-reader pass** | `A11Y-AUDIT.md` names this as the largest remaining gap. Everything there reasons from the accessibility tree, and the tree is not the experience. Highest-risk claim: that the reading toolbar and the sidenotes are usable non-visually. Needs NVDA or VoiceOver and a person |
| **DONE** | ~~`/test` is a live, indexable page~~ | **Closed 2026-09-13, deleted.** Its entire content was `title: "test"`, `overview: "test ttttt"`, `body: "blaeee"` — recorded here so it is restorable, and unambiguously scratch. Dataset 516 → 515 |

| **NEEDS STEFAN** | **`DIGEST_SEND_SECRET` is not set** | Added 2026-09-13 with the digest. The send route returns 500 until the variable exists in Vercel, which is the safe direction, but it means no digest can be sent. Set it, then use "Send test to me" from the Studio action before the first real send |

## 4. Accessibility

| | Item | Evidence |
| --- | --- | --- |
| **DONE** | axe: no critical/serious violations | `/`, `/blog`, `/services`, first post, under `prefers-reduced-motion` |
| **DONE** | Contrast | 0 failures across every visible text node on 8 routes, composited through every ancestor's alpha |
| **DONE** | Focus visible on everything reachable by `Tab` | 89 elements across `/blog` and an article, every one shows a ring |
| **DONE** | Touch targets ≥ 24×24 (WCAG 2.5.8 AA) | Six links and one label were 20px tall; fixed with `py-1`, nothing moved |
| **DONE** | Zoom to 200% and 400% | No horizontal scroll, no unreachable controls |
| **AT RISK** | **Heading levels in the published article** | `/blog/the-field-…` renders `h1` then seven `h5` section headings, while "Responses" and "Contents" are `h2` — the machinery outranks the writing. A screen-reader user navigating by level is told the article has no sections. **`HEADING-FIX.md` is the worklist**, measured post by post: it is ONE post and seven dropdowns, not a migration. The other two posts are already correct. Still yours, because an `h5` renders at 19/20px and an `h2` at 32/38px, so it changes how a published piece looks. **The CAUSE is fixed as of 2026-09-14:** the editor offered Heading 1-6 with no indication of what any of them did, and now offers Section / Subsection / Minor heading, so the next post cannot be written this way |
| **NEEDS STEFAN** | Real screen reader | §3 above |

## 5. Content — the actual blocker

| | Item | Detail |
| --- | --- | --- |
| **AT RISK** | **Most of the site's surface has never rendered for a real post** | Three published posts carry title, slug, excerpt, categories, a cover image, body text, one link and one `featuredAt`. Every other field is empty on all three. **`CONTENT-TO-WRITE.md` is now a single ordered list**, sorted by how much each item turns on per unit of writing. Items 1-5 take under an hour and about a hundred words |
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
| **DONE** | The expanded reading toolbar is legible | Nothing in the open panel under 14px, group headings 14px semibold above 14px controls, every text node at or above 7.49:1 composited. `docs/audit/measure-toolbar-legibility.mjs` 30/30 at 1440, 1024 and 390. One thing it reports and does not fix: at 1024 the open panel overlaps the prose by 106px, pre-existing, see the harness comment |
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
| The newsletter | 20/21 checks, and **delivery to a real mailbox confirmed 2026-09-14** (subscribe, confirm, unsubscribe) | Still no real *digest* send, and no subscriber but Stefan |
| Eleven custom body blocks | The kitchen-sink fixture | None appears in a published post — see `CONTENT-TO-WRITE.md` |
| The knowledge graph | Renders | 3 posts, 0 tags, 0 notes, 0 glossary terms — it draws almost nothing |
| Series presentation | Built: banner, index, prev/next, part numbers | 0 series documents. "Home lab Week 2" exists with no Week 1 |
| The featured archive | `/blog/featured`, built and live | One entry, and it has **no note yet** — the sentence that is the entire point of the page |
| The digest | Schema, Studio send action, archive, all built | 0 digests, and `DIGEST_SEND_SECRET` is not set, so none can be sent |
| The first-visit tour | 19/19 on `measure-tour.mjs` | It runs, but **three of its five steps point at nothing**: no published post has a status, a sidenote or a correction. The steps still teach the vocabulary, which is why a missing target is handled rather than skipped |
| The summary panel | 13 assertions on the suppression rules | No post has a summary |

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

1. ~~Delete `/test`.~~ Done 2026-09-13.
2. ~~Answer the webhook question.~~ Done 2026-09-14 — it was the URL. One field left: repoint it at `/api/revalidate`.
3. ~~Subscribe yourself and confirm the email arrives.~~ Done 2026-09-14, end to end.
4. **Set `articleType` + `reviewStatus` on the three posts.** No writing; turns on the most surface for the least work.
5. **Add tags to the three posts.** Turns on the facet row and gives the graph edges to draw.
6. **Set `DIGEST_SEND_SECRET`** in Vercel, then send a test digest to yourself.
7. Then write — in the order `CONTENT-TO-WRITE.md` argues for.
