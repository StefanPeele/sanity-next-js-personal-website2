import { BlockElementIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
// sanity/schemas/documents/blocklist.ts — Phase 8.7.
//
// One entry per blocked commenter. The accept path checks this before writing anything, and
// a blocked submission is answered EXACTLY like a successful one: the spammer learns
// nothing, retries nothing, and moves on.
//
// Blocking is per ADDRESS or per IP HASH, never per comment, because the workflow that
// matters on a bad night is one click per spammer rather than one click per comment.

export default defineType({
  name: 'blocklist',
  title: 'Blocked commenter',
  type: 'document',
  icon: BlockElementIcon,
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      description: 'Blocks this address. Leave empty to block only by IP hash.',
    }),
    defineField({
      name: 'ipHash',
      title: 'IP hash',
      type: 'string',
      description: 'Copy from the comment being blocked. A salted hash, never the address itself.',
    }),
    defineField({
      name: 'reason',
      title: 'Reason',
      type: 'string',
      description: 'Private. For your own records.',
    }),
    defineField({ name: 'createdAt', title: 'Blocked at', type: 'datetime' }),
  ],
  preview: {
    select: { title: 'email', subtitle: 'reason', hash: 'ipHash' },
    prepare: ({ title, subtitle, hash }) => ({
      title: title || (hash ? `IP ${String(hash).slice(0, 12)}…` : '(empty entry)'),
      subtitle: subtitle || 'no reason recorded',
    }),
  },
  validation: (rule) =>
    rule.custom((doc) =>
      doc?.email || doc?.ipHash ? true : 'An entry needs an email or an IP hash, or it blocks nothing.',
    ),
})
