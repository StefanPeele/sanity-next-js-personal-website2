'use client'

// components/services/ServicePackages.tsx
// Package cards. All prices, deliverables and add-ons come from lib/pricing.
// "Schedule a consultation" opens calendlyUrl when one exists; otherwise it
// scrolls to the inquiry form (#inquiry). It never links to calendly.com's homepage.

import { useState } from 'react'
import BookingSection from '@/components/BookingSection'
import {
  ADD_ONS, CORE_PRODUCTS, PREMIUM_PRODUCTS, formatPrice, packagesByCategory, startingPrice,
  type PackageCategory, type PhysicalTier, type PricingPackage,
} from '@/lib/pricing'
import { DEFAULT_SERVICES_PAGE, type ServicesPageCopy } from '@/lib/cms/defaults/servicesPage'
import { Icon } from '@/lib/cms/icons'
import { FOCUS } from '@/lib/ui'

interface ServicePackagesProps {
  copy?: ServicesPageCopy
  calendlyUrl?: string | null
}

function scrollToInquiry() {
  const el = document.getElementById('inquiry')
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const first = el.querySelector<HTMLElement>('input, select, textarea, button')
  first?.focus({ preventScroll: true })
}

function PhysicalProductBadge({ tier, labels }: { tier: PhysicalTier; labels: ServicesPageCopy['physicalProducts']['chooserLabels'] }) {
  const products = tier === 'core' ? CORE_PRODUCTS : PREMIUM_PRODUCTS
  const label = tier === 'core' ? labels.core : labels.premium
  const premium = tier === 'premium'
  return (
    <div className={`rounded-lg border p-4 mb-6 ${premium ? 'border-amber-500/30 bg-amber-950/10' : 'border-white/15 bg-white/[0.03]'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon name={premium ? 'sparkles' : 'diamond'} size={14} className={premium ? 'text-amber-400' : 'text-stone-400'} />
        <span className={`font-sans text-xs font-bold ${premium ? 'text-amber-400' : 'text-stone-300'}`}>{label}</span>
      </div>
      <ul className="space-y-1.5">
        {products.map((product) => (
          <li key={product} className="flex items-start gap-2">
            <span className={`text-[10px] mt-0.5 flex-shrink-0 ${premium ? 'text-amber-500' : 'text-stone-400'}`} aria-hidden="true">—</span>
            <span className={`font-mono text-[9px] leading-snug ${premium ? 'text-stone-300' : 'text-stone-400'}`}>{product}</span>
          </li>
        ))}
      </ul>
      <p className={`font-mono text-[8px] uppercase tracking-widest mt-3 ${premium ? 'text-amber-400' : 'text-stone-400'}`}>
        {labels.final}
      </p>
    </div>
  )
}

function ConsultButton({ pkg, calendlyUrl, className, labels }: { pkg: PricingPackage; calendlyUrl?: string | null; className: string; labels?: { consultLabel: string; inquiryLabel: string } }) {
  const label = pkg.consultation ? (labels?.consultLabel ?? 'Schedule a consultation') : (labels?.inquiryLabel ?? 'Send inquiry')
  if (pkg.consultation && calendlyUrl) {
    return (
      <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" className={`${className} ${FOCUS} block`}>
        {label} <span aria-hidden="true">↗</span>
      </a>
    )
  }
  return (
    <button type="button" onClick={scrollToInquiry} className={`${className} ${FOCUS}`}>
      {label}
    </button>
  )
}

export function ServicePackages({ calendlyUrl, copy = DEFAULT_SERVICES_PAGE }: ServicePackagesProps) {
  const C = copy.packageCard
  const [category, setCategory] = useState<PackageCategory>('portrait')
  const [isNJIT, setIsNJIT] = useState(false)

  const packages = packagesByCategory(category)
  const fromPublic = startingPrice(category, false)
  const fromNjit = startingPrice(category, true)

  return (
    <div id="packages">
      {/* ── Service type tabs ─────────────────────────────────────── */}
      <div className="flex flex-col gap-6 mb-10">
        <div role="tablist" aria-label="Service type" className="flex flex-wrap gap-1 p-1 rounded-lg border border-white/10 bg-[#141418]/80">
          {(
            [
              { key: 'portrait', label: copy.tabLabels.portrait },
              { key: 'event', label: copy.tabLabels.event },
              { key: 'specialty', label: copy.tabLabels.specialty },
            ] as { key: PackageCategory; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={category === key}
              aria-controls={`packages-${key}`}
              onClick={() => setCategory(key)}
              className={`font-sans text-xs px-5 py-2.5 rounded-md transition-all duration-200 flex-1 sm:flex-none ${FOCUS} ${
                category === key ? 'bg-white text-black font-bold shadow-sm' : 'text-stone-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {category !== 'specialty' && (
          <button
            type="button"
            role="switch"
            aria-checked={isNJIT}
            onClick={() => setIsNJIT((v) => !v)}
            className={`w-full text-left rounded-xl border-2 transition-all duration-300 overflow-hidden ${FOCUS} ${
              isNJIT ? 'border-emerald-500/70 shadow-lg shadow-emerald-900/20 bg-[#102e20]/85' : 'border-white/20 hover:border-white/35 bg-[#19191e]/85'
            }`}
          >
            <div className="px-6 py-5 flex items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${isNJIT ? 'bg-emerald-500' : 'bg-white/20'}`} aria-hidden="true">
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${isNJIT ? 'translate-x-6' : 'translate-x-1'}`} />
                  </span>
                  <span className={`font-mono text-[11px] uppercase tracking-[0.3em] font-bold ${isNJIT ? 'text-emerald-300' : 'text-stone-200'}`}>
                    {copy.njitToggle.label}
                  </span>
                </div>
                <p className={`font-mono text-[10px] ${isNJIT ? 'text-emerald-300/90' : 'text-stone-400'}`}>
                  {isNJIT ? `${copy.njitToggle.savingsCopy[category]} · ${copy.njitToggle.idNote}` : copy.njitToggle.offText}
                </p>
              </div>
              {isNJIT && fromPublic !== null && fromNjit !== null && (
                <div className="hidden sm:block text-right flex-shrink-0">
                  <span className="font-mono text-[8px] text-stone-400 uppercase tracking-widest block line-through">From {formatPrice(fromPublic)}</span>
                  <span className="font-serif text-xl font-bold text-emerald-300">From {formatPrice(fromNjit)}</span>
                </div>
              )}
            </div>
          </button>
        )}
      </div>

      {/* ── Standard delivery banner ──────────────────────────────── */}
      {category !== 'specialty' && (
        <div className="mb-8 p-5 rounded-xl border border-white/10 bg-white/[0.02]">
          <span className="section-label block mb-3">{copy.standardDelivery.heading}</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {copy.standardDelivery.items.map((i) => ({ label: i.title, desc: i.description })).map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <Icon name="check" size={14} className="text-stone-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-sans text-xs text-stone-300 block mb-0.5">{item.label}</span>
                  <span className="font-mono text-[9px] text-stone-400 leading-snug block">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Package cards ─────────────────────────────────────────── */}
      <div id={`packages-${category}`} role="tabpanel" className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {packages.map((pkg) => {
          const specialty = pkg.category === 'specialty'
          const isCore = pkg.name === 'Core'
          const accent = specialty ? !!pkg.highlight : isCore
          const price = isNJIT ? pkg.njitPrice : pkg.publicPrice
          const badge = pkg.comingSoon ? C.expandingSoon : pkg.badge ?? (isCore ? C.recommended : C.available)

          return (
            <article
              key={pkg.id}
              aria-labelledby={`pkg-${pkg.id}`}
              className={`relative flex flex-col rounded-xl border transition-all duration-300 overflow-hidden ${
                pkg.comingSoon ? 'border-white/[0.08] bg-[#0e0e10]/95' : accent ? 'border-amber-500/40 shadow-lg shadow-amber-900/10 bg-[#18140c]/95' : 'border-white/10 bg-[#101014]/95'
              }`}
            >
              <div className={`font-sans text-xs text-center py-1.5 font-bold ${
                pkg.comingSoon ? 'bg-white/10 text-stone-400' : accent ? 'bg-amber-500 text-black' : 'bg-white/10 text-stone-300'
              }`}>
                {badge}
              </div>

              <div className={`p-7 flex flex-col flex-grow ${pkg.comingSoon ? 'grayscale' : ''}`}>
                <div className="mb-6">
                  <h3 id={`pkg-${pkg.id}`} className={specialty ? 'font-serif text-2xl text-white mb-1' : `font-sans text-xs mb-2 ${accent ? 'text-amber-500/80' : 'text-stone-400'}`}>
                    {pkg.name}
                  </h3>
                  <p className="font-serif italic text-stone-300 text-lg leading-snug">{pkg.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-6 pb-6 border-b border-white/[0.08]">
                  {specialty ? (
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest block mb-0.5">NJIT</span>
                        <span className={`font-serif text-3xl font-bold ${accent ? 'text-amber-300' : 'text-emerald-300'}`}>{formatPrice(pkg.njitPrice)}</span>
                      </div>
                      <div className="w-px h-8 bg-white/10" aria-hidden="true" />
                      <div>
                        <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest block mb-0.5">Public</span>
                        <span className={`font-serif text-3xl font-bold ${accent ? 'text-amber-300/80' : 'text-stone-300'}`}>{formatPrice(pkg.publicPrice)}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {pkg.priceNote === 'starting at' && (
                        <span className="font-sans text-xs text-stone-400 block mb-1">{C.startingAt}</span>
                      )}
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`font-serif text-5xl font-bold ${isNJIT ? 'text-emerald-300' : accent ? 'text-amber-300' : 'text-white'}`}>{formatPrice(price)}</span>
                        {isNJIT && <span className="font-sans text-xs text-emerald-400">{C.njitRate}</span>}
                      </div>
                      {isNJIT && (
                        <span className="font-sans text-xs text-stone-400 line-through mt-0.5 block">{C.publicLabel}: {formatPrice(pkg.publicPrice)}</span>
                      )}
                    </>
                  )}
                  <span className="font-mono text-[10px] text-stone-400 block mt-1.5">{pkg.duration}</span>
                  {pkg.turnaround && specialty && (
                    <span className="font-sans text-xs text-stone-400 block mt-0.5">{C.deliveryLabel}: {pkg.turnaround}</span>
                  )}
                </div>

                {specialty && pkg.note ? (
                  <p className="text-stone-300 text-sm leading-relaxed flex-grow mb-6">{pkg.note}</p>
                ) : (
                  <ul className="space-y-2.5 mb-6 flex-grow">
                    {pkg.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-stone-200 text-sm leading-snug">
                        <span className={`mt-0.5 flex-shrink-0 text-xs ${accent ? 'text-amber-500' : 'text-stone-400'}`} aria-hidden="true">✓</span>
                        <span>
                          {item}
                          {item.includes('in development') && (
                            <span className="font-mono text-[8px] text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-sm ml-2 align-middle">WIP</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {pkg.physicalProduct && <PhysicalProductBadge tier={pkg.physicalProduct} labels={copy.physicalProducts.chooserLabels} />}

                {pkg.recommended && (
                  <div className="pt-4 border-t border-white/[0.08] mb-6">
                    <span className="font-sans text-xs text-stone-400 block mb-1">{C.idealFor}</span>
                    <p className="font-mono text-[10px] text-stone-400 leading-relaxed">{pkg.recommended}</p>
                  </div>
                )}

                {specialty && pkg.highlight && (
                  <div className="mb-4 p-3 rounded-lg border border-amber-500/20 bg-amber-950/10">
                    <span className="font-sans text-xs text-amber-300 block mb-1">{C.includes}</span>
                    <span className="font-mono text-[9px] text-stone-300">Full three-part delivery + physical product of your choice</span>
                  </div>
                )}

                {pkg.comingSoon ? (
                  <button type="button" onClick={scrollToInquiry} className={`w-full text-center font-sans text-xs py-3.5 rounded-lg border border-white/15 text-stone-300 hover:border-white/40 hover:text-white transition-colors ${FOCUS}`}>
                    {C.expandingSoonNote}
                  </button>
                ) : (
                  <ConsultButton
                    pkg={pkg}
                    labels={C}
                    calendlyUrl={calendlyUrl}
                    className={`w-full text-center font-mono text-[11px] uppercase tracking-[0.25em] py-3.5 rounded-lg transition-all duration-200 font-bold ${
                      accent ? 'bg-amber-500 text-black hover:bg-amber-400' : pkg.consultation ? 'bg-white text-black hover:bg-stone-200' : 'border border-white/20 text-stone-300 hover:border-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  />
                )}
              </div>
            </article>
          )
        })}
      </div>

      {/* ── Add-ons ───────────────────────────────────────────────── */}
      <div className="mb-16">
        <div className="mb-6 pb-4 border-b border-white/10">
          <h3 className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-400 border-l-2 border-stone-500 pl-4 font-sans">
            {C.addOnsHeading} · {C.addOnsLede}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ADD_ONS.map((addon) => (
            <div key={addon.id} className="px-5 py-4 rounded-lg border border-white/[0.08] bg-[#141418]/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] text-stone-200 uppercase tracking-[0.15em] font-bold">{addon.label}</span>
                <span className="font-mono text-[10px] text-white font-bold ml-4 flex-shrink-0">{addon.price}</span>
              </div>
              <p className="font-mono text-[9px] text-stone-400 leading-relaxed">{addon.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Inline inquiry form ───────────────────────────────────── */}
      <div className="py-16 border-t border-white/10">
        <div className="text-center mb-8">
          <span className="section-label block mb-3">{C.inquiryEyebrow}</span>
          <h3 className="font-serif text-3xl text-white mb-3">{C.inquiryHeading}</h3>
          <p className="font-mono text-[10px] text-stone-400 uppercase tracking-widest max-w-md mx-auto leading-relaxed">
            {C.inquiryLede}
          </p>
        </div>
        <BookingSection inline anchorId="inquiry" />
      </div>
    </div>
  )
}
