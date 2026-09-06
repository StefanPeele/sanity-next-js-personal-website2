# Section work template

Copy this file to `docs/audit/sections/<route>.md`, fill the blanks, and work through it top to
bottom. It exists so a fresh session can start with full context and end with the work verified,
committed and handed off — without you re-explaining the project.

Worked example: **`docs/audit/sections/services.md`**. Read it once before filling your first copy.

> **Rules that apply to every section, so they are not repeated below.**
> Copy lives in Studio, never in JSX. Exactly one `<h1>` per page and an `id="content"` landmark.
> Readable text never below `stone-400`. Run `npm run typegen` after any query or schema change.
> Real copy only. Gate every animation with `motion-safe:`. Full conventions: `CLAUDE.md`.

---

## SECTION: `<route>`

Date started: `<YYYY-MM-DD>` · Session: `<claude.ai/code session URL>`

---

## 1. CONTEXT TO LOAD

Read these **before** touching anything. Do not skip the audit docs — they contain findings you
cannot re-derive from the code.

**The route**
- [ ] `app/(<group>)/<route>/page.tsx`
- [ ] Its layout: `app/(<group>)/layout.tsx`

**Its components**
- [ ] `components/<...>` — list every component the route renders, including shared ones you intend to touch

**Its Studio wiring** — all four, in this order; they must agree
- [ ] Defaults: `lib/cms/defaults/<singleton>.ts`
- [ ] Schema: `sanity/schemas/singletons/<singleton>.ts`
- [ ] Query: `sanity/lib/queries-<...>.ts`
- [ ] Generated types: check `sanity.types.ts` has the fields after `npm run typegen`

**The audit docs** — required, not optional
- [ ] `docs/audit/2026-09-full-inventory.md` — §1 route geometry, §3 dead Studio fields, §7 Recommended Cuts
- [ ] `docs/audit/2026-09-experience-plan.md` — Part 2 motion verdicts, Part 3 type scale, Part 4 the work items assigned to this section
- [ ] `docs/audit/<route>-audit.md` if one exists
- [ ] `docs/audit/SECTION-LOG.md` — what previous sections changed, so you inherit their decisions

**State check**
- [ ] `git log --oneline -5` and `git status` — start clean
- [ ] Is the dataset seeded? An unseeded singleton renders code defaults and Studio edits do nothing visible

---

## 2. THE GOAL THIS SERVES

| Goal | Serves it? | How directly |
| --- | --- | --- |
| G1 Blog | | |
| G2 Library | | |
| G3 Projects + resume | | |
| G4 Photography services | | |

**Primary goal:** `<G#>`
**One sentence on why this section is worth a session now:** `<...>`

If this section serves none of the four goals directly, say so and justify the session anyway — or
close the file and pick a different section.

---

## 3. BASELINE

Screenshots to review before changing anything, from `docs/audit/screenshots/baseline/`:

| Breakpoint | Files | Looking for |
| --- | --- | --- |
| 1440 | `<route>-*.png` | Layout, hierarchy, density |
| 768 | `<route>-*.png` | Where the grid changes and what it does to height |
| 390 | `<route>-*.png` | Truncation, tap targets, sub-12px type, total height |

- Height at 390px now: `<N>px` (`<N/844>` screens) — from inventory §1
- Target after this session: `<N>px`
- [ ] Note any state the harness could not reach (`state-unavailable` annotations) and why

> Baselines are captured against `localhost`, so they carry a "Sanity Live couldn't connect" CORS
> toast. Ignore it — it is not a site defect. Add the origin in Sanity → API → CORS to remove it.

---

## 4. WORK ITEMS

Pulled from `2026-09-experience-plan.md` Part 4. Copy the rows assigned to this section verbatim,
then add anything the section-specific audit found. Do not invent new scope here — if you find
something new, add it to the plan and note it in the handoff.

| # | What changes (files) | Why (goal) | Effort | Risk | Depends on | Status |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | ☐ |

**Explicitly out of scope this session:** `<list, so the next session knows it was a decision, not an oversight>`

---

## 5. EXECUTION ORDER

**Cuts → fixes → improvements.** Always. Deleting is faster than building, and every deletion
shrinks the surface area of everything after it — fewer components to retype, fewer animations to
retune, fewer screenshots to compare.

| Order | Item | Why this order for this section |
| --- | --- | --- |
| 1 (cut) | | |
| 2 (fix) | | |
| 3 (improve) | | |

State the section-specific reason, not the general principle. Example: *"C2 removes the in-card
product lists, which deletes 16 of the sub-12px elements — so doing it before the type pass means
16 fewer elements to retype."*

---

## 6. VERIFICATION

All six. A section is not done until every box is ticked or explicitly waived with a reason.

- [ ] **`npm run check` exits 0** — typegen, `tsc --noEmit`, eslint. Zero warnings, not just zero errors.
- [ ] **Playwright suite passes** — `npm run build && npm run test:e2e`. Includes CSP violations and axe.
- [ ] **Screenshot at all three breakpoints** — `npm run screenshot`, then diff against baseline.
      Record: what changed and was it intended; height before → after at 390.
      If the change is a keeper, the new captures **become** the baseline — commit them.
- [ ] **Every Studio-editable field actually changes the page.** For each field this section touches:
      edit it in Studio (or the defaults module), reload, confirm the page changed.
      This is the check that catches the failure in inventory §3a — a field the component ignores.
- [ ] **Every interaction at 390px.** Not a screenshot — drive it. Tap every control, open every
      disclosure, submit every form, check nothing truncates and nothing is under 24×24.
- [ ] **Nothing below 12px** was introduced (experience plan Part 3.3).

Record failures here rather than deleting the box:

| Check | Result | Notes |
| --- | --- | --- |
| | | |

---

## 7. COMMIT

One commit per coherent change, not one per session and not one per file. Cuts commit separately
from fixes — a revert should be able to take back a deletion without taking back a bug fix.

**Message format**

```
<Area>: <what changed, imperative, no trailing period>

<Why it changed, and what the reader could not infer from the diff. Name the
finding it closes: "inventory §3a", "experience plan 1.5", "services audit §2".
Include measured before/after numbers when there are any -- height at 390px,
element counts, sizes deleted.>

<Anything deliberately left undone, so it does not read as an oversight.>

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: <session URL>
```

**Belongs in the message:** the reasoning, the finding reference, measured deltas, what was
deliberately skipped.
**Does not belong:** a file list (that is the diff), restating the code, "various fixes".

- [ ] Baseline screenshots re-committed if they changed
- [ ] `npm run check` green **at the commit**, not just before it

---

## 8. HANDOFF

Append one row to `docs/audit/SECTION-LOG.md`, then fill this in for the next session.

**What changed:** `<one paragraph, the shape of it>`
**What was cut:** `<deletions, with the height/element delta>`
**What is still open:** `<items from §4 not done, and why>`
**What I learned that is not in the docs:** `<the thing the next session would otherwise rediscover>`
**What the next session should do first:** `<one specific action>`

- [ ] `SECTION-LOG.md` row appended
- [ ] Any new finding added to `2026-09-experience-plan.md` Part 4, not just noted here
- [ ] Any corrected fact fixed **in the audit doc itself**, so the error does not propagate
