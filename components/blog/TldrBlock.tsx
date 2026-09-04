// components/blog/TldrBlock.tsx
// "If you read nothing else" summary rendered above the body. Server component.

import { articleTypeMeta } from '@/lib/site'

export function TldrBlock({ items, articleType }: { items: string[]; articleType?: string | null }) {
  const clean = items.filter((t) => typeof t === 'string' && t.trim().length > 0)
  if (!clean.length) return null
  const lane = articleTypeMeta(articleType)
  const accent = lane?.color ?? '#d6d3d1'

  return (
    <aside
      aria-labelledby="tldr-heading"
      className="mb-12 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 md:p-6"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h2 id="tldr-heading" className="font-mono text-[10px] uppercase tracking-[0.35em]" style={{ color: accent }}>
          TL;DR
        </h2>
        <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500">If you read nothing else</span>
      </div>
      <ul className="space-y-2.5">
        {clean.map((t, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="font-mono text-[10px] mt-1.5 flex-shrink-0" style={{ color: accent }} aria-hidden="true">→</span>
            <span className="font-serif text-base md:text-[17px] text-stone-200 leading-relaxed">{t}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
