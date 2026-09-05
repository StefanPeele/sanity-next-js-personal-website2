import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { learningPathsQuery } from '@/sanity/lib/queries'
import { JsonLd } from '@/components/JsonLd'
import { LEVEL_LABELS } from '@/components/knowledge/PathSteps'
import { absoluteUrl } from '@/lib/site'
import { getCopy } from '@/lib/cms/loaders'
import { knowledgePagesQuery } from '@/sanity/lib/queries-article-ui'
import { DEFAULT_KNOWLEDGE_PAGES } from '@/lib/cms/defaults/knowledgePages'
import { navHref } from '@/lib/cms/defaults/navigation'
// app/(archive)/paths/page.tsx

export async function generateMetadata(): Promise<Metadata> {
  const all = await getCopy(knowledgePagesQuery, DEFAULT_KNOWLEDGE_PAGES)
  const h = all.paths.header
  return { title: h.metaTitle || h.title, description: h.metaDescription || h.lede }
}

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

export default async function PathsPage() {
  const copy = (await getCopy(knowledgePagesQuery, DEFAULT_KNOWLEDGE_PAGES)).paths
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
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-none mb-4">{copy.header.title}</h1>
          <p className="text-stone-400 text-base leading-relaxed max-w-2xl">{copy.header.lede}</p>
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
                    <div className="flex items-center gap-3 mb-3 font-sans text-xs text-stone-400">
                      <span className="border border-white/10 px-2 py-0.5 rounded-sm text-stone-300">{copy.levelLabels[(p.level ?? 'foundations') as keyof typeof copy.levelLabels] ?? LEVEL_LABELS[p.level ?? 'foundations']}</span>
                      {typeof p.estimatedHours === 'number' && p.estimatedHours > 0 && <span>{copy.hoursLabel.replace('{n}', String(p.estimatedHours))}</span>}
                      <span>{copy.stepsLabel.replace('{n}', String(steps.length))}</span>
                    </div>
                    <h2 className="font-serif text-2xl text-white group-hover:text-stone-200 leading-tight mb-2">{p.title}</h2>
                    {p.description && <p className="text-stone-400 text-sm leading-relaxed line-clamp-3">{p.description}</p>}
                    <span className="mt-4 inline-block font-sans text-sm text-stone-400 group-hover:text-white transition-colors">{copy.startLabel} →</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="py-20 px-6 text-center border border-white/5 rounded-xl">
            <p className="font-serif italic text-stone-300 text-lg mb-3">{copy.emptyState.title}</p>
            <p className="text-stone-400 text-sm leading-relaxed max-w-md mx-auto">{copy.emptyState.hint}</p>
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
