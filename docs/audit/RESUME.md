# Resume state

Written: 2026-09-11, mid-session.
Why the session ended: **still running at the time of writing.** Kept current so it is never
stale — the point of this file is that it is useful at any moment, not only at the end.

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
  real signed webhook and draft mode. Suite 127. **Never deployed — see the block below.**

  Built: 8.1 identity, 8.2 labels, 8.3 threading, 8.4 sidenote scope, 8.5 removal states,
  8.6 storage, 8.7 spam layers 1-4.
  Not built, each with its reasoning written down: a commenter withdrawing their own
  comment, the Studio "needs attention" view and one-click block, and promoting a Correction
  into a 3B correction (deliberately deferred).

## BLOCKED: production cannot be deployed until roughly 2026-09-13

**Vercel returned "Deployment rate limited — retry in 24 hours."** The account's daily build
quota is exhausted. `a34ebc3` (Phase 7 complete) is the last commit that reached production;
it is live, operational and verified. Everything after it is committed and pushed to GitHub
and **has never run in production**.

The health endpoint reports the LIVE commit, so a stuck deploy and a failed one look
identical from there. `gh api repos/StefanPeele/sanity-next-js-personal-website2/commits/<sha>/status`
is where the reason was; check that FIRST next time rather than polling for sixteen minutes.

**Until it clears, batch commits and push once.** Every push burns another build attempt
against a quota that is already gone.

- **Phase 10 — audited**, `docs/audit/A11Y-AUDIT.md`. 8 findings, 6 fixed, 1 was this audit's
  own false positive, 1 remains and is CONTENT (the published article's seven section
  headings are `h5`). `scripts/migrate-heading-levels.mjs` fixes it, dry-run by default, and
  is deliberately NOT applied because it changes how a published article looks.

## The single next action

**9.2 — propose the digest schema.** A Sanity document type Stefan composes by hand, with
entries that are his posts, external links with a note on why they matter, or neither.
Then Phase 11.

The one part of Phase 10 a harness cannot do: **drive the toolbar and the sidenotes with a
real screen reader.** The audit says so plainly in its own "not covered" section. It is the
highest-risk claim in the brief and it needs a person.

**Verify Phase 8 on production** as soon as the deploy quota clears — that is blocked, not
next.

Nothing about the comment system has been seen anywhere but locally. Two things must be
true in production before it can be called shipped, and neither is checkable from here:

1. `RESEND_API_KEY` must be able to send to a real address. Locally every probe used an
   `@example.invalid` address and the email path was exercised but never delivered.
2. **The Sanity webhook must be firing.** A moderator's removal reaches the article ONLY
   through `/api/draft-mode/enable/revalidate`, and the comment rule added to it has been
   tested locally with a hand-signed request. If that webhook is not configured in the
   Sanity dashboard, removing a comment will appear to do nothing.

Everything else in §8 that is startable without a deploy is listed above under "not built".
The Studio "needs attention" view is the most useful of the three and needs no decision from
Stefan; the other two need one.

**Phases 9, 10 and 11 have never been started** and do not need a deploy to begin.

**8.8 is MOVED** and is already done — it became Phase 3B.

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

Suite: `npx playwright test` — **118 passing** across both projects (114 + 4 facet tests
added with the stega audit).

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

## Standing instructions from Stefan

- Do not stop at item boundaries. Write this file before ever stopping.
- Wide claims to every verifier — name the surfaces the change touches, not just the fields
  it edits. Both defects found in run 1 lived in surfaces a narrow claim had excluded.
- Invoke `.claude/agents/continuation-auditor.md` **before** any non-completion stop, and log
  the result. It cannot restart a turn that has already ended.
- The `verifier` and `continuation-auditor` agent types are **not registered in a session
  that started before they were written.** Inline the definition into a `general-purpose`
  agent instead — same discipline, and it works.
