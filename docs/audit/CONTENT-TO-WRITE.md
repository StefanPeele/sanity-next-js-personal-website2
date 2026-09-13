# What to write, in order

**One ordered list, sorted by how much it turns on per unit of writing.** Measured against
the live dataset on 2026-09-13, not inferred from the schema. Work down it.

## Where the site stands right now

Three published posts. Between them they carry **title, slug, excerpt, categories, a cover
image, body text, one link, and one `featuredAt`**. Every other field on the post schema is
empty on all three:

`articleType` 0 · `reviewStatus` 0 · `tags` 0 · `series` 0 · `tldr` 0 · `summary` 0 ·
`sources` 0 · `reviewers` 0 · `corrections` 0 · `changelog` 0 · `responsesFromField` 0 ·
`conceptCards` 0 · `learningObjectives` 0 · `prerequisites` 0 · `priorKnowledgeCheck` 0 ·
`readNext*` 0 · `confidenceLevel` 0 · `maturityIndicator` 0 · `featuredNote` 0

Only two block types appear anywhere: `block` and `image`. Eleven custom blocks have never
rendered for a reader. Eight document types are at zero: `note`, `mediaItem`, `glossaryTerm`,
`series`, `tag`, `experience`, `certification`, `education`, `testimonial`.

**The site currently presents as a plain three-post blog while carrying the machinery of a
much more ambitious one.** Items 1 to 5 below close most of that gap and involve almost no
writing.

---

# The list

## 1. Set `articleType` on the three posts
**Writing: none. Six dropdowns.**

| Post | Set it to |
| --- | --- |
| The Field, The Moment… | **Perspective** |
| Building My Physical Home Lab, Week 2 | **Lab Notes** |
| The Creation of my Personal Portfolio Site | **Lab Notes** |

**Unlocks:** the lane kicker on every card, the lane colour, the **FEATURED badge on the hero**
(which renders nothing at all today because it shows the lane), the lane filter row on `/blog`,
the `?lane=` URL filter, the lane in the RSS feed, and the lane kicker on the Open Graph card.

**Best return on the list by a wide margin.** Seven surfaces, no sentences.

## 2. Set `reviewStatus` on the three posts
**Writing: none. Three multi-selects.**

Honest values for work that has not been through review: **Seeking peer review** and **Open to
comment**. That is the truthful status for a blog whose whole framing is inviting critique.

**Unlocks:** status badges on cards, the status aura, the **"Checked" facet row** on `/blog`
(which does not render at all today because no post has a status), the credibility section on
the article, the status vocabulary in the RSS feed, and step 3 of the first-visit tour, which
currently describes something a reader cannot see.

## 3. Write the `featuredNote` on "The Field, The Moment…"
**Writing: one or two sentences.**

The post is featured and the Studio is flagging it, because a featured post now requires a
note saying why. Until you write it, `/blog/featured` lists the post with no reason under it,
which is the one thing that page exists to show.

**Unlocks:** `/blog/featured` becomes a curated entry point rather than a list.

## 4. Add tags to the three posts
**Writing: none. Three or four words per post.**

Create them as you go: "OSPF", "home lab", "documentation", "careers", "GNS3", "New Jersey".

**Unlocks:** the Topic and Tag facet rows, and **the knowledge graph**, which today draws
three unconnected dots because tags are the edges between posts.

## 5. Write a `summary` for the long post
**Writing: 60 to 90 words.**

Then press **"Fingerprint this summary"** in the Studio, which records that the summary
describes the post as it now stands. Without that press the panel stays hidden by design.

**Unlocks:** the summary panel, and the whole 5.6 suppression system gets its first real
subject. Leave "Written by" on **Authored** — there is no generation, and the machine label
only appears for a machine.

---

## 6. Twenty glossary terms
**Writing: a sentence or two each. An hour, maybe two.**

**The best return in the whole list after items 1 and 2, and the only one that improves posts
you have already written.** A glossary term auto-links the first time it appears in any
article body, so twenty terms quietly enrich all three existing posts and every future one.

Obvious first twenty from your own beat: OSPF, BGP, VLAN, subnet, MTU, latency, jitter, MPLS,
SD-WAN, MSP, PoP, peering, transit, dark fibre, GNS3, packet capture, broadcast domain,
default gateway, NAT, DNS resolver.

**Unlocks:** `/glossary` stops being an empty page, glossary marks appear in every article,
the margin column gets its first real content, the graph gains another node type, and step 4
of the tour becomes true.

## 7. One deliberately full Deep dive
**Writing: one real post, but it exercises more machinery than the other three combined.**

Write it as `articleType: Deep dive` and use, in the body:

| Block | What it is for |
| --- | --- |
| `code` | **The most glaring gap on the site.** Not one line of code renders anywhere on a network engineer's blog. A config snippet, an `ip route` output |
| `wiresharkCallout` | A capture with the interesting bytes pointed at. The single most "only Stefan can write this" block you have |
| `packetAnimator` | A packet walkthrough: a handshake, a traceroute, an ARP exchange |
| `layerExplorer` | Anything touching the OSI layers. You already have `/blog/osi-model` to link to |
| `theProblemSolved` | The framing block: what problem does this protocol exist to solve |
| `sectionBreak` | Where the piece changes subject |

And in the fields: `tldr` (three bullets), `sources` (the RFC, the vendor doc), two or three
**sidenotes** (the caveat you did not want in the main line), `learningObjectives`,
`prerequisites`, `priorKnowledgeCheck` (needs more than one option or it will not render),
`conceptCards` (they also feed the Anki export), and `readNextGoDeeper` pointing at another
post.

**Unlocks:** six of the eleven custom blocks, **the entire sidenote and margin-note system**
(Phase 6, thirty passing assertions, never once rendered for a reader), the learning
scaffolding, the checkpoint, the concept cards, the Anki deck export, and the sources list in
both the article and the RSS feed.

## 8. Home Lab Week 1, and group it as a series
**Writing: one post, and it is the one your existing content most obviously implies.**

Week 2 exists and Week 1 does not. Write it, create a `series` document, and add both posts to
it with `seriesOrder` 1 and 2.

**Unlocks:** the series banner, part numbering, previous/next navigation, `/blog/series`
stops being empty, and the series rail appears on the index. All built, all waiting on one
document.

Use `failureNote` and `whatIGotWrong` in it. A home lab write-up is made of those, and both
blocks have never rendered.

## 9. Ten garden notes
**Writing: a paragraph each. Deliberately a lower bar than a post.**

The thing you learned this week that is not an essay.

**Unlocks:** `/garden`, the "recently tended" strip on the blog index, and a second node type
in the graph.

## 10. Ten library items
**Writing: one line each on why it mattered.**

**Unlocks:** `/library`, the "currently reading" strip on the index, and `/now`.

## 11. Fill in the résumé
**Writing: none that is really writing.**

`experience`, `certification` and `education` are all at zero and `skill` has one entry.
`/resume` is built for all four and currently shows almost nothing. **This is the page a
recruiter opens.**

## 12. Send the first digest
**Writing: an intro and a note per entry.**

Needs `DIGEST_SEND_SECRET` set in Vercel first. Use "Send test to me" before the real send.

**Unlocks:** `/blog/digests`, and it is the first thing that makes the newsletter form worth
filling in, because an archive shows what someone is signing up for instead of describing it.

---

# What no amount of writing can exercise

| Feature | What it actually needs |
| --- | --- |
| **Comments and reactions** | A reader. Verified end to end with probe comments and then cleaned up, but it will render an empty thread until someone writes in it |
| **The newsletter** | A real subscriber. Subscribe with your own address once: it is the only untested link in that chain |
| **Corrections** | A real error. Manufacturing one would be dishonest, and the system's whole value is that it is not |
| **Reviewer attribution** | Someone to review a post. It also exercises the anonymity contract, which has only ever been proven against a fixture |
| **A "start here" page** | Enough posts that the index stops fitting one screen. Measured today: it still fits |

---

# If you only do one evening

**Items 1 to 5 take well under an hour and involve about a hundred words of writing.** They
turn on the lane system, the status system, the facet rows, the knowledge graph, the featured
archive and the summary panel. That is most of what the site can currently do but does not
show.

Then item 6, because glossary terms are short and they improve everything already published.
