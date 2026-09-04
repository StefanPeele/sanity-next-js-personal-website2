import { sanityFetch } from '@/sanity/lib/live'
import { libraryQuery } from '@/sanity/lib/queries'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
// app/(archive)/library/page.tsx

export const metadata: Metadata = {
  title: 'Library | Stefan Peele',
  description: 'Books, articles, white papers, podcasts, and courses I\'ve read, am reading, or want to read — and how they connect to my work.',
}


const MEDIA_ICONS: Record<string, string> = {
  'book': '📚', 'article': '📰', 'whitepaper': '📑', 'industry-paper': '🏭',
  'rfc': '📋', 'research-paper': '📄', 'podcast': '🎙', 'newsletter': '📧',
  'video': '🎥', 'documentation': '📖',
}

const RATING_CONFIG: Record<string, { label: string; color: string }> = {
  'changed-thinking': { label: 'Changed how I think', color: 'text-emerald-400' },
  'worth-it':         { label: 'Worth the time',       color: 'text-stone-300' },
  'fine':             { label: 'Fine',                  color: 'text-stone-500' },
  'not-for-me':       { label: 'Not for me',            color: 'text-stone-600' },
  'abandoned':        { label: 'Abandoned',             color: 'text-red-400/70' },
}

function MediaCard({ item, size = 'normal' }: { item: any; size?: 'large' | 'normal' }) {
  const ratingConfig = item.rating ? RATING_CONFIG[item.rating] : null

  return (
    <div className={`flex gap-5 p-5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:border-white/15 transition-all ${size === 'large' ? 'md:gap-6 md:p-6' : ''}`}>
      {/* Cover */}
      <div className={`flex-shrink-0 bg-stone-900 rounded-lg border border-white/[0.08] overflow-hidden flex items-center justify-center ${
        size === 'large' ? 'w-20 h-28 md:w-24 md:h-32' : 'w-14 h-20'
      }`}>
        {item.coverUrl ? (
          <Image
            src={item.coverUrl}
            alt={item.title}
            width={size === 'large' ? 96 : 56}
            height={size === 'large' ? 128 : 80}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={size === 'large' ? 'text-3xl' : 'text-2xl'}>
            {MEDIA_ICONS[item.mediaType] ?? '📖'}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-1">
          <span className="font-mono text-[8px] uppercase tracking-widest text-stone-600">
            {MEDIA_ICONS[item.mediaType] ?? '📖'} {item.mediaType?.replace('-', ' ')}
          </span>
        </div>

        {item.url ? (
          <a href={item.url} target="_blank" rel="noreferrer noopener"
            className={`font-serif font-semibold text-white hover:text-stone-300 transition-colors leading-snug block mb-1 ${
              size === 'large' ? 'text-lg' : 'text-base'
            }`}>
            {item.title} ↗
          </a>
        ) : (
          <p className={`font-serif font-semibold text-white leading-snug mb-1 ${size === 'large' ? 'text-lg' : 'text-base'}`}>
            {item.title}
          </p>
        )}

        {item.author && (
          <p className="font-mono text-[10px] text-stone-600 mb-2">{item.author}</p>
        )}

        {/* Currently reading progress */}
        {item.status === 'current' && item.progressPercent !== undefined && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-0.5 bg-white/[0.08] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: `${item.progressPercent}%` }} />
              </div>
              <span className="font-mono text-[9px] text-stone-600">{item.progressPercent}%</span>
            </div>
            {item.startedAt && (
              <span className="font-mono text-[8px] text-stone-700 uppercase tracking-widest">
                Started {new Date(item.startedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        )}

        {/* One-sentence take */}
        {item.oneSentenceTake && (
          <p className="font-serif italic text-stone-400 text-sm leading-relaxed mb-2">
            "{item.oneSentenceTake}"
          </p>
        )}

        {/* Rating */}
        {ratingConfig && (
          <span className={`font-mono text-[9px] uppercase tracking-widest ${ratingConfig.color}`}>
            {ratingConfig.label}
          </span>
        )}

        {/* Influenced posts */}
        {item.influencedPosts?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <span className="font-mono text-[8px] uppercase tracking-widest text-stone-700 block mb-1.5">Influenced:</span>
            <div className="flex flex-wrap gap-2">
              {item.influencedPosts.map((post: any) => (
                <Link key={post.slug} href={`/blog/${post.slug}`}
                  className="font-mono text-[9px] text-stone-500 hover:text-white transition-colors underline underline-offset-4 decoration-stone-700 hover:decoration-stone-400">
                  {post.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default async function LibraryPage() {
  const { data } = await sanityFetch({ query: libraryQuery })
  const items = (data ?? []) as any[]

  const current   = items.filter((i) => i.status === 'current')
  const finished  = items.filter((i) => i.status === 'finished')
  const reference = items.filter((i) => i.status === 'reference')
  const wantToRead= items.filter((i) => i.status === 'want-to-read')
  const abandoned = items.filter((i) => i.status === 'abandoned')

  // Group finished by year
  const finishedByYear: Record<string, any[]> = {}
  finished.forEach((item) => {
    const year = item.finishedAt ? new Date(item.finishedAt).getFullYear().toString() : 'Unknown'
    if (!finishedByYear[year]) finishedByYear[year] = []
    finishedByYear[year].push(item)
  })
  const years = Object.keys(finishedByYear).sort((a, b) => Number(b) - Number(a))

  return (
    <div className="relative min-h-screen text-stone-300">
      <main id="content" className="relative max-w-4xl mx-auto px-6 pt-32 pb-24">

        {/* Header */}
        <header className="mb-16 border-b border-white/5 pb-10">
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block mb-4 border-l border-stone-700 pl-4">
            Library // Reading Archive
          </span>
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-none mb-4">
            What I'm Reading<span className="text-stone-600">.</span>
          </h1>
          <p className="text-stone-400 text-base leading-relaxed max-w-2xl">
            Books, articles, white papers, RFCs, podcasts, and courses — a transparent log of what enters my mind and how it connects to what I produce.
          </p>
          <div className="flex gap-6 mt-6">
            {[
              { label: 'Total items',    value: items.length },
              { label: 'Finished',       value: finished.length },
              { label: 'Currently with', value: current.length },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-serif text-3xl text-white font-bold">{stat.value}</div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-stone-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </header>

        {/* Currently reading */}
        {current.length > 0 && (
          <section className="mb-16">
            <div className="mb-6 pb-4 border-b border-white/[0.08]">
              <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 border-l-2 border-emerald-600 pl-4">
                Currently Reading
              </span>
            </div>
            <div className="space-y-4">
              {current.map((item) => (
                <MediaCard key={item._id} item={item} size="large" />
              ))}
            </div>
          </section>
        )}

        {/* Reference items */}
        {reference.length > 0 && (
          <section className="mb-16">
            <div className="mb-6 pb-4 border-b border-white/[0.08]">
              <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 border-l-2 border-stone-600 pl-4">
                Reference — Constantly Returning
              </span>
            </div>
            <div className="space-y-3">
              {reference.map((item) => (
                <MediaCard key={item._id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* Finished by year */}
        {years.map((year) => (
          <section key={year} className="mb-16">
            <div className="mb-6 pb-4 border-b border-white/[0.08]">
              <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 border-l-2 border-stone-600 pl-4">
                Finished {year}
              </span>
            </div>
            <div className="space-y-3">
              {finishedByYear[year].map((item) => (
                <MediaCard key={item._id} item={item} />
              ))}
            </div>
          </section>
        ))}

        {/* Want to read */}
        {wantToRead.length > 0 && (
          <section className="mb-16">
            <div className="mb-6 pb-4 border-b border-white/[0.08]">
              <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 border-l-2 border-stone-600 pl-4">
                On Deck
              </span>
            </div>
            <ul className="space-y-2">
              {wantToRead.map((item) => (
                <li key={item._id} className="flex items-center gap-3 py-2 border-b border-white/5">
                  <span className="text-sm flex-shrink-0">{MEDIA_ICONS[item.mediaType] ?? '📖'}</span>
                  <span className="font-serif text-stone-400">{item.title}</span>
                  {item.author && <span className="font-mono text-[9px] text-stone-700 ml-auto flex-shrink-0">{item.author}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Abandoned */}
        {abandoned.length > 0 && (
          <section className="mb-8 opacity-50">
            <div className="mb-4 pb-4 border-b border-white/5">
              <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-700 border-l-2 border-stone-800 pl-4">
                Abandoned
              </span>
            </div>
            <ul className="space-y-2">
              {abandoned.map((item) => (
                <li key={item._id} className="flex items-start gap-3 py-2 border-b border-white/5">
                  <span className="text-sm flex-shrink-0">{MEDIA_ICONS[item.mediaType] ?? '📖'}</span>
                  <div>
                    <span className="font-serif text-stone-600 line-through">{item.title}</span>
                    {item.abandonedReason && (
                      <p className="font-mono text-[9px] text-stone-700 mt-0.5">{item.abandonedReason}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}