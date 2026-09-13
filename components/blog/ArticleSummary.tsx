import { summaryVerdict, type SummaryInput } from '@/lib/summary'
// components/blog/ArticleSummary.tsx — PROPOSALS 5.6, the reader-facing half.
//
// Renders nothing at all unless the summary is present AND still describes the post AND has
// not been overtaken by a correction. Every uncertain case hides it: on a site whose subject
// is epistemic honesty, a summary that is merely probably still accurate is worth less than
// no summary.
//
// The label is the first line of the panel, not a tooltip and not a comment in the page
// source, and it is never styled like prose -- different family, different colour, inside a
// bordered panel, closer to the correction card than to the article body. When the summary
// was written by hand there is NO label, because labelling authored text as machine-written
// would be its own kind of dishonesty.
//
// It is deliberately absent from the feeds. RSS and JSON Feed strip context, and a label
// that survives in one reader is lost in the next; the feeds carry the authored `excerpt`
// instead. Nothing to do here to keep that true -- the feed queries never select `summary` --
// but it is the kind of thing a later change breaks by accident.

type Block = { _type?: string; children?: Array<{ text?: string | null } | null> | null } | null

export function ArticleSummary({
  post,
  body,
  correctionDates,
  formatDate,
  heading,
}: {
  post: SummaryInput
  body: Block[] | null | undefined
  /** Dates of every correction on the post. Any one newer than the summary suppresses it. */
  correctionDates?: Array<string | null | undefined>
  formatDate: (iso: string) => string
  heading: string
}) {
  const verdict = summaryVerdict(post, body, correctionDates ?? [], formatDate)
  if (!verdict.show) return null

  return (
    <aside
      data-span="wide"
      data-print-hide
      aria-labelledby="article-summary-heading"
      className="not-prose my-8 rounded-lg border border-edge bg-surface-veil p-5"
    >
      <h2 id="article-summary-heading" className="meta-label text-sm mb-2">
        {heading}
      </h2>
      {/* The provenance line. Present only for a generated summary. */}
      {verdict.label && (
        <p className="font-mono text-xs text-stone-400 mb-3">{verdict.label}</p>
      )}
      <p className="font-sans text-base text-stone-300 leading-relaxed m-0">{verdict.text}</p>
    </aside>
  )
}
