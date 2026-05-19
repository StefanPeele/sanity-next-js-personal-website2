'use client'

import { useState } from 'react'
import BookingSection from '@/components/BookingSection'
// components/services/ServicePackages.tsx

type ServiceType = 'portrait' | 'event' | 'specialty'

interface Package {
  name: string
  tagline: string
  publicPrice: number | string
  njitPrice: number | string
  priceNote?: string
  duration: string
  deliverables: string[]
  physicalProduct: 'core' | 'premium'
  recommended: string
  comingSoon?: boolean
}

const CORE_PRODUCTS = [
  'Framed 5×7 print (archival, black or white frame)',
  'Matted print set (two 5×7s, kraft presentation sleeve)',
  'Softcover photobook (10 pages, Pixieset print lab)',
  'Linen-wrapped print box (3–5 prints, keepsake box)',
  'Desk acrylic stand (4×6 hero image, double-sided)',
]

const PREMIUM_PRODUCTS = [
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

const PORTRAIT_PACKAGES: Package[] = [
  {
    name: 'Core',
    tagline: 'Professional. Directed. Polished.',
    publicPrice: 250,
    njitPrice: 180,
    duration: 'Up to 1.5 hours — multiple looks welcome',
    deliverables: [
      'Full gallery of edited JPEGs — high-res, color-graded, print-ready',
      '5 hero shots exported as print-ready TIFFs at full native resolution',
      'Social media pack — 5–8 images in Instagram, Stories & LinkedIn formats',
      'Full posing guide + mood board',
      'Professional retouching on all finals',
      'Pixieset gallery — password-protected, downloadable',
    ],
    physicalProduct: 'core',
    recommended: 'Professionals, headshots, brand portraits, personal work',
  },
  {
    name: 'Premium',
    tagline: 'Editorial. Intentional. Full Experience.',
    publicPrice: 375,
    njitPrice: 275,
    duration: 'Up to 2.5 hours — your vision, fully executed',
    deliverables: [
      'Full gallery of edited JPEGs — high-res, color-graded, print-ready',
      '5 hero shots exported as print-ready TIFFs at full native resolution',
      'Social media pack — 5–8 images in Instagram, Stories & LinkedIn formats',
      'Full posing guide + mood board',
      'Professional retouching on all finals',
      'Multiple looks or locations',
      'Commercial use license',
      'Pixieset gallery — password-protected, 1 year access',
    ],
    physicalProduct: 'premium',
    recommended: 'Brand shoots, editorial, marketing, full portfolio builds',
    comingSoon: true,
  },
]

const EVENT_PACKAGES: Package[] = [
  {
    name: 'Core',
    tagline: 'Extended Coverage. Stronger Output.',
    publicPrice: 250,
    njitPrice: 175,
    priceNote: 'starting at',
    duration: 'Up to 3 hours',
    deliverables: [
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
  },
  {
    name: 'Premium',
    tagline: 'Top-Tier Coverage. Full Day. Video Included.',
    publicPrice: 700,
    njitPrice: 499,
    priceNote: 'starting at',
    duration: 'Full day — up to 8 hours',
    deliverables: [
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
  },
]

const SPECIALTY_SERVICES = [
  {
    name: 'Headshot Mini',
    tagline: 'Fast. Clean. LinkedIn-ready.',
    njitPrice: 65,
    publicPrice: 85,
    duration: 'Up to 1 hour',
    turnaround: '1–2 business days',
    note: 'The no-frills version. Perfect for a quick profile update, student org directory, or résumé headshot. Direct inquiry — no consultation required.',
    badge: 'Direct Inquiry',
    consultation: false,
    highlight: false,
  },
  {
    name: 'Graduation Session',
    tagline: "You earned this. Let's document it.",
    njitPrice: 180,
    publicPrice: 250,
    duration: 'Up to 2–2.5 hours',
    turnaround: '48 hours',
    note: 'Cap and gown, campus locations, the real moment. Includes the full three-part delivery and your choice of physical product. Available April–May and December — book early.',
    badge: 'Available Now',
    consultation: true,
    highlight: true,
  },
  {
    name: 'Personal Brand / Content',
    tagline: 'Multiple looks. Social-ready. Built for your brand.',
    njitPrice: 150,
    publicPrice: 225,
    duration: 'Up to 2 hours',
    turnaround: '2–4 business days',
    note: 'For students running businesses, building social media, or creating a professional presence. Multiple outfits, locations, content angles. Consultation required.',
    badge: 'Most Requested',
    consultation: true,
    highlight: false,
  },
  {
    name: 'Club / Frat Headshot Day',
    tagline: 'Bring your whole org. One afternoon, everyone covered.',
    njitPrice: '45 / person',
    publicPrice: '65 / person',
    duration: '2–3 hour block, ~15 min per person',
    turnaround: '2–3 business days',
    note: 'Minimum 5 people. The coordinator shoots free for organizing. Consultation required to coordinate scheduling, locations, and delivery.',
    badge: '5 person minimum',
    consultation: true,
    highlight: false,
  },
]

const ADD_ONS = [
  {
    label: 'Additional session time',
    price: '$75 / hr',
    description: 'Add more time to any session. Discussed and confirmed before the shoot.',
  },
  {
    label: 'Rush delivery',
    price: '$40',
    description: 'Standard 48hr turnaround moved to 24hr. Available for Core and Premium.',
  },
  {
    label: 'Social media pack — same-day',
    price: '$45',
    description: '5–8 platform-ready edits. Included standard — this upgrades to same-day delivery.',
  },
  {
    label: 'Physical product upgrade',
    price: 'Discussed in consultation',
    description: 'Add a second product or upgrade your included product. We cover this during your consultation.',
  },
]

const CALENDLY_URL = 'https://calendly.com'

function getNJITSavings(serviceType: ServiceType): string {
  if (serviceType === 'portrait') return 'Save $70–$100 on portrait sessions'
  if (serviceType === 'event')    return 'Save $75–$200+ on event packages'
  return 'Discounted rates on specialty sessions'
}

function PhysicalProductBadge({ tier }: { tier: 'core' | 'premium' }) {
  const products = tier === 'core' ? CORE_PRODUCTS : PREMIUM_PRODUCTS
  const label    = tier === 'core' ? 'Choose your physical product' : 'Choose your premium keepsake'

  return (
    <div className={`rounded-lg border p-4 mb-6 ${
      tier === 'premium'
        ? 'border-amber-500/30 bg-amber-950/10'
        : 'border-white/15 bg-white/[0.03]'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{tier === 'premium' ? '✦' : '◈'}</span>
        <span className={`font-mono text-[9px] uppercase tracking-[0.35em] font-bold ${
          tier === 'premium' ? 'text-amber-400' : 'text-stone-300'
        }`}>
          {label}
        </span>
      </div>
      <ul className="space-y-1.5">
        {products.map((product, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={`text-[10px] mt-0.5 flex-shrink-0 ${
              tier === 'premium' ? 'text-amber-500' : 'text-stone-600'
            }`}>—</span>
            <span className={`font-mono text-[9px] leading-snug ${
              tier === 'premium' ? 'text-stone-300' : 'text-stone-400'
            }`}>
              {product}
            </span>
          </li>
        ))}
      </ul>
      <p className={`font-mono text-[8px] uppercase tracking-widest mt-3 ${
        tier === 'premium' ? 'text-amber-500/60' : 'text-stone-600'
      }`}>
        Final selection confirmed during consultation
      </p>
    </div>
  )
}

export function ServicePackages() {
  const [serviceType, setServiceType] = useState<ServiceType>('portrait')
  const [isNJIT, setIsNJIT]           = useState(false)
  const [showInquiry, setShowInquiry] = useState(false)

  const packages =
    serviceType === 'portrait' ? PORTRAIT_PACKAGES :
    serviceType === 'event'    ? EVENT_PACKAGES    : []

  return (
    <div id="packages">

      {/* ── Service type tabs ─────────────────────────────────────── */}
      <div className="flex flex-col gap-6 mb-10">
        <div
          className="flex flex-wrap gap-1 p-1 rounded-lg border border-white/10"
          style={{ backgroundColor: 'rgba(20,20,24,0.8)' }}
        >
          {(
            [
              { key: 'portrait',  label: 'Portrait' },
              { key: 'event',     label: 'Event' },
              { key: 'specialty', label: 'Specialty' },
            ] as { key: ServiceType; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setServiceType(key)}
              className={`font-mono text-[10px] uppercase tracking-[0.3em] px-5 py-2.5 rounded-md transition-all duration-200 flex-1 sm:flex-none ${
                serviceType === key
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* NJIT toggle */}
        {serviceType !== 'specialty' && (
          <button
            onClick={() => setIsNJIT((v) => !v)}
            className={`w-full text-left rounded-xl border-2 transition-all duration-300 overflow-hidden ${
              isNJIT
                ? 'border-emerald-500/70 shadow-lg shadow-emerald-900/20'
                : 'border-white/20 hover:border-white/35'
            }`}
            style={{
              backgroundColor: isNJIT ? 'rgba(16,46,32,0.85)' : 'rgba(25,25,30,0.85)',
            }}
          >
            <div className="px-6 py-5 flex items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${
                    isNJIT ? 'bg-emerald-500' : 'bg-white/20'
                  }`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${
                      isNJIT ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                  <span className={`font-mono text-[11px] uppercase tracking-[0.3em] font-bold transition-colors ${
                    isNJIT ? 'text-emerald-300' : 'text-stone-200'
                  }`}>
                    NJIT Student or Affiliate?
                  </span>
                  {isNJIT && (
                    <span className="font-mono text-[8px] uppercase tracking-widest text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-sm">
                      Active
                    </span>
                  )}
                </div>
                <p className={`font-mono text-[10px] transition-colors ${
                  isNJIT ? 'text-emerald-400/80' : 'text-stone-500'
                }`}>
                  {isNJIT
                    ? `✓ ${getNJITSavings(serviceType)} — NJIT ID required at booking`
                    : 'Toggle on to see discounted rates for students, faculty & orgs'}
                </p>
              </div>
              {isNJIT && (
                <div className="hidden sm:block text-right flex-shrink-0">
                  <span className="font-mono text-[8px] text-stone-600 uppercase tracking-widest block line-through">
                    {serviceType === 'portrait' ? 'From $250' : 'From $250'}
                  </span>
                  <span className="font-serif text-xl font-bold text-emerald-300">
                    {serviceType === 'portrait' ? 'From $180' : 'From $175'}
                  </span>
                </div>
              )}
            </div>
          </button>
        )}
      </div>

      {/* ── Standard delivery banner ──────────────────────────────── */}
      {serviceType !== 'specialty' && (
        <div className="mb-8 p-5 rounded-xl border border-white/10 bg-white/[0.02]">
          <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-500 block mb-3">
            Every session includes — standard
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '▣', label: 'Edited JPEGs', desc: 'Full gallery, color-graded, high-res, print-ready via Pixieset' },
              { icon: '◈', label: 'Print-ready TIFFs', desc: '5 hero shots at full native resolution — labeled for professional printing' },
              { icon: '⊞', label: 'Social media pack', desc: '5–8 images in Instagram, Stories, and LinkedIn formats — ready to post' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <span className="text-stone-600 text-sm flex-shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-300 block mb-0.5">{item.label}</span>
                  <span className="font-mono text-[9px] text-stone-600 leading-snug block">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Package cards ─────────────────────────────────────────── */}
      {serviceType !== 'specialty' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {packages.map((pkg) => {
            const price      = isNJIT ? pkg.njitPrice : pkg.publicPrice
            const isCore     = pkg.name === 'Core'
            const isComing   = pkg.comingSoon

            return (
              <div
                key={pkg.name}
                className={`relative flex flex-col rounded-xl border transition-all duration-300 overflow-hidden ${
                  isComing
                    ? 'border-white/8 opacity-50'
                    : isCore
                    ? 'border-amber-500/40 shadow-lg shadow-amber-900/10'
                    : 'border-white/10'
                }`}
                style={{
                  backgroundColor: isComing
                    ? 'rgba(14,14,16,0.95)'
                    : isCore
                    ? 'rgba(24,20,12,0.95)'
                    : 'rgba(16,16,20,0.95)',
                }}
              >
                {/* Badge */}
                <div className={`font-mono text-[8px] uppercase tracking-[0.3em] text-center py-1.5 font-bold ${
                  isComing
                    ? 'bg-white/10 text-stone-500'
                    : isCore
                    ? 'bg-amber-500 text-black'
                    : 'bg-white/10 text-stone-400'
                }`}>
                  {isComing ? 'Expanding Soon' : isCore ? '✦ Recommended' : 'Available'}
                </div>

                <div className="p-7 flex flex-col flex-grow">
                  <div className="mb-6">
                    <span className={`font-mono text-[9px] uppercase tracking-[0.35em] block mb-2 ${
                      isCore ? 'text-amber-500/70' : 'text-stone-500'
                    }`}>
                      {pkg.name}
                    </span>
                    <p className="font-serif italic text-stone-300 text-lg leading-snug">
                      {pkg.tagline}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-white/8">
                    {pkg.priceNote === 'starting at' && (
                      <span className="font-mono text-[9px] text-stone-500 uppercase tracking-widest block mb-1">
                        Starting at
                      </span>
                    )}
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`font-serif text-5xl font-bold transition-colors ${
                        isNJIT
                          ? 'text-emerald-300'
                          : isCore
                          ? 'text-amber-300'
                          : 'text-white'
                      }`}>
                        ${price}
                      </span>
                      {isNJIT && (
                        <span className="font-mono text-[9px] text-emerald-500 uppercase tracking-widest">
                          NJIT rate
                        </span>
                      )}
                    </div>
                    {isNJIT && (
                      <span className="font-mono text-[10px] text-stone-600 line-through mt-0.5 block">
                        Public: ${pkg.publicPrice}
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-stone-500 block mt-1.5">
                      {pkg.duration}
                    </span>
                  </div>

                  {/* Deliverables */}
                  <ul className="space-y-2.5 mb-6 flex-grow">
                    {pkg.deliverables.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-stone-200 text-sm leading-snug">
                        <span className={`mt-0.5 flex-shrink-0 text-xs ${
                          isCore ? 'text-amber-500' : 'text-stone-500'
                        }`}>✓</span>
                        {item}
                        {item.includes('in development') && (
                          <span className="font-mono text-[8px] text-amber-500/70 border border-amber-500/30 px-1.5 py-0.5 rounded-sm ml-1 flex-shrink-0">
                            WIP
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* Physical product */}
                  <PhysicalProductBadge tier={pkg.physicalProduct} />

                  {/* Recommended */}
                  <div className="pt-4 border-t border-white/8 mb-6">
                    <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-600 block mb-1">
                      Ideal for
                    </span>
                    <p className="font-mono text-[10px] text-stone-400 leading-relaxed">
                      {pkg.recommended}
                    </p>
                  </div>

                  {/* CTA */}
                  {isComing ? (
                    <div className="w-full text-center font-mono text-[10px] uppercase tracking-[0.25em] py-3.5 rounded-lg border border-white/10 text-stone-600 cursor-not-allowed">
                      Expanding Soon
                    </div>
                  ) : (
                    <button
                      onClick={() => window.open(CALENDLY_URL, '_blank')}
                      className={`w-full text-center font-mono text-[11px] uppercase tracking-[0.25em] py-3.5 rounded-lg transition-all duration-200 font-bold ${
                        isCore
                          ? 'bg-amber-500 text-black hover:bg-amber-400'
                          : 'bg-white text-black hover:bg-stone-200'
                      }`}
                    >
                      Schedule a Consultation
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Specialty services ────────────────────────────────────── */}
      {serviceType === 'specialty' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {SPECIALTY_SERVICES.map((svc) => (
            <div
              key={svc.name}
              className={`relative flex flex-col rounded-xl border transition-all duration-300 overflow-hidden ${
                svc.highlight
                  ? 'border-amber-500/40 shadow-lg shadow-amber-900/10'
                  : 'border-white/10'
              }`}
              style={{
                backgroundColor: svc.highlight
                  ? 'rgba(24,20,12,0.95)'
                  : 'rgba(16,16,20,0.95)',
              }}
            >
              {svc.badge && (
                <div className={`font-mono text-[8px] uppercase tracking-[0.3em] text-center py-1.5 font-bold ${
                  svc.highlight ? 'bg-amber-500 text-black' : 'bg-white text-black'
                }`}>
                  {svc.highlight ? '✦ ' : ''}{svc.badge}
                </div>
              )}

              <div className="p-7 flex flex-col flex-grow">
                <div className="mb-5">
                  <h3 className="font-serif text-2xl text-white mb-1">{svc.name}</h3>
                  <p className="font-serif italic text-stone-400 text-base">{svc.tagline}</p>
                </div>

                <div className="mb-5 pb-5 border-b border-white/8">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="font-mono text-[9px] text-stone-600 uppercase tracking-widest block mb-0.5">NJIT</span>
                      <span className={`font-serif text-3xl font-bold ${svc.highlight ? 'text-amber-300' : 'text-emerald-300'}`}>
                        ${svc.njitPrice}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div>
                      <span className="font-mono text-[9px] text-stone-600 uppercase tracking-widest block mb-0.5">Public</span>
                      <span className={`font-serif text-3xl font-bold ${svc.highlight ? 'text-amber-300/70' : 'text-stone-400'}`}>
                        ${svc.publicPrice}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mb-5">
                  {[
                    { label: 'Time',     value: svc.duration },
                    { label: 'Delivery', value: svc.turnaround },
                  ].map((spec) => (
                    <div key={spec.label} className="flex items-start gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-stone-600 w-16 flex-shrink-0 mt-0.5">
                        {spec.label}
                      </span>
                      <span className="font-mono text-[10px] text-stone-300 leading-snug">{spec.value}</span>
                    </div>
                  ))}
                </div>

                <p className="text-stone-300 text-sm leading-relaxed flex-grow mb-6">{svc.note}</p>

                {svc.highlight && (
                  <div className="mb-4 p-3 rounded-lg border border-amber-500/20 bg-amber-950/10">
                    <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-amber-400/70 block mb-1">Includes</span>
                    <span className="font-mono text-[9px] text-stone-300">Full three-part delivery + physical product of your choice</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (svc.consultation) {
                      window.open(CALENDLY_URL, '_blank')
                    } else {
                      document.getElementById('inline-inquiry')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }}
                  className={`w-full text-center font-mono text-[10px] uppercase tracking-[0.25em] py-3.5 rounded-lg transition-all duration-200 font-bold ${
                    svc.highlight
                      ? 'bg-amber-500 text-black hover:bg-amber-400'
                      : svc.consultation
                      ? 'bg-white text-black hover:bg-stone-200'
                      : 'border border-white/20 text-stone-300 hover:border-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {svc.consultation ? 'Schedule a Consultation' : 'Send Inquiry'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add-ons ───────────────────────────────────────────────── */}
      <div className="mb-16">
        <div className="mb-6 pb-4 border-b border-white/10">
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-400 border-l-2 border-stone-500 pl-4">
            Add-Ons // Available for any package
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ADD_ONS.map((addon) => (
            <div
              key={addon.label}
              className="px-5 py-4 rounded-lg border border-white/8"
              style={{ backgroundColor: 'rgba(20,20,24,0.6)' }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] text-stone-200 uppercase tracking-[0.15em] font-bold">
                  {addon.label}
                </span>
                <span className="font-mono text-[10px] text-white font-bold ml-4 flex-shrink-0">
                  {addon.price}
                </span>
              </div>
              <p className="font-mono text-[9px] text-stone-500 leading-relaxed">
                {addon.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Inline inquiry form — always visible ─────────────────── */}
      <div id="inline-inquiry" className="py-16 border-t border-white/10 scroll-mt-8">
        <div className="text-center mb-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-stone-500 block mb-3">
            Questions? Direct inquiry.
          </span>
          <h2 className="font-serif text-3xl text-white mb-3">
            Not sure where to start?
          </h2>
          <p className="font-mono text-[10px] text-stone-400 uppercase tracking-widest max-w-md mx-auto leading-relaxed">
            Send me a message and I'll follow up within 24 hours. No commitment required.
          </p>
        </div>
        <div className="flex justify-center">
          <BookingSection triggerLabel="Send a Message" />
        </div>
      </div>
    </div>
  )
}