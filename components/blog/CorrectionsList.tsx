import { CORRECTION_LABELS, type NumberedCorrection } from '@/lib/corrections'
import { formatDate } from '@/lib/dates'
import { Icon, type IconName } from '@/lib/cms/icons'
import { FOCUS } from '@/lib/ui'
// components/blog/CorrectionsList.tsx
// The permanent half of 3B: every correction on a post, at the foot, addressable.
//
// arXiv's shape — date, kind, what changed, who caught it — because that is the one prior
// art that is genuinely permanent, and permanence is the point. A correction a reader
// cannot link to is a correction they cannot cite back at you.
//
// Each entry has id="correction-N" matching the [cN] marker in the prose, so the marker and
// this list address each other.

const KIND_ICON: Record<string, IconName> = {
  correction: 'alert-circle',
  clarification: 'info',
  update: 'rotate-ccw',
}

// Same colours as the status tier in lib/status.ts — a correction here and the "Corrected"
// badge in the header are the same fact, and must not be two different colours.
const KIND_COLOR: Record<string, string> = {
  correction: 'text-rose-400',
  clarification: 'text-sky-400',
  update: 'text-stone-300',
}

export function CorrectionsList({ corrections, heading = 'Corrections' }: { corrections: NumberedCorrection[]; heading?: string }) {
  if (!corrections.length) return null

  return (
    <section className="mt-16 pt-10 border-t border-edge" aria-labelledby="corrections-heading">
      <div className="flex items-center gap-4 mb-8">
        <h2 id="corrections-heading" className="section-label">{heading}</h2>
        <span className="font-sans text-xs text-stone-400">{corrections.length} recorded</span>
      </div>

      <ol className="space-y-6">
        {corrections.map((c) => {
          const meta = CORRECTION_LABELS[c.kind]
          const when = c.date ? formatDate(c.date, 'long', '') : ''
          return (
            <li key={c.key} id={`correction-${c.n}`} className="flex items-start gap-4 scroll-mt-24">
              <span className="font-mono text-xs text-stone-400 flex-shrink-0 mt-0.5 w-7 text-right">[c{c.n}]</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <Icon name={KIND_ICON[c.kind] ?? 'alert-circle'} size={14} className={`flex-shrink-0 ${KIND_COLOR[c.kind] ?? 'text-stone-300'}`} aria-hidden />
                  <span className="meta-label text-stone-300">{meta.label}</span>
                  {when && <span className="font-mono text-xs text-stone-400">{when}</span>}
                  {!c.anchored && c.anchor && (
                    // Said out loud rather than hidden. Two causes produce this and the
                    // author's fix is the same for both: the passage was edited after the
                    // correction was written, OR it sits inside a link, sidenote, glossary
                    // term, code span or heading, all of which the marker deliberately skips.
                    // The wording covers both rather than asserting the first and being
                    // wrong half the time.
                    <span
                      className="font-mono text-xs text-amber-400/80"
                      title="The anchor text was not marked in the body. Either the passage has been edited since, or it sits inside a link, sidenote, glossary term, code span or heading, which are never marked."
                    >
                      not marked in the text
                    </span>
                  )}
                </div>

                <p className="font-sans text-sm text-stone-200 leading-relaxed">{c.now}</p>

                {c.was && (
                  <p className="font-mono text-xs text-stone-400 leading-relaxed mt-2 pl-3 border-l border-edge">
                    It said: {c.was}
                  </p>
                )}

                {c.creditTo && (
                  // The line the whole feature exists for.
                  <p className="font-sans text-xs text-stone-400 mt-2">
                    {meta.verb}{when ? ` ${when}` : ''} — thanks to{' '}
                    {c.creditUrl
                      ? <a href={c.creditUrl} target="_blank" rel="noreferrer noopener" className={`text-stone-300 underline underline-offset-2 rounded-sm ${FOCUS}`}>{c.creditTo}</a>
                      : <span className="text-stone-300">{c.creditTo}</span>}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
