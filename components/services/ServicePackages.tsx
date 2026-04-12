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
  photos: string
  turnaround: string
  features: string[]
  recommended: string
  popular?: boolean
  badge?: string
}

const PORTRAIT_PACKAGES: Package[] = [
  {
    name: 'Starter',
    tagline: 'Clean. Confident. Ready to post.',
    publicPrice: 115,
    njitPrice: 89,
    duration: 'Up to 1 hour — we shoot until we get it right',
    photos: '15 edited photos',
    turnaround: '1–3 business days',
    features: [
      'Indoor or outdoor (flexible location)',
      'Custom crops — LinkedIn, social, print',
      'Secure online gallery',
      'Personal use license',
    ],
    recommended: 'LinkedIn headshots, student profiles, quick professional portraits',
    badge: 'Most Accessible',
  },
  {
    name: 'Core',
    tagline: 'Professional. Directed. Polished.',
    publicPrice: 225,
    njitPrice: 175,
    duration: 'Up to 1.5 hours — multiple looks welcome',
    photos: '25 edited photos',
    turnaround: '1–4 business days',
    features: [
      'RAW + TIFF + Black & White versions',
      'Posing guide + creative direction',
      'Professional retouching on all finals',
      'Custom crops for all formats',
      'Secure online gallery',
    ],
    recommended: 'Professionals, fashion, model shoots, brand portraits',
    popular: true,
  },
  {
    name: 'Premium',
    tagline: 'Editorial. Intentional. Full Experience.',
    publicPrice: 375,
    njitPrice: 275,
    duration: 'Up to 2.5 hours — your vision, fully executed',
    photos: 'Full batch — you keep everything good',
    turnaround: '3–5 business days',
    features: [
      'RAW + TIFF + B&W versions',
      'Full posing guide + mood board',
      'Professional retouching on all finals',
      'Multiple looks or locations',
      'Commercial use license',
      'Secure online gallery',
    ],
    recommended: 'Brand shoots, editorial, marketing, full portfolio builds',
  },
]

const EVENT_PACKAGES: Package[] = [
  {
    name: 'Starter',
    tagline: 'Sharp Coverage. Fast Delivery.',
    publicPrice: 250,
    njitPrice: 150,
    duration: 'Up to 1.5 hours',
    photos: '20 edited photos',
    turnaround: '1–3 business days',
    features: [
      'RAW files available on request',
      'Custom crops — print, social & web',
      'Secure online gallery (60 days)',
      'Personal & promo usage license',
      'Pre-event planning call recommended',
    ],
    recommended: 'Club events, panels, pop-ups, recruiting tables',
  },
  {
    name: 'Core',
    tagline: 'Extended Coverage. Stronger Output.',
    publicPrice: 450,
    njitPrice: 299,
    duration: 'Up to 3 hours',
    photos: '40 edited photos + TIFFs',
    turnaround: '2–4 business days',
    features: [
      'RAW + TIFF files included',
      'Pre-shoot planning call + shot list',
      'Event detail & environment photos',
      'Custom crops for all formats',
      'Secure online gallery (120 days)',
      'Organizational use license',
    ],
    recommended: 'Brand events, showcases, sponsored panels, cohorts',
    popular: true,
  },
  {
    name: 'Premium',
    tagline: 'Top-Tier Coverage. Chef-Stef.',
    publicPrice: '1,000+',
    njitPrice: 799,
    priceNote: 'starting at',
    duration: 'Full day — up to 8 hours',
    photos: '60+ photos, full batch',
    turnaround: '2–3 business days (priority)',
    features: [
      '1-on-1 pre-planning call + detailed shot list',
      'Live delivery folder — real-time access',
      'On-site image previews during event',
      'Headshots & portrait coverage included',
      'Commercial + editorial license',
      'Secure gallery — 1 year access',
    ],
    recommended: 'Summits, galas, multi-day events, VIP & press coverage',
  },
]

const SPECIALTY_SERVICES = [
  {
    name: 'Headshot Mini',
    tagline: 'Fast. Clean. LinkedIn-ready.',
    njitPrice: 65,
    publicPrice: 85,
    duration: 'Up to 1 hour',
    photos: '10 edited photos, 1 look',
    turnaround: '1–2 business days',
    note: 'The no-frills version. Perfect for a quick profile update, student org directory, or résumé headshot. Ask about headshot day pricing for your club or team.',
    badge: 'Best for volume',
  },
  {
    name: 'Graduation Session',
    tagline: "You earned this. Let's document it.",
    njitPrice: 120,
    publicPrice: 160,
    duration: 'Up to 1.5 hours',
    photos: '20 edited photos',
    turnaround: '2–4 business days',
    note: 'Cap and gown, campus locations, the real moment. Available April–May and December. Book early — these fill up fast around commencement.',
    badge: 'Seasonal',
  },
  {
    name: 'Personal Brand / Content',
    tagline: 'Multiple looks. Social-ready. Built for your brand.',
    njitPrice: 150,
    publicPrice: 225,
    duration: 'Up to 2 hours',
    photos: '30 edited photos',
    turnaround: '2–4 business days',
    note: 'For students running businesses, building social media, or creating a professional presence beyond LinkedIn. Multiple outfits, locations, and content angles. Social-ready crops included.',
    badge: 'Most requested',
  },
  {
    name: 'Club / Frat Headshot Day',
    tagline: 'Bring your whole org. One afternoon, everyone covered.',
    njitPrice: '45 / person',
    publicPrice: '65 / person',
    duration: '2–3 hour block, ~15 min per person',
    photos: '5 edited photos per person',
    turnaround: '2–3 business days',
    note: 'Minimum 5 people. The coordinator shoots free for organizing. Pitch to pre-law, business, engineering orgs, fraternities, sororities — they book these every semester.',
    badge: '5 person minimum',
  },
]

const ADD_ONS = [
  { label: 'Extra 30 minutes', price: '$50' },
  { label: 'Extra 1 hour', price: '$90' },
  { label: 'Extra 2 hours', price: '$180' },
  { label: 'Same-day social pack (5 photos, 2hr)', price: '$45' },
  { label: 'Rushed full delivery', price: '$40' },
  { label: 'High-res digital upgrade', price: '$25' },
  { label: 'Full RAW file delivery', price: '$50' },
  { label: 'Softcover photobook (20 pages)', price: '$55' },
  { label: 'Hardcover photobook (20 pages)', price: '$75' },
  { label: 'Framed print set (8×10)', price: '$45' },
  { label: 'Portrait discount — Core event clients', price: '15% off' },
  { label: 'Portrait discount — Premium event clients', price: '30% off' },
]

function formatPackageLabel(
  name: string,
  serviceType: ServiceType,
  isNJIT: boolean,
  price: number | string
): string {
  const rate      = isNJIT ? 'NJIT rate' : 'Public rate'
  const typeLabel = serviceType === 'event' ? 'Event' : serviceType === 'portrait' ? 'Portrait' : 'Specialty'
  return `${typeLabel} · ${name} ($${price} ${rate})`
}

// Savings shown in the NJIT toggle card
function getNJITSavings(serviceType: ServiceType): string {
  if (serviceType === 'portrait') return 'Save $26–$100 on portrait sessions'
  if (serviceType === 'event')    return 'Save $100–$200+ on event packages'
  return 'Discounted rates on specialty sessions'
}

export function ServicePackages() {
  const [serviceType, setServiceType] = useState<ServiceType>('portrait')
  const [isNJIT, setIsNJIT]           = useState(false)
  const [selectedPkg, setSelectedPkg] = useState<string | undefined>(undefined)

  const packages =
    serviceType === 'portrait' ? PORTRAIT_PACKAGES :
    serviceType === 'event'    ? EVENT_PACKAGES    : []

  const handleBookPackage = (name: string, price: number | string) => {
    const label = formatPackageLabel(name, serviceType, isNJIT, price)
    setSelectedPkg(label)
    setTimeout(() => {
      document.getElementById('booking-cta')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  return (
    <div id="packages">

      {/* ── Service type tabs ─────────────────────────────────────── */}
      <div className="flex flex-col gap-6 mb-10">
        <div className="flex flex-wrap gap-1 p-1 rounded-lg border border-white/10"
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

        {/* ── NJIT toggle — prominent card ─────────────────────────── */}
        {serviceType !== 'specialty' && (
          <button
            onClick={() => setIsNJIT((v) => !v)}
            className={`w-full text-left rounded-xl border-2 transition-all duration-300 overflow-hidden ${
              isNJIT
                ? 'border-emerald-500/70 shadow-lg shadow-emerald-900/20'
                : 'border-white/20 hover:border-white/35'
            }`}
            style={{
              backgroundColor: isNJIT
                ? 'rgba(16, 46, 32, 0.85)'
                : 'rgba(25, 25, 30, 0.85)',
            }}
          >
            <div className="px-6 py-5 flex items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  {/* Visual toggle pill */}
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

              {/* Price comparison preview */}
              {isNJIT && serviceType === 'portrait' && (
                <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <span className="font-mono text-[8px] text-stone-600 uppercase tracking-widest block line-through">
                      From $115
                    </span>
                    <span className="font-serif text-xl font-bold text-emerald-300">
                      From $89
                    </span>
                  </div>
                </div>
              )}
              {isNJIT && serviceType === 'event' && (
                <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <span className="font-mono text-[8px] text-stone-600 uppercase tracking-widest block line-through">
                      From $250
                    </span>
                    <span className="font-serif text-xl font-bold text-emerald-300">
                      From $150
                    </span>
                  </div>
                </div>
              )}
            </div>
          </button>
        )}
      </div>

      {/* ── Standard package cards ────────────────────────────────── */}
      {serviceType !== 'specialty' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {packages.map((pkg) => {
            const price      = isNJIT ? pkg.njitPrice : pkg.publicPrice
            const pkgLabel   = formatPackageLabel(pkg.name, serviceType, isNJIT, price)
            const isSelected = selectedPkg === pkgLabel

            return (
              <div
                key={pkg.name}
                className={`relative flex flex-col rounded-xl border transition-all duration-300 overflow-hidden ${
                  isSelected
                    ? 'border-white/40 ring-1 ring-white/20'
                    : pkg.popular
                    ? 'border-white/25'
                    : 'border-white/10'
                }`}
                style={{
                  backgroundColor: isSelected
                    ? 'rgba(30,30,36,0.95)'
                    : pkg.popular
                    ? 'rgba(22,22,28,0.95)'
                    : 'rgba(16,16,20,0.95)',
                }}
              >
                {(isSelected || pkg.popular || pkg.badge) && (
                  <div className={`font-mono text-[8px] uppercase tracking-[0.3em] text-center py-1.5 font-bold ${
                    isSelected ? 'bg-white text-black' : 'bg-white text-black'
                  }`}>
                    {isSelected ? '✓ Selected' : pkg.badge ?? 'Most Popular'}
                  </div>
                )}

                <div className="p-7 flex flex-col flex-grow">
                  <div className="mb-6">
                    <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-stone-500 block mb-2">
                      {pkg.name}
                    </span>
                    <p className="font-serif italic text-stone-400 text-base leading-snug">
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
                      <span className={`font-serif text-4xl font-bold transition-colors ${
                        isNJIT ? 'text-emerald-300' : 'text-white'
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
                      <span className="font-mono text-[9px] text-stone-600 line-through mt-0.5 block">
                        Public: ${pkg.publicPrice}
                      </span>
                    )}
                  </div>

                  {/* Specs */}
                  <div className="flex flex-col gap-2 mb-6">
                    {[
                      { label: 'Time',     value: pkg.duration },
                      { label: 'Photos',   value: pkg.photos },
                      { label: 'Delivery', value: pkg.turnaround },
                    ].map((spec) => (
                      <div key={spec.label} className="flex items-start gap-2">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-stone-600 w-16 flex-shrink-0 mt-0.5">
                          {spec.label}
                        </span>
                        <span className="font-mono text-[10px] text-stone-300 leading-snug">{spec.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6 flex-grow">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-stone-300 text-sm leading-snug">
                        <span className="text-white mt-0.5 flex-shrink-0 text-xs">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Recommended */}
                  <div className="pt-4 border-t border-white/8 mb-6">
                    <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-stone-600 block mb-1">
                      Ideal for
                    </span>
                    <p className="font-mono text-[9px] text-stone-400 leading-relaxed">
                      {pkg.recommended}
                    </p>
                  </div>

                  <button
                    onClick={() => handleBookPackage(pkg.name, price)}
                    className={`w-full text-center font-mono text-[10px] uppercase tracking-[0.25em] py-3 rounded-lg transition-all duration-200 ${
                      isSelected
                        ? 'bg-white text-black'
                        : pkg.popular
                        ? 'bg-white text-black hover:bg-stone-200'
                        : 'border border-white/20 text-stone-300 hover:border-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isSelected ? '✓ Selected — scroll down' : `Book ${pkg.name}`}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Specialty services ────────────────────────────────────── */}
      {serviceType === 'specialty' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {SPECIALTY_SERVICES.map((svc) => {
            const pkgLabel   = `Specialty · ${svc.name} (from $${svc.njitPrice} NJIT / $${svc.publicPrice} public)`
            const isSelected = selectedPkg === pkgLabel

            return (
              <div
                key={svc.name}
                className={`relative flex flex-col rounded-xl border transition-all duration-300 overflow-hidden ${
                  isSelected ? 'border-white/40 ring-1 ring-white/20' : 'border-white/10'
                }`}
                style={{ backgroundColor: 'rgba(16,16,20,0.95)' }}
              >
                {(svc.badge || isSelected) && (
                  <div className="bg-white text-black font-mono text-[8px] uppercase tracking-[0.3em] text-center py-1.5 font-bold">
                    {isSelected ? '✓ Selected' : svc.badge}
                  </div>
                )}

                <div className="p-7 flex flex-col flex-grow">
                  <div className="mb-5">
                    <h3 className="font-serif text-xl text-white mb-1">{svc.name}</h3>
                    <p className="font-serif italic text-stone-400 text-sm">{svc.tagline}</p>
                  </div>

                  <div className="mb-5 pb-5 border-b border-white/8">
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="font-mono text-[8px] text-stone-600 uppercase tracking-widest block mb-0.5">NJIT</span>
                        <span className="font-serif text-2xl font-bold text-emerald-300">${svc.njitPrice}</span>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div>
                        <span className="font-mono text-[8px] text-stone-600 uppercase tracking-widest block mb-0.5">Public</span>
                        <span className="font-serif text-2xl font-bold text-stone-400">${svc.publicPrice}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mb-5">
                    {[
                      { label: 'Time',     value: svc.duration },
                      { label: 'Photos',   value: svc.photos },
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

                  <p className="text-stone-400 text-sm leading-relaxed flex-grow mb-6">{svc.note}</p>

                  <button
                    onClick={() => {
                      setSelectedPkg(pkgLabel)
                      setTimeout(() => {
                        document.getElementById('booking-cta')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }, 50)
                    }}
                    className={`w-full text-center font-mono text-[10px] uppercase tracking-[0.25em] py-3 rounded-lg transition-all duration-200 ${
                      isSelected
                        ? 'bg-white text-black'
                        : 'border border-white/20 text-stone-300 hover:border-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isSelected ? '✓ Selected — scroll down' : `Inquire about ${svc.name}`}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add-ons reference ─────────────────────────────────────── */}
      <div className="mb-20">
        <div className="mb-6 pb-4 border-b border-white/10">
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-400 border-l-2 border-stone-500 pl-4">
            Add-Ons // Available for any package
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ADD_ONS.map((addon) => (
            <div
              key={addon.label}
              className="flex items-center justify-between px-4 py-3 rounded-lg border border-white/8"
              style={{ backgroundColor: 'rgba(20,20,24,0.6)' }}
            >
              <span className="font-mono text-[10px] text-stone-300 uppercase tracking-[0.15em] leading-snug">
                {addon.label}
              </span>
              <span className="font-mono text-[10px] text-white font-bold ml-4 flex-shrink-0">
                {addon.price}
              </span>
            </div>
          ))}
        </div>
        <p className="font-mono text-[9px] text-stone-600 uppercase tracking-widest mt-4">
          Photobooks fulfilled through Pixieset · Physical prints via pro lab · Framing resources provided on delivery
        </p>
      </div>

      {/* ── Booking CTA ───────────────────────────────────────────── */}
      <div id="booking-cta" className="text-center py-16 border-t border-white/10 scroll-mt-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-stone-500 block mb-4">
          Ready to book?
        </span>
        <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
          Let's make something worth keeping.
        </h2>
        <p className="font-mono text-[10px] text-stone-400 uppercase tracking-widest mb-2 max-w-md mx-auto leading-relaxed">
          Send an inquiry and I'll follow up within 24 hours to confirm availability and details.
        </p>
        {selectedPkg && (
          <p className="font-mono text-[10px] text-stone-300 uppercase tracking-widest mb-8 max-w-lg mx-auto">
            Selected: {selectedPkg}
          </p>
        )}
        <div className="flex justify-center">
          <BookingSection
            selectedPackage={selectedPkg}
            triggerLabel={selectedPkg ? 'Send Inquiry' : 'Book a Session'}
          />
        </div>
      </div>
    </div>
  )
}