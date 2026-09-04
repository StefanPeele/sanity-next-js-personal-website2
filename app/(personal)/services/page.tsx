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

export const metadata: Metadata = {
  title: 'Photography Services',
  description:
    'Consultation-first photography for NJIT affiliates, professionals, and organizations in Newark, NJ. Every session includes edited JPEGs, print-ready TIFFs, a social media pack, and a physical product.',
  alternates: { canonical: absoluteUrl('/services') },
}

const PROMISE_PILLARS = [
  {
    label: 'Time & presence',
    body: 'I arrive early, stay alert, and remain unobtrusive. Every package includes coverage time, travel, setup, and post-session buffer. You get what you paid for — and usually more.',
  },
  {
    label: 'Professional gear',
    body: 'Two camera bodies, full backup kit, dual-card recording. Technical failure is planned for — your coverage is never at risk.',
  },
  {
    label: 'Three-part delivery',
    body: 'Every session delivers edited JPEGs, print-ready TIFFs, and a social media pack as standard. Not as add-ons. Not tiered. Every client, every time.',
  },
]

const PHYSICAL_PRODUCTS_PREVIEW = [
  {
    tier: 'Core',
    description: 'Choose from framed prints, matted print sets, softcover photobooks, linen print boxes, and more.',
    color: 'border-white/15',
  },
  {
    tier: 'Premium',
    description: 'Choose from hardcover lay-flat photobooks, large archival framed prints, acrylic blocks, metal prints, leather portfolios, fine art cotton rag prints, backlit LED panels, and more.',
    color: 'border-amber-500/25',
  },
]

export default async function ServicesPage() {
  const [{ data: settings }, { data: testimonials }] = await Promise.all([
    sanityFetch({ query: settingsQuery }),
    sanityFetch({ query: testimonialsQuery }),
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
        <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-400 block mb-6 border-l border-stone-700 pl-4">
          Photography services // Stefan Peele
        </span>

        <div className="max-w-3xl mb-10">
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-white leading-none tracking-tight mb-6">
            Every moment<br />
            worth capturing,<br />
            captured right<span className="text-stone-500">.</span>
          </h1>
          <p className="text-stone-300 text-base md:text-lg leading-relaxed max-w-xl">
            Book a free consultation. We'll build your session around what you want to keep.
          </p>
        </div>

        <dl className="flex flex-wrap gap-8">
          {[
            { label: 'Free consultation', value: 'Always' },
            { label: 'Standard turnaround', value: '48 hrs' },
            { label: 'Starting at (NJIT)', value: Number.isFinite(lowest) ? formatPrice(lowest) : '—' },
            { label: 'Portrait sessions from', value: portraitFrom ? formatPrice(portraitFrom) : '—' },
          ].map((stat) => (
            <div key={stat.label}>
              <dd className="font-serif text-3xl text-white font-bold m-0">{stat.value}</dd>
              <dt className="font-mono text-[9px] uppercase tracking-widest text-stone-400 mt-1">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Packages ──────────────────────────────────────────────── */}
      <section className="py-20 border-b border-white/5" aria-labelledby="packages-heading">
        <div className="mb-10">
          <h2 id="packages-heading" className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-400 block mb-3 border-l border-stone-700 pl-4 font-sans">
            Packages // Choose your coverage
          </h2>
          <p className="text-stone-400 text-sm max-w-xl leading-relaxed pl-5">
            Every package starts with a free consultation. We build your session around what you want — then lock in the details.
          </p>
        </div>
        <ServicePackages calendlyUrl={calendlyUrl} />
      </section>

      {/* ── What you'll own ───────────────────────────────────────── */}
      <section className="py-20 border-b border-white/5" aria-labelledby="own-heading">
        <div className="mb-10">
          <h2 id="own-heading" className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-400 block mb-3 border-l border-stone-700 pl-4 font-sans">
            What you'll own // Beyond the gallery
          </h2>
          <p className="text-stone-400 text-sm max-w-2xl leading-relaxed pl-5">
            Every session includes a physical product — something you can hold, hang, or keep on a shelf.
            A digital gallery lives on your phone. A physical product lives in your home for decades.
            We'll find the right one during your consultation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {PHYSICAL_PRODUCTS_PREVIEW.map((tier) => (
            <div key={tier.tier} className={`p-6 rounded-xl border ${tier.color} bg-white/[0.02]`}>
              <span className={`font-mono text-[9px] uppercase tracking-[0.35em] block mb-3 ${tier.tier === 'Premium' ? 'text-amber-400/90' : 'text-stone-400'}`}>
                {tier.tier} — included
              </span>
              <p className="text-stone-300 text-sm leading-relaxed">{tier.description}</p>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-xl border border-white/[0.08] bg-white/[0.02]">
          <p className="font-serif text-stone-400 text-base leading-relaxed italic max-w-2xl">
            Every session can be extended into something physical — photo books, framed prints, matted portfolios, acrylic panels, engraved wood blocks, and more.
            We'll talk about what makes sense for you during your consultation.
          </p>
          <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest block mt-3">
            Pricing discussed during consultation · No hidden costs
          </span>
        </div>
      </section>

      {/* ── The promise ───────────────────────────────────────────── */}
      <section className="py-20 border-b border-white/5" aria-labelledby="promise-heading">
        <div className="mb-10">
          <h2 id="promise-heading" className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-400 block mb-3 border-l border-stone-700 pl-4 font-sans">
            The promise // What you're actually getting
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PROMISE_PILLARS.map((pillar) => (
            <div key={pillar.label} className="p-6 border border-white/10 rounded-xl bg-white/[0.02]">
              <h3 className="font-serif text-lg text-white mb-3">{pillar.label}</h3>
              <p className="text-stone-400 text-sm leading-relaxed">{pillar.body}</p>
            </div>
          ))}
        </div>

        <div className="p-8 border border-white/15 rounded-xl bg-white/[0.03] text-center">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-stone-400 block mb-3">Guarantee</span>
          <p className="font-serif text-2xl md:text-3xl text-white leading-snug max-w-2xl mx-auto">
            Satisfaction guaranteed — or I make it right. No questions asked.
          </p>
          <p className="font-mono text-[10px] text-stone-400 uppercase tracking-widest mt-4">
            No ghosting · No excuses · Just communication and solutions
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-white/5" aria-labelledby="faq-heading">
        <div className="mb-10">
          <h2 id="faq-heading" className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-400 block mb-3 border-l border-stone-700 pl-4 font-sans">
            FAQ // Common questions
          </h2>
        </div>
        <div className="max-w-3xl">
          <ServiceFAQ />
        </div>
      </section>

      {/* ── Social proof — only when consented testimonials exist ── */}
      <Testimonials items={testimonials ?? []} />
    </div>
  )
}
