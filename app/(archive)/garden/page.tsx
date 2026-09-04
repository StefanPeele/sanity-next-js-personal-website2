import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { gardenQuery } from '@/sanity/lib/queries'
import { GardenClient } from '@/components/garden/GardenClient'
import { CustomPortableText } from '@/components/CustomPortableText'
import { JsonLd } from '@/components/JsonLd'
import { buildWikiIndex, resolveWikiLinks } from '@/components/knowledge/WikiLinks'
import { portableTextToPlain } from '@/lib/reading'
import { absoluteUrl } from '@/lib/site'
import type { GardenNote, GardenNoteView, GardenTag } from '@/components/garden/types'
import type { GardenQueryResult } from '@/sanity.types'
import type { PortableTextBlock } from 'next-sanity'
// app/(archive)/garden/page.tsx

export const metadata: Metadata = {
  title: 'The Garden | Stefan Peele',
  description:
    'A digital garden — notes, ideas, and developing thoughts on networking, infrastructure, and photography. Shorter and rougher than blog posts. Allowed to be incomplete.',
  alternates: { canonical: '/garden' },
}

type RawNote = GardenQueryResult['notes'][number]

export default async function GardenPage() {
  const { data } = await sanityFetch({ query: gardenQuery })
  const rawNotes: RawNote[] = data?.notes ?? []
  const tags = (data?.tags ?? []) as GardenTag[]

  // [[wiki links]] resolve against every note title/slug.
  const wikiIndex = buildWikiIndex(rawNotes)

  // Note bodies are rendered here on the server and handed to the client component as ReactNodes,
  // so the full block renderer (which imports server-only code) never enters the client bundle.
  const notes: GardenNoteView[] = rawNotes
    .filter((n) => n.slug && n.title)
    .map((n) => {
      const { body, ...rest } = n
      const blocks = Array.isArray(body) && body.length > 0 ? resolveWikiLinks(body, wikiIndex) : null
      return {
        ...(rest as unknown as GardenNote),
        plain: portableTextToPlain(body as never),
        rendered: blocks ? (
          <CustomPortableText value={blocks as PortableTextBlock[]} paragraphClasses="mb-4 leading-relaxed text-stone-300 text-sm" />
        ) : null,
      }
    })

  // Already sorted by lastTended desc in the query.
  const recentlyTended = notes.slice(0, 5)

  const noteCount = notes.length
  const evergreenCount = notes.filter((n) => n.status === 'evergreen').length
  const usedTagCount = tags.filter((t) => (t.count ?? 0) > 0).length

  return (
    <div className="relative min-h-screen text-stone-300">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'The Garden',
          url: absoluteUrl('/garden'),
          description: metadata.description,
          hasPart: notes.slice(0, 50).map((n) => ({
            '@type': 'CreativeWork',
            name: n.title,
            url: absoluteUrl(`/garden/${n.slug}`),
            dateModified: n.lastTended,
          })),
        }}
      />
      <main id="content" className="relative max-w-4xl mx-auto px-6 pt-32 pb-24">
        <header className="mb-12 border-b border-white/5 pb-12">
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block mb-4 border-l border-stone-700 pl-4">
            Editorial // The Garden
          </span>
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-none mb-4">
            The Garden<span className="text-stone-600">.</span>
          </h1>
          <p className="text-stone-400 text-base leading-relaxed max-w-2xl mb-6">
            Notes are unfinished by design. A seedling is an idea worth capturing. A growing note is being
            developed. An evergreen note is worth returning to. This is where thinking happens before it becomes a post.
          </p>
          <dl className="flex gap-6">
            {[
              { label: 'Total notes', value: noteCount },
              { label: 'Evergreen', value: evergreenCount },
              { label: 'Tags in use', value: usedTagCount },
            ].map((s) => (
              <div key={s.label}>
                <dd className="font-serif text-3xl text-white font-bold">{s.value}</dd>
                <dt className="font-mono text-[9px] uppercase tracking-widest text-stone-500 mt-0.5">{s.label}</dt>
              </div>
            ))}
          </dl>
        </header>

        {noteCount > 0 ? (
          <Suspense fallback={null}>
            <GardenClient notes={notes} tags={tags} recentlyTended={recentlyTended} />
          </Suspense>
        ) : (
          <div className="py-24 text-center border border-white/5 rounded-xl">
            <p className="font-serif italic text-stone-400 text-lg mb-2">The garden is empty.</p>
            <p className="font-mono text-[9px] text-stone-500 uppercase tracking-widest">
              Add your first note in Sanity Studio → Notes
            </p>
          </div>
        )}

        <nav className="mt-16 pt-8 border-t border-white/5 flex flex-wrap gap-6" aria-label="Related sections">
          <Link href="/blog" className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 hover:text-white transition-colors">
            ← Back to Editorial
          </Link>
          <Link href="/graph" className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 hover:text-white transition-colors">
            Knowledge Graph →
          </Link>
          <Link href="/paths" className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 hover:text-white transition-colors">
            Learning Paths →
          </Link>
        </nav>
      </main>
    </div>
  )
}
