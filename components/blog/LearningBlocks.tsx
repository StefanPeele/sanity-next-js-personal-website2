'use client'
// components/blog/LearningBlocks.tsx
// All five new learning block components in one file for easy deployment.
// Import individually from this file in CustomPortableText.tsx

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useArticleReducedMotion } from '@/components/article/ArticleProvider'
import { downloadTextFile } from '@/lib/anki'
import { Icon } from '@/lib/cms/icons'
import { FOCUS } from '@/lib/ui'

// ══════════════════════════════════════════════════════════════════
// WHAT I GOT WRONG FIRST
// ══════════════════════════════════════════════════════════════════

interface WhatIGotWrongProps {
  value: {
    misconception: string
    correction: string
    whyItMatters?: string
  }
}

export function WhatIGotWrong({ value }: WhatIGotWrongProps) {
  return (
    <div className="my-8 rounded-xl overflow-hidden border border-indigo-500/20 bg-indigo-950/10">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-indigo-500/20">
        <span className="text-sm">✗</span>
        <span className="meta-label font-bold text-indigo-400">
          What I Got Wrong First
        </span>
      </div>
      <div className="px-5 py-5 space-y-4">
        <div className="flex items-start gap-3">
          <span className="meta-label text-indigo-500/70 flex-shrink-0 mt-1 w-20">
            I thought
          </span>
          <p className="font-mono text-sm text-stone-400 leading-relaxed line-through decoration-indigo-500/40">
            {value.misconception}
          </p>
        </div>
        <div className="h-px bg-indigo-500/10" />
        <div className="flex items-start gap-3">
          <span className="meta-label text-indigo-400 flex-shrink-0 mt-1 w-20">
            Actually
          </span>
          <p className="font-mono text-sm text-stone-200 leading-relaxed">
            {value.correction}
          </p>
        </div>
        {value.whyItMatters && (
          <>
            <div className="h-px bg-indigo-500/10" />
            <div className="flex items-start gap-3">
              <span className="meta-label text-indigo-500/70 flex-shrink-0 mt-1 w-20">
                Why it matters
              </span>
              <p className="font-mono text-xs text-stone-400 leading-relaxed italic">
                {value.whyItMatters}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// WHAT ENGINEERS ACTUALLY USE THIS FOR
// ══════════════════════════════════════════════════════════════════

const ENV_CONFIG: Record<string, { label: string; color: string }> = {
  'msp':       { label: 'MSP / Managed Services', color: 'text-blue-400 border-blue-500/30 bg-blue-950/10' },
  'enterprise':{ label: 'Enterprise',              color: 'text-purple-400 border-purple-500/30 bg-purple-950/10' },
  'cloud':     { label: 'Cloud / Hybrid',          color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/10' },
  'home-lab':  { label: 'Home Lab',                color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/10' },
  'academic':  { label: 'Academic',                color: 'text-amber-400 border-amber-500/30 bg-amber-950/10' },
  'isp':       { label: 'Service Provider / ISP',  color: 'text-orange-400 border-orange-500/30 bg-orange-950/10' },
}

interface WhatEngineersUseProps {
  value: {
    scenario: string
    environment?: string
    toolsInvolved?: string
  }
}

export function WhatEngineersUse({ value }: WhatEngineersUseProps) {
  const env = value.environment ? ENV_CONFIG[value.environment] : null

  return (
    <div className="my-8 rounded-xl overflow-hidden border border-stone-600/30 bg-stone-950/30">
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-stone-600/20">
        <div className="flex items-center gap-2.5">
          <Icon name="wrench" size={14} className="text-stone-400" />
          <span className="meta-label font-bold text-stone-400">
            What Engineers Actually Use This For
          </span>
        </div>
        {env && (
          <span className={`meta-label px-2 py-1 rounded-sm border ${env.color}`}>
            {env.label}
          </span>
        )}
      </div>
      <div className="px-5 py-5 space-y-3">
        <p className="text-stone-300 text-sm leading-relaxed">
          {value.scenario}
        </p>
        {value.toolsInvolved && (
          <div className="flex items-center gap-2 pt-2 border-t border-stone-700/30">
            <span className="meta-label text-stone-400">
              Tools:
            </span>
            <span className="font-mono text-xs text-stone-400">
              {value.toolsInvolved}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// THE PROBLEM THIS SOLVED
// ══════════════════════════════════════════════════════════════════

interface TheProblemSolvedProps {
  value: {
    context: string
    externalLink?: string
    year?: string
  }
}

export function TheProblemSolved({ value }: TheProblemSolvedProps) {
  return (
    <div className="my-8 rounded-xl overflow-hidden border border-amber-700/20 bg-amber-950/[0.08]">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-amber-700/20">
        <span className="text-sm">🕰</span>
        <span className="meta-label font-bold text-amber-600/80">
          The Problem This Solved
        </span>
        {value.year && (
          <span className="meta-label ml-auto text-amber-700/60">
            {value.year}
          </span>
        )}
      </div>
      <div className="px-5 py-5">
        <p className="font-serif italic text-stone-400 text-base leading-relaxed">
          {value.context}
        </p>
        {value.externalLink && (
          <a
            href={value.externalLink}
            target="_blank"
            rel="noreferrer noopener"
            className="meta-label mt-4 inline-flex items-center gap-2 text-amber-600/70 hover:text-amber-400 transition-colors"
          >
            Further reading ↗
          </a>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// CONCEPT STRESS TEST
// ══════════════════════════════════════════════════════════════════

interface ConceptStressTestProps {
  value: {
    prompt: string
    answer: string
    hint?: string
  }
}

export function ConceptStressTest({ value }: ConceptStressTestProps) {
  const [revealed, setRevealed]   = useState(false)
  const [showHint, setShowHint]   = useState(false)

  return (
    <div className="my-10 border border-white/10 rounded-xl overflow-hidden bg-[#0f0f12]">
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="meta-label text-stone-400">
            Stress Test
          </span>
          <span className="meta-label px-2 py-0.5 border border-stone-700 text-stone-400 rounded-sm">
            Before moving on
          </span>
        </div>
        <span className="font-mono text-xs text-stone-400">Active recall</span>
      </div>

      <div className="p-6">
        <p className="font-serif text-xl text-white mb-6 leading-snug">
          {value.prompt}
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          {!revealed ? (
            <>
              <button
                onClick={() => setRevealed(true)}
                className="meta-label px-4 py-2.5 bg-white text-black hover:bg-stone-200 transition-colors rounded-sm"
              >
                Reveal Answer
              </button>
              {value.hint && !showHint && (
                <button
                  onClick={() => setShowHint(true)}
                  className="meta-label px-4 py-2.5 border border-white/10 text-stone-400 hover:text-stone-400 transition-colors rounded-sm"
                >
                  Show Hint
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => setRevealed(false)}
              className="meta-label px-4 py-2.5 border border-white/10 text-stone-400 hover:text-stone-400 transition-colors rounded-sm"
            >
              Hide Answer
            </button>
          )}
        </div>

        {showHint && !revealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-white/5"
          >
            <p className="meta-label text-stone-400 mb-2">Hint</p>
            <p className="text-stone-400 text-sm italic leading-relaxed">{value.hint}</p>
          </motion.div>
        )}

        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="mt-6 pt-6 border-t border-white/[0.08] overflow-hidden"
            >
              <p className="meta-label text-stone-400 mb-3">Answer</p>
              <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap">
                {value.answer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// CONCEPT CARDS (receives data as prop from page, not a body block)
// ══════════════════════════════════════════════════════════════════

interface ConceptCard {
  _key: string
  front: string
  back: string
}

interface ConceptCardsProps {
  cards: ConceptCard[]
  /** Anki TSV built by lib/anki buildStudyDeck; enables the download button. */
  deck?: string
  deckCount?: number
  deckFilename?: string
}

export function ConceptCards({ cards, deck, deckCount = 0, deckFilename = 'study-deck.txt', heading = 'Key terms' }: ConceptCardsProps & { heading?: string }) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set())
  const [downloaded, setDownloaded] = useState(false)
  const reduced = useArticleReducedMotion()

  if (!cards || cards.length === 0) return null

  const toggleFlip = (key: string) => {
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const download = () => {
    if (!deck) return
    downloadTextFile(deckFilename, deck, 'text/tab-separated-values;charset=utf-8')
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2500)
  }

  return (
    <section className="mt-16 pt-12 border-t border-white/[0.08]" aria-labelledby="concept-cards-heading" data-no-toc>
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <h2 id="concept-cards-heading" className="section-label">{heading}</h2>
        <span className="font-sans text-xs text-stone-400">
          {cards.length} terms — click to flip
        </span>
        {deck && deckCount > 0 && (
          <button
            type="button"
            onClick={download}
            className={`meta-label ml-auto px-3 py-2 border border-white/10 rounded-lg text-stone-300 hover:text-white hover:border-white/30 transition-colors ${FOCUS}`}
            data-print-hide
          >
            {downloaded ? 'Saved ✓' : `Download study deck (${deckCount} cards, Anki)`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => {
          const isFlipped = flipped.has(card._key)
          return (
            <button
              key={card._key}
              type="button"
              onClick={() => toggleFlip(card._key)}
              className={`relative h-36 w-full text-left group ${FOCUS} rounded-xl`}
              aria-pressed={isFlipped}
              aria-label={isFlipped ? `Definition of ${card.front}: ${card.back}. Activate to show the term.` : `Concept card: ${card.front}. Activate to reveal the definition.`}
            >
              {/* Card container with 3D flip (instant swap under reduced motion) */}
              <div
                className={`relative w-full h-full ${reduced ? '' : 'transition-transform duration-500'}`}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 border border-white/15 rounded-xl p-5 flex flex-col justify-between bg-[#111] hover:border-white/30 transition-colors"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="meta-label text-stone-400">
                    Term
                  </span>
                  <p className="font-serif text-lg text-white leading-snug">
                    {card.front}
                  </p>
                  <span className="meta-label text-stone-400 group-hover:text-stone-300 transition-colors">
                    Click to define →
                  </span>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 border border-stone-600/50 rounded-xl p-5 flex flex-col justify-between bg-[#0f1510]"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <span className="meta-label text-stone-400">
                    Definition
                  </span>
                  <p className="font-mono text-xs text-stone-300 leading-relaxed">
                    {card.back}
                  </p>
                  <span className="meta-label text-stone-400">
                    ← Click to flip back
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}