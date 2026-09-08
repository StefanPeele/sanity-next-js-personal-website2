'use client'

// components/portfolio/ContactForm.tsx
// Small client island for /contact. Posts to contactAction.

import { useState } from 'react'
import { contactAction } from '@/app/actions/contact'
import { FOCUS } from '@/lib/ui'

const inputClass = `w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-white/30 transition-colors ${FOCUS}`

export function ContactForm({ fallbackEmail }: { fallbackEmail: string }) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('submitting')
    setError('')
    const result = await contactAction(new FormData(e.currentTarget))
    if (result.success) {
      setStatus('success')
      e.currentTarget.reset()
    } else {
      setStatus('error')
      setError(result.error ?? 'Something went wrong.')
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center">
        <p className="font-serif text-2xl text-white mb-2">Message sent.</p>
        <p className="text-stone-300 text-sm">I read everything myself and usually reply within a day or two.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" aria-label="Contact form">
      <div className="absolute -left-[9999px] top-auto w-px h-px overflow-hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="contact-name" className="sr-only">Name</label>
          <input id="contact-name" name="name" required maxLength={100} autoComplete="name" placeholder="Name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="contact-email" className="sr-only">Email</label>
          <input id="contact-email" type="email" name="email" required maxLength={200} autoComplete="email" placeholder="Email" className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="contact-company" className="sr-only">Company (optional)</label>
        <input id="contact-company" name="company" maxLength={120} autoComplete="organization" placeholder="Company or team (optional)" className={inputClass} />
      </div>
      <div>
        <label htmlFor="contact-message" className="sr-only">Message</label>
        <textarea id="contact-message" name="message" required minLength={10} maxLength={2000} rows={5} placeholder="What are you working on, and where could I help?" className={`${inputClass} resize-y`} />
      </div>
      {status === 'error' && <p role="alert" className="text-red-400 text-xs">{error} {error.includes('Email') ? '' : <a className="underline" href={`mailto:${fallbackEmail}`}>Or email me directly.</a>}</p>}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className={`w-full sm:w-auto bg-white text-black px-8 py-3 rounded-lg text-xs tracking-[0.2em] uppercase font-bold hover:bg-stone-200 transition-colors disabled:opacity-50 ${FOCUS}`}
      >
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
