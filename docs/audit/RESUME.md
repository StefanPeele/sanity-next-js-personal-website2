# Resume state

Written: 2026-09-12, at the end of a session that worked every phase in the brief.
**Updated 2026-09-14: the webhook is fixed and the newsletter is confirmed. Read the
2026-09-14 section first; the older sections below are kept as the record, not as the state.**
Why the session ended: **every remaining item needs Stefan** — the Sanity webhook is a
dashboard setting, a real Resend delivery needs a mailbox, the screen-reader pass needs a
person, and the proposals are his calls about his own published writing. Nothing is blocked
on a deploy: production is at HEAD.
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

## Production tracks `main`. Everything from this program is live.

At the close of this session: `16ea16d` live, `/api/health` agreeing, HEAD's own commit status
`success`, nothing undeployed.

**The one test worth running, rather than reading a deployment record:**

```
git merge-base --is-ancestor <sha> <the sha /api/health reports>
```

Ancestor means its content is live, with or without a deployment record of its own. Git
history is cumulative and Vercel skips superseded commits, so "no deployment record" and "not
deployed" are different statements.

| Commit | Verified on production |
| --- | --- |
| `dd56ff7` the revalidate floor | comment created in Sanity appeared in **17s**, deleted disappeared in **308s** |
| `368342d` the service-worker cap | live `/sw.js` carries `MAX_STATIC`, 6893 bytes |
| `4c38d0e` the caching guard + sweep | 17 routes and 5 feeds healthy |

A third, independent confirmation that `dd56ff7` works — live response headers rather than the
build manifest:

```
/blog           X-Nextjs-Prerender: 1   X-Nextjs-Stale-Time: 300   X-Vercel-Cache: PRERENDER
/blog/feed.xml  Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
```

**A "Deployment rate limited — retry in 24 hours" status is not reliable, in either
direction.** This section was rewritten three times in half an hour and was wrong twice. It
called two SUPERSEDED commits blocked — the two-agreeing-sources method of artifact #30 was
used correctly but read for the wrong shas, while the tip had deployed four seconds after the
push. Then it said nothing was blocked, which went false three minutes later when the quota
genuinely was reached. Then that commit deployed anyway, so the block was transient too.

**Do not write down a deploy state you have not measured since your last push, and measure it
with the ancestry test above.** See artifact #37.

## THE SANITY WEBHOOK IS FIXED, 2026-09-14. It was the URL. What follows is the record of the week it was not.

**The cause, found by Stefan:** the webhook in Sanity was configured with `/api/revalidate`.
The handler was at `/api/draft-mode/enable/revalidate`. Every delivery from **7 September**
was a 404 against a path that did not exist. He repointed the webhook; the handler has since
moved to `/api/revalidate` (`4a43a49`) with the old path kept as a delegating alias.

**The measurement below that did NOT survive the cause being known** is the third one. A
signed request was accepted locally and rejected by production with 401, and this file
concluded that production's secret is a different value. That conclusion is still the most
likely reading, since a 401 came back from the path that did exist, but it was not what was
breaking the webhook and it was written here as though it might be. **The first two
measurements were right and the diagnosis drawn from them was wrong:** they proved deliveries
were not arriving, not that the secret was to blame. Nobody checked whether the URL in the
dashboard matched the route in the repo, and the one aside in `PROPOSALS.md` that noticed the
path was strange filed it as tidiness rather than as a suspect.

Still worth doing: **`.env.local`'s `SANITY_REVALIDATE_SECRET` does not match production's**,
which is why `docs/audit/probe-revalidate-alias.mjs` only runs against a local server. Paste
Vercel's Production value into `.env.local` and a signed probe can be run against the live
site too.

The original record follows.

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

**What Stefan needed to check**, Sanity dashboard → API → Webhooks. Item 1 is the one that
was wrong, and item 2 would have found it at a glance:

1. Does a webhook exist, is it **enabled**, and does its URL end
   `/api/draft-mode/enable/revalidate` on `stefanpeele.com`?
2. Its **delivery log answers everything at a glance**: 401s mean the secret, 404s mean the
   URL, *no attempts at all* means the trigger or the filter.
3. Triggers must include **Create, Update AND Delete**. The filter must be empty.
4. Its secret must equal Vercel's `SANITY_REVALIDATE_SECRET` for the Production environment.
   If either is regenerated, update `.env.local` to match so local probes stay meaningful.

**It was never urgent, and that is the whole point of `dd56ff7`.** Until that commit a
webhook that never arrived meant content was stale *for ever*. It has a five-minute floor
now. The webhook is the fast path, not the only path, which is also why a week of 404s was
survivable and why nobody noticed.

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

## 2026-09-14: the webhook, the route move, and the check that was missing

Stefan fixed the webhook by correcting its URL in Sanity, and confirmed the newsletter end to
end against a real mailbox: subscribe, confirm, unsubscribe. Two of the four NEEDS STEFAN
items in `LAUNCH-CHECKLIST.md` closed in one message.

**Shipped here (`4a43a49`, live, verified):**

- The handler moved to `app/api/revalidate/route.ts`. It had nothing to do with enabling
  draft mode; it was nested under that route because the Sanity starter nests it there.
- `/api/draft-mode/enable/revalidate` stays as an alias that **delegates in process** rather
  than redirecting: a 307 only survives a client that follows redirects and re-sends the body
  byte for byte, and Sanity's webhook delivery is not documented to do either. It sets
  `x-revalidate-alias: deprecated` and logs a warning, so the Vercel log says when the old
  URL has gone quiet. **Delete it once the webhook is repointed.**
- Two checks, because there were none: `tests/smoke.spec.ts` before a deploy and
  `docs/audit/verify-production.mjs` after one. Both POST unsigned and require **401**: 404
  means the route moved, 500 means the secret is unset, 200 means the signature check is
  gone. Both carry a **control probe** of a route that does not exist, so a 401 cannot pass
  by accident.
- `docs/audit/probe-revalidate-alias.mjs` proves the alias is the same handler and not a
  copy: under a real signature both paths revalidate the identical eight paths. 8/8 local.

**Measured.** Production before the move: `POST /api/revalidate` **404**, alias **401**.
After: **401 and 401**, control 404, and the alias carries its header. Suite **106 chromium**,
up one. Production sweep **78/78** against `4a43a49`.

**The trap this added, and it is the useful one.** A week-long outage went unnoticed because
every check the project had asks the SITE whether it is healthy, and the site was healthy. It
served what it had been told to serve, which happened to be old. Nothing asked the
INTEGRATION whether it was reachable. The general form: for anything that reaches this site
from outside it, probe the URL the outside thing was given, not the behaviour expected from
it. A webhook, an OAuth callback, a payment hook: each degrades silently to "unchanged", and
unchanged is the one failure that looks exactly like success.

**Second trap, smaller.** `PROPOSALS.md` recorded the odd path on 2026-09-11 as an aside
worth tidying "but not as part of this". It was the bug, three days before it was found. An
observation that something is *misleading* is a report that a reader could be misled, and a
webhook URL is written by a reader.

## 2026-09-13, third run: the last two decisions, and the three lists

`/blog/featured` and the first-visit tour are both built. `isFeatured` is gone: `featuredAt`
plus a required `featuredNote` replaced it, because a boolean cannot have an archive.

**`/test` is deleted** — the one NEEDS STEFAN item that could be closed from here. Dataset is
now **515**, not 516.

**Three documents answer everything else:**

- **`HEADING-FIX.md`** — the last open accessibility defect, measured post by post. It is ONE
  post and seven dropdowns, plus four stray line breaks the script could not have fixed. The
  other two posts are already correct.
- **`CONTENT-TO-WRITE.md`** — one ordered list, sorted by what each item turns on per unit of
  writing. Items 1-5 are under an hour and about a hundred words.
- **`LAUNCH-CHECKLIST.md`** — everything else, each DONE / NEEDS STEFAN / AT RISK.

**Still Stefan's, and genuinely not closeable from here:** the Sanity webhook (dashboard),
`DIGEST_SEND_SECRET` (Vercel), a real Resend delivery (a mailbox), the screen-reader pass (a
person), the heading dropdowns (they change how a published post looks), and the writing.

**Traps this run added:**

- **A featured flag that is a boolean has no history.** Worth checking for the same shape
  anywhere else: a field that records WHETHER without recording WHEN cannot support an
  archive, and the fix is always a datetime whose presence is the state.
- **A migration's verification has to distinguish "migrated" from "never applied".** Mine
  counted `defined(isFeatured)` and reported two stragglers after a clean run, because two
  unrelated posts held `false`. It reported a failure that had not happened.
- **Every new route under `/blog` must be excluded from `tests/helpers.ts` by hand.** That is
  now twice in one day: `/blog/digests` and `/blog/featured`. When several tests fail on one
  surface at once, check what they point AT before reading the diff.
- **Focus on a dialog container is correct and makes Enter do nothing.** A keyboard check has
  to press Tab first. Testing Enter alone asserts a focus placement nobody should want.

## 2026-09-13, second run: every PROPOSALS decision shipped

Stefan made every outstanding decision in one message. All of them are shipped or, where he
asked for a proposal first, proposed. One commit per item, each marked in `PROPOSALS.md`.

| Item | What |
| --- | --- |
| 2.2 | The blog description, his own fourth version, set in Studio and in the defaults behind it |
| 2.3 | The critique invitation, short variant, one line under the lede |
| 2.4 | The **14px meta floor**, his call against the measured 10-15px band. 18 sub-14px blog-meta nodes before, 0 after |
| 2.6 | Card option C: 24px w600 title, the bordered pill row replaced by one kicker |
| 2.5 | Dividers D, the FEATURED badge as the lane (option 3), h1 to 48px, and the Latest strip |
| 7.1 | Already live (51ch / 56ch / 64ch) |
| 7.3 | Hero option F: 21:9 on the full column, cropped by Sanity from the hotspot |
| 7.4 | h1 option B: the title on the full column |
| 5.6 | The summary field, label and both suppression rules. **No generation**, by decision |
| 6.2 · 6.4 | Both already shipped; verified rather than assumed |
| 9.2 · 9.3 · 9.5 | The digest: schema, Studio send action, archive at `/blog/digests` |
| Toolbar | Variant A of three rendered. Persistence needed no code and got a guard |

**Measured after:** the index type ladder is now hero 60 / h1 48 / card 24, so the lead story
is the largest thing on the page. The article hero lands within **one pixel** of 7.3's
predicted fold table at all three breakpoints (886/1093/961 against 885/1092/960).

**Suite is 144** (105 chromium + 39 screenshots). Production sweep **72/72**.

## What Stefan needs to do next

1. **Set `DIGEST_SEND_SECRET` in Vercel.** The send route returns 500 until it exists, which
   is the safe direction, but it means the digest cannot be sent yet.
2. **Read the two proposals in `PROPOSALS-NEW.md`.** `/blog/featured` has a real decision in
   front of it: `isFeatured` is a boolean, so featuring something new erases the last one,
   and the archive is only a record if `featuredAt` replaces it. The tour's copy should be
   read in his own voice before it ships.
3. **The heading migration** is still the only open accessibility defect.
4. The four items in `LAUNCH-CHECKLIST.md` §3 are unchanged.

## Traps this run added

- **A backtick inside a double-quoted bash string is command substitution.** Writing
  markdown through `node -e "..."` ran a test file as a shell command and silently deleted a
  filename from the text it was writing. Same shape as the GROQ backtick trap, different
  language. Use a quoted heredoc for anything containing backticks.
- **Adding a route under `/blog` broke a test helper by pointing it at the wrong page.**
  `tests/helpers.ts` reads "the newest post" out of the sitemap and excludes `series`,
  `osi-model` and `feed` by hand. `/blog/digests` was not in that list, so three article
  tests navigated to the digest archive and reported that an article had no progress bar, no
  TOC and no reader menu. **The page was fine.** When several tests fail on one surface at
  once, check what they are pointing AT before reading the diff.
- **A dead `next start` reports as a failing site.** One suite run said 46 failures and the
  next said 3, with no code between them. `page.goto` returning `ERR_CONNECTION_REFUSED` was
  the tell. Confirm the server answers `/api/health` before believing any suite result.
- **A flaky guard is worse than no guard.** The first toolbar-persistence harness compared
  every `sp_*` key, and two of them are reading STATE rather than settings, so it failed once
  and passed the next time. Filter explicitly, then run it three times before committing.

## Start here: three documents, written 2026-09-13

- **`LAUNCH-CHECKLIST.md`** — everything that must be true before launch, each DONE /
  NEEDS STEFAN / AT RISK, all re-measured on the day. **There are no AT RISK items in the
  code.** The blockers are a dashboard setting, a mailbox, a person with a screen reader,
  and writing.
- **`CONTENT-TO-WRITE.md`** — every article section, learning block and feature that renders
  for no published post, with what content would exercise each. Measured against the live
  dataset, not inferred from the schema.
- **`PROPOSALS.md`** — now opens with a decision index: four items were decided and shipped
  (`b38d9ce`), and the ten that need Stefan are listed in the order to read them.

## The single next action

**Stefan repoints the Sanity webhook at `https://stefanpeele.com/api/revalidate` and says so.
Then `app/api/draft-mode/enable/revalidate/route.ts` is deleted**, along with its line in
`WEBHOOK_ROUTES` in `tests/smoke.spec.ts`, its entry in `verify-production.mjs`, and the
alias assertions in `probe-revalidate-alias.mjs`. Both URLs work until then; the alias exists
only so that sentence is true.

After that, what remains needs Stefan and nothing else:

1. **`DIGEST_SEND_SECRET` in Vercel.** The send route returns 500 until it exists, which is
   the safe direction, but no digest can be sent.
2. **Drive the toolbar and the sidenotes with a real screen reader.** `A11Y-AUDIT.md` names
   this as the largest remaining gap in Phase 10; it needs a person, not a harness.
3. **The heading migration**, `HEADING-FIX.md`. One post and seven dropdowns. It changes how
   a published piece looks, so it is his.
4. **The writing**, `CONTENT-TO-WRITE.md`, items 1-5 first.
5. **Two §8 decisions**: a commenter withdrawing their own comment, and promoting a
   Correction into a 3B correction.

**Closed since this section was first written:** the webhook (2026-09-14, above), a real
Resend delivery (2026-09-14, confirmed by Stefan: subscribe, confirm, unsubscribe), `/test`
(deleted 2026-09-13), and every decision in `PROPOSALS.md`.

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
- **The dataset is 515 documents** (it was 516 until the scratch `/test` page was deleted on 2026-09-13). Every probe that seeds is expected to return it to 515,
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

Suite: `npx playwright test` — **145** across both projects (106 + 39; the chromium half was
re-run 2026-09-14, the screenshots half last on 2026-09-13). The split is
deliberate: `npm run test:e2e` runs only the chromium project because
`playwright.config.ts` has it `testIgnore` the visual baseline to stay fast, and
`npm run screenshot` is the other half (39). Run BOTH before claiming the suite is green —
a report of 106 is the fast half, not the whole.

**Until 2026-09-13 the screenshots half asserted NOTHING.** `tests/screenshots.spec.ts`
contained no `expect` at all, so 39 of the 131 could not fail on anything short of a
navigation timeout, while `_errors.log` grew to 8,638 lines that nothing read. Every line of
it was one local-only artifact — Sanity's live-events stream is CORS-blocked on `127.0.0.1`
and allow-listed in production. That artifact is now ignored and an uncaught exception or any
other failed request FAILS the capture. **It is still not a pixel-diff**, and calling it a
"visual guard" was overstating it: it proves the pages render without errors, not that they
look right.

| `docs/audit/verify-production.mjs` | ONE consolidated statement of live health: 23 routes × 1440/768/390 + 6 machine surfaces + the 3 webhook probes, in a real browser, asserting status, one h1, one main, `#content`, no overflow, and no uncaught exception, failed request or CSP violation. **78/78 on `4a43a49`** |
| `docs/audit/probe-revalidate-alias.mjs` | That `/api/draft-mode/enable/revalidate` and `/api/revalidate` are the SAME handler: unsigned both refuse with 401, signed both revalidate the identical eight paths. 8/8 local. Needs the LOCAL secret, which is not production's |
| `docs/audit/measure-proposals-shipped.mjs` | The four PROPOSALS items shipped without Stefan, verified on the rendered page rather than in the diff. 18/18 on production |
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
