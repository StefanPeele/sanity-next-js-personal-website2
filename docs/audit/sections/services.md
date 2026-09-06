# SECTION: `/services`

Worked example of `docs/audit/SECTION-TEMPLATE.md`. Sections 1–5 are filled and ready to execute.

> **Status: prepared, not executed.** The audit that produced these work items was completed on
> 2026-09-06 and no code has been changed. §6 verification and §8 handoff are shown filled in
> *shape only* — the boxes are unticked because the work has not been done. A real section file
> ends with them completed.

Date started: 2026-09-06 (prepared) · Session: https://claude.ai/code/session_01V9aSuMHwE2iAHLMBpb1vzx

---

## 1. CONTEXT TO LOAD

**The route**
- [x] `app/(personal)/services/page.tsx` — 139 lines. Five sections, each gated on a `copy.<section>.enabled` boolean
- [x] `app/(personal)/layout.tsx` — personal shell: Navbar, `<main id="content">`, Footer

**Its components**
- [x] `components/services/ServicePackages.tsx` — 315 lines. Tabs, NJIT switch, cards, add-ons, and it renders the inline booking form at `:311`
- [x] `components/services/ServiceFAQ.tsx` — 54 lines
- [x] `components/services/Testimonials.tsx`
- [x] `components/BookingSection.tsx` — 328 lines. **Shared** — also used standalone; `inline` prop changes the disclosure behaviour
- [x] `lib/pricing.ts` — 313 lines. Packages, add-ons, product lists, `airtableName` mapping
- [x] `app/actions/booking.ts` — 328 lines. The server action; read it before touching any package id

**Its Studio wiring**
- [x] `lib/cms/defaults/servicesPage.ts` (92 lines) · `sanity/schemas/singletons/servicesPage.ts` (50) · `sanity/lib/queries-services.ts` · `sanity.types.ts`

**The audit docs**
- [x] `2026-09-services-audit.md` — the section-specific audit. **Read §5 before touching booking**
- [x] `2026-09-full-inventory.md` §1, §3a, §7
- [x] `2026-09-experience-plan.md` Part 2.2 (3 deletions here), Part 3.3, Part 4 items 1.5, 1.6, 1.2
- [x] `SECTION-LOG.md` — groundwork entry

**State check**
- [x] Clean tree at `7016190`
- [x] **Dataset is NOT seeded.** `servicesPage` does not exist in `jebe3ru8/production`; the page renders `DEFAULT_SERVICES_PAGE`. Editing copy in Studio will not verify until `plan 1.4` is done. Copy changes this session go in the **defaults module**, and the Studio round-trip check in §6 is waived with a reason

---

## 2. THE GOAL THIS SERVES

| Goal | Serves it? | How directly |
| --- | --- | --- |
| G1 Blog | No | — |
| G2 Library | No | — |
| G3 Projects + resume | No | — |
| G4 Photography services | **Yes** | This *is* G4. The page is the entire commercial surface of the site |

**Primary goal:** G4

**Why this section is worth a session now:** it is the only page on the site that has to convert
rather than inform, it is the tallest page at 390px (9,923px — 11.8 screens), and it is the page
where a bug costs a lead rather than a reader.

---

## 3. BASELINE

| Breakpoint | Files | Looking for |
| --- | --- | --- |
| 1440 | `services-njit-off.png`, `services-njit-on.png`, `services-booking-open.png` | Card grid at 2 columns; the physical-product list repeated in every card |
| 768 | same three | `md:grid-cols-2` puts 2 cards in ~360px each while still printing 11 product names |
| 390 | same three | Total height; 9px product names; truncated add-on labels; 13×16 checkbox |

- Height at 390px now: **9,923px (11.8 screens)** — inventory §1
- Target after this session: **< 7,500px** (the C2 cut alone is ~2 screens)
- [x] `state-unavailable`: none for this route. Note the booking form renders **inline** on
      `/services` (`ServicePackages.tsx:311`), so there is no disclosure button — the harness
      annotates this and captures the form open, which is correct

---

## 4. WORK ITEMS

From `2026-09-experience-plan.md` Part 4 (items 1.2, 1.5, 1.6) plus the Services audit.

| # | What changes (files) | Why (goal) | Effort | Risk | Depends on | Status |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | **Cut `PhysicalProductBadge`** from package cards — delete `ServicePackages.tsx:32-55` and the call at `:246` | G4. Removes 2 of 3 duplicate product lists and ~2 screens of mobile height. Section "What you'll own" (`page.tsx:81-102`) and FAQ #4 remain | 0.5 | Low | — | ☐ |
| S2 | **Hide `comingSoon` packages** — filter in `packagesByCategory()`, `lib/pricing.ts:281-283`; keep the data | G4. 2 of 6 portrait/event cards are greyscale and unbuyable | 0.25 | Low. Check the JSON-LD offers filter at `page.tsx:38` still excludes them | — | ☐ |
| S3 | **Fix 3 hardcoded Studio overrides** — `includesNote` (`ServicePackages.tsx:258`), `wip` (`:238`), `selectedLabel` (`BookingSection.tsx:235`) | G4. Editable fields the components ignore | 0.25 | Low | — | ☐ |
| S4 | **Airtable robustness** — `typecast: true` on both `airtableCreate` calls (`booking.ts:137-144` call sites `:278`, `:300`); reconcile `'Framed print set'` (`pricing.ts:263`) with its label; confirm the `'Not sure yet'` option exists in the Airtable `Package` field | G4. A rejected option currently loses the whole inquiry (`booking.ts:301-304`) | 0.5 | **Medium — live booking path.** Submit a real test inquiry and confirm both the Airtable record and both emails | — | ☐ |
| S5 | **Delete the 3 framer-motion animations** — `ServiceFAQ.tsx:36-50` → `<details>`; `BookingSection.tsx:187-206` and `:216-247` → `hidden`. Keep `:312-317` (real state change, retune to tokens) | G4. Plan Part 2.2 | 0.75 | Low. `<details>` must keep the focus-visible ring; add `aria-expanded`/`type="button"` if the button is kept instead | S1 | ☐ |
| S6 | **Type floor** — every `text-[8px]`/`[9px]`/`[10px]` on this route to the `label`/`small` tokens; single `0.08em` tracking | G4. Plan Part 3.3 | 0.75 | Medium. Re-screenshot; height will shift | S1, plan 2.1 | ☐ |
| S7 | **Mobile fixes** — remove `truncate` (`BookingSection.tsx:48`); NJIT checkbox 13×16 → 24px min (`:209`); show the NJIT savings readout on mobile (`ServicePackages.tsx:135`) | G4 | 0.5 | Low | — | ☐ |
| S8 | **Voice** — the middot triplets (`defaults/servicesPage.ts:41`, `:51`), `inquiryEyebrow` (`:73`, rendered `ServicePackages.tsx:305`), the add-ons `THING · OTHER THING` heading (`:285-287`, which also carries both `font-mono` and `font-sans`), package taglines (`pricing.ts:78,98,123,147`) | G4 | 0.75 | Low. Copy changes go in the defaults module while the dataset is unseeded | — | ☐ |

**Explicitly out of scope this session:**
- **Prices into Studio** (`plan 4.1`, services audit §3). Deliberate — do it once pricing stabilises. The tradeoff analysis is written; do not redo it.
- **The physical-product data path** (services audit §5c). Option (a) — accept it as consultation-deferred — is chosen and implemented *by* S1. Do not build the form field.
- **Calendly.** Not broken; unset and degrading correctly. If you decide against Calendly, drop it from `next.config.ts:22` `frame-src` — but that is a platform-owned file, so it goes in its own commit.

---

## 5. EXECUTION ORDER

| Order | Item | Why this order for this section |
| --- | --- | --- |
| 1 (cut) | S1, S2, S5 | S1 deletes the `PhysicalProductBadge` block, which contains **16 of this page's sub-12px elements** — doing it before S6 means 16 fewer elements to retype and one fewer component to re-screenshot. S2 removes 2 cards, so S6 and S7 have 4 cards to check instead of 6. S5 removes 3 animations from components S6 then edits |
| 2 (fix) | S3, S4, S7 | S3 is mechanical and independent. **S4 is the only item that can cost money if wrong** — do it while the diff is still small and reviewable, not buried under the type pass. S7 touches the same two files as S6 but is a correctness fix, so it lands first and S6 inherits the corrected markup |
| 3 (improve) | S6, S8 | Both are large diffs with no behavioural risk. S6 last among code changes so it applies to the final markup only once. S8 is copy-only and can be reviewed independently of everything above |

---

## 6. VERIFICATION

**Not yet run — this section has not been executed.** Shown filled in shape only.

- [ ] `npm run check` exits 0 — zero warnings
- [ ] `npm run build && npm run test:e2e` passes — includes CSP and axe on `/services`
- [ ] `npm run screenshot`, diff `390/services-*.png` against baseline. **Record height 9,923 → `<N>`**
- [ ] Studio round-trip for `includesNote`, `wip`, `selectedLabel` — **waived while the dataset is unseeded** (§1). Instead: edit the value in `lib/cms/defaults/servicesPage.ts`, rebuild, confirm the page changes. Re-do properly after `plan 1.4`
- [ ] Every interaction at 390px: three category tabs, NJIT switch on/off, FAQ open/close, package select, date picker, add-ons disclosure, every add-on checkbox, submit with an invalid field, submit valid
- [ ] Nothing below 12px introduced
- [ ] **S4 only:** one real inquiry submitted end to end — Airtable client record, Airtable shoot record, notification email, confirmation email. Test `'Not sure yet'` specifically, since it is the highest-risk option

| Check | Result | Notes |
| --- | --- | --- |
| | | |

---

## 7. COMMIT

Four commits, in execution order — cuts revert independently of the booking fix:

1. `Services: cut the duplicated physical-product lists and unbuyable cards` (S1, S2)
2. `Services: render the three Studio fields the components ignored` (S3)
3. `Booking: typecast Airtable selects so a new option cannot drop an inquiry` (S4) — **its own commit; it is the only behavioural change**
4. `Services: type floor, mobile fixes, motion cuts, voice` (S5, S6, S7, S8)

Each message names its finding — "closes services audit §2", "inventory §3a", "plan Part 2.2" — and
carries the measured height delta.

- [ ] Baseline screenshots re-committed
- [ ] `npm run check` green at each commit

---

## 8. HANDOFF

**Not yet written — this section has not been executed.** Fill on completion, then append the row
to `SECTION-LOG.md`.

**What changed:** `<...>`
**What was cut:** `<...>` — expect: 2 duplicate product lists, 2 cards, 3 animations, ~2,400px of mobile height
**What is still open:** `plan 4.1` prices into Studio; `plan 1.4` blocks the real Studio verification
**What I learned that is not in the docs:** `<...>`
**What the next session should do first:** `<...>`
