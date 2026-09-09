import Link from 'next/link'
import { noteStatus } from '@/components/garden/status'
import { formatDate } from '@/lib/dates'
import { FOCUS } from '@/lib/ui'
// components/knowledge/RecentlyTended.tsx
// Server component. Accepts already-fetched notes (homeIntelQuery.recentNotes / nowQuery.recentNotes).
//
// Props: { notes: { title: string | null; slug: string | null; status: string | null; lastTended: string }[]; title?: string }

export interface RecentlyTendedNote {
  title: string | null
  slug: string | null
  status: string | null
  lastTended: string
}

export function RecentlyTended({ notes, title = 'Recently tended' }: { notes: RecentlyTendedNote[]; title?: string }) {
  const items = (notes ?? []).filter((n) => n.slug && n.title)
  return (
    <section aria-label={title}>
      {title && <div className="mb-3 flex items-center justify-between">
        <span className="section-label">{title}</span>
        <Link href="/garden" className={`font-sans text-sm text-stone-400 hover:text-white transition-colors ${FOCUS} rounded-sm`}>
          Garden →
        </Link>
      </div>}
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((n) => {
            const s = noteStatus(n.status)
            return (
              <li key={n.slug}>
                <Link href={`/garden/${n.slug}`} className={`group flex items-center gap-2.5 rounded-sm ${FOCUS}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} aria-hidden="true" />
                  <span className="font-serif text-sm text-stone-200 group-hover:text-white transition-colors truncate">{n.title}</span>
                  <time dateTime={formatDate(n.lastTended, 'iso')} className="ml-auto font-mono text-[8px] uppercase tracking-widest text-stone-400 flex-shrink-0">
                    {formatDate(n.lastTended, 'short')}
                  </time>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">No notes tended yet.</p>
      )}
    </section>
  )
}
