import { sanityFetch } from '@/sanity/lib/live'
import { allSeriesQuery } from '@/sanity/lib/queries'
import { JsonLd } from '@/components/JsonLd'
import { SITE, absoluteUrl } from '@/lib/site'
import { formatDate } from '@/lib/dates'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCopy } from '@/lib/cms/loaders'
import { knowledgePagesQuery } from '@/sanity/lib/queries-article-ui'
import { DEFAULT_KNOWLEDGE_PAGES } from '@/lib/cms/defaults/knowledgePages'
import { navHref } from '@/lib/cms/defaults/navigation'
// app/(archive)/blog/series/page.tsx
// Every series with its parts, status and how far along it is.

export async function generateMetadata(): Promise<Metadata> {
  const all = await getCopy(knowledgePagesQuery, DEFAULT_KNOWLEDGE_PAGES)
  const h = all.series.header
  return { title: h.metaTitle || h.title, description: h.metaDescription || h.lede }
}

const STATUS: Record<string, { label: string; className: string }> = {
  'in-progress': { label: 'In progress', className: 'text-amber-400 border-amber-500/30' },
  'complete':    { label: 'Complete',    className: 'text-emerald-400 border-emerald-500/30' },
  'paused':      { label: 'Paused',      className: 'text-stone-400 border-stone-600' },
}

export default async function SeriesIndexPage() {
  const copy = (await getCopy(knowledgePagesQuery, DEFAULT_KNOWLEDGE_PAGES)).series
  const { data } = await sanityFetch({ query: allSeriesQuery })
  const series = (data ?? []).filter((s) => s.slug)

  return (
    <div className="relative min-h-screen text-stone-300">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Series',
        url: absoluteUrl('/blog/series'),
        isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url },
        hasPart: series.map((s) => ({ '@type': 'CreativeWorkSeries', name: s.title ?? undefined, url: absoluteUrl(`/blog/series/${s.slug}`) })),
      }} />

      <main id="content" className="relative max-w-5xl mx-auto px-6 pt-32 pb-24">
        <header className="mb-12 border-b border-white/5 pb-8">
          <Link href="/blog" className="font-sans text-sm text-stone-400 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded-sm">← {copy.backLabel}</Link>
          <h1 className="mt-6 text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-none">{copy.header.title}</h1>
          <p className="mt-4 max-w-xl font-sans text-base text-stone-400">{copy.header.lede}</p>
        </header>

        {series.length === 0 ? (
          <p className="font-sans text-sm text-stone-400">{copy.emptyState.title}</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {series.map((s) => {
              const parts = s.posts ?? []
              const published = parts.filter((p) => p.publishedAt).length
              const status = STATUS[s.status ?? 'in-progress'] ?? STATUS['in-progress']
              const latest = parts.map((p) => p.publishedAt).filter(Boolean).sort().at(-1)
              const pct = parts.length ? Math.round((published / parts.length) * 100) : 0
              return (
                <li key={s._id}>
                  <Link
                    href={`/blog/series/${s.slug}`}
                    className="group flex h-full flex-col gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 hover:border-white/20 hover:bg-white/[0.04] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`font-mono text-[9px] uppercase tracking-[0.3em] px-2.5 py-1 rounded-sm border ${status.className}`}>{status.label}</span>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500">{parts.length} part{parts.length !== 1 ? 's' : ''}</span>
                    </div>
                    <h2 className="font-serif text-2xl text-white leading-tight group-hover:text-stone-100">{s.title}</h2>
                    {s.description && <p className="font-sans text-sm text-stone-400 leading-relaxed">{s.description}</p>}
                    <div className="mt-auto pt-2">
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${published} of ${parts.length} parts published`}>
                        <div className="h-full bg-stone-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-widest text-stone-500">
                        <span>{published}/{parts.length} published</span>
                        {latest && <span>Updated {formatDate(latest, 'short')}</span>}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
