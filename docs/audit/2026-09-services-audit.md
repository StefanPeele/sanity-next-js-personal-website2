# Services page audit — 6 September 2026

Scope: `/services` and the booking pipeline behind it. No code changed.

**Method.** Read `app/(personal)/services/page.tsx`, `components/services/{ServicePackages,ServiceFAQ}.tsx`,
`components/BookingSection.tsx`, `app/actions/booking.ts`, `lib/pricing.ts`,
`lib/cms/defaults/servicesPage.ts`, `sanity/schemas/singletons/servicesPage.ts`,
`sanity/lib/queries-services.ts`. Reviewed the new baseline captures at
`docs/audit/screenshots/baseline/{1440,768,390}/services-{njit-off,njit-on,booking-open}.jpg`.
Mobile numbers are measured, not eyeballed: a Playwright pass at 390×844 against the production
build recorded page height, every rendered font size, every tap-target box, and every element
crossing the viewport edge.

**Baseline caveat.** Local captures carry a "Sanity Live couldn't connect — your origin is blocked
by CORS policy" toast in the corner, because `127.0.0.1` is not a CORS origin on project
`jebe3ru8`. It is the only element that overflows 390px (`<ol>` reaching 406px) and it is **not a
site defect**. Add the origin in Sanity → API → CORS, or capture against production, before using
these files for pixel diffs.

---

## 1. Voice

| Finding | File:Line | Severity | Proposed fix |
| --- | --- | --- | --- |
| `"Add-ons · Available for any package"` — the `THING · OTHER THING` label pattern, rendered as one heading | `components/services/ServicePackages.tsx:285-287` | High | Render `addOnsHeading` as an `h3`, drop the `·` and the lede, or move the lede to its own `<p>` |
| Same pattern: `"Core · included"` / `"Premium · included"` | `app/(personal)/services/page.tsx:91` | Medium | `{tier.label}` alone; "included" is already implied by the section |
| `"No ghosting · No excuses · Just communication and solutions"` — a middot slogan triplet, not a sentence anyone says | `lib/cms/defaults/servicesPage.ts:51` | High | One plain sentence: "If something goes wrong I tell you, and I fix it." |
| `"Pricing discussed during consultation · No hidden costs"` — same construction | `lib/cms/defaults/servicesPage.ts:41` | Medium | "We work out pricing on the call. Nothing gets added afterwards." |
| Package taglines are Title-Case staccato feature copy — `"Editorial. Intentional. Full Experience."`, `"Professional. Directed. Polished."`, `"Extended Coverage. Stronger Output."`, `"Top-Tier Coverage. Full Day. Video Included."` — and "Intentional" is on your own flag list | `lib/pricing.ts:98`, `:78`, `:123`, `:147` | High | Say what the session *is*: "Two and a half hours, multiple looks, commercial licence." |
| `inquiryEyebrow: 'Questions?'` renders as a `.section-label` above the heading — an eyebrow mini-header, which CLAUDE.md forbids outright | `lib/cms/defaults/servicesPage.ts:73`, rendered `ServicePackages.tsx:305` | Medium | Delete the field and the `<span>`; the `h3` under it already says "Not sure where to start?" |
| `"A digital gallery lives on your phone. A physical product lives in your home for decades."` — brochure cadence | `lib/cms/defaults/servicesPage.ts:34` | Low | Keep the idea, halve the words, drop the antithesis |
| Hero: `"Every moment\nworth capturing,\ncaptured right."` — the chiasmus is the most template-sounding line on the page | `lib/cms/defaults/servicesPage.ts:6` | Medium | Something only you could write — what you actually shoot, for whom, in Newark |

---

## 2. Feature cost

| Finding | File:Line | Severity | Proposed fix |
| --- | --- | --- | --- |
| **The physical-product list is on the page three times**: in every package card, again as the "What you'll own" section, again as FAQ #4 | `ServicePackages.tsx:246` + `:32-55`; `services/page.tsx:81-102`; `defaults/servicesPage.ts:59` | High | Cut `PhysicalProductBadge` from the cards. Keep the section and the FAQ answer |
| The in-card list prints **11 premium product names at 9px mono** — a specification dump inside a sales card | `ServicePackages.tsx:42-49` (`text-[9px]`, `:46`) | High | Covered by the cut above; if kept, one line: "Choose a premium keepsake during the consultation" |
| Two of six portrait/event cards are `comingSoon` and render greyscale — half the grid is unbuyable | `lib/pricing.ts:113`, `:167`; rendered `ServicePackages.tsx:186` | Medium | Hide `comingSoon` packages until they exist; a visitor cannot act on them |
| FAQ accordion uses framer-motion height animation for content below the fold | `components/services/ServiceFAQ.tsx:36-50` | Medium | `<details>/<summary>` — no library, no JS, keyboard and search-in-page work for free |
| Two more framer-motion height animations *inside the form*, on fields the visitor is trying to fill in | `BookingSection.tsx:187-206`, `:216-247` | Medium | Show/hide with `hidden`; animating a form field delays the interaction it gates |
| FAQ accordion button has no `aria-expanded` and no `type="button"` | `ServiceFAQ.tsx:22-25` | Medium | Add both, or switch to `<details>` and the problem disappears |
| NJIT toggle animates `transition-all duration-300` over a 358×113 card (border, shadow, background, knob) | `ServicePackages.tsx:116-124` | Low | Transition `background-color` and the knob `transform` only |
| Raw glyphs used as icons where the project standard is lucide: `✓`, `↗`, `+`, `+` | `ServicePackages.tsx:234`, `:62`; `ServiceFAQ.tsx:32`; `BookingSection.tsx:238` | Low | `Icon name="check"` etc. from `lib/cms/icons.tsx` — already imported in `ServicePackages.tsx:15` |

---

## 3. Editability

### Does the prices-in-code tradeoff still hold?

**Partly — but it is protecting the wrong field.** The Airtable coupling runs through exactly one
property, `airtableName` (`lib/pricing.ts:32`), which is already a *separate field* from the
display `name`. The form posts a stable `id`, zod validates it against `PACKAGE_IDS`
(`booking.ts:32`), and the action maps id → `airtableName` (`booking.ts:253-254`). Display copy —
`tagline`, `duration`, `turnaround`, `includes[]`, `recommended`, `note`, `badge`, and the prices
themselves — never touches Airtable.

So the safety property you wanted is provided by `id` + `airtableName`, not by keeping prices in
code. Recommendation: move the display fields and prices into a `servicePackage` document keyed by
`id`, and keep `id` + `airtableName` in `lib/pricing.ts` as a small code-owned lookup table that
Studio cannot edit. You keep the exact-match guarantee and stop needing a deploy to change a price.

| Finding | File:Line | Severity | Proposed fix |
| --- | --- | --- | --- |
| **`packageCard.includesNote` is editable in Studio and ignored by the code** — the component hardcodes the identical string | `ServicePackages.tsx:258` vs `defaults/servicesPage.ts:69`, `schemas/singletons/servicesPage.ts:33` | High | Render `{C.includesNote}` |
| **`booking.selectedLabel` (`'{n} selected'`) is editable in Studio and ignored** | `BookingSection.tsx:235` vs `defaults/servicesPage.ts:85`, schema `:47` | High | `copy.selectedLabel.replace('{n}', String(addOns.size))` |
| **`packageCard.wip` is editable in Studio and ignored** — `WIP` is hardcoded | `ServicePackages.tsx:238` vs `defaults/servicesPage.ts:70`, schema `:33` | High | Render `{C.wip}` |
| 19 customer-facing strings — standard delivery, 5 core products, 11 premium products — live only in code, while Studio holds a *prose summary* of the same lists that can silently drift | `lib/pricing.ts:44-70` vs `defaults/servicesPage.ts:36-37` | High | Move the lists to Studio; derive the summaries or delete them |
| Every package's `tagline`, `duration`, `turnaround`, `includes[]`, `recommended`, `note`, `badge` is code-only | `lib/pricing.ts:78-233` | High | Part of the `servicePackage` document above |
| Add-on `label`, `price`, `description` are code-only, and they render as visible page copy | `lib/pricing.ts:239-264`, rendered `ServicePackages.tsx:290-298` | Medium | `serviceAddOn` document keyed by `id`, `airtableName` stays in code |
| `njitSavings()` is **dead code** — superseded by `njitToggle.savingsCopy`, referenced nowhere | `lib/pricing.ts:309-313` | Low | Delete |
| Booking form's seven `sr-only` labels are hardcoded, so screen-reader users get copy no editor can change | `BookingSection.tsx:137, 141, 148, 152, 158, 196, 249` | Medium | Add a `booking.fieldLabels` object; they are also the visible label when a placeholder scrolls away |
| JSON-LD `areaServed` hardcodes Newark / New Jersey although `settings.location.{city,region}` exists | `services/page.tsx:36` | Low | Read from settings |

---

## 4. Mobile (measured at 390×844)

| Finding | File:Line | Severity | Proposed fix |
| --- | --- | --- | --- |
| **The page is 9,923px tall at 390px — 11.8 screens.** The package grid alone is 2,171px | measured; `services/page.tsx:47-137` | High | The three cuts in §2 remove roughly 2 screens; consider collapsing "The promise" pillars |
| Add-on labels are `truncate`d at `text-[10px]`, so "Physical product upgrade" and "Social media pack — same-day" clip mid-word in the form | `BookingSection.tsx:48` | High | Drop `truncate`, allow two lines; the price is already `flex-shrink-0` |
| NJIT affiliate checkbox renders **13×16px** — below the WCAG 2.5.8 minimum of 24×24 | `BookingSection.tsx:209` | High | `h-6 w-6`, or wrap the label in a 44px-tall row |
| Physical-product names render at **9px mono**, the note at **8px uppercase with 0.8px tracking** — 25 elements below 10px | `ServicePackages.tsx:46`, `:50` | High | Removed by the §2 cut; nothing customer-facing should sit below 12px |
| The NJIT savings readout is `hidden sm:block`, so on mobile the toggle changes prices with no summary of what was saved | `ServicePackages.tsx:135` | Medium | Show it on mobile below the label rather than to the right |
| Footer nav links are 20px tall; the navbar search button is 14×14 | measured (site-wide, not services-only) | Medium | Raise to a 24px minimum target |
| At 768px `md:grid-cols-2` puts two package cards in ~360px each while still printing the 11-item premium list | `ServicePackages.tsx:164`, `:42-49` | Medium | Same cut as §2 |
| Package select, date input and textarea measure 308×46/48/86 — correct, native date picker used | `BookingSection.tsx:153`, `:159`, `:250` | — | No change; verified working |

---

## 5. The three known issues

### a. "The Calendly URL is still a placeholder"

**Not reproduced — there is no placeholder anywhere.** `SITE.calendlyUrl` is the empty string
(`lib/site.ts:25`), and `services/page.tsx:26` resolves
`settings?.calendlyUrl || SITE.calendlyUrl || null` to `null`. `ServicePackages.tsx:59` then takes
the falsy branch and renders a button that scrolls to `#inquiry`, exactly as documented at
`ServicePackages.tsx:5-6`. Every occurrence:

| Occurrence | File:Line | State |
| --- | --- | --- |
| `SITE.calendlyUrl: ''` | `lib/site.ts:25` | Empty, never a placeholder URL |
| Resolution with fallback to `null` | `app/(personal)/services/page.tsx:26` | Correct |
| Prop threading | `services/page.tsx:77`, `ServicePackages.tsx:19`, `:57`, `:270` | Correct |
| Guarded link render | `ServicePackages.tsx:59-64` | Correct |
| Studio field `calendlyUrl` | `lib/cms/loaders.ts:20`, `settings` schema | Present, unset |
| CSP `frame-src` allowlists `calendly.com` | `next.config.ts:22` | Unused — nothing embeds Calendly |

**Nothing to fix.** The feature is unconfigured, degrades correctly, and becomes live the moment
you paste a URL into Studio → Site → Identity & SEO. If you do not intend to use Calendly, drop it
from the CSP allowlist.

### b. Airtable `INVALID_MULTIPLE_CHOICE_OPTIONS`

**`resolvePackageName()` does not exist in `booking.ts`** — there is no label-parsing anywhere, so
the failure cannot come from the mismatch you suspected. Packages resolve by stable id
(`booking.ts:253`), and the id is enum-validated before that (`booking.ts:32`), so a label format
produced by `ServicePackages.tsx` can never reach Airtable. **There are no label-format mismatches
to list.**

The real cause is a different one: the action writes six select values and **never passes
`typecast: true`**, so Airtable rejects — with exactly this error code — any value not already
defined as an option.

| Value written | File:Line | Airtable field | Risk |
| --- | --- | --- | --- |
| `'Not sure yet'` | `booking.ts:254`, written `:285` | `Package` (single select) | **Highest.** This is not one of the eight `airtableName`s, so it is the option most likely never created — and "Not sure yet" is an ordinary visitor choice (`defaults:81`) |
| `'Portrait · Core'` and 7 siblings | `lib/pricing.ts:92,115,141,169,186,202,217,232` | `Package` | Contain a U+00B7 middot — one hand-typed Airtable option with a hyphen instead breaks that package permanently |
| `'🟡 Inquiry'` | `booking.ts:272`, `:287` | `Status` (both tables) | Emoji in an option name; trivially mistyped |
| `'NJIT'` / `'Public'` | `booking.ts:286` | `Rate Type` | Low |
| 4 add-on names | `lib/pricing.ts:242,249,256,263` | `Add-ons` (multi-select) | Medium |
| `'Framed print set'` for the add-on labelled "Physical product upgrade" | `lib/pricing.ts:263` vs `:260` | `Add-ons` | **Name and label disagree** — if the Airtable option was created from the visible label, this one always fails |

Proposed fix, in order: (1) add `{ typecast: true }` to both `airtableCreate` calls so Airtable
creates missing options instead of rejecting the record; (2) reconcile `'Framed print set'` with
its label; (3) add a startup or CI check that lists the `Package` and `Add-ons` options and diffs
them against `lib/pricing.ts`. Note that the current failure mode loses the whole inquiry —
`booking.ts:301-304` returns an error and no email is sent, so a rejected option costs you a lead.

### c. Physical products, traced end to end

**There is no end to end. The selection is never captured.** The trace stops at the first step:

1. `lib/pricing.ts:22` — a package carries `physicalProduct?: 'core' | 'premium'`, a *tier*, never a product.
2. `ServicePackages.tsx:246` → `PhysicalProductBadge` (`:32-55`) renders the tier's list. It is a `<ul>` of static text — **no radio, no checkbox, no input of any kind.** The heading says "Choose your physical product" (`defaults:42`) but nothing is choosable.
3. `BookingSection.tsx` — the form has name, email, phone, date, package, availability, NJIT, add-ons, message. **No product field.**
4. `booking.ts:22-38` — `BookingSchema` has no product key; `:213-224` reads no such `formData` entry.
5. `booking.ts:282-297` — the Airtable shoot record has no product field. `'Internal Notes'` records package, add-ons, NJIT and availability. Not the product.
6. `booking.ts:202` — the confirmation email says "Physical product — we'll choose yours during the consultation."

So the system behaves exactly as the copy promises — resolution is deferred to the consultation —
and **nothing is broken**. But it has never been verified end to end because no data path exists to
verify. The only genuine defect is the mismatch between the chooser labels ("Choose your physical
product", `defaults:42`) and a UI that offers no choice.

Two coherent options: **(a)** accept it as deferred, cut the in-card lists (§2) and reword the label
to "Included with this package"; or **(b)** make it real — add an optional `physical_product`
select to the form, a `Physical Product` single-select in Airtable, and the field to the schema and
notes. Option (a) is one session and removes ~2 screens of mobile height; option (b) is two
sessions and adds a field you must keep in sync with Airtable forever. Given that the consultation
call exists precisely to have this conversation, **(a) is recommended.**

---

## Recommended cuts

Ordered by height removed per unit of effort. All are deletions.

1. `PhysicalProductBadge` from the package cards — `ServicePackages.tsx:246`, `:32-55`. Removes ~2 screens on mobile and two of the three duplicate lists.
2. `comingSoon` cards — `lib/pricing.ts:113`, `:167`. Removes two greyscale cards nobody can buy.
3. The `inquiryEyebrow` span — `ServicePackages.tsx:305`, `defaults:73`.
4. `njitSavings()` — `lib/pricing.ts:309-313`. Dead.
5. framer-motion in `ServiceFAQ` and the two form disclosures — `ServiceFAQ.tsx:36-50`, `BookingSection.tsx:187-206`, `:216-247`. Replaceable with `<details>` and `hidden`.
6. The middot slogan triplets — `defaults:41`, `:51`.
