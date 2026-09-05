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
import { getCopy } from '@/lib/cms/loaders'
import { knowledgePagesQuery } from '@/sanity/lib/queries-article-ui'
import { DEFAULT_KNOWLEDGE_PAGES } from '@/lib/cms/defaults/knowledgePages'
import { navHref } from '@/lib/cms/defaults/navigation'
// app/(archive)/garden/page.tsx

export async function generateMetadata(): Promise<Metadata> {
  const all = await getCopy(knowledgePagesQuery, DEFAULT_KNOWLEDGE_PAGES)
  const h = all.garden.header
  return { title: h.metaTitle || h.title, description: h.metaDescription || h.lede }
}

type RawNote = GardenQueryResult['notes'][number]

export default async function GardenPage() {
  const copy = (await getCopy(knowledgePagesQuery, DEFAULT_KNOWLEDGE_PAGES)).garden
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
          description: copy.header.metaDescription || copy.header.lede,
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
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-none mb-4">{copy.header.title}</h1>
          <p className="text-stone-400 text-base leading-relaxed max-w-2xl mb-6">{copy.header.lede}</p>
          <dl className="flex gap-6">
            {[
              { label: copy.stats.notes, value: noteCount },
              { label: copy.stats.evergreen, value: evergreenCount },
              { label: copy.stats.tags, value: usedTagCount },
            ].map((s) => (
              <div key={s.label}>
                <dd className="font-serif text-3xl text-white font-bold">{s.value}</dd>
                <dt className="font-sans text-sm text-stone-400 mt-0.5">{s.label}</dt>
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
