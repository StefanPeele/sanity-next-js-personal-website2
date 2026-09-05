// app/(personal)/uses/page.tsx
// HARD-CODED CONTENT. Stefan: replace every "[Add: …]" placeholder with the real
// item, or delete the line. Nothing here is invented — unknown gear is marked.

import { SITE, absoluteUrl } from '@/lib/site'
import type { Metadata } from 'next'
import { getCopy } from '@/lib/cms/loaders'
import { personalPagesQuery } from '@/sanity/lib/queries-services'
import { DEFAULT_PERSONAL_PAGES } from '@/lib/cms/defaults/personalPages'

export async function generateMetadata(): Promise<Metadata> {
  const h = (await getCopy(personalPagesQuery, DEFAULT_PERSONAL_PAGES)).uses.header
  return { title: h.metaTitle || h.title, description: h.metaDescription || h.lede }
}

export default async function UsesPage() {
  const copy = (await getCopy(personalPagesQuery, DEFAULT_PERSONAL_PAGES)).uses
  const SECTIONS = copy.sections
  return (
    <div className="w-full min-h-screen text-stone-300 pb-24">
      <div className="max-w-4xl mx-auto pt-24">
        <header className="pb-10 border-b border-white/5 mb-4">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight">{copy.header.title}</h1>
          <p className="mt-6 text-stone-400 text-base max-w-xl leading-relaxed">{copy.header.lede}</p>
        </header>

        {SECTIONS.map((section) => (
          <section key={section.title} aria-labelledby={`uses-${section.title}`} className="py-10 border-b border-white/5 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8">
            <h2 id={`uses-${section.title}`} className="md:col-span-4 section-label pt-1">{section.title}</h2>
            <dl className="md:col-span-8 space-y-4 m-0">
              {section.items.map((item) => (
                <div key={item.name}>
                  <dt className="text-white font-serif text-lg">{item.url ? <a href={item.url} className="hover:text-stone-200 underline underline-offset-4 decoration-stone-700" target="_blank" rel="noopener noreferrer">{item.name}</a> : item.name}</dt>
                  {item.note && (
                    <dd className={`text-sm m-0 mt-0.5 leading-relaxed ${item.note.startsWith('[Add:') ? 'font-sans text-xs text-amber-300/90 border border-dashed border-amber-500/30 rounded px-2 py-1 inline-block' : 'text-stone-400'}`}>
                      {item.note}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  )
}
