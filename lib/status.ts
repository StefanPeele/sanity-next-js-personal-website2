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
}

/** Render order wherever several apply at once. Strongest claim first. */
export const REVIEW_FLAG_ORDER = [
  'peer-reviewed', 'fact-checked', 'seeking-review', 'open-to-comment', 'revised',
] as const
export type ReviewFlag = (typeof REVIEW_FLAG_ORDER)[number]

// peer-reviewed and fact-checked are deliberately NOT one scale and are not shaded as
// stronger/weaker. Fact-checking is CLAIM-level (were these statements true); peer review
// is DOCUMENT-level (is the argument sound). Neither implies the other.
export const REVIEW_STATUS: Record<string, StatusMeta> = {
  'peer-reviewed':   { label: 'Peer reviewed',       short: 'Reviewed',  icon: 'award',       color: 'text-emerald-400', bg: 'border-emerald-500/30 bg-emerald-950/10' },
  'fact-checked':    { label: 'Fact checked',        short: 'Checked',   icon: 'check',       color: 'text-blue-400',    bg: 'border-blue-500/30 bg-blue-950/10' },
  'seeking-review':  { label: 'Seeking peer review', short: 'Seeking',   icon: 'search',      color: 'text-amber-400',   bg: 'border-amber-500/30 bg-amber-950/10' },
  'open-to-comment': { label: 'Open to comment',     short: 'Open',      icon: 'message-square', color: 'text-stone-300', bg: 'border-stone-500/30 bg-stone-950/30' },
  'revised':         { label: 'Revised',             short: 'Revised',   icon: 'rotate-ccw',  color: 'text-stone-300',   bg: 'border-stone-500/30 bg-stone-950/30' },
}

/** How sure the author is. Nothing about who checked it — that is reviewStatus. */
export const CONFIDENCE: Record<string, StatusMeta> = {
  'speculative':    { label: 'Speculative',    short: 'Speculative', icon: 'lightbulb', color: 'text-orange-400', bg: 'border-orange-500/30 bg-orange-950/10' },
  'working-theory': { label: 'Working theory', short: 'Theory',      icon: 'zap',       color: 'text-amber-400',  bg: 'border-amber-500/30 bg-amber-950/10' },
  'confident':      { label: 'Confident',      short: 'Confident',   icon: 'check',     color: 'text-stone-300',  bg: 'border-stone-500/30 bg-stone-950/30' },
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
