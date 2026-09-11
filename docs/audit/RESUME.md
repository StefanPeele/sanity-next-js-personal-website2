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
- **Phase 4 — partly done.** 4.2, 4.3 and 4.6 complete (`7451e60`).
  **4.1, 4.4 and 4.5 are the remaining work**, and they are one problem, not three.

Everything above is committed and pushed. `git status` is clean.

## The single next action

**Phase 4.1 — turn the filter rows into browsable sections.** Start by reading
`components/blog/BlogDirectory.tsx`, which is where all of 4.1, 4.4 and 4.5 land.

The brief asks for a structure that works **at 3 posts and at 50**, and for an explicit
statement of what changes between those states. There are 3 published posts, so the 50-post
state cannot be seen — build `scripts/seed-scale-fixtures.mjs` to create ~50 DRAFT posts
across the three lanes (same safety pattern as `scripts/seed-fixture-posts.mjs`: prove they
are invisible to the published perspective by querying afterwards and exiting non-zero if
any appear), render and capture both states, then delete them.

4.4 falls out of 4.1: *"try sections first; if sections genuinely subsume filtering, remove
the filter row entirely, otherwise fold filtering into the search bar."* Report which
happened and why. Note that lane sections cannot subsume **topic**, **tag** or **status**
filtering — those are orthogonal to lane — so the honest answer is likely "fold into
search", which means checking what `components/SearchModal.tsx` already does.

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
| `scripts/seed-fixture-posts.mjs --apply` | Re-seeds the two draft fixtures and proves they are invisible to the published perspective |
| `scripts/migrate-lab-notes.mjs` | The 4.3 rename, dry-run by default |

Suite: `npx playwright test` — **114 passing** across both projects.

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

## Standing instructions from Stefan

- Do not stop at item boundaries. Write this file before ever stopping.
- Wide claims to every verifier — name the surfaces the change touches, not just the fields
  it edits. Both defects found in run 1 lived in surfaces a narrow claim had excluded.
- Invoke `.claude/agents/continuation-auditor.md` **before** any non-completion stop, and log
  the result. It cannot restart a turn that has already ended.
- The `verifier` and `continuation-auditor` agent types are **not registered in a session
  that started before they were written.** Inline the definition into a `general-purpose`
  agent instead — same discipline, and it works.
