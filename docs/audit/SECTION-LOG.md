# Section log

One entry per completed section, newest last. Append a row when a section's work is committed and
verified — see `SECTION-TEMPLATE.md` §8.

Read this before starting any section: it tells you what earlier sections decided, what they cut,
and what they left open, so you inherit their reasoning instead of re-litigating it.

**Conventions**
- **Date** the section was *completed*, not started.
- **Commits** short SHAs, oldest first.
- **Still open** must name the plan item (`plan 2.2`) or say `none`.
- If a section was abandoned, log it anyway with what was learned.

---

| Date | Section | What changed | What was cut | Still open |
| --- | --- | --- | --- | --- |
| 2026-09-06 | *(groundwork — not a section)* | Screenshot harness (`tests/screenshots.spec.ts`, 81 baseline captures at 3 breakpoints); full site inventory; Services audit; experience plan; this workflow | — | Dataset unseeded (`plan 1.4`) — blocked on a valid `SANITY_API_WRITE_TOKEN` |

---

## Entry detail

Longer notes per section, when a table row is not enough. Newest last.

### 2026-09-06 — Groundwork

Not a section, but the state everything else starts from.

**Produced:** `tests/screenshots.spec.ts` and 81 baseline captures
(`docs/audit/screenshots/baseline/{1440,768,390}/`); `2026-09-full-inventory.md`;
`2026-09-services-audit.md`; `2026-09-experience-plan.md`; `SECTION-TEMPLATE.md`; this log.
Commits `08d0ae4`, `645091a`, `b74b21b`, `7016190`.

**The three facts that shape every section that follows:**

1. **Five of seven knowledge routes have no content** — `/garden`, `/glossary`, `/paths`,
   `/review` and `/library` (a stated goal). The constraint on this site is content, not craft.
   Do not build features for empty routes.
2. **23.6% of text renders below 12px**, almost all uppercase tracked mono, in ~44 different
   size/tracking permutations. `.section-label` is already correct — the problem is ad-hoc inline
   `text-[8px]` classes.
3. **16 Studio fields are read by no component** — 9 overridden by a hardcoded literal, 7 with no
   rendering site. An editor changes them and nothing happens.

**Learned, and not obvious from the code:**

- **Content censuses must read `innerText`, not the HTML source.** GROQ selects unused fields into
  the RSC payload, so grepping the response reports dead fields as healthy. `noTopics` looked alive
  by grep and is dead.
- **`scripts/seed-content.ts --dry-run` cannot validate the write token** — line 28 deliberately
  falls back to `SANITY_API_READ_TOKEN` for dry runs. A clean dry run says nothing about whether
  seeding will work. Test the write token directly against `/v2025-02-27/users/me`.
- **Local captures carry a Sanity Live CORS toast** because `127.0.0.1` is not an allowed origin.
  It is the only element that overflows 390px. Not a site defect.
- **`resolvePackageName()` does not exist** in `app/actions/booking.ts`, despite being the assumed
  cause of the Airtable failures. Packages resolve by enum-validated id, so no label format can
  reach Airtable. The real cause is six select values written without `typecast`.

**Next session should do first:** `plan 1.4` — generate a fresh Editor token at sanity.io/manage and
run `npx tsx scripts/seed-content.ts`. It is 0.25 sessions and it unblocks every editorial task.
