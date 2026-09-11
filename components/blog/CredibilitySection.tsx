'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate } from '@/lib/dates'
import { enumKey } from '@/lib/stega'
import { CONFIDENCE, LOAD, MATURITY, reviewFlags } from '@/lib/status'
import type { ReviewerDisplay } from '@/lib/reviewers'
import { useArticleReducedMotion } from '@/components/article/ArticleProvider'
import { DEFAULT_ARTICLE_UI, type ArticleUiCopy } from '@/lib/cms/defaults/articleUi'
import { FOCUS, QUIET_LINK } from '@/lib/ui'
// components/blog/CredibilitySection.tsx

// This component receives ALREADY-REDACTED reviewers. It is a client component, so
// whatever it is given is serialized into the RSC payload and readable in view-source --
// redacting at render time here would hide an anonymous reviewer's name from the page
// while still shipping it to the browser. The page calls reviewerDisplay() on the server
// and only the result crosses the boundary. Do not change this back to ReviewerInput.
type Reviewer = ReviewerDisplay

interface ChangelogEntry {
  _key: string
  date: string
  description: string
}

interface FieldResponse {
  _key: string
  title: string
  url: string
  author?: string
  platform?: string
  summary?: string
  date?: string
}

interface CredibilitySectionProps {
  reviewStatus?: string[] | null
  reviewers?: Reviewer[]
  changelog?: ChangelogEntry[]
  responsesFromField?: FieldResponse[]
  confidenceLevel?: string
  maturityIndicator?: string
  cognitiveLoad?: string
  heading?: string
  labels?: ArticleUiCopy['credibility']
}

// The status vocabulary lives in lib/status.ts so the card, the header, the Contents
// column and the feeds all read one table. It used to live here, in a client component,
// which is exactly why the card and the feeds carried no status at all.
export function CredibilitySection({
  reviewStatus,
  reviewers: reviewersProp,
  changelog: changelogProp,
  responsesFromField: responsesProp,
  confidenceLevel,
  maturityIndicator,
  cognitiveLoad,
  heading = DEFAULT_ARTICLE_UI.blocks.credibilityHeading,
  labels = DEFAULT_ARTICLE_UI.credibility,
}: CredibilitySectionProps) {
  const lbl = (list: { key: string; label: string }[], key: string | undefined, fallback: string) => list.find((e) => e.key === key)?.label ?? fallback

  // Sanity returns null for unset array fields — coerce to empty array
  const reviewers          = reviewersProp ?? []
  const changelog          = changelogProp ?? []
  const responsesFromField = responsesProp ?? []

  const [changelogOpen, setChangelogOpen] = useState(false)
  const reduced = useArticleReducedMotion()

  const hasCredibilityContent =
    reviewers.length > 0 ||
    changelog.length > 0 ||
    responsesFromField.length > 0 ||
    confidenceLevel ||
    maturityIndicator

  if (!hasCredibilityContent) return null

  // enumKey, not the raw value. In draft mode Sanity encodes the field's source path into
  // the string as zero-width characters, so CONFIDENCE_CONFIG['working-theory\u200B…'] is
  // undefined and the badge silently vanishes in Presentation. See lib/stega.ts.
  const confidence = CONFIDENCE[enumKey(confidenceLevel) ?? ''] ?? null
  const maturity   = MATURITY[enumKey(maturityIndicator) ?? ''] ?? null
  const load       = LOAD[enumKey(cognitiveLoad) ?? ''] ?? null
  // All of them: the Contents column is the full-detail tier in 3.3.
  const reviewBadges = reviewFlags(reviewStatus)

  return (
    <section className="mt-16 pt-12 border-t border-edge space-y-8" aria-label={heading}>
      <h2 className="sr-only">{heading}</h2>

      {/* ── Metadata badges ────────────────────────────────────────── */}
      {(confidence || maturity || load || reviewBadges.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {reviewBadges.map((b) => (
            <span key={b.key} className={`meta-label px-3 py-1.5 rounded-sm border ${b.bg} ${b.color}`}>
              {b.label}
            </span>
          ))}
          {confidence && (
            <span className={`meta-label px-3 py-1.5 rounded-sm border ${confidence.bg} ${confidence.color}`}>
              {confidence.label}
            </span>
          )}
          {maturity && (
            <span className="meta-label px-3 py-1.5 rounded-sm border border-edge text-stone-400">
              {lbl(labels.maturity, maturityIndicator, maturity.label)}
            </span>
          )}
          {load && (
            <span className="meta-label px-3 py-1.5 rounded-sm border border-edge text-stone-400">
              {lbl(labels.load, cognitiveLoad, load.label)}
            </span>
          )}
        </div>
      )}

      {/* ── Expert reviewers ───────────────────────────────────────── */}
      {reviewers.length > 0 && (
        <div>
          <h3 className="section-label mb-6">{labels.reviewersHeading}</h3>
          <div className="space-y-6">
            {/* Every field here is already redacted -- an anonymous reviewer arrives with
                name, initial, organization and linkedIn nulled on the SERVER, so they are
                absent from the RSC payload as well as from the page. */}
            {reviewers.map((r) => (
              <div
                key={r.key}
                className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-950/[0.08]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {/* aria-hidden either way. The avatar is decorative: the initial
                        duplicates the name beside it, and a screen reader announcing
                        "P Publicly Named Reviewer" is noise. No initial at all for an
                        anonymous reviewer -- a single letter narrows a search far more
                        than it looks like it does. */}
                    <span className="font-mono text-xs text-emerald-400 font-bold" aria-hidden="true">
                      {r.initial ?? '·'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      {r.linkedIn ? (
                        <a
                          href={r.linkedIn}
                          target="_blank"
                          rel="noreferrer"
                          className={`font-serif text-white hover:text-emerald-300 transition-colors font-semibold rounded-sm ${FOCUS}`}
                        >
                          {r.label} ↗
                        </a>
                      ) : (
                        <span className={`font-serif font-semibold ${r.anonymous ? 'text-stone-200 italic' : 'text-white'}`}>
                          {r.anonymous ? `Reviewed by ${r.label}` : r.label}
                        </span>
                      )}
                      {r.role && (
                        <span className="meta-label text-stone-400">
                          {r.role}{r.organization ? ` · ${r.organization}` : ''}
                        </span>
                      )}
                      {r.date && (
                        <span className="font-mono text-xs text-stone-400 ml-auto">
                          {formatDate(r.date, 'month')}
                        </span>
                      )}
                    </div>
                    {r.quote && (
                      <blockquote className="font-serif italic text-stone-400 text-sm leading-relaxed mt-2 border-l border-emerald-500/30 pl-3">
                        "{r.quote}"
                      </blockquote>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Responses from the field ───────────────────────────────── */}
      {responsesFromField.length > 0 && (
        <div>
          <h3 className="section-label mb-4">{labels.responsesHeading}</h3>
          <div className="space-y-2">
            {responsesFromField.map((response) => (
              <a
                key={response._key}
                href={response.url}
                target="_blank"
                rel="noreferrer noopener"
                className={`flex items-start gap-4 p-4 rounded-lg border border-edge hover:border-edge-strong bg-surface-veil hover:bg-surface-fill transition-all group ${FOCUS}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-serif text-stone-200 group-hover:text-white transition-colors text-sm leading-snug">
                      {response.title}
                    </span>
                    {response.platform && (
                      <span className="meta-label text-stone-400 border border-stone-800 px-1.5 py-0.5 rounded-sm">
                        {response.platform}
                      </span>
                    )}
                  </div>
                  {response.summary && (
                    <p className="font-mono text-xs text-stone-400 leading-relaxed">
                      {response.summary}
                    </p>
                  )}
                  {response.author && (
                    <p className="font-mono text-xs text-stone-400 mt-1">— {response.author}</p>
                  )}
                </div>
                <span className="text-stone-600 group-hover:text-stone-400 transition-colors flex-shrink-0 mt-0.5">↗</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Changelog ─────────────────────────────────────────────── */}
      {changelog.length > 0 && (
        <div>
          <button
            onClick={() => setChangelogOpen((v) => !v)}
            aria-expanded={changelogOpen}
            type="button"
            className={`flex items-center gap-3 group rounded-sm ${FOCUS}`}
          >
            <span className="section-label group-hover:text-white transition-colors">
              {labels.changelogHeading}
            </span>
            <span className="font-mono text-xs text-stone-400 group-hover:text-stone-300 transition-colors">
              {changelog.length} update{changelog.length !== 1 ? 's' : ''} {changelogOpen ? '↑' : '↓'}
            </span>
          </button>
          <AnimatePresence>
            {changelogOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: reduced ? 0 : 0.3 }}
                className="overflow-hidden mt-4"
              >
                <ol className="space-y-2 border-l border-edge pl-4">
                  {changelog
                    .slice()
                    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
                    .map((entry) => (
                      <li key={entry._key} className="flex items-start gap-4">
                        <span className="font-mono text-xs text-stone-600 flex-shrink-0 mt-0.5 w-24">
                          {formatDate(entry.date, 'short')}
                        </span>
                        <span className="font-mono text-xs text-stone-400 leading-relaxed">
                          {entry.description}
                        </span>
                      </li>
                    ))}
                </ol>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Correction link ───────────────────────────────────────── */}
      <div className="pt-4 border-t border-edge-faint">
        <a
          href={labels.correctionsUrl}
          target="_blank"
          rel="noreferrer noopener"
          className={`font-sans text-sm ${QUIET_LINK}`}
        >
          {labels.correctionsLabel} →
        </a>
      </div>
    </section>
  )
}