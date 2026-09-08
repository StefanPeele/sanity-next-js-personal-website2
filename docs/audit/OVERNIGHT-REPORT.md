# Overnight session report — 2026-09-08

No application code was changed. Everything below is capture, inventory, research and proposal.

**Companion documents (all committed):**
- `docs/audit/UI-INVENTORY.md` — Part 2
- `docs/audit/COMPARATIVE-RESEARCH.md` — Part 3
- `docs/audit/sections/blog-overhaul-proposal.md` — prior session's blog proposal, partly superseded
- `docs/audit/screenshots/site-inventory/` — Part 1

---

## Judgment calls I made because you weren't here

Marked so you can overrule them.

1. **Screenshot compression.** The raw capture ran to ~1,200 frames / ~90MB, well past the ~14MB
   push ceiling this repo has hit before. You said to compress if it approached the limit, so I
   re-encoded the whole tree with mozjpeg at q58 and capped width at 1100px, then committed in
   batches. Detail is preserved for design review; these are not pixel-exact diffs. **Overrule by
   re-running the capture script with a higher quality if you want archival fidelity.**
2. **`/studio` authentication — not attempted past the first step.** See below.
3. **I did not add anything to `.gitignore`.** No `storageState` file was ever created, so there
   was nothing to ignore. Any future auth artifact should go to the scratchpad, which is outside
   the repo entirely and cannot be committed by accident.
4. **I treated two of your six listed defects as withdrawn** rather than proposing fixes for them,
   because I had already verified they aren't defects. Details in Part 4.
5. **Reference set widened beyond your four.** Rauno and Increment turned out to be poor fits for
   your stated direction; I kept them in the research with reasons rather than dropping them
   silently.

---

## Part 1 — Site screenshot inventory

**Routes enumerated from `sitemap.xml` plus the nav and known unlisted routes — 34 checked, 31
captured.** Every route captured at 1440 / 768 / 390, with full-page, above-the-fold, and state
frames.

Organised as `docs/audit/screenshots/site-inventory/<route>/<breakpoint>/<state>.jpg`.
A capture log with per-route HTTP status and any JS errors is at `…/site-inventory/_capture-log.txt`.

**States captured per route, where the pattern exists:** button hover, button focus-visible, link
focus-visible, `<details>` open (plus a mid-transition frame), search modal open / typing / results
/ no-results, mobile nav open (plus mid-frame), form idle / input focus / filled / submitting /
post-submit, blog filter chips across all four groups (lane, category, tag, sort) plus an
intentionally-empty filter result, article reader menu (trigger hover, mid-open, settled), heading
anchor hover, in-body link hover mid-transition, and scrolled sticky chrome.

**Article preference matrix**, at all three breakpoints: `theme-dark`, `theme-green`,
`a11y-dyslexia`, `a11y-high-contrast`, `a11y-reading-ruler`, `a11y-reduced-motion`, `text-size-XL`,
`width-wide`, `width-narrow`.

### Routes that error

| Route | Status | Note |
| --- | --- | --- |
| `/paths` | **404** | Still linked from the blog directory panel — see D2 |
| `/review` | **404** | Same |
| `/test` | **200** | **New finding (D8).** A publicly reachable test route, indexed-eligible. |

Everything else in the sitemap returns 200. `/blog/feed.xml`, `/blog/feed.json` and `/api/health`
return 200 and were not screenshotted (non-visual).

### `/studio`

Captured unauthenticated: `studio/{1440,768,390}/{fold,full,state-link-focus-visible}.jpg`. It
renders the Sanity login screen, which is what an anonymous visitor sees.

**I did not get an authenticated capture, and I want to be precise about why.** You suggested two
routes. I tried the profile-copy one, and the sandbox's permission classifier blocked the copy of
Chrome's cookie database. That block is correct — copying a browser credential store is
indistinguishable from credential exfiltration regardless of intent — and I did not attempt to work
around it. The `storageState` route needs one interactive login, which needs you present.

**To do it yourself, one time:**

```js
// scratchpad only — never in the repo
import { chromium } from '@playwright/test'
const b = await chromium.launch({ headless: false })
const c = await b.newContext()
await c.newPage().then(p => p.goto('https://stefanpeele.com/studio'))
// …log in by hand, then:
await c.storageState({ path: 'C:/…/scratchpad/sanity-auth.json' })
```

Then reuse with `browser.newContext({ storageState: 'C:/…/scratchpad/sanity-auth.json' })`.
Keep it in the scratchpad, outside the repo. **It is a live session token.**

**What a logged-in capture should cover**, so the gap is explicit: Structure (desk panes at each
level, the singleton groups from `sanity/plugins/settings.tsx`), Presentation (the preview pane and
the document list beside it), Vision (a query and its result), Media, Garden health, Releases, and
the document editor showing every field type in the schema — string, text, slug, image with
hotspot, array of objects, reference, portable text with custom blocks — in each of its states:
empty, filled, focused, validation error, unpublished changes, and the diff view.

---

## Part 2 — UI and feature inventory

Full document: `docs/audit/UI-INVENTORY.md`. Headline numbers across 64 components:

| Dimension | Distinct values |
| --- | --- |
| Type sizes | **22** |
| Sub-12px text instances | **339** (`9px`×141, `10px`×114, `8px`×62, `11px`×15, `7px`×7) |
| Border colour tokens | **56** |
| Background fill tokens | **52** (near-black alone is spelled three ways) |
| Mono + uppercase class strings | **172** |
| Letter-spacing values | **8** |
| Button padding combinations | **25+** |
| `const FOCUS` re-declarations | **30**, 29 byte-identical, never exported |

You asked me to go wider than the 43 `.meta-label` near-duplicates and 37 border colours. The real
figures are **172** and **56**.

The diagnosis is one sentence: **the site has a consistent visual intent and no shared primitives.**
Every component re-implements the intent from memory, so drift is silent and compounding. The
single highest-leverage refactor on the site is extracting `FOCUS`, a `Button`, and a `Label`
primitive — that alone would collapse three of the rows above.

Note that the sub-12px damage is concentrated in learning-block components that **do not render for
any published post**. Six of the eight worst files are code no reader has seen.

---

## Part 3 — Comparative research

Full document: `docs/audit/COMPARATIVE-RESEARCH.md`. Sixteen sites, thirteen measured.

### I have to withdraw my main finding from last session

I told you "eight of eight reference sites are light" and recommended considering a light reading
theme for `/blog/[slug]`. **That was a sampling error and the recommendation was wrong.**

I had sampled longform publications and personal essayists — a category that skews light. I did not
sample dark sites known for interface craft, which is the category this site actually belongs to.

**`linear.app/blog` is `rgb(8, 9, 10)`** — within two points of your `#0a0a0a`. It publishes long
design essays on it and it is one of the most craft-respected interfaces on the web.

I then measured contrast on both, expecting Linear to compensate with brighter text:

```
linear        fg=rgb(208,214,224)  bg=rgb(8,9,10)    17px   13.64:1
stefanpeele   fg=rgb(214,211,209)  bg=rgb(10,10,10)  15px   13.29:1
```

Your body text is already **stone-200 at 13.29:1**, statistically identical to Linear. I had
assumed stone-400; that was wrong too — stone-400 is your *meta* colour, not your body colour.

Measured against the closest real analogue, the gap is:

| | Linear | You |
| --- | --- | --- |
| Body size | 17px | **15px** |
| Line height | 1.60 | 1.85 |
| Column / CPL | 624px / 78 | 576px / 80 |
| Contrast | 13.64:1 | 13.29:1 |
| Chrome in the reading column | **none** | TOC + reader menu + progress bar |

**Keep the dark palette. It is not the ceiling.** The gap is two pixels of type and a room full of
furniture. Cheaper than what I described last session, and I'd rather correct it than have you
build a light theme you don't need.

This is my second reversal on this point in two sessions. Weight my measurements over my aesthetic
generalisations.

---

## Part 4 — The overhaul proposal

### The defects — fixes proposed, none applied

Of the six you listed, **three stand, one is a Studio fix, and two are not defects.**

| # | Fix |
| --- | --- |
| **D1** | `ArticleProvider.tsx:98`. `Number(null) === 0` passes every guard on line 102, making `DEFAULT_SETTINGS.fontSize` unreachable. Replace with `const raw = localStorage.getItem(STORAGE.fontSize); const fs = raw === null ? DEFAULT_SETTINGS.fontSize : Number(raw)`. **This is also the biggest continuity jolt on the site**: the server renders 17px, the client writes 15px inline after hydration, so every article visibly reflows smaller on load. One line fixes size, measure and the jolt. |
| **D2** | Studio → Blog Page → Reference links: delete "Learning paths" and "Review deck". `lib/cms/defaults/blogPage.ts` is **already clean** (6 links); the *published document* carries 8 and overrides it. No code change. |
| **D4** | `BlogArticleHeader.tsx:71`. The header's inner wrapper is `max-w-[36rem]`, matching prose, so a 48px h1 wraps to four lines and splits "Week / 2:". Give display type its own measure — `max-w-[20ch]` on the `h1` only. |
| **D5** | `ArticleProvider.tsx:257` applies the theme class to `[data-article]`. Apply to `#content` instead and re-scope the `[data-article].theme-*` selectors in `styles/article.css`. This is what stops non-default themes rendering as a hard-edged rectangle. |
| ~~Post counts~~ | **Withdrawn.** There are exactly 3 `post` documents. `osi-model` is a hand-built route (`app/(archive)/blog/osi-model/page.tsx`), not a post. "3 posts" is the total, "2 posts" is the grid correctly excluding the featured one. Only real issue is that both use the word "posts" — a copy fix. |
| ~~B6 Lexend~~ | **Withdrawn.** Measured on production: 6 font files requested, Lexend reports `unloaded`. `preload: false` works as documented. |
| **D7** *(new)* | `SearchModal.tsx:97`. The effect keyed on `[open]` falls through to `triggerRef.current?.focus()` on mount, because `open` starts `false`. Measured: the search button is `document.activeElement` and matches `:focus-visible` on first paint. Consequences: the amber ring is the brightest element above the fold on every page, **and the skip link is bypassed**. Guard with a `hasOpened` ref. Site-wide, not blog-specific. |
| **D8** *(new)* | `/test` is publicly reachable and returns 200. Delete it or block it in `robots`/middleware. |
| **D9** | Multi-line inline code renders as ragged stacked boxes. Drop the background (Craig Mod's approach) or add `box-decoration-break: clone`. The real fix for the `systeminfo` block is content — it should be a fenced code block in Sanity. |

### Layer 1 — Pacing

Your scale has ratios of 1.50 / 1.25 / 1.28 / 1.33. Proposed: **a single 1.25 anchored on a 19px
body**, which lands h1 exactly where it already is.

| Step | Now | Proposed |
| --- | --- | --- |
| body | 15px | **19px** |
| h4 | 20px | **24px** |
| h3 | 25.6px | **30px** |
| h2 | 32px | **38px** |
| h1 | 48px | 48px |

19px is already `FONT_SIZES[2]`, labelled **L**. So this is `DEFAULT_SETTINGS.fontSize: 1 → 2` plus
the D1 fix — two lines, no new values. Worth knowing: **fixing D1 alone gets you to 17px, which is
exact Linear parity, for free.** Going to 19px is a deliberate additional step, defensible because
dark grounds carry slightly larger type well.

| Property | Now | Proposed | Rationale |
| --- | --- | --- | --- |
| line-height | 1.85 | **1.70** | Linear 1.60, Craig 1.50, Maggie 2.00. 1.85 at 19px is 35px — loose enough to break the block. |
| standard width | 36rem / 576px | **40rem / 640px** | ~70 CPL at 19px. Linear is 624px. |
| narrow / wide | 32 / 44rem | **34 / 46rem** | ~60 and ~80 CPL |
| paragraph gap | 1.6em | **1.5em** | Craig 30px@20px, Maggie 33px@22px — both 1.5em |
| `hyphens` | none | **`auto`** on `[data-article] p` | Cheapest single change that makes prose look set rather than flowed |

**Space** — the actual pacing lever:

| Element | Now | Proposed |
| --- | --- | --- |
| h2 margin-top | 4rem | **5rem** |
| h2 margin-bottom | 1.25rem + `pb-4` + **rule** | **1.25rem, rule removed** |
| h3 / h4 margin-top | 2.5 / 2rem | **3 / 2.25rem** |
| blockquote | 2.5rem, `stone-400`, left border | **3.5rem, `stone-200`, 1.15em, no border** — a pull quote should not be dimmer than the body |
| figure margin | 2rem | **4rem** — Ciechanowski's device |
| section break | **unused** | **5rem above / 4.5rem below**, 96px centred rule at `rgba(255,255,255,0.18)` |

**`SectionBreak.tsx` already exists** and is wired into `CustomPortableText.tsx:243` as the
`sectionBreak` Portable Text type. No post uses it. **This is the highest-value action in the whole
report and it costs nothing in code** — adding two or three breaks to an existing post in Studio is
the clearest pacing device in the entire reference set.

### Layer 2 — Continuity

Held to your definition: removing jolts. That reading is subtractive and cheap. The expensive
reading — shared-element transitions — is not supported by any reference site here and I'm not
selling it to you.

| Jolt | Fix | Cost |
| --- | --- | --- |
| Text reflows smaller on every article load | The D1 fix | free |
| Theme flash on load | Blocking inline script in `<head>` reading the same `sp_*` keys before first paint | ~20 lines |
| Reader menu appears from nowhere | `transform-origin: top right`, scale 0.96→1 + opacity, 180ms `ease-out-expo`; translate-up on mobile | ~10 lines CSS |
| Reader menu clipped mid-glyph at its bottom edge | `mask-image` fade | 2 lines |
| No backdrop on the mobile sheet | `bg-black/40` scrim, 150ms | 3 lines |
| TOC minute labels visible beside the open panel | Widen panel or dim the TOC while open | small |
| Route change is a blanket fade | Scope `animate-page-enter` to the article body so persistent chrome doesn't re-fade | small |

**TOC persistence is not worth doing** — its contents are per-article, so hoisting it into a layout
would re-render it anyway. Gain is nil.

**Is `lib/motion.ts` the right foundation?** Partly. **Keep** `EASE` and `DURATION` — they're
already mirrored in `tailwind.config.ts` and every value above should reference them. **Do not**
build this layer on the framer-motion variants (`fadeUp`, `staggerChildren`): every item in that
table is a CSS transition, and pulling framer-motion onto the article route would add JavaScript to
solve a stylesheet problem. Its importers in the blog are learning-block components that don't
render for any published post, so it is already close to dead weight on this route. If you later
want card→article continuity, the right tool is the **View Transitions API** (CSS-only, supported in
Next 16), not framer-motion layout IDs.

### Layer 3 — Atmosphere (subtractive)

**Remove, in order:**

1. **D7** — stop auto-focusing search. Fixes the hierarchy problem at its source and restores the
   skip link.
2. **The rule under every h2.** One line. No reference site rules its headings.
3. **The featured card's three stacked badges.** Keep one.
4. **The sub-12px system.** 339 instances; 12px floor. The stats column setting numbers at 10px
   mono is illegibility used as texture.
5. **"0 series."** Hide the row at zero rather than advertising it.
6. **The double taxonomy treatment** — uppercase mono on the index, sentence-case pills on the
   article, for identical values. Pick the pill.
7. **The 28 glyph arrows** (`→`, `✕`, `↑`) alongside the mandated lucide set.
8. **Chrome in the reading column.** Linear, Craig Mod, Steph Ango and Ciechanowski have none.
   Maggie has one collapsed marginal control. You have three persistent fixtures.

**Add nothing.** I had proposed warming the near-black; with the Linear finding that's unnecessary —
`#0a0a0a` at 13.29:1 is already correct. Leave `BlogBackground`'s two radial gradients alone.

### Sequencing

| # | Block | Est. | Supported as-is? |
| --- | --- | --- | --- |
| 1 | **Type and rhythm** — D1, default → L, the 1.25 scale, 40rem, LH 1.70, 1.5em, `hyphens: auto` | **½ session** | Yes, values only |
| 2 | **Subtraction** — D7, D8, h2 rule, badges, 12px floor, "0 series", taxonomy, glyphs | **1 session** | Yes |
| 3 | **Space and blocks** — heading margins, blockquote, figures, code (D9) | **½ session** | Yes |
| 4 | **Continuity** — theme-flash script, menu origin + mask + scrim, scoped route enter | **1 session** | Yes |
| 5 | **Header and lead-in** — D4, mobile chrome, TOC → collapsed marginal control | **1 session** | TOC collapse is a component rewrite |
| 6 | **D5 theme scope** | **½–1 session** | Yes, but touches every themed selector |
| 7 | **Primitives** — extract `FOCUS`, `Button`, `Label` | **1–2 sessions** | Yes; collapses 3 inventory rows |
| — | **Studio / content** — D2, section breaks into both posts, replace the stock featured image and the markdown-screenshot hero, `--` → em dash | **1 sitting** | n/a |

**One session:** blocks 1 + 3 together, or block 2 alone.
**Five sessions:** blocks 1–6.
**Needs restructuring:** the TOC collapse (block 5), the theme re-scope (block 6), and — not
recommended yet — View Transitions.

**Do block 1 first and stop.** Half a session, entirely values, and it fixes the font-size bug, the
hydration jolt, the measure, the line height and the type scale in one pass. Everything downstream
is calibrated against how 19px at 1.70 on `#0a0a0a` actually feels, and I can't tell you that from
a screenshot.

---

## Where your direction is wrong

**1. It mostly isn't.** Pacing-as-typography-and-space is correct and the research supports it
unambiguously. Continuity-as-jolt-removal is the right definition and it's cheap. Subtractive
atmosphere is right. I have no argument with the substance.

**2. Continuity probably belongs third, not second.** By your own definition the whole continuity
table costs under a session, while the atmosphere layer contains D7 — currently the most visually
damaging single thing on the site, and an accessibility defect as well. Reorder to
pacing → subtraction → continuity.

**3. "Highly convenient" and "takes its time" are in tension, and convenience has been winning.**
Not one reference site has a reader menu. One of ten has a TOC, collapsed. You have both plus a
progress bar, and the article page defines 20 top-level sections of which **12 render for no
published post**. The reader menu is genuinely good work — the mobile sheet and the high-contrast
mode are the best-built things in the section — but every control is furniture in the reading room.

---

## Corrections to my own prior claims

Six of my findings this week turned out to be artifacts of my measuring commands rather than the
code. Recorded here because the pattern matters more than any individual item:

| Claim | Reality |
| --- | --- |
| "165 min read" | grep matched `165.` in shared JS on every page |
| Reader menu 20/22 controls blocked | 22/22 functional; `elementFromPoint` returns an ancestor `div` |
| "Also open" heading empty | Three bullets existed; my `sed` range stopped at the first blank line |
| Three disagreeing post counts | Two correct counts meaning different things |
| Lexend loaded on the article page | Measured `unloaded` |
| `prefers-reduced-motion` only sets `scroll-behavior` | `index.css:54` has the complete block; my `sed` truncated the media query at its first `}` |
| Eight of eight reference sites are light | Sampling error; Linear is dark and is the closest analogue |

**The standing rule, now in the section log:** when a measurement contradicts observed behaviour,
suspect the measurement first. I'd extend it here — my grep and sed one-liners have a systematic
failure mode around multi-line constructs, and my aesthetic generalisations are less reliable than
my instrument readings.
