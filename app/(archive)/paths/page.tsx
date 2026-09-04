import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { learningPathsQuery } from '@/sanity/lib/queries'
import { JsonLd } from '@/components/JsonLd'
import { LEVEL_LABELS } from '@/components/knowledge/PathSteps'
import { absoluteUrl } from '@/lib/site'
// app/(archive)/paths/page.tsx

export const metadata: Metadata = {
  title: 'Learning Paths',
  description: 'Ordered routes through posts and garden notes — read them in sequence to build a topic from the ground up.',
  alternates: { canonical: '/paths' },
}

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

export default async function PathsPage() {
  const { data } = await sanityFetch({ query: learningPathsQuery })
  const paths = (data ?? []).filter((p) => p.slug && p.title)

  return (
    <div className="relative min-h-screen text-stone-300">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Learning Paths',
          url: absoluteUrl('/paths'),
          numberOfItems: paths.length,
          itemListElement: paths.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: { '@type': 'Course', name: p.title, url: absoluteUrl(`/paths/${p.slug}`), description: p.description ?? undefined },
          })),
        }}
      />
      <main id="content" className="relative max-w-4xl mx-auto px-6 pt-32 pb-24">
        <header className="mb-12 border-b border-white/5 pb-10">
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block mb-4 border-l border-stone-700 pl-4">
            Editorial // Learning Paths
          </span>
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-none mb-4">
            Learning Paths<span className="text-stone-600">.</span>
          </h1>
          <p className="text-stone-400 text-base leading-relaxed max-w-2xl">
            A path is an ordered route through the archive: posts and garden notes arranged so each one
            builds on the last. Progress is saved in your browser — no account needed.
          </p>
        </header>

        {paths.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {paths.map((p) => {
              const steps = (p.steps ?? []).filter((s) => s.post || s.gardenNote)
              return (
                <li key={p._id}>
                  <Link
                    href={`/paths/${p.slug}`}
                    className={`group block h-full rounded-xl border border-white/[0.08] hover:border-white/25 bg-white/[0.02] p-6 transition-colors ${FOCUS}`}
                  >
                    <div className="flex items-center gap-3 mb-3 font-mono text-[8px] uppercase tracking-[0.3em] text-stone-500">
                      <span className="border border-white/10 px-2 py-0.5 rounded-sm text-stone-300">{LEVEL_LABELS[p.level ?? 'foundations']}</span>
                      {typeof p.estimatedHours === 'number' && p.estimatedHours > 0 && <span>~{p.estimatedHours} h</span>}
                      <span>{steps.length} step{steps.length === 1 ? '' : 's'}</span>
                    </div>
                    <h2 className="font-serif text-2xl text-white group-hover:text-stone-200 leading-tight mb-2">{p.title}</h2>
                    {p.description && <p className="text-stone-400 text-sm leading-relaxed line-clamp-3">{p.description}</p>}
                    <span className="mt-4 inline-block font-mono text-[9px] uppercase tracking-widest text-stone-400 group-hover:text-white transition-colors">
                      Start here →
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="py-20 px-6 text-center border border-white/5 rounded-xl">
            <p className="font-serif italic text-stone-300 text-lg mb-3">No paths yet.</p>
            <p className="text-stone-400 text-sm leading-relaxed max-w-md mx-auto">
              A learning path strings posts and notes into a sequence — "CCNA in order", "Windows Server from zero".
              When one exists it will show up here with a level, an hour estimate and a step count.
              Until then, the <Link href="/blog" className="text-white underline underline-offset-4">writing archive</Link> and the{' '}
              <Link href="/garden" className="text-white underline underline-offset-4">garden</Link> are the way in.
            </p>
          </div>
        )}

        <nav className="mt-16 pt-8 border-t border-white/5 flex flex-wrap gap-6" aria-label="Related sections">
          <Link href="/blog" className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 hover:text-white transition-colors">← Back to Editorial</Link>
          <Link href="/review" className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 hover:text-white transition-colors">Review deck →</Link>
        </nav>
      </main>
    </div>
  )
}
