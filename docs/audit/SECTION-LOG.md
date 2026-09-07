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
| 2026-09-06 | *(groundwork — not a section)* | Screenshot harness (`tests/screenshots.spec.ts`, 81 baseline captures at 3 breakpoints); full site inventory; Services audit; experience plan; this workflow | — | Dataset unseeded (`plan 1.4`) — **resolved 2026-09-07** |
| 2026-09-07 | *(groundwork — not a section)* | **Dataset seeded** (`plan 1.4` done); Airtable typecast fix + live end-to-end test; empty route dispositions (inventory §8) | — | `'Portrait · Core'` vs Airtable's `'Portrait · Starter'` needs a naming decision |
| 2026-09-07 | Cleanup | Baselines PNG→JPEG (32.5MB→11.3MB); **`/paths` and `/review` deleted**; homepage overview `". . ."` fixed in Sanity | `/paths`, `/review`, PathSteps, ReviewDeck, `learningPath` schema, 2 queries, 21.2MB of PNG | Naming decision above; `/glossary` and `/library` still to fill |

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

**Next session should do first:** ~~`plan 1.4` — generate a fresh Editor token and seed.~~
**Done 2026-09-07, see the entry below.** Also superseded: the note above that
`scripts/seed-content.ts --dry-run` cannot validate the write token is still true and still worth
knowing, but the token itself is now valid.

### 2026-09-07 — Dataset seeded, booking pipeline fixed

**Dataset.** `plan 1.4` is done. All 10 Site documents exist as **published** documents, zero
drafts: `navigation`, `taxonomy`, `errorPages`, `articleUi`, `blogPage`, `knowledgePages`,
`personalPages`, `servicesPage` created; `home` and `settings` patched. `home` keeps its random id
(`b2025ada-…`), which is why the seed script looks it up by `_type`. A second run reports
`0 created, 0 patched, 10 skipped` — the script is idempotent, safe to re-run.

**Editing is proven end to end.** Patched `home.overview` via the API, production picked it up in
**~72 seconds**, then reverted it exactly. So the revalidation webhook works and Studio edits do
reach the rendered page. Budget ~90s before concluding a Studio change has not landed.

**Airtable.** `typecast: true` on both `airtableCreate` calls. Verified with a real submission on
the `'Not sure yet'` path — shoot `rec2cH7B76zoosELn`, linked to the existing client matched by
email rather than duplicated.

**Learned, and not obvious:**

- **The Airtable token cannot read the schema** (`INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND` on the
  meta API — it lacks `schema.bases:read`). To find out which select options exist, read records
  and collect distinct values. That is how the `'Portrait · Starter'` mismatch surfaced.
- **`'Portrait · Core'` (`lib/pricing.ts:92`) does not match Airtable's `'Portrait · Starter'`.**
  Before the typecast fix this would have failed every portrait-core booking; after it, it silently
  creates a *second* option and fragments the data. **Needs a naming decision before the next
  portrait booking** — rename the Airtable option, or change `airtableName`.
- **`'Framed print set'` was a false alarm** in the Services audit. The option exists in the live
  base and has records using it. Renaming it in code would orphan them; it now carries a comment
  saying so.
- **Two Airtable formula fields error**, unrelated to our code: `Delivery Deadline` returns
  `#ERROR` on a shoot with no Shoot Date (an inquiry without a preferred date), and the client
  record's `Discount Available` says "Unable to generate formula".
- **Careful with `[role="status"]` in tests.** The newsletter form has one, so a page-wide selector
  reports booking success that did not happen. Scope it to the booking form, or verify in Airtable.

**Test data left in place, not deleted:** shoot `rec2cH7B76zoosELn` ("Booking Pipeline Test — Not
sure yet") and the linked client `recTdiGjp45DmLHY4`. Two real emails were sent to `swp9@njit.edu`.

**Next session should do first:** the naming decision above, then inventory §8 — fill `/glossary`
(~3 h, best ratio on the site) and delete `/paths` and `/review`.

### 2026-09-07 — Cleanup before the blog section

**Baselines are JPEG now.** 32.5MB → 11.3MB at quality 82, 65% smaller, and
`tests/screenshots.spec.ts` emits JPEG directly. This removes the four-way commit split the PNG
baseline needed: the remote rejects a single push above roughly 14MB.

Worth knowing if you ever revisit the format: **4:4:4 chroma subsampling produced files larger than
the source PNGs** (551KB vs 526KB for `services-njit-off` at 390) — flat dark UI compresses better
as PNG than as high-fidelity JPEG. The 4:2:0 default is both smaller and visually identical here,
because the site is light text on a dark ground and subsampling only touches colour, not luminance.
Verified by cropping at native resolution, not by eyeballing a downscaled full-page image: a
390×760 crop keeps the 9px mono product list and the 8px uppercase caption readable.

**`/paths` and `/review` are gone** (`f72b535`), per inventory §8. 25 files, −1,527 lines. `lib/anki.ts`
stayed — the per-article export is used by the article page and `LearningBlocks` and is independent
of the deck.

Two leftovers, both harmless and both deliberate: existing `knowledgePages` documents keep orphaned
`paths` and `review` fields in the dataset (the schema no longer declares them, so Studio hides them
and nothing queries them), and inventory §1–2 still list all nine routes because they are a
point-in-time record of 6 September.

**Homepage overview fixed** — `". . ."` → `"."`, patched in Sanity, no code change. Production took
longer than the ~72s the earlier test saw; `X-Nextjs-Stale-Time` is 300, so allow up to 5 minutes
before concluding a content change has not landed.

**Next session should do first:** the `'Portrait · Core'` / `'Portrait · Starter'` naming decision,
then the blog section — `/glossary` is the best-ratio content work on the site (~3 h).
