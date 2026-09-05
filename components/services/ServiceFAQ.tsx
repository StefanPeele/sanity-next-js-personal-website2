'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// components/services/ServiceFAQ.tsx

type FaqItem = { question: string; answer: string }

export function ServiceFAQ({ items }: { items: FaqItem[] }) {
  const FAQS = items
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {FAQS.map((faq, i) => (
        <div
          key={i}
          className={`border rounded-lg overflow-hidden transition-colors duration-200 ${
            open === i ? 'border-white/20 bg-white/[0.04]' : 'border-white/10 bg-white/[0.02]'
          }`}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-5 text-left group"
          >
            <span className="font-serif text-base text-stone-200 group-hover:text-white transition-colors pr-8 leading-snug">
              {faq.question}
            </span>
            <span className={`font-mono text-stone-500 text-lg flex-shrink-0 transition-transform duration-300 ${
              open === i ? 'rotate-45 text-white' : 'group-hover:text-stone-300'
            }`}>
              +
            </span>
          </button>

          <AnimatePresence>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <p className="px-6 pb-6 text-stone-400 text-sm leading-relaxed border-t border-white/[0.08] pt-4">
                  {faq.answer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}