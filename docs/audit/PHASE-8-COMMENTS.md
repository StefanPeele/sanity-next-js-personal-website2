# Phase 8 — Comments. The design, before the build.

**Status: designed, and MOSTLY BUILT.** This started as the project plan and the plan
survived contact; it is kept as written so the reasoning is still readable, with the build
state marked below. §8 of the brief calls this "the largest item" and says to treat it as
its own project with its own risk profile.

| | State |
| --- | --- |
| 8.1 identity, 8.2 labels, 8.3 threading, 8.4 sidenote scope, 8.5 removal states, 8.6 storage, 8.7 spam layers 1-4 | **Built**, `2b9e08c` and `9dba7ad`. 52/52 on `docs/audit/measure-comments.mjs` |
| A commenter withdrawing their own comment (part of 8.5) | **Not built** — see the section near the end, which says why waiting is better than any of the obvious mechanisms |
| The Studio "needs attention" view and the one-click block (8.7's workflow) | **Not built.** The query exists and is bounded; the desk view is not |
| Promoting a Correction comment into a 3B correction | **Deliberately not built.** The most interesting thing here and the most likely to be designed wrong before there is one real correction to look at |
| Any of it in production | **Blocked** — Vercel deploy rate limit, see `OVERHAUL-PROGRESS.md` |

Research is §1.7 of `EDITORIAL-RESEARCH.md` and is not repeated here. Where this document
disagrees with it, it says so.

Three decisions are already made in the brief and are **not** reopened: email-verified
identity, threading one level deep, and post-hoc moderation.

---

## The short version

| Item | Decision |
| --- | --- |
| **8.1 Identity** | Email-verified, no account. Reuse the newsletter's exact double-opt-in token flow — it is already built, tested and deployed |
| **8.2 Labels** | Five, not four. The brief's four plus **praise**, for the reason §1.7 found in Conventional Comments |
| **8.3 Threading** | One level, as decided. The data model is a self-reference with a write-time guard, not a recursive query |
| **8.4 Scope** | Post-scoped and sidenote-scoped, **both surfaces, one store** — a sidenote comment appears in the margin note AND in the main list, filtered |
| **8.5 Moderation** | "Removed by Stefan" / "Withdrawn by the commenter". Reddit's distinction, plainer words, and **not** the brief's "Deleted by Author", which is ambiguous in exactly the wrong way |
| **8.6 Storage** | **Sanity.** Measured, not assumed — see the numbers below. With two mandatory conditions: per-post pagination and a denormalised count |
| **8.7 Spam** | Five layers, in the order they pay for themselves. The honeypot and the rate limiter already exist, and **the rate limiter does not work on Vercel the way the code implies** |

---

## 8.6 Storage — the measured part, first, because everything else depends on it

`docs/audit/probe-comment-scale.mjs` seeds comment documents shaped the way the real schema
would be shaped, times the four queries a comment system actually runs, then deletes them
and verifies the deletion. Run at two volumes so the scaling is a curve and not a single
point with a guess attached. All drafts; nothing was ever visible to the published site.

| | 1,000 comments | 5,000 comments | ratio |
| --- | --- | --- | --- |
| One post's thread, via CDN (167 / 833 comments on that post) | **24ms · 68KB** | **241ms · 341KB** | payload linear |
| Comment count for every post, for the index | 237ms | **635ms** | 2.7× for 5× data |
| Moderation page, newest 50 | 169ms | **172ms** | **flat** |
| Everything, unpaginated | 250ms · 431KB | 1,009ms · 2,173KB | linear |
| Seeding, 100 per request | 15.9s | 64.7s | linear |

### What those numbers actually say

**Latency is not the problem. Payload is.** A single post's thread at 833 comments is
341KB — before any of it is rendered. That is not a Sanity limit, it is arithmetic: 400
bytes of comment times the number of comments. Any store has it.

**So pagination is not an optimisation, it is part of the design.** Newest 20 roots with
their replies, "show more" beyond that. At 20 roots a thread is ~15KB, which is the right
order for something below an article.

**The index count query is the one thing that genuinely degrades.** 237ms → 635ms for 0.3KB
of output, because it is a correlated subquery per post and it re-counts the whole
collection every time. At 50,000 it is seconds. **It must be denormalised** — a
`commentCount` on the post, incremented by the same server action that accepts the comment.
That is the one piece of write-time bookkeeping this design takes on, and it is worth it.

**Moderation is flat and stays flat.** 172ms at 5,000 is the same as 169ms at 1,000, because
it is an ordered slice with a limit. Whatever the archive grows to, moderating it is a
constant-time job.

**At 50,000**, extrapolating from a measured curve rather than from nothing: the unpaginated
read is ~10s and ~21MB, which nobody should ever run; the paginated thread is unchanged,
because it is bounded by the page size; the denormalised count is O(1). **The design
survives 50,000 comments. The naive version of it does not survive 5,000.**

### Against the alternatives

| | Sanity | Postgres (Neon/Supabase) | Hosted (Hyvor, Disqus) | Self-hosted (Remark42) |
| --- | --- | --- | --- | --- |
| Money at low volume | **Already paid for** | Free tier, then ~$25/mo | $0 with ads and trackers, or ~$12/mo | A second host |
| Moderation tooling | **Studio, already built and already how this site is edited** | A second interface, written from scratch | Theirs, good | Theirs, good |
| Spam handling | Mine to build | Mine to build | **Theirs, mature** | Theirs |
| Data ownership | Total, exportable | Total | Theirs | Total |
| 1,000 / 50,000 | Measured above | Comfortable | Theirs | Comfortable |
| Operational burden | **None — no new service** | A database to keep alive | None | Upgrades, backups, SMTP, 3am |
| **Deploy fit** | **Native** | Native | Native | **Fails — Vercel has no persistent process or writable volume** |

§1.7 already reached this conclusion and the measurements do not disturb it. The decisive
arguments are the two nobody can engineer around: **Remark42 cannot run on Vercel at all**,
and **Sanity is the only option where moderation needs no second interface** — a `comment`
document type appears in the Studio the author already uses, with the desk structure, the
previews and the publish/unpublish semantics already in place.

The real cost of choosing Sanity is that **spam is mine to build**, which is what §8.7 is
for, and it is the reason this section is not a formality.

---

## 8.1 Identity — the implementation

The brief asks for a proposal. The proposal is: **this is already written, twice.**

`app/actions/subscribe.ts` plus `app/api/subscribe/confirm/route.ts` is a complete
double-opt-in round trip — zod validation, a honeypot, an IP rate limit, a random token
persisted on a Sanity document, a Resend email carrying a confirm link, and a GET handler
that looks the token up and flips a status. A comment is the same flow with a different
document type and a different email body.

```
POST (server action)                     GET /api/comments/confirm?token=…
  zod + honeypot + rateLimit               look the token up
  create comment { status: 'pending',      status: 'pending' → 'published'
                   token, email }          publishedAt = now
  Resend → "confirm your comment"          increment post.commentCount
  return { status: 'success' }             redirect to /blog/<slug>#comment-<id>
```

Four decisions inside that:

**The comment is written BEFORE verification, as `pending`.** The alternative — hold it in
the token and write it on confirm — means a long comment lives in a URL or in a second
store. Pending comments are invisible to every read query (`status == "published"`), so
this costs nothing but an unconfirmed row, and it makes "you wrote this, go and confirm it"
recoverable rather than lost.

**An address that has confirmed before skips the round trip.** The first comment from an
address is held; every later comment from that same address publishes immediately. §1.7
calls this "post-hoc moderation with a single pre-approval gate at the point where it costs
least", and it is also what makes the second comment feel like a conversation rather than a
form. This is the single highest-value spam measure in the design and it costs one query.

**Anonymous means anonymous to READERS, not to the author.** The brief is explicit that the
email is "for me and for abuse control, not for display". So `anonymous: true` suppresses the
name at render time and the email is never projected into any query a client component can
see. This site already has this exact contract and has already got it wrong once: the
reviewer anonymity work found real names reachable in the RSC payload while no pixel showed
them. **The comment queries must redact on the server, and the e2e suite already has the
shape of that test** (`tests/reviewers.spec.ts`).

**Tokens are single-purpose and expire.** A comment token confirms one comment and nothing
else; an unconfirmed comment older than 7 days is deleted by the same scheduled job that
would prune unconfirmed subscribers.

---

## 8.2 Labels — five, and why the fifth

The brief names four: **question · correction · addition · disagreement**. §1.7 found real
prior art in Conventional Comments and took two lessons from it: keep the set small and
fixed, and **`praise` earns its place, because a comment stream that can only be critical
reads as hostile.**

I would add exactly that one and stop:

| Label | What it says before the comment is read |
| --- | --- |
| **Question** | I did not follow something |
| **Correction** | I believe something here is wrong — the one that can produce a `3B` correction |
| **Addition** | Something true that is not here |
| **Disagreement** | I followed it and I think it is wrong |
| **Praise** | This was useful |

Rejected from §1.7's candidate list: *context*, *source*, *experience*, *clarification*.
Each is a shade of **Addition** or **Question**, and a label set that needs a decision tree
stops being read. Conventional Comments ships seven and actively resists growth; this blog
is not code review and four-plus-one is the size that stays legible.

**Correction is the one with a downstream consequence.** Phase 3B already builds corrections
in place, with credit to whoever caught it, and 3B's own note says a correction "can credit
someone who emailed". A comment labelled Correction is the same input arriving through a
better door — and §1.7 found the mechanism for it in GitHub Discussions' "mark as answer":
**a comment promoted into the document's own record rather than left in a list underneath
it.** That is the feature worth building, and it is the argument for labels being structured
data rather than a word the commenter typed.

Labels are filterable, per the brief. The filter row reuses `buttonClass({ variant: 'chip' })`
and the counts-per-label pattern the blog directory's status facet already uses.

---

## 8.3 Threading — one level, and what that means in the data

Decided; the research does not argue against it and neither do I. The part worth writing
down is the data model, because "one level" is a **write-time invariant**, not a rendering
choice:

- `parent` is a weak self-reference, nullable.
- On accept: if the comment being replied to itself has a `parent`, the new comment's
  `parent` is set to **that grandparent**, not to the comment clicked. So a reply to a reply
  lands beside it, chronologically, exactly as the brief describes.
- Enforcing it at write time means the read query is one level deep by construction and can
  never produce a tree. A rendering-time flatten would leave the data able to nest and the
  next person to write a query would get it wrong.

---

## 8.4 Scope — posts and sidenotes, one store, two surfaces

The brief asks how a sidenote-scoped comment surfaces and offers inline, collected, or both.

**Both, and that is not a hedge — it is the only option that survives the two ways people
arrive.** A reader deep in the margin wants to see that someone has already challenged
*that* claim; a reader at the foot wants the whole conversation without having to hunt the
margin for it.

- A comment carries an optional `anchor`: the sidenote's `_key`.
- In the margin, the note grows a count — "2 responses" — that opens the existing 6.5
  expansion window rather than a new panel. **The article gains no new floating element**;
  this is the standing rule and Phase 6 already built the window this would reuse.
- In the main list, an anchored comment renders with a quiet backlink to the passage it is
  about, and the label filter gains one more option: "on a sidenote".

The cost is one field and one extra filter. The alternative — a separate store or a separate
UI for sidenote comments — would be a second comment system.

---

## 8.5 Moderation wording

The brief proposes "Deleted by Author" for author removal and asks for the commenter's
wording. §1.7's finding is that Reddit's `[removed]` / `[deleted]` split is exactly this
distinction with wording readers already recognise.

**"Deleted by Author" should not ship.** On a personal blog "Author" reads as either the
post's author or the comment's — precisely the two parties the label exists to tell apart.

| Who | Display |
| --- | --- |
| Stefan | **Removed by Stefan** |
| The commenter | **Withdrawn by the commenter** |

"Withdrawn" rather than "Deleted": deleted says the text is gone, and withdrawn says the
person took it back. The second is what actually happened, and it is the honest signal —
the brief's own reason for wanting the distinction at all.

In both cases the row stays, the label stays, and the body is replaced. A thread with holes
is honest; a thread that silently re-numbers itself is not, and any reply beneath a removed
comment must still make sense.

---

## 8.7 Spam — the reason personal sites abandon comments

The brief says do not hand-wave this. Five layers, ordered by value per unit of work, with
what already exists marked.

**1. Honeypot — already built.** `NewsletterForm` and every server action carry one. Free,
removes the unsophisticated majority. On failure the action returns *success* so the bot
moves on rather than retrying.

**2. First-comment hold, then trust the address — the highest-value layer.** Described under
8.1. It converts an open box into an invite-once box without ever showing a human a form
they did not expect.

**3. Rate limiting — built, and it does not work the way the code implies.**
`lib/security.ts` keeps buckets in a module-level `Map`. On Vercel each serverless instance
has its own module scope, so the limit is **per instance, not per site**, and it resets on
every cold start. The file's own header says so: *"Swap `rateLimit` for @upstash/ratelimit
if you need it global."* For the newsletter that is tolerable. For an open comment box it is
the difference between a limit and the appearance of one. **This design treats a durable
rate limiter as a prerequisite, not a nice-to-have** — and the durable store can be Sanity
itself (a tiny `rateBucket` document keyed by IP hash) rather than a new dependency, at the
cost of one write per attempt.

**4. Content heuristics, in precision order.** §1.7's finding is that link count is the
highest-precision signal available without a third party. Two or more links in a first
comment → hold regardless of address history. Others worth having and cheap: a body that is
mostly a URL; a name field containing a URL; identical body text already present on another
post; a comment submitted under 3 seconds after the form first rendered.

**5. No CAPTCHA.** The brief offers "an optional CAPTCHA that doesn't break accessibility".
Layers 1–4 handle what arrives at this volume, and every accessible CAPTCHA is either
useless or a third-party script on a site whose CSP is enforced and whose standing
preference is against third-party dependencies. **If one is ever needed, the answer is a
proof-of-work challenge, not an image puzzle** — no third party, no accessibility cost, and
the cost falls on the machine rather than the person. It is not needed on day one and should
not be built on day one.

### What the workflow looks like when spam arrives at volume

The realistic bad day is a few hundred comments from a handful of addresses overnight.

- The Studio desk gets a **"Needs attention"** list: everything `pending`, newest first,
  which the measurements above say is a flat ~170ms however large the archive is.
- Bulk action: **block an address**, which removes every comment from it and adds it to a
  `blocklist` document that the accept path checks. One click per spammer, not per comment.
- Because the first comment from any new address is held, **the volume that reaches readers
  during all of this is zero.** That is the property worth protecting, and it is why layer 2
  is ranked above rate limiting.

---

## NOT BUILT, and it is part of 8.5 rather than an extra

**A commenter cannot withdraw their own comment.** The status exists, the wording exists and
the rendering is verified — but the only way to reach `withdrawn` today is for Stefan to set
it in the Studio, which makes "Withdrawn by the commenter" a thing only the site author can
say on the commenter's behalf. That is the opposite of the distinction 8.5 is asking for.

It is not built because the obvious mechanisms are all worse than waiting:

- **A link in the confirmation email** only reaches a first-time commenter. Everyone trusted
  posts without an email, so the people most likely to want it are the people who would
  never get it.
- **A second, unspent `manageToken`** means every comment carries a live credential for
  ever, in an inbox, that can alter the site. The confirm token is spent on use precisely so
  that cannot happen.
- **Remembering the commenter's own ids in `localStorage`** works and is what most systems
  do, but it is per-device and silently fails for the person who wrote from their phone and
  wants it gone from their laptop.

The least-bad version is probably the third plus a "withdraw by email" fallback, and it
wants a decision rather than a guess. Until then this is a gap, stated here rather than
discovered later.

## What I would build first, and what I would not build at all

**First, in one sitting:** the `comment` schema, the server action, the confirm route, the
Studio desk group, and the read query with per-post pagination and server-side redaction.
That is a working, moderatable, spam-resistant comment system with no UI polish.

**Second:** the labels and their filter row, the one-level threading, and the removal states.

**Third:** sidenote anchoring, which reuses Phase 6's expansion window.

**Not on day one:** promoting a Correction comment into a 3B correction. It is the most
interesting thing here and the one most likely to be designed wrong before there is a single
real correction to look at.

**Not at all:** a CAPTCHA, and any third-party comment service.

### The risk worth stating

Comments are the first feature in this brief that lets a stranger put text on the site. Every
other phase has been typography and structure, where the worst outcome is that something
looks wrong. Here the worst outcome is that something *is* wrong — a real name attached to
an anonymous comment, a stored email exposed, or a spam wave that reaches readers.

The anonymity contract is the specific one to be careful about, because this project has
already got it wrong once in a place where nothing looked wrong: reviewer names were
readable in the RSC payload while no pixel showed them. **Redaction happens on the server,
the e2e suite asserts it, and the same test shape already exists.**
