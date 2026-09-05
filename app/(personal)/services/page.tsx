// app/(personal)/services/page.tsx
import { ServicePackages } from '@/components/services/ServicePackages'
import { ServiceFAQ } from '@/components/services/ServiceFAQ'
import { Testimonials } from '@/components/services/Testimonials'
import { JsonLd } from '@/components/JsonLd'
import { PACKAGES, formatPrice, startingPrice } from '@/lib/pricing'
import { SITE, absoluteUrl } from '@/lib/site'
import { sanityFetch } from '@/sanity/lib/live'
import { settingsQuery, testimonialsQuery } from '@/sanity/lib/queries'
import type { Metadata } from 'next'
import { getCopy } from '@/lib/cms/loaders'
import { servicesPageQuery } from '@/sanity/lib/queries-services'
import { DEFAULT_SERVICES_PAGE } from '@/lib/cms/defaults/servicesPage'

export async function generateMetadata(): Promise<Metadata> {
  const h = (await getCopy(servicesPageQuery, DEFAULT_SERVICES_PAGE)).header
  return { title: h.metaTitle || h.title, description: h.metaDescription || h.lede, alternates: { canonical: absoluteUrl('/services') } }
}

export default async function ServicesPage() {
  const [{ data: settings }, { data: testimonials }, copy] = await Promise.all([
    sanityFetch({ query: settingsQuery }),
    sanityFetch({ query: testimonialsQuery }),
    getCopy(servicesPageQuery, DEFAULT_SERVICES_PAGE),
  ])
  const calendlyUrl = settings?.calendlyUrl || SITE.calendlyUrl || null
  const lowest = Math.min(...PACKAGES.map((p) => (typeof p.njitPrice === 'number' ? p.njitPrice : Infinity)))
  const portraitFrom = startingPrice('portrait', true)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Stefan Peele Photography',
    serviceType: 'Photography',
    provider: { '@type': 'Person', name: SITE.name, url: SITE.url },
    areaServed: { '@type': 'City', name: 'Newark', containedInPlace: { '@type': 'State', name: 'New Jersey' } },
    url: absoluteUrl('/services'),
    offers: PACKAGES.filter((p) => typeof p.publicPrice === 'number' && !p.comingSoon).map((p) => ({
      '@type': 'Offer',
      name: `${p.category === 'specialty' ? '' : `${p.category[0]!.toUpperCase()}${p.category.slice(1)} · `}${p.name}`,
      price: p.publicPrice,
      priceCurrency: 'USD',
      description: p.tagline,
    })),
  }

  return (
    <div className="min-h-screen text-stone-300">
      <JsonLd data={jsonLd} />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="pt-16 pb-20 border-b border-white/5">
        <div className="max-w-3xl mb-10">
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-white leading-none tracking-tight mb-6 whitespace-pre-line">{copy.header.title}</h1>
          <p className="text-stone-300 text-base md:text-lg leading-relaxed max-w-xl">{copy.header.lede}</p>
        </div>

        <dl className="flex flex-wrap gap-8">
          {copy.stats.map((stat) => {
            const value = stat.valueSource === 'lowestNjit' ? (Number.isFinite(lowest) ? formatPrice(lowest) : '—') : stat.valueSource === 'portraitFrom' ? (portraitFrom ? formatPrice(portraitFrom) : '—') : stat.value
            return (
              <div key={stat.label}>
                <dd className="font-serif text-3xl text-white font-bold m-0">{value}</dd>
                <dt className="font-sans text-sm text-stone-400 mt-1">{stat.label}</dt>
              </div>
            )
          })}
        </dl>
      </section>

      {/* ── Packages ──────────────────────────────────────────────── */}
      {copy.packages.enabled && <section className="py-20 border-b border-white/5" aria-labelledby="packages-heading">
        <div className="mb-10">
          <h2 id="packages-heading" className="text-3xl font-serif font-bold text-white mb-3">{copy.packages.heading}</h2>
          {copy.packages.lede && <p className="text-stone-400 text-base max-w-xl leading-relaxed">{copy.packages.lede}</p>}
        </div>
        <ServicePackages calendlyUrl={calendlyUrl} copy={copy} />
      </section>}

      {/* ── What you'll own ───────────────────────────────────────── */}
      {copy.physicalProducts.enabled && <section className="py-20 border-b border-white/5" aria-labelledby="own-heading">
        <div className="mb-10">
          <h2 id="own-heading" className="text-3xl font-serif font-bold text-white mb-3">{copy.physicalProducts.heading}</h2>
          <p className="text-stone-400 text-base max-w-2xl leading-relaxed">{copy.physicalProducts.lede}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {copy.physicalProducts.tiers.map((tier) => (
            <div key={tier.tier} className={`p-6 rounded-xl border ${tier.tier === 'premium' ? 'border-amber-500/25' : 'border-white/15'} bg-white/[0.02]`}>
              <span className={`font-sans text-sm block mb-3 ${tier.tier === 'premium' ? 'text-amber-300' : 'text-stone-300'}`}>
                {tier.label} · {copy.physicalProducts.includedLabel}
              </span>
              <p className="text-stone-300 text-sm leading-relaxed">{tier.description}</p>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-xl border border-white/[0.08] bg-white/[0.02]">
          <p className="font-serif text-stone-400 text-base leading-relaxed italic max-w-2xl">{copy.physicalProducts.note}</p>
          <span className="font-sans text-sm text-stone-400 block mt-3">{copy.physicalProducts.noteSub}</span>
        </div>
      </section>}

      {/* ── The promise ───────────────────────────────────────────── */}
      {copy.promise.enabled && <section className="py-20 border-b border-white/5" aria-labelledby="promise-heading">
        <div className="mb-10">
          <h2 id="promise-heading" className="text-3xl font-serif font-bold text-white">{copy.promise.heading}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {copy.promise.pillars.map((pillar) => (
            <div key={pillar.label} className="p-6 border border-white/10 rounded-xl bg-white/[0.02]">
              <h3 className="font-serif text-lg text-white mb-3">{pillar.label}</h3>
              <p className="text-stone-400 text-sm leading-relaxed">{pillar.body}</p>
            </div>
          ))}
        </div>

        <div className="p-8 border border-white/15 rounded-xl bg-white/[0.03] text-center">
          <span className="section-label block mb-3">{copy.promise.guarantee.label}</span>
          <p className="font-serif text-2xl md:text-3xl text-white leading-snug max-w-2xl mx-auto">{copy.promise.guarantee.headline}</p>
          <p className="font-sans text-sm text-stone-400 mt-4">{copy.promise.guarantee.subline}</p>
        </div>
      </section>}

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      {copy.faq.enabled && copy.faq.items.length > 0 && <section className="py-20 border-b border-white/5" aria-labelledby="faq-heading">
        <div className="mb-10">
          <h2 id="faq-heading" className="text-3xl font-serif font-bold text-white">{copy.faq.heading}</h2>
        </div>
        <div className="max-w-3xl">
          <ServiceFAQ items={copy.faq.items} />
        </div>
      </section>}

      {copy.testimonials.enabled && <Testimonials items={testimonials ?? []} heading={copy.testimonials.heading} />}
    </div>
  )
}
