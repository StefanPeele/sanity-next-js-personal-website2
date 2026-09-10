import Link from 'next/link'
import Image from 'next/image'
import { MEDIA_ICON_FALLBACK, MEDIA_ICONS, MEDIA_LABELS } from '@/components/library/types'
import { Icon } from '@/lib/cms/icons'
import { FOCUS } from '@/lib/ui'
// components/knowledge/CurrentlyReading.tsx
// Server component. Accepts already-fetched items (homeIntelQuery.currentlyReading / nowQuery.reading).
//
// Props: { items: { title: string | null; author: string | null; mediaType: string | null; progressPercent: number | null; coverUrl?: string | null; _id?: string }[]; title?: string }

export interface CurrentlyReadingItem {
  _id?: string
  title: string | null
  author: string | null
  mediaType: string | null
  progressPercent: number | null
  coverUrl?: string | null
}

export function CurrentlyReading({ items, title = 'Currently reading' }: { items: CurrentlyReadingItem[]; title?: string }) {
  const list = (items ?? []).filter((i) => i.title)
  return (
    <section aria-label={title}>
      {title && <div className="mb-3 flex items-center justify-between">
        <span className="section-label">{title}</span>
        <Link href="/library" className={`font-sans text-sm text-stone-400 hover:text-white transition-colors ${FOCUS} rounded-sm`}>
          Library →
        </Link>
      </div>}
      {list.length > 0 ? (
        <ul className="space-y-3">
          {list.map((item, i) => {
            const href = item._id ? `/library#${item._id}` : '/library'
            return (
              <li key={item._id ?? `${item.title}-${i}`}>
                <Link href={href} className={`group flex gap-3 rounded-sm ${FOCUS}`}>
                  <span className="flex-shrink-0 w-9 h-12 rounded border border-edge bg-surface-raised overflow-hidden flex items-center justify-center">
                    {item.coverUrl ? (
                      <Image src={item.coverUrl} alt="" width={36} height={48} className="w-full h-full object-cover" />
                    ) : (
                      <Icon name={MEDIA_ICONS[item.mediaType ?? ''] ?? MEDIA_ICON_FALLBACK} size={16} className="text-stone-400" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-serif text-sm text-white group-hover:text-stone-200 leading-snug truncate">{item.title}</span>
                      <span className="meta-label text-stone-400 flex-shrink-0">{MEDIA_LABELS[item.mediaType ?? ''] ?? item.mediaType}</span>
                    </span>
                    {item.author && <span className="font-mono text-xs text-stone-400 block truncate">{item.author}</span>}
                    {typeof item.progressPercent === 'number' && (
                      <span className="flex items-center gap-2 mt-1.5">
                        <span className="flex-1 h-0.5 bg-surface-fill-strong rounded-full overflow-hidden" role="progressbar" aria-valuenow={item.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.title} progress`}>
                          <span className="block h-full bg-emerald-500/70 rounded-full" style={{ width: `${Math.max(0, Math.min(100, item.progressPercent))}%` }} />
                        </span>
                        <span className="font-mono text-xs text-stone-400">{item.progressPercent}%</span>
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="meta-label text-stone-400">Nothing on the nightstand right now.</p>
      )}
    </section>
  )
}
