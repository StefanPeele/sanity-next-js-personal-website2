import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { client } from '@/sanity/lib/client'
import { learningPathBySlugQuery, slugsByTypeQuery } from '@/sanity/lib/queries'
import { JsonLd } from '@/components/JsonLd'
import { PathSteps, LEVEL_LABELS, stepMinutes } from '@/components/knowledge/PathSteps'
import { absoluteUrl, SITE } from '@/lib/site'
// app/(archive)/paths/[slug]/page.tsx

type Params = Promise<{ slug: string }>
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

export async function generateStaticParams() {
  const slugs = await client.fetch(slugsByTypeQuery, { type: 'learningPath' })
  return (slugs ?? []).filter((s) => s.slug).map((s) => ({ slug: s.slug as string }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const { data } = await sanityFetch({ query: learningPathBySlugQuery, params: { slug }, stega: false })
  if (!data) return { title: 'Path not found' }
  return {
    title: `${data.title} | Learning Path`,
    description: data.description ?? `An ordered route through posts and notes: ${data.title}.`,
    alternates: { canonical: `/paths/${slug}` },
  }
}

export default async function PathPage({ params }: { params: Params }) {
  const { slug } = await params
  const { data: path } = await sanityFetch({ query: learningPathBySlugQuery, params: { slug } })
  if (!path) notFound()

  const steps = (path.steps ?? []).filter((s) => (s.post && s.post.slug) || (s.gardenNote && s.gardenNote.slug))
  const minutes = steps.reduce((n, s) => n + stepMinutes(s), 0)
  const posts = steps.filter((s) => s.post).length
  const notes = steps.length - posts

  return (
    <div className="relative min-h-screen text-stone-300">
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: path.title,
            description: path.description ?? undefined,
            url: absoluteUrl(`/paths/${slug}`),
            provider: { '@type': 'Person', name: SITE.name, url: SITE.url },
            educationalLevel: LEVEL_LABELS[path.level ?? 'foundations'],
            timeRequired: path.estimatedHours ? `PT${path.estimatedHours}H` : undefined,
            hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: `PT${minutes}M` },
            isAccessibleForFree: true,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `${path.title} — steps`,
            itemListOrder: 'https://schema.org/ItemListOrderAscending',
            numberOfItems: steps.length,
            itemListElement: steps.map((s, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: s.post?.title ?? s.gardenNote?.title ?? undefined,
              url: absoluteUrl(s.post ? `/blog/${s.post.slug}` : `/garden/${s.gardenNote?.slug}`),
            })),
          },
        ]}
      />
      <main id="content" className="relative max-w-3xl mx-auto px-6 pt-32 pb-24">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-stone-400">
            <li><Link href="/blog" className={`hover:text-white transition-colors rounded-sm ${FOCUS}`}>Editorial</Link></li>
            <li aria-hidden="true" className="text-stone-700">/</li>
            <li><Link href="/paths" className={`hover:text-white transition-colors rounded-sm ${FOCUS}`}>Learning Paths</Link></li>
            <li aria-hidden="true" className="text-stone-700">/</li>
            <li aria-current="page" className="text-stone-400 normal-case tracking-normal">{path.title}</li>
          </ol>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4 font-mono text-[8px] uppercase tracking-[0.3em] text-stone-400">
            <span className="border border-white/10 px-2 py-0.5 rounded-sm text-stone-300">{LEVEL_LABELS[path.level ?? 'foundations']}</span>
            {typeof path.estimatedHours === 'number' && path.estimatedHours > 0 && <span>~{path.estimatedHours} h total</span>}
            <span>{steps.length} step{steps.length === 1 ? '' : 's'}</span>
            <span>{posts} post{posts === 1 ? '' : 's'} · {notes} note{notes === 1 ? '' : 's'}</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight mb-4">{path.title}</h1>
          {path.description && <p className="text-stone-400 text-base leading-relaxed max-w-2xl">{path.description}</p>}
        </header>

        {steps.length > 0 ? (
          <PathSteps slug={slug} steps={steps} />
        ) : (
          <div className="py-16 text-center border border-white/5 rounded-xl">
            <p className="font-serif italic text-stone-300 text-lg mb-2">This path has no steps yet.</p>
            <p className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">Add posts or notes to it in Sanity Studio → Learning Paths</p>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap gap-6">
          <Link href="/paths" className={`font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400 hover:text-white transition-colors rounded-sm ${FOCUS}`}>← All paths</Link>
          <Link href="/review" className={`font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400 hover:text-white transition-colors rounded-sm ${FOCUS}`}>Review what you read →</Link>
        </div>
      </main>
    </div>
  )
}
