import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { libraryQuery } from '@/sanity/lib/queries'
import { LibraryClient } from '@/components/library/LibraryClient'
import { JsonLd } from '@/components/JsonLd'
import { absoluteUrl } from '@/lib/site'
import type { LibraryItem } from '@/components/library/types'
import { getCopy } from '@/lib/cms/loaders'
import { knowledgePagesQuery } from '@/sanity/lib/queries-article-ui'
import { DEFAULT_KNOWLEDGE_PAGES } from '@/lib/cms/defaults/knowledgePages'
import { navHref } from '@/lib/cms/defaults/navigation'
// app/(archive)/library/page.tsx

export async function generateMetadata(): Promise<Metadata> {
  const all = await getCopy(knowledgePagesQuery, DEFAULT_KNOWLEDGE_PAGES)
  const h = all.library.header
  return { title: h.metaTitle || h.title, description: h.metaDescription || h.lede }
}

export default async function LibraryPage() {
  const copy = (await getCopy(knowledgePagesQuery, DEFAULT_KNOWLEDGE_PAGES)).library
  const { data } = await sanityFetch({ query: libraryQuery })
  const items = ((data ?? []) as unknown as LibraryItem[]).filter((i) => i.title)

  const finished = items.filter((i) => i.status === 'finished').length
  const current = items.filter((i) => i.status === 'current').length
  const changedThinking = items.filter((i) => i.rating === 'changed-thinking').length
  const influenced = items.filter((i) => (i.influencedPosts?.length ?? 0) + (i.influencedNotes?.length ?? 0) > 0).length

  return (
    <div className="relative min-h-screen text-stone-300">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Library',
          url: absoluteUrl('/library'),
          description: copy.header.metaDescription || copy.header.lede,
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: items.length,
            itemListElement: items.slice(0, 50).map((i, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              item: { '@type': i.mediaType === 'book' ? 'Book' : 'CreativeWork', name: i.title, author: i.author ?? undefined, url: i.url ?? undefined },
            })),
          },
        }}
      />
      <main id="content" className="relative max-w-4xl mx-auto px-6 pt-32 pb-24">
        <header className="mb-12 border-b border-white/5 pb-10">
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-none mb-4">{copy.header.title}</h1>
          <p className="text-stone-400 text-base leading-relaxed max-w-2xl">{copy.header.lede}</p>
          <dl className="flex flex-wrap gap-6 mt-6">
            {[
              { label: copy.stats.total, value: items.length },
              { label: copy.stats.finished, value: finished },
              { label: copy.stats.current, value: current },
              { label: copy.stats.changedThinking, value: changedThinking },
              { label: copy.stats.influenced, value: influenced },
            ].map((stat) => (
              <div key={stat.label}>
                <dd className="font-serif text-3xl text-white font-bold">{stat.value}</dd>
                <dt className="font-sans text-sm text-stone-400 mt-0.5">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </header>

        {items.length > 0 ? (
          <LibraryClient items={items} />
        ) : (
          <div className="py-24 text-center border border-white/5 rounded-xl">
            <p className="font-serif italic text-stone-400 text-lg mb-2">{copy.emptyState.title}</p>
            <p className="font-sans text-sm text-stone-400">{copy.emptyState.hint}</p>
          </div>
        )}

<nav className="mt-16 pt-8 border-t border-white/5 flex flex-wrap gap-6" aria-label="Related sections">
          {copy.relatedNav.map((l) => (
            <Link key={navHref(l) + l.label} href={navHref(l)} className="font-sans text-sm text-stone-400 hover:text-white transition-colors">{l.label}</Link>
          ))}
        </nav>
      </main>
    </div>
  )
}
