import { sanityFetch } from '@/sanity/lib/live'
import { glossaryQuery } from '@/sanity/lib/queries'
import { CustomPortableText } from '@/components/CustomPortableText'
import { GlossaryList, type GlossaryListEntry } from '@/components/blog/GlossaryList'
import { JsonLd } from '@/components/JsonLd'
import { SITE, absoluteUrl } from '@/lib/site'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { PortableTextBlock } from 'next-sanity'
import { getCopy } from '@/lib/cms/loaders'
import { knowledgePagesQuery } from '@/sanity/lib/queries-article-ui'
import { DEFAULT_KNOWLEDGE_PAGES } from '@/lib/cms/defaults/knowledgePages'
import { FOCUS } from '@/lib/ui'
// app/(archive)/glossary/page.tsx
// Every glossary term, A–Z, filterable by category. Terms also power the hover
// cards inside articles (lib/glossary.ts).

export async function generateMetadata(): Promise<Metadata> {
  const all = await getCopy(knowledgePagesQuery, DEFAULT_KNOWLEDGE_PAGES)
  const h = all.glossary.header
  return { title: h.metaTitle || h.title, description: h.metaDescription || h.lede }
}

export default async function GlossaryPage() {
  const copy = (await getCopy(knowledgePagesQuery, DEFAULT_KNOWLEDGE_PAGES)).glossary
  const { data } = await sanityFetch({ query: glossaryQuery })
  const raw = (data ?? []).filter((t) => t.term && t.slug && t.definition)

  const entries: GlossaryListEntry[] = raw.map((t) => ({
    _id: t._id,
    term: t.term!,
    slug: t.slug!,
    definition: t.definition!,
    category: t.category ?? null,
    aliases: (t.aliases ?? []).filter((a): a is string => !!a),
    longDefinition: t.longDefinition?.length
      ? <CustomPortableText value={t.longDefinition as unknown as PortableTextBlock[]} paragraphClasses="mb-4 font-sans text-[15px] text-stone-300 leading-relaxed" />
      : null,
    relatedPosts: ((t.relatedPosts ?? []) as unknown as Array<{ title: string | null; slug: string | null } | null>).filter((p): p is { title: string | null; slug: string | null } => !!p),
    relatedNotes: ((t.relatedNotes ?? []) as unknown as Array<{ title: string | null; slug: string | null } | null>).filter((n): n is { title: string | null; slug: string | null } => !!n),
  }))

  const categories = Array.from(new Set(entries.map((e) => e.category).filter((c): c is string => !!c))).sort()

  return (
    <div className="relative min-h-screen text-stone-300">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'DefinedTermSet',
        '@id': absoluteUrl('/glossary'),
        name: `${SITE.name} — Networking Glossary`,
        url: absoluteUrl('/glossary'),
        hasDefinedTerm: entries.map((e) => ({
          '@type': 'DefinedTerm',
          '@id': absoluteUrl(`/glossary#${e.slug}`),
          name: e.term,
          description: e.definition,
          ...(e.aliases.length ? { alternateName: e.aliases } : {}),
          inDefinedTermSet: absoluteUrl('/glossary'),
        })),
      }} />

      <main id="content" className="relative max-w-4xl mx-auto px-6 pt-32 pb-24">
        <header className="mb-12 border-b border-edge-faint pb-8">
          <Link href="/blog" className={`font-sans text-sm text-stone-400 hover:text-white transition-colors ${FOCUS} rounded-sm`}>← {copy.backLabel}</Link>
          <h1 className="mt-6 text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-none">{copy.header.title}</h1>
          <p className="mt-4 max-w-xl font-sans text-base text-stone-400">{copy.termsCount.replace('{n}', String(entries.length))}. {copy.header.lede}</p>
        </header>

        {entries.length === 0 ? (
          <p className="font-sans text-sm text-stone-400">{copy.emptyState.title}</p>
        ) : (
          <GlossaryList entries={entries} categories={categories} />
        )}
      </main>
    </div>
  )
}
