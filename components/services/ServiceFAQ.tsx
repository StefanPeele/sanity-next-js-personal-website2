'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// components/services/ServiceFAQ.tsx

const FAQS = [
  {
    q: "Why does photography cost this much for just a few hours?",
    a: "Photography fees cover far more than the shoot itself. You're paying for pre-event planning, travel, professional gear maintenance, hours of editing in professional software, and multi-platform delivery. A 3-hour event typically means another 3–6 hours of post-production. At $150 for a 1.5-hour booking, that's still below minimum wage when you account for everything included. I price fairly to respect both your event and my work.",
  },
  {
    q: "What if I'm not satisfied with the results?",
    a: "Simple: I make it right. If there's a technical failure on my end, a missed key moment, or a delivery issue I caused — I'll own it directly and offer either a partial refund, reshoot, or alternate solution based on the situation. No ghosting, no excuses. If disruptions are outside my control (venue restrictions, weather, last-minute changes), I'll communicate immediately and adapt as best as possible.",
  },
  {
    q: "How quickly will I get my photos?",
    a: "Starter packages deliver in 1–3 business days. Core packages in 2–4. Premium in 2–3 (priority editing). If you need faster, rushed delivery is available as a $40 add-on for Core and Premium. I don't rush quality — but I also don't hold your photos hostage.",
  },
  {
    q: "How do I qualify for the NJIT rate?",
    a: "The NJIT rate is available to current NJIT students, faculty, staff, and registered student organizations. NJIT ID verification is required at booking. If you're unsure whether your organization qualifies, just ask — I'm reasonable about it.",
  },
  {
    q: "Can I add extra time on the day of the event?",
    a: "Yes, as long as I'm available and we've discussed it before the event. Extra time is $50 for 30 minutes, $90 for an hour, $180 for two hours. Ideally we plan this in advance — impromptu extensions are possible but not guaranteed, especially for multi-event days.",
  },
  {
    q: "Do you shoot portraits as well as events?",
    a: "Yes. Portrait packages are available separately and designed for headshots, professional portraits, fashion shoots, and brand photography. Core and Premium event clients also receive a discount (15% and 30% respectively) on portrait sessions — a good way to consolidate your visual brand.",
  },
]

export function ServiceFAQ() {
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
              {faq.q}
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
                <p className="px-6 pb-6 text-stone-400 text-sm leading-relaxed border-t border-white/8 pt-4">
                  {faq.a}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}