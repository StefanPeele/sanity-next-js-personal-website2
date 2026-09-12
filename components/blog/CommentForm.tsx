'use client'

import { useActionState, useEffect, useId, useRef } from 'react'
import { postComment, type CommentState } from '@/app/actions/comment'
import { COMMENT_LABELS, COMMENT_LIMITS } from '@/lib/comments'
import type { ArticleUiCopy } from '@/lib/cms/defaults/articleUi'
import { FOCUS, buttonClass } from '@/lib/ui'
import { Icon } from '@/lib/cms/icons'
// components/blog/CommentForm.tsx — Phase 8.
//
// One form, used both at the foot of the thread and inline as a reply. `parentId` is the
// only difference, and the one-level rule is enforced on the server rather than here: a
// reply to a reply is re-parented at write time, so this component never has to know how
// deep it is.

const initial: CommentState = { status: 'idle' }

export function CommentForm({
  postId,
  slug,
  copy,
  parentId,
  anchor,
  onDone,
  autoFocus = false,
}: {
  postId: string
  slug: string
  copy: ArticleUiCopy['comments']
  parentId?: string
  anchor?: string
  onDone?: () => void
  autoFocus?: boolean
}) {
  const [state, action, pending] = useActionState(postComment, initial)
  const formRef = useRef<HTMLFormElement>(null)
  // Unique per instance: the reply form and the foot form are on the page together, and two
  // radio groups sharing a `name` would be ONE group -- picking a label in a reply would
  // silently unpick it at the foot.
  const group = useId()
  // The timing check. A human cannot read an article, form a thought and type it in under
  // three seconds; a script can. The GAP is sent and the DECISION is made on the server,
  // where it cannot be edited away in devtools.
  //
  // Stamped in an effect rather than in render: Date.now() is impure, and the React Compiler
  // is right to refuse it -- a re-render would silently restart the clock and hand every
  // slow typist a fresh three-second window.
  const mountedAt = useRef(0)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { mountedAt.current = Date.now() }, [])

  useEffect(() => {
    if (autoFocus) bodyRef.current?.focus()
  }, [autoFocus])

  // Wraps the action so `elapsed` is measured at SUBMIT time. Setting it on a hidden input
  // during render measures when the field last rendered, which is not the same thing.
  const submit = (fd: FormData) => {
    fd.set('elapsed', String(mountedAt.current ? Date.now() - mountedAt.current : 0))
    return action(fd)
  }

  // form.reset() is enough because the anonymity checkbox is UNCONTROLLED. It used to be
  // React state so the name field could be dimmed, which meant clearing it here -- a
  // setState synchronously inside an effect, which the React Compiler flags and is right to:
  // it is a cascading render for something the DOM already does. The dimming moved to a
  // `has-[]` variant below and the state went away with it.
  useEffect(() => {
    if (state.status === 'success' || state.status === 'pending') {
      formRef.current?.reset()
      onDone?.()
    }
  }, [state.status, onDone])

  const done = state.status === 'success' || state.status === 'pending'

  return (
    <form ref={formRef} action={submit} className="space-y-4" aria-label={copy.formHeading}>
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="slug" value={slug} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      {anchor && <input type="hidden" name="anchor" value={anchor} />}

      {/* Honeypot. Off-screen rather than display:none -- some bots skip hidden inputs, and
          none of them skip a field they cannot see but can read. aria-hidden and tabIndex
          keep it away from anyone using a keyboard or a screen reader. */}
      <div className="absolute left-[-9999px] w-px h-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {/* NATIVE radios, not buttons driving React state into a hidden input.
          Three reasons, and the third is the one that found this: the group works with no
          JavaScript at all; arrow-key navigation and the accessibility tree come for free
          rather than being reimplemented with role="radio"; and a state-backed hidden input
          carries whatever it last RENDERED, so a submit in the same tick as the click sends
          the old value. The harness hit exactly that and reported the wrong label stored. */}
      <fieldset>
        <legend className="meta-label text-stone-400 mb-2">{copy.labelPrompt}</legend>
        <div className="flex flex-wrap gap-2">
          {COMMENT_LABELS.map((l, i) => (
            <label key={l.value} title={l.hint} className="cursor-pointer">
              <input
                type="radio"
                name="label"
                value={l.value}
                defaultChecked={i === 0}
                className="sr-only peer"
                aria-describedby={`${group}-${l.value}-hint`}
              />
              <span
                className={`font-sans text-sm inline-flex items-center gap-1.5 ${buttonClass({ variant: 'chip', size: 'sm' })} peer-checked:border-stone-300 peer-checked:text-stone-100 peer-checked:bg-surface-fill-strong peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber-400`}
              >
                <Icon name={l.icon} size={14} className={l.color} aria-hidden />
                {l.title}
              </span>
              <span id={`${group}-${l.value}-hint`} className="sr-only">{l.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <textarea
        ref={bodyRef}
        name="body"
        required
        rows={5}
        maxLength={COMMENT_LIMITS.body.max}
        placeholder={copy.bodyPlaceholder}
        className={`w-full rounded-lg border border-edge bg-surface-veil px-4 py-3 font-sans text-base text-stone-200 placeholder:text-stone-500 ${FOCUS}`}
      />

      {/* The name field dims when the box is ticked, in CSS rather than in state: the
          wrapper watches its own descendants with :has(), so ticking the box needs no
          re-render and nothing has to be cleared afterwards. The SERVER is what actually
          drops the name -- this is the affordance, not the rule. */}
      <div className="space-y-3 [&:has(input[name=anonymous]:checked)_.js-name-field]:opacity-40">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="comment-name" className="sr-only">{copy.namePlaceholder}</label>
            <input
              id="comment-name"
              name="name"
              type="text"
              maxLength={COMMENT_LIMITS.name.max}
              placeholder={copy.namePlaceholder}
              className={`js-name-field w-full rounded-lg border border-edge bg-surface-veil px-4 py-2.5 font-sans text-sm text-stone-200 placeholder:text-stone-500 transition-opacity ${FOCUS}`}
            />
          </div>
          <div>
            <label htmlFor="comment-email" className="sr-only">{copy.emailPlaceholder}</label>
            <input
              id="comment-email"
              name="email"
              type="email"
              required
              maxLength={COMMENT_LIMITS.email.max}
              placeholder={copy.emailPlaceholder}
              className={`w-full rounded-lg border border-edge bg-surface-veil px-4 py-2.5 font-sans text-sm text-stone-200 placeholder:text-stone-500 ${FOCUS}`}
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 font-sans text-sm text-stone-400">
          <input type="checkbox" name="anonymous" className={`h-4 w-4 rounded border-edge bg-surface-veil ${FOCUS}`} />
          {copy.anonymousLabel}
        </label>
      </div>

      {/* The email question, answered before it is asked. An open box that wants an address
          and does not say why is asking for a reason not to comment. */}
      <p className="font-sans text-xs text-stone-400 leading-relaxed">{copy.emailHint}</p>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="submit"
          disabled={pending}
          className={`font-sans text-sm ${buttonClass({ variant: 'primary', size: 'md' })} disabled:opacity-50`}
        >
          {pending ? copy.submittingLabel : copy.submitLabel}
        </button>
        {parentId && onDone && (
          <button type="button" onClick={onDone} className={`font-sans text-sm text-stone-400 hover:text-white underline underline-offset-4 rounded-sm ${FOCUS}`}>
            {copy.cancelLabel}
          </button>
        )}
        {/* aria-live so the result is announced. polite, not assertive: it is a confirmation,
            not an interruption. */}
        <p
          aria-live="polite"
          className={`font-sans text-sm ${state.status === 'error' ? 'text-rose-400' : 'text-stone-300'}`}
        >
          {done ? (state.status === 'pending' ? copy.pendingNote : state.message) : state.message}
        </p>
      </div>
    </form>
  )
}
