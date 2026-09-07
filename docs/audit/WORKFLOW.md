# Workflow — what to extract, what to fix, and an honest read on the process

2026-09-07, after four working sessions. **No code changed in this pass** — everything here is a
proposal awaiting approval.

---

## 1. What has been rebuilt more than once

| Candidate | Verdict | Reasoning |
| --- | --- | --- |
| **UI measurement harness** | **Skill** — `.claude/skills/ui-measure/` | Written from scratch four sessions running (services, site inventory, blog). Every remaining section needs it. It is the only candidate that clears the "used more than once" bar by a wide margin. |
| **Dead-field detector** | **Committed script** — `scripts/find-dead-fields.ts` | Deterministic, no judgment, and **currently wrong** (see §3 of the blog audit — it undercounted by at least 8). A script can be unit-tested against known-dead fields; a skill can't. It must resolve *paths* (`blogPage.seriesRail.lede`), not bare key names. |
| **Content census** | **Fold into the measurement skill** | It is one more measurement, not a separate tool. The hard-won rule — read `innerText`, never the HTML source, because GROQ pulls unused fields into the RSC payload — belongs in that code as a comment, not in a second script. |
| **UI pattern inventory** | **Ad-hoc** | Used once, and it was 80% judgment over grep output. Promote it if a second section needs it; don't build it on one data point. |

### What the measurement skill should contain

Everything measured in the blog audit, because all of it was written twice already: type
permutations (size × family × transform × tracking × weight, with counts and samples), line-height
and letter-spacing permutation counts, contrast ratios against the *effective* composited
background, tap targets under 24/44, elements exceeding the viewport, adjacent-block spacing rhythm,
characters per line via Range rects (not an estimate), page weight and request count under
throttling, and the content census.

Two things it must encode that cost real time to learn:

- **Ignore the Sanity Live CORS toast** (`fontFamily` contains `ui-sans-serif`) — it is a localhost artifact and it is the only element that overflows 390px.
- **Read the live DOM, not the response body.**

---

## 2. The four recurring failures

**The ~14MB push ceiling — no LFS, no out-of-git storage.** The JPEG conversion took the full
baseline from 32.5MB to 11.3MB, but the recurring cost was never the baseline size; it was that
`SECTION-TEMPLATE.md` says re-capture *all three breakpoints*, which rewrites all 81 files every
round. **Scope re-capture to the section's own routes** and a round costs 1–2MB. This session proved
it: re-capturing only `/blog` and `/blog/[slug]` took 15.9s and six files. Template change, not
infrastructure.

**False-positive selectors — add `data-testid`, but narrowly.** Blanket attributes are noise. Add
them only where a selector has already been ambiguous or an interaction test needs one:

`booking-success` (the `[role="status"]` that matched the newsletter form and reported a booking
success that never happened) · `reader-menu` · `reader-menu-panel` · `toc-sidebar` / `toc-mobile`
(currently `data-toc`, already fine — leave) · `blog-filter-category` · `article-body`
(currently `data-article`, fine — leave). **About five new attributes, not fifty.**

**The revalidation window — a documented constant, not a helper.** There is nothing to help; it is
a fact to know. `X-Nextjs-Stale-Time: 300`. It belongs in CLAUDE.md's gotchas and in the template's
verification step. Sessions have polled 72s and 120s and reported false negatives twice.

**`.gitattributes` — every commit warns about CRLF.** Proposed file:

```
* text=auto eol=lf
*.jpg binary
*.png binary
*.webp binary
*.ico binary
*.woff  binary
*.woff2 binary
*.pdf binary
```

`text=auto eol=lf` normalises to LF in the repo while letting Git check out native line endings;
the binary rules stop Git from attempting diffs or EOL conversion on the 81 baseline captures.

---

## 3. CLAUDE.md audit

55 lines. **Length is not the problem — accuracy is.** Every factual claim checked against code:

| Line | Claim | Verdict |
| --- | --- | --- |
| 8 | `app/(archive)/` contains "blog, garden, library, **paths**, feeds" | **Stale** — `/paths` deleted 2026-09-07 |
| 12 | `lib/` is "site.ts, dates.ts, reading.ts, security.ts, motion.ts, feed.ts, portableTextToHtml.ts" | **Incomplete** — omits `anki.ts`, `articleStorage.ts`, `articleThemeStyles.ts`, `github.ts`, `glossary.ts`, `pricing.ts` (6 of 13) |
| 20 | Commands list | **Incomplete** — `npm run screenshot` is missing entirely |
| 29 | "Tailwind opacity modifiers only from the scale (`/5`, `/10`, `/20`) … arbitrary decimals like `/8` do not compile" | **Needs verification.** Tailwind is 3.4.19 and `border-white/15` is used 21 times and renders. The claim is at best imprecise. I did not test `/8` — flagging rather than asserting. |
| 35 | "Section headings are plain words in `.section-label` (**sans, small**)" | **Wrong.** `.section-label` (`styles/index.css:113-119`) is **serif, 1.05rem, weight 600, no tracking, no uppercase**. The description given actually matches `.meta-label`, the class directly below it. The doc conflates two utilities. |
| 47-55 | Gotchas (CSP, read token, global-error, sw.js) | **Correct** — sw.js was fixed last session |
| — | framer-motion / `MotionConfig reducedMotion="user"` | **Correct** (`MotionProvider.tsx:9`) |
| — | `next/font` self-hosts Lora/Inter/Plex/Lexend | **Correct**, and worth a cost note: those four fonts are 163KB, 55% of the article's 295KB |

### Is it serving its purpose?

Mostly yes. It is short, it is read, and its Conventions section is the part that actually shapes
work. The Architecture map is the part that rots — it is a directory listing maintained by hand, and
two of its three inaccuracies are there.

**Add:**
- `npm run screenshot`, and that re-capture should be scoped to the section's routes
- The ~14MB push ceiling
- `X-Nextjs-Stale-Time: 300` — allow 5 minutes for a Studio change to appear
- **`.meta-label` exists in `styles/index.css` and has zero callers** — the single most useful line that could be added, because 43 ad-hoc label permutations grew around an unused utility

**Cut:**
- The per-directory file inventories in the Architecture map. Replace with one line per route group and let the filesystem be the source of truth. They are the only part that has drifted twice.

---

## 4. Template revision

Tested against three real sections.

**What it asks for that didn't matter.** The four-row "THE GOAL THIS SERVES" table — in practice the
answer was obvious and one line every time. The elaborate §2 framing can collapse to: *primary goal,
one sentence on why now.*

**What every session needed and it doesn't mention:**

1. **Check whether the baseline is stale before auditing it.** This bit me directly: the `/blog` captures predated the `/paths` deletion and would have described links that no longer exist.
2. **Measure before looking.** Static analysis missed the reader-menu bug entirely; a screenshot missed it too. It took driving the UI.
3. **Drive the interactions.** The single largest defect found in three sessions — 18 of 24 reader-menu controls unclickable — is invisible to both code reading and screenshots.
4. **Verify a utility or field has callers before assuming it's used.** `.meta-label`: 0 callers. `blogPage.seriesRail.lede`: 0. `THEME_OPTIONS[].label`: 0.
5. **Scope re-capture to the section's routes**, per §2.

**Is the verification checklist ceremony?** Partly. `npm run check exits 0` is table stakes and has
never failed. The Studio round-trip check is real and is now possible for the first time. The
screenshot diff is real. **The missing check is an interaction pass** — the one that would have
caught the biggest bug of the last three sessions.

**Is cuts → fixes → improvements right?** Yes, and this session produced direct evidence: the label
consolidation (74 call sites) gets materially cheaper after the deletions, because several of those
sites are in components slated for removal. Keep the order and add a line explaining *why* with that
example.

---

## 5. Memory

Currently three files. The problem is **duplication that will drift**: `site-state-2026-09-04` has
grown into a changelog and now restates content that lives in the audit docs — the content census,
the dead-field counts, the route dispositions.

**Remove from memory** (all of it is in `2026-09-full-inventory.md`, and the memory copy is already
wrong — it says 16 dead fields; the real figure is ≥24):
- The content-census results per route
- The dead-field counts
- The route dispositions

**Keep** — operational facts that would cost a session to rediscover and are not derivable from the repo:
- The write-token situation, and that `seed-content.ts --dry-run` cannot validate it
- **When the user says a value is in `.env.local`, verify it** — it wasn't, twice
- The ~14MB push ceiling and the JPEG decision
- `X-Nextjs-Stale-Time: 300`
- The `Portrait · Core` / `Portrait · Starter` open decision
- Standing decisions (`site-decisions-2026-09`) and the post backlog (`showfab-blog-backlog`) — both still accurate and both about *intent*, which is exactly what memory is for

**Move into a doc:** everything measured. Rule of thumb going forward — *memory holds decisions and
operational gotchas; docs hold measurements.* If a number appears in both, the doc wins and the
memory line should be a pointer.

---

## 6. My honest read on the process

**Is one-section-per-session the right unit?** For `/services` and `/blog`, yes — both justified a
full session and both produced findings that would not have surfaced in a shared one. For `/now`,
`/uses`, `/contact` and `/resume`, no. Those are four short, populated, low-risk pages; they are one
session together. Sizing the unit by route rather than by surface area is the flaw.

**Is diagnosis → approve → execute working?** For large sections, clearly yes, and this session is
the proof. Executing blind would have had me retype 74 mono-label call sites in components that
**don't render for either published post**, and rewrite theme CSS without discovering that the
themes are scoped to the wrong DOM node. Three premises in the prompt didn't survive contact with
the code. That is what the split is for.

For small sections it is pure overhead. Use it above a threshold — roughly "does this route have
interactive state or real content" — and skip it below.

**What you're asking for that isn't worth the time.**

- **Exhaustive enumeration when the top five would do.** The pattern inventory is 26 badges and 43 label permutations; the decision it supports — "consolidate onto the existing utility" — needed about six examples. The other 60 rows cost time and changed nothing.
- **Re-running research already done.** Part 6 asked me to study seven sites I studied two sessions ago and concluded were blocked on content density. Re-fetching produced the same conclusion.
- **Stacking several large prompts into one turn.** Four arrived together this session. It forces me to guess at priority, and when I asked, the answer was "both of these" for two mutually exclusive options — which I had to interpret rather than execute.

**What you should be asking for and aren't.** One question, and it would have saved more time than
everything in this document: **"does this render for the actual content?"**

The blog audit's central finding is that twelve of the article page's twenty sections don't render,
and that `components/blog/` — 43 label permutations, 26 badge styles, nine learning-block components
— is almost entirely dormant. The experience plan proposed typography work across a component
library that no published post exercises. Nobody asked whether the code being audited was on screen.

**Where the process makes the work worse.** Only one thing, and it's the same thing each time:
scope keeps expanding at the moment a decision is due. Three times now the honest answer has been
"do less, then write a post," and three times the response has been to add a further audit. This
document is itself an example — you asked me to optimize the workflow for building infrastructure
that the site does not yet need.

**The ratio, directly.** Two posts, roughly twelve sessions of planned infrastructure, plus four
sessions already spent. That is wrong, and it has been wrong since 4 September, when your own memory
recorded "content is now the bottleneck; the learning blocks, graph, and garden look empty with two
posts." My inventory reached it independently on the 6th. The blog audit reached it a third time
today, from a different direction — the machinery isn't just unused, it's *unrendered*.

What I'd change: cap infrastructure at the ~2.5 sessions in the blog audit's recommended order
(the reader menu is broken, the measure is 91 characters, the hero eats a viewport, the typo is
visible on every page) — then stop and write the WinRM post. After a third and fourth post exist,
the remaining items get *cheaper and better targeted*, because you'll know which learning blocks you
actually use. Right now you are consolidating badge styles for components no reader has seen.
