import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/dates'
import type { LibraryItem } from './types'
import { MEDIA_ICON_FALLBACK, MEDIA_ICONS, MEDIA_LABELS, RATING_CONFIG } from './types'
import { Icon } from '@/lib/cms/icons'
import { FOCUS } from '@/lib/ui'
import { ChevronRight } from 'lucide-react'
// components/library/MediaCard.tsx
// One library entry. Renders the one-sentence take, key idea, pull quote,
// highlights (disclosure), rating, progress and the posts/notes it influenced.

export function MediaCard({ item, size = 'normal' }: { item: LibraryItem; size?: 'large' | 'normal' }) {
  const ratingConfig = item.rating ? RATING_CONFIG[item.rating] : null
  const large = size === 'large'
  const posts = item.influencedPosts ?? []
  const notes = item.influencedNotes ?? []
  const highlights = (item.highlights ?? []).filter(Boolean)

  return (
    <article
      id={item._id}
      className={`flex gap-5 p-5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:border-white/15 transition-all scroll-mt-28 target:border-amber-400/40 ${large ? 'md:gap-6 md:p-6' : ''}`}
      aria-labelledby={`lib-${item._id}`}
    >
      {/* Cover */}
      <div className={`flex-shrink-0 bg-stone-900 rounded-lg border border-white/[0.08] overflow-hidden flex items-center justify-center ${large ? 'w-20 h-28 md:w-24 md:h-32' : 'w-14 h-20'}`}>
        {item.coverUrl ? (
          <Image
            src={item.coverUrl}
            alt={`Cover of ${item.title ?? 'item'}`}
            width={large ? 96 : 56}
            height={large ? 128 : 80}
            className="w-full h-full object-cover"
          />
        ) : (
          <Icon name={MEDIA_ICONS[item.mediaType ?? ''] ?? MEDIA_ICON_FALLBACK} size={large ? 28 : 20} className="text-stone-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap mb-1">
          <span className="meta-label text-stone-400">
            <Icon name={MEDIA_ICONS[item.mediaType ?? ''] ?? MEDIA_ICON_FALLBACK} size={10} className="inline -mt-px mr-1" />{MEDIA_LABELS[item.mediaType ?? ''] ?? item.mediaType}
          </span>
          {item.category && <span className="meta-label text-stone-400">· {item.category}</span>}
          {item.finishedAt && item.status === 'finished' && (
            <span className="meta-label text-stone-400">· Finished {formatDate(item.finishedAt, 'month')}</span>
          )}
        </div>

        <h3 id={`lib-${item._id}`} className={`font-serif font-semibold leading-snug mb-1 ${large ? 'text-lg' : 'text-base'}`}>
          {item.url ? (
            <a href={item.url} target="_blank" rel="noreferrer noopener" className={`text-white hover:text-stone-300 transition-colors rounded-sm ${FOCUS}`}>
              {item.title} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <span className="text-white">{item.title}</span>
          )}
        </h3>

        {item.author && <p className="font-mono text-xs text-stone-400 mb-2">{item.author}</p>}

        {item.status === 'current' && typeof item.progressPercent === 'number' && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-0.5 bg-white/[0.08] rounded-full overflow-hidden" role="progressbar" aria-valuenow={item.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Reading progress">
                <div className="h-full bg-emerald-500/70 rounded-full" style={{ width: `${item.progressPercent}%` }} />
              </div>
              <span className="font-mono text-xs text-stone-400">{item.progressPercent}%</span>
            </div>
            {item.startedAt && (
              <span className="meta-label text-stone-400">Started {formatDate(item.startedAt, 'month')}</span>
            )}
          </div>
        )}

        {item.oneSentenceTake && (
          <p className="font-serif italic text-stone-300 text-sm leading-relaxed mb-2">“{item.oneSentenceTake}”</p>
        )}

        {item.keyIdea && (
          <p className="text-stone-400 text-sm leading-relaxed mb-2">
            <span className="meta-label text-stone-400 mr-2">Key idea</span>
            {item.keyIdea}
          </p>
        )}

        {item.quote && (
          <blockquote className="my-3 pl-4 border-l-2 border-stone-600 font-serif text-stone-300 text-base leading-relaxed">
            <p>“{item.quote}”</p>
            {item.author && <footer className="meta-label text-stone-400 mt-1">— {item.author}</footer>}
          </blockquote>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {ratingConfig && (
            <span className={`meta-label ${ratingConfig.color}`}>{ratingConfig.label}</span>
          )}
          {item.status === 'abandoned' && item.abandonedReason && (
            <span className="font-mono text-xs text-stone-400">{item.abandonedReason}</span>
          )}
        </div>

        {highlights.length > 0 && (
          <details className="mt-3 group">
            <summary className={`meta-label cursor-pointer text-stone-400 hover:text-white transition-colors rounded-sm list-none flex items-center gap-2 ${FOCUS}`}>
              <ChevronRight size={14} className="inline-block transition-transform group-open:rotate-90" aria-hidden="true" />
              {highlights.length} highlight{highlights.length === 1 ? '' : 's'}
            </summary>
            <ul className="mt-2 space-y-2 pl-4 border-l border-white/[0.08]">
              {highlights.map((h, i) => (
                <li key={i} className="font-serif text-sm text-stone-300 leading-relaxed">{h}</li>
              ))}
            </ul>
          </details>
        )}

        {(posts.length > 0 || notes.length > 0) && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <span className="meta-label text-stone-400 block mb-1.5">Influenced</span>
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              {posts.map((post) => (
                <li key={`p-${post.slug}`}>
                  <Link href={`/blog/${post.slug}`} className={`font-mono text-xs text-stone-400 hover:text-white transition-colors underline underline-offset-4 decoration-stone-700 hover:decoration-stone-400 rounded-sm ${FOCUS}`}>
                    {post.title}
                  </Link>
                </li>
              ))}
              {notes.map((note) => (
                <li key={`n-${note.slug}`}>
                  <Link href={`/garden/${note.slug}`} className={`font-mono text-xs text-emerald-300/80 hover:text-white transition-colors underline underline-offset-4 decoration-emerald-900 hover:decoration-emerald-400 rounded-sm ${FOCUS}`}>
                    <Icon name="sprout" size={10} className="inline -mt-px mr-1" />{note.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  )
}
