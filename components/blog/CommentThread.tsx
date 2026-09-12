'use client'

import { useMemo, useState } from 'react'
import { CommentForm } from '@/components/blog/CommentForm'
import { COMMENT_LABELS, REMOVAL_TEXT, commentLabel, isRemoved } from '@/lib/comments'
import type { ArticleUiCopy } from '@/lib/cms/defaults/articleUi'
import { formatDate } from '@/lib/dates'
import { Icon } from '@/lib/cms/icons'
import { FOCUS, buttonClass } from '@/lib/ui'
// components/blog/CommentThread.tsx — Phase 8.
//
// The rendered conversation. Everything here arrives ALREADY REDACTED from the server: no
// email, no token, no ip hash, and an anonymous commenter's name already replaced. This is
// a client component, so anything handed to it is serialised into the RSC payload and
// readable in view-source — the reviewer anonymity work found real names sitting there
// while no pixel showed them, and this is the same contract.

/** The shape the server hands down. Deliberately narrow — it is the redaction boundary. */
export interface PublicComment {
  _id: string
  label: string | null
  author: string
  body: string | null
  date: string | null
  status: string | null
  anchor: string | null
  replies?: PublicComment[]
}

function LabelChip({ value }: { value: string | null }) {
  const meta = commentLabel(value)
  if (!meta) return null
  return (
    <span className={`meta-label inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${meta.border} ${meta.color}`}>
      <Icon name={meta.icon} size={12} aria-hidden />
      {meta.title}
    </span>
  )
}

function Comment({
  c, copy, postId, slug, depth,
}: { c: PublicComment; copy: ArticleUiCopy['comments']; postId: string; slug: string; depth: 0 | 1 }) {
  const [replying, setReplying] = useState(false)
  const removed = isRemoved(c.status)

  return (
    <li id={`comment-${c._id}`} className={`scroll-mt-28 ${depth === 1 ? 'mt-5 pl-5 border-l border-edge' : 'py-6 border-b border-edge-faint last:border-b-0'}`}>
      <div className="flex flex-wrap items-center gap-2.5 mb-2">
        {!removed && <LabelChip value={c.label} />}
        <span className="font-sans text-sm text-stone-300">{c.author}</span>
        {c.date && <span className="font-mono text-xs text-stone-400">{formatDate(c.date, 'long', '')}</span>}
        {c.anchor && <span className="meta-label text-stone-400">{copy.onSidenoteLabel}</span>}
      </div>

      {removed ? (
        // The row stays and the body goes. 8.5 wants author-removal and self-removal visibly
        // distinct, because one is suppression and one is a person taking their words back,
        // and conflating them would be dishonest. A reply underneath still has to make sense,
        // which is the other reason the row cannot simply vanish.
        <p className="font-sans text-sm italic text-stone-400">{REMOVAL_TEXT[c.status ?? ''] ?? 'Removed'}</p>
      ) : (
        <p className="font-sans text-base text-stone-300 leading-relaxed whitespace-pre-line">{c.body}</p>
      )}

      {depth === 0 && !removed && (
        <div className="mt-3">
          {replying ? (
            <div className="mt-4 rounded-lg border border-edge bg-surface-veil p-4">
              <CommentForm postId={postId} slug={slug} copy={copy} parentId={c._id} onDone={() => setReplying(false)} autoFocus />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setReplying(true)}
              className={`font-sans text-xs text-stone-400 hover:text-white underline underline-offset-4 rounded-sm ${FOCUS}`}
            >
              {copy.replyLabel}
            </button>
          )}
        </div>
      )}

      {c.replies && c.replies.length > 0 && (
        <ul className="list-none m-0 p-0">
          {c.replies.map((r) => (
            <Comment key={r._id} c={r} copy={copy} postId={postId} slug={slug} depth={1} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function CommentThread({
  comments, total, postId, slug, copy,
}: { comments: PublicComment[]; total: number; postId: string; slug: string; copy: ArticleUiCopy['comments'] }) {
  const [filter, setFilter] = useState<string | null>(null)

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    const walk = (list: PublicComment[]) => {
      for (const c of list) {
        if (!isRemoved(c.status) && c.label) m.set(c.label, (m.get(c.label) ?? 0) + 1)
        if (c.replies) walk(c.replies)
      }
    }
    walk(comments)
    return m
  }, [comments])

  // Filtering keeps a root whose REPLY matches, because hiding a reply's parent would
  // orphan it and a filtered thread that cannot be read is not a filter.
  const shown = useMemo(() => {
    if (!filter) return comments
    return comments.filter((c) => c.label === filter || (c.replies ?? []).some((r) => r.label === filter))
  }, [comments, filter])

  const facets = COMMENT_LABELS.filter((l) => counts.get(l.value))

  return (
    <div>
      {facets.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 mb-6" role="group" aria-label={copy.labelPrompt}>
          <button type="button" onClick={() => setFilter(null)} aria-pressed={filter === null}
            className={`font-sans text-sm ${buttonClass({ variant: 'chip', size: 'sm', active: filter === null })}`}>
            {copy.allLabel}
          </button>
          {facets.map((l) => {
            const active = filter === l.value
            return (
              <button key={l.value} type="button" onClick={() => setFilter(active ? null : l.value)} aria-pressed={active}
                className={`font-sans text-sm inline-flex items-center gap-1.5 ${buttonClass({ variant: 'chip', size: 'sm', active })}`}>
                <Icon name={l.icon} size={14} className={active ? undefined : l.color} aria-hidden />
                {l.title} <span className="opacity-60 text-xs">{counts.get(l.value)}</span>
              </button>
            )
          })}
        </div>
      )}

      {shown.length > 0 ? (
        <ul className="list-none m-0 p-0">
          {shown.map((c) => (
            <Comment key={c._id} c={c} copy={copy} postId={postId} slug={slug} depth={0} />
          ))}
        </ul>
      ) : (
        <p className="font-sans text-base text-stone-400 italic py-6">{copy.empty}</p>
      )}

      {/* Pagination is part of the design, not an optimisation: measured, a post carrying 833
          comments returns 341KB in one response. A plain link rather than a fetch -- it is
          rare, it must work without JS, and it keeps the thread addressable. */}
      {total > comments.length && (
        <p className="mt-6">
          <a href={`?comments=${comments.length + 20}#comments`} className={`font-sans text-sm text-stone-400 hover:text-white underline underline-offset-4 rounded-sm ${FOCUS}`}>
            {copy.moreLabel}
          </a>
        </p>
      )}
    </div>
  )
}
