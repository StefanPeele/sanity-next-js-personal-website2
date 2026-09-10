'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FOCUS, buttonClass } from '@/lib/ui'
// components/blog/PacketAnimator.tsx

interface PacketStep {
  _key: string
  label: string
  description: string
  layer: number
  layerName: string
}

interface PacketAnimatorProps {
  value: {
    scenario?: string
    steps: PacketStep[]
  }
}

const LAYER_COLORS: Record<number, string> = {
  7: '#6ee7b7',
  6: '#93c5fd',
  5: '#c4b5fd',
  4: '#fde68a',
  3: '#fdba74',
  2: '#f9a8d4',
  1: '#d1d5db',
}

export function PacketAnimator({ value }: PacketAnimatorProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const steps = value?.steps || []
  const total = steps.length
  const step = steps[currentStep]
  const color = step ? (LAYER_COLORS[step.layer] ?? '#fff') : '#fff'

  if (total === 0) return null

  return (
    <div className="article-light-invert my-10 border border-edge rounded-lg overflow-hidden bg-surface-raised" data-no-toc>
      {/* Header */}
      <div className="px-6 py-4 border-b border-edge-faint flex items-center justify-between">
        <span className="meta-label text-stone-400">
          Packet Journey
        </span>
        <span className="font-mono text-xs text-stone-400">
          {value?.scenario || 'Interactive Walkthrough'}
        </span>
      </div>

      {/* Step progress track */}
      <div className="px-6 pt-6">
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <button
              key={s._key}
              onClick={() => setCurrentStep(i)}
              title={s.label}
              aria-label={`Step ${i + 1}: ${s.label}`}
              aria-current={i === currentStep ? 'step' : undefined}
              className={`flex-1 h-6 flex items-center rounded-sm ${FOCUS}`}
            >
              <span
                aria-hidden="true"
                className="w-full h-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i <= currentStep ? color : '#292524',
                  opacity: i === currentStep ? 1 : i < currentStep ? 0.6 : 0.3,
                }}
              />
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="meta-label text-stone-400">
            Step {currentStep + 1} of {total}
          </span>
          {step && (
            <span
              className="meta-label"
              style={{ color }}
            >
              Layer {step.layer} — {step.layerName}
            </span>
          )}
        </div>
      </div>

      {/* Step content */}
      <div className="px-6 py-6 min-h-[160px]">
        <AnimatePresence mode="wait">
          {step && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="meta-label px-2.5 py-1 rounded-sm text-black font-bold"
                  style={{ backgroundColor: color }}
                >
                  Layer {step.layer}
                </span>
                <span className="meta-label text-stone-400">
                  {step.layerName}
                </span>
              </div>
              <h3 className="font-serif text-xl text-white mb-2">{step.label}</h3>
              <p className="text-stone-400 text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="px-6 pb-6 flex items-center gap-3">
        <button
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className={`meta-label ${buttonClass({ size: 'sm' })}`}
        >
          ← Back
        </button>
        <button
          onClick={() => setCurrentStep((s) => Math.min(total - 1, s + 1))}
          disabled={currentStep === total - 1}
          className={`meta-label ${buttonClass({ size: 'sm' })}`}
        >
          Next →
        </button>
        {currentStep === total - 1 && (
          <button
            onClick={() => setCurrentStep(0)}
            className={`meta-label px-4 py-2 text-stone-400 hover:text-white transition-colors rounded-lg ${FOCUS}`}
          >
            Restart
          </button>
        )}
      </div>
    </div>
  )
}