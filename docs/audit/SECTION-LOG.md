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
| 2026-09-07 | **Blog** | Reading time (chars→words), reader-menu clipping, measure 91→68 chars, paragraph rhythm 14→24px, parallax hero→text header, 4 unrendered sections cut, Paper+Broadcast themes cut | read-next, Reactions, citation box, 2 light themes, THEME_OPTIONS label/desc, parallax + canvas colour sample | Filter back button (`router.replace`); B18/B19 consolidation deferred; 6 newly-dead articleUi fields |
| 2026-09-07 | **Blog (closeout)** | 16 dead Studio fields deleted; Giscus + GitBook link removed; Lexend unpreloaded; tap targets to a 24px floor; reader-menu chip unclipped; hidden post restored; filter Back fixed; placeholder tidied | Comments.tsx, 3 giscus env vars, giscus + fonts.googleapis from CSP, GitBook footer link, 16 fields | **IN REVIEW** — awaiting your firsthand review. Studio checklist below (B20, B21) not done. |

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

### 2026-09-07 — Blog section

Diagnosis in `sections/blog.md`; this is what was executed. Six commits, all verified against a
production build rather than assumed.

**Measured before → after:** measure 91 → **68** characters per line at 1440 (optimal 60–75);
paragraph gap 14 → **24px** against a 27.75px line box; header height ~612 → **60px**; reader-menu
controls reachable 3/24 → **20/22**; index reading times 22 and 110 min → **3 and 17**.

**Four root causes worth remembering, none of which were what the audit guessed:**

1. **Reading time was counting characters.** `length()` on a string in GROQ returns characters, so `"wordCount": length(pt::text(body))` fed a character count into a 220-wpm divide. Inflated everything ~4.5×.
2. **The reader menu was clipped, not stacked.** The sidebar TOC used `sticky … overflow-y-auto`; when one axis is not `visible`, CSS computes the other to `auto`, so the absolutely positioned panel was clipped by its scroll container. `z-index: 1002` was set and irrelevant. The audit's stacking-context theory was wrong.
3. **`mb-6` on paragraphs has never worked, site-wide.** `styles/index.css` carries `p:not(:last-child){margin-bottom:.875rem}` at specificity (0,1,1), outranking Tailwind's `mb-6` (0,1,0). Any `mb-*` on a `<p>` anywhere in this codebase is silently overridden.
4. **`.meta-label` already existed with zero callers** (`styles/index.css:121`). Written in the September refactor as the answer to the 43-permutation label problem and never adopted. A utility landing with no adoption pass is a process defect, not a design one.

**Theme decision: cut Paper and Broadcast, keep Archive and Terminal.** Theme classes only reach
`<article data-article>` and the CSS only selects prose inside it, so on cream or white every framed
component and all page chrome stayed near-black. Repairing that needs light variants for 15 card
treatments and 37 border colours (**site-wide the real figure is 56 border tokens and 52 background
fills** — see `UI-INVENTORY.md`) — i.e. the B18/B19 consolidation that was deferred — so fixing it
now would mean writing light variants twice. Evidence kept in
`docs/audit/screenshots/themes/` even though two of those themes no longer exist.

**Part 5 completed after the menu fix** (it had aborted on the bug). All 8 reader-menu controls
change the DOM and persist across reload. Keyboard: 30 tab stops, **0** without a visible focus
ring, 0 zero-size. TOC scroll lands headings consistently at 208px and the active highlight is
**accurate, not lagging** — the suspicion was unfounded.

**Still open:** the blog index filter uses `router.replace` (`BlogDirectory.tsx:95`), so the back
button leaves the page rather than restoring the previous filter. Deep links and the active chip
work. Left alone — it is a UX judgment call, not a defect. Six `articleUi` fields became dead with
the deletions (reactionsHeading, reactions[], citeHeading, citeTemplate, readNextHeading,
readNextLabels); field removal was deferred as B8.

**Next session should do first:** write the WinRM post. The audit's own conclusion, reached a third
independent time — twelve of the article page's twenty sections did not render, so the consolidation
work targets components no reader has seen.

### 2026-09-07 — Blog closeout — **STATUS: IN REVIEW**

Not complete. Stefan has not used the page yet; the section stays open until he says so.

**Executed (6 commits).** Cuts: 16 dead Studio fields; Giscus + the GitBook footer link; Lexend
unpreloaded. Fixes: tap-target floor + reader-menu chip; the hidden post + filter Back; placeholder
tidy.

**Measured.** Tap targets on the article at 390: 31 under 44×44 and several under 24 → **28 under
44, zero under 24**. Page weight 295KB/59 req → **256KB/57 req**, load 5031 → 4788ms. `/blog` now
reports **3 posts**. Filter Back restores `/blog`. `npm run check` 0, **33 smoke tests**, 6 captures.

**Premises that failed this session — all three surfaced rather than worked around:**

1. **A designed placeholder already existed.** `EmptyThumbnail.tsx` generates a deterministic gradient, texture and category label from the title hash. The question was never "build one" — it never renders because all three posts have a cover image.
2. **The dead-field count was 16, not 8.** Verified by dereference including bracket access (there is none on these objects). Three of the seven `blogPage` fields sat on the shared `sectionCopy` type whose `lede` *is* read by `servicesPage`, so those three strips got a narrow inline type instead of stripping the shared one.
3. **A published post was invisible.** Two posts flagged `isFeatured`; the query selected one and excluded all of them from the grid. `homeIntelQuery` had the same bug. This is why four audit documents said "2 posts" when there are 3.

**Partial, stated plainly:** unpreloading Lexend removed it from `/blog` and `/services` (6 fonts /
154KB) but **not from the article page** (7 fonts / 171KB), because `article.css` references
`--font-lexend`. And it is 17KB, not the ~40KB the audit claimed. Fully removing it means moving the
dyslexia font-family out of `article.css` and applying it on activation.

---

## OPEN — Studio work for Stefan

### B21 — Link Week 2 to Week 1 · **BLOCKED, premise fails**

**There is no Week 1, and no series document exists.** Queried the dataset directly:

- Published posts: "The Field, The Moment…" (2026-05-15), "Building My Physical Home Lab — Week 2" (2026-04-06), "The Creation of my Personal Portfolio Site!" (2026-03-31).
- `*[_type == "series"]` returns **nothing**. No series has ever been created.
- No post matches "Week 1".

So the task as written cannot be done. Three ways forward:

1. **Write Week 1.** The title promises it and its absence is the actual problem.
2. **Retitle** the post so it stops implying a missing prequel.
3. **Create the series anyway** — but with one member it renders "Part 1 of 1" on a post called Week 2, which reads worse than no banner.

**When you do have two parts**, the exact steps are: Studio → Knowledge → Series → Create. Set
**Title** ("Physical Home Lab"), **Slug** (generate), **Description**, **Status**. Then on each post:
Presentation group → **Series** → select it, and **Position in series** → `1` for Week 1, `2` for
Week 2 (the field description says "1 for the first part. Required when a series is set."). Verify
by loading `/blog/<slug>` — a "Part 2 of 2" banner with prev/next appears above the TL;DR slot — and
`/blog/series` lists it.

### B20 — Set confidenceLevel and reviewStatus · **OPEN**

Both are `null` on all three posts, so `CredibilitySection` does not render at all today.

**Studio → Writing → the post → Presentation group → Confidence Level.** Pick honestly; the point of
the field is that it is not flattering:

| Value | What it actually claims |
| --- | --- |
| Speculative | Thinking out loud, may be wrong, worth writing anyway |
| Working theory | Has logic behind it, you have not fully tested it |
| Confident | You understand it well enough to teach it |
| Verified | You confirmed it in a lab or real environment |
| Peer reviewed | An industry professional confirmed the accuracy |

For "Home Lab — Week 2", **Verified** is the honest pick if you actually ran the GNS3 lab and the
documentation package; **Confident** if you are describing what you set up without having tested the
claims. Do not use Peer reviewed — nobody has reviewed it.

**Credibility group → Review Status:**

| Value | What it claims |
| --- | --- |
| Self-reviewed | Default. You wrote and edited it |
| Seeking review | Published, want expert eyes. Shows an amber "Seeking peer review" tag |
| Community reviewed | One or more people read and responded — add them in Reviewers |
| Expert verified | A professional confirmed technical accuracy |

**Self-reviewed** is the truthful setting for all three today. **Seeking review** is defensible on the
home-lab post and is an invitation rather than a claim.

**Verify it took:** publish, wait up to **5 minutes** (`X-Nextjs-Stale-Time: 300`), reload the post.
A badge appears in the header row and a "How this was checked" section renders above Backlinks. If
nothing changes after 5 minutes the field did not save.

### Also open

- **B16 needs your Studio action to take effect** — unset **mainImage** on "Building My Physical Home Lab — Week 2" and the tidied placeholder renders. The code is in; the card still shows the clipped documentation screenshot until you do.
- Lexend still loads on the article page (above).
- `articleUi.blocks.credibilityHeading` and the `maturity`/`load` vocabularies are still live and used — not deleted.

### 2026-09-08 — Corrections to the blog closeout (verification pass, no code changed)

Three claims from the closeout re-tested against production `60d18c5`. Two were wrong, and both
errors were mine — bad test method, not bad code.

- **B13 reading time is correct and deployed.** Production renders **"18 min read"** (The Field) and **"3 min read"** (home lab); `/blog/osi-model` 6 min, portfolio 2 min. A reported "165 min read" is **not reproducible** on any route. Grepping raw HTML for `[0-9]+ min` is unsafe — it matches Tailwind classes like `min-h-[480px]`, which is where an apparent "10 min" on `/blog` came from. Read rendered `innerText`, not markup.
- **The reader menu is 22/22, not 20/22.** Print and Share failed only a *strict* `el === hit || el.contains(hit)` check; `elementFromPoint` returns an **ancestor** `div` for them. Re-tested allowing ancestors: 19 pass, 3 reachable by scrolling inside the panel, **zero genuinely covered**. Confirmed independently by Stefan clicking both. The earlier "18 of 24 blocked" figure was real; this residue was not.
- **The "Also open" list was never empty.** It still holds all three bullets (B16 Studio action, Lexend on the article page, live `credibility` vocabularies). A `sed` range terminating at the first blank line made it look truncated.

**Method note for future sessions:** three separate findings this week were artifacts of the
measuring command rather than the code — the `published`-perspective secret query, the strict
hit-test, and this `sed` range. When a measurement contradicts observed behaviour, suspect the
measurement first.

**Still genuinely open (unchanged):** ~~B6 Lexend on the article page (17KB, verified still loading
on `60d18c5`)~~ — **withdrawn 2026-09-08**, see below — and the content items B16 / B20 / B21.

---

## 2026-09-08 — first code block shipped

**Shipped:** `83a4b72` D1 + the 19px default. `f78e1b7` D7. `5c7cca4` the article typography block.

- **D1** — `ArticleProvider.tsx:98`. `Number(localStorage.getItem('sp_font_size'))` returns 0 for a
  first-time reader because `Number(null) === 0`, which passed every guard, so
  `DEFAULT_SETTINGS.fontSize` was unreachable and everyone silently read at 15px. Default also moved
  to index 2 (L, 19px). `styles/article.css` had to change with it — its pre-hydration value must
  equal `FONT_SIZES[DEFAULT_SETTINGS.fontSize]` or the prose visibly resizes on load, which it had
  been doing on every article view. Measured after: 19px, identical pre- and post-hydration at all
  three breakpoints, **80 → 65 characters per line**.
- **D7** — `SearchModal.tsx:97`. The `[open]` effect fell through to the focus-restore branch on
  mount, so the search button was `document.activeElement` on first paint sitewide. Verified on
  production before and after: `BUTTON` + `:focus-visible` → `BODY`, and the skip link is now the
  first Tab stop on `/`, `/blog` and an article.
- **Typography** — single 1.25 scale on a 19px base (48/38/30/24/19), line-height 1.85 → 1.70,
  paragraph 1.6em → 1.5em, `hyphens: auto`, the rule under every h2 removed, blockquote from
  stone-400 to stone-200 with no left border, figures 4rem, `SectionBreak` subtle variant retuned to
  a 96px centred rule, reader menu given an origin/entrance/mask/scrim, zero-series row hidden.

**Deliberately not applied:** the proposal's 34/40/46rem widths. They were calculated against 15px
prose and an 80-character measure. The font fix already closed that; standard now reads 65, close to
the 66-character optimum, and 40rem would push it to 72. Only narrow moved (32rem read 58).

**Corrections folded into the audit documents this session:** the D4 spec was wrong (`max-w-[20ch]`
is *narrower* than the wrapper it sits in and would worsen the wrap); the light-reading-theme
recommendation is dead (Linear runs long essays on `rgb(8,9,10)` and our contrast already matched);
"body is stone-400" was wrong (it is stone-200); "12 of 20 sections don't render" was wrong
(measured 6, 6 and 7 of 20 render); the sub-12px "dormant code" claim was blog-scoped, not
site-scoped; **B6 Lexend is withdrawn** — measured `document.fonts` reports `Lexend:unloaded` and it
is absent from the six font requests, so `preload: false` works and the earlier "17KB" counted a
declared `@font-face` rather than a network request.

**Method note, seventh and eighth artifacts.** A stale `next start` on port 3100 — `pkill -f` does
not work here, the port must be freed by PID — served a pre-rebuild manifest after `rm -rf .next`,
producing chunk 500s, an unstyled page and a missing skip link that all looked like code defects.
Separately, a `grep` pattern with shell-escaped brackets reported six generated Tailwind classes as
MISSING when live measurement had already proved them present. Same standing rule: when a
measurement contradicts observed behaviour, suspect the measurement first.

---

## 2026-09-10 — the button primitive (SPECS item b)

**Shipped:** `buttonClass()` and `QUIET_LINK` in `lib/ui.ts`, migrated across 28 files. The specced
order was `a → c → b → d → e`; `a`, `c` and `e` landed in the previous session, so this is `b`, and
only `d` (the site-wide type scale) remains.

### What was actually there

The census that mattered was not the padding count — it was that **the filter chip had six
independent definitions**, and they did not agree on anything:

| Where | Face | Padding | Radius | Rest border | Selected |
| --- | --- | --- | --- | --- | --- |
| `BlogDirectory.chip()` | sans 14 | `px-3 py-1.5` | full | `edge-strong` | `edge-active` + fill-strong + shadow |
| `LibraryClient.chip()` | meta-label | `px-3 py-1.5` | sm | `edge` | white fill |
| Garden tag cloud | meta-label | `px-3 py-1.5` | sm | `edge` | white fill |
| Garden note tags | meta-label | `px-2 py-0.5` | sm | `stone-800` | `edge-active` + fill-strong |
| Glossary filter | meta-label | `px-3 py-2` | full | `edge` | white fill |
| Reader menu | sans 14 | `px-3 py-1.5` | full | `edge` | white fill |

Two selected languages, two radii, two faces, three paddings, three rest-borders — for one control
that appears on `/blog`, `/library`, `/garden`, `/glossary` and inside every article. The bordered
controls were the same story at lower contrast: six paddings and four radii across sixteen sites.

### The decisions, so they can be overruled

1. **Selected is `border-edge-active` + `bg-surface-fill-strong` + `text-white`, not `bg-white
   text-black`.** Three of the six used the white fill, but it is the only thing in the chip family
   that does not restate under an article theme — a white pill inside `theme-terminal` stays white.
   The token version themes for free, which is the whole point of the palette commit.
2. **Filter chips are `font-sans text-sm` everywhere.** `/library`, `/garden` and `/glossary` moved
   off `.meta-label`. A row of filter buttons in mono uppercase reads as the archive jargon
   `CLAUDE.md:36` rules out; a control label is not a micro-label. The garden's **in-card** note tags
   stay `.meta-label`, because they sit inside a card whose whole metadata block is mono.
3. **`min-h` 32/40/48 is baked into the sizes.** The spec predicted chip rows would grow; the garden
   note tags were the only real casualty, going from ~20px to 32px. WCAG 2.5.8 is the tiebreaker.
4. **No `<Button>` component, and no `ghost` variant.** Half the call sites are `<Link>` or `<a>`,
   which a component cannot serve, and the other half would be a wrapper computing the same string —
   so `buttonClass()` returns a string. `ghost` had exactly one true call site (the packet animator's
   Replay), and this repo deleted `.focus-ring` last week for having zero. Quiet text links are not
   buttons and got `QUIET_LINK` instead, which is the same shape as the `FOCUS` constant.
5. **`NewsletterForm` was left alone.** Its button is half of a joined square input+button pair and
   the component ships in the site-wide `Footer`; giving only the button `rounded-lg` would break the
   pair on the portfolio side too. Out of scope for a blog-side commit.

### 24 controls had no focus ring

Found while wiring the primitive, and worth stating separately because it is not a consistency
issue. `FOCUS` had 163 call sites, but **ten files on the knowledge side never imported it at all**:

```
KnowledgeQuiz 3   PacketAnimator 4   CredibilitySection 4   LearningBlocks 4
LayerExplorer 1   WiresharkCallout 1  SourcesList 1
not-found 2       garden/page 1      library/page 1        osi-model 1
```

Twelve of those are the **in-body learning blocks** — the interactive teaching widgets in the middle
of an article, which is exactly what a keyboard reader tabs through. Fourteen were fixed by the
primitive; ten were patched inline. A 24th, the footer's `p-name u-url` h-card link, is on every page
of the site and got a one-line additive fix in the platform-owned `Footer.tsx`.

The packet animator's step track was also a **4px-tall button**. It now carries a 24px box around
the same 4px bar, plus `aria-label` and `aria-current="step"`; the bar itself is unchanged.

**Measured after, at 1440 on the built output:** `ringless: none` on `/blog`, `/blog/series`,
`/garden`, `/library`, `/glossary`, `/graph` and `/blog/osi-model` — every visible `a` and `button`
carries the ring except the skip link, which has its own amber outline in `styles/index.css:102`.
`/blog`'s fourteen filter chips render as **one geometry: 34px, `border-radius: 9999px`, Inter
14px**. The reader menu's radios render `rounded-full`, Inter 14px, selected at
`rgba(255,255,255,0.45)` border on `rgba(255,255,255,0.1)` — the tokens, not the white fill.

Verified in the built CSS rather than assumed: `.min-h-\[32px\]{min-height:32px}`, `40px`, `48px`,
`.hover\:bg-surface-veil:hover`, `.hover\:border-edge-strong:hover`, `.hover\:bg-stone-200:hover`
and `.disabled\:opacity-40:disabled` all emit. Build, tsc, eslint clean; **33/33 Playwright**
including the CSP and axe checks and the article page's reader-menu assertions.

### Method notes — the ninth and tenth artifacts

**A stale `next start` on port 3000 cost ten test failures.** `playwright.config.ts` sets
`reuseExistingServer: !CI`, so the suite silently attached to a server started before any of this
session's edits and reported 10 failed — including `/photography` 500, a missing `<title>` on `/`,
and CSP violations on routes this commit does not touch. Proved stale by comparing the CSS chunk the
server was serving (`06wpz9uxvhmgy.css`) against the fresh build (`0imku8ejwzv6v.css`); no such file
existed on disk. Freed by PID — `Stop-Process -Id`, since the port cannot be freed by name — after
which the same suite passed 33/33 unchanged. **This is the second time this exact server has
manufactured failures.** Check the served chunk hash before believing a broad test failure.

**Then the built-CSS check reported all eight new utilities MISSING.** They were all present; the
shell was eating the backslashes in `grep 'min-h-\[32px\]'`. Confirmed with `grep -F` and then with
plain `str.find` in Python. Same standing rule, now on its tenth instance: when a measurement
contradicts observed behaviour, suspect the measurement first.

### Deliberately not migrated

- The knowledge graph's legend filter rows (`px-2 py-1.5 rounded-md`, measured 30px) — full-width
  toggle rows in a panel, not chips.
- `KnowledgeQuiz` option rows, `LayerExplorer` layer rows and `Checkpoint` — large left-aligned
  option panels with their own state colours. They got focus rings, not the primitive.
- The opaque `stone-600/700/800` borders inside the coloured learning blocks, as in the palette
  commit: the border there is part of a semantic accent, not the neutral scale.
- `styles/index.css:97` — the skip link is `font-size: 11px`, a sub-12px instance the floor commit
  did not reach because it was blog-scoped and this file is platform-owned. Still open.
