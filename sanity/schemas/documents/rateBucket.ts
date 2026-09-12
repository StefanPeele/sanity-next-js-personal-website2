import { ClockIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
// sanity/schemas/documents/rateBucket.ts
// Durable rate-limit buckets. Phase 8.7.
//
// WHY THIS EXISTS. lib/security.ts keeps buckets in a module-level Map. On Vercel each
// serverless instance has its own module scope, so that limit is per INSTANCE, not per
// site, and it resets on every cold start -- the file's own header says so. For the
// newsletter that is tolerable. For an open comment box it is the difference between a
// limit and the appearance of one.
//
// A document per key rather than a new dependency: it costs one write per attempt, it is
// visible in the Studio when something is happening, and it needs no second service on a
// site that is Vercel-only by standing decision.
//
// The key is always a HASH -- never a raw IP or address. See lib/rateStore.ts.

export default defineType({
  name: 'rateBucket',
  title: 'Rate bucket',
  type: 'document',
  icon: ClockIcon,
  // Machine-written and machine-read. Nothing here is edited by hand; it is in the Studio
  // so a spam wave is visible, not so it can be curated.
  readOnly: true,
  fields: [
    defineField({ name: 'key', title: 'Key', type: 'string', description: 'Salted hash of the action and the client. Never an address.' }),
    defineField({ name: 'count', title: 'Count', type: 'number' }),
    defineField({ name: 'resetAt', title: 'Window ends', type: 'datetime' }),
    defineField({ name: 'updatedAt', title: 'Last hit', type: 'datetime' }),
  ],
  orderings: [
    { title: 'Busiest first', name: 'countDesc', by: [{ field: 'count', direction: 'desc' }] },
    { title: 'Most recent', name: 'updatedAtDesc', by: [{ field: 'updatedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'key', count: 'count', resetAt: 'resetAt' },
    prepare: ({ title, count, resetAt }) => ({
      title: title ?? '(no key)',
      subtitle: `${count ?? 0} in the window, ends ${resetAt ? new Date(resetAt).toISOString().slice(0, 16).replace('T', ' ') : '?'}`,
    }),
  },
})
