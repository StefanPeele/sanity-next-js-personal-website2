'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function BookingSection() {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('submitting')

    // FIX: Save reference immediately to avoid null pointer after async fetch
    const form = e.currentTarget
    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())

    try {
      const response = await fetch('https://formspree.io/f/mzdkrbdk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setStatus('success')
        form.reset() // Success: Reset using the captured reference
        
        setTimeout(() => {
          setIsOpen(false)
          setTimeout(() => setStatus('idle'), 500)
        }, 3000)
      } else {
        setStatus('error')
      }
    } catch (error) {
      console.error("Submission error:", error)
      setStatus('error')
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto mb-16 relative z-20 px-4 flex flex-col items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-3 px-6 py-3 border border-stone-700/50 hover:border-stone-400 bg-stone-900/50 backdrop-blur-md rounded-full text-stone-300 hover:text-white transition-all duration-500"
      >
        <span className="text-xs tracking-[0.2em] uppercase font-semibold">
          {isOpen ? 'Close Inquiry' : 'Book a Session'}
        </span>
        <motion.svg 
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.5, ease: "circOut" }}
          className="w-4 h-4 text-stone-500 group-hover:text-white transition-colors" 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full overflow-hidden"
          >
            <div className="mt-6 p-8 md:p-10 border border-white/10 bg-stone-900/80 backdrop-blur-xl rounded-2xl shadow-2xl relative">
              
              {status === 'success' ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-center space-y-4"
                >
                  <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h3 className="text-2xl font-serif text-white">Inquiry Sent</h3>
                  <p className="text-stone-400 text-sm">I've received your message and will be in touch shortly.</p>
                </motion.div>
              ) : (
                <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit}>
                  <h3 className="text-2xl font-serif text-white mb-2">Let's capture something special.</h3>
                  <p className="text-stone-400 text-sm mb-8 leading-relaxed">
                    Available for editorial, portrait, and commercial commissions. Provide a brief overview of your vision, timeline, and location.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <input name="name" required placeholder="Name" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors" />
                    <input type="email" name="email" required placeholder="Email Address" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors" />
                  </div>
                  
                  <textarea name="message" required placeholder="Tell me about your project..." rows={4} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors mb-6 resize-none" />

                  {status === 'error' && (
                    <p className="text-red-400 text-xs mb-4 text-center">Something went wrong. Please try again or reach out directly.</p>
                  )}

                  <button 
                    disabled={status === 'submitting'}
                    type="submit"
                    className="w-full bg-white text-black py-3 rounded-lg text-xs tracking-[0.2em] uppercase font-bold hover:bg-stone-200 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {status === 'submitting' ? 'Sending...' : 'Send Inquiry'}
                  </button>
                </motion.form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}