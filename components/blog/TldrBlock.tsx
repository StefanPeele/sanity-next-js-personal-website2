// components/blog/TldrBlock.tsx
// "If you read nothing else" summary rendered above the body. Server component.

import { articleTypeMeta } from '@/lib/site'

export function TldrBlock({ items, articleType, heading = 'TL;DR', sub = 'If you read nothing else' }: { items: string[]; articleType?: string | null; heading?: string; sub?: string }) {
  const clean = items.filter((t) => typeof t === 'string' && t.trim().length > 0)
  if (!clean.length) return null
  const lane = articleTypeMeta(articleType)
  const accent = lane?.color ?? '#d6d3d1'

  return (
    <aside
      aria-labelledby="tldr-heading"
      className="mb-12 rounded-xl border border-edge bg-surface-veil p-5 md:p-6"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h2 id="tldr-heading" className="font-serif text-lg font-semibold" style={{ color: accent }}>{heading}</h2>
        <span className="font-sans text-xs text-stone-400">{sub}</span>
      </div>
      <ul className="space-y-2.5">
        {clean.map((t, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-2.5 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} aria-hidden="true" />
            <span className="font-serif text-base md:text-lg text-stone-200 leading-relaxed">{t}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
