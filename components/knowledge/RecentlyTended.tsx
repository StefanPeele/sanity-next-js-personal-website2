import Link from 'next/link'
import { noteStatus } from '@/components/garden/status'
import { formatDate } from '@/lib/dates'
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
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-stone-400 border-l-2 border-green-600 pl-3">{title}</span>
        <Link href="/garden" className="font-mono text-[9px] uppercase tracking-widest text-stone-500 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded-sm">
          Garden →
        </Link>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((n) => {
            const s = noteStatus(n.status)
            return (
              <li key={n.slug}>
                <Link href={`/garden/${n.slug}`} className="group flex items-center gap-2.5 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} aria-hidden="true" />
                  <span className="font-serif text-sm text-stone-200 group-hover:text-white transition-colors truncate">{n.title}</span>
                  <time dateTime={formatDate(n.lastTended, 'iso')} className="ml-auto font-mono text-[8px] uppercase tracking-widest text-stone-500 flex-shrink-0">
                    {formatDate(n.lastTended, 'short')}
                  </time>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="font-mono text-[9px] text-stone-500 uppercase tracking-widest">No notes tended yet.</p>
      )}
    </section>
  )
}
