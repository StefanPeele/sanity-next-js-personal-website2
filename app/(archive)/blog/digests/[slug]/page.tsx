import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { sanityFetch } from '@/sanity/lib/live'
import { digestBySlugQuery, digestSlugsQuery } from '@/sanity/lib/queries'
import { formatDate } from '@/lib/dates'
import { FOCUS, QUIET_LINK } from '@/lib/ui'
// app/(archive)/blog/digests/[slug]/page.tsx — PROPOSALS 9.5.
//
// One page per sent digest, rendering the same three entry kinds the email does.
//
// Deliberately NOT here: a "subscribe to get the next one" box. On an archived digest that
// is two years old it reads as a growth tactic on a page whose job is to be honest about
// what the thing is. The footer form is already on every page of this site.

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const slugs = await client.fetch(digestSlugsQuery)
  return slugs.filter((s) => s.slug).map(({ slug }) => ({ slug: slug! }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data } = await sanityFetch({ query: digestBySlugQuery, params: { slug }, stega: false })
  if (!data) return { title: 'Digest not found' }
  return {
    title: data.title ?? 'Digest',
    description: data.intro ?? undefined,
    alternates: { canonical: `/blog/digests/${slug}` },
  }
}

export default async function DigestPage({ params }: Props) {
  const { slug } = await params
  const { data: digest } = await sanityFetch({ query: digestBySlugQuery, params: { slug } })
  if (!digest) notFound()

  return (
    <main id="content" className="relative max-w-3xl mx-auto px-6 pt-32 pb-24">
      <header className="mb-12">
        <Link href="/blog/digests" className={`font-sans text-sm ${QUIET_LINK}`}>← Digests</Link>
        <p className="meta-label text-sm mt-6 mb-2">
          <time dateTime={digest.sentAt ?? undefined}>{formatDate(digest.sentAt, 'short', '')}</time>
        </p>
        <h1 className="text-4xl font-serif font-bold tracking-tight text-white leading-tight text-balance">{digest.title}</h1>
        {digest.intro && <p className="mt-5 font-sans text-lg text-stone-300 leading-relaxed">{digest.intro}</p>}
      </header>

      <div className="space-y-10">
        {(digest.entries ?? []).map((e) => {
          // A post entry: title and link come from the reference, so the author only ever
          // writes the note. That asymmetry is the reason for three entry types.
          if (e._type === 'postEntry') {
            return (
              <section key={e._key}>
                <p className="meta-label text-sm mb-1">From the blog</p>
                <h2 className="text-2xl font-serif font-semibold text-white leading-snug">
                  {e.post?.slug ? (
                    <Link href={`/blog/${e.post.slug}`} className={`hover:text-stone-200 transition-colors rounded-sm ${FOCUS}`}>{e.post.title}</Link>
                  ) : (e.post?.title ?? 'Untitled')}
                </h2>
                {e.note && <p className="mt-2 font-sans text-base text-stone-300 leading-relaxed">{e.note}</p>}
              </section>
            )
          }
          if (e._type === 'linkEntry') {
            return (
              <section key={e._key}>
                <p className="meta-label text-sm mb-1">{e.source || 'Elsewhere'}</p>
                <h2 className="text-2xl font-serif font-semibold text-white leading-snug">
                  <a href={e.url ?? '#'} rel="noopener noreferrer" className={`hover:text-stone-200 transition-colors rounded-sm ${FOCUS}`}>{e.title}</a>
                </h2>
                {e.note && <p className="mt-2 font-sans text-base text-stone-300 leading-relaxed">{e.note}</p>}
              </section>
            )
          }
          return (
            <section key={e._key}>
              <h2 className="text-2xl font-serif font-semibold text-white leading-snug">{e.heading}</h2>
              {e.body && <p className="mt-2 font-sans text-base text-stone-300 leading-relaxed">{e.body}</p>}
            </section>
          )
        })}
      </div>
    </main>
  )
}
