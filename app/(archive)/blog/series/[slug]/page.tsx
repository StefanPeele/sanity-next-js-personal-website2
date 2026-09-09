import { client } from '@/sanity/lib/client'
import { sanityFetch } from '@/sanity/lib/live'
import { seriesBySlugQuery, slugsByTypeQuery } from '@/sanity/lib/queries'
import { JsonLd } from '@/components/JsonLd'
import { SITE, absoluteUrl, articleTypeMeta } from '@/lib/site'
import { formatDate } from '@/lib/dates'
import { readingTime } from '@/lib/reading'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { FOCUS } from '@/lib/ui'
// app/(archive)/blog/series/[slug]/page.tsx
// One series: description, status and its parts in reading order.

type Props = { params: Promise<{ slug: string }> }

const STATUS: Record<string, { label: string; className: string; note: string }> = {
  'in-progress': { label: 'In progress', className: 'text-amber-400 border-amber-500/30', note: 'More parts are coming.' },
  'complete':    { label: 'Complete',    className: 'text-emerald-400 border-emerald-500/30', note: 'All parts are published.' },
  'paused':      { label: 'Paused',      className: 'text-stone-400 border-stone-600', note: 'On hold for now.' },
}

export async function generateStaticParams() {
  const slugs = await client.fetch(slugsByTypeQuery, { type: 'series' })
  return slugs.filter((s) => s.slug).map(({ slug }) => ({ slug: slug! }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: series } = await sanityFetch({ query: seriesBySlugQuery, params: { slug }, stega: false })
  if (!series) return { title: 'Series Not Found' }
  const title = series.title ?? 'Series'
  const description = series.description ?? `${series.posts.length}-part series by ${SITE.name}.`
  const url = absoluteUrl(`/blog/series/${slug}`)
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website' },
  }
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params
  const { data: series } = await sanityFetch({ query: seriesBySlugQuery, params: { slug } })
  if (!series) notFound()

  const parts = series.posts.filter((p) => p.slug)
  const status = STATUS[series.status ?? 'in-progress'] ?? STATUS['in-progress']
  const totalMinutes = parts.reduce((sum, p) => sum + readingTime(p.wordCount ?? 0), 0)
  const url = absoluteUrl(`/blog/series/${slug}`)

  return (
    <div className="relative min-h-screen text-stone-300">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CreativeWorkSeries',
            name: series.title ?? undefined,
            description: series.description ?? undefined,
            url,
            author: { '@type': 'Person', name: SITE.name, url: SITE.url },
            hasPart: parts.map((p, i) => ({ '@type': 'BlogPosting', position: i + 1, headline: p.title ?? undefined, url: absoluteUrl(`/blog/${p.slug}`), datePublished: p.publishedAt ?? undefined })),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
              { '@type': 'ListItem', position: 2, name: 'Writing', item: absoluteUrl('/blog') },
              { '@type': 'ListItem', position: 3, name: 'Series', item: absoluteUrl('/blog/series') },
              { '@type': 'ListItem', position: 4, name: series.title ?? 'Series', item: url },
            ],
          },
        ],
      }} />

      <main id="content" className="relative max-w-4xl mx-auto px-6 pt-32 pb-24">
        <header className="mb-12 border-b border-white/5 pb-8">
          <Link href="/blog/series" className={`font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400 hover:text-white transition-colors ${FOCUS} rounded-sm`}>
            ← All series
          </Link>
          <div className="mt-6 mb-4 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-400 border-l border-stone-700 pl-4">Series</span>
            <span className={`font-mono text-[9px] uppercase tracking-[0.3em] px-2.5 py-1 rounded-sm border ${status.className}`}>{status.label}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-white leading-none">{series.title}</h1>
          {series.description && <p className="mt-5 max-w-2xl font-serif text-lg text-stone-300 leading-relaxed">{series.description}</p>}
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-stone-400">
            {parts.length} part{parts.length !== 1 ? 's' : ''} · ~{totalMinutes} min total · {status.note}
          </p>
        </header>

        {parts.length === 0 ? (
          <p className="font-mono text-[11px] uppercase tracking-widest text-stone-400">No parts published yet.</p>
        ) : (
          <ol className="space-y-4">
            {parts.map((p, i) => {
              const lane = articleTypeMeta(p.articleType)
              return (
                <li key={p._id}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className={`group flex gap-5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 hover:border-white/20 hover:bg-white/[0.04] transition-colors ${FOCUS}`}
                  >
                    <span className="font-serif text-3xl text-stone-400 group-hover:text-stone-300 leading-none w-10 flex-shrink-0 tabular-nums" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="sr-only">Part {i + 1}: </span>
                      <span className="flex flex-wrap items-center gap-2 mb-1.5 font-mono text-[9px] uppercase tracking-widest text-stone-400">
                        {lane && <span style={{ color: lane.color }}>{lane.label}</span>}
                        {p.publishedAt && <span>{formatDate(p.publishedAt, 'short')}</span>}
                        <span>{readingTime(p.wordCount ?? 0)} min</span>
                      </span>
                      <span className="block font-serif text-xl text-white leading-snug group-hover:text-stone-100">{p.title}</span>
                      {p.excerpt && <span className="block mt-2 font-sans text-sm text-stone-400 leading-relaxed line-clamp-2">{p.excerpt}</span>}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        )}
      </main>
    </div>
  )
}
