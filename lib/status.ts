// lib/status.ts
// The ONE vocabulary for a post's epistemic status.
//
// Phase 3.3 asks for the same status to appear on five surfaces at three different
// volumes -- a small mark on the card, a full label in the article header, full detail in
// the Contents column, plain text in the feeds, and the card's mark again in the hover
// preview. That only stays coherent if every surface reads one table. It previously lived
// inside CredibilitySection, a client component, which is why the card and the feeds had
// no status at all.
//
// Keys here are the schema's enum values. ALWAYS look up through enumKey() from
// lib/stega.ts -- in draft mode the value carries invisible characters and a raw lookup
// returns undefined. See lib/stega.ts for the measurement.
import type { IconName } from '@/lib/cms/icons'
import { enumKeys } from '@/lib/stega'

export interface StatusMeta {
  /** Full label, for the article header and the Contents column. */
  label: string
  /** Short mark for the index card. Must read at a glance. */
  short: string
  /**
   * Distinct SHAPE per status. 3.3 requires the card mark to be distinguishable without
   * relying on colour -- colourblind readers and greyscale printing both matter -- so the
   * icon carries the distinction and colour is only a second cue.
   */
  icon: IconName
  color: string
  bg: string
  /**
   * The same colour as `color`, as an `r g b` triple, for the 3.4 aura. CSS custom
   * properties cannot hold a Tailwind class, and the aura needs an alpha the palette does
   * not offer, so the value is spelled twice. Keep them equal -- the triples below are the
   * literal Tailwind values of the classes beside them.
   */
  rgb: string
}

/** Render order wherever several apply at once. Strongest claim first. */
export const REVIEW_FLAG_ORDER = [
  'peer-reviewed', 'fact-checked', 'seeking-review', 'open-to-comment',
  // The revision tier (3B). `revised` used to be one value and collapsed three different
  // admissions into it. The Washington Post separates updating for EVENTS from updating for
  // ERRORS, and journalism already has three words for it, so this uses three:
  //   corrected  -- it was wrong
  //   clarified  -- it was right but misleading
  //   updated    -- it was right and things have changed since
  // Exactly ONE of the three ever applies, because unlike peer-reviewed/fact-checked they
  // are a severity scale on one axis, not independent facts. See revisionState().
  'corrected', 'clarified', 'updated',
] as const
export type ReviewFlag = (typeof REVIEW_FLAG_ORDER)[number]

/**
 * The revision tier, derived from the changelog and the corrections list — never chosen in
 * Studio. Exported so the schema's picker can subtract them rather than re-listing the
 * selectable values by hand, which is how the two drift apart.
 */
export const DERIVED_FLAGS = ['corrected', 'clarified', 'updated'] as const
export type RevisionFlag = (typeof DERIVED_FLAGS)[number]
export type SelectableFlag = Exclude<ReviewFlag, RevisionFlag>
export const SELECTABLE_FLAGS = REVIEW_FLAG_ORDER
  .filter((f): f is SelectableFlag => !(DERIVED_FLAGS as readonly string[]).includes(f))

// peer-reviewed and fact-checked are deliberately NOT one scale and are not shaded as
// stronger/weaker. Fact-checking is CLAIM-level (were these statements true); peer review
// is DOCUMENT-level (is the argument sound). Neither implies the other.
export const REVIEW_STATUS: Record<string, StatusMeta> = {
  'peer-reviewed':   { label: 'Peer reviewed',       short: 'Reviewed',  icon: 'award',       color: 'text-emerald-400', rgb: '52 211 153', bg: 'border-emerald-500/30 bg-emerald-950/10' },
  'fact-checked':    { label: 'Fact checked',        short: 'Checked',   icon: 'check',       color: 'text-blue-400', rgb: '96 165 250',    bg: 'border-blue-500/30 bg-blue-950/10' },
  'seeking-review':  { label: 'Seeking peer review', short: 'Seeking',   icon: 'search',      color: 'text-amber-400', rgb: '251 191 36',   bg: 'border-amber-500/30 bg-amber-950/10' },
  'open-to-comment': { label: 'Open to comment',     short: 'Open',      icon: 'message-square', color: 'text-stone-300', rgb: '214 211 209', bg: 'border-stone-500/30 bg-stone-950/30' },
  'corrected':       { label: 'Corrected',           short: 'Corrected', icon: 'alert-circle', color: 'text-rose-400', rgb: '251 113 133',  bg: 'border-rose-500/30 bg-rose-950/10' },
  'clarified':       { label: 'Clarified',           short: 'Clarified', icon: 'info',        color: 'text-sky-400',   rgb: '56 189 248',   bg: 'border-sky-500/30 bg-sky-950/10' },
  'updated':         { label: 'Updated',             short: 'Updated',   icon: 'rotate-ccw',  color: 'text-stone-300', rgb: '214 211 209',  bg: 'border-stone-500/30 bg-stone-950/30' },
}

/** How sure the author is. Nothing about who checked it — that is reviewStatus. */
export const CONFIDENCE: Record<string, StatusMeta> = {
  'speculative':    { label: 'Speculative',    short: 'Speculative', icon: 'lightbulb', color: 'text-orange-400', rgb: '251 146 60', bg: 'border-orange-500/30 bg-orange-950/10' },
  'working-theory': { label: 'Working theory', short: 'Theory',      icon: 'zap',       color: 'text-amber-400', rgb: '251 191 36',  bg: 'border-amber-500/30 bg-amber-950/10' },
  'confident':      { label: 'Confident',      short: 'Confident',   icon: 'check',     color: 'text-stone-300', rgb: '214 211 209',  bg: 'border-stone-500/30 bg-stone-950/30' },
}

/** How tested it is. Nothing about who checked it, and nothing about confidence. */
export const MATURITY: Record<string, { label: string }> = {
  fresh: { label: 'Fresh' },
  tested: { label: 'Lab tested' },
  'production-proven': { label: 'Production proven' },
}

export const LOAD: Record<string, { label: string }> = {
  light: { label: 'Light read' },
  technical: { label: 'Technical' },
  dense: { label: 'Dense' },
  reference: { label: 'Reference' },
}

/**
 * The flags a post carries, in render order, already cleaned of stega.
 * `limit` is how 3.3's volumes differ: the card takes 2, the header takes 1, the
 * Contents column takes all of them.
 */
export function reviewFlags(values: readonly (string | null)[] | null | undefined, limit = Infinity): Array<StatusMeta & { key: ReviewFlag }> {
  const set = new Set(enumKeys(values))
  return REVIEW_FLAG_ORDER.filter((f) => set.has(f)).slice(0, limit).map((f) => ({ key: f, ...REVIEW_STATUS[f] }))
}

/** Plain text for the feeds, where there is no colour and no icon to lean on. */
export function statusPlainText(values: readonly (string | null)[] | null | undefined): string | null {
  const labels = reviewFlags(values).map((f) => f.label)
  return labels.length ? labels.join(' · ') : null
}

/* ── The aura (3.4) ───────────────────────────────────────────────────────────
   A persistent edge glow on the card tile in the status colour. Styling lives in
   styles/status.css; this decides only WHICH colours and HOW MANY. */

export type AuraIntensity = 'subtle' | 'medium' | 'pronounced'

/**
 * The shipped intensity. All three are rendered at 1440/768/390 in docs/audit/frames/ for
 * Stefan to pick from; changing this one line changes every card. `subtle` is the default
 * because 3.4 asks for "a faint edge treatment" and the louder two are candidates, not the
 * brief's stated starting point.
 */
export const AURA_INTENSITY: AuraIntensity = 'subtle'

/**
 * Props for the aura, or `null` when the post carries no status — in which case no
 * `data-aura` attribute is emitted at all and the card renders exactly as it did before.
 * That is the graceful default, and it is most posts.
 *
 * AT MOST TWO COLOURS, and specifically the same two the card's marks show, because
 * `reviewFlags(status, 2)` is what feeds both. The brief's instruction is "do not stack five
 * glows"; the rule that satisfies it without a second, disagreeing cutoff is "the aura
 * matches the marks". With one status the second stop repeats the first, so the gradient
 * collapses to a flat ring by itself rather than by a special case.
 */
export function auraProps(
  values: readonly (string | null)[] | null | undefined,
  intensity: AuraIntensity = AURA_INTENSITY,
): { 'data-aura': AuraIntensity; style: Record<string, string> } | null {
  const flags = reviewFlags(values, 2)
  if (!flags.length) return null
  return {
    'data-aura': intensity,
    // Custom properties, so they must go through style rather than a Tailwind class.
    style: { '--aura-1': flags[0].rgb, '--aura-2': (flags[1] ?? flags[0]).rgb },
  }
}

/* ── Last updated, and where `revised` comes from (3.7) ───────────────────────
   The brief asks whether "last updated" should be manual or automatic, and whether it is
   the same signal as the `Revised` status. Both answers are here.

   NOT `_updatedAt`. It fires on a typo fix, a tag change, and every accidental Studio save,
   so a post would announce a revision that never happened. The brief warned about exactly
   this and it is the whole reason the field is not used.

   NO NEW FIELD EITHER. `changelog[]` already exists, and both of its members -- a date and
   a description of what changed -- are REQUIRED. That makes it manual by construction:
   you cannot record a revision date without also saying what you revised. A checkbox or a
   bare `revisedAt` date asks for less evidence than the claim deserves, and a second field
   could disagree with the changelog the reader is looking at.

   SAME SIGNAL. `Revised` and "last updated" are one thing, so `revised` is derived here
   rather than selected in Studio -- it has been removed from the schema's options list. A
   post cannot now claim it was revised while showing no record of what changed. */

/** The most recent changelog date, or null. Dates are `YYYY-MM-DD`, so lexical max is
 *  chronological max — no parsing, and no timezone to get wrong. */
export function lastRevisedAt(changelog: readonly { date?: string | null }[] | null | undefined): string | null {
  const dates = (changelog ?? []).map((c) => (c?.date ?? '').slice(0, 10)).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
  return dates.length ? dates.reduce((a, b) => (b > a ? b : a)) : null
}

/**
 * The review flags to render: whatever the author set, plus `revised` when the changelog
 * says so. Every surface must call this rather than reading `reviewStatus` raw, or the card
 * and the article will disagree about whether a post was revised.
 */
export function effectiveReviewStatus(
  values: readonly (string | null)[] | null | undefined,
  revision: RevisionFlag | null | undefined,
): string[] {
  // Only values that are IN the vocabulary and are selectable survive. That drops two
  // things at once: any hand-set value from the derived tier, and legacy values like the
  // old collapsed 'revised' that 3B replaced. Both are no longer settable, and both would
  // otherwise be returned to callers that have no entry for them.
  const selectable = SELECTABLE_FLAGS as readonly string[]
  const keys = enumKeys(values).filter((v) => selectable.includes(v))
  return revision ? [...keys, revision] : keys
}

/**
 * Which of the three revision words applies, and from when (3B).
 *
 * Journalism separates updating for ERRORS from updating for EVENTS, and `revised` collapsed
 * them. Exactly one of the three ever applies, by severity: if anything in the piece was
 * WRONG, that is the honest headline even when a dozen harmless updates came after it.
 *
 * `kinds` is every correction's kind; `lastRevised` is the newest date across the changelog
 * AND the corrections, because both are material revisions. Every surface calls this so the
 * card, the header and the feed cannot disagree about which word applies.
 */
export function revisionState(
  lastRevised: string | null | undefined,
  kinds: readonly (string | null)[] | null | undefined,
  publishedAt: string | null | undefined,
): { date: string | null; flag: RevisionFlag | null } {
  const date = materialRevision(lastRevised, publishedAt)
  if (!date) return { date: null, flag: null }
  const k = new Set(enumKeys(kinds))
  // A changelog entry with no corrections at all is an update: something changed, nothing
  // was admitted wrong.
  const flag: RevisionFlag = k.has('correction') ? 'corrected' : k.has('clarification') ? 'clarified' : 'updated'
  return { date, flag }
}

/**
 * The revision date, but only when it is a real post-publication revision.
 *
 * Found by the fixture: its changelog dates (August, 1 September) predate its publishedAt,
 * and the header rendered "September 11, 2026 · Updated September 1, 2026" — an update
 * older than the publication it supposedly updates, which reads as nonsense. A backdated
 * changelog entry, or a draft written over weeks and published afterwards, produces exactly
 * this on a real post too.
 *
 * Every surface routes its date through here so the card, the header and the feed cannot
 * disagree about whether a revision counts.
 */
export function materialRevision(
  lastRevised: string | null | undefined,
  publishedAt: string | null | undefined,
): string | null {
  const revised = (lastRevised ?? '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(revised)) return null
  // No publish date yet (an unpublished draft) — nothing to be later than, so show it.
  const published = (publishedAt ?? '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(published)) return revised
  // Strictly after: an edit on the day of publication is publishing, not revising.
  return revised > published ? revised : null
}
