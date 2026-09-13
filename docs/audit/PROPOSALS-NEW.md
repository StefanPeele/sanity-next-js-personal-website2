# Two proposals, written before building, as asked

Both were decided in principle and both said "propose the shape first". Neither is built.

---

# 1. `/blog/featured` — a browsable archive of what I have highlighted

**The decision that has to come first, and it is not about the route.**

`isFeatured` is a boolean today, and the schema says "only one post should be featured at a
time". The index takes the newest post carrying it and makes that the hero. So right now
"every post I have flagged" means "the post that is flagged", and the moment you feature
something else, the previous one leaves the archive as if it had never been there.

A curated highlight with history needs to record **when**, not just **whether**.

## Three shapes

| | What it is | History | Cost |
| --- | --- | --- | --- |
| **A** | Keep the boolean. `/blog/featured` lists everything with `isFeatured == true` | **None.** Unflagging erases it. With "one at a time", the archive has one entry | Nothing to build but the page |
| **B** | Add `featuredAt` (datetime) and `featuredNote` (text). Newest `featuredAt` is the hero | **Real.** Featuring something new does not erase what came before | One field pair, one migration line |
| **C** | A `featureRun` document: post reference, start, end, reason | Full, including how long each ran | A second document type to maintain for a personal blog |

## Recommendation: B

A is not an archive, it is a filter that happens to have one row in it. C is the right answer
for a publication with an editor and a rota, and this is not that yet.

B is one field pair and it makes the archive true:

```
featuredAt    datetime   when you featured it. Its presence IS "featured".
featuredNote  text       one or two sentences: why this one, now.
```

`featuredAt` replaces `isFeatured` the same way `sentAt` replaced a status enum on the
digest, and for the same reason: one field cannot disagree with itself.

**`featuredNote` is the part that makes the page worth visiting.** A list of posts you
already have an index for is not a reason to build a route. A list of posts each carrying a
line about why it mattered at the time is a record of editorial judgement, and it is the
single cheapest thing on this site that would make it read as a publication with a beat
rather than a blog with a flag.

**The trade B does not cover, stated plainly:** a post featured twice keeps only the later
date. That is C's problem to solve, and it is not worth a document type until it happens.

## The route

```
/blog/featured
  h1            Featured
  lede          Why these, and when. One or two sentences from the Studio.
  <list>        newest featuredAt first
                  date      14px mono, the meta floor
                  title     24px w600, the card treatment from 2.6
                  note      the why, in prose
```

No cards, no cover images, no filters. The note is the content here and an image grid would
bury it. `/blog` gets "All featured →" beside the FEATURED section label, using the same
quiet-link treatment as the series rail.

**Migration:** the one post currently flagged gets `featuredAt` set to its `publishedAt`.
`isFeatured` stays in the schema for one release, reading as deprecated, then goes.

---

# 2. The first-visit tour

## The trigger is the part most tours get wrong

Showing a tour the second someone arrives asks them to learn the furniture of a room they
have not decided to sit in. It also lands before the thing it describes is on screen.

**Show it on the first ARTICLE view, once the reader has committed.** Whichever comes first:
they have scrolled past 25% of the article, or they have been on the page 20 seconds. Never
on the index, never on a route with no toolbar, and never twice.

## Shape: a quiet bar first, the tour only if they say yes

| | Option | Why not |
| --- | --- | --- |
| A | A modal tour that opens by itself | It interrupts reading to explain reading. The most disliked pattern on the web, and it fails "declining must be as easy as accepting" the moment it steals focus |
| B | A dismissible bar offering the tour, which runs only on yes | — |
| C | Coach marks on every element at once | Five simultaneous callouts over an article is noise, and there is nowhere to look first |

**Recommendation: B, then coach marks.** One line at the bottom of the viewport, two buttons
of equal weight. If they accept, the tour highlights each element in turn. If they decline,
it never appears again and nothing else is shown.

```
┌──────────────────────────────────────────────────────────────┐
│  This page has a few reading tools most sites do not.        │
│  Want a quick look?            [ No thanks ]  [ Show me ]    │
└──────────────────────────────────────────────────────────────┘
```

Both buttons dismiss permanently. **"No thanks" is not "ask me later"**, and the bar has no
close X, because an X that means something different from the decline button is how a reader
ends up seeing it twice.

## The five steps, in the order a reader meets them

1. **The reading toolbar.** "Text size, width, spacing and theme all live here, and whatever you pick is remembered for next time."
2. **The Contents column.** "Every section, with how long each one takes. It tracks where you are as you read."
3. **Status marks.** "A mark on a post says whether it has been peer reviewed, fact checked, or is still open to comment. It is a claim about the writing, not decoration."
4. **Sidenotes.** "A dotted underline has a note attached in the margin. Definitions come from the glossary, the rest are mine."
5. **Corrections.** "When something turns out to be wrong it gets marked in place, with credit to whoever caught it. Nothing is quietly edited."

Five is the ceiling. Step 5 is the one that explains the site's whole argument, so if it ever
needs to be four, cut 2.

## The requirements, and how each is met

| Requirement | How |
| --- | --- |
| Cookie-gated, shown once | A cookie records the decision. Accepting and declining write the same cookie, because both are final |
| Never twice even if the cookie is cleared mid-visit | The cookie alone cannot do this. A `sessionStorage` flag is set at the same time, and either one suppresses the bar. Clearing cookies mid-session then hits the session flag |
| Declining as easy as accepting | Two buttons, same size, same row, neither styled as the primary. No X |
| Never nags | There is no "later" state to return from. One decision, stored, done |
| Keyboard accessible | The bar is a `role="region"` with a label, reachable by Tab. The tour is a `role="dialog"` with `aria-modal` |
| Focus-trapped | Focus moves into the tour on open and is trapped until it ends. Escape ends it and counts as DONE, not as "ask again" |
| `prefers-reduced-motion` | No movement and no fades. Highlights appear instantly, and the bar has no slide-in |

**Two things I would add that were not asked for, because leaving them out would be a defect:**

- **A permanent way back in.** If a tour is worth showing once it is worth finding again, so
  the reader menu gets one entry at the bottom: "Show the reading tips". Without it the tour
  is a thing you get one chance at, which punishes the reader who declined while busy.
- **It must not run for a screen-reader user as a visual highlight sequence.** The coach
  marks describe where things are on screen, which is meaningless non-visually. The tour is
  gated behind a pointer-capable, non-reduced-motion check, and the same five sentences are
  available as plain text from the reader menu entry above.

## What I would not build

Progress dots, a step counter, a "skip tour" link separate from declining, or any second
appearance after an update. A tour that returns to announce a new feature is a newsletter
nobody subscribed to.
