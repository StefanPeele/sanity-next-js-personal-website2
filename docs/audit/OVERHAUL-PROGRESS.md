# Blog Overhaul — Progress

Last updated: 2026-09-11T00:30Z
Current phase: 0 complete; Phase 1 (research) not started
Session count: 1

## Shipped

| Item | Commit | Verified live | Notes |
| --- | --- | --- | --- |
| Brief installed in the repo | `33859fb` | n/a | `docs/audit/BLOG-OVERHAUL-BRIEF.md`, 1226 lines, so it survives a context reset |
| 0.1 Reading time — one source of truth | `2724d3e` | **not yet deployed** | Card and article both read one GROQ `wordCount`. Regression test added; suite is now **34**, not 33 |
| 0.2 FEATURED badge alignment | this commit | **not yet deployed** | Text asymmetry 5px → 1px, matching both neighbouring pills. Box height unchanged at 30px |
| 0.3 `(TESTING)` prefix removed | Sanity mutation `mIRMU65sT5gw12rzV1sPip` | yes — dataset re-read | Draft only; the published document was already clean |
| 0.4 `--` → em dash in the home lab title | same transaction | yes — dataset re-read | Published document patched directly |
| 0.5 `/graph` 8px labels logged | this commit | n/a | See *Deferred* below |

**Not yet pushed or deployed.** Everything above is committed locally on `main`. Nothing
in this session has been verified on production, because nothing has been pushed.

## Proposed, awaiting Stefan

| Item | Where the proposal lives | What I recommend |
| --- | --- | --- |
| — | — | Nothing proposed yet; Phase 1 has not started |

## Blocked

| Item | Blocked on what | What I tried | What would unblock it |
| --- | --- | --- | --- |
| — | — | — | Nothing is blocked. The Sanity write token works (see below) |

## Judgement calls made without Stefan

| Item | What I decided | Why | How to overrule |
| --- | --- | --- | --- |
| 0.1 which path was right | Made **GROQ** correct and authoritative, rather than moving the article onto the cards' existing number | The article's JS count (3908) was the accurate one; adopting the cards' 3840 would have made both surfaces agree on a wrong number. The new GROQ expression matches the JS helper exactly on every post in both perspectives | Replace `wordCountField` in `sanity/lib/queries.ts` |
| 0.1 reading time rounds to 18, not 17 | The visible figure on The Field went **up** | It is the accurate count, not a regression | Same place |
| 0.2 scope | Fixed only the vertical centring, left the badge's face, colour and radius alone | The brief says Phase 0 is the alignment defect only; the kicker rebuild is 2.5 | — |
| 0.3 which document | Patched the **draft**, left the published document untouched | Only the draft carried the prefix | — |
| 0.4 how | Patched the published document directly, so it is live now | It is a typo in a published title; the brief asked for it | Revert in Studio |
| Brief edited | Changed §1's "suite reports 33 tests" to 34 | 0.1 added a test. Left at 33, the next session halts on a correct count | — |

## Premises that turned out wrong

| Premise | What was actually true | How I found out |
| --- | --- | --- |
| **0.1** "The article page renders 165 min read… the grep was an artifact, the number is not" | The article renders **18**. 165 is not reproducible on any surface. But the underlying claim — two computation paths that disagree — **was correct**: card 17 vs article 18, a real one-minute split on one post | Read `innerText` (never markup) on every card and every article against the built site; separately ran both computations against the dataset in both perspectives |
| **0.1** "the article path is wrong" | Backwards. The **card** path was wrong. `pt::text()` joins blocks with `\n\n` and `string::split` only splits on a literal space, so every block boundary failed to split — 68 missed separators | Compared four candidate GROQ expressions against `countWords(portableTextToPlain(body))` for all three posts |
| **0.3** "The Field's title on production reads `(TESTING)…`" | Production was already clean. The prefix existed **only on the draft** — real, and it would have shipped on the next publish, but production was not broken | Queried all four post documents with `perspective=raw` |
| My own memory: "the Sanity write token is invalid" | It is **valid**, `editor` role | `GET /v2025-02-27/users/me` with the write token → HTTP 200 |
| My own SECTION-LOG, 2026-09-08: "B13 reading time is correct and deployed" | Wrong, and closed too early. It was correct on *production for the figure I checked*, which hid a genuine two-source bug | See 0.1 above |

## Deferred / out of scope

| Item | Why | Trigger to revisit |
| --- | --- | --- |
| **0.5** `/graph` node labels at 8px | Four D3 `<text>` elements set `font-size: 8px` as an SVG attribute (`components/graph/KnowledgeGraph.tsx:256`), also under the colour floor at `rgba(255,255,255,0.45)`. Not a class, and not the blog. Growing them needs label-collision handling in the force layout, which already hides labels for nodes with `radius < 6` precisely because they would pile up | Any `/graph` layout work |
| A seventh chip definition on the portfolio side | `app/(personal)/photography/page.tsx:72,86` — `px-4 py-2 rounded-full` with `bg-white text-black` when active. `buttonClass()` would take it | Any portfolio-side pass |
| Five sans uppercase micro-labels in `CinematicGallery.tsx` | `.meta-label` is the *mono* primitive; converting them changes their face, not their size | — |
| "Featured" badge copy is hardcoded in JSX | `CLAUDE.md` says copy lives in Studio. Phase 2.5 rebuilds this element as a kicker and should move the string then | Phase 2.5 |

## Environment notes found this session

- **`MSYS_NO_PATHCONV=1` is required** when passing a route like `/blog` as an argument to
  a node script from Git Bash. Without it the shell rewrites it to
  `C:/Program Files/Git/blog` and the navigation fails with "invalid URL".
- Running the site on `127.0.0.1:3000` produces a **"Sanity Live couldn't connect — your
  origin is blocked by CORS policy"** toast in the bottom-right of every local screenshot.
  It is a local-only artifact, not a defect, but it appears in captures.
- `docs/audit/capture-change.mjs` added — targeted before/after capture at 1440/768/390
  for a single route, so a visual change does not require the 81-file full baseline.
