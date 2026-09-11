// lib/reviewers.ts
// One place decides what an anonymous reviewer is allowed to reveal.
//
// This exists as a single function on purpose. A reviewer's name appears in four places on
// the article -- the avatar initial, the LinkedIn link text, the plain name, and the
// Contents column -- and anonymity that is applied in three of the four is not anonymity.
// Every surface calls this and renders only what it returns.

export interface ReviewerInput {
  _key?: string
  name?: string | null
  role?: string | null
  organization?: string | null
  quote?: string | null
  date?: string | null
  linkedIn?: string | null
  anonymous?: boolean | null
}

export interface ReviewerDisplay {
  key: string
  /** What to show where a name would go. Never the real name when anonymous. */
  label: string
  /** Single letter for the avatar, or null when anonymous -- an initial narrows a search. */
  initial: string | null
  /** Role line, or null when anonymous: the role is already inside `label`. */
  role: string | null
  /** Suppressed entirely when anonymous. A small employer plus a job title identifies. */
  organization: string | null
  /** Suppressed entirely when anonymous. A LinkedIn URL *is* the name. */
  linkedIn: string | null
  quote: string | null
  date: string | null
  anonymous: boolean
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u'])

/** "a network engineer" / "an infrastructure engineer". */
export function withArticle(role: string): string {
  const first = role.trim()[0]?.toLowerCase()
  return `${first && VOWELS.has(first) ? 'an' : 'a'} ${role.trim()}`
}

const FALLBACK_ROLE = 'professional in the field'

export function reviewerDisplay(r: ReviewerInput, index = 0): ReviewerDisplay {
  const key = r._key ?? String(index)
  const quote = r.quote?.trim() || null
  const date = r.date ?? null

  if (r.anonymous) {
    // Deliberately drops name, initial, organization and linkedIn. The role carries the
    // whole signal: "Reviewed by a network engineer" is worth something; "Reviewed by
    // Anonymous" is worth nothing.
    return {
      key,
      label: withArticle(r.role?.trim() || FALLBACK_ROLE),
      initial: null,
      role: null,
      organization: null,
      linkedIn: null,
      quote,
      date,
      anonymous: true,
    }
  }

  const name = r.name?.trim() || 'Reviewer'
  return {
    key,
    label: name,
    initial: name.charAt(0).toUpperCase(),
    role: r.role?.trim() || null,
    organization: r.organization?.trim() || null,
    linkedIn: r.linkedIn?.trim() || null,
    quote,
    date,
    anonymous: false,
  }
}

/** "Peer reviewed by: Jane Doe and a network engineer" — for the Contents column. */
export function reviewerSummary(reviewers: ReviewerInput[]): string | null {
  const labels = reviewers.map((r, i) => reviewerDisplay(r, i).label)
  if (labels.length === 0) return null
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
}
