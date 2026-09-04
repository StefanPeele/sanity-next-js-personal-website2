import { sanityFetch } from '@/sanity/lib/live'
import { graphQuery } from '@/sanity/lib/queries'
import { Navbar } from '@/components/Navbar'
import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph'
import type { Metadata } from 'next'
// app/graph/page.tsx
// Full-bleed graph page — outside (personal) layout for full viewport use.

export const metadata: Metadata = {
  title: 'Knowledge Graph | Stefan Peele',
  description: 'An interactive map of every post, note, tag, and library item — and how they connect.',
}

export default async function GraphPage() {
  const { data: raw } = await sanityFetch({ query: graphQuery, stega: false })
  const { posts, notes, tags, library } = (raw ?? {}) as any

  const data = {
    posts:   (posts   ?? []).filter((p: any) => p._id && p.title),
    notes:   (notes   ?? []).filter((n: any) => n._id && n.title),
    tags:    (tags    ?? []).filter((t: any) => t._id && t.title),
    library: (library ?? []).filter((l: any) => l._id && l.title),
  }

  const totalNodes = data.posts.length + data.notes.length + data.tags.length + data.library.length

  return (
    <div className="relative flex flex-col bg-[#0a0a0a]" style={{ height: '100dvh' }}>
      {/* Navbar — transparent overlay */}
      <div data-not-article className="flex-shrink-0">
        <Navbar />
      </div>

      {/* Graph — fills remaining height */}
      <div className="flex-1 relative overflow-hidden" style={{ marginTop: '-80px', paddingTop: '80px' }}>
        {totalNodes > 0 ? (
          <KnowledgeGraph data={data} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <p className="font-serif italic text-stone-600 text-xl mb-3">The graph is empty.</p>
            <p className="font-mono text-[10px] text-stone-700 uppercase tracking-widest max-w-sm leading-relaxed">
              Add posts, notes, and connections in Sanity Studio — they will appear here automatically.
            </p>
          </div>
        )}
      </div>

      {/* Back link */}
      <div className="absolute top-24 right-4 z-30">
        <a
          href="/blog"
          className="font-mono text-[9px] uppercase tracking-widest text-stone-700 hover:text-stone-400 transition-colors"
        >
          ← Editorial
        </a>
      </div>
    </div>
  )
}