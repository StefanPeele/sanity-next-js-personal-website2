import { articleTypeMeta } from '@/lib/site'
import type { VocabEntry } from '@/lib/cms/defaults/taxonomy'
// components/blog/PlaceholderCards.tsx
// Phase 4.2 — cards for posts that are planned but not written.
//
// They exist so the finished shape of the page is visible before the content is, and so a
// planned section is not quietly forgotten. Every requirement in 4.2 is a constraint here:
//
//   NOT LINKS. 4.2 says "clickable but inert", and separately that a screen reader must
//   announce them as placeholders rather than as links. Those pull in opposite directions
//   only if you build a control. A plain <li> is inert BECAUSE it is not a control: a click
//   does nothing, nothing is focusable, and nothing is announced as a link. A disabled
//   <a> or a <button> that goes nowhere would be worse on both counts.
//
//   NEVER "BROKEN". The card carries the intended topic and an explicit label, so the empty
//   state reads as deliberate. An unlabelled grey box reads as a failed image.
//
//   NOT IN THE FEED. Nothing here is a document, so it cannot reach the feeds, the sitemap
//   or the graph -- those all query `_type == "post"`. `data-nosnippet` additionally keeps
//   the text out of search snippets. The honest limit: `data-nosnippet` suppresses snippets,
//   it does not deindex a page, and no per-element noindex exists. The mitigation is that
//   there is nothing here worth mistaking for an article -- a topic and the word "planned",
//   never a fabricated excerpt or date.
//
//   TRIVIALLY REMOVABLE. Driven entirely by the Studio array. Delete the entry, the card
//   goes. No code change, no deploy.

export interface PlannedItem { _key?: string | null; topic?: string | null; lane?: string | null }

interface Props {
  heading: string
  note?: string | null
  label: string
  treatment?: string | null
  items: PlannedItem[]
  lanes?: VocabEntry[]
}

export function PlaceholderCards({ heading, note, label, treatment, items, lanes }: Props) {
  const planned = items.filter((i) => i?.topic)
  if (!planned.length) return null

  return (
    <section className="mt-16" aria-labelledby="planned-heading" data-nosnippet>
      <div className="mb-6 border-b border-edge pb-5">
        <h2 id="planned-heading" className="text-2xl font-serif font-bold text-white">{heading}</h2>
        {note && <p className="font-sans text-sm text-stone-400 mt-1.5">{note}</p>}
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 list-none m-0 p-0">
        {planned.map((item, i) => {
          const meta = item.lane ? articleTypeMeta(item.lane, lanes) : null
          return (
            <li
              key={item._key ?? i}
              className="placeholder-card flex flex-col h-full"
              data-treatment={treatment === 'glass' ? 'glass' : 'dark'}
            >
              {/* Same 4:3 tile as a real card, so the page's shape is honest about what will
                  be there. Empty rather than a fake image. */}
              <div className="placeholder-tile aspect-[4/3] w-full rounded-lg mb-4" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {meta && <span className="meta-label" style={{ color: meta.color }}>{meta.short}</span>}
                {/* Announced, not decorative: this is the sentence that makes it a
                    placeholder rather than a broken card. */}
                <span className="meta-label text-stone-400">{label}</span>
              </div>
              <p className="font-serif text-lg text-stone-300 leading-snug">{item.topic}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
