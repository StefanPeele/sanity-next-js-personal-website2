# Resume state

Written: 2026-09-12, at the end of a session that worked every phase in the brief.
Why the session ended: **every remaining item is blocked** — the production deploy on a
Vercel rate limit, the screen-reader pass on needing a person, and the proposals on Stefan.
Kept current throughout rather than written at the end.

## Exactly where I stopped

- **Phase 0, 1, 2.1** — complete and deployed. 2.2–2.6 proposed in `PROPOSALS.md`.
- **Phase 3 — complete.** 3.1 `d91a555`, 3.2 `aeb4f6f`, 3.3 `c010b18`, 3.4/3.6/3.7 `41e45f8`,
  3.5 `fc65349`.
- **Phase 3B (corrections in place) — complete**, `952452f`. Verified 10/10 by an
  independent verifier.
- **Phase 4 — complete.** 4.2/4.3/4.6 `7451e60`, 4.1/4.4/4.5 `0fabe5b`. Verified 8/9 by an
  independent verifier; the one FAIL was trap 16, disproved by `probe-tag-facet.mjs`.
- **Phase 5 — complete.** 5.5/5.6 `c473f5e`, 5.1–5.4 `e6181e5`, expanded controls `8373d6b`,
  read-aloud voice and speed `1eb1ab0`, index toolbar and density `eb558ee`.
- **Phase 6 — complete.** Design `0d2fa42`, margin notes `c93c366`, glossary unification
  `871d652`, Learn more `ac62224`.
- **Stega audit — shipped**, `d42823c`. Eight more places a draft-mode string was used as a
  key. `docs/audit/probe-stega-fields.mjs` measures which fields Sanity actually encodes.
- **Phase 7.1 + 7.2 — shipped together**, `b8a1621`. The measure is `ch` on `[data-article]`
  via a REGISTERED `<length>` property; the column around it is three tiers.
- **Phase 7.5 + 7.6 — shipped**, `1a73ad6` with fix `c7d028c`. 23/23 on
  `measure-progress-readout.mjs`, re-run against production.
- **Phase 7.3 and 7.4 — options rendered, measured and proposed** (`5f15fd0`). Both are
  *render the options* items, not ship items. Recommendations are in `PROPOSALS.md`.

**PHASE 7 IS COMPLETE**, pushed and deployed; production served `5f15fd0` when it was
verified.

- **Phase 8 — designed** (`629686c`, `docs/audit/PHASE-8-COMMENTS.md`) and **largely built**:
  `2b9e08c` (schema, server action, confirm route, desk group, redacted read query, rendered
  thread, durable rate limiter, blocklist) and `9dba7ad` (8.4, sidenote-anchored comments).
  **52/52** on `measure-comments.mjs`, which drives the real form, the real confirm link, a
  real signed webhook and draft mode. Suite 130. **Deployed, and verified on production** —
  see the block below.

  Built: 8.1 identity, 8.2 labels, 8.3 threading, 8.4 sidenote scope, 8.5 removal states,
  8.6 storage, 8.7 spam layers 1-4.
  Also built, and this file used to list both as unbuilt: the Studio **"Needs attention"
  view** (`sanity/plugins/settings.tsx`, filtering `status == "pending"`) and **one-click
  block** (`sanity/plugins/blockCommenter.tsx`, registered in `sanity.config.ts`), both
  shipped in `de6a46e`.
  Genuinely not built, each with its reasoning written down: a commenter withdrawing their
  own comment, and promoting a Correction into a 3B correction (deliberately deferred).

- **The staleness fix — shipped**, `dd56ff7`. next-sanity's production default is
  `revalidate: false`, so every `sanityFetch` was cached with NO expiry and 31 of 36
  prerendered routes could only ever be cleared by a webhook that turned out not to arrive.
  `sanity/lib/live.ts` now sets `fetchOptions.revalidate` to 300 in production; 7 routes
  never expire and all 7 are static assets. The dead `revalidateTag('sanity')` calls went
  with it — the tags are `sanity:<syncTag>`, so the bare string never matched anything, and
  **three earlier fixes to the webhook handler had been built on that false premise.**
  Verified on production: a comment created in Sanity appeared in 17s, one deleted in Sanity
  disappeared in 308s — the case that had failed all session.
- **The service worker's static cache — capped**, `368342d`. It had no ceiling: 1.7 MB of
  content-hashed chunks per deploy, ~34 MB after twenty, and a browser evicts a whole origin
  when it hits the storage limit, so this would have destroyed the offline articles it
  exists to protect. 150 entries, verified against the real worker in a real browser.
- **Regression guard — shipped**, `4c38d0e`. `tests/caching.spec.ts` asserts the BUILD
  OUTPUT, not the source: the config can be present and still not reach the routes. Its
  negative control was run.

## Production is at `74a642d`. Every reader-facing change is live and verified.

Two commits are pushed and NOT deployed — `ccb6237` and `c0bdf23` — because the Vercel deploy
quota is exhausted ("retry in 24 hours"). **Neither touches a production surface:** `ccb6237`
is the harness and the test spec, `c0bdf23` is this file. Everything that changes what a
reader gets is live:

| Commit | What | Verified on production |
| --- | --- | --- |
| `dd56ff7` | the revalidate floor — Sanity data no longer cached for ever | comment created in Sanity appeared in **17s**; deleted in Sanity disappeared in **308s** |
| `368342d` | the service worker's static cache capped at 150 | live `/sw.js` carries `MAX_STATIC` and `trimStatic`, 6893 bytes |
| `4c38d0e` | `tests/caching.spec.ts` + the sweep | all 17 public routes and 5 feeds healthy |
| `74a642d` | RESUME and CLAUDE.md corrections | docs only |

**How this was established, because the same evidence was read wrongly once before.** The
commit-status endpoint says *"Deployment rate limited — retry in 24 hours"* — and that alone
proves nothing, which is the mistake logged as artifact #30. What makes it true this time is
that `gh api .../deployments` shows **no record for either commit in any environment**, while
it does show `74a642d` as `success`. **Two independent sources agreeing is the bar.** When
they disagreed, the deployments record was the correct one.

`gh api .../deployments` plus its `/statuses` is the authoritative record — **not**
`gh api .../commits/<sha>/status`, which reported a rate limit that was not the deployment's
state and cost an hour. Check the first one.

## THE SANITY WEBHOOK DOES NOT REACH PRODUCTION. It is Stefan's to fix, and it is the one open defect.

Measured three independent ways on 2026-09-12:

- `/blog` is prerendered on the CDN, and both the `post` rule and the `comment` rule in the
  handler revalidate it — so its CDN `age` header is a witness to whether a delivery arrived.
  Mutating a comment, then a post, and watching it: age climbed **523 → 675** and
  **678 → 831** across 150 seconds each. A delivery that arrives resets it to zero. Neither
  did.
- An edit to a published post's excerpt reached `/blog` but **never reached the article in
  240 seconds**, while the Sanity API and its CDN both served the new value immediately.
- A request signed with the `SANITY_REVALIDATE_SECRET` from `.env.local` is **accepted by a
  local server (200) and rejected by production (401)** — identical payload, identical
  signing. So the signing is correct, production's secret IS set, and it is a **different
  value** from the one in `.env.local`.

Which failure it is cannot be determined from here: both API tokens return
`401 — requires grant sanity.project.webhooks/read`, and the Vercel CLI is not logged in.

**What Stefan needs to check**, Sanity dashboard → API → Webhooks:

1. Does a webhook exist, is it **enabled**, and does its URL end
   `/api/draft-mode/enable/revalidate` on `stefanpeele.com`?
2. Its **delivery log answers everything at a glance**: 401s mean the secret, 404s mean the
   URL, *no attempts at all* means the trigger or the filter.
3. Triggers must include **Create, Update AND Delete**. The filter must be empty.
4. Its secret must equal Vercel's `SANITY_REVALIDATE_SECRET` for the Production environment.
   If either is regenerated, update `.env.local` to match so local probes stay meaningful.

**It is no longer urgent, and that is the whole point of `dd56ff7`.** Until that commit a
webhook that never arrived meant content was stale *for ever*. It now has a five-minute
floor. The webhook is the fast path, not the only path.

## The rest of production is CURRENT. An earlier claim in this file that it was not was wrong.

`/api/health` reports HEAD, and `gh api .../deployments` shows an unbroken run of successful
Production deploys. Phase 8, 9.1, Phase 10 and Phase 11 are all live and were verified there:
**`measure-comments.mjs` runs 53/56 against `https://stefanpeele.com`**. The three
failures are a locally-signed webhook being rejected by production, and this file used to
call that *"only"*. It was not only anything — it was the visible edge of the defect above,
written off as a test artefact for most of a session. **A probe that fails against
production and passes locally is a finding until it is explained.**

**How the wrong claim happened, because it cost an hour and nearly ended the session early.**
`gh api .../commits/<sha>/status` returned *"Deployment rate limited — retry in 24 hours"* for
one commit, and I generalised it to every commit after it. **The commit-status webhook is not
the deployment record.** `gh api .../deployments` plus its `/statuses` is authoritative, and
it disagreed — twice. Check that one.

- **Phase 10 — audited**, `docs/audit/A11Y-AUDIT.md`. 8 findings, 6 fixed, 1 was this audit's
  own false positive, 1 remains and is CONTENT (the published article's seven section
  headings are `h5`). `scripts/migrate-heading-levels.mjs` fixes it, dry-run by default, and
  is deliberately NOT applied because it changes how a published article looks.

- **Phase 9 — answered.** 9.1 verified with evidence (20 pass, 1 not establishable from
  here); 9.2-9.5 proposed in `PROPOSALS.md`.

- **Phase 11 — evaluated**, in `PROPOSALS.md`. Two of the eight were defects and are fixed:
  print hid nothing, and the Open Graph card had been showing a different reading time from
  the article since 0.1. Two more were already done by earlier phases.

## EVERY PHASE IN THE BRIEF HAS NOW BEEN WORKED

## The single next action

Nothing in the brief is unworked. Four things remain and **every one of them needs Stefan**:

1. **Fix the Sanity webhook** (the section above). Until then every content change takes up
   to five minutes to appear instead of seconds.
2. **A real Resend delivery to a real mailbox.** Every probe used `@example.invalid`. The
   email path is exercised end to end but has never actually delivered to anyone.
3. **Drive the toolbar and the sidenotes with a real screen reader.** `A11Y-AUDIT.md` names
   this as the largest remaining gap in Phase 10; it needs a person, not a harness.
4. **`/test` is a live, indexable page.** A `page` document titled "test", slug `test`,
   created 2026-03-26 and still published. It returns 200, carries `robots: index, follow`
   and is listed in `sitemap.xml`. It is CONTENT, not a defect — the code is doing exactly
   what a page document asks for — so it is left for Stefan to delete rather than deleted
   here. The other five `page` documents (`blog`, `resume`, `projects`, `photography`,
   `services`) duplicate real routes and are correctly inert: the schema now rejects
   reserved slugs, `[slug]` 404s them and the sitemap filters them out.
5. **Decisions on `PROPOSALS.md`** — 2.2–2.6, 7.3, 7.4, the digest, and whether to run
   `scripts/migrate-heading-levels.mjs`, which changes how a published article *looks*.

**The comment system is now verified on production, including the case that failed all
session.** A comment created in Sanity appears on the live article and one deleted in Sanity
disappears from it, with no webhook and no in-process revalidation: **17s and 308s**. The
second is the 300s floor working exactly as designed.

Two §8 items are genuinely unbuilt — a commenter withdrawing their own comment, and
promoting a Correction into a 3B correction — and both need a decision from Stefan. This file
used to send the next session at the "needs attention" view as unbuilt work that "needs no
decision". It has been built since `de6a46e`. **Check the code before believing this file.**

## Things a fresh session will otherwise re-derive

- **`npm run check` exits 0 with zero warnings**, and the React Compiler lint is strict: it
  rejects `Date.now()` in render and `setState` synchronously inside an effect. Both were hit
  building the comment form, and both fixes were improvements rather than suppressions.
- **`.next/cache/fetch-cache` is a product concern, not just a testing one.** A published
  comment did not appear on the article because the fetch cache held the pre-comment result.
  Anything that writes content a page reads must `revalidatePath`.
- **Types missing from the webhook's RULES table fall through to a FULL SITE revalidation.**
  `rateBucket` and `blocklist` are in there with empty path lists for exactly that reason.
- **The dataset is 516 documents.** Every probe that seeds is expected to return it to 516,
  and `probe-comment-scale.mjs --delete` cleans up after an interrupted run.

## What is already true and should not be re-derived

- **The status vocabulary is one table**, `lib/status.ts`. Four separate copies of it have
  now been found and removed (a client component, the Studio preview, the Studio picker, and
  the lane equivalent of the same mistake). If you are about to write a `Record<string, …>`
  keyed on a status or a lane, you are writing the fifth.
- **The taxonomy is three lanes**: Perspective, Deep dive, Lab Notes. `transmission` is gone
  and `field-notes` is migrated; `?lane=field-notes` is aliased so old links live.
- **`revised` no longer exists as a status.** It is three derived words — `corrected`,
  `clarified`, `updated` — and exactly one applies, by severity. See `revisionState()`.
- **All three published posts carry no `articleType` and no `reviewStatus`.** Every status
  surface is therefore invisible in production and can only be seen through the draft
  fixtures. That is not a bug.

## Harnesses, and what each proves

Run with a server on `127.0.0.1:3000` serving the build you mean (check the CSS chunk hash).

| Harness | Proves |
| --- | --- |
| `docs/audit/verify-fixture-render.mjs` | 41 checks: every field and block type renders, and the anonymity contract holds against the RSC payload |
| `docs/audit/measure-aura.mjs` | 23: the status aura, its two-colour cap, reduced motion, and no text over it. Captures 3 intensities × 3 breakpoints |
| `docs/audit/measure-status-filter.mjs` | 16: the filter row is **absent** where no post has a status, and correct where one does |
| `docs/audit/measure-corrections.mjs` | 27: in place, at the foot, keyboard-operable, three kinds, nothing struck through |
| `docs/audit/measure-preview-placeholders.mjs` | 28: the hover preview's delays, edges and keyboard path; the placeholders' inertness. **Temporarily patches the blogPage singleton and restores it — verified by re-read** |
| `docs/audit/measure-directory-scale.mjs` | 22: the directory at 3 posts and at 50, three breakpoints, no post appearing twice |
| `docs/audit/measure-toolbar.mjs` | 50: the rail's position, the scroll test that catches the transform trap, state memory, dismissal and recovery. Runs twice — **normal and reduced motion** |
| `docs/audit/measure-themes.mjs` | 15: four themes, composited contrast on every text leaf, seven text sizes |
| `docs/audit/probe-tag-facet.mjs` | Settles whether a missing facet is a defect or a stale build |
| `scripts/seed-scale-fixtures.mjs --apply` | 47 draft-only posts so the 50-post state can be seen. `--delete` after |
| `scripts/seed-fixture-posts.mjs --apply` | Re-seeds the two draft fixtures and proves they are invisible to the published perspective |
| `scripts/migrate-lab-notes.mjs` | The 4.3 rename, dry-run by default |
| `docs/audit/measure-reading-controls.mjs` | 22: four spacing scales at three steps each, measured on the rendered prose, plus three toggles and Reset |
| `docs/audit/measure-prose-width.mjs` | Real CPL for every candidate width × three text sizes × three breakpoints. Prints a table and writes `prose-width.json` |
| `docs/audit/measure-sidenotes-margin.mjs` | 30: margin placement, the three 6.3 edge cases, the 6.5 window's focus trap, both 6.4 mobile options. **Not** `measure-sidenotes.mjs`, which is Phase 1.5 research on other sites |

Suite: `npx playwright test` — **131 passing** across both projects. The split is
deliberate, not an accident: `npm run test:e2e` runs only the chromium project (92) because
`playwright.config.ts` has it `testIgnore` the visual baseline to stay fast, and
`npm run screenshot` is the other half (39). Run BOTH before claiming the suite is green —
a report of 92 is the fast half, not the whole.

| `docs/audit/measure-sw-cache.mjs` | Drives the REAL service worker in a real browser: takes the static cache past the cap and watches one further fetch trim it back, with the newest entry surviving. A unit test of a copy of the function would prove nothing about the file that ships |

Two harnesses added this session:

| `docs/audit/probe-stega-fields.mjs` | Which fields Sanity ACTUALLY encodes in draft mode, per query, measured rather than inferred from `filterDefault`. `--paths`, `--portable-text` |
| `docs/audit/measure-article-layout.mjs` | 7.2 as shipped: CPL at 3 widths x 3 text sizes, the three tiers, overflow, collision, and that every unspanned prose child is on the measure |
| `docs/audit/probe-ch-inherit.mjs` | That a registered `<length>` computes `ch` at its declaring element, with a negative control |
| `docs/audit/render-hero-h1-options.mjs` | 7.3 and 7.4's options, synthesised in the page, with the fold measured for each |

## Traps this session added to the list

- **A backtick inside a comment in `sanity/lib/queries.ts` ends the template literal the
  query lives in.** It silently dropped 27 of 40 queries from typegen.
- **`\b` written through a shell heredoc into a script arrived as a literal BACKSPACE
  (0x08).** The regex matched nothing and reported a confident 0 against 4 real hits. Use a
  substring test, or the Edit tool.
- **`.focus()` on an element that already has focus fires no focus event.** Three capture
  frames showed a closed panel and looked exactly like the panel failing to render.
- **Key probes on the SLUG, never the title.** Matching `/kitchen/i` against a fixture
  called "A deliberately long fixture title" produced 11 false failures in one run.
- **Scope an assertion to the feature.** A struck-through check across the whole article
  flagged the fixture's `whatIGotWrong` block, which strikes text on purpose.
- **Four heavy Playwright harnesses back to back killed the `next start` server**, and three
  of them then failed with navigation timeouts that looked like real defects. Check the
  server between runs.
- **`app/template.tsx` wraps every page in a transform that never goes away.** The
  `page-enter` keyframe is declared `both`, so it holds `translateY(0)` forever, and any
  transform makes an element a containing block for `position: fixed` children. Anything
  fixed must be portalled to `document.body`. It bit three times in one session — the rail,
  the panel's own animation overwriting its centring, and a dropped `lg:absolute`.
- **An element-based text scan misses any element with both text and a child** — which is
  most links and headings. Walk text nodes.
- **A local sonner toast docks bottom-right** and intercepts clicks there. It is a local
  artifact, but the collision it exposes is real.
- **`position: sticky` is bounded by its PARENT's box.** Wrapping a sticky element's parent
  in anything content-height silently removes its travel — it just scrolls away, and looks
  entirely normal in a screenshot.
- **An estimated height is not a layout.** Notes positioned by an estimated height overlapped;
  invisible in a screenshot, but a click could not reach a covered control. Paint, measure,
  correct.
- **A Sanity string used to build a MATCHER must be stega-cleaned**, not just one used as a
  lookup key. The glossary built a regex from an encoded term and matched nothing in every
  draft preview since it shipped.
- **`new Set` does not de-duplicate a CMS value across documents in draft mode.** The payload
  encodes each string's OWN source path, so two posts that both say "Networking" are two
  different strings. Three facet rows on this site were simultaneously duplicated and inert.
  `facetKeys()` in `lib/stega.ts` is the one spelling.
- **An `@property` `initial-value` must be COMPUTATIONALLY INDEPENDENT.** `36rem` is not —
  rem depends on the root font size — so the whole rule is invalid and dropped in silence.
  The symptom was every heading resolving a `ch` measure against its own font size while the
  paragraphs were perfect. Use px.
- **A width TRANSITION makes an unsettled measurement look flat.** Read too soon after
  changing the width setting and every text size returns the previous column — which looks
  exactly like a `ch` measure holding perfectly. This one fails towards a FALSE PASS, which
  is the rarer and more dangerous direction. Settle ~400ms.

- **Read the library's source before building a fix on how you think it behaves.**
  `revalidateTag('sanity')` was a no-op and **three consecutive fixes were built on it**.
  next-sanity tags each fetch `sanity:<syncTag>`, one per document; the bare string is only
  applied if the caller passes it. Next matches tags exactly, never by prefix. The handler
  looked correct locally because `revalidatePath` was silently doing all of the work. Twenty
  seconds in `node_modules/next-sanity/dist/live.js` would have saved three deploys.
- **A cache with no expiry turns a missed invalidation into permanent wrongness.**
  next-sanity's production default is `revalidate: false`. 31 of 36 prerendered routes had
  `initialRevalidateSeconds: false`. "Stale for an hour" is a caching decision; "stale until
  the next deploy" is a bug, and the two are one config value apart.
- **Fresh HTML is not fresh data.** The article page is `x-vercel-cache: MISS` — rendered on
  every single request — and was still serving content the CMS had changed. Nothing about the
  page looked cached, which is why this survived so long. Check the Data Cache separately.
- **Watch the surface the change is supposed to reach, not a nearby one.** The index and the
  article disagreed for an hour: one test watched `/blog`, the other watched the article, and
  the two readings supported opposite conclusions about the same webhook.
- **`age` on a CDN response is a witness to invalidation.** For any prerendered page, mutate,
  then watch `age`: monotonic climb means nothing revalidated it. It needs no secret, no
  dashboard and no page content, and it settled in 150 seconds what page-content polling had
  not settled in hours.
- **Before concluding a surface did not update, prove the surface renders that field.**
  `[].every()` is true and a marker that a page never prints is the same shape of vacuous
  pass. Assert the field is present *before* asserting it changed.

## Standing instructions from Stefan

- Do not stop at item boundaries. Write this file before ever stopping.
- Wide claims to every verifier — name the surfaces the change touches, not just the fields
  it edits. Both defects found in run 1 lived in surfaces a narrow claim had excluded.
- Invoke `.claude/agents/continuation-auditor.md` **before** any non-completion stop, and log
  the result. It cannot restart a turn that has already ended.
- The `verifier` and `continuation-auditor` agent types are **not registered in a session
  that started before they were written.** Inline the definition into a `general-purpose`
  agent instead — same discipline, and it works.
