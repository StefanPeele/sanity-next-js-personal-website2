'use client'

import { useMemo, useState } from 'react'
import { MediaCard } from './MediaCard'
import { yearOf } from '@/lib/dates'
import { MEDIA_ICON_FALLBACK, MEDIA_ICONS, MEDIA_LABELS, STATUS_LABELS, type LibraryItem, type LibraryStatus, type MediaType } from './types'
import { Icon } from '@/lib/cms/icons'
import { FOCUS } from '@/lib/ui'
// components/library/LibraryClient.tsx
// Filters (media type + status), then the shelves: reading now, reference shelf,
// finished by year, on deck, abandoned.

const STATUS_ORDER: LibraryStatus[] = ['current', 'reference', 'finished', 'want-to-read', 'abandoned']

function chip(active: boolean) {
  return `font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-sm border transition-all ${FOCUS} ${
    active ? 'bg-white text-black border-white' : 'border-white/15 text-stone-400 hover:text-white hover:border-white/30'
  }`
}

function Shelf({ id, label, accent = 'border-stone-600', children, count }: { id: string; label: string; accent?: string; children: React.ReactNode; count: number }) {
  return (
    <section className="mb-16" aria-labelledby={id}>
      <div className="mb-6 pb-4 border-b border-white/[0.08] flex items-center justify-between">
        <h2 id={id} className={`font-mono text-[10px] tracking-[0.4em] uppercase text-stone-400 border-l-2 ${accent} pl-4`}>{label}</h2>
        <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">{count}</span>
      </div>
      {children}
    </section>
  )
}

export function LibraryClient({ items }: { items: LibraryItem[] }) {
  const [type, setType] = useState<MediaType | null>(null)
  const [status, setStatus] = useState<LibraryStatus | null>(null)

  const types = useMemo(() => {
    const m = new Map<MediaType, number>()
    items.forEach((i) => i.mediaType && m.set(i.mediaType, (m.get(i.mediaType) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [items])

  const statuses = useMemo(() => {
    const m = new Map<LibraryStatus, number>()
    items.forEach((i) => i.status && m.set(i.status, (m.get(i.status) ?? 0) + 1))
    return STATUS_ORDER.filter((s) => m.has(s)).map((s) => [s, m.get(s) ?? 0] as const)
  }, [items])

  const filtered = useMemo(
    () => items.filter((i) => (!type || i.mediaType === type) && (!status || i.status === status)),
    [items, type, status],
  )

  const current = filtered.filter((i) => i.status === 'current')
  const reference = filtered.filter((i) => i.status === 'reference')
  const finished = filtered.filter((i) => i.status === 'finished')
  const wantToRead = filtered.filter((i) => i.status === 'want-to-read')
  const abandoned = filtered.filter((i) => i.status === 'abandoned')

  const finishedByYear = useMemo(() => {
    const groups = new Map<string, LibraryItem[]>()
    finished.forEach((item) => {
      const y = yearOf(item.finishedAt)
      const key = y ? String(y) : 'Undated'
      groups.set(key, [...(groups.get(key) ?? []), item])
    })
    return [...groups.entries()].sort((a, b) => (b[0] === 'Undated' ? -1 : a[0] === 'Undated' ? 1 : Number(b[0]) - Number(a[0])))
  }, [finished])

  const anyFilter = Boolean(type || status)

  return (
    <div>
      {/* Filters */}
      <div className="space-y-3 mb-12">
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter by media type">
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-stone-400 w-14">Type</span>
          <button type="button" onClick={() => setType(null)} aria-pressed={type === null} className={chip(type === null)}>All</button>
          {types.map(([t, n]) => (
            <button key={t} type="button" onClick={() => setType(type === t ? null : t)} aria-pressed={type === t} className={chip(type === t)}>
              <Icon name={MEDIA_ICONS[t]} size={10} className="inline -mt-px mr-1" />{MEDIA_LABELS[t] ?? t} <span className="opacity-60 text-[8px]">{n}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter by status">
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-stone-400 w-14">Status</span>
          <button type="button" onClick={() => setStatus(null)} aria-pressed={status === null} className={chip(status === null)}>All</button>
          {statuses.map(([s, n]) => (
            <button key={s} type="button" onClick={() => setStatus(status === s ? null : s)} aria-pressed={status === s} className={chip(status === s)}>
              {STATUS_LABELS[s]} <span className="opacity-60 text-[8px]">{n}</span>
            </button>
          ))}
        </div>
        <p className="font-mono text-[9px] uppercase tracking-widest text-stone-400" aria-live="polite">
          {filtered.length} of {items.length} item{items.length === 1 ? '' : 's'}
          {anyFilter && (
            <>
              {' · '}
              <button type="button" onClick={() => { setType(null); setStatus(null) }} className={`underline underline-offset-4 hover:text-white rounded-sm ${FOCUS}`}>Clear</button>
            </>
          )}
        </p>
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center border border-white/5 rounded-xl mb-16">
          <p className="font-serif italic text-stone-400 text-lg mb-2">Nothing on this shelf.</p>
          <p className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">Try another type or status.</p>
        </div>
      )}

      {current.length > 0 && (
        <Shelf id="shelf-current" label="Currently Reading" accent="border-emerald-600" count={current.length}>
          <div className="space-y-4">
            {current.map((item) => <MediaCard key={item._id} item={item} size="large" />)}
          </div>
        </Shelf>
      )}

      {reference.length > 0 && (
        <Shelf id="shelf-reference" label="Reference Shelf — Constantly Returning" accent="border-cyan-700" count={reference.length}>
          <p className="font-mono text-[9px] text-stone-400 uppercase tracking-widest mb-4 -mt-2">
            Never finished on purpose. Dipped into whenever a real problem needs the authoritative answer.
          </p>
          <div className="space-y-3">
            {reference.map((item) => <MediaCard key={item._id} item={item} />)}
          </div>
        </Shelf>
      )}

      {finishedByYear.map(([year, group]) => (
        <Shelf key={year} id={`shelf-${year}`} label={`Finished ${year}`} count={group.length}>
          <div className="space-y-3">
            {group.map((item) => <MediaCard key={item._id} item={item} />)}
          </div>
        </Shelf>
      ))}

      {wantToRead.length > 0 && (
        <Shelf id="shelf-deck" label="On Deck" count={wantToRead.length}>
          <ul className="space-y-2">
            {wantToRead.map((item) => (
              <li key={item._id} id={item._id} className="flex items-center gap-3 py-2 border-b border-white/5 scroll-mt-28">
                <Icon name={MEDIA_ICONS[item.mediaType ?? ''] ?? MEDIA_ICON_FALLBACK} size={14} className="flex-shrink-0 text-stone-400 mt-1" />
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noreferrer noopener" className={`font-serif text-stone-300 hover:text-white rounded-sm ${FOCUS}`}>{item.title}</a>
                ) : (
                  <span className="font-serif text-stone-300">{item.title}</span>
                )}
                {item.oneSentenceTake && <span className="font-mono text-[9px] text-stone-400 hidden md:inline truncate">— {item.oneSentenceTake}</span>}
                {item.author && <span className="font-mono text-[9px] text-stone-400 ml-auto flex-shrink-0">{item.author}</span>}
              </li>
            ))}
          </ul>
        </Shelf>
      )}

      {abandoned.length > 0 && (
        <Shelf id="shelf-abandoned" label="Abandoned" accent="border-stone-800" count={abandoned.length}>
          <ul className="space-y-2">
            {abandoned.map((item) => (
              <li key={item._id} id={item._id} className="flex items-start gap-3 py-2 border-b border-white/5 scroll-mt-28">
                <Icon name={MEDIA_ICONS[item.mediaType ?? ''] ?? MEDIA_ICON_FALLBACK} size={14} className="flex-shrink-0 text-stone-400 mt-1" />
                <div>
                  <span className="font-serif text-stone-400 line-through decoration-stone-600">{item.title}</span>
                  {item.author && <span className="font-mono text-[9px] text-stone-400 ml-2">{item.author}</span>}
                  {item.abandonedReason && <p className="font-mono text-[9px] text-stone-400 mt-0.5">{item.abandonedReason}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Shelf>
      )}
    </div>
  )
}
