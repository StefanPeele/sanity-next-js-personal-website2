# The heading fix, post by post

**Measured against the live dataset 2026-09-13.** This is the whole job, and it is smaller
than "the heading migration" made it sound: **one post, seven headings, one dropdown each.**

Nothing here needs a decision. Work down the list.

**The dropdown changed on 2026-09-14, and it is the reason this happened.** The editor used
to offer Sanity's defaults -- Heading 1 through Heading 6, with nothing to say what any of
them did on the page -- so picking Heading 5 for a section was a reasonable guess at a menu
that gave no help. It now reads:

| The editor offers | What it is |
| --- | --- |
| **Section** | A chapter. It gets an entry in the article's Contents list |
| **Subsection** | A part of a section. Indented under it in Contents |
| **Minor heading** | A heading with no Contents entry |
| Quote, Normal | unchanged |
| *Legacy H1 / H5 / H6* | only so the blocks below still have a name. Do not pick them |

So the seven changes in the table below are now **Heading 5 -> Section**, and once they are
made the three Legacy entries can be deleted from the schema. The table keeps the old names
in the "Now" column because that is still what the blocks say.

---

## What is actually wrong, in one paragraph

`/blog/the-field-…` renders its seven section headings as `<h5>`, while "Contents" and
"Responses" render as `<h2>`. So the apparatus outranks the writing: read as an outline, the
comment form is a more important part of that page than "What The Numbers Actually Say". A
screen-reader user navigating by heading level is told the article has no sections at all,
because there is no `h2`, `h3` or `h4` anywhere in it.

The other two posts are **already correct** and are listed below only so you can stop
wondering about them.

---

## Post 1 of 1 that needs changing

### "The Field, The Moment, and What it Means for Us (Networking Industry)"

Open it in the Studio, Content tab, in the body. For each of these seven blocks, click the
style dropdown (it currently reads **Legacy H5**) and choose **Section**.

| # | Heading text | Now | Change to |
| --- | --- | --- | --- |
| 1 | The First Transmission | Legacy H5 | **Section** |
| 2 | Laying The Foundation | Legacy H5 | **Section** |
| 3 | What The Numbers Actually Say | Legacy H5 | **Section** |
| 4 | Where $725 Billion Is Going | Legacy H5 | **Section** |
| 5 | Why The Pipeline Can't Keep Up | Legacy H5 | **Section** |
| 6 | The Part Nobody Else Can Write | Legacy H5 | **Section** |
| 7 | Test Yourself | Legacy H5 | **Section** |

All seven are siblings. None of them is a subsection of another, so they all become
**Section** and none becomes Subsection.

**While you are in each one:** four of these headings begin with a stray line break, which is
why they sit lower than the others. Put the cursor at the very start of the heading text and
press Backspace once.

| # | Heading | Has a leading line break |
| --- | --- | --- |
| 1 | The First Transmission | no |
| 2 | Laying The Foundation | **yes** |
| 3 | What The Numbers Actually Say | **yes** |
| 4 | Where $725 Billion Is Going | **yes** |
| 5 | Why The Pipeline Can't Keep Up | no |
| 6 | The Part Nobody Else Can Write | **yes** |
| 7 | Test Yourself | no |

### What it will look like afterwards

An `h5` renders at 19/20px and an `h2` at 32/38px, so **these seven headings get noticeably
bigger**. That is the change, and it is the reason this was left for you rather than done for
you.

If it reads too loud afterwards, the fix is the `h2` *style* in
`components/CustomPortableText.tsx`, not the level. Say so and I will bring the size down
while keeping the structure correct, which is the part screen readers and search engines
actually read.

---

## The two posts that need nothing

### "Building My Physical Home Lab — Week 2"

Already correct. Heading 2 "Introduction", Heading 3 "Documentation First", Heading 3 "The
GNS3 Journey", Heading 2 "Closing". A clean two-level outline. **Do not touch it.**

### "The Creation of my Personal Portfolio Site!"

Already correct, for a reason worth knowing. Its body starts with a **Heading 1**, "Stefan
Peele: The Digital Archive", and a second `h1` on a page would be a real defect. The renderer
converts a body Heading 1 into an `<h2>` for exactly that reason, so the page has one `h1`
(the article title) and a clean `h2` → `h3` outline underneath. **Do not touch it.**

The only thing you might change here is taste rather than correctness: that converted heading
renders at 36/48px, which is large for a section heading. Switching it from Heading 1 to
Heading 2 in the Studio would render it at 32/38px and change nothing structurally.

---

## How to check you are done

After publishing, either:

- **In the Studio:** the post's outline should show seven Heading 2 blocks and no Heading 5.
- **On the page:** the Contents column lists all seven sections, at the same visual weight as
  each other, and none of them is smaller than the "Responses" heading further down.
- **Or ask me**, and I will re-run the heading audit across every published post and confirm
  that `h1 → h2` is the only jump anywhere on the site.

## Why not run the script

`scripts/migrate-heading-levels.mjs` exists and would do the level change in one command. It
is not the right tool here for two reasons: seven blocks is less work than reviewing what a
script did to a published post, and the script cannot fix the four stray line breaks, which
are the thing you would notice on the page.
