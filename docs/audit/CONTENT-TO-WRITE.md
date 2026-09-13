# What to write to make the site show what it can do

**Measured 2026-09-13** against the live dataset, not inferred from the schema. Every "never
used" below is a GROQ count against published documents.

## The finding, in one paragraph

Three posts are published. Between them they carry **title, slug, excerpt, categories, a
cover image, body text, and one link**. Every other field on the post schema is `null` on all
three. Eleven custom body blocks, five whole document types, and the entire status,
credibility, sidenote, correction and series machinery have never rendered for a real reader —
only for `fixture-kitchen-sink`, which is a draft and invisible in production.

The site currently presents as a plain three-post blog while carrying the machinery of a much
more ambitious one. **Most of that gap closes with configuration, not writing.**

---

## Tier 1 — no writing at all. Two dropdowns per post.

This is the highest-leverage work on the site and it is about fifteen minutes in the Studio.

### Set `articleType` on each published post

The three lanes, from `lib/cms/defaults/taxonomy.ts`:

| Key | Label | For |
| --- | --- | --- |
| `perspective` | Perspective | Opinion and analysis on where the field is going |
| `concept-deep-dive` | Deep dive | One idea, explained until it clicks |
| `lab-notes` | Lab Notes | What actually happened in the lab or on the job |

My reading of the three existing posts:

- **"The Field, The Moment…"** → `perspective`. It is an argument about where networking is going.
- **"Building My Physical Home Lab — Week 2"** → `lab-notes`. It is literally what happened in the lab.
- **"The Creation of my Personal Portfolio Site"** → `lab-notes`, or `concept-deep-dive` if you want the checkpoint and the learning scaffolding to have somewhere to live (see Tier 2).

**What turns on the moment you do this:** the lane kicker on every card, the lane colour, the
lane filter row on `/blog`, the lane in the RSS feed, the lane kicker on the Open Graph card,
and the `?lane=` URL filter. All built, all tested, all currently invisible.

### Set `reviewStatus` on each published post

It is an array — a post can carry more than one. From `lib/status.ts`:

`peer-reviewed` · `fact-checked` · `seeking-review` · `open-to-comment`

Honest defaults for work that has not been through review: **`seeking-review`** and
**`open-to-comment`**. That is the truthful status for a personal blog inviting critique, and
it is the status the whole Phase 2 "invite professional critique" framing was built around.

**What turns on:** the status badges on cards, the status aura, the "Checked" facet row on
`/blog` (which currently does not render at all because no post has a status), the
credibility section on the article, and the plain-text status vocabulary in the RSS feed.

### Add `tags` to each published post

Zero `tag` documents exist. Three or four per post — "OSPF", "home lab", "career",
"documentation" — turns on the Topic/Tag facet row and gives the **knowledge graph edges to
draw**. Right now `/graph` renders three unconnected nodes.

---

## Tier 2 — one post that exercises the article machinery

Everything below lives inside a single post's body or its fields. **One deliberately
full-featured post exercises more of this site than three ordinary ones.** The natural
candidate is a Deep dive — the lane the machinery was designed for.

| What | Field / block | What content exercises it |
| --- | --- | --- |
| **Sidenotes and the whole margin column** | `sidenote` mark | **Zero sidenotes exist in production.** All of Phase 6 — the margin column, the mobile expansion window, the print fallback, sidenote-anchored comments — has only ever rendered for a fixture. Three or four asides in one long post: the caveat you did not want in the main line, the "this is why it is actually called that", the thing you had to look up |
| **Sources** | `sources[]` | Any post that cites a spec, a vendor doc or a paper. The RFC, the Cisco doc, the Julia Evans post. Also fixes the one thing `11.4` could not check: whether sources survive into RSS |
| **TL;DR** | `tldr[]` | Three bullets at the top of the long one. The 24,000-word post is the obvious place |
| **Learning objectives / prerequisites** | `learningObjectives[]`, `prerequisites[]` | "By the end you will be able to…" and "you should already know what a subnet is." Deep dives only |
| **Prior-knowledge checkpoint** | `priorKnowledgeCheck` | Needs `articleType: concept-deep-dive` **and** a question with **more than one option** — it will not render otherwise. One multiple-choice question before the deep part |
| **Concept cards** | `conceptCards[]` | Front/back pairs for the terms the post introduces. These also feed the Anki deck export |
| **Read next** | `readNextGoDeeper`, `readNextGoBroader`, `readNextApplyThis` | References to other posts. **Three posts is already enough** — point the portfolio post at the home lab post and back |
| **Changelog** | `changelog[]` | The moment you meaningfully revise any post, add a dated line. Surfaces in the Contents column |
| **Corrections** | `corrections[]` | Cannot be manufactured honestly — it needs a real error. When one arrives, this is the system that renders it in place with credit. Phase 3B, 27/27 tested, never used |
| **Responses from the field** | `responsesFromField[]` | When someone replies on LinkedIn or in a comment and it is worth keeping, this is where it goes |
| **Reviewers** | `reviewers[]` | Ask one person to read a post before publishing and credit them. This also exercises the **anonymity contract** — an anonymous reviewer's name must never enter the RSC payload — which has only ever been proven against a fixture |
| **Confidence / maturity / cognitive load** | three enums | One dropdown each. They render in the credibility section |

### The eleven body blocks that have never rendered for a reader

Only `block` and `image` appear in production. These exist, are styled, and are tested
against the kitchen-sink fixture:

| Block | What content exercises it |
| --- | --- |
| `code` | **The most glaring omission.** Not one line of code renders anywhere on a networking engineer's site. A config snippet, an `ip route` output, a Python script |
| `sectionBreak` | A long post that changes subject. The 24,000-word one |
| `failureNote` | "This is where I broke it." The home lab series is made of these |
| `whatIGotWrong` | An honest retrospective on an earlier assumption |
| `whatEngineersUse` | "In practice nobody does it that way — here is what is actually run" |
| `theProblemSolved` | The framing block for a deep dive: what problem does this protocol exist to solve |
| `conceptStressTest` | "Here is a case where the simple model breaks" |
| `knowledgeQuiz` | A few questions at the end of a deep dive |
| `layerExplorer` | Anything about the OSI/TCP-IP layers — you already have `/blog/osi-model` |
| `packetAnimator` | A packet walkthrough. Handshake, traceroute, ARP |
| `wiresharkCallout` | A capture with the interesting bytes pointed at. This is the single most "only Stefan can write this" block on the site |

---

## Tier 3 — the five empty document types

| Route | Type | Count | What fills it |
| --- | --- | --- | --- |
| `/glossary` | `glossaryTerm` | **0** | **The best return in Tier 3.** Terms are short — a sentence or two each. And glossary terms auto-link *inside every article body*, so twenty terms quietly enrich every post you have already written and every one you write later |
| `/garden` | `note` | **0** | Short, unfinished, dated notes. Lower bar than a post on purpose — the thing you learned this week that is not an essay |
| `/library` | `mediaItem` | **0** | What you are reading and watching, with a line on why. Also feeds `/now` and the graph |
| `/blog/series` | `series` | **0** | **Home lab Week 2 exists and Week 1 does not.** Writing Week 1 and grouping them turns on the series banner, part numbering, prev/next, and the series index — all built, waiting |
| `/blog` facets | `tag` | **0** | See Tier 1 |

And two on the portfolio side:

- `/resume` — 1 `skill`, and **0** `experience`, `certification`, `education`. The resume page is built for all four.
- `/services` — **0** `testimonial`.

---

## What cannot be exercised by writing

| Feature | Why |
| --- | --- |
| **Comments and reactions** | Needs a reader. Verified end to end with probe comments on production, then cleaned up. It will stay an empty thread until someone writes in it |
| **The newsletter** | Needs a real subscriber. Subscribe with your own address once — that is the only untested link in the chain |
| **Corrections** | Needs a real error. Manufacturing one would be dishonest |
| **The "start here" affordance** | Needs enough posts that the index stops fitting one screen. Measured today: it still fits |

---

## If you only do three things

1. **Tier 1 in full.** Fifteen minutes in the Studio, no writing, and it turns on more of the site than any single post could.
2. **Twenty glossary terms.** They are short, and they enrich every article body retroactively.
3. **One deliberately full Deep dive** using sidenotes, sources, code, a checkpoint and two or three of the custom blocks — so the machinery has been seen working once by a real reader, on a real page, before you rely on it.
