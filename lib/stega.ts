// lib/stega.ts
//
// Strip Sanity's stega encoding before using a string as an object key or in an equality
// test.
//
// WHY THIS EXISTS. In draft mode (Presentation, visual editing) Sanity encodes the source
// path of every string into the string itself as invisible characters, so clicking rendered
// text can open the right field in the Studio. That is fine for display -- the characters
// are zero-width -- and fatal for lookup: `CONFIG['working-theory​​…']` is
// `undefined`, so the badge silently disappears.
//
// Measured on the fixture post, 2026-09-11. In draft mode the payload carried:
//
//   working-theory  -> U+200B U+200B U+200B U+200B U+200C U+FEFF U+200D U+FEFF
//   peer-reviewed   -> same
//   fact-checked    -> same
//   tested          -> clean
//
// which is why maturity rendered and confidence and the review flags did not. The
// inconsistency is the tell: the same code path worked for one enum and failed for three.
//
// It only bites in draft mode, so it never appears on production and never fails a test
// that runs against production -- it appears exactly where the author previews their work.
import { stegaClean } from 'next-sanity'

/**
 * Clean a single enum-ish value. Returns undefined for null/empty so a lookup can use
 * `?? fallback` without a second guard.
 */
export function enumKey(value?: string | null): string | undefined {
  if (!value) return undefined
  const cleaned = stegaClean(value)
  return typeof cleaned === 'string' && cleaned.length > 0 ? cleaned : undefined
}

/** Clean every item of an enum array — reviewStatus and similar. */
export function enumKeys(values?: readonly (string | null)[] | null): string[] {
  if (!Array.isArray(values)) return []
  return values.map((v) => enumKey(v)).filter((v): v is string => !!v)
}
