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
