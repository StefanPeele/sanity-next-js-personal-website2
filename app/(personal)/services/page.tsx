import { ServicePackages } from '@/components/services/ServicePackages'
import { ServiceFAQ } from '@/components/services/ServiceFAQ'
import type { Metadata } from 'next'
// app/(personal)/services/page.tsx

export const metadata: Metadata = {
  title: 'Photography Services | Stefan Peele',
  description:
    'Consultation-first photography for NJIT affiliates, professionals, and organizations. Every session includes edited JPEGs, print-ready TIFFs, a social media pack, and a physical product.',
}

const PROMISE_PILLARS = [
  {
    label: 'Time & Presence',
    icon: '🕒',
    body: 'I arrive early, stay alert, and remain unobtrusive. Every package includes coverage time, travel, setup, and post-session buffer. You get what you paid for — and usually more.',
  },
  {
    label: 'Professional Gear',
    icon: '📷',
    body: 'Two camera bodies, full backup kit, dual-card recording. Technical failure is planned for — your coverage is never at risk.',
  },
  {
    label: 'Three-Part Delivery',
    icon: '📦',
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

export default function ServicesPage() {
  return (
    <div className="min-h-screen text-stone-300">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="pt-16 pb-20 border-b border-white/5">
        <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block mb-6 border-l border-stone-700 pl-4">
          Photography Services // Stefan Peele
        </span>

        <div className="max-w-3xl mb-10">
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-white leading-none tracking-tight mb-6">
            Every moment<br />
            worth capturing,<span className="text-stone-600">.</span><br />
            captured right<span className="text-stone-600">.</span>
          </h1>
          <p className="text-stone-300 text-base md:text-lg leading-relaxed max-w-xl">
            Book a free consultation. We'll build your session around what you want to keep.
          </p>
        </div>

        <div className="flex flex-wrap gap-8">
          {[
            { label: 'Free consultation', value: 'Always' },
            { label: 'Standard turnaround', value: '48hrs' },
            { label: 'Starting at', value: '$180' },
            { label: 'Guarantee', value: '100%' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-serif text-3xl text-white font-bold">{stat.value}</div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-stone-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Packages ──────────────────────────────────────────────── */}
      <section className="py-20 border-b border-white/5">
        <div className="mb-10">
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block mb-3 border-l border-stone-700 pl-4">
            Packages // Choose Your Coverage
          </span>
          <p className="text-stone-400 text-sm max-w-xl leading-relaxed pl-5">
            Every package starts with a free consultation. We build your session around what you want — then lock in the details.
          </p>
        </div>
        <ServicePackages />
      </section>

      {/* ── What You'll Own ───────────────────────────────────────── */}
      <section className="py-20 border-b border-white/5">
        <div className="mb-10">
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block mb-3 border-l border-stone-700 pl-4">
            What You'll Own // Beyond the Gallery
          </span>
          <p className="text-stone-400 text-sm max-w-2xl leading-relaxed pl-5">
            Every session includes a physical product — something you can hold, hang, or keep on a shelf.
            A digital gallery lives on your phone. A physical product lives in your home for decades.
            We'll find the right one during your consultation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {PHYSICAL_PRODUCTS_PREVIEW.map((tier) => (
            <div
              key={tier.tier}
              className={`p-6 rounded-xl border ${tier.color} bg-white/[0.02]`}
            >
              <span className={`font-mono text-[9px] uppercase tracking-[0.35em] block mb-3 ${
                tier.tier === 'Premium' ? 'text-amber-500/70' : 'text-stone-500'
              }`}>
                {tier.tier} — included
              </span>
              <p className="text-stone-300 text-sm leading-relaxed">
                {tier.description}
              </p>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-xl border border-white/8 bg-white/[0.02]">
          <p className="font-serif text-stone-400 text-base leading-relaxed italic max-w-2xl">
            "Every session can be extended into something physical — photo books, framed prints, matted portfolios, acrylic panels, engraved wood blocks, and more.
            We'll talk about what makes sense for you during your consultation."
          </p>
          <span className="font-mono text-[9px] text-stone-700 uppercase tracking-widest block mt-3">
            Pricing discussed during consultation · No hidden costs
          </span>
        </div>
      </section>

      {/* ── The Promise ───────────────────────────────────────────── */}
      <section className="py-20 border-b border-white/5">
        <div className="mb-10">
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block mb-3 border-l border-stone-700 pl-4">
            The Promise // What You're Actually Getting
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PROMISE_PILLARS.map((pillar) => (
            <div
              key={pillar.label}
              className="p-6 border border-white/10 rounded-xl bg-white/[0.02]"
            >
              <div className="text-2xl mb-4">{pillar.icon}</div>
              <h3 className="font-serif text-lg text-white mb-3">{pillar.label}</h3>
              <p className="text-stone-400 text-sm leading-relaxed">{pillar.body}</p>
            </div>
          ))}
        </div>

        <div className="p-8 border border-white/15 rounded-xl bg-white/[0.03] text-center">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-stone-500 block mb-3">
            Guarantee
          </span>
          <p className="font-serif text-2xl md:text-3xl text-white leading-snug max-w-2xl mx-auto">
            Satisfaction guaranteed — or I make it right. No questions asked.
          </p>
          <p className="font-mono text-[10px] text-stone-500 uppercase tracking-widest mt-4">
            No ghosting · No excuses · Just communication and solutions
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-white/5">
        <div className="mb-10">
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block mb-3 border-l border-stone-700 pl-4">
            FAQ // Common Questions
          </span>
        </div>
        <div className="max-w-3xl">
          <ServiceFAQ />
        </div>
      </section>

      {/* ── Social proof ──────────────────────────────────────────── */}
      <section className="py-20 border-b border-white/5">
        <div className="mb-10">
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block border-l border-stone-700 pl-4">
            Clients // What They Said
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 border border-white/8 rounded-xl bg-white/[0.02] min-h-[160px] flex flex-col justify-between"
            >
              <div className="h-3 w-3/4 bg-white/5 rounded-sm mb-3 animate-pulse" />
              <div className="h-3 w-full bg-white/5 rounded-sm mb-2 animate-pulse" />
              <div className="h-3 w-2/3 bg-white/5 rounded-sm mb-6 animate-pulse" />
              <div className="h-2 w-24 bg-white/5 rounded-sm animate-pulse" />
            </div>
          ))}
        </div>
        <p className="font-mono text-[9px] text-stone-700 uppercase tracking-widest text-center mt-6">
          Testimonials coming soon
        </p>
      </section>

    </div>
  )
}