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

// "a" vs "an" depends on SOUND, not spelling, and a first-letter test gets a networking
// site wrong in exactly the cases it will meet: "a SRE", "a RF engineer", "a MSP
// technician" all read as consonants on the page and start with a vowel letter, while
// "an hour" is the reverse. Found by the verifier, which fuzzed it.
const VOWEL_LETTERS = new Set(['a', 'e', 'i', 'o', 'u'])
// Letters whose NAME begins with a vowel sound, for initialisms: F "ef", H "aitch",
// L "el", M "em", N "en", R "ar", S "es", X "ex".
const VOWEL_SOUNDING_CONSONANTS = new Set(['f', 'h', 'l', 'm', 'n', 'r', 's', 'x'])
// Words that start with a vowel letter but a consonant sound.
const CONSONANT_SOUNDING_VOWEL_WORDS = /^(u[bcdgklmnprstz]|eu|one|once)/i
// Words that start with a consonant letter but a vowel sound.
const VOWEL_SOUNDING_CONSONANT_WORDS = /^(hour|honest|honou?r|heir)/i

/** "a network engineer" / "an infrastructure engineer" / "an SRE" / "a user". */
export function withArticle(role: string): string {
  const word = role.trim()
  const first = word[0]?.toLowerCase() ?? ''
  // An initialism -- two or more capitals, or a single capital followed by a non-letter.
  const isInitialism = /^[A-Z]{2,}/.test(word) || /^[A-Z](?![a-z])/.test(word)
  let vowelSound: boolean
  if (isInitialism) vowelSound = VOWEL_LETTERS.has(first) || VOWEL_SOUNDING_CONSONANTS.has(first)
  else if (VOWEL_SOUNDING_CONSONANT_WORDS.test(word)) vowelSound = true
  else if (CONSONANT_SOUNDING_VOWEL_WORDS.test(word)) vowelSound = false
  else vowelSound = VOWEL_LETTERS.has(first)
  return `${vowelSound ? 'an' : 'a'} ${word}`
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
