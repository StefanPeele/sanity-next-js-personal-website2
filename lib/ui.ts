// lib/ui.ts
// Shared class-name constants. Presentation strings that more than one route or
// component needs, kept in one place so they cannot drift apart silently.

/**
 * Keyboard focus ring. Append to any interactive element's className.
 *
 * This was declared, byte-identically, in 29 separate files. It is deliberately a
 * plain string rather than a helper: Tailwind scans `lib/**` (see the `content`
 * globs in tailwind.config.ts), so the classes are still generated from here, and
 * anything more clever would hide them from that scan.
 *
 * There used to be a second spelling — a `.focus-ring` utility in styles/index.css
 * carrying these three classes plus `focus-visible:outline-offset-2`. It had zero
 * call sites against this constant's 163, so it was dead CSS rather than a rival
 * convention. Resolved by adopting its offset here and deleting it: a ring held 2px
 * off the element stays legible on the many controls that already carry a border,
 * where a flush ring merged with that border. One spelling, site-wide.
 */
export const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 focus-visible:outline-offset-2'
