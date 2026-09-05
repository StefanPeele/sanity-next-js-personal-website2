'use client'

// components/BookingSection.tsx
// Photography inquiry form. Package and add-on options come from lib/pricing so
// the form, the service cards and the server action never disagree.

import { useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { submitBooking } from '@/app/actions/booking'
import { ADD_ONS, NOT_SURE_ID, PACKAGES, packageLabel, type PricingAddOn } from '@/lib/pricing'
import { DEFAULT_SERVICES_PAGE } from '@/lib/cms/defaults/servicesPage'

interface BookingSectionProps {
  copy?: typeof DEFAULT_SERVICES_PAGE.booking
  /** Package id from lib/pricing to preselect. */
  selectedPackage?: string
  triggerLabel?: string
  /** Render the form open and inline instead of behind a toggle button. */
  inline?: boolean
  /** id of the wrapper — the services page uses "inquiry" as a scroll target. */
  anchorId?: string
}

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'
const inputClass = `w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-white/30 transition-colors ${FOCUS}`

function AddOnItem({ addon, checked, onToggle }: { addon: PricingAddOn; checked: boolean; onToggle: () => void }) {
  const descId = useId()
  return (
    <label
      className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border transition-colors duration-150 cursor-pointer ${
        checked
          ? 'border-white/30 bg-white/[0.08] text-white'
          : 'border-white/[0.08] bg-white/[0.02] text-stone-400 hover:border-white/20 hover:text-stone-200'
      }`}
      title={addon.description}
    >
      <span className="flex items-center gap-3 flex-1 min-w-0">
        <input
          type="checkbox"
          name="add_ons"
          value={addon.id}
          checked={checked}
          onChange={onToggle}
          aria-describedby={descId}
          className={`h-4 w-4 rounded border-white/30 bg-transparent accent-white ${FOCUS}`}
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] truncate">{addon.label}</span>
      </span>
      <span className={`font-mono text-[10px] font-bold flex-shrink-0 ${checked ? 'text-white' : 'text-stone-400'}`}>{addon.price}</span>
      <span id={descId} className="sr-only">{addon.description}</span>
    </label>
  )
}

export default function BookingSection({ copy = DEFAULT_SERVICES_PAGE.booking, selectedPackage, triggerLabel, inline = false, anchorId }: BookingSectionProps) {
  const reduceMotion = useReducedMotion()
  const [isOpen, setIsOpen] = useState(inline)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [pkg, setPkg] = useState(selectedPackage ?? '')
  const [addOns, setAddOns] = useState<Set<string>>(new Set())
  const [showAddOns, setShowAddOns] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const headingId = useId()

  const hasPackage = pkg !== '' && pkg !== NOT_SURE_ID
  const selectedPkg = PACKAGES.find((p) => p.id === pkg)

  const toggleAddOn = (id: string) =>
    setAddOns((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!pkg) {
      setStatus('error')
      setErrorMsg(copy.packageError)
      return
    }
    setStatus('submitting')
    setErrorMsg('')
    const formData = new FormData(e.currentTarget)
    formData.set('package', pkg)
    const result = await submitBooking(formData)
    if (result.success) {
      setStatus('success')
      formRef.current?.reset()
      setPkg(selectedPackage ?? '')
      setAddOns(new Set())
      setShowAddOns(false)
      if (!inline) {
        setTimeout(() => {
          setIsOpen(false)
          setTimeout(() => setStatus('idle'), 500)
        }, 4000)
      }
    } else {
      setStatus('error')
      setErrorMsg(result.error ?? copy.genericError)
    }
  }

  const form = (
    <div className="p-6 sm:p-8 md:p-10 border border-white/10 bg-stone-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl">
      {status === 'success' ? (
        <div role="status" className="flex flex-col items-center justify-center py-10 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-2" aria-hidden="true">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-serif text-white">{copy.successTitle}</h3>
          <p className="text-stone-400 text-sm">
            {copy.successBody}
          </p>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} aria-labelledby={headingId} noValidate={false}>
          <h3 id={headingId} className="text-2xl font-serif text-white mb-2">{copy.heading}</h3>
          <p className="text-stone-400 text-sm mb-7 leading-relaxed">
            {copy.intro}
          </p>

          {/* Honeypot: hidden from people, present for bots. Must stay empty. */}
          <div className="absolute -left-[9999px] top-auto w-px h-px overflow-hidden" aria-hidden="true">
            <label htmlFor="booking-website">Website</label>
            <input id="booking-website" type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor="booking-name" className="sr-only">Name</label>
              <input id="booking-name" name="name" required maxLength={100} autoComplete="name" placeholder={copy.namePlaceholder} className={inputClass} />
            </div>
            <div>
              <label htmlFor="booking-email" className="sr-only">Email address</label>
              <input id="booking-email" type="email" name="email" required maxLength={200} autoComplete="email" placeholder={copy.emailPlaceholder} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor="booking-phone" className="sr-only">Phone (optional)</label>
              <input id="booking-phone" type="tel" name="phone" maxLength={40} autoComplete="tel" placeholder={copy.phonePlaceholder} className={inputClass} />
            </div>
            <div>
              <label htmlFor="booking-date" className="sr-only">Preferred date</label>
              <input id="booking-date" type="date" name="preferred_date" className={`${inputClass} cursor-pointer`} style={{ colorScheme: 'dark' }} />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="booking-package" className="sr-only">Package</label>
            <select
              id="booking-package"
              name="package"
              value={pkg}
              required
              onChange={(e) => { setPkg(e.target.value); setAddOns(new Set()); setShowAddOns(false) }}
              className={`${inputClass} appearance-none cursor-pointer`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
              }}
            >
              <option value="" className="bg-stone-900">{copy.packagePlaceholder}</option>
              {PACKAGES.map((p) => (
                <option key={p.id} value={p.id} className="bg-stone-900">
                  {packageLabel(p)}{p.comingSoon ? ` · ${copy.expandingSoonSuffix}` : ''}
                </option>
              ))}
              <option value={NOT_SURE_ID} className="bg-stone-900">{copy.notSureLabel}</option>
            </select>
            {selectedPkg?.comingSoon && (
              <p className="mt-2 font-mono text-[10px] text-amber-400/90 uppercase tracking-widest">
                {copy.expandingSoonNote}
              </p>
            )}
          </div>

          <AnimatePresence initial={false}>
            {hasPackage && (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mb-3"
              >
                <label htmlFor="booking-zoom" className="sr-only">Availability for a 20–30 minute call</label>
                <input
                  id="booking-zoom"
                  name="zoom_availability"
                  maxLength={300}
                  placeholder={copy.availabilityPlaceholder}
                  className={inputClass}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <label className="flex items-center gap-3 mb-4 cursor-pointer group">
            <input type="checkbox" name="njit_affiliate" className={`h-4 w-4 rounded border-white/30 bg-transparent accent-white ${FOCUS}`} />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 group-hover:text-stone-200 transition-colors">
              {copy.njitCheckbox}
              <span className="text-stone-400 ml-2">{copy.njitNote}</span>
            </span>
          </label>

          <AnimatePresence initial={false}>
            {hasPackage && (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden mb-3"
              >
                <button
                  type="button"
                  onClick={() => setShowAddOns((v) => !v)}
                  aria-expanded={showAddOns}
                  aria-controls="booking-addons"
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors mb-2 ${FOCUS}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-sans text-sm text-stone-300">{copy.addOnsLabel}</span>
                    {addOns.size > 0 && (
                      <span className="font-mono text-[9px] text-white bg-white/15 px-2 py-0.5 rounded-sm">{addOns.size} selected</span>
                    )}
                  </span>
                  <span className={`font-mono text-stone-400 text-sm transition-transform duration-200 ${showAddOns ? 'rotate-45' : ''}`} aria-hidden="true">+</span>
                </button>
                <div id="booking-addons" hidden={!showAddOns} className="space-y-1.5 pt-1 pb-2">
                  {ADD_ONS.map((addon) => (
                    <AddOnItem key={addon.id} addon={addon} checked={addOns.has(addon.id)} onToggle={() => toggleAddOn(addon.id)} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <label htmlFor="booking-message" className="sr-only">Message</label>
          <textarea
            id="booking-message"
            name="message"
            required
            rows={3}
            maxLength={2000}
            placeholder={copy.messagePlaceholder}
            className={`${inputClass} mb-5 resize-none`}
          />

          {status === 'error' && (
            <p role="alert" className="text-red-400 text-xs mb-4 text-center">{errorMsg}</p>
          )}

          <button
            disabled={status === 'submitting'}
            type="submit"
            className={`w-full bg-white text-black py-3 rounded-lg text-xs tracking-[0.2em] uppercase font-bold hover:bg-stone-200 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 ${FOCUS}`}
          >
            {status === 'submitting' ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {copy.sendingLabel}
              </>
            ) : copy.submitLabel}
          </button>
        </form>
      )}
    </div>
  )

  if (inline) {
    return (
      <div id={anchorId} className="relative w-full max-w-2xl mx-auto scroll-mt-28">
        {form}
      </div>
    )
  }

  return (
    <div id={anchorId} className="relative flex flex-col items-center scroll-mt-28">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="booking-panel"
        className={`group flex items-center justify-center gap-3 px-6 py-3 border border-stone-700/50 hover:border-stone-400 bg-stone-900/50 backdrop-blur-md rounded-full text-stone-300 hover:text-white transition-all duration-500 ${FOCUS}`}
      >
        <span className="text-xs tracking-[0.2em] uppercase font-semibold whitespace-nowrap">
          {isOpen ? copy.closeLabel : (triggerLabel ?? copy.triggerLabel)}
        </span>
        <svg
          className={`w-4 h-4 text-stone-400 group-hover:text-white transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id="booking-panel"
            initial={reduceMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative mt-4 w-[calc(100vw-2rem)] sm:w-[34rem] max-w-[92vw] z-30"
          >
            {form}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
