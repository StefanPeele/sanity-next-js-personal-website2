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
 * NOT identical to the `.focus-ring` utility in styles/index.css, which applies the
 * same three classes plus `focus-visible:outline-offset-2`. Two spellings of "the
 * focus ring" therefore exist and render differently — `.focus-ring` sits 2px off
 * the element, this one sits flush. CLAUDE.md presents them as interchangeable
 * ("`focus-visible:outline …` (or `.focus-ring`)"), which is not accurate. Left as
 * it is here on purpose: adding the offset would change the appearance of every
 * focus ring on the site, which is a design decision, not a refactor.
 */
export const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'
