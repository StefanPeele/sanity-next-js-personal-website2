import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/lib/live'
import { digestsQuery } from '@/sanity/lib/queries'
import { formatDate } from '@/lib/dates'
import { absoluteUrl } from '@/lib/site'
import { FOCUS, QUIET_LINK } from '@/lib/ui'
// app/(archive)/blog/digests/page.tsx — PROPOSALS 9.5.
//
// /blog/digests rather than /digests: it is writing, it belongs to the archive shell, and it
// gets the reading toolbar and the rest of the furniture for free.
//
// The archive's argument is NOT search engines, which is the weakest one available here. It
// is that an archive makes subscribing a DECISION rather than a leap. The form currently asks
// for an address and offers, in return, a description of what the emails will be like. This
// replaces that description with the emails themselves — the same argument as the corrections
// page in 3B: showing the record is more persuasive than describing it.
//
// The cost, stated because it is real: a page anyone can read is held to a different standard
// than a note to forty people who already opted in. That is a good pressure and it means you
// cannot write a lazy one.

export const metadata: Metadata = {
  title: 'Digests',
  description: 'Every digest I have sent, in full. What I read, and why it mattered.',
  alternates: { canonical: '/blog/digests' },
}

export default async function DigestsPage() {
  const { data } = await sanityFetch({ query: digestsQuery })
  const digests = (data ?? []).filter((d) => d.slug)

  return (
    <main id="content" className="relative max-w-3xl mx-auto px-6 pt-32 pb-24">
      <header className="mb-16">
        <Link href="/blog" className={`font-sans text-sm ${QUIET_LINK}`}>← Blog</Link>
        <h1 className="mt-6 text-5xl font-serif font-bold tracking-tight text-white leading-none">Digests</h1>
        <p className="mt-4 font-sans text-base text-stone-400 leading-relaxed">
          Every digest I have sent, in full. What I read that week and why it mattered, so you
          can see what you would be signing up for before you do.
        </p>
      </header>

      {digests.length === 0 ? (
        // Honest rather than decorative. Nothing has been sent, and saying so is better than
        // an empty grid that looks like a loading state.
        <p className="font-sans text-base text-stone-400">
          Nothing sent yet. The first one will appear here the day it goes out.
        </p>
      ) : (
        <ul className="list-none m-0 p-0 space-y-10">
          {digests.map((d) => (
            <li key={d._id}>
              <p className="meta-label text-sm mb-1">
                <time dateTime={d.sentAt ?? undefined}>{formatDate(d.sentAt, 'short', '')}</time>
                {typeof d.entryCount === 'number' && d.entryCount > 0 && ` · ${d.entryCount} item${d.entryCount === 1 ? '' : 's'}`}
              </p>
              <h2 className="text-2xl font-serif font-semibold text-white leading-snug">
                <Link href={`/blog/digests/${d.slug}`} className={`hover:text-stone-200 transition-colors rounded-sm ${FOCUS}`}>
                  {d.title}
                </Link>
              </h2>
              {d.intro && <p className="mt-2 font-sans text-base text-stone-300 leading-relaxed">{d.intro}</p>}
            </li>
          ))}
        </ul>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Digests',
            url: absoluteUrl('/blog/digests'),
          }),
        }}
      />
    </main>
  )
}
