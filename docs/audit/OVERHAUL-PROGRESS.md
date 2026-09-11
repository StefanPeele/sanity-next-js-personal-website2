# Blog Overhaul — Progress

Last updated: 2026-09-11T05:30Z
Current phase: **Phase 3 in progress — 3.1 shipped. Verification infrastructure built and retroactively tested.** Phase 2 complete — 2.1 shipped and live; 2.2–2.6 proposed, with options rendered where the brief asked. **Phase 3 is next and not started.**
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
| **3.1 Status fields: subtraction then flags** | `d91a555` | deployed `13757d8` | verifier running | `confidenceLevel` loses `verified`/`peer-reviewed`; `reviewStatus` becomes independent flags |
| Section reading times (Phase 0.1 follow-up) | `76c3d55` | **yes** — production, portfolio 4→1 and home lab 5→3 against headers of 2 and 3 | **verifier-found** | TOC sections summed to more than the post |
| **2.1 Rename to Blog** | `1d0869b`, `8141a9f` | **yes** — h1 reads Blog, zero `>Writing<`, /writing redirects | self | 20 strings found, **14 renamed, 6 left as the activity**. Both halves: code defaults *and* the live Studio documents |

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
| 2.6 "nothing leads" (the brief's theory) | **Right about the card, wrong about the page.** Page lead:body 5.14× is 2nd highest of 13; card spread 1.67× is lowest of 5 | Measured a card on ours and four references |
| 2.4 my own claim that "Read →" is a literal glyph | True on the **hero** only. The card already uses a lucide `ArrowRight` with a hover translate | Read the card markup after writing the note |
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
