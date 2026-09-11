# Editorial research — Phase 1

Brief: `BLOG-OVERHAUL-BRIEF.md` Phase 1. Everything from Phase 2 on depends on this.

## Method, and how much to trust each number

Every figure in §1.1 and §1.2 is **measured, not remembered**. `docs/audit/measure-reference-site.mjs`
loads each index page in Chromium at 1440×900 and reports computed styles: the type sizes
actually in use ranked by page area, the headline tiers, kicker candidates with their
size/tracking/colour/gap, separator counts, and above-the-fold density. Raw JSON and a
screenshot per site are in `docs/audit/research/index-formats/`.

Our own `/blog` was measured **with the same script against production**, so the comparison
is like-for-like rather than one measured page against twelve remembered ones.

**Three of the sixteen could not be measured.** They are recorded, not dropped:

| Site | Status | Note |
| --- | --- | --- |
| Stratechery | **403** | Cloudflare interstitial ("Checking your browser"). The probe measured the interstitial, not the site |
| The Economist | **403** | Bot-blocked outright |
| WSJ | **401** | Paywall returns before any markup |

For those three, and for everything in §1.3 onward, the source is stated inline. Where I am
working from knowledge rather than measurement I say so — that distinction matters more than
the finding.

---

## 1.1 Editorial index formats

### The measured scale

Sorted by the ratio of the largest headline to the dominant body size. This is the single
number that captures "how hard does this page lead?"

| Site | Lead px | Body px | **Lead:body** | Lead:second | Distinct sizes | Links above fold |
| --- | --- | --- | --- | --- | --- | --- |
| The Verge | 90 | 16 | **5.63×** | 2.65× | 14 | 16 |
| **Ours `/blog`** | **72** | **14** | **5.14×** | **1.20×** | **10** | **9** |
| Aeon | 72 | 16 | 4.50× | 1.71× | 13 | 30 |
| Defector | 64 | 16 | 4.00× | 1.33× | 10 | 28 |
| Quanta | 45 | 13 | 3.46× | 1.13× | 13 | 15 |
| Increment | 50 | 16 | 3.13× | 1.19× | 11 | 27 |
| 404 Media | 44 | 17.6 | 2.51× | 1.25× | 7 | 20 |
| Ars Technica | 39 | 18 | 2.17× | 1.63× | 7 | 24 |
| The Atlantic | 38 | 18 | 2.11× | 1.19× | 12 | 26 |
| The Guardian | 42 | 20 | 2.10× | 1.50× | 9 | 35 |
| Asterisk | 33 | 16 | 2.06× | 1.16× | 6 | 14 |
| FT | 32 | 16 | 2.00× | 1.33× | 12 | 59 |
| NYT | 18 | 14 | 1.29× | — | 11 | 29 |

### What this kills

**"We have too many type sizes" is false.** Ours renders **10 distinct sizes**. The
reference median is 11, the range 6–14. We are mid-pack and on the low side. Size *count*
is not the problem and the Phase 2.4 / spec (d) instinct to keep shrinking it has already
gone as far as it usefully can.

**"Nothing leads" is also false, as stated.** Our lead:body is 5.14× — the second most
aggressive page in the set, behind only The Verge. We lead *harder* than Quanta, Increment,
The Atlantic and the FT.

### What the numbers actually show

**The defect is the second tier, not the first.** Our lead:second ratio is **1.20×** — 72px
page title, then a 60px story headline, and those two fight. Then the page falls off a
cliff: the measured headline tiers are **72 / 60 / 24 / 20 / 16.8 / 16**. There is nothing
between 60 and 24.

Compare the sites that read as edited:

| Site | Headline tiers measured |
| --- | --- |
| The Verge | 90 / 34 / 31 / 26 / 24 |
| Defector | 64 / 48 / 47 / 40 / 24 |
| Aeon | 72 / 42 / 32 / 20 / 18 |
| 404 Media | 44 / 35 / 26.5 |
| Quanta | 45 / 40 / 22 |
| **Ours** | **72 / 60 / — / 24 / 20 / 16.8** |

Every one of them has a populated middle. The Verge drops 90 → 34 in one step and then
grades 34/31/26/24 — one shout and a smooth river. Aeon grades 72/42/32/20. We have two
shouts and a river, and nothing in between to carry the eye from one to the other.

**The page title is the problem element.** At 72px, "Writing" is *larger than the story it
introduces*. Of the twelve reference sites, **none** renders its own section name larger
than its lead story. That is a hierarchy inversion, and it is the most defensible single
finding in this section.

### Section demarcation — measured

`<hr>` count across all thirteen measured sites: **zero. Every one.** Nobody uses a
horizontal rule element. Separation is done with bordered blocks and space:

| Camp | Sites | Bordered blocks >200px |
| --- | --- | --- |
| Rules-heavy (news density) | Verge 89, FT 51, Atlantic 50, Defector 23, Guardian 23 | many |
| **Space-only (essay/magazine)** | **Increment 0, Asterisk 2, Aeon 2, Ars 2, 404 Media 3, Quanta 4** | almost none |
| Ours | 16 | mid |

This answers Phase 2.5's open question — "strengthen the dividers, or replace with space?" —
**with evidence rather than taste.** The publications this site wants to resemble are all in
the space-only camp. Increment, the closest analogue in the set (long technical essays,
small volume, strong art direction), uses **zero** bordered blocks on its index. We use 16
and are drifting toward the news camp while aspiring to the essay camp.

**Recommendation for 2.5: replace, don't strengthen.** Grounded in 6 of 6 comparable sites.

### Density

Above-the-fold links: references run **14–59**, median ~26. Ours renders **9** — the lowest
in the set by a wide margin, and Asterisk (14) is the nearest. Some of that is honest (we
have three posts, they have hundreds) but some is layout: a 480px-min hero plus a 72px title
plus a description block consumes the fold before any second item appears.

### Thin sections

Only partially answerable by measurement, since none of these sites *has* a thin section —
that is itself the finding. What they do instead, from observation of the captures:

- **Asterisk** runs an explicit "Coming Soon" block (measured, 21.6px bold) as a first-class
  item rather than hiding the section. This is the closest prior art for Phase 4.2's
  placeholder cards, and it is the only example in the set.
- **Increment** organises by issue, so a thin section is a *complete* small issue rather than
  a sparse large one. Relevant: our lanes could be framed the same way.
- Everyone else simply has no thin sections to show.

### Copyable vs not

| Finding | Copyable into Next.js/Sanity? |
| --- | --- |
| Populated middle tier | **Yes** — pure CSS, no content needed |
| Section name smaller than lead story | **Yes** — one class |
| Space instead of rules | **Yes** |
| Above-fold density | **No, not honestly** — that is content volume, not layout. Do not fake it |
| Verge's 90px lead | Depends on art direction it has and we do not (full-bleed illustration per story) |

---

## 1.2 The newspaper kicker

### The measurement kills the brief's own framing

The brief asks for kicker size "**relative to** the headline it sits above (as a ratio, not
an absolute)". Measured across five sites that use kickers, **that is backwards. Nobody sets
a kicker as a ratio.** The kicker is a *fixed* size and the ratio is whatever falls out:

| Site | Kicker px | Headline px it sat above | Resulting ratio |
| --- | --- | --- | --- |
| 404 Media | **14.1 (constant)** | 44.1 / 26.5 | 0.32 / 0.53 |
| Defector | **12 (constant)** | 48 / 40 / 24 | 0.25 / 0.30 / 0.50 |
| Increment | **14 (constant)** | 50 / 28 | 0.28 / 0.50 |
| Ars Technica | **14 / 12** | 39.1 / 24 | 0.36 / 0.50 |
| FT | **12 / 14** | 48 / 20 | 0.25 / 0.70 |
| NYT | **10 / 11** | 22 / 18 | 0.46 / 0.61 |

The kicker size never moves within a site. **Observed band: 10–15px, clustering at 12 and
14.** The ratio range 0.25–0.70 is an artefact of the headline changing underneath it.

So the spec for our kicker is **a constant 12–14px**, not a ratio.

### Measured conventions

| Property | What the measurements show |
| --- | --- |
| **Case** | Uppercase in 5 of 6. The Guardian is the exception — sentence case, coloured |
| **Tracking** | **Mostly `normal`.** Only Increment (2.1px on 14px ≈ 0.15em), NYT (1px on 10px = 0.1em) and Defector (0.32px on 12px ≈ 0.027em) track at all. Heavy tracking is *not* the convention |
| **Weight** | 400–800, split evenly. Not a differentiator |
| **Gap to headline** | **2–23px.** Tight under big leads (Defector 2px under 48px, NYT 5px, 404 Media 9–12px), looser on cards (Defector 22px, Increment 23px) |
| **Colour** | **This is the actual differentiator.** Defector `rgb(202,48,0)`, Ars `rgb(4,204,116)`, NYT LIVE `rgb(208,2,27)`, Guardian `rgb(199,0,0)` / `rgb(0,119,182)` per section, FT `rgb(10,94,102)` |
| **Face** | **A different face from the headline, usually mono or grotesque against a serif.** 404 Media: Space Mono kicker / Space Grotesk headline. Defector: dm-mono / degular. Ars: Exo 2 / Faustina. Atlantic: Logic Monospace / AGaramondPro |
| **Rule** | No accompanying rule on any measured site |
| **Placement** | Above the headline in every case; inside the text block, not over the image |

Our `.meta-label` is mono, 12px, 0.12em, uppercase — **already within the measured band on
every axis except colour.** It is closest to NYT (10px/0.1em). The convention we are missing
is the coloured, section-meaningful kicker.

### The four things this site conflates

The brief says these are four different things and asks what distinguishes them. Measured:

| | Purpose | Form measured | Clickable |
| --- | --- | --- | --- |
| **Kicker** | Which section/theme this story belongs to | 10–15px, uppercase, **coloured**, no box, no border, above the headline, 2–23px gap | Usually yes |
| **Section label** | Navigation-level heading for a group of stories | Much larger — Aeon 42px, Defector 47px, 404 Media 35px. A heading in its own right | Sometimes |
| **Tag** | Taxonomy, many per item | Pill with a **border**, sentence case, in a row with siblings | Always |
| **Badge / flag** | **Status**, not taxonomy | Small, often a **filled box**, high-contrast — FT "Premium" white-on-fill, NYT "LIVE" 11px w800 red | Never |

**This reclassifies our FEATURED badge, and contradicts the plan in Phase 2.5.** "Featured"
is a *status*, not a section — so by the measured taxonomy it is a **badge/flag**, and its
current filled white box is the *correct* family. Rebuilding it "as a true newspaper kicker"
would be a category error: it would then read as the story's section, which it is not.

The real defect is narrower than the brief states: the flag is in the *tag row*, wearing the
geometry of a tag, sitting beside two actual tags. FT and NYT both put their status flags in
the **kicker position — above the headline, on their own line** — precisely so they are not
confused with taxonomy.

**Recommendation for 2.5, contradicting the brief:** keep "Featured" as a filled status flag,
move it out of the tag row and into the kicker slot above the headline, and introduce a
*separate*, coloured, mono kicker for the lane (Perspective / Deep dive / Lab notes) which is
what the section-kicker tradition is actually for. Stefan should overrule this if he
disagrees — it is a direct contradiction of a written instruction, flagged rather than
silently applied.

### Print vs web

Not measurable with this harness — stated from knowledge, and should be treated as weaker
than everything above. Print kickers ("eyebrows", "overlines") carry the department name and
are frequently set in the same family as the headline at a smaller optical size, often with a
rule beneath. The web versions measured above have **dropped the rule entirely** (0 of 6) and
switched to colour as the distinguishing signal, because a 1px rule at screen resolution
competes with the card borders around it. That drift — rule → colour — is the single most
useful thing to carry over.

---

## 1.3 Metadata treatment

### Reading time: who shows it

The brief asks this directly. Counted three independent ways, because the first two
disagreed and the disagreement was *my* fault, not the sites':

1. **Leaf-element `textContent`** — missed our own article, where "18 min read" sits in a
   `<span>` that has siblings, so it is not a leaf.
2. **Text-node walk** — missed our own `/blog`, where JSX renders `{minutes} min` as two
   adjacent text nodes (`"3"`, `" min"`), neither of which matches on its own.
3. **`document.body.innerText` regex** — structure-independent. This is the number below.

Methods 1 and 2 each produced a false zero on a page the other caught. Method 3 agrees
with both where they were right. **Only method 3 is safe for this question**, and it is
the same method the Phase 0.1 regression test uses, for the same reason.

| Site | `N min read` | `N min` | `N minutes` |
| --- | --- | --- | --- |
| **NYT** | **62** | 67 | 0 |
| **Aeon** | 0 | 0 | **9** |
| FT | 0 | 8 | 1 |
| The Guardian | 0 | 0 | 0 |
| The Atlantic | 0 | 0 | 0 |
| The Verge | 0 | 0 | 0 |
| Ars Technica | 0 | 0 | 0 |
| Quanta | 0 | 0 | 0 |
| Defector | 0 | 0 | 0 |
| 404 Media | 0 | 0 | 0 |
| Increment | 0 | 0 | 0 |
| Asterisk | 0 | 0 | 0 |
| Works in Progress | 0 | 0 | 0 |
| **Ours `/blog`** | 1 | 3 | 0 |

**Ten of thirteen index pages do not show reading time anywhere.** Two do. FT's eight are
ambiguous and I have not verified they are durations rather than market timestamps — treat
FT as unknown, not as a yes.

The two that do, do it very differently:

| | Size | Face | Case | Colour | Position |
| --- | --- | --- | --- | --- | --- |
| **NYT** | **10px** | nyt-franklin w500 | **uppercase**, ls 1px (0.1em) | `rgb(114,114,114)` mid-grey | **4px below** the headline |
| **Aeon** | **16px** — full body size | sansFont w400 | sentence case | `rgb(0,0,0)` **black** | 14px below a 28px headline |

NYT treats duration as chrome: tiny, grey, tracked caps, tucked under the headline. Aeon
treats it as **content**: body size, black, same weight as the prose, and it says
"6 minutes" rather than "6 min read". Those are the two coherent positions. There is no
middle convention to copy.

**This grounds Phase 7.5.** Moving reading time out of the article header is well supported
— most serious publications never show it at all, and the one that shows it most (NYT)
renders it at 10px grey, which is *below* our own 12px floor and clearly chrome rather than
information.

### Our own page contradicts itself

Found while measuring, not looked for:

| Where | Text | Size | Face | Case | Tracking |
| --- | --- | --- | --- | --- | --- |
| Featured hero | "18 min read" | 14px | Inter | sentence | normal |
| Post cards | "3 min" | 12px | IBM Plex Mono | **uppercase** | 1.44px |

**Same datum, same page, two faces, two sizes, two cases, two different wordings.** The
hero says "18 min read"; the cards say "3 min" and drop the word entirely. Phase 2.4 already
flags that "3 MIN" reads as noise — it is worse than that: there is no single treatment to
fix, there are two that disagree.

### Separators between metadata items

Counted as standalone glyph text nodes:

| Convention | Sites |
| --- | --- |
| `\|` pipe | Ars Technica (36) |
| `·` middot | 404 Media (13) |
| `/` slash | Verge (5), Aeon (4), Quanta (2) |
| `•` bullet | The Atlantic (3) |
| **None — space or line break only** | **NYT, Guardian, Defector, Increment, Asterisk, Works in Progress** |
| Ours | `•` (1) |

Six of thirteen use **no separator glyph at all**, which is the single largest group. There
is no dominant punctuation convention; the dominant convention is *not to punctuate*.

### Relative vs absolute dates

From the pattern counts on each index:

| Site | Absolute hits | Relative hits | Posture |
| --- | --- | --- | --- |
| NYT | 3 | 5 | Mixed — relative for breaking, absolute for features |
| Guardian | 2 | 6 | Mostly relative |
| The Atlantic | 6 | 3 | Mostly absolute |
| The Verge | 6 | 1 | Absolute |
| Defector | 6 | 0 | Absolute only |
| 404 Media | 6 | 0 | Absolute only |
| Quanta, Increment, Asterisk, Ars | 0 | 0 | **No date on the index at all** |
| Ours | 3 | 0 | Absolute only |

Note the fourth group: **four sites show no date on their index page whatsoever.** For a
low-volume archive where posts stay relevant, that is a live option worth considering rather
than assuming a date must appear.

### "Updated"

**Zero occurrences of "updated", "last updated", "revised" or "edited" on any of the
thirteen index pages.** Not one. Whatever Phase 3.7 does with revision dates, it will be
inventing a convention for the index rather than following one — the prior art for revision
display lives on article pages and in the wikis and preprint servers covered in §1.4, not on
publication front pages.

---

## 1.4 Epistemic status in the wild

Sources fetched directly: `gwern.net/about`, `maggieappleton.com/garden-history`,
`en.wikipedia.org/wiki/Wikipedia:Content_assessment`, `arxiv.org/abs/2502.14132`, plus a
literature search on the fact-checking / peer-review distinction. Vocabulary below is
quoted from those pages, not recalled.

### Nobody puts this on one scale

The single most important finding. Every mature system uses **multiple orthogonal axes**,
and none of them ranks "peer reviewed" as a point on a confidence scale.

| Source | Axes it keeps separate |
| --- | --- |
| **Gwern** | **confidence** (Kesselman estimative words: certain / highly likely / likely / possible / unlikely / highly unlikely / remote / impossible) · **status** (notes / draft / in progress / finished) · **importance** (0–10 decile) |
| **Digital gardens** (Appleton) | **maturity** only: seedling / budding / evergreen, with planting and tending dates |
| **Devon Zuegel** | **epistemic status** (certainty) · **epistemic effort** (research invested) |
| **Wikipedia** | **quality grade** (FA / FL / A / GA / B / C / Start / Stub / List), held separately from any claim-level flag |
| **arXiv** | **version** only. No quality claim at all |

Four distinct axes appear across these: *how sure am I* · *how finished is it* · *how much
work went in* · *who else has checked it*. They are never collapsed.

### Our schema collapses them, twice

Read from `sanity/schemas/documents/post.ts`:

```
confidenceLevel     speculative | working-theory | confident | VERIFIED | PEER-REVIEWED
maturityIndicator   fresh | TESTED | PRODUCTION-PROVEN
reviewStatus        self-reviewed | seeking-review | community-reviewed | EXPERT-VERIFIED
cognitiveLoad       (separate axis, fine)
```

Two overlaps, both real:

1. **"Peer reviewed" is the top of the confidence scale *and* the top of the review scale.**
   The same real-world event — an engineer read it and vouched — is encoded in two fields,
   in two vocabularies, and both wear the same star icon. They are radio fields, so an
   author must choose one encoding and the other silently says something else.
2. **"Verified — confirmed in lab/production"** (confidence) restates
   **"tested" / "production-proven"** (maturity). Same event, second collision.

This is a worse version of exactly the conflation the brief warns against. **Phase 3.1's
job is subtraction, not addition:** take review *out* of `confidenceLevel` and lab
verification *out* of `confidenceLevel`, leaving confidence to mean only "how sure am I",
which is what every source above does.

Proposed, for Stefan to accept or overrule:

| Field | Axis | Values |
| --- | --- | --- |
| `confidenceLevel` | how sure am I | speculative / working theory / confident — *drop verified and peer-reviewed* |
| `maturityIndicator` | how tested is it | fresh / tested / production-proven — unchanged |
| `reviewStatus` | who checked it | self-reviewed / seeking review / community reviewed / **peer reviewed** / **fact-checked** — the last two independent, see below |

Note also: every option title in these fields is prefixed with an emoji. `CLAUDE.md` says
icons are lucide, never emoji. Studio-only and not site-facing, so low priority — but it is
the same rule.

### Fact-checked vs peer-reviewed: the distinction is *level*, not *strength*

The brief believes these are different guarantees and asks how others handle it. They are,
and the cleanest formulation the research supports is not "one is stronger":

- **Fact-checking is claim-level.** The workflow is claim selection, collect evidence,
  reach a verdict, publish it. It asks *are these individual statements true?*
- **Peer review is document-level.** An expert assesses method and reasoning as a whole.
  It asks *is the argument sound?*

A piece can be fact-checked and wrong (every statement true, conclusion unsupported) or
peer-reviewed and factually sloppy. Neither implies the other. **They must be independent
booleans, never points on one scale** — which is what the brief already specifies, now with
a reason attached.

### Wikipedia's decision is the most instructive one in the set

Wikipedia runs the largest article-quality assessment system in existence, and
**deliberately does not show the grade to readers.** Grades live in WikiProject banners on
*talk* pages; the assessment is "mainly for the internal use of the WikiProject." What
readers do see are **claim-level** markers — "citation needed" — attached to the specific
sentence at issue.

That is a strong argument against badging the article heavily, and it produces the design
principle this whole phase has been circling:

> **Document-level status goes quiet. Claim-level status goes inline.**

Confidence, maturity and review status describe the *document*, so they belong in the
header and the Contents column at low volume — which is what Phase 3.3 already proposes.
Fact-checking and corrections attach to *claims*, so they belong **at the passage**, which
is Phase 8.8. The two halves of the brief are one idea seen from two ends, and the split
between them should be by level, not by importance.

### "Revised" — the measured prior art

| Source | How revision is shown |
| --- | --- |
| **arXiv** | A "Submission history" block **below the abstract**: `[v1]` plus UTC timestamp plus file size, one line per version. Every version stays permanently addressable at its own URL (`/abs/2502.14132v1`). The current version is marked in the title metadata. **No diff tool** |
| **Gwern** | A `modified` date recording only "meaningful modification" — deliberately not bumped by link fixes or formatting, so the date stays informative |
| **Wikipedia** | Full edit history plus a talk page. Diffs between any two revisions |
| **Digital gardens** | Planted and tended dates, no version list |

For a statically generated Sanity site, **arXiv's model is the copyable one** and Gwern's
rule is what makes it useful. A version list of `{ date, what changed }` in Sanity, rendered
below the header, costs one array field and no infrastructure. Storing whole prior bodies to
support diffs is where the cost explodes — and arXiv, with far more at stake, does not offer
diffs either.

**Gwern's "meaningful modification" rule matters more than the mechanism.** A revision date
that moves when a typo is fixed teaches readers to ignore it.

### Does status affect sorting or filtering anywhere?

Looked for, **not found** in any of these sources. Gwern's importance rating orders his site
index; Wikipedia sorts by grade only inside WikiProject worklists, which readers never see.
No consumer-facing site in the set filters by epistemic status. Phase 3.5 would be inventing
this, not adopting it — which is fine, but it should be built knowing there is no prior art
to lean on and no reader expectation to meet.

---

## 1.5 Sidenotes and marginalia

Measured with `docs/audit/measure-sidenotes.mjs` at 1440 and 390. Raw JSON in
`docs/audit/research/sidenotes/`.

### Geometry

| Site | Prose measure | Body | Sidenote width | **Ratio to measure** | Sidenote font | Mechanism |
| --- | --- | --- | --- | --- | --- | --- |
| **Tufte CSS** | 693px | 21px | **347px** | **0.50×** | 16.5px (0.79× body) | `float: right` |
| **Gwern** | 895px | 19px | 154–338px | 0.17–0.38× | 20px (1.05× body) | inline, plus popups |
| **Andy Matuschak** | 265px | 17px | — | — | — | **no sidenotes at all** |
| Ours (the TOC, not a sidenote) | 576px | 19px | 220px | 0.38× | 16px | `hidden lg:block` |

**Tufte's 0.50× is the cleanest number to copy**, and it comes with a matching type step:
the sidenote sits at **0.79× the body size** — smaller, but nowhere near a micro-label. Our
instinct would be to set sidenotes at 12–14px against a 19px body (0.63–0.74×); Tufte says
go higher, about 15px.

**Gwern is not a model to copy here.** 168 note elements on one page, of which only 23
render as visible margin notes — the other **145 are `visibility: hidden; position:
absolute`**, waiting to be shown as hover popups. That is a popup system with a marginal
fallback, not a marginal system.

**Matuschak is a different paradigm, not a variant.** Zero sidenotes. The sliding panes
*are* the notes: each pane runs a 265px measure and a note opens as a new pane beside the
one you were reading. Copyable only if the whole reading surface is rebuilt around panes,
which is not what Phase 6 proposes.

### The mobile fallback, measured

At 390px:

| Site | Notes total | Still visible | Hidden | Toggle controls |
| --- | --- | --- | --- | --- |
| **Tufte CSS** | 10 | **3** (6–7px wide, `inline-block`) | **7** (`display: none`) | **14** |
| **Gwern** | 168 | 23 | 145 (`visibility: hidden`, absolute) | 3 |

The three "visible" Tufte elements at 6–7px wide are the **markers**, not the notes. Tufte
CSS's mobile fallback is the **pure-CSS checkbox hack**: the note is `display: none`, the
marker is a `<label>` bound to a hidden checkbox, and `:checked` reveals it inline. Fourteen
toggle controls for ten notes confirms it. **No JavaScript.**

This is the most copyable finding in §1.5. It answers Phase 6.4's "collapse/expand inline,
or footnote-style at the bottom" with a working, JS-free implementation that degrades to a
plain checkbox for keyboard and screen-reader users.

Gwern's counts are **identical at both widths** (23 shown / 145 hidden); its margin notes
merely narrow (154→136px) and its font steps down (20→18px). It does not have a mobile
fallback so much as a layout that survives narrowing.

### What happens when the anchor scrolls out of view

The brief asks this specifically. **None of the three solves it, because none of them has
to:**

- **Tufte** floats the note next to its anchor, so it scrolls away with the anchor. No
  sticky behaviour, no fade.
- **Gwern** hides the note by default and summons it at the cursor, so the anchor is
  necessarily on screen when the note appears.
- **Matuschak** puts the note in its own pane, which stays until dismissed.

**There is no prior art for a sticky sidenote in this set.** Phase 6.3 asks what should
happen; the honest answer is that the successful implementations avoid the problem rather
than solving it. Inventing sticky behaviour would be novel, and novel here reads as clever
rather than edited.

### Two anchors close together

Tufte's `float: right` resolves this automatically — consecutive floated notes stack down
the margin in document order and never overlap. That is the entire benefit of float over
absolute positioning, and it is why Tufte CSS still uses a technique CSS has largely moved
past. **An absolutely-positioned implementation has to solve collision manually; the floated
one gets it free.**

### Numbering, and the three kinds of marginal note

Tufte CSS renders 3 `sup` markers against 10 notes, because it distinguishes:

- **Sidenote** — numbered, tied to a specific point; the margin equivalent of a footnote
- **Margin note** — *unnumbered*, an aside that simply sits beside the text
- **Citation** — numbered, references a source

Gwern's page carries **210 superscript markers** against 168 note elements — overwhelmingly
citation-driven.

**Phase 6 should decide which of the three it is building.** The brief describes authored
notes "anchored to specific passages" that "expand on the text beside them" — that is
Tufte's *sidenote*, numbered. The glossary integration in 6.2 is a fourth thing: a
definition is not an aside, and conflating them produces a margin full of vocabulary where
the reader expects commentary.

### Found while measuring: our prose measure is 56 characters, not 65

Real character count divided by real line count, median over 25 paragraphs per page, one
method across all sites:

| Site | Median CPL | Range | Column | Font / line-height |
| --- | --- | --- | --- | --- |
| Gwern | 85 | 52–103 | 895px | 19 / 30 |
| Aeon | 85 | 40–91 | 361px | 16 / 26 |
| Tufte CSS | 77 | 60–134 | 693px | 21 / 30 |
| Quanta | 68 | 55–123 | 1085px | 14 / 26.3 |
| **Ours** | **56** | **51–61** | **576px** | **19 / 32.3** |

**Ours is the narrowest in the set and sits below the classical 60–75 optimum.** Tufte — the
canonical authority for this exact layout — runs 77.

This matters because **Phase 7.1 instructs: "the prose measure stays near the typographic
optimum — it's currently 65 characters and that is correct. Do NOT widen the text column."**
That instruction rests on a 65-character figure. Measured directly it is 56.

It also reopens a decision already made: `SECTION-LOG` records that the proposal's 40rem
width was rejected because "standard now reads 65 … and 40rem would push it to 72." If the
true figure is 56, then 40rem (640px) lands near **62** — inside the optimum rather than
past it.

**Not acting on this.** It is Phase 7 work, it contradicts an explicit written instruction,
and one method disagreeing with an earlier one is exactly the situation where I have been
wrong before. Recorded so Phase 7 starts from a measured number, and so the earlier
rejection can be re-examined with its premise corrected.

---

## 1.6 Reading toolbars

Two were measurable in a browser (Medium, ours). The rest are apps behind authentication or
browser chrome that no probe can reach, so their control sets come from vendor documentation
— **stated as documentation, not measurement.**

### Measured

| | Persistent bars at 1440 | At 390 | Controls | What the controls are |
| --- | --- | --- | --- | --- |
| **Medium** (signed out) | 1 — sticky top, 1440×57, z 500 | 1 — 390×98 | 5 | Sign up · search · Get the app · Sign up · user menu |
| **Ours** | 2 — fixed navbar 1440×61 z 999, **plus** sticky 220×87 at x=1052 holding "Reading options" | **1 — the navbar only** | 3 + 1 | Search · search · menu · Reading options |

Two things fall out of that table.

**Medium's signed-out web reader offers no reading controls whatsoever.** Every control in
its persistent bar is account or marketing. Text size, theme and width live in the native
app. Medium is therefore *not* prior art for a web reading toolbar, despite being the
obvious name to reach for.

**Our reader menu is desktop-only.** At 1440 it rides in the sticky TOC rail at x=1052. At
390 that rail is `hidden lg:block`, and the probe finds no persistent element carrying it.
Phase 5.4 asks "at 390 it must fit the margin or force the margin to accommodate it —
propose which". The measurement says the current answer is **neither: it leaves.** That is
worth knowing before designing the replacement, because the mobile case is not a
degradation of the desktop case today, it is an absence.

### Firefox Reader View — the most complete reference

From Mozilla's own support documentation:

| Control | Options |
| --- | --- |
| Text size | − / + stepper |
| **Font family** | **Serif · Sans-serif · Monospace** |
| **Font weight** | **Light · Regular · Bold** |
| Line height | adjustable |
| Content width | adjustable |
| **Theme** | **Auto · Light · Dark · Sepia · Contrast · Gray**, plus a custom theme |
| Narrate (read aloud) | **Shown only if the OS has TTS for the article's language** |
| Advanced | character spacing · word spacing · text alignment |

**Position: a toolbar on the left edge**, opened by a "Text and Layouts" button.

Three things here matter for Phase 5:

1. **The left-edge vertical toolbar is Firefox's actual solution**, which is direct support
   for the vertical glass toolbar Phase 5 describes — this is not an invention.
2. **Six themes, not two.** Phase 5.2 asks for "more than two, including a light mode";
   Firefox's Auto/Light/Dark/Sepia/Contrast/Gray is the set to borrow from, and **Auto**
   (follow the OS) is the one our current two-theme set is missing entirely.
3. **Font family is a control Phase 5.2 does not list**, and Firefox treats it as
   first-class alongside size. Given this site already loads a serif, a sans and a mono, and
   a dyslexia face, exposing family costs nothing.

And one implementation rule worth copying exactly: **Narrate only appears when the platform
can actually do it.** Our read-aloud should test `speechSynthesis.getVoices()` for a
matching language and hide the control otherwise, rather than offering a button that does
nothing.

### Not measurable, stated as knowledge

Instapaper, Readwise Reader, Kindle for Web, Apple Books, Pocket and Safari Reader all sit
behind sign-in or inside browser chrome. From use rather than measurement, the pattern they
share with Firefox: **a small persistent affordance at a screen edge that expands into a
panel, never a bar that occupies reading width.** Their control sets are subsets of the
Firefox list above, most commonly size + theme + width, with typeface less often exposed.

I have not verified these individually and they should not be quoted as measurements. The
Firefox set is the one with a citable source, and it is a superset, so it is the safe
reference.

### Context-awareness

Phase 5.1 wants one toolbar whose contents change between the index and an article.
**No prior art found in any reader examined.** Every reading toolbar in this set exists only
on a reading surface; none of them has an index-page mode, because none of these products
has an index page in the same sense. This is a genuine invention rather than an adoption,
and — like Phase 3.5 and the sticky sidenote — it should be built knowing that.
