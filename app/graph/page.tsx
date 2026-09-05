import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { graphQuery } from '@/sanity/lib/queries'
import { Navbar } from '@/components/Navbar'
import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph'
import { JsonLd } from '@/components/JsonLd'
import { absoluteUrl } from '@/lib/site'
import { getCopy } from '@/lib/cms/loaders'
import { knowledgePagesQuery } from '@/sanity/lib/queries-article-ui'
import { DEFAULT_KNOWLEDGE_PAGES } from '@/lib/cms/defaults/knowledgePages'
// app/graph/page.tsx
// Full-bleed graph page — outside (archive) layout for full viewport use.

export async function generateMetadata(): Promise<Metadata> {
  const h = (await getCopy(knowledgePagesQuery, DEFAULT_KNOWLEDGE_PAGES)).graph.header
  return { title: h.metaTitle || h.title, description: h.metaDescription || h.lede }
}

export default async function GraphPage() {
  const copy = (await getCopy(knowledgePagesQuery, DEFAULT_KNOWLEDGE_PAGES)).graph
  const { data } = await sanityFetch({ query: graphQuery, stega: false })

  const graph = {
    posts: (data?.posts ?? []).filter((p) => p._id && p.title),
    notes: (data?.notes ?? []).filter((n) => n._id && n.title),
    tags: (data?.tags ?? []).filter((t) => t._id && t.title),
    library: (data?.library ?? []).filter((l) => l._id && l.title),
    projects: (data?.projects ?? []).filter((p) => p._id && p.title),
    series: (data?.series ?? []).filter((s) => s._id && s.title),
  }

  const totalNodes = Object.values(graph).reduce((n, arr) => n + arr.length, 0)

  return (
    <div className="relative flex flex-col bg-[#0a0a0a]" style={{ height: '100dvh' }}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Knowledge Graph',
          url: absoluteUrl('/graph'),
          description: copy.header.metaDescription || copy.header.lede,
        }}
      />
      <div data-not-article>
        <Navbar />
      </div>

      {/* Navbar is fixed; pad the graph below it. */}
      <main id="content" className="flex-1 relative overflow-hidden pt-20">
        {totalNodes > 0 ? (
          <KnowledgeGraph data={graph} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <p className="font-serif italic text-stone-400 text-xl mb-3">{copy.emptyState.title}</p>
            <p className="font-sans text-sm text-stone-400 max-w-sm leading-relaxed">{copy.emptyState.hint}</p>
          </div>
        )}
      </main>

      <div className="absolute top-24 right-4 z-30">
        <Link
          href="/blog"
          className="font-sans text-sm text-stone-400 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded-sm"
        >
          ← {copy.backLabel}
        </Link>
      </div>
    </div>
  )
}
