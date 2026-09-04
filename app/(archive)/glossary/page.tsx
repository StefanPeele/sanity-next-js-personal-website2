import { sanityFetch } from '@/sanity/lib/live'
import { glossaryQuery } from '@/sanity/lib/queries'
import { CustomPortableText } from '@/components/CustomPortableText'
import { GlossaryList, type GlossaryListEntry } from '@/components/blog/GlossaryList'
import { JsonLd } from '@/components/JsonLd'
import { SITE, absoluteUrl } from '@/lib/site'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { PortableTextBlock } from 'next-sanity'
// app/(archive)/glossary/page.tsx
// Every glossary term, A–Z, filterable by category. Terms also power the hover
// cards inside articles (lib/glossary.ts).

export const metadata: Metadata = {
  title: 'Glossary',
  description: 'Networking and infrastructure terms as Stefan Peele uses them in his writing — short definitions, longer explanations, and the posts where each one shows up.',
  alternates: { canonical: absoluteUrl('/glossary') },
}

export default async function GlossaryPage() {
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
        <header className="mb-12 border-b border-white/5 pb-8">
          <Link href="/blog" className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded-sm">
            ← Writing
          </Link>
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block mt-6 mb-4 border-l border-stone-700 pl-4">
            Archive // Reference
          </span>
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-none">Glossary</h1>
          <p className="mt-4 max-w-xl font-serif italic text-stone-400">
            {entries.length} term{entries.length !== 1 ? 's' : ''}. When one of these appears in an article, hovering it shows the short definition; this page holds the longer version.
          </p>
        </header>

        {entries.length === 0 ? (
          <p className="font-mono text-[11px] uppercase tracking-widest text-stone-500">No terms defined yet.</p>
        ) : (
          <GlossaryList entries={entries} categories={categories} />
        )}
      </main>
    </div>
  )
}
