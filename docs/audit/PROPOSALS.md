# Proposals awaiting Stefan

Everything here is written and committed but **not applied**. The brief says: produce the
proposal, commit it, continue. Each entry says what I would do and why, so a yes is one
word and a no costs nothing.

Ordered by phase. `OVERHAUL-PROGRESS.md` indexes these alongside the research findings.

---

## 2.2 The blog description — three versions

**Current** (`blogPage.header.lede`, live):

> Perspective pieces, deep dives, and field notes on network engineering, infrastructure,
> and the work of learning it.

Two problems beyond tone. It **hardcodes the lane names**, and Phase 4.3 renames "field
notes" — so this string needs editing again the moment that lands. And it describes the
*formats* rather than saying anything about the person writing them.

The brief asks the description to carry four things: this is where the thinking goes; a
perspective on the industry being entered and trying to be understood; anything adjacent;
and an invitation to professional critique, framed as learning in public.

All three below avoid lane names on purpose.

### A — plain

> Notes on network engineering and the industry I'm about to enter: what I'm learning, what
> I've got wrong, and what I'm still working out. Written in public so it can be corrected.

*Closest to the current line and the lowest-risk change. "Written in public so it can be
corrected" does the invitation in six words and sets up Phase 3's status marks without
explaining them.*

### B — first person, invitation forward

> I'm learning network engineering and writing it down as I go — deep dives, working
> theories, and the occasional opinion about an industry I haven't joined yet. If something
> here is wrong, I'd like to know.

*The most human of the three and the most explicit invitation. "an industry I haven't joined
yet" is the honest framing of a student writing about a profession, and it disarms the
obvious objection before a reader makes it. Risk: "I'd like to know" is softer than a
professional critique invitation might want to be.*

### C — states the contract

> Where my thinking goes: network engineering, infrastructure, and an industry I'm trying to
> understand before I'm in it. Nothing here is authoritative. Every post carries how sure I
> am, and every one of them can be corrected.

*The only version that advertises the epistemic-status system Phase 3 builds. That makes the
description and the status marks one idea instead of two features. Risk: it promises
something that does not exist yet — do not ship C until Phase 3 is live.*

**My recommendation: A now, C after Phase 3.** A is true today. C becomes true once
confidence marks and corrections ship, and at that point it is the strongest of the three
because it is the only one that tells a reader what the site *does* rather than what it is
about.

`metaDescription` should stay distinct from the lede — it is search-result copy, not a
banner. For A:

> Network engineering, infrastructure, and the work of learning a field from outside it.
> Written in public and open to correction.

---

## 2.3 The critique invitation

The brief asks for an affordance near the header with opening guidelines — tell me where
I'm wrong, share your perspective, what am I missing — and asks me to choose between an
inline note, a tooltip, and a small panel, with reasoning.

### Recommendation: an inline note, directly under the lede

**Reasoning, in order of weight:**

1. **An invitation that has to be discovered is not an invitation.** A tooltip hides the
   thing behind a hover, which on touch does not exist at all (§1.8 settled that there is no
   good touch equivalent for hover). An invitation to critique is the *least* appropriate
   candidate for a hover-gated affordance.
2. **§1.1 measured that we have the room.** Ours renders **9 links above the fold** against
   a reference median of 26 — the lowest in the set. A one-line note costs about 24px of a
   fold that is currently the emptiest of thirteen measured pages.
3. **§1.4's principle says quiet, not hidden.** Document-level statements belong in the
   header at low volume. A panel is louder than a one-line invitation deserves and competes
   with the featured post immediately below it.
4. **It is copy, so it belongs in Studio** and can be turned off with an `enabled` boolean
   like every other optional section, per `CLAUDE.md`.

### Copy

> **Found something wrong?** I'd rather know. Corrections, disagreements and things I've
> missed all welcome — <stefan@…> — and anything that changes a post gets credited on it.

The second clause is the part that matters and it is the part most sites omit: it tells the
reader *what happens* to their correction. That is a promise Phase 8.8 has to keep, so this
copy and that feature ship together or not at all.

**Shorter variant** if the above is too long for the header:

> Corrections and disagreements welcome — they get credited on the post.

### Shape

- One line, `font-sans text-sm`, `text-stone-400`, directly beneath the lede, above the
  header's bottom rule.
- A mailto link on the address, using `QUIET_LINK` from `lib/ui.ts`.
- New Studio fields on `blogPage.header`: `critiqueInvite.enabled` (boolean),
  `critiqueInvite.text`, `critiqueInvite.email`.
- **No icon.** `CLAUDE.md` rules out decorative glyphs, and an icon here would make a
  sentence look like an alert.

**Not building it yet** — it is a proposal per the brief, and its second clause depends on
Phase 8.8 existing.

---

## 2.4 Meta type scale — the audit, before changing anything

The brief asks for the full list of blog-surface text nodes under 14px with proposed sizes,
**before** any change. Measured against production at 1440 across `/blog`, a full article,
and `/blog/series` — walking text nodes, recording the rendered shape of each.

**31 nodes below 14px. Every one of them is exactly 12px — nothing is below the floor.**
They fall into three shapes:

| # | Shape | Count | What it actually is |
| --- | --- | --- | --- |
| 1 | **12px Inter, sentence case, normal tracking** | **15** | Taxonomy pills ("Network & Infrastructure", "Perspective"), filter-row labels ("Type", "Topic", "Sort"), the photo-credit badge |
| 2 | **12px IBM Plex Mono, uppercase, 1.44px** (`.meta-label`) | **12** | Skip link, "Search", ⌘K, "Featured", the card reading times |
| 3 | 12px IBM Plex Mono, sentence case, normal | 4 | Newsletter fine print |

### Where the brief and the measured evidence disagree

The brief sets **"minimum 14px for all meta: dates, reading time, 'Read →', counts,
kickers."** §1.2 measured the kicker band across six publications as **10–15px, clustering
at 12 and 14** — NYT at 10–11, Defector and FT at 12, 404 Media / Increment / Ars at 14.

So **12px is inside the professional band, not below it.** A blanket 14px floor is
defensible as *the top* of that band, but it is not what the evidence requires, and it
would put our kicker larger than Defector's and NYT's.

Where the evidence is unambiguous is not size at all:

- **Shape 1 has three different jobs wearing one costume.** A taxonomy pill, a filter-row
  label, and a photo credit all render 12px Inter sentence case. §1.2 established that a
  tag, a section label and a badge are three different forms. This is the same conflation
  as the FEATURED badge, one level down.
- **Reading time still disagrees with itself** (§1.3): 14px Inter sentence case on the hero,
  12px mono uppercase on the cards, and the cards drop the word "read". That is a defect at
  any size, and fixing the size without fixing the split would leave it.

### Proposed sizes

| Element | Now | Proposed | Reason |
| --- | --- | --- | --- |
| Card reading time | 12px mono upper, "3 min" | **14px sans sentence, "3 min read"** | Matches the hero, which is already correct. §1.3: the two coherent positions are NYT-chrome or Aeon-content; ours should pick one, and sentence-case sans is the content position |
| Hero reading time | 14px sans, "18 min read" | **unchanged** | Already the target |
| Date | 14px sans | unchanged | Already ≥14 |
| Post count / "Latest" | 14px sans | unchanged | Already ≥14 |
| "Read →" | 14px sans | **keep 14px, change the arrow** — see below | Size is fine; the glyph is the defect |
| Taxonomy pills | 12px sans | **13px sans** *(or 12px kept)* | Low confidence. 12px is inside the measured band; 13px is not a Tailwind step and would reintroduce a bracketed size that `dab10fe` just removed. **Recommend leaving at 12px** and fixing the *role* confusion instead |
| Filter-row labels ("Type", "Topic", "Sort") | 12px sans | **`.meta-label` at 12px** | These are micro-labels, not content. Giving them the mono label face separates them from the pills they sit beside, which is the actual problem |
| Kicker (when 2.5 builds it) | — | **12px mono, coloured** | §1.2's measured band, and `.meta-label` already matches it on every axis except colour |
| Newsletter fine print | 12px mono | unchanged | Fine print is fine print |
| Skip link | 12px mono | unchanged | Raised from 11px in `dab10fe` |

### The "Read →" arrow

The brief says it "currently looks like a stray glyph" and asks for a button treatment. Two
observations before that becomes a button:

1. The arrow is a literal `→` appended in JSX — one of the 42 typographic arrows that
   commit `8f266cb` deliberately left, having established they are *not* emoji and so not
   covered by the icon rule. The spacing complaint is real: `{label} →` puts a normal space
   between word and glyph, so the arrow sits at text baseline with no optical adjustment.
2. **A button treatment may be wrong here.** `buttonClass()` exists and would take it, but
   §1.1 measured that the essay-camp sites use no button on an index card — the whole card
   is the target. Adding a button inside a card that is already a link creates a nested
   interactive target, which is both an accessibility problem and a duplicate.

**Recommendation: not a button.** Keep it a text affordance, give the arrow
`ml-1 inline-block transition-transform group-hover:translate-x-0.5` so it moves with the
hover the card already has, and set the gap in CSS rather than as a literal space.

### What I would change, in one sentence

**Nothing about the floor — 12px is correct and inside the professional band. Unify reading
time on 14px sans sentence case, move the filter-row labels onto `.meta-label` so they stop
impersonating taxonomy pills, and fix the arrow's spacing rather than making it a button.**

Not applied — the brief says report first, and two of these depend on 2.5's decisions about
the pills and the kicker.
