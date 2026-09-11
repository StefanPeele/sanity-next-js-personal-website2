# Blog Overhaul — Progress

Last updated: 2026-09-11T02:10Z
Current phase: **Phase 1 complete. Phase 2 starting.**
Session count: 1

## Shipped

| Item | Commit | Verified live | Notes |
| --- | --- | --- | --- |
| Brief installed in the repo | `33859fb` | n/a | 1226 lines, survives a context reset |
| 0.1 Reading time — one source of truth | `2724d3e` | **yes** — agreement test passes against stefanpeele.com | Suite is now **34**, not 33 |
| 0.2 FEATURED badge alignment | `b6c07c2` | **yes** | Text asymmetry 5px → 1px, box unchanged at 30px |
| 0.3 `(TESTING)` prefix removed | Sanity txn `mIRMU65sT5gw12rzV1sPip` | yes — dataset re-read | Draft only; published was already clean |
| 0.4 `--` → em dash | same transaction | yes — dataset re-read | Published document patched directly |
| 0.5 `/graph` 8px labels logged | `b6c07c2` | n/a | See *Deferred* |
| **1.1 Editorial index formats** | `b3e5352` | n/a | 13 sites measured live, 3 recorded as blocked |
| **1.2 The newspaper kicker** | `b3e5352` | n/a | |
| **1.3 Metadata treatment** | `942c2c3` | n/a | |
| **1.4 Epistemic status** | `c0bad17` | n/a | |
| **1.5 Sidenotes** | `9b59bc0` | n/a | |
| **1.6 Reading toolbars** | `e50cfc6` | n/a | |
| **1.7 Comment systems** | `9e43345` | n/a | |
| **1.8 Hover previews** | `e2622cc` | n/a | |
| **1.9 Corrections** | `43d45ce` | n/a | |

Phase 1 output: `docs/audit/EDITORIAL-RESEARCH.md`, 1014 lines. Raw measurement JSON and
screenshots under `docs/audit/research/`. Three reusable harnesses added:
`measure-reference-site.mjs`, `measure-metadata.mjs`, `measure-sidenotes.mjs`, plus
`capture-change.mjs` for before/after captures.

## Proposed, awaiting Stefan

Everything below is written up in `EDITORIAL-RESEARCH.md` with its evidence. None of it has
been applied — Phase 1 is research only.

| Item | Where | What I recommend |
| --- | --- | --- |
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
