// lib/articleScroll.ts
//
// WHERE THE ARTICLE ENDS, in scroll coordinates. One definition, used by everything that
// turns a scroll position into a fraction.
//
// The progress bar used to divide by the DOCUMENT's scrollable height, so it reached 100%
// at the bottom of the footer. Everything under the prose counted as reading: the sources,
// the corrections, the credibility apparatus, the comment thread, the newsletter form and
// the site footer. On the longest post that is a large share of the page, so a reader who
// had genuinely finished the article was shown about three quarters and told they had
// minutes left. The number was measuring the page, and the reader is reading the piece.
//
// The range ends when the LAST LINE OF THE ARTICLE reaches the bottom of the viewport. That
// is the moment the prose is finished, not the moment it scrolls out of sight, so the bar
// fills exactly as the reader runs out of article. `minutesLeft` is derived from the same
// fraction and is computed from the body's word count, so the two are now the same fact
// instead of two different ones.
//
// The start stays at the top of the DOCUMENT rather than the top of `[data-article]`. The
// title, the hero and the standfirst are read too; starting the count below them would show
// a reader who has read the opening a progress bar still sitting at zero.

/**
 * The scroll position at which the article is fully read.
 *
 * Falls back to the document's own scroll height when there is no article on the page (the
 * blog index shares this provider) or when the article is shorter than the viewport, which
 * would otherwise make every position 100%.
 */
export function readingRangeEnd(): number {
  const doc = document.documentElement.scrollHeight - window.innerHeight
  const el = document.querySelector<HTMLElement>('[data-article]')
  if (!el) return doc
  const end = el.getBoundingClientRect().bottom + window.scrollY - window.innerHeight
  return end > 0 ? Math.min(end, doc) : doc
}

/** The same range as a fraction, clamped. `end` is passed in where it is already cached. */
export function readingFraction(scrollY: number, end = readingRangeEnd()): number {
  if (end <= 0) return 0
  return Math.min(1, Math.max(0, scrollY / end))
}
