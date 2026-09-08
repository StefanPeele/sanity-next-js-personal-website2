# Comparative research — reading experience and interface craft (2026-09-08)

> **Status — updated 2026-09-08.** The `stefanpeele.com` row below is the *before* state. As of
> `83a4b72` and `5c7cca4` the article is **19px / line-height 1.70 / 576px / 65 characters**, which
> moves it from the bottom of this table into the middle of it. The Linear comparison that follows
> is what motivated that change and still stands.

Sixteen sites visited, thirteen measured on an identical probe (largest paragraph on the page,
computed style, canvas-derived characters-per-line). Screenshots are in the scratchpad, not the
repo. Where a site is discussed without measurements, the probe's URL was wrong — **every site
below is live**; none were down.

---

## The measurements

| Site | Body | LH | Column | ~CPL | Ground | Face | Chrome in reading column |
| --- | --- | --- | --- | --- | --- | --- | --- |
| maggieappleton.com | 22px | **2.00** | 792 | 84 | `#f6f5f1` | Canela Text | collapsed TOC in margin |
| craigmod.com | 20px | 1.50 | 746 | 89 | `#ffffff` | Meta Serif | none |
| gwern.net | 20px | 1.60 | 895 | 103 | white | Source Serif 4 | sidenotes |
| ciechanow.ski | 19.2px | 1.60 | 704 | 84 | `#f8f8f8` | IBM Plex Sans | none |
| stephango.com | 18.6px | 1.50 | 688 | 84 | `#fffcf0` | system sans | none |
| joshwcomeau.com | 18px | 1.50 | 686 | 83 | light | Wotfard | none |
| **linear.app/blog** | **17px** | **1.60** | **624** | **78** | **`#08090a`** | Inter Variable | **none** |
| notes.andymatuschak.org | 17px | 1.41 | 561 | 79 | `#fafafc` | system sans | stacked panes |
| docs.stripe.com | 16px | 1.63 | 486 | 66 | light | system sans | persistent nav + TOC |
| **stefanpeele.com** *(before)* | **15px** | **1.85** | **576** | **80** | **`#0a0a0a`** | Inter | **TOC + reader menu + progress bar** |
| **stefanpeele.com** *(now, `5c7cca4`)* | **19px** | **1.70** | **576** | **65** | **`#0a0a0a`** | Inter | TOC + reader menu + progress bar |

---

## I have to withdraw my main finding from last session

Last session I reported "eight of eight reference sites are light" and recommended you consider a
light reading theme for `/blog/[slug]`. **That was a sampling error and the recommendation was
wrong.**

I sampled longform *publications* and personal essayists, a category that skews light for
historical reasons. I did not sample dark sites known for interface craft — which is the category
this site actually belongs to. When I did, the counter-example was immediate:

**linear.app/blog is `rgb(8, 9, 10)`.** That is within two points of your `#0a0a0a`. It is one of
the most craft-respected interfaces on the web, it publishes long design essays on it, and it works.

Then I measured contrast on both, expecting to find that Linear compensates with brighter text:

```
linear        fg=rgb(208, 214, 224)  bg=rgb(8, 9, 10)   17px   contrast 13.64:1
stefanpeele   fg=rgb(214, 211, 209)  bg=rgb(10, 10, 10) 15px   contrast 13.29:1
```

Your article body is already **stone-200 at 13.29:1** — statistically identical to Linear's
13.64:1. I had assumed it was stone-400; that was wrong too (stone-400 is your *meta* colour, not
your body colour).

So the entire "dark is the obstacle" thesis collapses. Measured against the closest real analogue,
the differences are:

| | Linear | You | Gap |
| --- | --- | --- | --- |
| Body size | 17px | 15px → **19px** | closed, `83a4b72` |
| Line height | 1.60 | 1.85 | yours looser |
| Column | 624px | 576px | 48px |
| CPL | 78 | 80 | negligible |
| Contrast | 13.64:1 | 13.29:1 | negligible |
| Chrome in the reading column | **none** | TOC + reader menu + progress bar | **everything** |

**Keep the dark palette.** It is not the ceiling. The gap is two pixels of type and a room full of
furniture. That is a much cheaper problem than the one I described last session, and I'd rather
correct it now than have you spend a session building a light theme you don't need.

This is my second reversal on this point in two sessions. Treat my aesthetic generalisations with
more suspicion than my measurements.

---

## Site by site

### craigmod.com — the pacing model
20px serif, `hyphens: auto`, italic-not-bold for emphasis, and a short centred rule with ~70px of
air on each side as a section break. Inline code sits in the line as small mono with **no background
box** — directly the fix for your ragged-code defect (D9). No sidebar, no TOC, no progress bar.
**Copyable:** essentially all of it. It is type and space.

### stephango.com — the closest genre match
A technical writer documenting a system on a warm `#fffcf0`. The lesson worth most: **his h2 is
21.5px against 18.6px body — a ratio of 1.15.** Hierarchy comes from space above and weight, not
size. Yours jumps 1.50. Code blocks are 1px border, faint fill, generous padding, no syntax colour.
**Copyable:** all of it.

### maggieappleton.com — best pacing devices, least copyable assets
22px at line-height **2.00**, the most generous in the set, and most of why it reads unhurried. Her
section break is a short coral rule, ~160px wide, ~100px above and ~90px below. Her table of
contents is **collapsed into a small marginal control** — present, silent, out of the way. That is
the answer to your TOC problem.
**Copyable:** the rhythm and the TOC pattern. **Not copyable:** the hand-drawn illustrations, and
you shouldn't fake them.

### linear.app/blog — the proof that dark works
Discussed above. What it does that you don't: **nothing in the reading column.** Figures sit in a
faintly lighter rounded panel with generous margin. The column is centred on the viewport rather
than offset by a reserved sidebar, so there is no dead space.
**Copyable:** all of it, and it's the most relevant model you have.

### ciechanow.ski — right spirit, wrong model
The gold standard for "digesting genuinely important information," but its power is bespoke WebGL
diagrams. Strip those and the typography is unremarkable. What transfers: pacing comes from
**space around figures** (130px+), and there is no chrome in the reading column.

### gwern.net — I'd steer you away
Genuinely authored, but full justification at 103 CPL with indented first lines and no paragraph
gaps produces a wall. It serves a reference document, not a read. His empty sidenote column also
leaves the same unbalanced void your 1440 layout has on the right.
**Take:** the *idea* of marginal apparatus. **Leave:** this execution.

### joshwcomeau.com — good, but a different thesis
18px, 1.50, 686px. Superb interactive explanations, but it is *playful* — springy, colourful,
demonstrative. It optimises for delight, you asked for considered. Worth studying for how it
handles inline interactive widgets inside prose without breaking the reading rhythm.

### docs.stripe.com — the documentation counter-example
16px at 486px / 66 CPL with **persistent nav and TOC**. Proof that reading furniture is legitimate
— when the job is reference lookup, not reading. This is the model your article page is
accidentally following, and it's the wrong job.

### notes.andymatuschak.org — one idea, one rejection
Stacked panes are the most literal implementation of continuity on the web: following a link slides
a new column in beside the old one; nothing is ever replaced. But it's a research interface, it's
disorienting on first contact, and at 17px/1.41 the typography is the weakest here.
**Note the pattern for `/garden` some day. Not the blog.**

### rauno.me — wrong for this brief, and it was my suggestion
I named it as the "cinematic" reference two sessions ago. Against the direction you've now set,
`/craft` is a dense masonry grid of interaction demos in bright yellow — restless and
demonstrative, a craft portfolio, the opposite of taking its time. Its individual interaction
mechanics are worth learning from; its feel is not what you want.

### increment.com — you named it; it's live but archived in spirit
Still up, no longer publishing. Its lasting contribution is the two-column essay layout with
marginal figures and a very restrained palette. Worth reading for structure, not for currency.

---

## Features sites of this class have that you lack

Ordered by how much they'd serve your stated direction.

| Feature | Who does it | Serves pacing? | Cost here |
| --- | --- | --- | --- |
| **Section breaks used in the writing** | Craig Mod, Maggie | **Yes — most** | **Zero.** `SectionBreak.tsx` already exists and is wired into `CustomPortableText.tsx:243` as the `sectionBreak` block type. No post uses it. This is a Studio action. |
| **Hyphenation + justified-ish prose** | Craig Mod, Gwern | Yes | One CSS line (`hyphens: auto`) |
| **Marginal / collapsed TOC** | Maggie | Yes — removes furniture | Component rewrite, ~1 session |
| **Sidenotes in the margin** | Gwern, Increment | Yes | You have `SideNote.tsx`; it renders inline, not marginal. Medium. |
| **Figures with real breathing room** | Ciechanowski, Linear | Yes | CSS only |
| **Pull quotes set brighter than body** | most | Yes | CSS only — yours is currently *dimmer* than body |
| **Reading time that matches its own TOC** | all | neutral | Bug fix |
| **Zero chrome in the reading column** | Craig, Steph, Linear, Ciechanowski | **Yes** | Deletion |
| Interactive inline widgets | Josh Comeau, Ciechanowski | No | High, bespoke |
| Stacked-pane navigation | Andy Matuschak | No | High |
| Custom illustration per essay | Maggie | No | Not buildable in code |

**What you have that they mostly don't:** knowledge graph, Anki deck export, offline caching,
full-text search with grouped results, dyslexia and high-contrast reading modes, JSON Feed + RSS,
glossary hover cards, and a Studio-editable copy layer. Your accessibility work is better than most
commercial sites.

The uncomfortable pairing: you have more *features* than any site in this table and less *reading
experience* than all of them. Every site above achieves the feeling you described by having less.
