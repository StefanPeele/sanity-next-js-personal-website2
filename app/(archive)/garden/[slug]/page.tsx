import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { PortableTextBlock } from 'next-sanity'
import { sanityFetch } from '@/sanity/lib/live'
import { client } from '@/sanity/lib/client'
import { noteBySlugQuery, noteSlugsQuery } from '@/sanity/lib/queries'
import { noteTitlesQuery } from '@/sanity/lib/queries-knowledge'
import { CustomPortableText } from '@/components/CustomPortableText'
import { JsonLd } from '@/components/JsonLd'
import { buildWikiIndex, resolveWikiLinks } from '@/components/knowledge/WikiLinks'
import { NOTE_STATUS_ORDER, ORIGIN_LABELS, noteStatus } from '@/components/garden/status'
import { GraphEmbed } from '@/components/graph/GraphEmbed'
import { formatDate, daysSince } from '@/lib/dates'
import { readingTime, portableTextToPlain } from '@/lib/reading'
import { absoluteUrl, articleTypeMeta, SITE } from '@/lib/site'
import type { GardenNote } from '@/components/garden/types'
import { Icon } from '@/lib/cms/icons'
import { FOCUS, QUIET_LINK, buttonClass } from '@/lib/ui'
import { enumKey } from '@/lib/stega'
// app/(archive)/garden/[slug]/page.tsx
// A single garden note. Body rendered on the server with [[wiki links]] resolved.

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
  const slugs = await client.fetch(noteSlugsQuery)
  return (slugs ?? []).filter((s) => s.slug).map((s) => ({ slug: s.slug as string }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const { data: note } = await sanityFetch({ query: noteBySlugQuery, params: { slug }, stega: false })
  if (!note) return { title: 'Note not found' }
  const status = noteStatus(note.status)
  const plain = portableTextToPlain(note.body as never)
  const description = plain ? plain.slice(0, 155).trim() : `${status.label} note in Stefan Peele's digital garden.`
  return {
    title: `${note.title} | Garden`,
    description,
    alternates: { canonical: `/garden/${slug}` },
    openGraph: { title: note.title ?? 'Note', description, type: 'article', modifiedTime: note.lastTended },
  }
}

export default async function NotePage({ params }: { params: Params }) {
  const { slug } = await params
  const [{ data: raw }, { data: allNotes }] = await Promise.all([
    sanityFetch({ query: noteBySlugQuery, params: { slug } }),
    sanityFetch({ query: noteTitlesQuery, stega: false }),
  ])
  if (!raw) notFound()

  const note = raw as unknown as GardenNote & { body: PortableTextBlock[] | null }
  const status = noteStatus(note.status)
  const statusIndex = NOTE_STATUS_ORDER.indexOf(note.status ?? 'seedling')
  const wikiIndex = buildWikiIndex(allNotes ?? [])
  const blocks = Array.isArray(note.body) && note.body.length > 0 ? resolveWikiLinks(note.body, wikiIndex) : null
  const plain = portableTextToPlain(note.body as never)
  const minutes = readingTime(plain)
  const tendedDays = daysSince(note.lastTended)

  // Prev/next by lastTended (allNotes is already ordered newest first)
  const ordered = allNotes ?? []
  const idx = ordered.findIndex((n) => n._id === note._id)
  const newer = idx > 0 ? ordered[idx - 1] : null
  const older = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null

  const created = formatDate(note._createdAt, 'long')
  const tended = formatDate(note.lastTended, 'long')

  return (
    <div className="relative min-h-screen text-stone-300">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: note.title,
          url: absoluteUrl(`/garden/${slug}`),
          dateCreated: note._createdAt,
          dateModified: note.lastTended,
          author: { '@type': 'Person', name: SITE.name, url: SITE.url },
          isPartOf: { '@type': 'CollectionPage', name: 'The Garden', url: absoluteUrl('/garden') },
          keywords: (note.tags ?? []).map((t) => t.title).filter(Boolean).join(', '),
          creativeWorkStatus: status.label,
        }}
      />

      <main id="content" className="relative max-w-3xl mx-auto px-6 pt-32 pb-24">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="meta-label flex flex-wrap items-center gap-2 text-stone-400">
            <li><Link href="/blog" className={`hover:text-white transition-colors rounded-sm ${FOCUS}`}>Editorial</Link></li>
            <li aria-hidden="true" className="text-stone-700">/</li>
            <li><Link href="/garden" className={`hover:text-white transition-colors rounded-sm ${FOCUS}`}>Garden</Link></li>
            <li aria-hidden="true" className="text-stone-700">/</li>
            <li aria-current="page" className="text-stone-400 normal-case tracking-normal">{note.title}</li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`meta-label px-2 py-1 rounded-sm border ${status.badge}`}>
              <Icon name={status.icon} size={10} className="inline -mt-px mr-1" /> {status.label}
            </span>
            {note.origin && (
              <span className="meta-label text-stone-400">
                {ORIGIN_LABELS[enumKey(note.origin) ?? ''] ?? note.origin}
              </span>
            )}
            <span className="meta-label text-stone-400">{minutes} min read</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight mb-6">
            {note.title}
          </h1>

          {/* Status banner */}
          <div className={`p-4 rounded-lg border ${status.badge}`} role="note">
            <p className="meta-label leading-relaxed">
              {status.banner}
            </p>
          </div>
        </header>

        {/* Growth strip: created → tended → status */}
        <section aria-label="Growth timeline" className="mb-10 rounded-xl border border-edge bg-surface-veil p-4">
          <ol className="grid grid-cols-3 gap-2 relative">
            <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-[7px] h-px bg-gradient-to-r from-stone-700 via-stone-600 to-stone-500" />
            {[
              { label: 'Planted', value: created, iso: formatDate(note._createdAt, 'iso'), dot: 'bg-stone-500' },
              { label: 'Last tended', value: tended, iso: formatDate(note.lastTended, 'iso'), dot: 'bg-stone-300' },
              { label: 'Status', value: `${status.label} (${statusIndex + 1}/${NOTE_STATUS_ORDER.length})`, iso: null, dot: status.dot },
            ].map((step) => (
              <li key={step.label} className="relative flex flex-col items-center text-center">
                <span className={`w-3.5 h-3.5 rounded-full ring-4 ring-[#0a0a0a] ${step.dot}`} aria-hidden="true" />
                <span className="meta-label text-stone-400 mt-3">{step.label}</span>
                {step.iso ? (
                  <time dateTime={step.iso} className="font-mono text-xs text-stone-300 mt-1">{step.value}</time>
                ) : (
                  <span className="font-mono text-xs text-stone-300 mt-1">{step.value}</span>
                )}
              </li>
            ))}
          </ol>
          {tendedDays !== null && tendedDays > 60 && (
            <p className="meta-label mt-4 text-stone-400 text-center">
              Not tended in {tendedDays} days — details may be stale.
            </p>
          )}
        </section>

        {/* Body */}
        <article className="mb-12">
          {blocks ? (
            <CustomPortableText value={blocks as PortableTextBlock[]} paragraphClasses="mb-5 leading-[1.8] text-stone-300 text-base" />
          ) : (
            <p className="font-serif italic text-stone-400">This note is a placeholder — nothing written yet.</p>
          )}
        </article>

        {/* Tags */}
        {(note.tags ?? []).length > 0 && (
          <section className="mb-10" aria-label="Tags">
            <ul className="flex flex-wrap gap-2">
              {(note.tags ?? []).map((tag) => (
                <li key={tag._id}>
                  <Link
                    href={`/garden?tag=${tag.slug}`}
                    className={`meta-label ${buttonClass({ variant: 'chip', size: 'sm' })}`}
                  >
                    #{tag.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Connections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <ConnectionList
            title="Related notes"
            empty="No related notes linked yet."
            items={(note.relatedNotes ?? []).map((n) => ({ key: n._id, href: `/garden/${n.slug}`, label: n.title ?? 'Untitled', meta: noteStatus(n.status).label, dot: noteStatus(n.status).dot }))}
          />
          <ConnectionList
            title="Related posts"
            empty="This note has not grown into a post yet."
            items={(note.relatedPosts ?? []).map((p) => ({ key: p._id, href: `/blog/${p.slug}`, label: p.title ?? 'Untitled', meta: articleTypeMeta(p.articleType)?.label ?? 'Post' }))}
          />
          <ConnectionList
            title="Notes that link here"
            empty="Nothing links here yet."
            items={(note.backlinks ?? []).map((n) => ({ key: n._id, href: `/garden/${n.slug}`, label: n.title ?? 'Untitled', meta: noteStatus(n.status).label, dot: noteStatus(n.status).dot }))}
          />
          <ConnectionList
            title="Posts that cite this"
            empty="No post cites this note yet."
            items={(note.citedBy ?? []).map((p) => ({ key: p._id, href: `/blog/${p.slug}`, label: p.title ?? 'Untitled', meta: 'Post' }))}
          />
        </div>

        {/* Neighbourhood graph */}
        <section className="mb-12">
          <GraphEmbed focusId={note._id} title="In the graph" />
        </section>

        {/* Prev / next by lastTended */}
        <nav aria-label="Neighbouring notes" className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-edge-faint pt-8">
          {older ? (
            <Link href={`/garden/${older.slug}`} className={`group rounded-lg border border-edge hover:border-edge-strong p-4 transition-colors ${FOCUS}`}>
              <span className="meta-label text-stone-400 block mb-1">← Tended earlier</span>
              <span className="font-serif text-white group-hover:text-stone-200">{older.title}</span>
              <span className="block font-mono text-xs text-stone-400 mt-1">{formatDate(older.lastTended, 'short')}</span>
            </Link>
          ) : <span />}
          {newer ? (
            <Link href={`/garden/${newer.slug}`} className={`group rounded-lg border border-edge hover:border-edge-strong p-4 text-right transition-colors ${FOCUS}`}>
              <span className="meta-label text-stone-400 block mb-1">Tended later →</span>
              <span className="font-serif text-white group-hover:text-stone-200">{newer.title}</span>
              <span className="block font-mono text-xs text-stone-400 mt-1">{formatDate(newer.lastTended, 'short')}</span>
            </Link>
          ) : <span />}
        </nav>

        <div className="mt-10 flex flex-wrap gap-6">
          <Link href={`/garden?note=${slug}`} className={`meta-label ${QUIET_LINK}`}>
            ← Back to the Garden
          </Link>
          <Link href={`/graph`} className={`meta-label ${QUIET_LINK}`}>
            Open full graph →
          </Link>
        </div>
      </main>
    </div>
  )
}

function ConnectionList({
  title,
  empty,
  items,
}: {
  title: string
  empty: string
  items: { key: string; href: string; label: string; meta?: string; dot?: string }[]
}) {
  return (
    <section className="rounded-xl border border-edge bg-surface-veil p-4">
      <h2 className="meta-label text-stone-400 mb-3 border-l-2 border-stone-700 pl-3">{title}</h2>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.key}>
              <Link href={i.href} className={`group flex items-center gap-2 rounded-sm ${FOCUS}`}>
                {i.dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i.dot}`} aria-hidden="true" />}
                <span className="font-serif text-sm text-stone-200 group-hover:text-white transition-colors">{i.label}</span>
                {i.meta && <span className="meta-label ml-auto text-stone-400 flex-shrink-0">{i.meta}</span>}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-mono text-xs text-stone-400 italic">{empty}</p>
      )}
    </section>
  )
}

