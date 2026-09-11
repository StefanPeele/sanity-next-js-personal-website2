# Blog Overhaul — Master Brief

**Repo:** `C:\Users\bigfo\sanity-next-js-personal-website2`
**Target:** `stefanpeele.com/blog` and `stefanpeele.com/blog/[slug]`
**Author of this brief:** Stefan Peele
**Status:** Active program. Multi-session. Work top to bottom.

---

## 0. How to use this document

This is a **program**, not a task. It is written so you can run for long stretches
without me. Read it entirely before you touch anything.

### Operating mode

- **Work autonomously.** Where this brief says *ship*, ship it. Where it says
  *propose*, produce the proposal, commit it, and **keep going to the next item** —
  do not idle waiting for me. I will review proposals in batches.
- **Do not stop at the first obstacle.** If something blocks, log it in
  `docs/audit/OVERHAUL-PROGRESS.md`, mark it `BLOCKED` with the specific reason,
  and move to the next unblocked item. Come back to blocked items at the end of the
  session and try again with a different approach.
- **Sessions should be long.** An hour or more of continuous work is expected and
  desired. The goal is large chunks of verified progress, not frequent check-ins.
- **Use as many tokens as you need.** There is no budget constraint here. Research
  deeply. The research is what stops this looking generated.

### Before you start

Read these, in this order:

1. `docs/audit/SPECS.md`
2. `docs/audit/UI-AUDIT-2.md`
3. `docs/audit/COMPARATIVE-RESEARCH.md`
4. `docs/audit/decisions/README.md`
5. `docs/audit/SECTION-LOG.md`
6. `docs/audit/UI-INVENTORY.md`
7. `CLAUDE.md`
8. Your memory file `measurement-artifacts.md`

Several premises in this brief may already be stale — the codebase has moved fast.
**If a premise doesn't survive contact with the code, say so in the log and adapt.**
That has caught something real in nearly every session so far. Do not silently work
around a wrong premise; name it.

---

## 1. Standing rules — these apply to every phase

### Verification

- Verify per `docs/audit/SECTION-TEMPLATE.md` §6 for every shipped change.
- `npm run check` must exit 0 with **zero warnings**. Not "zero errors" — zero
  warnings. Remove orphaned code rather than suppressing it.
- Clean build (`rm -rf .next && npm run build`) before any e2e run that matters.
- Full Playwright suite including axe and CSP. **The suite reports 34 tests** as of Phase 0.1,
  which added the reading-time agreement test; it was 33 when this brief was written. If it
  reports any other number, investigate before proceeding — do not re-run until it
  agrees. A suite that silently skips tests is worse than one that fails.
- Verify **live on production** after every deploy, not just locally. Poll until the
  deploy is actually serving your commit; `/api/health` reports the live commit hash.

### Environment hazards — you have hit all of these before

- **Free port 3100 and 3000 by PID.** `pkill -f` does not work in this environment.
  Use `Get-NetTCPConnection -LocalPort <port> -State Listen` and stop by
  `OwningProcess`.
- **`playwright.config.ts` sets `reuseExistingServer`.** A stale `next start` will
  silently attach and fabricate failures on routes your change never touched. This
  has cost you two false debugging sessions. Always confirm the server you're
  testing is the one you just built.
- **Stopping a background build does not reap its children.** An orphaned worker
  held 591MB and turned a 26-second build into 17.4 minutes. Check for orphans
  before blaming the build.
- **Shell escaping eats backslashes in grep patterns.** `grep 'text-\[22px\]'` has
  returned false MISSING results twice. Use fixed-string matching (`grep -F`) or
  verify against live measurement.
- **`grep -P` is not supported here.** It returns zeros, which look like real
  findings.
- **Python regex `[^"]*` matches newlines.** This corrupted 12 files in one session.
  Use newline-excluding character classes and apply transforms line-scoped.
- **Default GROQ perspective excludes drafts.** A query returning zero and a query
  being permission-filtered look identical. Always state perspective explicitly.

### The measurement rule

**When a measurement contradicts observed behaviour, suspect the measurement first.**

You have ten logged measurement artifacts in this project. Every one of them looked
like a real finding. The pattern is consistent enough that this rule has earned its
place as a standing instruction. Specific known traps:

- `el.focus()` does not reliably match `:focus-visible` — Chromium gates it on input
  modality. Fine for an A/B where both sides share the bias; never for an absolute claim.
- Background colour from `getComputedStyle` may be semi-transparent. Composite the
  alpha against what's actually behind it before computing contrast.
- `sr-only` and `.truncate` elements will register as "clipped." Exclude them.
- Deduplicated counts and raw element counts are different metrics. Never compare
  one against the other.
- A `sed` range like `/^### Heading/,/^$/p` stops at the first blank line, which will
  make a populated section look empty.

### Commits and logging

- **One commit per coherent change.** Never batch unrelated work. If a regression
  appears later, it must be attributable to a single commit.
- Commit messages explain *why*, not just what. The existing history is a good model.
- **Screenshot before and after** at 1440 / 768 / 390 for every visual change. Commit
  them. State what moved, in pixels.
- Maintain `docs/audit/OVERHAUL-PROGRESS.md` continuously — not at the end. Update it
  as each item completes. See §12 for the required format.

### Design constraints

- **No new text below 12px anywhere.** Blog meta text has a **14px floor**.
- **Never use the word "cinematic"** to justify a decision. If a proposal needs that
  word to stand up, cut it.
- **Everything is collapsible or hideable.** This is a standing requirement, not a
  phase item. Any element that occupies persistent screen space — toolbar, TOC,
  sidenotes, progress bar, preview cards — must have a way to collapse or dismiss.
  Chrome accumulates; every new element must come with its own off switch.
- **No element may collide with another.** When two persistent elements could occupy
  the same space at any breakpoint or scroll position, one must yield. Specify which,
  and why, every time.
- Respect `prefers-reduced-motion` on every animation without exception.

---

## 2. What I'm building toward

A blog that reads as **authored by a person**, not generated.

Unhurried. Legible to anyone, including people with impaired vision. Honest about
its own certainty. Genuinely useful to someone learning the same things I am.

The blog is where my thinking goes — my perspective on the technology industry I'm
entering and trying to understand, and anything adjacent. It exists to invite
professional critique and to create learning opportunities for me and for whoever
reads it.

**Every decision in this document serves that.** When a choice is ambiguous, pick the
option that makes the page feel more considered and less templated.

### The failure mode I'm most worried about

The current site reads as "AI-generated" or "vibecoded." My diagnosis — test it, don't
assume it's right — is that **every element carries similar visual weight with similar
spacing, so nothing leads.** Real editorial design uses sharp contrast: one thing
large, one thing small, and deliberately nothing in the middle. Generated design
defaults to everything being medium.

This is the single most important aesthetic problem in this brief. It is a typography
and hierarchy problem, not a feature problem. No feature will fix it.

---

# PHASE 0 — Defects and debt

**Ship immediately. These are cheap and they undermine everything else.**

## 0.1 Reading time is broken — you found it and didn't act

The featured card on `/blog` renders **"17 min read"**. The article page for *the same
post* renders **"165 min read"**. Both captured in the same browser session with draft
mode enabled.

You previously investigated "165", measured production at 18 min, and concluded the
number was a grep artifact matching `165.` in shared JS. **The grep was an artifact.
The number is not.** Two independent computation paths disagree and the article path
is wrong.

**Required:**

1. Find every code path that computes or renders reading time. There are at least two.
2. Determine why they disagree. Likely candidates: one counts words and one counts
   characters; one runs against the Portable Text body and one against a
   pre-serialised plain string; one is Studio-authored and one is computed; draft
   perspective returns a different body shape.
3. Reconcile to **one source of truth**. Compute once, reuse everywhere.
4. **Add a Playwright test** asserting the card figure and the article figure agree
   for every published post. This must not be able to regress silently again.
5. Verify against all posts in both `published` and `drafts` perspectives.

## 0.2 The FEATURED badge

When taxonomy moved to pills, FEATURED was deliberately excluded on the reasoning that
it's "a status label, not taxonomy." The result is that `Network & Infrastructure` and
`Perspective` render as pills while `FEATURED` renders as mono-uppercase-on-white,
top-aligned in its container, in a visibly different face.

It does not look like a deliberate distinction. It looks like a different website
leaked in. The badge is also not vertically centred within its box.

This is fixed properly in Phase 2.5 by rebuilding it as a newspaper kicker. **For now,
in Phase 0, fix only the alignment defect** so it isn't sitting broken on production
while the rest of the work happens.

## 0.3 Strip `(TESTING)` from the title

The Field's title on production reads `(TESTING)The Field, The Moment, and What it
Means for Us (Networking Industry)`. Remove the prefix in Sanity. Note there is also
no space after the closing paren, so the prefix is jammed against the title.

If you cannot write to the dataset, say so explicitly and I will do it in Studio.

## 0.4 The `--` in the home lab title

`Building My Physical Home Lab -- Week 2` uses a double hyphen where an em dash
belongs. Studio fix. Flag it for me if you can't make it.

## 0.5 Log the `/graph` 8px labels

Four D3 node labels on `/graph` still render at 8px via an SVG attribute rather than a
class. Out of scope for the blog. **Log them** in `OVERHAUL-PROGRESS.md` under a
"deferred, non-blog" heading so they aren't lost.

---

# PHASE 1 — Research

**No code in this phase. Everything after depends on it.**

Write `docs/audit/EDITORIAL-RESEARCH.md`.

Go deep. This is the phase that determines whether the result looks authored or
generated, and it is the phase most likely to be rushed. **Do not shortcut it to reach
the building.** Screenshot everything worth stealing and commit the screenshots
alongside the document.

For every finding, answer two questions:
- **What specifically makes it work?** Not "it looks clean" — what are the actual
  values, ratios, and relationships?
- **Is it copyable into Next.js/Sanity, or does it depend on art direction, an
  editorial staff, or a content volume I don't have?**

## 1.1 Editorial index formats

Study how serious publications structure an index page. Include paywalled and
subscription sites — pay particular attention to how they present pieces they want you
to value enough to pay for.

**Minimum set:** WSJ, NYT, FT, The Atlantic, The Economist, The Guardian, Stratechery,
Increment, Quanta Magazine, Works in Progress, Asterisk, Aeon, The Verge, Ars Technica,
404 Media, Defector.

For each, document:
- **Hierarchy:** lead story, secondary stories, river. How many tiers? How is each tier
  visually distinguished — size, position, image treatment, whitespace?
- **Section demarcation:** how does a reader know one section ended and another began?
  Rules, headers, colour, spacing, background shifts?
- **Metadata treatment:** where do byline, date, section, and reading time sit relative
  to the headline? What size relative to body? What face?
- **Kicker conventions:** see 1.2.
- **Thin sections:** what do they do when a section has one item, or none?
- **Density:** how much content is above the fold? How much whitespace?

## 1.2 The newspaper kicker

Kickers are a specific typographic tradition with real conventions. I want FEATURED
built to that tradition rather than invented from scratch.

Document precisely:
- Size **relative to** the headline it sits above (as a ratio, not an absolute)
- Weight, case, tracking, colour
- Placement — above or below the headline, inside or outside the image
- Whether a rule accompanies it, and where
- How kickers differ between print and web at the same publications
- What distinguishes a kicker from a section label from a tag from a badge —
  these are four different things and the site currently conflates them

## 1.3 Metadata treatment

How do the best sites render byline, date, reading time, section, and status?

Specifically: **who shows reading time, who doesn't, and where do they put it?** I have
decided to move it (see 7.5) but I want that decision grounded in what others do.

Also document: relative vs absolute dates, how "updated" is shown alongside
"published", and how multiple metadata items are separated (dots, pipes, spacing,
line breaks).

## 1.4 Epistemic status in the wild

Find sites that publish their own confidence level. **Minimum set:** Gwern.net,
LessWrong, the Effective Altruism Forum, arXiv and other preprint servers, Distill.pub,
academic journals with open review, digital gardens (Maggie Appleton, Andy Matuschak,
Joel Hooks), Wikipedia's article quality ratings.

Document:
- What vocabulary they use — and specifically, does anyone distinguish *peer-reviewed*
  from *fact-checked*? I believe these are different guarantees and I want to know how
  others handle the distinction.
- How review status is displayed — badge, banner, sidebar, inline?
- How "revised" is handled. Does the original stay visible? Is there a diff? A
  changelog?
- How reviewer attribution works, including anonymous review
- Whether status affects sorting or filtering anywhere

## 1.5 Sidenotes and marginalia

**Minimum set:** Tufte CSS, Edward Tufte's printed books, McGraw-Hill and Pearson
textbook margins, Gwern's popups, Wikipedia hovercards, Andy Matuschak's sliding panes,
Stripe's docs annotations.

Document:
- Placement and column width relative to the main measure
- Trigger — always visible, hover, click?
- **What happens when the anchor scrolls out of view** — does the note stick, fade,
  scroll away?
- Mobile fallback in detail
- How they handle two sidenotes whose anchors are close together
- Numbering conventions, if any
- How they distinguish a definition from an aside from a citation

## 1.6 Reading toolbars

**Minimum set:** Instapaper, Readwise Reader, Kindle for Web, Apple Books, Medium,
Substack, Pocket, Firefox Reader View, Safari Reader.

Document:
- Exactly what controls each one offers
- Where it lives — edge, floating, docked, top bar?
- How it collapses, and what the collapsed state looks like
- Whether it hides on scroll, on idle, or on hover-elsewhere
- Mobile behaviour
- Whether any of them are context-aware (different controls in different contexts)

## 1.7 Comment systems

Not just visual — **how they're moderated, how identity works, how corrections
surface.**

**Minimum set:** Stratechery, Substack, LessWrong, Hacker News, Metafilter, Disqus,
Commento, Remark42, Giscus, Isso, Cusdis, Hyvor Talk.

Document:
- Identity model for each (see §8 for the definition)
- Threading depth and how deep nesting is handled
- Moderation posture — pre-approval vs post-hoc
- Spam handling — this is the part everyone underestimates
- How deleted comments are shown
- Whether any of them support labelled or typed comments
- **Self-hosted vs service:** true cost, maintenance burden, data ownership

## 1.8 Hover previews

**Minimum set:** Wikipedia hovercards, Gwern's popups, Notion page previews, GitHub's
issue/PR hovercards, Arc browser link previews.

Document:
- Delay before appearing, and delay before dismissing
- Size and positioning logic — how do they avoid going off-screen?
- What content goes in — title, excerpt, image, metadata?
- **Keyboard equivalent** — how does a keyboard user get the same information?
- **Touch behaviour** — there is no hover on touch; what replaces it?
- How they avoid firing on accidental pass-through

## 1.9 Correction mechanisms

This one has the least prior art and is the most original thing in the brief. Find what
exists.

Look at: newspaper corrections policies and their web implementation, Wikipedia's edit
history and talk pages, academic errata and retraction notices, Google Docs suggestion
mode, Notion comments anchored to text, Hypothes.is annotations, arXiv version history.

Document how a visible, attributed, in-place correction could work on a static-generated
Next.js site.

---

# PHASE 2 — Identity, legibility, hierarchy

**Ship this phase. It is cheap, high-impact, and everything below depends on it.**

## 2.1 Rename to Blog

The section is a **blog**. I refer to it as my blog. "Writing" is wrong.

Rename everywhere:
- Nav item
- Page `<h1>`
- Breadcrumbs
- `<title>` and all meta tags
- Open Graph and Twitter card titles
- RSS/JSON feed titles and descriptions
- Footer links
- Sitemap labels
- Studio field labels and document type titles where user-visible
- Any hardcoded string in a component

**URL stays `/blog`.** Add a `/writing` → `/blog` redirect in case anything links to it.

**Before changing anything:** grep for every user-visible occurrence of "Writing" and
report the full list. Some may be legitimate (the word appearing in prose, a Studio
field about writing style). Show me the list, mark which you'd change, then proceed —
don't wait for my approval, but make the reasoning auditable.

## 2.2 The description

Draft **three versions**. Commit all three together in the proposal. Do not show me one
at a time.

It should convey:
- This is where my thinking goes
- My perspective on the technology industry I'm entering and trying to understand
- Network engineering, infrastructure, and anything adjacent
- Learning in public — for me and for others
- An invitation to professional critique

Tone: direct, unpretentious, a person talking. **Not** "Perspective pieces, deep dives,
and field notes on network engineering, infrastructure, and the work of learning it" —
that's the current one and it reads like a generated tagline. Three nouns and a
prepositional phrase is the shape LLMs produce by default. Avoid it.

## 2.3 The critique invitation

An info affordance near the header that opens guidelines for engaging: tell me where
I'm wrong, share your perspective, what am I missing, what would you add.

- Draft the copy.
- Propose **one** treatment — inline note, tooltip on an info icon, or a small
  expandable panel — with reasoning for why that one. Render all three so I can see
  them, but commit to a recommendation.
- It must be keyboard accessible and screen-reader legible. An info icon that only
  works on hover is not acceptable.

## 2.4 Meta type scale

**Blog-scoped for now.** We'll decide what goes site-wide when the blog is settled.

Current state: meta text sits at or near the 12px floor, in `font-mono`, uppercase,
with wide tracking. It is too small to read comfortably and it reads as decoration
rather than information.

**Requirements:**

| Element | Current | Required |
|---|---|---|
| Reading time | `3 MIN` mono uppercase ~12px | `3 min read`, sans face, sentence case, **14px minimum** |
| Date | small, mono | 14px minimum, sans |
| "Read →" | small text link, arrow jammed against word | Button treatment, larger, arrow properly spaced |
| Post counts | small mono | 14px minimum |
| Kicker (FEATURED) | see 2.5 | see 2.5 |

Specific problems to fix:
- **`3 MIN` reads as a random symbol** because the tracking is wide, the case is upper,
  and there's no spacing relationship to what's around it. Move to the sans face in
  sentence case. The mono uppercase treatment is archive jargon and it's overused.
- **The arrow in `Read →` has no breathing room** from the word. It looks like a
  typo rather than an affordance.

**Before changing anything:** audit every text node on blog surfaces rendering under
14px. Report the full list with proposed replacement sizes. Then apply.

## 2.5 Hierarchy on the index

### Featured and Latest are different things

Both must be above the fold. **Featured is the single most important thing I want a
visitor to see.** Latest is simply the most recent post.

Currently `isFeatured` is a manual boolean, and it has already caused a real bug: two
posts flagged featured meant the query picked one and excluded *all* featured posts
from the grid, so a published post rendered nowhere on the site.

**Requirements:**
- Design Featured and Latest as visually distinct treatments
- Featured gets the larger overall treatment — image, type scale, spacing, position
- Guard against the multi-featured bug: either enforce single-featured in the schema,
  or make the query robust to multiple. State which you chose and why.
- Handle the case where the featured post IS the latest post — that must not render
  the same post twice

### Dividers

The rule between sections fades into the background and reads as an accident.
**Strengthen it, or replace it with space.** Render both options and commit the
screenshots. Space is often the better answer — a rule that's too faint is worse than
no rule.

### Section headers

"Featured" as a section header is currently **smaller than the post title beneath it**.
That inverts the hierarchy.

Per your 1.2 research, a kicker is *deliberately* small — but it works because it's
tracked, weighted, and positioned as a deliberate signal, not because it's shrunk. Build
it to the tradition.

### The FEATURED badge specifically

Rebuild it as a true newspaper kicker per 1.2:
- Correct size ratio to the headline it accompanies
- Correct weight, case, tracking
- **Vertically centred in its container** — it currently sits at the top
- Consistent with the typographic family of the rest of the card
- It should read as *deliberately different* from the taxonomy pills, not as an
  oversight

## 2.6 The "AI-looking" problem

**This is the most important aesthetic item in this brief.**

My diagnosis, which you should test rather than assume: every element on the cards
carries similar visual weight with similar spacing, so nothing leads. Editorial design
uses sharp contrast — one thing large, one thing small, and deliberately nothing in
between. Generated design defaults to everything being medium-sized and evenly spaced.

**Required:**
1. Measure the actual type sizes and spacing values on a post card. Chart them. Is the
   distribution clustered or spread?
2. Compare against the same measurement taken from three of your 1.1 reference sites.
3. Diagnose properly — is my theory right? If it's wrong, say so and give the real one.
4. Propose a fix with specific values.
5. Render before/after at all three breakpoints.

---

# PHASE 3 — Epistemic status

`confidenceLevel` and `reviewStatus` already exist in the Sanity schema and are unset
on every post. **Rework these fields rather than adding parallel ones.**

## 3.1 The statuses

**Multiple statuses can apply to one post simultaneously.** A piece can be
peer-reviewed AND still seeking review AND revised. Model this as independent flags,
not a single-select.

**Required statuses:**

| Status | Meaning |
|---|---|
| **Peer-reviewed** | A qualified person assessed the reasoning |
| **Fact-checked** | Claims were verified against sources |
| **Seeking review** | I want qualified eyes on this |
| **Open to comment** | I want general discussion |
| **Revised** | Materially changed since first publication |

**Peer-reviewed and fact-checked are independent flags and must never be conflated.**
They are different guarantees. A piece can be fact-checked but not peer-reviewed (the
numbers are right, nobody assessed the argument) or peer-reviewed but not fact-checked
(an expert read the reasoning, nobody chased the citations). Treating them as one thing
would undermine both.

**Propose additions** from your 1.4 research. I'm open to more. Candidates worth
considering: *working draft*, *superseded*, *speculative*, *personal experience only*.

## 3.2 Reviewer attribution

- A Studio field for reviewer name
- An anonymity option that renders a role instead: "Reviewed by a network engineer",
  "Reviewed by a professional in the field"
- Appears in the **Contents column** of the article: `Peer reviewed by: ___`
- Support multiple reviewers
- Consider whether reviewer needs a date

## 3.3 Where status appears

**The card needs recognition. The article needs explanation.** Design accordingly.

| Surface | Treatment |
|---|---|
| **Index card** | A small mark — recognisable at a glance, not a full label |
| **Article header** | Full label with the status name |
| **Contents column** | Full detail — reviewer name, revision date, what changed |
| **RSS/JSON feed** | Plain text |
| **Hover preview** | The small mark, matching the card |

The small mark on the card must be legible at 14px minimum and distinguishable without
relying on colour alone — colourblind users and greyscale printing both matter.

## 3.4 The aura

**Persistent, not hover-triggered.** A hover-only status is invisible while scanning,
which defeats the entire purpose.

- Subtle: a faint edge treatment in the status colour. **An edge glow, not a halo.**
- Hover may intensify it slightly
- Must respect `prefers-reduced-motion` — if the aura animates at all, it must be
  static under reduced motion
- Must not reduce the contrast of any text over it
- Must degrade gracefully if multiple statuses apply — do not stack five glows

**Render three intensities** (subtle / medium / pronounced) at all three breakpoints so
I can pick. Include a version with two statuses applied simultaneously.

## 3.5 Status as filter

`Show only peer-reviewed`, `show revised`, etc. Integrates with Phase 4's directory
architecture — decide where it lives once 4 is designed.

## 3.6 Sources

A Studio field for sources per post, rendered **at the bottom of the Contents column**.

Propose the schema. Consider: title, URL, author, publication, accessed date, and an
optional annotation explaining why the source matters. More fields mean more friction
when authoring — recommend a minimum viable set and say what you left out.

Consider whether sources should link to the specific passage they support, which would
connect them to the sidenote system in Phase 6.

## 3.7 Last updated

Display alongside the published date. For a blog premised on learning in public, a
visible revision history is more honest than a silent edit.

- Only show it when the post has actually been materially revised — not on every
  trivial Studio save
- Consider whether this should be manual (I mark a revision) or automatic
  (`_updatedAt`). Automatic will fire on typo fixes. Recommend one.
- Connects to the `Revised` status in 3.1 — decide whether they're the same signal or
  two different ones

---

# PHASE 4 — Directory architecture

## 4.1 Sections, not toggle lanes

Type / Topic / Sort currently render as three rows of toggle chips. They should become
**browsable sections with their own content**, modelled on your 1.1 research.

Design a structure that works **at 3 posts and at 50 posts**, and explicitly state what
changes between those two states.

## 4.2 Placeholders

Sections I haven't populated show **placeholder cards**: dark or glassy translucent
boxes shaped like real posts. Clickable but inert — they go nowhere.

They exist for two reasons:
1. So I can see the finished shape of the page before the content exists
2. So I have visible goals and don't forget a planned section exists

**Requirements:**
- Must clearly read as "not yet written" — never as broken, never as real content
- Must not be indexed by search engines or appear in the feed
- Must be accessible: a screen reader must announce them as placeholders, not as links
- Must be trivially removable once a section fills
- Consider whether the placeholder should show the *intended* topic so it functions as
  a visible roadmap

Render at least two visual treatments — one dark/empty, one glassy/translucent.

## 4.3 Rename "Field notes"

It sounds generated. **The new name is "Lab Notes"** (alternate acceptable form:
"Notebook Notes" — pick the one that reads better in situ and say why).

Taxonomy becomes: **Perspective**, **Deep dive**, **Lab Notes**, plus anything I add in
Studio.

Rename everywhere: schema, existing documents, filter labels, RSS categories, any
hardcoded string. Migrate existing tagged posts.

## 4.4 Filters

Try sections first. **If sections genuinely subsume filtering**, remove the filter row
entirely. If they don't, fold filtering into the search bar rather than keeping a
separate row of chips.

Report which happened and why.

## 4.5 Front-page hierarchy

Lead / secondary / river, per 1.1. Propose a structure. State explicitly:
- What the reader sees above the fold at 1440, 768, and 390
- How it degrades at 3 posts
- How it scales at 50

## 4.6 Hover preview

Hovering a post for a short delay opens a small preview window.

**Requirements:**
- **Small.** It must not obstruct, startle, or make someone pull away. This is a
  convenience, not a takeover.
- Specify the delay before appearing and the delay before dismissing
- Must not fire on accidental pass-through
- Positioning logic that keeps it on-screen near edges
- **Keyboard equivalent** — a keyboard user must be able to get the same information
- **Touch behaviour** — there is no hover on touch. Specify what replaces it, or
  specify that it simply doesn't exist there and why that's acceptable.
- Contents: propose based on 1.8. Candidates — title, excerpt, status mark, reading
  time, cover image.
- Connects to 5.6: the summary should be reachable from here.
- Must be dismissible and must respect reduced motion

---

# PHASE 5 — The reading toolbar

Replaces the current reader menu entirely.

**Vertical. Glass/translucent. Persistent across both `/blog` and article pages.**

## 5.1 Context-aware

Same physical toolbar, different contents depending on where you are:

- **On `/blog`:** controls that manipulate the index — density, sort, theme, text size,
  accessibility
- **Inside an article:** controls that manipulate the article body — theme, text size,
  width, accessibility, sharing, read-aloud, summary

The transition between contexts should not feel like the toolbar disappeared and a
different one appeared.

## 5.2 Contents

- **Themes** — more than the current two. **Include a light mode.** Propose a set.
- **Text size** — finer granularity than the current four steps
- **Width** — keep, but see 7.1; the prose measure has a correct value and the control
  should not let someone destroy readability
- **Accessibility toggles** — more than the current four. Propose an expanded set
  based on Phase 10's research. Candidates: line height, letter spacing, word spacing,
  paragraph spacing, link underlining, focus ring size, animation off, colour filters.
- Copy link
- Copy as Markdown
- Print
- Share
- **Read-aloud with voice selection** — multiple voices, speed control

## 5.3 Behaviour

- **Collapses to a single control** — a circle or compact element — that expands as a
  dropdown or flyout
- **Both expanded and collapsed states must be fully functional and well-designed.**
  The collapsed state is the default on article pages.
- **Aware and retreating:** it should fade, minimise, or move out of the way when it
  would collide with content, when the user hovers something beneath it, or when the
  user is actively reading (consider idle-based hiding)
- Remembers its state across pages and sessions
- **Must be dismissible entirely** — a user who never wants it should be able to turn
  it off

## 5.4 Position

- **Outside the reading measure.** It must never overlap prose.
- At 390px there is no margin. It must either fit within available space or **force the
  layout to make room.** Propose which, with rendered options.
- Consider: right edge, left edge, floating with position memory.

## 5.5 Supersedes the chrome-reduction decision

`docs/audit/decisions/README.md` contains rendered chrome-reduction configurations. The
concern that drove them was **clutter inside the reading measure** — a TOC list, a
progress bar, and a menu button all competing with prose.

A single collapsed control in the margin is *less* chrome than what exists today. **This
toolbar satisfies the concern rather than conflicting with it.**

**Required:** mark which parts of `decisions/README.md` are now obsolete, and update the
document so a future session doesn't act on stale options.

## 5.6 Summaries

A model-generated summary, available:
- On hover over a post on the index (connects to 4.6)
- Inside an article via the toolbar

**Propose the full approach:**
- When does it generate — build time, first request, on demand?
- Is it cached? Where?
- What does it cost per generation and per month at realistic traffic?
- What happens when generation fails?
- Is it clearly labelled as machine-generated? **It must be.** A blog about epistemic
  honesty cannot present an AI summary as authored text.
- Can I override it with a hand-written summary in Studio? (I think yes — propose it.)

---

# PHASE 6 — Sidenotes

## 6.1 Authoring

**I write them in Studio, anchored to specific passages.** They expand on the text
beside them — they are never free-floating and never random.

Propose the authoring mechanism. Likely an annotation mark on Portable Text, similar to
how links work, so I can select a phrase and attach a note.

## 6.2 Glossary integration

A `glossaryTerm` document type and a `/glossary` route already exist.

**A term defined once should be able to surface wherever it appears.** Propose how
hand-authored sidenotes and glossary-derived sidenotes coexist without me doing the work
twice.

Consider:
- Automatic: any occurrence of a glossary term gets a sidenote. Risk — noise, repetition,
  false matches inside code blocks or proper nouns.
- Opt-in: I mark the occurrence I want annotated, and it pulls the definition from the
  glossary. More control, slightly more work.
- Hybrid: first occurrence per article is automatic, subsequent ones are not.

Recommend one. This decision materially affects how much work authoring becomes.

## 6.3 Placement

- The margin column, **shared with the TOC** or replacing it where they would collide
- Specify exactly what happens when a sidenote's anchor scrolls out of view — stick,
  fade, scroll away?
- Specify what happens when two sidenotes' anchors are close enough that the notes would
  overlap
- Specify what happens when a sidenote is longer than the space available

## 6.4 Mobile

At 390px there is no margin. Two options, and I want both designed:
- **Collapse/expand inline** — the note appears in the flow, collapsed, expandable at
  the anchor point
- **Footnote style** — a marker at the anchor, the note collected at the bottom

Render both. Recommend one.

## 6.5 Expansion

The margin text is the complete note. **But it can expand.**

Similar to how textbooks have an "Author's Craft" box or an expanded figure callout:
- Click to expand into a **centred, focused window**
- The window can hold more than the margin does — a longer explanation, a figure, a
  diagram
- The window carries a **"Learn more"** action that uses a model to surface further
  reading and links on the term
- Must be dismissible, keyboard-navigable, and focus-trapped while open
- Must respect reduced motion

Machine-generated "learn more" results must be **clearly labelled as machine-generated.**

---

# PHASE 7 — Article layout

## 7.1 The prose measure stays

The article body currently measures **65 characters per line at 576px** and that is
correct — it sits essentially at the 66-character typographic optimum.

**Do not widen the text column.** Widening prose hurts readability. This is
non-negotiable and it is the one place where "wider" is the wrong instinct.

## 7.2 Widen the page

Everything *around* the prose should use more of the available width. The article
currently reads as collapsed into a narrow centre strip with large empty margins.

**Widen:**
- The hero image
- The header block (kicker, title, metadata)
- Section breaks
- Figures and images within the body
- Code blocks
- Pull quotes

**Propose a layout** where prose stays at the optimal measure while everything else
breaks out of it. This is a well-established pattern — research how the sites in 1.1
handle "full-bleed inside a constrained column."

Render at all three breakpoints.

## 7.3 Hero image

**Significantly larger, up to full-bleed.** Render options:
- Larger within the current column
- Breaking out to a wider content width
- Full-bleed to the viewport edge

Include the effect on the fold — where does the first line of prose land in each option
at 1440, 768, and 390? At 390 the first paragraph currently sits at y=911 in an 844px
viewport, which is below the fold. **That should improve, not worsen.**

## 7.4 The h1 decision may be obsolete

`docs/audit/decisions/README.md` contains three rendered h1 options based on the current
narrow layout. Once the page widens per 7.2, those measurements change.

**Re-render the options against the new layout** before I choose. Note in the decisions
document that the originals are superseded.

## 7.5 Reading time moves

**Remove it from the article header.** Show it **above the Contents section** instead,
so a reader encounters it as they settle in rather than as a cost advertised before
they start.

This depends on 0.1 being fixed first. Do not move a broken number.

## 7.6 Progress bar

- **Thicker.** It's currently too thin to read as information.
- Add a **percentage** indicator
- **Persist scroll position** — a returning reader resumes where they stopped
- Propose relocations — top edge, left edge, integrated with the toolbar
- Must be collapsible/hideable per the standing rules
- Consider showing time remaining rather than, or alongside, percentage

---

# PHASE 8 — Comments

**The largest item in this brief. Do not start until Phases 0–7 are shipped and
verified.**

This phase adds infrastructure rather than refining what exists. Treat it as its own
project with its own risk profile.

## 8.1 Identity model

"Identity model" means: **how does a commenter prove who they are?**

**Decision: email-verified.**

Someone enters a comment, provides an email, clicks a verification link, and the comment
appears. No account. No password. No third-party login.

I rejected GitHub-gated commenting and I will not accept an equivalent barrier. The
friction must be near zero for a good-faith reader.

**Additionally:** a commenter provides a **name** in a field, **or selects anonymous.**
Anonymous comments still require email verification — the email is for me and for abuse
control, not for display.

Resend is already in the stack. Propose the implementation.

## 8.2 Labels

Every comment carries a label so a reader understands what it's *for*:

- **Question**
- **Correction**
- **Addition**
- **Disagreement**

Propose more from your 1.7 research. Candidates: *context*, *source*, *experience*,
*clarification*.

The label should be visually distinct and filterable.

## 8.3 Threading

**Threaded, one level deep.**

A reply nests under the comment it answers. Replies to replies do **not** nest further —
they appear at the same level within the thread, chronologically.

Rationale: threading lets a correction and my response sit together as a readable unit.
Unlimited nesting produces unreadable trees at any real volume. One level captures the
benefit without the cost.

## 8.4 Scope

Comments on **posts** and on **sidenotes**. A sidenote is often where a specific claim
lives, and that's often what someone wants to respond to.

Propose how a sidenote-scoped comment surfaces — inline at the sidenote, collected with
the post's comments, or both.

## 8.5 Moderation

**Post-hoc removal, not pre-approval.** Comments appear immediately and I remove what
needs removing.

**Deletion states must be visibly distinct:**

| Who deleted | Display |
|---|---|
| Me (the site author) | `Deleted by Author` |
| The commenter themselves | Propose wording — must be clearly different |

Propose the commenter-deleted wording. Something like "Removed by the commenter" — the
point is that a reader can tell whether I suppressed something or the person withdrew it.
Those are very different signals and conflating them would be dishonest.

## 8.6 Storage

Propose where comment data lives. Compare on:
- Cost at low and moderate volume
- Moderation tooling — can I moderate from Studio, or do I need a second interface?
- Spam handling
- Data ownership and export
- What happens at 1,000 comments, and at 50,000
- Operational burden

Options to evaluate: Sanity itself, Postgres (Neon/Supabase), a hosted service
(Commento, Remark42, Hyvor Talk), Vercel KV, SQLite via Turso.

## 8.7 Spam

**Address this explicitly and in detail.** An open comment box on a public site *will*
be found by automated spam within weeks.

Propose: rate limiting, honeypots, content heuristics, an optional CAPTCHA that doesn't
break accessibility, IP/email blocking, and what my workflow looks like when spam
arrives at volume.

Do not hand-wave this. It's the reason most personal sites abandon comments.

## 8.8 Corrections as a first-class feature

**This is the most original idea in this brief and I care about it more than the comment
box itself.**

When a comment identifies a real error, I want to correct **visibly** rather than
silently editing the text.

Model: Google Docs suggestion mode. The affected passage is marked in the text. The
correction is visible. The person who caught it is credited.

**Requirements:**
- The original text remains visible or recoverable — a correction is not a deletion
- The correction is attributed to whoever identified it
- It's marked in place, at the passage, not just noted at the bottom
- It integrates with the `Revised` status (3.1) and `Last updated` (3.7)
- A reader can see the correction history of a piece
- It must be authored by me in Studio, not applied automatically

Design this properly. If something in this brief gets cut for scope, **cut the comment
box before you cut this.** Comments exist everywhere. A blog that marks its own errors in
place, with credit to whoever found them, is genuinely unusual and it fits the stated
purpose of this site better than any other feature here.

---

# PHASE 9 — Newsletter and digests

## 9.1 Does subscription work today?

`NewsletterForm` exists and Resend is in the stack. **Determine whether subscription
works end to end right now.**

Either confirm it works with evidence, or give me exact step-by-step instructions to
confirm it myself. Do not guess.

Check: does the form submit, is the address stored, where is it stored, is there a
confirmation email, is there double opt-in, is there an unsubscribe path.

**Unsubscribe is a legal requirement, not a feature.** Verify it exists.

## 9.2 Digests

A Sanity document type that **I compose manually.** Not auto-assembled from recent posts.

Propose the schema. It should support:
- A title and intro
- Multiple entries
- Entries that are my posts
- Entries that are **external links** — something I read that's worth reading, with a
  short note on why it matters
- Entries that are neither — "recent developments", what I've been working on, a note
  about the lab

Model on Hacker News digests and similar: link, short note, why it matters.

## 9.3 Sending

**Manual.** I decide when. Propose the mechanism — a Studio action, a CLI command, or a
protected route. Recommend one.

Include a preview/test-send path so I can see it before it goes out.

## 9.4 No segmentation

Subscribers get what I send. No lists, no preferences, no categories. Keep it simple.

## 9.5 Archive

Consider whether sent digests should have a public archive page. Many newsletters do,
and it gives search engines something to index. Propose with reasoning.

---

# PHASE 10 — Accessibility audit

**Its own pass. Not a checkbox on the other phases.**

Automated axe checks catch roughly a third of real accessibility issues. The site has
passed axe throughout and still shipped 24 controls with no focus ring, ten labels in the
wrong typeface, and a search button that stole focus on first paint and bypassed the skip
link.

Write `docs/audit/A11Y-AUDIT.md`.

## Scope

- **Screen reader behaviour** on every blog surface — index, article, toolbar, sidenotes,
  comments, previews, placeholders. Test with an actual screen reader if possible, or
  simulate the accessibility tree and reason about it carefully.
- **Heading order** — no skipped levels, one h1 per page
- **Landmarks** — nav, main, aside, footer correctly applied
- **Focus order** through every new interaction, including the toolbar's expanded state,
  the sidenote expansion window, and the hover preview
- **Visible focus** on every interactive element, at every state
- **Keyboard equivalents for every hover behaviour.** The hover preview, the sidenote,
  the summary — all must be reachable without a pointer.
- **Reduced motion** across every new animation, including the aura
- **Contrast at every size** — with proper alpha compositing, not naive computed-style
  reads
- **Touch targets** — currently 44 elements under 24×24. WCAG 2.5.8 AA is 24×24; 2.5.5
  AAA is 44×44. Report both.
- **Whether the toolbar and sidenotes are usable non-visually** — this is the highest-risk
  area in the whole brief, because both are spatial features
- **Zoom to 200% and 400%** — does anything break or become unreachable?
- **Forms** — the newsletter and comment forms need labels, error messaging, and status
  announcements

**Report real findings only.** If something passes, say it passes. Do not manufacture
findings to look thorough — you have twice reported defect counts that were 95% false
positives from your own measurement code. Sample and verify before publishing any count.

---

# 11. What I'd add — consider these

Not requirements. Proposals for you to evaluate and recommend on.

1. **Reading time may be the wrong metric to foreground.** You have word count. Given
   that the goal is an unhurried reading experience, a prominent "17 min" frames reading
   as a cost. Research what the best sites do — several show nothing.

2. **A changelog per post.** If corrections and revisions are first-class, a small
   "what changed" history serves the epistemic-honesty goal directly.

3. **Print stylesheet.** The toolbar has a print action. Verify the printed output is
   actually good — margins, no chrome, sidenotes as footnotes, sources included.

4. **RSS quality.** Full content or excerpt? Does it carry status? Does it carry
   sidenotes? Many careful readers consume via RSS and never see the site's design.

5. **Reading position sync across devices.** 7.6 persists scroll position. Consider
   whether that should follow a reader across devices, and what that requires.

6. **A "start here" affordance.** A new visitor with 3 posts has an easy job. At 50 they
   won't. Consider a curated entry point.

7. **Series.** The schema supports series and none exist. Week 2 of the home lab has no
   Week 1. Consider whether series presentation is worth building before there are series
   to present. Probably not yet — but note the trigger condition.

8. **Open Graph images.** Verify each post generates a good card for social sharing.
   Consider generating them from the title and status rather than the cover image.

---

# 12. Progress log — required format

Maintain `docs/audit/OVERHAUL-PROGRESS.md` **continuously**, not at session end. Update
it as each item completes.

Required structure:

```markdown
# Blog Overhaul — Progress

Last updated: <ISO timestamp>
Current phase: <n>
Session count: <n>

## Shipped
| Item | Commit | Verified live | Notes |

## Proposed, awaiting Stefan
| Item | Where the proposal lives | What I recommend |

## Blocked
| Item | Blocked on what | What I tried | What would unblock it |

## Judgement calls made without Stefan
| Item | What I decided | Why | How to overrule |

## Premises that turned out wrong
| Premise | What was actually true | How I found out |

## Deferred / out of scope
| Item | Why | Trigger to revisit |
```

The **premises that turned out wrong** section is not optional and not self-flagellation
— it's the most useful part of the log. Nearly every session in this project has killed
at least one premise, and recording them has prevented repeat work.

---

# 13. Execution order

**Phase 0** immediately — cheap, visible defects.

**Phase 1** next, and completely. Everything after depends on it. Do not shortcut the
research to reach the building.

**Phases 2 → 10 in order.** The ordering is deliberate:
- Legibility and hierarchy first because they're cheap and affect everything below
- Epistemic status second because half of it already exists in the schema
- Directory and toolbar next because they change the page's structure
- Sidenotes after the toolbar, because they share the margin column
- Article layout after sidenotes, because sidenotes affect the layout
- Comments and newsletter last — they add infrastructure rather than refine
- Accessibility last as a comprehensive pass, though every phase must still meet the
  standing rules as it ships

**Within a phase:** where the brief says *propose*, produce the proposal, commit it, and
continue to the next item. Do not idle. Where it says *ship*, ship it.

If a phase is large, split it into multiple commits and keep working. **I would rather
review a finished phase than approve each step.**

---

# 14. A note on how we've been working

Ten measurement artifacts. Six killed premises. Two false-regression reports caught
before publishing. Several corrections you made to briefs I wrote, including this one's
predecessors.

That record is good, not bad. The sessions where you pushed back on a wrong premise — the
nested-layout fix that wouldn't have worked, the glyph count that was a grep artifact,
the light-palette recommendation you withdrew after measuring Linear, the width spec that
was calculated against a font size we'd already changed — produced better outcomes than
the sessions where you executed what was asked.

**Keep doing that.** If something in this document is wrong, say so. It will be.
