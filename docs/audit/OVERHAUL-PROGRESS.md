# Blog Overhaul — Progress

Last updated: 2026-09-11T07:15Z
Current phase: **Phase 3 in progress — 3.1 and 3.2 shipped. Verification infrastructure built and retroactively tested.** Phase 2 complete — 2.1 shipped and live; 2.2–2.6 proposed, with options rendered where the brief asked. **Phase 3 is next and not started.**
Session count: 1

## Shipped

| Item | Commit | Verified live | **Verified by** | Notes |
| --- | --- | --- | --- | --- |
| Brief installed in the repo | `33859fb` | n/a | self | 1226 lines, survives a context reset |
| 0.1 Reading time — one source of truth | `2724d3e` | **yes** | **verifier — PASS**, 3 posts × 2 viewports × 4 states. It also found a *third* surface the claim missed (fixed `76c3d55`) | Suite is now **34**, not 33 |
| 0.2 FEATURED badge alignment | `b6c07c2` | **yes** | self | Text asymmetry 5px → 1px, box unchanged at 30px |
| 0.3 `(TESTING)` prefix removed | Sanity txn `mIRMU65sT5gw12rzV1sPip` | yes — dataset re-read | self | Draft only; published was already clean |
| 0.4 `--` → em dash | same transaction | yes — dataset re-read | self | Published document patched directly |
| 0.5 `/graph` 8px labels logged | `b6c07c2` | n/a | self | See *Deferred* |
| **1.1 Editorial index formats** | `b3e5352` | n/a | self | 13 sites measured live, 3 recorded as blocked |
| **1.2 The newspaper kicker** | `b3e5352` | n/a | self | |
| **1.3 Metadata treatment** | `942c2c3` | n/a | self | |
| **1.4 Epistemic status** | `c0bad17` | n/a | self | |
| **1.5 Sidenotes** | `9b59bc0` | n/a | self | |
| **1.6 Reading toolbars** | `e50cfc6` | n/a | self | |
| **1.7 Comment systems** | `9e43345` | n/a | self | |
| **1.8 Hover previews** | `e2622cc` | n/a | self | |
| **1.9 Corrections** | `43d45ce` | n/a | self | |
| **3.2 Reviewer attribution + anonymity** | `aeb4f6f` | not yet deployed | verifier running | Redaction happens on the **server**; the client components never receive the name. Suite now **40** |
| **3.1 Status fields: subtraction then flags** | `d91a555` | deployed `13757d8` | **verifier — PASS** (a)(b)(c). It also found the duplicate `<h1>` below | `confidenceLevel` loses `verified`/`peer-reviewed`; `reviewStatus` becomes independent flags |
| Duplicate `<h1>` in body copy | `365e97e` | not yet deployed | **verifier-found** | `CustomPortableText` rendered a body "Heading 1" as a real `<h1>`. Suite is now **35** |
| Section reading times (Phase 0.1 follow-up) | `76c3d55` | **yes** — production, portfolio 4→1 and home lab 5→3 against headers of 2 and 3 | **verifier-found** | TOC sections summed to more than the post |
| **2.1 Rename to Blog** | `1d0869b`, `8141a9f` | **yes** — h1 reads Blog, zero `>Writing<`, /writing redirects | self | 20 strings found, **14 renamed, 6 left as the activity**. Both halves: code defaults *and* the live Studio documents |
| **3.3 Status on five surfaces** | `c010b18` | **draft mode, local** — kitchen-sink 2 marks, minimal 1, both 14px + `sr-only` label | **verifier — 6 PASS, 2 FAIL, 1 UNVERIFIABLE.** Both FAILs real, both now fixed | `lib/status.ts` is the one table. Card 2 / header 1 / Contents all / feed plain text. Distinction carried by icon SHAPE so greyscale survives |
| **3.4 The status aura** | `41e45f8` | **23/23** local, draft mode, `measure-aura.mjs` | self + 9 frames for you to pick | Edge glow on the card tile: gradient ring on the border line + inset falloff + a tight outer shadow. Three intensities to pick from, captured at 1440/768/390. Caps at **two** colours — the same two the card's marks show |
| **3B Corrections in place** | `952452f` | **27/27** — `measure-corrections.mjs`, draft mode, plus 13 transform unit tests | self | Passage marked in place with credit, permanent list at the foot, **three words not one** (correction / clarification / update). A broken anchor says so instead of vanishing |
| **3.5 Status as a filter** | `fc65349` | **15/15** — `measure-status-filter.mjs`, both states | self | Row is **absent entirely** on published, where no post carries a status. Appears in draft with per-status counts, combines with lane/topic/tag, and offers the *derived* `revised` too |
| **3.6 Sources in the Contents column** | `41e45f8` | **yes** — "2 sources", closed, 2 links, both anchors resolve, at 1440 **and** 390 | self | Column shows count + linked titles, anchored to `#source-N` in the existing body list. One canonical rendering, two volumes |
| **3.7 Last updated** | `41e45f8` | **yes** — header reads "August 1, 2026 · Updated September 1, 2026" at both breakpoints | self + 12 unit tests | Derived from `changelog[].date`. No new field, and **not** `_updatedAt` |

Phase 1 output: `docs/audit/EDITORIAL-RESEARCH.md`, 1014 lines. Raw measurement JSON and
screenshots under `docs/audit/research/`. Three reusable harnesses added:
`measure-reference-site.mjs`, `measure-metadata.mjs`, `measure-sidenotes.mjs`, plus
`capture-change.mjs` for before/after captures.

## Independent verification — retroactive run, 2026-09-11

Three already-shipped claims from Phases 0–2, chosen because a false negative on any of
them would be expensive. Each verifier was given **the claim only** — never the
implementation, never the commit — and told to design its own measurement and not to reuse
any harness under `docs/audit/`.

All three ran against **production at `63c5de4`**.

| # | Claim | Verdict | n |
| --- | --- | --- | --- |
| 1 | Card and article reading time agree for every post; no post shows two figures; nothing three-digit | **PASS** | 3 posts × 2 viewports × 4 article states |
| 2 | No visible text below 12px anywhere, except four 8px SVG labels on `/graph` | **PASS** | 18 routes, 5,633 elements, 1,548 text nodes, + 39 interaction clicks |
| 3 | Every keyboard-reachable control on the knowledge routes shows a focus indicator; skip link has its own | **PASS** | 7 routes, **228 tab stops** |

### Does a verifier that agrees three times actually work?

That is the right question, and the answer here is yes — because two of the three **ran
their own controls**, which is the only evidence that distinguishes a working verifier from
a rubber stamp:

- **#3 ran a negative control.** It injected `a:focus,button:focus{outline:none!important}`
  on `/blog`, re-tabbed, and its probe correctly reported **25 of 25 stops failing**. The
  probe can detect absence; there was simply nothing absent.
- **#2 ran a positive control.** It injected eight cases — 10px plain, 11px bare text node
  inside a mixed element, 9px nested span, `<text font-size="7">`, plus four hidden variants
  at 8px — and the probe flagged **exactly the four visible ones and excluded exactly the
  four hidden ones**.

All three also **caught and corrected their own first-pass errors before reporting**: an
ancestor climb that collapsed three cards into one, a tab loop that re-counted elements
after wrap-around, and a settle time short enough to sample a CSS transition mid-flight.

### What they found that the claims did not cover

**A third reading-time surface (now fixed, `76c3d55`).** Verifier #1 confirmed card and
article agree, then reported — as an aside outside its claim — that the article TOC renders
per-section estimates that **sum to more than the post**: portfolio 1/1/1/1 = 4 against a
2-minute header, home lab 1/1/2/1 = 5 against 3. Phase 0.1 claimed "one source of truth"
and there were three. **The claim I wrote was too narrow, and so is its regression test.**

**Two new measurement artifacts**, added to the trap lists:

- **#21 — the focus ring is transitioned.** A short settle samples it mid-animation. At
  150ms, verifier #3 saw five phantom "non-standard ring" colours (`rgb(253,226,155)`,
  `rgb(254,237,194)` …); sampling one over 2.5s showed it resolving to the standard
  `rgb(251,191,36)`. At 320ms they all collapsed. Anyone probing focus styles with a short
  wait will report false non-standard rings.
- **#22 — `body.textContent` is not a safe substitute for `innerText`.** It includes
  `<script>` contents, so it inherits the Tailwind-class trap: the RSC payload contains
  `min-h-[48px]`, which a `/\d+ min/` match reads as "2 min". All three article pages
  produce phantom 2s that way. Only `innerText` is clean.

**A third, found by me while verifying Phase 3.1:**

- **#23 — the object `sanityFetch` returns is frozen.** Assigning to it crashes the Next
  build worker with `exited with code: 3221226505` during "Collecting page data" — a
  Windows access violation that looks nothing like a frozen-object error. Reverting fixed it
  immediately.

### Second verifier run — Phase 3.1

**PASS on all three parts.** `confidenceLevel` offers exactly the three values; `reviewStatus`
is an array of exactly the five; every status is null on all four documents and nothing
renders.

Three false positives it avoided and reported, any of which would have been a wrong FAIL:

- A raw-HTML grep hits `production-proven` once per page — it is inside the **RSC flight
  payload's label lookup table**, not a rendered badge. The DOM check showed nothing rendered.
- `confident`, `light` and `heavy` appear in body prose ("the technology you're most confident
  in", "Museum Placard Lightbox"). It printed ±70 characters of context around each to confirm.
- It used `perspective=raw`. The default perspective would have missed the one draft and
  under-counted n by one.

It also noted that `schema.json` **drops `options.list`**, so the option set is not recoverable
from the build artifact — it executed the built config instead. Worth knowing before anyone
tries to verify an enum from `schema.json` alone.

**One incidental fact it got wrong:** it reported the local HEAD as `c4ca8c9` when it was
`45924ec`. Its substantive measurements were against `schema.json`, the built config and
production, all current, so the verdict stands. The lesson is that a verdict should rest on the
measurement, not on the narrative around it — including the verifier's own.

**And it found a second defect outside its claim** (fixed, `365e97e`): the portfolio post
rendered **two `<h1>` elements**. `CustomPortableText` rendered a body "Heading 1" block as a
real `<h1>`, competing with the article title — and that style was also the only one without
heading props, so it had no id, no anchor, and never appeared in the TOC. The test gap that
let it through: the article tests open only `firstPostSlug`, and the portfolio post was not
first. Now every post is tested.

### Honest limits

- Coverage was desktop-width only, `/studio` was measured at the unauthenticated login
  screen, and hover/focus-only states were not forced (though #2 confirmed there is no
  hidden sub-12px text in the DOM to be revealed).
- `.claude/agents/verifier.md` is **not loaded mid-session** — agent definitions register at
  startup. These three ran as general-purpose agents with the verifier's instructions
  inlined. From the next session the named subagent is available and this is a one-word
  invocation.
- One verifier's scratch file was swept into the repo by a `git add -A` during its run.
  Fixed with `.gitignore` rules; worth remembering that agents write to the repo root.

## Verifier run 3 — Phase 3.3, wide claim (2026-09-11)

The claim named all five surfaces plus greyscale, single-source, draft mode and
no-regression, per Stefan's instruction to write claims wider than the change. It paid for
itself twice.

| Part | Verdict | What happened |
| --- | --- | --- |
| 1 Index card | PASS | 2 marks on kitchen-sink, 1 on minimal, 14×14px, `title` + `.sr-only` |
| 2 Article header | PASS | Exactly one, full text "Peer reviewed" |
| 3 Contents column | PASS | All 3 of the post's statuses, full labels |
| 4 Feeds | **UNVERIFIABLE** | Status-carrying posts are draft-only; feed routes are pinned to the published perspective, correctly. The verifier **refused to publish to the live dataset to make it observable** — the right call |
| 5 Hover preview | **FAIL** | *The feature does not exist.* No popover machinery anywhere; hovering a card adds zero DOM nodes |
| 6 Greyscale | PASS | Extracted the SVG `path d` per mark — three genuinely different shapes, distinct under `grayscale(100%)` |
| 7 Single source | **FAIL** | A **second status map** in `post.ts`'s Studio preview |
| 8 Draft mode / stega | PASS | Confirmed stega was genuinely active (zero-width chars in `h3.textContent`) and every badge still resolved |
| 9 No regression | PASS | 3 published posts, 1 h1 each, no enum leakage, feeds unprefixed |

**Part 7 — what the second map was.** `sanity/schemas/documents/post.ts` kept its own
`statusIcons` table of emoji. It had drifted three ways at once: it still listed
`expert-verified`, removed from the schema; it had no entry for `fact-checked`,
`open-to-comment` or `revised`; and it indexed itself with `reviewStatus` even though that
field is an **array**, so `statusIcons[array]` coerced through `Array.toString()` and only
ever matched a post carrying exactly one of its three known values. Fixed by reading
`lib/status.ts`. Then taken further than the finding: the Studio's **picker list is now
derived from `REVIEW_FLAG_ORDER` too**, so the option an author picks and the badge a reader
sees cannot drift apart again.

**Part 5 — the honest answer.** My claim asserted a surface that isn't built. The brief's
3.3 table lists a hover preview, but no link-preview popover exists on the site and none is
specified anywhere in the brief. 3.3 is **four surfaces of five**, and the fifth is blocked
on a feature nobody has scoped. Flagged to Stefan below.

**Part 4 — closed a different way.** Rather than publish a status-bearing post to
production, the pure transform was split out of `lib/feed.ts` into `lib/feedItems.ts` (which
imports no Sanity client) and covered by 12 unit tests including a real `vercelStegaCombine`
payload. What remains uncovered is the single line where `loadFeedItems` hands its query
result to `toFeedItems`.

**Outside the claim, on pages it loaded:**

- **`/paths` returns 404.** `CLAUDE.md`'s architecture map lists it as an `(archive)` route;
  there is no `app/(archive)/paths` directory at all. Documentation describes a route that
  was never built.
- The verifier's browser could not go below ~638px, so it could not check 390px. My own
  Playwright harnesses can and do — 3.4, 3.6 and 3.7 are all measured at 390.

## Proposed, awaiting Stefan

Everything below is written up in `EDITORIAL-RESEARCH.md` with its evidence. None of it has
been applied — Phase 1 is research only.

| Item | Where | What I recommend |
| --- | --- | --- |
| **2.2 description** | `PROPOSALS.md` | Three drafts. **A now, C after Phase 3** — C advertises the status system and should not promise what does not exist yet. Also: the current lede hardcodes the lane names and breaks when 4.3 renames them |
| **2.3 critique invitation** | `PROPOSALS.md` | **Inline note under the lede**, not a tooltip or panel. An invitation that must be discovered is not one, and §1.8 found no good touch equivalent for hover |
| **2.4 meta scale** | `PROPOSALS.md` | **Keep the 12px floor** — 12px is inside the measured 10–15px kicker band. Unify reading time on 14px sans sentence case; move filter labels to `.meta-label`; the arrow is already correct on the card, wrong only on the hero |
| **2.5 dividers** | `PROPOSALS.md` + `screenshots/divider-options/` | **Option D** — space instead of rules, with `.section-label` as a mono kicker. Reject B (louder, not clearer) |
| **2.5 duplicate word** | `PROPOSALS.md` | **"Featured" is on the page twice** — section label and badge. Drop the badge; position already says it |
| **2.5 h1** | `PROPOSALS.md` | 72px → 48px so the hero becomes the largest thing. **Not rendered** — needs its own options round |
| **2.6 the diagnosis** | `PROPOSALS.md` + `screenshots/card-options/` | **The theory is right about the card, wrong about the page.** Card spread 1.67× is the lowest of five; title is w400 against w700 at three of four. **Option C**: 24px w600 + kicker. Must ship with the reading-time fix |
| **2.5 dividers** | §1.1 | **Replace with space, don't strengthen.** 6 of 6 comparable essay sites use near-zero rules; we use 16 bordered blocks |
| **2.5 FEATURED** | §1.2 | **Contradicts the brief.** Keep it a filled status *flag*, move it above the headline into the kicker slot, and add a *separate* coloured mono kicker for the lane |
| **2.6 diagnosis** | §1.1 | The problem is the **second tier**, not uniformity. Tiers are 72/60/—/24; every edited site has a populated middle. The 72px page title is larger than the story it introduces |
| **3.1 statuses** | §1.4 | **Subtract before adding.** Take `verified` and `peer-reviewed` out of `confidenceLevel`; they duplicate `maturityIndicator` and `reviewStatus` |
| **3.1 revised** | §1.9 | Three words, not one: **correction / clarification / update** (Washington Post's distinction) |
| **5.2 themes** | §1.6 | Six, following Firefox — and **Auto** is the one we lack. Add font *family* as a control |
| **6.4 mobile sidenotes** | §1.5 | Tufte's **pure-CSS checkbox hack**. No JavaScript |
| **6 scope** | §1.5 | Decide which of sidenote / margin note / citation is being built; the glossary is a fourth thing |
| **4.6 preview timing** | §1.8 | **~800ms** to appear, **~500ms** to dismiss. Bind to `focus`, `role="tooltip"`. **No touch equivalent** |
| **8.6 storage** | §1.7 | **Sanity + Resend**, not self-hosted. Vercel cannot host Remark42 |
| **8.5 wording** | §1.7 | Reddit's `[removed]` / `[deleted]` distinction, in plainer words. "Deleted by Author" is ambiguous |
| **8.8 sequencing** | §1.9 | **Build it first and independently of comments.** `lib/glossary.ts` already implements the hard part |
| **7.1 measure** | §1.5 | **Flagged, not acted on.** The measure is 56 characters, not 65. Phase 7 should re-decide with the corrected number |

## Heading-pipeline audit — every published document, before and after

Measured against the dataset (`perspective=raw`), then verified on production at `2c074cc`.
**Two of the three published posts were affected, in different ways.**

| Post | Body styles | TOC entries before | What was missing before |
| --- | --- | --- | --- |
| home lab week 2 | h2×2, h3×2 | 4 | nothing — fully handled |
| **The Field** | **h5×7, nothing else** | **0 — an empty Contents column** | no renderer, no id, no anchor, absent from TOC |
| portfolio site | h1×1, h3×4 | 4 | the h1: no id, no anchor, absent from TOC — *and* it was the duplicate `<h1>` |

Also checked: `note` and `page` documents. The only other body is the `test` page, which has
no headings at all.

**After the fix, measured on production:**

| Post | Headings in the article | Headings without an id | Anchors | TOC entries |
| --- | --- | --- | --- | --- |
| The Field | H5×7 | **0** | 7 | **0 → 7** |
| portfolio site | H2×1, H3×4 | **0** | 5 | 4 → 5 |
| home lab week 2 | H2×2, H3×2 | **0** | 4 | 4 (unchanged, correctly) |

Every heading on every published post now carries an id and an anchor, and every one appears
in the Contents column.

## Draft-mode coverage

The stega class of bug lives only in draft mode, which the suite never entered. Now covered in
two layers, because the honest answers are different:

1. **The mechanism, deterministically** — `tests/stega.spec.ts` builds a *real* stega payload
   with `vercelStegaCombine` (what Sanity's encoder uses underneath) and asserts `enumKey`
   restores the lookup. It opens with a **negative control**: a plain lookup on the encoded key
   must return `undefined`, so the suite cannot pass vacuously if the encoding ever changes.
   Runs everywhere, no network, no token.
2. **The end-to-end render** — mints a preview secret, enters real draft mode, and asserts all
   five status badges render on the fixture. **Needs `SANITY_API_WRITE_TOKEN`, which CI does not
   have by design**, so it skips there: `46 passed` locally, `45 passed, 1 skipped` in CI. The
   skip is loud and the total is unchanged, so a silently-vanishing test cannot hide in it.

Layer 1 is the one that actually guards the class; layer 2 is end-to-end confirmation.

## Continuation audits

Every time a stop is contemplated for a reason other than "complete", the
`continuation-auditor` runs and the verdict is recorded here. **If it returns CONTINUE
often, the finding is not "N stops prevented" — it is that my model of when work is done
enough is systematically early**, which is worth knowing for how future briefs are written.

| When | Stated reason | Verdict | Next action taken |
| --- | --- | --- | --- |
| *(pre-dating the agent)* | "Phase 3 opens a schema change that is better started fresh" | **would have been CONTINUE** — question 2, a preference | Phase 3.1 was started immediately on resuming and shipped without incident |
| *(pre-dating the agent)* | "stopped at the Phase 2 boundary" | **would have been CONTINUE** — question 3, the next item was startable | Phase 3.1 |

## Blocked

| Item | Blocked on what | What I tried | What would unblock it |
| --- | --- | --- | --- |
| Stratechery, Economist, WSJ measurements | Bot blocking (403/403/401) | Real UA, full Chromium | Nothing worth doing. Recorded as blocked in §1.1 |
| Wikipedia hovercard timing | Selector found no in-article links on the live page | Two selector strategies | Cited MediaWiki docs instead; Gwern's measured 847ms is the better reference anyway |

## Judgement calls made without Stefan

| Item | What I decided | Why | How to overrule |
| --- | --- | --- | --- |
| 0.1 which path was right | Made GROQ correct and authoritative | The article's count was the accurate one | `wordCountField` in `sanity/lib/queries.ts` |
| Brief edited | §1 test count 33 → 34 | 0.1 added a test | — |
| 1.x method | Measured live sites rather than describing them | "What are the actual values" is the brief's own standard | — |
| 1.6, 1.7 sourcing | Labelled documentation and knowledge separately from measurement | Mixing them is how a confident wrong number gets written down | — |
| Phase 1 scope | Answered every sub-question including ones that turned out to have no prior art, and said so | "No prior art" is a finding, not a gap | — |
| 3.4 how many glows | The aura shows **exactly the colours the card's marks show** — at most two | The brief says "do not stack five glows" but not where to cut. Any independent cutoff would let the aura and the marks disagree on the same card; tying them to one call (`reviewFlags(status, 2)`) makes that impossible | `auraProps` in `lib/status.ts` |
| 3.4 where the aura lives | On the card's image tile, not the whole card | The card `<Link>` has no border or background of its own, so a glow around it would be a halo in empty space — the exact thing the brief rules out. The tile already has the border the glow attaches to | `styles/status.css` |
| 3.4 default intensity | Ships as `subtle`; all three are captured for you to pick | The brief's own words are "a faint edge treatment"; the louder two are candidates, not the stated starting point | `AURA_INTENSITY`, one line in `lib/status.ts` |
| 3.6 volume in the column | Count + linked titles, collapsed, **not** full citations | The sidebar is 220px wide and height-capped; fifteen full citations would push the headings out of the sticky viewport. The body list stays the one full rendering and the column links into it by index | `SourcesBlock` in `ArticleToc.tsx` |
| 3.6 what to leave out of the schema | Kept title / url / author / type / description. **Left out publication and accessed-date**, which the brief floated | `author` is already "Author / Organization", so publication is a second field for the same fact. Accessed-date is link-rot hygiene that costs a keystroke on every source and is solved better by an archive link in `url` | `sanity/schemas/documents/post.ts` |
| 3.7 manual or automatic | **Manual, via the existing `changelog[]`** — no new field, and never `_updatedAt` | `_updatedAt` fires on typo fixes, which the brief warned about. `changelog` already requires *both* a date and a description, so a revision date cannot be recorded without saying what changed — a higher bar than a `revisedAt` field, and it is the same record the reader sees | `lastRevisedAt()` in `lib/status.ts` |
| 3B what replaces `Revised` | **Three derived flags — `corrected` / `clarified` / `updated` — and exactly one applies at a time**, by severity | §1.9: the Washington Post separates updating for ERRORS from updating for EVENTS, and `revised` collapsed them. Severity rather than recency because a dozen harmless updates must not bury the one thing that was actually wrong | `revisionState()` in `lib/status.ts` |
| 3B where the revision word appears | On the **date line** ("Corrected 1 September 2026"), not in the badge row | The badge row carries the strongest REVIEW claim, and review and revision are different axes. Crowding both into one badge means one of them is dropped — and it would be the correction | `BlogArticleHeader` |
| 3B the original wording | Quoted under "It said:", never struck through in the prose | 8.8 asks the original stay "visible or recoverable" — the note satisfies that. Putting the wrong version back in the body at full weight, first, teaches the error to a reader who came to learn the thing | `CorrectionMark` / `CorrectionsList` |
| 3B a broken anchor | Renders at the foot **with "passage not found in the text"** | An author who corrects the passage and then pastes the OLD wording into the anchor gets a correction with no in-place marker, which looks identical to one that never had an anchor. Silent either way unless it is said out loud | `unanchoredCorrections()` |
| 3B numbering | Oldest first, and stable | A number that moves when a new correction is added breaks any link a reader has already shared | `numberCorrections()` |
| 3.7 is `Revised` the same signal | **Yes.** Derived from the changelog and **removed from the Studio options list** | Two independently settable sources for one fact will disagree. A post could claim it was revised while showing no record of what changed. Cost: a post with a hand-set `revised` and no changelog loses the badge — correctly, because there is no evidence for it | `effectiveReviewStatus()`; re-add the enum value to overrule |

## Premises that turned out wrong

| Premise | What was actually true | How I found out |
| --- | --- | --- |
| 0.1 "the article renders 165 min read" | It renders **18**. But the underlying claim — two paths disagreeing — **was right**: card 17 vs article 18 | `innerText` on every card and article |
| 0.1 "the article path is wrong" | Backwards; the **card** path was | Four candidate GROQ expressions vs the JS helper |
| 0.3 "production reads `(TESTING)`" | Draft only; published was clean | `perspective=raw` query |
| My memory: "write token invalid" | Valid, `editor` role | `/users/me` → 200 |
| My SECTION-LOG: "reading time is correct" | Closed too early — a **false negative** | Logged as artifact #19 |
| 1.1 "too many type sizes" | 10 vs a reference median of 11 | Measured 13 sites |
| 1.1 "nothing leads" | lead:body 5.14×, second highest measured | Same |
| 1.2 kicker "as a ratio" | Constant 10–15px everywhere; the ratio is an artefact | Measured 6 sites |
| 1.2 "Featured becomes a kicker" | It is a status flag — a different form from a kicker | Measured the four forms |
| 1.5 / 7.1 "the measure is 65 characters" | **56**, the narrowest of five long-form sites | Real chars ÷ real lines, 25 paragraphs, one method across sites |
| 1.7 "comment labels have little prior art" | Conventional Comments is a published standard with seven | Search |
| 2.6 "nothing leads" (the brief's theory) | **Right about the card, wrong about the page.** Page lead:body 5.14× is 2nd highest of 13; card spread 1.67× is lowest of 5 | Measured a card on ours and four references |
| 2.4 my own claim that "Read →" is a literal glyph | True on the **hero** only. The card already uses a lucide `ArrowRight` with a hover translate | Read the card markup after writing the note |
| My 3.3 claim that a hover preview exists | It does not exist anywhere in the codebase. I asserted a surface from the brief's table without checking it was built | Verifier: exhaustive static search + a hover that added 0 DOM nodes |
| My own aura probe, first run | **11 false failures against a working implementation.** It matched `/kitchen/i` against the card title; the fixture is called "A deliberately long fixture title". Keyed on the slug instead | Re-ran after reading the row dump, which showed the aura present and correct |
| My aura CSS's reduced-motion block | Dead code. `styles/index.css` already sets `transition-duration: 0.01ms !important` site-wide, which beats it. Removed, with the reason written where the rule was | Probe reported `1e-05s`, not `0s` |
| My 3.7 first cut | Rendered "Updated September 1" under "Published September 11" — an update older than the publication | The draft fixture, whose changelog predates its `publishedAt`. Now guarded by `materialRevision()` |
| 2.1 my own grep | Missed **6 of 20** strings because the pattern required quotes tight around the word — including the RSS feed title, the OG image and the JSON-LD name, all user-visible | Re-grepped without the quote assumption |

## Deferred / out of scope

| Item | Why | Trigger to revisit |
| --- | --- | --- |
| **0.5** `/graph` node labels at 8px | SVG attribute, not a class; needs label-collision work in the force layout | Any `/graph` work |
| Seventh chip definition, portfolio side | `photography/page.tsx:72,86`; `buttonClass()` would take it | Any portfolio pass |
| Five sans micro-labels in `CinematicGallery` | `.meta-label` is the mono primitive | — |
| "Featured" copy hardcoded in JSX | Phase 2.5 rebuilds the element and should move the string then | Phase 2.5 |

## Environment notes found this session

- **`MSYS_NO_PATHCONV=1` is required** to pass a route like `/blog` to a node script from
  Git Bash, or it becomes `C:/Program Files/Git/blog`.
- **Two heredocs in one Bash call fail**, and so do some long single heredocs containing
  prose — cleanly, writing nothing. Write long content to a file and `cat` it on.
- Local captures on `127.0.0.1:3000` carry a **"Sanity Live couldn't connect — CORS"**
  toast. Local artifact, visible in `screenshots/phase-0/`.
- A **stale `next start`** plus `reuseExistingServer` fabricates failures. Compare the
  served CSS chunk hash against `.next/static/chunks/*.css`.
- **Stopping a background build does not reap its children** — an orphan turned a 26s build
  into 17.4 minutes.
- **A Sanity patch plus `npm run build` is not enough.** `.next/cache/fetch-cache` survives a
  rebuild, so the page can render pre-change content while the dataset already returns the
  new value on both `api` and `apicdn`. It looks exactly like a failed patch.
- **Kill the server BEFORE `rm -rf .next`.** Rebuilding underneath a live `next start`
  produces *"MIME type ('text/plain') is not executable"* and four false failures.
