import { CommentIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
import { COMMENT_LABELS, COMMENT_STATUSES } from '@/lib/comments'
// sanity/schemas/documents/comment.ts
// Reader comments, written by app/actions/comment.ts and confirmed by
// app/api/comments/confirm. Phase 8.
//
// The author never creates one of these by hand; the Studio is where they are MODERATED.
// So most fields are readOnly and the two that are not -- status and moderatorNote -- are
// the two moderation actually uses.
//
// `email` is stored and never projected into any query a client component can reach. The
// brief is explicit that the address is "for me and for abuse control, not for display",
// and this project has already shipped a version of that contract that leaked into the RSC
// payload while no pixel showed it. See lib/comments.ts and tests/comments.spec.ts.

export default defineType({
  name: 'comment',
  title: 'Comment',
  type: 'document',
  icon: CommentIcon,
  fields: [
    defineField({
      name: 'post',
      title: 'On post',
      type: 'reference',
      to: [{ type: 'post' }],
      // Weak: deleting a post must not be blocked by the conversation underneath it, and a
      // comment whose post is gone should be deletable rather than a dangling constraint.
      weak: true,
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'parent',
      title: 'In reply to',
      type: 'reference',
      to: [{ type: 'comment' }],
      weak: true,
      readOnly: true,
      description:
        'One level only. A reply to a reply is re-parented to the same root at write time, so this can never form a tree.',
    }),
    defineField({
      name: 'anchor',
      title: 'Anchored to sidenote',
      type: 'string',
      readOnly: true,
      description: 'The _key of the sidenote this responds to, when the reader replied from the margin.',
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      options: { list: COMMENT_LABELS.map((l) => ({ title: l.title, value: l.value })), layout: 'radio' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'authorName',
      title: 'Name',
      type: 'string',
      readOnly: true,
      description: 'Empty when the commenter chose to be anonymous.',
    }),
    defineField({
      name: 'anonymous',
      title: 'Anonymous',
      type: 'boolean',
      readOnly: true,
      initialValue: false,
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      readOnly: true,
      description: 'Never displayed, never sent to the browser. For verification and abuse control only.',
    }),
    defineField({
      name: 'body',
      title: 'Comment',
      type: 'text',
      rows: 6,
      readOnly: true,
      validation: (rule) => rule.required().min(2).max(4000),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: COMMENT_STATUSES.map((s) => ({ title: s.title, value: s.value })), layout: 'radio' },
      initialValue: 'pending',
      validation: (rule) => rule.required(),
      description:
        'Only `published` is ever read by the site. Removing a comment keeps the row and replaces the body, so a thread with holes stays honest.',
    }),
    defineField({
      name: 'moderatorNote',
      title: 'Moderator note',
      type: 'string',
      description: 'Private. Why this was removed, for your own records.',
    }),
    defineField({
      name: 'token',
      title: 'Confirmation token',
      type: 'string',
      readOnly: true,
      description: 'Single-purpose secret used in the confirm link. Do not share.',
    }),
    defineField({ name: 'createdAt', title: 'Submitted at', type: 'datetime', readOnly: true }),
    defineField({ name: 'publishedAt', title: 'Confirmed at', type: 'datetime', readOnly: true }),
    defineField({ name: 'ipHash', title: 'IP hash', type: 'string', readOnly: true, description: 'Salted hash, for blocking. Not the address itself.' }),
  ],
  orderings: [
    { title: 'Newest first', name: 'createdAtDesc', by: [{ field: 'createdAt', direction: 'desc' }] },
    { title: 'Oldest first', name: 'createdAtAsc', by: [{ field: 'createdAt', direction: 'asc' }] },
  ],
  preview: {
    select: { body: 'body', status: 'status', label: 'label', name: 'authorName', anon: 'anonymous', post: 'post.title' },
    prepare({ body, status, label, name, anon, post }) {
      const who = anon ? 'Anonymous' : name || 'Unnamed'
      return {
        title: (body ?? '').slice(0, 70) || '(empty)',
        subtitle: `${status ?? 'pending'} · ${label ?? 'no label'} · ${who} · ${post ?? 'no post'}`,
      }
    },
  },
})
