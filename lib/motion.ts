// lib/motion.ts
// Shared motion tokens. Import these in framer-motion transitions so every
// component animates on the same curves. Tailwind mirrors them in tailwind.config.ts
// (ease-out-expo, ease-out-quart, duration-fast/base/slow, animate-fade-up, ...).

export const EASE = {
  /** Snappy settle — default for enter animations. */
  outExpo:  [0.16, 1, 0.3, 1] as const,
  /** Softer than outExpo; use for large surfaces. */
  outQuart: [0.25, 1, 0.5, 1] as const,
  /** Symmetric — hover state changes, toggles. */
  inOut:    [0.65, 0, 0.35, 1] as const,
}

export const DURATION = {
  fast: 0.18,
  base: 0.4,
  slow: 0.7,
} as const

/** Stagger between siblings, in seconds. */
export const STAGGER = 0.06

/** framer-motion variants for a fade + rise. Pair with `initial="hidden" animate="show"`. */
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.outExpo } },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: DURATION.base, ease: EASE.outQuart } },
}

/** Container variant that staggers `fadeUp` children. */
export const staggerChildren = {
  hidden: {},
  show:   { transition: { staggerChildren: STAGGER } },
}
