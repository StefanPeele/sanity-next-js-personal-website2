'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// components/services/ServiceFAQ.tsx

const FAQS = [
  {
    q: "What happens after I schedule a consultation?",
    a: "We get on a 20–30 minute Zoom call. I'll ask you five questions: what's the occasion, where do you picture these photos living, if you have a style reference, who's coming with you, and what matters most to you about the session. From there I'll walk you through the direction, present two options, and we'll book. No pressure, no sales pitch — just figuring out what makes sense for you.",
  },
  {
    q: "Why consultation first — why can't I just book directly?",
    a: "Because a package you picked from a menu without talking to me is a package built for someone else. The consultation is how I make sure the session is built around what you actually want — the photos you'll use, the product you'll keep, the experience that matches the moment. It takes 20 minutes and it protects both of us from mismatched expectations.",
  },
  {
    q: "What's included in the three-part delivery?",
    a: "Every session — regardless of package — delivers three things. First, your full gallery of edited JPEGs via Pixieset: high-resolution, color-graded, ready to download and print. Second, your 5 hero shots exported as print-ready TIFFs at full native resolution — these are labeled for professional printing and are the frames you'd put on a wall. Third, a social media pack: 5–8 images pre-formatted for Instagram feed, Stories, and LinkedIn, delivered in a separate folder labeled 'Ready to Post.' This is my standard. Not an add-on.",
  },
  {
    q: "What physical product do I get?",
    a: "Core clients choose one from a menu of accessible products — framed prints, matted print sets, softcover photobooks, linen print boxes, and more. Premium clients choose from a premium keepsake menu — hardcover lay-flat photobooks, large archival framed prints, acrylic print blocks, metal prints, leather portfolios, fine art cotton rag prints, backlit LED panels, and others. We go through the options during the consultation so you can choose based on where you picture the photos living.",
  },
  {
    q: "How quickly will I get my photos?",
    a: "Standard turnaround is 48 hours from the day of the shoot. You'll receive a sneak peek to your phone within 24 hours. If you need everything faster, rush delivery is available for $40 and moves your full gallery to same-day or next-morning delivery.",
  },
  {
    q: "How do I qualify for the NJIT rate?",
    a: "Current NJIT students, faculty, staff, and registered student organizations all qualify. NJIT ID verification is required at booking. If you're not sure whether your organization qualifies, just ask during the consultation — I'm reasonable about it.",
  },
  {
    q: "What if I'm not satisfied with the results?",
    a: "I make it right. If there's a technical failure on my end, a missed key moment, or a delivery issue I caused — I'll own it directly and offer a reshoot, partial refund, or alternate solution. No ghosting, no excuses. If something outside my control disrupts the shoot — weather, venue restrictions, last-minute changes — I'll communicate immediately and we'll figure it out together.",
  },
  {
    q: "Can I add time or make changes on the day?",
    a: "Additional time is $75/hr and needs to be discussed before the shoot, not the morning of. I block my schedule around confirmed sessions. If you think you might need more time, flag it during the consultation and we'll plan for it upfront.",
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