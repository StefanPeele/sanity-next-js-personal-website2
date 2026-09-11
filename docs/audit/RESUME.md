# Resume state

Written: 2026-09-11T00:20Z
Why the session ended: **Phase 0 complete and pushed; Phase 1 not started.** This was not
an overnight run — it was the session that installed the brief and cleared Phase 0.

## Exactly where I stopped

Phase 0, all five items, done and pushed (`b6c07c2`). Production deploy was in flight at
the time of writing; `/api/health` reports the live commit.

Phase 1 (research → `docs/audit/EDITORIAL-RESEARCH.md`) has **not been started**. No file
exists for it yet.

## The single next action

Start Phase 1.1 — editorial index formats — and create
`docs/audit/EDITORIAL-RESEARCH.md`. Phase 1 is research only; no code. The brief is
explicit that everything from Phase 2 on depends on it and that it is the phase most
likely to be rushed.

## What is half-done and needs care

Nothing is half-done. Working tree is clean, everything is pushed.

Two things to know before touching the blog:

- **The Playwright suite is 34 tests, not 33.** Phase 0.1 added
  `reading time agrees between every card and its article`. The brief's §1 has been
  updated to say 34. A future session seeing 34 should not investigate.
- **`wordCountField` in `sanity/lib/queries.ts` is load-bearing.** It is interpolated into
  both `postCardFields` and `postBySlugQuery` and is the only reading-time input on the
  site. The comment above it explains why the obvious simplification is wrong. Do not
  replace it with `length(string::split(pt::text(body), " "))`.

## What I learned tonight that is not yet in the docs

- **The Sanity write token works** — `editor` role, verified against
  `/v2025-02-27/users/me`. My memory said it was invalid; that was stale. Content fixes
  can be scripted and do not need Stefan in Studio. Both Phase 0 content fixes were
  applied this way (transaction `mIRMU65sT5gw12rzV1sPip`).
- **`MSYS_NO_PATHCONV=1` is mandatory** when passing a route like `/blog` as an argument
  to a node script from Git Bash. Without it the shell rewrites it to
  `C:/Program Files/Git/blog` and Playwright reports "Cannot navigate to invalid URL",
  which looks like a code bug.
- **Local screenshots carry a false artifact.** Running on `127.0.0.1:3000` shows a
  "Sanity Live couldn't connect — your origin is blocked by CORS policy" toast in the
  bottom-right of every capture. Local only. It is visible in
  `docs/audit/screenshots/phase-0/`.
- **A new class of measurement failure, logged as artifact #19.** Every previous artifact
  in this project was a false positive — a measurement inventing a defect. Phase 0.1 was
  the opposite: on 2026-09-08 I *cleared* a real bug because one spot check passed.
  Disproving one instance of a claim is not disproving the claim. When the report is
  "these two disagree", measure both on the same object and compare directly.

## What is deferred, with reasons

Recorded in `OVERHAUL-PROGRESS.md` under *Deferred / out of scope*: the four 8px `/graph`
node labels, a seventh chip definition on the portfolio side, five sans micro-labels in
`CinematicGallery.tsx`, and the hardcoded "Featured" string that Phase 2.5 should move
into Studio.
