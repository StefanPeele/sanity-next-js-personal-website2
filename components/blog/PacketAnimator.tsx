'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    <div className="my-10 border border-white/10 rounded-lg overflow-hidden bg-[#0f0f0f]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500">
          Packet Journey
        </span>
        <span className="font-mono text-[10px] text-stone-700">
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
              className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i <= currentStep ? color : '#292524',
                opacity: i === currentStep ? 1 : i < currentStep ? 0.6 : 0.3,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-mono text-[9px] text-stone-700 uppercase tracking-widest">
            Step {currentStep + 1} of {total}
          </span>
          {step && (
            <span
              className="font-mono text-[9px] uppercase tracking-widest"
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
                  className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-sm text-black font-bold"
                  style={{ backgroundColor: color }}
                >
                  Layer {step.layer}
                </span>
                <span className="font-mono text-[9px] text-stone-600 uppercase tracking-widest">
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
          className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-white/10 text-stone-500 hover:border-white/30 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        <button
          onClick={() => setCurrentStep((s) => Math.min(total - 1, s + 1))}
          disabled={currentStep === total - 1}
          className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-white/10 text-stone-500 hover:border-white/30 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          Next →
        </button>
        {currentStep === total - 1 && (
          <button
            onClick={() => setCurrentStep(0)}
            className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 text-stone-700 hover:text-white transition-colors"
          >
            Restart
          </button>
        )}
      </div>
    </div>
  )
}