import { sanityFetch } from '@/sanity/lib/live'
import { commentsForPostQuery } from '@/sanity/lib/queries'
import { CommentThread, type PublicComment } from '@/components/blog/CommentThread'
import { CommentForm } from '@/components/blog/CommentForm'
import { commentAuthor, isRemoved, COMMENT_LIMITS } from '@/lib/comments'
import type { ArticleUiCopy } from '@/lib/cms/defaults/articleUi'
// components/blog/CommentsSection.tsx — Phase 8. SERVER component.
//
// This file is the redaction boundary, and that is its main job. Everything below it is a
// client component, so anything it hands down is serialised into the RSC payload and
// readable in view-source. The query never selects `email`, `token` or `ipHash` -- a field
// that is not selected cannot be leaked by a component that forgets -- and the name is
// resolved through commentAuthor() HERE, so an anonymous commenter's typed name never
// leaves the server.
//
// This project has already shipped the other version of this: reviewer names were readable
// in the payload while no pixel showed them. tests/comments.spec.ts asserts the contract.

type RawComment = {
  _id: string
  label: string | null
  authorName: string | null
  anonymous: boolean | null
  body: string | null
  createdAt: string | null
  publishedAt: string | null
  status: string | null
  anchor: string | null
  parentId?: string | null
  replies?: RawComment[]
}

function toPublic(c: RawComment): PublicComment {
  const removed = isRemoved(c.status)
  return {
    _id: c._id,
    label: c.label,
    author: commentAuthor(c),
    // The body of a removed comment is not sent at all. Hiding it with CSS, or sending it
    // and rendering something else, would leave it in view-source -- which is the whole
    // failure mode this file exists to prevent.
    body: removed ? null : c.body,
    date: c.publishedAt ?? c.createdAt,
    status: c.status,
    anchor: c.anchor ?? null,
    replies: (c.replies ?? []).map(toPublic),
  }
}

export async function CommentsSection({
  postId,
  slug,
  copy,
  page = COMMENT_LIMITS.pageSize,
}: {
  postId: string
  slug: string
  copy: ArticleUiCopy['comments']
  /** How many ROOTS to show. The ?comments= param raises it; see CommentThread. */
  page?: number
}) {
  const size = Math.min(Math.max(page, COMMENT_LIMITS.pageSize), 200)
  const { data } = await sanityFetch({
    query: commentsForPostQuery,
    params: { postId, from: 0, to: size },
    stega: false,
  })

  const roots = ((data?.roots ?? []) as unknown as RawComment[]).map(toPublic)
  const total = data?.total ?? 0

  return (
    <section id="comments" className="mt-16 pt-10 border-t border-edge scroll-mt-28" aria-labelledby="comments-heading">
      <div className="flex flex-wrap items-baseline gap-4 mb-2">
        <h2 id="comments-heading" className="section-label">{copy.heading}</h2>
        {total > 0 && (
          <span className="font-sans text-xs text-stone-400">{copy.countLabel.replace('{n}', String(total))}</span>
        )}
      </div>
      {/* The invitation, not a disclaimer. §2 of the brief: the blog "exists to invite
          professional critique", and an empty box invites nothing by itself. */}
      <p className="font-sans text-sm text-stone-400 mb-8 max-w-prose">{copy.lede}</p>

      <CommentThread comments={roots} total={total} postId={postId} slug={slug} copy={copy} />

      <div className="mt-12 pt-8 border-t border-edge-faint">
        <h3 className="section-label mb-5">{copy.formHeading}</h3>
        <CommentForm postId={postId} slug={slug} copy={copy} />
      </div>
    </section>
  )
}
