import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { libraryQuery } from '@/sanity/lib/queries'
import { LibraryClient } from '@/components/library/LibraryClient'
import { JsonLd } from '@/components/JsonLd'
import { absoluteUrl } from '@/lib/site'
import type { LibraryItem } from '@/components/library/types'
// app/(archive)/library/page.tsx

export const metadata: Metadata = {
  title: 'Library',
  description: "Books, articles, white papers, podcasts, and courses I've read, am reading, or want to read — and how they connect to my work.",
  alternates: { canonical: '/library' },
}

export default async function LibraryPage() {
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
          description: metadata.description,
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
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block mb-4 border-l border-stone-700 pl-4">
            Library // Reading Archive
          </span>
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-none mb-4">
            What I&apos;m Reading<span className="text-stone-600">.</span>
          </h1>
          <p className="text-stone-400 text-base leading-relaxed max-w-2xl">
            Books, articles, white papers, RFCs, podcasts, and courses — a transparent log of what enters my mind and how it connects to what I produce.
            Every entry has a one-sentence take; the good ones link to the post or note they shaped.
          </p>
          <dl className="flex flex-wrap gap-6 mt-6">
            {[
              { label: 'Total items', value: items.length },
              { label: 'Finished', value: finished },
              { label: 'Reading now', value: current },
              { label: 'Changed my thinking', value: changedThinking },
              { label: 'Shaped writing', value: influenced },
            ].map((stat) => (
              <div key={stat.label}>
                <dd className="font-serif text-3xl text-white font-bold">{stat.value}</dd>
                <dt className="font-mono text-[9px] uppercase tracking-widest text-stone-500 mt-0.5">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </header>

        {items.length > 0 ? (
          <LibraryClient items={items} />
        ) : (
          <div className="py-24 text-center border border-white/5 rounded-xl">
            <p className="font-serif italic text-stone-400 text-lg mb-2">The shelves are empty.</p>
            <p className="font-mono text-[9px] text-stone-500 uppercase tracking-widest">Add your first item in Sanity Studio → Library Items</p>
          </div>
        )}

        <nav className="mt-8 pt-8 border-t border-white/5 flex flex-wrap gap-6" aria-label="Related sections">
          <Link href="/blog" className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 hover:text-white transition-colors">← Back to Editorial</Link>
          <Link href="/garden" className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 hover:text-white transition-colors">The Garden →</Link>
          <Link href="/graph" className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 hover:text-white transition-colors">Knowledge Graph →</Link>
        </nav>
      </main>
    </div>
  )
}
