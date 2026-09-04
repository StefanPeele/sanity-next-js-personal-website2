import { sanityFetch } from '@/sanity/lib/live'
import { gardenQuery } from '@/sanity/lib/queries'
import { GardenClient } from '@/components/garden/GardenClient'
import { CustomPortableText } from '@/components/CustomPortableText'
import type { Metadata } from 'next'
// app/(archive)/garden/page.tsx

export const metadata: Metadata = {
  title: 'The Garden | Stefan Peele',
  description: 'A digital garden — notes, ideas, and developing thoughts on networking, infrastructure, and photography. Shorter and rougher than blog posts. Allowed to be incomplete.',
}

export default async function GardenPage() {
  const { data } = await sanityFetch({ query: gardenQuery })
  // Note bodies are rendered here on the server and handed to the client component as ReactNodes,
  // so the full block renderer (which imports server-only code) never enters the client bundle.
  const notes = ((data?.notes ?? []) as any[]).map((n) => ({
    ...n,
    rendered: Array.isArray(n.body) && n.body.length > 0
      ? <CustomPortableText value={n.body} paragraphClasses="mb-4 leading-relaxed text-stone-300 text-sm" />
      : null,
  }))
  const tags = (data?.tags ?? []) as any[]

  // Recently tended — last 5 by lastTended date
  const recentlyTended = [...(notes ?? [])]
    .filter((n: any) => n.lastTended)
    .sort((a: any, b: any) => new Date(b.lastTended).getTime() - new Date(a.lastTended).getTime())
    .slice(0, 5)

  const noteCount      = (notes ?? []).length
  const evergreenCount = (notes ?? []).filter((n: any) => n.status === 'evergreen').length

  return (
    <div className="relative min-h-screen text-stone-300">
      <main id="content" className="relative max-w-4xl mx-auto px-6 pt-32 pb-24">

        {/* ── Header ───────────────────────────────────────────────── */}
        <header className="mb-16 border-b border-white/5 pb-12">
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block mb-4 border-l border-stone-700 pl-4">
            Editorial // The Garden
          </span>
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-none mb-4">
            The Garden<span className="text-stone-600">.</span>
          </h1>
          <p className="text-stone-400 text-base leading-relaxed max-w-2xl mb-6">
            Notes are unfinished by design. A seedling is an idea worth capturing. A growing note
            is being developed. An evergreen note is worth returning to. This is where thinking
            happens before it becomes a post.
          </p>
          <div className="flex gap-6">
            <div>
              <div className="font-serif text-3xl text-white font-bold">{noteCount}</div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-stone-500 mt-0.5">Total notes</div>
            </div>
            <div>
              <div className="font-serif text-3xl text-white font-bold">{evergreenCount}</div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-stone-500 mt-0.5">Evergreen</div>
            </div>
            <div>
              <div className="font-serif text-3xl text-white font-bold">{(tags ?? []).length}</div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-stone-500 mt-0.5">Tags</div>
            </div>
          </div>
        </header>

        {/* ── Garden content ────────────────────────────────────────── */}
        {noteCount > 0 ? (
          <GardenClient
            notes={notes ?? []}
            tags={tags ?? []}
            recentlyTended={recentlyTended}
          />
        ) : (
          <div className="py-24 text-center border border-white/5 rounded-xl">
            <p className="font-serif italic text-stone-600 text-lg mb-2">The garden is empty.</p>
            <p className="font-mono text-[9px] text-stone-700 uppercase tracking-widest">
              Add your first note in Sanity Studio → Notes
            </p>
          </div>
        )}

        {/* ── Back to editorial ─────────────────────────────────────── */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <a
            href="/blog"
            className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-600 hover:text-white transition-colors"
          >
            ← Back to Editorial
          </a>
        </div>
      </main>
    </div>
  )
}