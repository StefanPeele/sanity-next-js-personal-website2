'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate } from '@/lib/dates'
import { useArticleReducedMotion } from '@/components/article/ArticleProvider'
import { DEFAULT_ARTICLE_UI, type ArticleUiCopy } from '@/lib/cms/defaults/articleUi'
// components/blog/CredibilitySection.tsx

interface Reviewer {
  _key: string
  name: string
  role?: string
  organization?: string
  quote?: string
  date?: string
  linkedIn?: string
}

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
  reviewStatus?: string
  reviewers?: Reviewer[]
  changelog?: ChangelogEntry[]
  responsesFromField?: FieldResponse[]
  confidenceLevel?: string
  maturityIndicator?: string
  cognitiveLoad?: string
  heading?: string
  labels?: ArticleUiCopy['credibility']
}

const CONFIDENCE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'speculative':    { label: 'Speculative',      color: 'text-orange-400', bg: 'border-orange-500/30 bg-orange-950/10' },
  'working-theory': { label: 'Working Theory',   color: 'text-amber-400',  bg: 'border-amber-500/30 bg-amber-950/10' },
  'confident':      { label: 'Confident',        color: 'text-stone-300',  bg: 'border-stone-500/30 bg-stone-950/30' },
  'verified':       { label: 'Verified',         color: 'text-emerald-400', bg: 'border-emerald-500/30 bg-emerald-950/10' },
  'peer-reviewed':  { label: 'Peer Reviewed',    color: 'text-blue-400',   bg: 'border-blue-500/30 bg-blue-950/10' },
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

const REVIEW_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'seeking-review':    { label: 'Seeking peer review', color: 'text-amber-400', bg: 'border-amber-500/30 bg-amber-950/10' },
  'community-reviewed':{ label: 'Community reviewed',  color: 'text-blue-400',  bg: 'border-blue-500/30 bg-blue-950/10' },
  'expert-verified':   { label: 'Expert verified',     color: 'text-emerald-400', bg: 'border-emerald-500/30 bg-emerald-950/10' },
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
  const reviewBadge = reviewStatus ? REVIEW_STATUS_CONFIG[reviewStatus] : null

  return (
    <section className="mt-16 pt-12 border-t border-white/[0.08] space-y-8" aria-label={heading}>
      <h2 className="sr-only">{heading}</h2>

      {/* ── Metadata badges ────────────────────────────────────────── */}
      {(confidence || maturity || load || reviewBadge) && (
        <div className="flex flex-wrap gap-2">
          {reviewBadge && (
            <span className={`font-mono text-[9px] uppercase tracking-[0.3em] px-3 py-1.5 rounded-sm border ${reviewBadge.bg} ${reviewBadge.color}`}>
              {reviewBadge.label}
            </span>
          )}
          {confidence && (
            <span className={`font-mono text-[9px] uppercase tracking-[0.3em] px-3 py-1.5 rounded-sm border ${confidence.bg} ${confidence.color}`}>
              {confidence.label}
            </span>
          )}
          {maturity && (
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] px-3 py-1.5 rounded-sm border border-white/10 text-stone-400">
              {lbl(labels.maturity, maturityIndicator, maturity.label)}
            </span>
          )}
          {load && (
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] px-3 py-1.5 rounded-sm border border-white/10 text-stone-500">
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
            {reviewers.map((reviewer) => (
              <div
                key={reviewer._key}
                className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-950/[0.08]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">
                      {reviewer.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      {reviewer.linkedIn ? (
                        <a
                          href={reviewer.linkedIn}
                          target="_blank"
                          rel="noreferrer"
                          className="font-serif text-white hover:text-emerald-300 transition-colors font-semibold"
                        >
                          {reviewer.name} ↗
                        </a>
                      ) : (
                        <span className="font-serif text-white font-semibold">{reviewer.name}</span>
                      )}
                      {reviewer.role && (
                        <span className="font-mono text-[9px] text-stone-500 uppercase tracking-widest">
                          {reviewer.role}{reviewer.organization ? ` · ${reviewer.organization}` : ''}
                        </span>
                      )}
                      {reviewer.date && (
                        <span className="font-mono text-[9px] text-stone-500 ml-auto">
                          {formatDate(reviewer.date, 'month')}
                        </span>
                      )}
                    </div>
                    {reviewer.quote && (
                      <blockquote className="font-serif italic text-stone-400 text-sm leading-relaxed mt-2 border-l border-emerald-500/30 pl-3">
                        "{reviewer.quote}"
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
                className="flex items-start gap-4 p-4 rounded-lg border border-white/[0.08] hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-serif text-stone-200 group-hover:text-white transition-colors text-sm leading-snug">
                      {response.title}
                    </span>
                    {response.platform && (
                      <span className="font-mono text-[8px] uppercase tracking-widest text-stone-600 border border-stone-800 px-1.5 py-0.5 rounded-sm">
                        {response.platform}
                      </span>
                    )}
                  </div>
                  {response.summary && (
                    <p className="font-mono text-[10px] text-stone-600 leading-relaxed">
                      {response.summary}
                    </p>
                  )}
                  {response.author && (
                    <p className="font-mono text-[9px] text-stone-500 mt-1">— {response.author}</p>
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
            className="flex items-center gap-3 group"
          >
            <span className="section-label group-hover:text-white transition-colors">
              {labels.changelogHeading}
            </span>
            <span className="font-mono text-[9px] text-stone-500 group-hover:text-stone-300 transition-colors">
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
                <ol className="space-y-2 border-l border-white/[0.08] pl-4">
                  {changelog
                    .slice()
                    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
                    .map((entry) => (
                      <li key={entry._key} className="flex items-start gap-4">
                        <span className="font-mono text-[9px] text-stone-600 flex-shrink-0 mt-0.5 w-24">
                          {formatDate(entry.date, 'short')}
                        </span>
                        <span className="font-mono text-[10px] text-stone-400 leading-relaxed">
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
      <div className="pt-4 border-t border-white/5">
        <a
          href={labels.correctionsUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="font-sans text-sm text-stone-400 hover:text-white transition-colors"
        >
          {labels.correctionsLabel} →
        </a>
      </div>
    </section>
  )
}