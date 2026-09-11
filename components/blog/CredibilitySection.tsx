'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate } from '@/lib/dates'
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

// Confidence answers only "how sure am I". 'verified' and 'peer-reviewed' were removed
// from this scale in Phase 3.1 -- they restated maturityIndicator and reviewStatus, and
// 'peer-reviewed' rendered here in blue while the same event rendered in REVIEW_CONFIG in
// emerald. One event, one place. See EDITORIAL-RESEARCH.md §1.4.
const CONFIDENCE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'speculative':    { label: 'Speculative',      color: 'text-orange-400', bg: 'border-orange-500/30 bg-orange-950/10' },
  'working-theory': { label: 'Working theory',   color: 'text-amber-400',  bg: 'border-amber-500/30 bg-amber-950/10' },
  'confident':      { label: 'Confident',        color: 'text-stone-300',  bg: 'border-stone-500/30 bg-stone-950/30' },
}

const MATURITY_CONFIG: Record<string, { label: string }> = {
  'fresh': { label: 'Fresh' },
  'tested': { label: 'Lab tested' },
  'production-proven': { label: 'Production proven' },
}

const LOAD_CONFIG: Record<string, { label: string }> = {
  'light': { label: 'Light read' },
  'technical': { label: 'Technical' },
  'dense': { label: 'Dense' },
  'reference': { label: 'Reference' },
}

// Independent flags -- several can be true at once. Peer-reviewed and fact-checked are
// deliberately NOT on one scale: fact-checking is claim-level (were these statements
// true), peer review is document-level (is the argument sound), and neither implies the
// other. They are given different colours for that reason, not different weights.
// Order here is the render order.
const REVIEW_FLAG_ORDER = ['peer-reviewed', 'fact-checked', 'seeking-review', 'open-to-comment', 'revised'] as const

const REVIEW_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'peer-reviewed':   { label: 'Peer reviewed',        color: 'text-emerald-400', bg: 'border-emerald-500/30 bg-emerald-950/10' },
  'fact-checked':    { label: 'Fact checked',         color: 'text-blue-400',    bg: 'border-blue-500/30 bg-blue-950/10' },
  'seeking-review':  { label: 'Seeking peer review',  color: 'text-amber-400',   bg: 'border-amber-500/30 bg-amber-950/10' },
  'open-to-comment': { label: 'Open to comment',      color: 'text-stone-300',   bg: 'border-stone-500/30 bg-stone-950/30' },
  'revised':         { label: 'Revised',              color: 'text-stone-300',   bg: 'border-stone-500/30 bg-stone-950/30' },
}

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

  const confidence = confidenceLevel ? CONFIDENCE_CONFIG[confidenceLevel] : null
  const maturity   = maturityIndicator ? MATURITY_CONFIG[maturityIndicator] : null
  const load       = cognitiveLoad ? LOAD_CONFIG[cognitiveLoad] : null
  const reviewBadges = REVIEW_FLAG_ORDER
    .filter((f) => (reviewStatus ?? []).includes(f))
    .map((f) => ({ key: f, ...REVIEW_STATUS_CONFIG[f] }))

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
                    <span className="font-mono text-xs text-emerald-400 font-bold" aria-hidden={r.initial ? undefined : true}>
                      {/* No initial for an anonymous reviewer -- a single letter narrows a
                          search far more than it looks like it does. */}
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