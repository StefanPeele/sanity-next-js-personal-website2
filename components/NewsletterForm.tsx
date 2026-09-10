'use client'

import { useActionState, useId } from 'react'
import { subscribe, type SubscribeState } from '@/app/actions/subscribe'
import { DEFAULT_SETTINGS } from '@/lib/cms/defaults/settings'
import { FOCUS } from '@/lib/ui'
// components/NewsletterForm.tsx
// Double opt-in newsletter signup. No required props.
//   <NewsletterForm />                       — card (footer, article end)
//   <NewsletterForm variant="inline" />      — single row, for tight spaces
// Server action: app/actions/subscribe.ts. Honeypot field is `website`.

const initialState: SubscribeState = { status: 'idle' }

type Props = {
  variant?: 'card' | 'inline'
  /** Recorded on the subscriber document, e.g. "footer" or "article:osi-model". */
  source?: string
  className?: string
  /** Copy from Studio → Site → Identity & SEO → Newsletter. Falls back to code defaults. */
  copy?: Partial<typeof DEFAULT_SETTINGS.newsletter> | null
}

export function NewsletterForm({ variant = 'card', source = 'site', className = '', copy }: Props) {
  const c = { ...DEFAULT_SETTINGS.newsletter, ...(copy ?? {}) }
  const [state, action, pending] = useActionState(subscribe, initialState)
  const id = useId()
  const inputId = `${id}-email`
  const statusId = `${id}-status`
  const succeeded = state.status === 'success'

  const input = (
    <input
      id={inputId}
      name="email"
      type="email"
      inputMode="email"
      autoComplete="email"
      required
      placeholder={c.placeholder}
      disabled={pending || succeeded}
      aria-describedby={statusId}
      aria-invalid={state.status === 'error' ? true : undefined}
      className={`min-w-0 flex-1 bg-transparent border border-edge px-4 py-3 font-sans text-sm text-stone-100 placeholder:text-stone-500 ${FOCUS} disabled:opacity-60`}
    />
  )

  const button = (
    <button
      type="submit"
      disabled={pending || succeeded}
      className={`shrink-0 px-5 py-3 bg-white text-black font-sans text-sm hover:bg-stone-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${FOCUS}`}
    >
      {pending ? 'Sending…' : succeeded ? 'Sent' : c.buttonLabel}
    </button>
  )

  const status = (
    <p
      id={statusId}
      role="status"
      aria-live="polite"
      className={`font-mono text-xs leading-relaxed ${
        state.status === 'error' ? 'text-amber-400' : state.status === 'success' ? 'text-emerald-400' : 'text-stone-400'
      } ${state.message ? 'mt-3' : 'sr-only'}`}
    >
      {state.message ?? c.hint}
    </p>
  )

  const honeypot = (
    <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
      <label htmlFor={`${id}-website`}>Leave this field empty</label>
      <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  )

  if (variant === 'inline') {
    return (
      <form action={action} className={`relative ${className}`} noValidate={false}>
        <input type="hidden" name="source" value={source} />
        {honeypot}
        <label htmlFor={inputId} className="sr-only">Email address</label>
        <div className="flex gap-2">
          {input}
          {button}
        </div>
        {status}
      </form>
    )
  }

  return (
    <form
      action={action}
      className={`relative border border-edge bg-surface-veil p-6 md:p-8 ${className}`}
    >
      <input type="hidden" name="source" value={source} />
      {honeypot}
      <label htmlFor={inputId} className="block font-serif text-2xl text-stone-50 leading-tight mb-2">
        {c.heading}
      </label>
      <p className="font-sans text-sm text-stone-400 mb-5 max-w-md">{c.blurb}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        {input}
        {button}
      </div>
      {status}
    </form>
  )
}

export default NewsletterForm
