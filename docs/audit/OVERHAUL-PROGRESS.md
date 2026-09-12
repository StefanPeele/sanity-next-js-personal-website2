# Blog Overhaul — Progress

Last updated: 2026-09-12T01:40Z
Current phase: **Phase 8 — designed and the first slice built.** Phase 7 COMPLETE and live. 7.1, 7.2, 7.5 and 7.6 shipped, deployed and verified
live on production; 7.3 and 7.4 are *render the options* items and their options are rendered,
measured and proposed. Phases 0-6 complete. **Phase 8 (comments) is now unblocked.**
Session count: 2

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
| **3.2 Reviewer attribution + anonymity** | `aeb4f6f` | **draft fixture, 41/41** — incl. anon name absent from the RSC payload, not just from the pixels | fixture harness | Redaction happens on the **server**; the client components never receive the name. Suite now **40** |
| **3.1 Status fields: subtraction then flags** | `d91a555` | deployed `13757d8` | **verifier — PASS** (a)(b)(c). It also found the duplicate `<h1>` below | `confidenceLevel` loses `verified`/`peer-reviewed`; `reviewStatus` becomes independent flags |
| Duplicate `<h1>` in body copy | `365e97e` | not yet deployed | **verifier-found** | `CustomPortableText` rendered a body "Heading 1" as a real `<h1>`. Suite is now **35** |
| Section reading times (Phase 0.1 follow-up) | `76c3d55` | **yes** — production, portfolio 4→1 and home lab 5→3 against headers of 2 and 3 | **verifier-found** | TOC sections summed to more than the post |
| **2.1 Rename to Blog** | `1d0869b`, `8141a9f` | **yes** — h1 reads Blog, zero `>Writing<`, /writing redirects | self | 20 strings found, **14 renamed, 6 left as the activity**. Both halves: code defaults *and* the live Studio documents |
| **3.3 Status on five surfaces** | `c010b18` | **draft mode, local** — kitchen-sink 2 marks, minimal 1, both 14px + `sr-only` label | **verifier — 6 PASS, 2 FAIL, 1 UNVERIFIABLE.** Both FAILs real, both now fixed | `lib/status.ts` is the one table. Card 2 / header 1 / Contents all / feed plain text. Distinction carried by icon SHAPE so greyscale survives |
| **3.4 The status aura** | `41e45f8` | **23/23** local, draft mode, `measure-aura.mjs` | self + 9 frames for you to pick | Edge glow on the card tile: gradient ring on the border line + inset falloff + a tight outer shadow. Three intensities to pick from, captured at 1440/768/390. Caps at **two** colours — the same two the card's marks show |
| **4.1 / 4.5 Sections and hierarchy** | `0fabe5b` | **22/22** — `measure-directory-scale.mjs`, both states, 3 breakpoints | self | Under 12 posts: one grid. At 12+: lead, secondary pair, one section per lane (>=3 posts, newest 6), then a river of rows. Verified at a real 50 via 47 draft-only scale fixtures |
| **4.4 Filters folded** | `0fabe5b` | included above | self | Lane row **deleted** — sections subsume it. Topic/tag/status/sort fold behind one `Filters` disclosure beside a search field |
| **4.2 Placeholder cards** | `7451e60` | **25/25** — `measure-preview-placeholders.mjs` | self + both treatments captured | Not links and not focusable, so inert *by construction*. Ships with **zero items** — real planned topics go in Studio |
| **4.3 Lab Notes** | `7451e60` | **yes** — heading reads "Lab Notes · Seeking peer review" | self + migration proves itself | `field-notes` to `lab-notes` in code, schema, picker and **4 live Studio strings**. `transmission` removed (0 posts used it) |
| **4.6 Hover preview** | `7451e60` | **28/28**, incl. the edge-flip and the keyboard path | self | Also closes **3.3's fifth surface**: the preview's marks are `["Peer reviewed","Fact checked"]`, identical to the card's |
| **5.1–5.4 The reading toolbar** | `e6181e5` | **50/50** — `measure-toolbar.mjs`, both motion modes + 390 | self | Fixed rail, outside the measure (x=1376 vs prose ending 874). Collapsed by default, state remembered, **dismissible entirely** and recoverable from the footer. Yields to toasts |
| **5.2 Four themes + seven sizes** | `e6181e5` | **15/15** — `measure-themes.mjs`, composited contrast | self | archive / slate / paper / terminal. All four clear AA on **all 134** text leaves. Sizes 15–21px in 1px steps; default value unchanged |
| **4.4 Escape + stega keys** | `e6181e5` | in the harnesses above | verifier-found | Escape closes the Filters disclosure; tag slugs and category strings are cleaned before use as URL keys |
| **5.1 Toolbar on the index + density** | `eb558ee` | rendered check: Theme/Text size/**Density**/Spacing/Accessibility, gap 32→20px | self | Same component, `variant="index"`. Width, Share, Read aloud and Your place correctly absent |
| **5.2 Read-aloud voice + speed** | `1eb1ab0` | rendered: System default + 3 real system voices, 4 speed steps | self | `voiceschanged`, not a one-off `getVoices()` — Chrome returns an empty array on the first call |
| **5.2 Expanded reading controls** | `8373d6b` | **22/22** — `measure-reading-controls.mjs` | self | Four scales measured at all three steps on the rendered prose, plus three new toggles and a Reset that covers all of them |
| **6.3/6.4/6.5 Sidenotes in the margin** | `c93c366` | **22/22** — `measure-sidenotes-margin.mjs` | self, + both mobile options captured | Notes travel with their anchors, never overlap, clamp with a "more" window that is focus-trapped. The TOC yields where they collide — and, measured, does **not** yield everywhere |
| **7.1 The measure, measured** | `a18c40a` | n/a — proposal with frames | self, `measure-prose-width.mjs` | Current is **57.2 CPL**, confirming the amendment. **No fixed width works** across the seven reader text sizes; `ch` on a sized container holds CPL constant. Proposed 51/56/64ch |
| **6.5 Learn more** | `ac62224` | **30/30** — disabled path measured; enabled path **UNVERIFIABLE** here (no API key) | self | Returns titles and authors to look up, never hyperlinks. Generated on demand, never stored |
| **6.2 One annotation system** | `871d652` | **28/28** — glossary match renders as a margin note, labelled Definition, linked | self | `GlossaryTerm` deleted. The two sources differ by a label and a colour, not by a mechanism |
| **6.1/6.2 Design** | `0d2fa42` | n/a — proposal | self | 6.1 was already built; **6.2's decision was already shipped** — `lib/glossary.ts` is the brief's hybrid. What is missing is one presentation, not one rule |
| **5.5 Decisions doc marked** | `c473f5e` | n/a — documentation | self | Decision 1 **DONE** (option C is on the h1, checked in the file). Decision 2 **SUPERSEDED**: it rejected Config 3 because "the reader menu loses its home", and Phase 5 builds that home |
| **5.6 Summaries proposed** | `c473f5e` | n/a — proposal | self | Publish-time webhook → stored in Sanity. Lifetime ~435K input tokens **total**; build-time would cost ~145K **per build**. Two additions the brief did not ask for: a correction must invalidate the summary, and a hand-written one must be unclobberable |
| **CodeBlock stega fix** | `7451e60` | **86 console errors to 0** on the draft fixture | verifier-found, outside the claim | The tokeniser shredded the stega payload across per-token spans: 313 orphaned zero-width text nodes |
| **3B Corrections in place** | `952452f` | **27/27** — `measure-corrections.mjs`, draft mode, plus 13 transform unit tests | self | Passage marked in place with credit, permanent list at the foot, **three words not one** (correction / clarification / update). A broken anchor says so instead of vanishing |
| **3.5 Status as a filter** | `fc65349` | **15/15** — `measure-status-filter.mjs`, both states | self | Row is **absent entirely** on published, where no post carries a status. Appears in draft with per-status counts, combines with lane/topic/tag, and offers the *derived* `revised` too |
| **3.6 Sources in the Contents column** | `41e45f8` | **yes** — "2 sources", closed, 2 links, both anchors resolve, at 1440 **and** 390 | self | Column shows count + linked titles, anchored to `#source-N` in the existing body list. One canonical rendering, two volumes |
| **3.7 Last updated** | `41e45f8` | **yes** — header reads "August 1, 2026 · Updated September 1, 2026" at both breakpoints | self + 12 unit tests | Derived from `changelog[].date`. No new field, and **not** `_updatedAt` |

| **Stega audit — every fetch, measured** | `d42823c` | deployed in `5f15fd0`; the behaviour is draft-mode-only and was verified locally | **verifier — PASS on 7 of 8, 1 UNVERIFIABLE** (the resume skills surface has no content in the dataset at all). It built its own draft fixtures for glossary, garden and library, measured, and proved the deletion | The glossary regex was not the last. `probe-stega-fields.mjs` measures which fields Sanity actually encodes rather than inferring it from `filterDefault`. **Eight** more sites, two shapes: the known LOOKUP shape, and a new FACET shape where `new Set` fails to dedupe because each document's copy of a value carries its own payload. Worst case: `/resume` lost its **entire skills section** in preview |

| **7.1 + 7.2 The article stops being a 576px strip** | `b8a1621` | **yes** — production measured at 59.6 / 67.1 / 73.3 CPL, identical at 15/19/21px, `--measure` computing to 671.234px, container 1280, column 964, prose 671, zero off-measure children, no h-scroll | **verifier — PASS on 5 of 6 sub-claims, 1 UNVERIFIABLE.** Measured 59.5 / 66.78 / 73.0 CPL against my 59.6 / 67.0 / 73.2, by its own method; independently re-measured PRODUCTION at **57.0 exactly**, pixel-fixed across all three width settings, which confirms the premise the brief's amendment rested on | Three tiers: prose 671, wide 832, full 964 at 1440. Every heading h2-h6 measured at exactly 250.39-921.61px, identical to the reference paragraph |

| **7.5 Reading time moves + 7.6 progress bar** | `1a73ad6`, fix `c7d028c` | **yes** — 23/23 re-run against production | pending verifier — **23/23** on `measure-progress-readout.mjs`, which drives the real switches and navigates rather than photographing | Time out of the header, above Contents, and LIVE once 3% in: "9 min left · 50% read". Bar 4px with an off switch. Position resumes, opt-in |

| **Phase 8 — comments, first slice** | `2b9e08c` | pending deploy | pending verifier — **32/32** on `measure-comments.mjs`, which drives the real form and the real confirm link | Schema, action, confirm route, desk group, redacted read query, rendered thread. Three bugs found by building it, all of which would have shipped: a confirmed comment never appeared (fetch cache), every rate-limit write would have revalidated the whole site, and the label did not survive a fast submit |

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

**Part 5 — the honest answer, and a correction to it.** My claim asserted a surface that
isn't built: no link-preview popover exists on the site, which the verifier confirmed by
exhaustive search and by hovering a card and counting DOM nodes (327 before, 327 after).
That part of the FAIL stands — 3.3 ships as **four surfaces of five**.

What I wrote next was wrong. I recorded that the hover preview is "not specified anywhere in
the brief". **It is — §4.6, a full sub-item with its own requirements** (delay in and out,
edge-aware positioning, a keyboard equivalent, touch behaviour, reduced motion). So the fifth
surface is not blocked on an unscoped feature; it is scheduled, and 3.3 completes when 4.6
ships. Found by reading Phase 4 rather than by anyone catching it.

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
| **7.1 measure** | §1.5 | **DONE — shipped in `b8a1621`.** 56.0 measured, 67.0 shipped, verified independently at 66.78 |
| **7.3 hero** | `PROPOSALS.md` + `screenshots/phase-7/hero-*` | **Option F** — the full reading column, cropped to 21:9. The only one of seven that is both significantly larger AND lands the prose HIGHER (26px at 1440, 72px at 768, 34px at 390). Every full-bleed option puts the opening paragraph below the fold; D by 232px. Needs the image hotspot wired up first |
| **Phase 8, all of it** | `PHASE-8-COMMENTS.md` | **Sanity, measured not assumed.** A thread at 833 comments is 241ms and 341KB via CDN, so pagination is part of the design rather than an optimisation; the index count query degrades 237ms → 635ms for 5x the data and must be denormalised; moderation is FLAT at ~170ms whatever the archive grows to. Five labels not four. "Removed by Stefan" / "Withdrawn by the commenter". And `rateLimit` is per-instance on Vercel, so an open comment box needs a durable limiter first |
| **7.4 h1** | `PROPOSALS.md` + `screenshots/phase-7/h1-*` | **Option B** — the full reading column at 48px. Saves a line on two of the three published titles and costs one on none. Decision 1's option C is now a restatement of its own container and has been removed; **Decision 1 is superseded** |

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
| **Deploying anything after `a34ebc3`** | **Vercel build rate limit — "Deployment rate limited — retry in 24 hours."** Hit 2026-09-12. `a34ebc3` (Phase 7 complete) is the last commit that reached production and it is live and verified; `cc88130` and everything after is on GitHub and NOT deployed | Polled `/api/health` for 16 minutes across two runs before checking the commit status on GitHub, which is where the reason actually was. The health endpoint reports the LIVE commit, so a stuck deploy and a failed one look identical from there — check `gh api repos/.../commits/<sha>/status` first next time | Time. It clears on its own. Until then **batch commits and push once**, because every push burns another build attempt against a quota that is already exhausted |
| **Verifying Phase 8 on production** | The same rate limit | Everything Phase 8 does is verified locally (32/32) against a real build, a real browser, real Sanity documents and a real signed webhook | The deploy. Two things are then checkable that are not checkable locally: that `RESEND_API_KEY` delivers to a real address, and that the Sanity webhook is actually configured — a moderator's removal reaches the article ONLY through it |

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
| 7.1 the unit | **`ch`, not a rem** — narrow 51ch, standard 56ch, wide 64ch | 7.1 asks for "a stated character count, not a pixel width", and that is the unit. Measured: no fixed width keeps a reader in the 60–75 band across the seven text sizes 5.2 gave them; 44rem is 69.6 CPL at 19px and **86** at 15px | `PROPOSALS.md` §7.1 |
| 7.1 whether to ship it now | **Proposed with frames, not committed** | The prose is bounded by `main#content`, so widening it requires 7.2's surrounding-column work first. Shipping half would narrow nothing and widen nothing | — |
| 6.5 what "Learn more" returns | **Titles and authors, never hyperlinks** | A model asked for links invents them, and verifying one means a fetch the CSP forbids from the browser. The prompt forbids URLs *and* the action strips any entry containing one — a suggestion, not a fabricated citation | `app/actions/learnMore.ts` |
| 6.5 where the results live | **Nowhere. Generated on demand, never stored** | Unlike 5.6's summaries this is a reader's action, not a property of the post. Storing it is how machine-generated text ends up somewhere it can later be mistaken for authored text | Same |
| 6.3 anchor scrolls out of view | **The note goes with it** — not stick, not fade | A note that outlives its passage points at nothing, and sticking turns the margin into a second, laggy reading column. It also makes the rule trivial: the note is at its anchor's offset, full stop | `MarginNotes` |
| 6.3 a note too long for the margin | **Clamp at twelve lines and offer "more"** | Not a scrolling margin box — a second scrollable region on a page is a thing readers do not find, and a margin note that scrolls independently of the prose beside it is worse than one cut off with a way to read the rest | `-webkit-line-clamp` on `.margin-note-text` |
| 6.4 which mobile option | **A, inline at the anchor.** B is rendered for comparison | B is the better *print* convention and the worse screen one: it costs a round trip away from the sentence and back, on the device where losing your place is easiest | Both frames in `screenshots/sidenotes/` |
| 5.1 the index's own control | **Density** (comfortable / compact), the mirror of Width | Width is meaningless on a grid and density is meaningless in a single prose column. Giving each surface the control that fits it is what makes the same toolbar read as one control changing rather than two swapping | `ReadingToolbar`, `styles/status.css` |
| 5.1 how the index gets settings | **Made `ArticleProvider`'s three article props optional** rather than extracting a `ReaderSettingsProvider` | The extraction is the cleaner shape and is written down as a follow-up. It refactors the most load-bearing client component on the site and buys a better *name*, not a better page — not a thing to do unattended with nobody awake to catch a settings regression | The comment sits on the function |
| 5.2 "colour filters" | **Desaturation**, not a colour-blindness simulation | A simulation shows a sighted person what someone else sees and helps that someone else not at all. Reducing saturation helps readers with visual stress | `a11y-mute-colour` |
| 5.2 where the focus ring applies | **Page-wide, on `<body>`** — not just the prose | Measured: with the toggle ON, tabbing into the nav still gave a 2px ring, because the class was on `[data-article-root]` and the navbar is outside it | `ArticleProvider` |
| 5.1 how to move the menu | **Kept every control, replaced only the shell** | `decisions/README.md` called the accessibility work "the best-built thing in the section". Rewriting working controls in order to relocate them is how that gets lost | `ReadingToolbar.tsx` |
| 5.4 narrow widths | **It FITS** — docks bottom-right, panel becomes a bottom sheet | The alternative, forcing the layout to make room, takes 56px out of a 390px viewport permanently to serve a control that is shut most of the time | `styles/article.css` |
| 5.3 toolbar vs toasts | **The toolbar yields**, moving up when a toast is present | A toast is transient and reports what the reader just did; the toolbar is persistent and optional. `:has()` rather than an observer, because the browser already knows and CSS cannot fall out of sync with the DOM | Same |
| 5.2 where the theme class goes | `[data-article-root]` **and `<body>`**, removed on unmount | The article root contains neither the navbar, the footer, nor the portalled toolbar — the site logo was pure white on cream. `<body>` rather than `<html>` so a theme cannot follow a reader onto a route with no article | `ArticleProvider` |
| 5.2 the footer under a light theme | **Keeps its dark ground**; its palette is restored rather than lightened | A light page above a dark footer is a normal, deliberate shape. The blanket override turned its text dark-on-dark at 1.23:1 | `styles/article.css` |
| 5.6 when to generate | **Publish-time webhook, stored in Sanity as content** — not build time, not first request | Build-time regenerates every post on every build, and the publish webhook triggers rebuilds: ~10× the *lifetime* cost of the webhook approach, *every month*. Storing it in Sanity is also what makes the hand-written override answerable at all | `PROPOSALS.md` §5.6 |
| 5.6 which model | **Haiku 4.5**, not the `claude-opus-5` that `ask.ts` uses | Answering an arbitrary reader question from a long article is Opus work. Compressing a document into 80 words is not | — |
| 5.6 dollar figures | Token arithmetic given exactly; **dollars deliberately not quoted** | I would be reciting a price list from memory, and this project has a standing rule about confident numbers. The conclusion — that it is a rounding error — is robust to being wrong about the rate | — |
| 5.2 how many themes | **Four**: archive, slate, paper, terminal | The brief asked for "more than two, include a light mode". `slate` is a softer dark that removes the halation pure black causes behind near-white text — an accessibility option wearing a theme's clothes, put here so it is as easy to reach as a taste | `ARTICLE_THEMES` |
| 5.2 text-size granularity | **Seven steps, 15–21px in 1px increments** (was four, 2px apart) | The step that matters is 17→19, which is where most readers settle and which the old table jumped straight over. The default VALUE is unchanged at 19px; only its index moved, 2 → 4 | `FONT_SIZES` |
| 4.1 the threshold | **12 posts** for sections, **3 posts** for a lane to be a section | Below 12, three lane sections hold one card each — more chrome than navigation. A lane with 2 posts is a list with a heading, not a section | `SECTION_MIN` / `LANE_MIN` in `BlogDirectory` |
| 4.4 where filtering went | **Lane row deleted** (subsumed); topic, tag, status and sort folded behind one `Filters` disclosure next to a new search field | Lane *is* the sections. The other three are orthogonal to lane, so sections cannot subsume them — but four always-visible chip rows was the thing 4.1 objected to | Re-add a row in `BlogDirectory` |
| 4.4 not the ⌘K search | /blog got its **own** field rather than folding into the global search | The global search spans every content type and navigates away; this narrows the list in front of you. Overloading one control with both would make it worse at both | — |
| 4.1 sections under a filter | **Suppressed** whenever a filter or a search is active | Sectioning a set the reader has already narrowed answers a question they stopped asking. Measured: "Observability" gives 8 posts as one grid, 0 sections, 0 river rows | `sectioned` in `BlogDirectory` |
| 4.1 seeing the 50-post state | Built it — 47 **draft-only** scale fixtures, deleted afterwards | "Works at 50 posts" is not a claim that can be made from 3. Same safety contract as the other fixtures: proven invisible to the published perspective by querying it | `scripts/seed-scale-fixtures.mjs` |
| 4.3 which name | **Lab Notes**, over the brief's alternate "Notebook Notes" | Shorter; says where the work happened rather than where it was written down; "Notebook Notes" repeats itself; and it matches what the posts actually are | `lib/cms/defaults/taxonomy.ts` |
| 4.3 the `transmission` lane | **Removed.** 4.3 lists the taxonomy as exactly three lanes | Zero posts used it, measured across published and drafts before removing rather than assumed. It also collided with 3B's `updated`, so two unrelated things read "Update" | Re-add the entry to the defaults table |
| 4.3 old URLs | `?lane=field-notes` still resolves, aliased to `lab-notes` | A shared link, a bookmark or a saved filter should not become dead because a label changed. One line | `LANE_ALIASES` in `BlogDirectory` |
| 4.2 "clickable but inert" vs "announced as a placeholder" | Built as a plain `<li>` — **no link, no button, nothing focusable** | The two requirements only conflict if you build a control. A non-control is inert *because* it is not a control, and is announced as text. A disabled `<a>` would be worse on both counts | `PlaceholderCards.tsx` |
| 4.2 "must not be indexed" | `data-nosnippet`, plus nothing worth mistaking for an article | Honest limit, stated rather than discovered: `data-nosnippet` suppresses snippets, it does **not** deindex, and no per-element noindex exists. The real mitigation is that a placeholder carries a topic and the word "planned" — never a fabricated excerpt or date | — |
| 4.2 default content | Ships with **zero** planned items | Inventing plausible post titles would be fake content on a site whose whole subject is not doing that. The two in the screenshots were written into the singleton by the harness and removed again, verified by re-read | Add real ones in Studio |
| 4.6 touch behaviour | **Deliberately absent on touch** | Every substitute is worse: long-press collides with text selection and the OS menu, tap-to-preview steals the tap that should open the post. On touch the card already *is* the preview, so nothing is lost | — |
| 4.6 delays | 350ms in, 180ms out | 350 is long enough that a pointer crossing the grid opens nothing (measured: 0 panels at 150ms, still 0 after leaving early) and short enough to feel deliberate | `OPEN_DELAY` / `CLOSE_DELAY` |
| 3B numbering | Oldest first, and stable | A number that moves when a new correction is added breaks any link a reader has already shared | `numberCorrections()` |
| 3.7 is `Revised` the same signal | **Yes.** Derived from the changelog and **removed from the Studio options list** | Two independently settable sources for one fact will disagree. A post could claim it was revised while showing no record of what changed. Cost: a post with a hand-set `revised` and no changelog loses the badge — correctly, because there is no evidence for it | `effectiveReviewStatus()`; re-add the enum value to overrule |

## Verifier run 5 — the stega audit, wide claim (2026-09-12)

PASS on 7 of the 8 named surfaces. It did not reuse `probe-stega-fields.mjs`; it queried the
dataset directly with an explicit `raw` perspective for ground truth, then diffed draft
against published `innerText` in a browser. Where a surface had no content — glossary,
garden, library — it **created its own draft-only fixtures, measured, and proved the
deletion**, which is more than the claim asked for.

- `/resume` skills is **UNVERIFIABLE**: the dataset has no skills content, draft or
  published, so the surface does not exist to be measured. The fix is real and the code path
  is right; nobody has yet shown it rendering.
- Its out-of-claim finding, **investigated and dismissed**: it reported that `/blog`'s chip
  row omits "Lab Notes" and "Perspective" while cards clearly show them. Those are **lanes,
  not categories** — a different facet — and the chip row it measured is the category row,
  which is correct. It correctly noted the behaviour is identical in published mode and so
  is not a stega defect.
- But checking it surfaced something real from the other direction, logged under *Deferred*:
  **there is no lane row in the filter panel at all.** Lanes are filterable by `?lane=`, they
  produce an active-filter label, and Clear resets them — but the only way to set one is from
  a lane section heading or a card pill, never from Filters, which offers category, tag,
  status and sort.
- It could not find the fixture at `/blog/fixture-kitchen-sink` and worked around it. That
  slug does exist and is seeded by `scripts/seed-fixture-posts.mjs`; its query was shaped
  wrong. Noting it so the next reader does not conclude the fixture is missing.

## What verifier run 4 found outside its claim (7.1 + 7.2, 2026-09-11)

- **The fixture had no lists.** The document whose whole job is to carry every block type
  carried no body `<ul>` or `<ol>` at all, so the measure claim was **UNVERIFIABLE for
  lists** — the only list elements on the page were the table of contents, the sources and
  the corrections, which are chrome. A fixture with a hole in it is worse than no fixture,
  because the hole is invisible until something depends on it. Both list styles are now in
  `scripts/seed-fixture-posts.mjs`, each with an item long enough to wrap.
- **A new measurement trap: a width TRANSITION makes an unsettled read look flat.** The
  verifier had to wait 300ms after changing the width setting before the numbers meant
  anything. Reading too early returns the previous column for every size, which looks
  exactly like the `ch` measure working perfectly. My own harness waits 420ms; the trap is
  that the failure mode here is a FALSE PASS, not a false failure, which is the rarer and
  more dangerous direction.

## The measurement that lied, 2026-09-12

Logged on its own because it is a different SHAPE from every other entry in this file, and
worse than all of them.

`probe-comment-scale.mjs` printed **"cleanup: 0 probe documents remain (must be 0)"** while
**5,000 documents sat in the dataset**. `**` in a Sanity path is a segment glob, so
`drafts.scale-comment-**` matched nothing: the delete removed nothing, and the verification
used THE SAME PATTERN, counted the same nothing, and agreed with itself.

Every other trap in this file is a measurement that reported something false about the
product. This one reported something false about **itself**, and it did it while printing
the exact words that were supposed to prove otherwise. It was found only because a different
query — written for a different purpose — happened to count comments and returned 5,000.

**A check that shares its pattern with the operation it is checking is not a check.** The
probe now deletes in passes (a delete-by-query has a ~1,000 ceiling, so one call does not
finish and a 200 is not evidence that it did) and counts a second, independent way.

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
| My own `ch` hypothesis, first version | **Refuted by its own data.** 66ch swung 82.7 / 65.8 / 59.3 — as widely as a rem — because `ch` resolves against the font size of the element it is written on, and `--article-fs` is only a *variable* there | Measured again with the container actually sized: 70.3 CPL at all three |
| The glossary in draft mode | **It has never matched a single term.** `buildGlossaryMatcher` builds a regex from `e.term`, and the article page's fetch does not pass `stega: false` — so in draft mode the pattern is "broadcast domain" plus an invisible payload and matches nothing. Every draft preview since the glossary shipped marked zero terms | Found only because a new assertion measured it; the fixture had no glossary term to match, so the first run reported 0 against code I assumed was fine |
| My push-down's estimated heights | **Notes genuinely overlapped.** The estimate was computed from character count and was wrong — invisible in a screenshot, but a click could not reach a covered "More" button. An estimate is not a layout | Two passes: paint at the anchors, read real heights, correct |
| Wrapping the `<aside>` for the margin column | **It silently un-stuck the table of contents.** `position: sticky` is bounded by its PARENT's box, and the wrapper took away its travel. Measured going from viewport top 924 to -1476 | The harness now asserts the TOC's top never runs away negative |
| My first TOC-yield rule | **It deleted the TOC.** It measured the `<aside>`, which is full-column-height, so a note always overlapped it and the TOC sat at 12% at every scroll position | Measures the sticky inner box; the harness asserts it yields *somewhere* **and** not *everywhere* |
| Reusing the name `measure-sidenotes.mjs` | **Overwrote a Phase 1.5 research harness.** Restored from git | Mine is `-margin`, and its header says why |
| `measure-directory-scale` reporting 3 failures | **A missing precondition, not a defect.** The scale fixtures had been deleted, so the draft page had 5 posts — below the 12-post threshold — and correctly rendered one grid, which is the behaviour the harness itself specifies | It now checks the count first and says so loudly. 22/22 with the fixtures present |
| My own `bigFocus` positive control | **Vacuous.** "Without it the ring is narrower" passed at 2px while the toggle-ON case was *also* 2px — it only compared against the 4px threshold, never against the same element | Rewritten to require the same element and a strict difference: A 2px vs A 4px |
| The Phase 4 verifier's tag-facet FAIL | **Trap 16, not a defect.** The published page was serving a build made before the tag existed. With live data the facet renders, the chips are right, and `?tag=` leaves exactly the 2 tagged posts | `docs/audit/probe-tag-facet.mjs`, which creates the condition, measures both perspectives, and proves its own cleanup |
| My first `measure-themes` leaf detector | Skipped any element with **both text and a child** — most links and headings. It passed the site logo at pure white on cream while the screenshot plainly showed it | Walking text nodes took the set 122 → 134 and found 25 real failures immediately |
| My own blanket light-theme override | Reached the footer, which keeps a dark ground by design, and made its text dark-on-dark at **1.23:1** | The same harness, one run later |
| My migration's own word-boundary regex | The escape arrived as a literal **BACKSPACE character (0x08)** through the heredoc, so the pattern matched nothing. It reported a clean, confident **0** against 4 real hits | A substring check on the same 56 documents found all four |
| The same script's replacement function | Broken the same way, and would have written the values back **unchanged** | The dry run printed `before -> after` and the two were identical. The preview is what caught it |
| My own note that the hover preview is "not in the brief" | **It is — §4.6**, with delay, edge-aware positioning, a keyboard equivalent, touch behaviour and reduced motion all specified. 3.3's fifth surface is scheduled, not unscoped | Read Phase 4 |
| My own aura probe, first run | **11 false failures against a working implementation.** It matched `/kitchen/i` against the card title; the fixture is called "A deliberately long fixture title". Keyed on the slug instead | Re-ran after reading the row dump, which showed the aura present and correct |
| My aura CSS's reduced-motion block | Dead code. `styles/index.css` already sets `transition-duration: 0.01ms !important` site-wide, which beats it. Removed, with the reason written where the rule was | Probe reported `1e-05s`, not `0s` |
| My 3.7 first cut | Rendered "Updated September 1" under "Published September 11" — an update older than the publication | The draft fixture, whose changelog predates its `publishedAt`. Now guarded by `materialRevision()` |
| 2.1 my own grep | Missed **6 of 20** strings because the pattern required quotes tight around the word — including the RSS feed title, the OG image and the JSON-LD name, all user-visible | Re-grepped without the quote assumption |

## Deferred / out of scope

| Item | Why | Trigger to revisit |
| --- | --- | --- |
| **0.5** `/graph` node labels at 8px | SVG attribute, not a class; needs label-collision work in the force layout | Any `/graph` work |
| **A commenter cannot withdraw their own comment (8.5)** | The `withdrawn` status, its wording and its rendering are all built and verified; the only way to REACH it is Stefan setting it in the Studio. So the one label whose whole purpose is to say "the commenter took this back" can currently only be applied on their behalf. Every obvious mechanism is worse than waiting — see the section in `PHASE-8-COMMENTS.md` | A decision on which mechanism. Or the first person who asks for their comment to be taken down |
| **No lane row in `/blog`'s filter panel** | Found while checking a verifier's out-of-claim report. `?lane=` is a real filter with an active label and a working Clear, but Filters offers only category / tag / status / sort — a lane can be set from a section heading or a card pill and nowhere else. Phase 4 is closed and this is not Phase 7's subject | Any return to the directory, or the first time someone cannot find the lane filter |
| **The hero ignores the image hotspot** | `heroImageUrl()` appends `w=1600&auto=format&q=75` and nothing else, so any fixed-ratio crop would be centre-cropped. Harmless today because the hero renders at each image's own ratio — measured 832x440, 832x406 and 832x303 across the three published posts | 7.3's option F, which is a crop and needs the hotspot to be safe |
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
