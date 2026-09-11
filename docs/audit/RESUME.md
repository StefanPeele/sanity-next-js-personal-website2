# Resume state

Written: 2026-09-11T03:20Z
Why the session ended: **still running at the time of writing** — this file is kept current
so it is never stale, per the runner contract.

## Exactly where I stopped

**Phase 0: complete, deployed, verified live** (`2724d3e`, `b6c07c2`, Sanity txn
`mIRMU65sT5gw12rzV1sPip`).

**Phase 1: complete.** All nine sub-sections in `docs/audit/EDITORIAL-RESEARCH.md` (1014
lines). Thirteen sites measured live, three recorded as blocked, five sources fetched.
Reusable harnesses committed: `measure-reference-site.mjs`, `measure-metadata.mjs`,
`measure-sidenotes.mjs`, `capture-change.mjs`.

**Phase 2: in progress.**

- **2.1 shipped and verified live** (`1d0869b`, `8141a9f`) — the section is called Blog, in
  code *and* in the Studio documents.
- **2.2, 2.3, 2.4 proposed** in `docs/audit/PROPOSALS.md`, not applied.
- **2.5 and 2.6 not started.**

## The single next action

**Phase 2.6** — the "AI-looking" problem, which the brief calls the most important aesthetic
item in it. The page-level half is already done and is in `EDITORIAL-RESEARCH.md` §1.1: the
diagnosis is *the second tier*, not uniformity. What remains is the card-level measurement
the brief asks for — measure type sizes and spacing on a post card, compare against three
reference sites' cards, then propose values and render before/after at 1440/768/390.

Then 2.5, which depends on it.

## What is half-done and needs care

Nothing is half-done. Working tree clean, everything pushed, 34/34 green.

Two things a fresh session must know:

- **The suite is 34 tests.** The brief's §1 says so.
- **`wordCountField` in `sanity/lib/queries.ts` is load-bearing** and the comment above it
  explains why the obvious simplification is wrong.

## What I learned tonight that is not yet in the docs

All of it *is* in the docs now — `EDITORIAL-RESEARCH.md` for findings, the brief's §1 for
hazards, `OVERHAUL-PROGRESS.md` for premises killed. The three worth repeating here:

1. **A Sanity patch plus `npm run build` is not enough.** `.next/cache/fetch-cache` survives
   a rebuild and will serve pre-change content while the dataset already returns the new
   value on both `api` and `apicdn`. It looks exactly like a failed patch.
2. **Kill the server BEFORE `rm -rf .next`.** Rebuilding under a live `next start` gives
   *"MIME type ('text/plain') is not executable"* and false failures on untouched routes.
   Third appearance of the stale-server family in this project.
3. **My own greps keep being too narrow.** Phase 2.1's first pattern required quotes tight
   around the word and missed six strings, three of them user-visible — the RSS feed title,
   the OG image, and the JSON-LD name.

## The standing disagreements with the brief, all flagged not acted on

| Brief says | Measured | Where |
| --- | --- | --- |
| "Featured becomes a true newspaper kicker" | It is a status *flag*; kicker/label/tag/badge are four forms | §1.2 |
| Kicker size "as a ratio" | Constant 10–15px everywhere | §1.2 |
| 14px floor for all meta including kickers | 12px is inside the measured 10–15px band | 2.4 |
| "Read →" gets a button treatment | Essay-camp sites put no button on a card; nesting one inside a card-link is a duplicate target | 2.4 |
| Prose measure "is currently 65 characters and that is correct" | **56** — the narrowest of five long-form sites | §1.5 |
| Comment labels have little prior art | Conventional Comments is a published standard | §1.7 |
| 8.8 as part of the comment system | Build it first and independently; `lib/glossary.ts` already does the hard part | §1.9 |
