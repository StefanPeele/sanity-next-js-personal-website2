// lib/pricing.ts
// Single source of truth for photography packages and add-ons.
// Imported by the service cards, the inquiry form and the booking server action
// so the three can never disagree. Safe to import from client and server code.

export type PackageCategory = 'portrait' | 'event' | 'specialty'
export type PhysicalTier = 'core' | 'premium'

export interface PricingPackage {
  /** Stable id sent by the form and validated server-side. */
  id: string
  name: string
  category: PackageCategory
  tagline: string
  /** Numbers are USD. Strings are per-unit rates such as "45 / person". */
  njitPrice: number | string
  publicPrice: number | string
  priceNote?: 'starting at'
  duration: string
  turnaround?: string
  includes: string[]
  physicalProduct?: PhysicalTier
  recommended?: string
  /** Specialty copy shown under the price block. */
  note?: string
  badge?: string
  highlight?: boolean
  comingSoon?: boolean
  /** True when a consultation call precedes booking. */
  consultation: boolean
  /** Exact single-select option name in the Airtable "Package" field. */
  airtableName: string
}

export interface PricingAddOn {
  id: string
  label: string
  price: string
  description: string
  /** Exact multi-select option name in the Airtable "Add-ons" field. */
  airtableName: string
}

const STANDARD_DELIVERY = [
  'Full gallery of edited JPEGs — high-res, color-graded, print-ready',
  '5 hero shots exported as print-ready TIFFs at full native resolution',
  'Social media pack — 5–8 images in Instagram, Stories & LinkedIn formats',
]

export const CORE_PRODUCTS = [
  'Framed 5×7 print (archival, black or white frame)',
  'Matted print set (two 5×7s, kraft presentation sleeve)',
  'Softcover photobook (10 pages, Pixieset print lab)',
  'Linen-wrapped print box (3–5 prints, keepsake box)',
  'Desk acrylic stand (4×6 hero image, double-sided)',
]

export const PREMIUM_PRODUCTS = [
  'Hardcover lay-flat photobook (20 pages, Artifact Uprising)',
  'Large framed print 11×14 (archival, real wood frame, wall-ready)',
  'Acrylic print block (single hero image, thick mount)',
  'Metal print 8×10 (aluminum, wall mount, modern finish)',
  'Leather portfolio (5–8 prints, presentation sleeve)',
  'Fine art pigment print on cotton rag paper 16×20 (museum quality)',
  'Backlit LED acrylic panel (image glows, wall mounted)',
  'Custom photo engraved wood block (maple or walnut)',
  'Panoramic gallery wrap triptych (3 panels, 12×36)',
  'Handbound Japanese stab-stitch photobook (artisan paper, linen cover)',
  'Archival clamshell print box (10 fine art prints, archival tissue)',
]

export const PACKAGES: PricingPackage[] = [
  // ── Portrait ──────────────────────────────────────────────────
  {
    id: 'portrait-core',
    name: 'Core',
    category: 'portrait',
    tagline: 'Professional. Directed. Polished.',
    publicPrice: 250,
    njitPrice: 180,
    duration: 'Up to 1.5 hours — multiple looks welcome',
    turnaround: '48 hours',
    includes: [
      ...STANDARD_DELIVERY,
      'Full posing guide + mood board',
      'Professional retouching on all finals',
      'Pixieset gallery — password-protected, downloadable',
    ],
    physicalProduct: 'core',
    recommended: 'Professionals, headshots, brand portraits, personal work',
    consultation: true,
    airtableName: 'Portrait · Core',
  },
  {
    id: 'portrait-premium',
    name: 'Premium',
    category: 'portrait',
    tagline: 'Editorial. Intentional. Full Experience.',
    publicPrice: 375,
    njitPrice: 275,
    duration: 'Up to 2.5 hours — your vision, fully executed',
    turnaround: '48 hours',
    includes: [
      ...STANDARD_DELIVERY,
      'Full posing guide + mood board',
      'Professional retouching on all finals',
      'Multiple looks or locations',
      'Commercial use license',
      'Pixieset gallery — password-protected, 1 year access',
    ],
    physicalProduct: 'premium',
    recommended: 'Brand shoots, editorial, marketing, full portfolio builds',
    comingSoon: true,
    consultation: true,
    airtableName: 'Portrait · Premium',
  },

  // ── Event ─────────────────────────────────────────────────────
  {
    id: 'event-core',
    name: 'Core',
    category: 'event',
    tagline: 'Extended Coverage. Stronger Output.',
    publicPrice: 250,
    njitPrice: 175,
    priceNote: 'starting at',
    duration: 'Up to 3 hours',
    turnaround: '48 hours',
    includes: [
      'Full gallery of edited JPEGs — high-res, web and print optimized',
      '5 key moment TIFFs at full native resolution',
      'Social media pack — platform-ready edits delivered same day',
      'Full posing guide + shot list integration',
      'Event detail & environment coverage',
      'Organizational use license',
      'Secure online gallery (120 days)',
    ],
    physicalProduct: 'core',
    recommended: 'Brand events, showcases, sponsored panels, cohorts',
    consultation: true,
    airtableName: 'Event · Core',
  },
  {
    id: 'event-premium',
    name: 'Premium',
    category: 'event',
    tagline: 'Top-Tier Coverage. Full Day. Video Included.',
    publicPrice: 700,
    njitPrice: 499,
    priceNote: 'starting at',
    duration: 'Full day — up to 8 hours',
    turnaround: '48 hours',
    includes: [
      'Full gallery of edited JPEGs — high-res, web and print optimized',
      '5 hero moment TIFFs at full native resolution',
      'Social media pack — platform-ready edits',
      'Osmo video coverage — event highlight footage (in development)',
      '1-on-1 pre-planning call + detailed shot list',
      'Live delivery folder — real-time access during event',
      'On-site image previews',
      'Headshots & portrait coverage included',
      'Commercial + editorial license',
      'Secure gallery — 1 year access',
    ],
    physicalProduct: 'premium',
    recommended: 'Summits, galas, multi-day events, VIP & press coverage',
    comingSoon: true,
    consultation: true,
    airtableName: 'Event · Premium',
  },

  // ── Specialty ─────────────────────────────────────────────────
  {
    id: 'headshot-mini',
    name: 'Headshot Mini',
    category: 'specialty',
    tagline: 'Fast. Clean. LinkedIn-ready.',
    njitPrice: 65,
    publicPrice: 85,
    duration: 'Up to 1 hour',
    turnaround: '1–2 business days',
    includes: ['Edited JPEGs of every keeper', '2 retouched finals', 'LinkedIn-ready crops'],
    note: 'The no-frills version. Perfect for a quick profile update, student org directory, or résumé headshot. Direct inquiry — no consultation required.',
    badge: 'Direct Inquiry',
    consultation: false,
    airtableName: 'Specialty · Headshot Mini',
  },
  {
    id: 'graduation',
    name: 'Graduation Session',
    category: 'specialty',
    tagline: "You earned this. Let's document it.",
    njitPrice: 180,
    publicPrice: 250,
    duration: 'Up to 2–2.5 hours',
    turnaround: '48 hours',
    includes: [...STANDARD_DELIVERY, 'Physical product of your choice'],
    note: 'Cap and gown, campus locations, the real moment. Includes the full three-part delivery and your choice of physical product. Available April–May and December — book early.',
    badge: 'Available Now',
    highlight: true,
    consultation: true,
    airtableName: 'Specialty · Graduation Session',
  },
  {
    id: 'personal-brand',
    name: 'Personal Brand / Content',
    category: 'specialty',
    tagline: 'Multiple looks. Social-ready. Built for your brand.',
    njitPrice: 150,
    publicPrice: 225,
    duration: 'Up to 2 hours',
    turnaround: '2–4 business days',
    includes: [...STANDARD_DELIVERY],
    note: 'For students running businesses, building social media, or creating a professional presence. Multiple outfits, locations, content angles. Consultation required.',
    badge: 'Most Requested',
    consultation: true,
    airtableName: 'Specialty · Personal Brand / Content',
  },
  {
    id: 'club-headshot-day',
    name: 'Club / Frat Headshot Day',
    category: 'specialty',
    tagline: 'Bring your whole org. One afternoon, everyone covered.',
    njitPrice: '45 / person',
    publicPrice: '65 / person',
    duration: '2–3 hour block, ~15 min per person',
    turnaround: '2–3 business days',
    includes: ['Edited JPEGs per person', 'Consistent lighting and backdrop', 'Org-wide delivery folder'],
    note: 'Minimum 5 people. The coordinator shoots free for organizing. Consultation required to coordinate scheduling, locations, and delivery.',
    badge: '5 person minimum',
    consultation: true,
    airtableName: 'Specialty · Club / Frat Headshot Day',
  },
]

export const ADD_ONS: PricingAddOn[] = [
  {
    id: 'extra_time',
    label: 'Additional session time',
    price: '+$75 / hr',
    description: 'Add more time to any session. Discussed and confirmed before the shoot.',
    airtableName: 'Extra 1 hour',
  },
  {
    id: 'rush',
    label: 'Rush delivery',
    price: '+$40',
    description: 'Standard 48hr turnaround moved to same-day or next-morning delivery.',
    airtableName: 'Rushed delivery',
  },
  {
    id: 'social',
    label: 'Social media pack — same-day',
    price: '+$45',
    description: '5–8 platform-ready edits. Included standard — this upgrades to same-day delivery.',
    airtableName: 'Same-day social pack',
  },
  {
    id: 'physical_upgrade',
    label: 'Physical product upgrade',
    price: 'Discussed in consultation',
    description: 'Add a second product or upgrade your included product. We cover this during your consultation.',
    // Deliberately narrower than the label: "Framed print set" is the existing option in the
    // Airtable "Add-ons" field and there are records using it. Renaming it here would create a
    // second option and orphan those records, so the divergence stays until the Airtable option
    // is renamed first. Verified present in the live base on 2026-09-07.
    airtableName: 'Framed print set',
  },
]

/** Sentinel package id for "I have questions" inquiries. */
export const NOT_SURE_ID = 'not-sure'

export const PACKAGE_IDS = PACKAGES.map((p) => p.id)
export const ADD_ON_IDS = ADD_ONS.map((a) => a.id)

export function getPackage(id: string | null | undefined): PricingPackage | undefined {
  return PACKAGES.find((p) => p.id === id)
}

export function getAddOn(id: string): PricingAddOn | undefined {
  return ADD_ONS.find((a) => a.id === id)
}

export function packagesByCategory(category: PackageCategory): PricingPackage[] {
  return PACKAGES.filter((p) => p.category === category)
}

const CATEGORY_LABEL: Record<PackageCategory, string> = {
  portrait: 'Portrait',
  event: 'Event',
  specialty: 'Specialty',
}

export function formatPrice(price: number | string): string {
  return typeof price === 'number' ? `$${price.toLocaleString('en-US')}` : `$${price}`
}

/** "Portrait · Core ($180 NJIT / $250 Public)" — used in the inquiry select. */
export function packageLabel(pkg: PricingPackage): string {
  const prefix = pkg.priceNote === 'starting at' ? 'from ' : ''
  return `${CATEGORY_LABEL[pkg.category]} · ${pkg.name} (${prefix}${formatPrice(pkg.njitPrice)} NJIT / ${prefix}${formatPrice(pkg.publicPrice)} Public)`
}

/** Lowest price across a category, for "from $x" copy. */
export function startingPrice(category: PackageCategory, njit: boolean): number | null {
  const prices = packagesByCategory(category)
    .map((p) => (njit ? p.njitPrice : p.publicPrice))
    .filter((p): p is number => typeof p === 'number')
  return prices.length ? Math.min(...prices) : null
}

export function njitSavings(category: PackageCategory): string {
  if (category === 'portrait') return 'Save $70–$100 on portrait sessions'
  if (category === 'event') return 'Save $75–$200+ on event packages'
  return 'Discounted rates on specialty sessions'
}
