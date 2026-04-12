'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { submitBooking } from '@/app/actions/booking'
// components/BookingSection.tsx

interface BookingSectionProps {
  selectedPackage?: string
  triggerLabel?: string
}

const PACKAGE_OPTIONS = [
  '— Select a package —',
  'Portrait · Starter ($89 NJIT / $115 Public)',
  'Portrait · Core ($175 NJIT / $225 Public)',
  'Portrait · Premium ($275 NJIT / $375 Public)',
  'Event · Starter ($150 NJIT / $250 Public)',
  'Event · Core ($299 NJIT / $450 Public)',
  'Event · Premium ($799 NJIT / $1,000+ Public)',
  'Specialty · Headshot Mini ($65 NJIT / $85 Public)',
  'Specialty · Graduation Session ($120 NJIT / $160 Public)',
  'Specialty · Personal Brand / Content ($150 NJIT / $225 Public)',
  'Specialty · Club / Frat Headshot Day ($45/person NJIT / $65/person Public)',
  'Not sure yet — I have questions',
]

interface AddOnOption {
  id: string
  label: string
  price: string
  description: string
}

const ADD_ON_OPTIONS: AddOnOption[] = [
  {
    id: 'extra_30',
    label: 'Extra 30 minutes',
    price: '+$50',
    description: 'Add 30 minutes to your session. Good if you want an extra look, location change, or just more time.',
  },
  {
    id: 'extra_60',
    label: 'Extra 1 hour',
    price: '+$90',
    description: 'A full extra hour of coverage. Best value if you anticipate needing significantly more time.',
  },
  {
    id: 'rush',
    label: 'Rushed full delivery',
    price: '+$40',
    description: 'Bumps your delivery to the next business day. Available for Core and Premium packages.',
  },
  {
    id: 'social',
    label: 'Same-day social pack',
    price: '+$45',
    description: '5 lightly edited photos delivered within 2 hours of the shoot ending. Perfect for event organizers who want to post same-day.',
  },
  {
    id: 'hires',
    label: 'High-res digital upgrade',
    price: '+$25',
    description: 'Adds full print-resolution exports to your gallery. Required if you\'re printing anything larger than 5×7.',
  },
  {
    id: 'raws',
    label: 'Full RAW file delivery',
    price: '+$50',
    description: 'Every unedited RAW file from your shoot via Google Drive. Useful if you have your own editor.',
  },
  {
    id: 'softbook',
    label: 'Softcover photobook (20 pages)',
    price: '+$55',
    description: 'Professionally printed softcover photobook fulfilled through Pixieset\'s print lab.',
  },
  {
    id: 'hardbook',
    label: 'Hardcover photobook (20 pages)',
    price: '+$75',
    description: 'Premium hardcover photobook with lay-flat pages. The highest-quality physical product offered.',
  },
  {
    id: 'frame',
    label: 'Framed print set (8×10)',
    price: '+$45',
    description: 'Your top 3 photos printed at 8×10 and ready to hang. Sourced through a pro lab.',
  },
]

function getRelevantAddOns(pkg: string): string[] {
  if (pkg.startsWith('Event')) {
    return ['extra_30', 'extra_60', 'rush', 'social', 'hires', 'raws']
  }
  if (pkg.startsWith('Portrait') || pkg.startsWith('Specialty')) {
    return ['extra_30', 'extra_60', 'rush', 'hires', 'raws', 'softbook', 'hardbook', 'frame']
  }
  return ADD_ON_OPTIONS.map((a) => a.id)
}

function AddOnItem({
  addon, checked, onToggle,
}: {
  addon: AddOnOption
  checked: boolean
  onToggle: () => void
}) {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return (
    <div className="relative">
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all duration-150 ${
        checked
          ? 'border-white/30 bg-white/8 text-white'
          : 'border-white/8 bg-white/[0.02] text-stone-400 hover:border-white/20 hover:text-stone-200'
      }`}>
        <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
            checked ? 'bg-white border-white' : 'border-white/30 bg-transparent'
          }`}>
            {checked && (
              <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] truncate">
            {addon.label}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span
            onClick={onToggle}
            className={`font-mono text-[10px] font-bold cursor-pointer transition-colors ${checked ? 'text-white' : 'text-stone-500'}`}
          >
            {addon.price}
          </span>
          <button
            type="button"
            onMouseEnter={() => { timerRef.current = setTimeout(() => setTooltipVisible(true), 250) }}
            onMouseLeave={() => { if (timerRef.current) clearTimeout(timerRef.current); setTooltipVisible(false) }}
            className="w-4 h-4 rounded-full border border-white/20 text-stone-600 hover:text-stone-300 hover:border-white/40 transition-colors flex items-center justify-center text-[9px] font-bold"
          >
            i
          </button>
        </div>
      </div>

      <AnimatePresence>
        {tooltipVisible && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 right-0 mb-2 z-50 pointer-events-none"
          >
            <div className="bg-[#1a1a1e] border border-white/20 rounded-lg px-4 py-3 shadow-2xl">
              <p className="text-stone-300 text-xs leading-relaxed">{addon.description}</p>
              <div className="absolute bottom-[-5px] left-6 w-2.5 h-2.5 bg-[#1a1a1e] border-r border-b border-white/20 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function BookingSection({ selectedPackage, triggerLabel }: BookingSectionProps) {
  const [isOpen, setIsOpen]         = useState(false)
  const [status, setStatus]         = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg]     = useState('')
  const [pkg, setPkg]               = useState(selectedPackage ?? PACKAGE_OPTIONS[0])
  const [addOns, setAddOns]         = useState<Set<string>>(new Set())
  const [showAddOns, setShowAddOns] = useState(false)
  const formRef                     = useRef<HTMLFormElement>(null)

  const hasPackage     = pkg !== PACKAGE_OPTIONS[0]
  const relevantIds    = getRelevantAddOns(pkg)
  const visibleAddOns  = ADD_ON_OPTIONS.filter((a) => relevantIds.includes(a.id))
  const selectedAddOns = ADD_ON_OPTIONS.filter((a) => addOns.has(a.id))

  const toggleAddOn = (id: string) => {
    setAddOns((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const formData = new FormData(e.currentTarget)

    // Add computed fields
    formData.set('package', pkg)
    formData.set('add_ons', selectedAddOns.length > 0
      ? selectedAddOns.map((a) => `${a.label} (${a.price})`).join(', ')
      : 'None selected'
    )
    formData.set('discount_earned',
      pkg.includes('Core') && pkg.startsWith('Event')
        ? '15% off next portrait session'
        : pkg.includes('Premium') && pkg.startsWith('Event')
        ? '30% off next portrait session'
        : 'None'
    )

    const result = await submitBooking(formData)

    if (result.success) {
      setStatus('success')
      formRef.current?.reset()
      setPkg(selectedPackage ?? PACKAGE_OPTIONS[0])
      setAddOns(new Set())
      setShowAddOns(false)
      setTimeout(() => {
        setIsOpen(false)
        setTimeout(() => setStatus('idle'), 500)
      }, 3000)
    } else {
      setStatus('error')
      setErrorMsg(result.error ?? 'Something went wrong.')
    }
  }

  return (
    <div className="relative flex flex-col items-center">

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center justify-center gap-3 px-6 py-3 border border-stone-700/50 hover:border-stone-400 bg-stone-900/50 backdrop-blur-md rounded-full text-stone-300 hover:text-white transition-all duration-500"
      >
        <span className="text-xs tracking-[0.2em] uppercase font-semibold whitespace-nowrap">
          {isOpen ? 'Close Inquiry' : (triggerLabel ?? 'Book a Session')}
        </span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.5, ease: 'circOut' }}
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
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute top-full mt-4 w-[calc(100vw-2rem)] sm:w-[34rem] max-w-[92vw] overflow-hidden origin-top z-50 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto"
          >
            <div className="p-8 md:p-10 border border-white/10 bg-stone-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl">

              {status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-center space-y-4"
                >
                  <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-serif text-white">Inquiry Sent</h3>
                  <p className="text-stone-400 text-sm">
                    Check your email — I've sent a confirmation with next steps. I'll follow up within 24 hours.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  ref={formRef}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                >
                  <h3 className="text-2xl font-serif text-white mb-2">
                    Let's capture something special.
                  </h3>
                  <p className="text-stone-400 text-sm mb-7 leading-relaxed">
                    I'll follow up within 24 hours to confirm availability and details.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <input
                      name="name" required placeholder="Name"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-white/30 transition-colors"
                    />
                    <input
                      type="email" name="email" required placeholder="Email Address"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>

                  <div className="mb-4">
                    <select
                      value={pkg}
                      onChange={(e) => { setPkg(e.target.value); setAddOns(new Set()); setShowAddOns(false) }}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 16px center',
                      }}
                    >
                      {PACKAGE_OPTIONS.map((o) => (
                        <option key={o} value={o} className="bg-stone-900">{o}</option>
                      ))}
                    </select>
                  </div>

                  {/* Add-ons */}
                  <AnimatePresence>
                    {hasPackage && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden mb-4"
                      >
                        <button
                          type="button"
                          onClick={() => setShowAddOns((v) => !v)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors mb-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-300">Add-ons</span>
                            {addOns.size > 0 && (
                              <span className="font-mono text-[9px] text-white bg-white/15 px-2 py-0.5 rounded-sm">
                                {addOns.size} selected
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[8px] text-stone-600 uppercase tracking-widest">hover ⓘ for details</span>
                            <span className={`font-mono text-stone-500 text-sm transition-transform duration-200 ${showAddOns ? 'rotate-45' : ''}`}>+</span>
                          </div>
                        </button>

                        <AnimatePresence>
                          {showAddOns && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-visible space-y-1.5 pt-1 pb-2"
                            >
                              {visibleAddOns.map((addon) => (
                                <AddOnItem
                                  key={addon.id}
                                  addon={addon}
                                  checked={addOns.has(addon.id)}
                                  onToggle={() => toggleAddOn(addon.id)}
                                />
                              ))}
                              {addOns.size > 0 && (
                                <div className="mt-2 px-4 py-2.5 rounded-lg border border-white/10 bg-white/[0.03]">
                                  <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500 block mb-1">Selected</span>
                                  <p className="font-mono text-[10px] text-stone-300 leading-relaxed">
                                    {selectedAddOns.map((a) => `${a.label} (${a.price})`).join(' · ')}
                                  </p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <textarea
                    name="message" required rows={3}
                    placeholder="Tell me about your project — date, location, what you need..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-white/30 transition-colors mb-5 resize-none"
                  />

                  {status === 'error' && (
                    <p className="text-red-400 text-xs mb-4 text-center">{errorMsg}</p>
                  )}

                  <button
                    disabled={status === 'submitting'}
                    type="submit"
                    className="w-full bg-white text-black py-3 rounded-lg text-xs tracking-[0.2em] uppercase font-bold hover:bg-stone-200 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {status === 'submitting' ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending...
                      </>
                    ) : 'Send Inquiry'}
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