// components/services/Testimonials.tsx
// Server component. Renders nothing when there are no consented testimonials.

import Image from 'next/image'
import { formatDate } from '@/lib/dates'
import type { TestimonialsQueryResult } from '@/sanity.types'

export function Testimonials({ items, heading = 'What clients said' }: { items: TestimonialsQueryResult; heading?: string }) {
  const visible = items.filter((t) => t.quote && t.name)
  if (visible.length === 0) return null

  return (
    <section aria-labelledby="testimonials-heading" className="py-20 border-b border-white/5">
      <div className="mb-10">
        <h2 id="testimonials-heading" className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-400 block border-l border-stone-700 pl-4 font-sans">{heading}</h2>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 list-none m-0 p-0">
        {visible.map((t) => (
          <li key={t._id} className="p-6 border border-white/[0.08] rounded-xl bg-white/[0.02] flex flex-col justify-between">
            <blockquote className="font-serif text-stone-200 text-base leading-relaxed mb-6 m-0">
              “{t.quote}”
            </blockquote>
            <figcaption className="flex items-center gap-3">
              {t.photoUrl && (
                <Image
                  src={`${t.photoUrl}?w=96&h=96&fit=crop&auto=format`}
                  alt=""
                  width={40}
                  height={40}
                  className="rounded-full object-cover grayscale"
                />
              )}
              <div className="min-w-0">
                <span className="block text-white text-sm font-medium truncate">{t.name}</span>
                <span className="block font-mono text-[9px] uppercase tracking-widest text-stone-400 truncate">
                  {[t.service, t.role, formatDate(t.date, 'month')].filter(Boolean).join(' · ')}
                </span>
              </div>
            </figcaption>
          </li>
        ))}
      </ul>
    </section>
  )
}
