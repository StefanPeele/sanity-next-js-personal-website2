# Resume state

Written: 2026-09-11T06:00Z
Why the session ended: **still running at the time of writing.** Kept current so it is never
stale.

## Exactly where I stopped

- **Phase 0** — complete, deployed, verified live.
- **Phase 1** — complete. `docs/audit/EDITORIAL-RESEARCH.md`, 1014 lines. Thirteen sites
  measured live, three recorded as blocked. Harnesses: `measure-reference-site.mjs`,
  `measure-metadata.mjs`, `measure-sidenotes.mjs`, `measure-cards.mjs`, `capture-change.mjs`.
- **Phase 2** — complete. 2.1 shipped and live (`1d0869b`, `8141a9f`); 2.2–2.6 proposed in
  `PROPOSALS.md`, with options rendered for 2.5 and 2.6.
- **Verification infrastructure** — built and retroactively tested. See below.
- **Phase 3** — **3.1 shipped** (`d91a555`). 3.2–3.7 not started.
- **Phase 3B** (corrections, promoted out of 8.8) — not started.

## The single next action

**Verify the Phase 3.1 deploy, then Phase 3.2.**

3.1 changed the content model, so before building on it, give a verifier this claim — and
not the schema:

> `confidenceLevel` offers exactly speculative / working-theory / confident, and
> `reviewStatus` is a multi-select offering peer-reviewed / fact-checked / seeking-review /
> open-to-comment / revised. No post currently renders any status badge, because every
> status is unset.

Then 3.2 (reviewer attribution) and 3.3 (where status appears). 3.3 should follow §1.4's
principle: **document-level status goes quiet.**

**Phase 3B is the one to be careful with** — a Portable Text mark transform landing
immediately after a schema change, both touching how a post is authored and rendered. Build
it on `lib/glossary.ts`'s existing `applyGlossaryMarks`, which already refuses to mark
inside headings, code, links and sidenotes.

## What is half-done and needs care

Nothing is half-done. Working tree clean, everything pushed, `npm run check` exits 0 with
zero warnings, 34/34 Playwright.

Things a fresh session must know:

- **The suite is 34 tests.**
- **`wordCountField` in `sanity/lib/queries.ts` is load-bearing** — the comment above it
  explains why the obvious simplification is wrong.
- **`.claude/agents/verifier.md` now exists** and, unlike this session, will be available as
  a named subagent from startup. Agent definitions register at session start, which is why
  the retroactive checks here ran as general-purpose agents with its instructions inlined.
- **Every status field is null on all four posts**, so nothing status-related renders yet.
  Visual verification of the badges is deliberately deferred: the only way to screenshot
  them is to assert a status that is not true, and putting "peer reviewed" on a live post
  for a screenshot is not acceptable.

## Verification infrastructure, and what it found

Brief §1 now requires independent verification before an item is marked done, and states
that **the verifier's result stands over mine** until I can show its measurement is wrong.

Retroactive run against three shipped claims from Phases 0–2, all **PASS** — but the useful
part is that **two ran their own controls**: one injected `outline:none` and correctly
reported 25/25 tab stops failing; the other injected eight font-size cases and correctly
separated the four visible from the four hidden. A verifier that has never demonstrated it
can detect failure is indistinguishable from one that cannot.

**It found a real defect outside its claim.** The article TOC's per-section reading times
summed to more than the post — 4 against a 2-minute header, 5 against 3. Phase 0.1 claimed
one source of truth and there were three. Fixed in `76c3d55`.

Three new artifacts logged: **#21** transitioned focus rings read as different rings if
sampled under ~320ms; **#22** `body.textContent` includes `<script>` contents and inherits
the Tailwind-class trap, so only `innerText` is safe; **#23** the object `sanityFetch`
returns is frozen, and mutating it crashes the build worker with a Windows access violation
that looks nothing like the cause.

## The standing disagreements with the brief

All now folded into the brief itself rather than living only here — see the **AMENDED**
blocks in §2.5, §2.6, §3.1 and §7.1, and the `PHASE 3B` promotion in §13.

| Brief said | Measured | Where |
| --- | --- | --- |
| "Featured becomes a true newspaper kicker" | It is a status *flag*; kicker/label/tag/badge are four forms | §1.2 |
| Kicker size "as a ratio" | Constant 10–15px everywhere | §1.2 |
| 14px floor for all meta including kickers | 12px is inside the measured 10–15px band | 2.4 |
| "Read →" gets a button treatment | The card's arrow is already correct; only the hero's is a literal glyph | 2.4 |
| Measure "is currently 65 characters and that is correct" | **56** — narrowest of five long-form sites | §1.5 |
| Comment labels have little prior art | Conventional Comments is a published standard | §1.7 |
| 8.8 as part of the comment system | Promoted to Phase 3B | §1.9 |
