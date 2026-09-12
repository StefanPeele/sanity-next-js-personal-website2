// lib/comments.ts
// The ONE vocabulary for comments — labels, statuses and the removal wording.
//
// This project has removed four separate copies of one table already (a client component,
// the Studio preview, the Studio picker, and the lane equivalent of the same mistake). The
// schema, the render surfaces, the filter row and the Studio preview all read this file, so
// there is never a fifth.
//
// It is deliberately free of React and of any server-only import, because both the schema
// (which runs in the Studio) and a client component need it.

import type { IconName } from '@/lib/cms/icons'

/**
 * Five labels, not the brief's four.
 *
 * §1.7 found real prior art in Conventional Comments, a published standard for code review
 * that prefixes every comment with a label from a fixed set. Two lessons were taken from it:
 * keep the set small and fixed, and keep `praise`, which is the one label that exists to
 * make the others survivable — a comment stream that can only be critical reads as hostile.
 *
 * Rejected from the candidate list on purpose: context, source, experience, clarification.
 * Each is a shade of Addition or Question, and a label set that needs a decision tree stops
 * being read.
 */
export const COMMENT_LABELS = [
  { value: 'question', title: 'Question', hint: 'I did not follow something', icon: 'help-circle' as IconName, color: 'text-sky-400', border: 'border-sky-500/30' },
  { value: 'correction', title: 'Correction', hint: 'I believe something here is wrong', icon: 'alert-circle' as IconName, color: 'text-rose-400', border: 'border-rose-500/30' },
  { value: 'addition', title: 'Addition', hint: 'Something true that is not here', icon: 'plus-circle' as IconName, color: 'text-emerald-400', border: 'border-emerald-500/30' },
  { value: 'disagreement', title: 'Disagreement', hint: 'I followed it and I think it is wrong', icon: 'message-square' as IconName, color: 'text-amber-400', border: 'border-amber-500/30' },
  { value: 'praise', title: 'Praise', hint: 'This was useful', icon: 'award' as IconName, color: 'text-stone-300', border: 'border-stone-500/30' },
] as const

export type CommentLabel = (typeof COMMENT_LABELS)[number]['value']
export const COMMENT_LABEL_VALUES = COMMENT_LABELS.map((l) => l.value) as readonly string[]

export function commentLabel(value?: string | null) {
  return COMMENT_LABELS.find((l) => l.value === value) ?? null
}

/**
 * Statuses. Only `published` is ever read by the site.
 *
 * `removed` and `withdrawn` are BOTH kept rather than deleted, and they are kept apart on
 * purpose. 8.5 asks for author-removal and self-removal to be visibly distinct, because
 * conflating them would be dishonest: one is suppression and one is a person taking their
 * own words back.
 */
export const COMMENT_STATUSES = [
  { value: 'pending', title: 'Pending confirmation' },
  { value: 'published', title: 'Published' },
  { value: 'removed', title: 'Removed by Stefan' },
  { value: 'withdrawn', title: 'Withdrawn by the commenter' },
  { value: 'spam', title: 'Spam' },
] as const

export type CommentStatus = (typeof COMMENT_STATUSES)[number]['value']

/**
 * What a reader sees in place of a removed comment.
 *
 * NOT the brief's "Deleted by Author". On a personal blog "Author" reads as either the
 * post's author or the comment's — precisely the two parties the label exists to tell
 * apart. Reddit's [removed] / [deleted] split is the right distinction; these are the same
 * distinction in words that say who did it.
 *
 * "Withdrawn" rather than "Deleted": deleted says the text is gone, withdrawn says the
 * person took it back, and the second is what actually happened.
 */
export const REMOVAL_TEXT: Record<string, string> = {
  removed: 'Removed by Stefan',
  withdrawn: 'Withdrawn by the commenter',
  spam: 'Removed as spam',
}

/** True for a status whose body must not be rendered. */
export function isRemoved(status?: string | null): boolean {
  return status === 'removed' || status === 'withdrawn' || status === 'spam'
}

/** Limits, shared by the zod schema, the textarea's maxLength and the tests. */
export const COMMENT_LIMITS = {
  body: { min: 2, max: 4000 },
  name: { max: 80 },
  email: { max: 254 },
  /** Roots per page. At 20 a thread is ~15KB; the measurements in PHASE-8-COMMENTS.md are why. */
  pageSize: 20,
} as const

/**
 * The display name a READER may see. Never the email, under any circumstance.
 *
 * Redaction happens here and is called on the server, so an anonymous commenter's name
 * never enters the RSC payload. The reviewer anonymity work found real names readable in
 * view-source while no pixel showed them; this is the same contract and the same trap.
 */
export function commentAuthor(c: { anonymous?: boolean | null; authorName?: string | null }): string {
  if (c.anonymous) return 'Anonymous'
  const name = (c.authorName ?? '').trim()
  return name || 'Anonymous'
}
