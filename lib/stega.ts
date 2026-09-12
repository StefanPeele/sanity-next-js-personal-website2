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

/**
 * Clean, de-duplicate and sort a list of CMS strings into FACET KEYS.
 *
 * A facet is built by collecting the same value off many documents — every post's
 * categories, every term's category, every skill's category — and `new Set` on the raw
 * values does not collapse them, because the payload encodes each string's OWN source path
 * and two documents never share one. Measured 2026-09-11: `new Set` over the categories of
 * N posts returns N chips, not one per category, and the chip then writes its encoded value
 * into the URL, where the clean-side filter it is compared against matches nothing. So the
 * facet row is simultaneously duplicated and inert, and only in draft mode.
 *
 * This exists so the three facet sites spell it once instead of three times.
 */
export function facetKeys(values?: readonly (string | null | undefined)[] | null): string[] {
  if (!Array.isArray(values)) return []
  return [...new Set(values.map((v) => enumKey(v)).filter((v): v is string => !!v))].sort()
}
