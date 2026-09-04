'use client'

import { useActionState, useId } from 'react'
import { subscribe, type SubscribeState } from '@/app/actions/subscribe'
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
}

export function NewsletterForm({ variant = 'card', source = 'site', className = '' }: Props) {
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
      placeholder="you@example.com"
      disabled={pending || succeeded}
      aria-describedby={statusId}
      aria-invalid={state.status === 'error' ? true : undefined}
      className="min-w-0 flex-1 bg-transparent border border-white/10 px-4 py-3 font-mono text-xs text-stone-100 placeholder:text-stone-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-60"
    />
  )

  const button = (
    <button
      type="submit"
      disabled={pending || succeeded}
      className="shrink-0 px-5 py-3 bg-white text-black font-mono text-[10px] uppercase tracking-[0.3em] hover:bg-stone-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
    >
      {pending ? 'Sending…' : succeeded ? 'Sent' : 'Subscribe'}
    </button>
  )

  const status = (
    <p
      id={statusId}
      role="status"
      aria-live="polite"
      className={`font-mono text-[11px] leading-relaxed ${
        state.status === 'error' ? 'text-amber-400' : state.status === 'success' ? 'text-emerald-400' : 'text-stone-400'
      } ${state.message ? 'mt-3' : 'sr-only'}`}
    >
      {state.message ?? 'Double opt-in. Unsubscribe with one click.'}
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
      className={`relative border border-white/10 bg-white/[0.02] p-6 md:p-8 ${className}`}
    >
      <input type="hidden" name="source" value={source} />
      {honeypot}
      <span className="block font-mono text-[10px] uppercase tracking-[0.4em] text-stone-400 mb-3">
        Newsletter
      </span>
      <label htmlFor={inputId} className="block font-serif text-2xl text-stone-50 leading-tight mb-2">
        New writing, straight to your inbox.
      </label>
      <p className="font-sans text-sm text-stone-400 mb-5 max-w-md">
        Network engineering deep dives, field notes and the occasional photo essay. A few emails a month, never more.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        {input}
        {button}
      </div>
      {status}
    </form>
  )
}

export default NewsletterForm
