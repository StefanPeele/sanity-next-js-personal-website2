import Link from 'next/link'
import { FOCUS } from '@/lib/ui'
// components/blog/SeriesBanner.tsx
// "Part N of M · Series title" with prev/next and a native <details> list of all parts.

interface SeriesPost { _id: string; title: string | null; slug: string | null; seriesOrder: number | null }
interface Series { title: string | null; slug: string | null; description: string | null; posts: SeriesPost[] }

type Labels = { partLabel: string; allPartsLabel: string; prevLabel: string; nextLabel: string }
const DEFAULT_LABELS: Labels = { partLabel: 'Part {n} of {m}', allPartsLabel: 'All parts', prevLabel: 'Previous', nextLabel: 'Next' }

export function SeriesBanner({ series, currentSlug, seriesOrder, labels = DEFAULT_LABELS }: { series: Series; currentSlug: string; seriesOrder?: number | null; labels?: Labels }) {
  const parts = series.posts.filter((p) => p.slug)
  if (!parts.length) return null
  let idx = parts.findIndex((p) => p.slug === currentSlug)
  if (idx < 0 && seriesOrder) idx = parts.findIndex((p) => p.seriesOrder === seriesOrder)
  const position = idx >= 0 ? idx + 1 : seriesOrder ?? null
  const prev = idx > 0 ? parts[idx - 1] : null
  const next = idx >= 0 && idx < parts.length - 1 ? parts[idx + 1] : null

  return (
    <nav aria-label="Series navigation" className="mb-10 rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-sans text-sm text-amber-300">
          {position ? labels.partLabel.replace('{n}', String(position)).replace('{m}', String(parts.length)) : `${parts.length} parts`}
        </span>
        <span className="text-stone-600" aria-hidden="true">·</span>
        {series.slug ? (
          <Link
            href={`/blog/series/${series.slug}`}
            className={`font-serif text-stone-100 hover:text-white underline decoration-stone-600 underline-offset-4 hover:decoration-white transition-colors ${FOCUS} rounded-sm`}
          >
            {series.title}
          </Link>
        ) : (
          <span className="font-serif text-stone-100">{series.title}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {prev?.slug ? (
            <Link href={`/blog/${prev.slug}`} rel="prev" className={`font-sans text-sm text-stone-300 hover:text-white px-3 py-2 border border-white/10 rounded-lg hover:border-white/30 transition-colors ${FOCUS}`} title={prev.title ?? undefined}>
              ← {labels.prevLabel}
            </Link>
          ) : null}
          {next?.slug ? (
            <Link href={`/blog/${next.slug}`} rel="next" className={`font-sans text-sm text-stone-300 hover:text-white px-3 py-2 border border-white/10 rounded-lg hover:border-white/30 transition-colors ${FOCUS}`} title={next.title ?? undefined}>
              {labels.nextLabel} →
            </Link>
          ) : null}
        </div>
      </div>
      <details className="group border-t border-white/5">
        <summary className={`cursor-pointer list-none px-5 py-3 font-sans text-sm text-stone-400 hover:text-white transition-colors flex items-center gap-2 ${FOCUS}`}>
          <span className="transition-transform group-open:rotate-90" aria-hidden="true">▸</span>
          {labels.allPartsLabel}
        </summary>
        <ol className="px-5 pb-4 space-y-1.5">
          {parts.map((p, i) => {
            const current = p.slug === currentSlug
            return (
              <li key={p._id} className="flex items-baseline gap-3">
                <span className="font-mono text-[10px] text-stone-400 w-5 text-right flex-shrink-0">{i + 1}.</span>
                {current ? (
                  <span className="font-serif text-sm text-white" aria-current="page">{p.title}</span>
                ) : (
                  <Link href={`/blog/${p.slug}`} className={`font-serif text-sm text-stone-300 hover:text-white transition-colors ${FOCUS} rounded-sm`}>
                    {p.title}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </details>
    </nav>
  )
}
