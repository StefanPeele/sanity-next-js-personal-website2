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

/**
 * Quiet navigation link — "All posts", "View the graph", "← Back to the garden".
 *
 * Fifteen of these sit at the end of section headers across the knowledge side and
 * were spelled out at each one; three had lost the focus ring along the way. The
 * type face is deliberately NOT included: the same link is `font-sans text-sm` in a
 * section header and `meta-label` in a footer row, and that difference is real.
 */
/**
 * Quiet nav links ("All posts →").
 *
 * `py-1` is a TOUCH TARGET, not spacing. At `text-sm` these are 20px tall, which is under
 * WCAG 2.5.8's 24x24 minimum; 4px top and bottom takes the hit area to 28px. Vertical
 * padding on an INLINE element grows the box without affecting the line height, so nothing
 * moves -- measured at 1440, 768 and 390.
 *
 * WCAG exempts a link inline in a sentence, because its size follows the text it sits in.
 * These are not that: they stand alone at the end of a row, and they were the most common
 * finding in the Phase 10 audit.
 */
export const QUIET_LINK = `py-1 text-stone-400 hover:text-white transition-colors rounded-sm ${FOCUS}`

type ButtonVariant = 'primary' | 'secondary' | 'chip'
type ButtonSize = 'sm' | 'md' | 'lg'

/** Geometry only — no type face, no gap. See buttonClass. */
const BUTTON_BASE = `inline-flex items-center justify-center border transition-colors ${FOCUS}`

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: 'min-h-[32px] px-3 py-1.5', // chips, filter rows, inline tag links
  md: 'min-h-[40px] px-4 py-2.5', // the default: panel and card actions
  lg: 'min-h-[48px] px-6 py-3', //  page-level and form submits
}

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary:
    'rounded-lg bg-white text-black border-white hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed',
  secondary:
    'rounded-lg border-edge text-stone-300 hover:text-white hover:border-edge-strong hover:bg-surface-veil disabled:opacity-40 disabled:cursor-not-allowed',
  chip: 'rounded-full',
}

/** `chip` is the only variant with a selected state, because it is the only toggle. */
const CHIP_STATE = {
  on: 'border-edge-active bg-surface-fill-strong text-white',
  off: 'border-edge text-stone-300 hover:text-white hover:border-edge-strong hover:bg-surface-veil',
}

/**
 * Button, chip and CTA geometry — one spelling for a control that had six.
 *
 * The knowledge side carried six independent definitions of a filter chip (blog,
 * library, garden tag cloud, garden note tags, glossary, reader menu) across two
 * selected languages, two radii, two faces and three paddings; and its bordered
 * controls ran through six paddings and four radii. This collapses them to three
 * variants × three sizes × two radii, on the palette tokens — so an article theme
 * restates a button the same way it restates a card, without naming buttons.
 *
 * It returns a string rather than rendering a component on purpose: half of these
 * call sites are `<Link>` or `<a>`, which a `<Button>` cannot serve, and the other
 * half would be a wrapper whose only job is to compute this same string.
 *
 * The type face stays at the call site. `.meta-label` (mono, uppercase) and
 * `font-sans text-sm` are both correct here depending on context, and baking either
 * one in would silently override the other — utilities beat `@layer components`.
 */
export function buttonClass({
  variant = 'secondary',
  size = 'md',
  active = false,
}: { variant?: ButtonVariant; size?: ButtonSize; active?: boolean } = {}) {
  const state = variant === 'chip' ? ` ${active ? CHIP_STATE.on : CHIP_STATE.off}` : ''
  return `${BUTTON_BASE} ${BUTTON_SIZE[size]} ${BUTTON_VARIANT[variant]}${state}`
}
