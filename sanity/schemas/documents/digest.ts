import { defineField, defineType } from 'sanity'
import { EnvelopeIcon } from '@sanity/icons'
// sanity/schemas/documents/digest.ts — PROPOSALS 9.2.
//
// One document type, composed by hand. Three entry kinds, because they genuinely differ in
// what they need: a post entry needs no link or title (both come from the reference), an
// external entry needs both, and a note entry needs neither.
//
// `note` IS REQUIRED ON EVERY KIND, and that is the whole design. The model is "link, short
// note, why it matters", and the note is the only part a reader cannot get anywhere else. A
// digest that is a list of links is an RSS feed with extra steps, so the document type
// enforces the format rather than relying on discipline.
//
// `sentAt` IS THE STATE MACHINE. There is no `status` enum: a digest is a draft until it has
// a sentAt and sent afterwards. One field, no way for two fields to disagree, and no way to
// mark something sent that was not.
//
// Deliberately NOT in this schema: categories, tags, segments, scheduled-send, A/B anything.
// 9.4 says subscribers get what you send, and every one of those fields is a decision you
// would have to make each time you wrote one.

const note = defineField({
  name: 'note',
  title: 'Why it matters',
  type: 'text',
  rows: 3,
  description: 'One or two sentences in your own voice. This is the part a reader cannot get anywhere else, so it is required on every entry.',
  validation: (rule) => rule.required().min(10),
})

export default defineType({
  name: 'digest',
  title: 'Digest',
  type: 'document',
  icon: EnvelopeIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g. "Digest 004 — what fails at 1500 bytes". Used as the email subject.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'text',
      rows: 4,
      description: 'Two or three sentences, in your voice, before the list.',
    }),
    defineField({
      name: 'entries',
      title: 'Entries',
      type: 'array',
      validation: (rule) => rule.min(1),
      of: [
        {
          type: 'object',
          name: 'postEntry',
          title: 'A post of mine',
          fields: [
            defineField({ name: 'post', title: 'Post', type: 'reference', to: [{ type: 'post' }], validation: (r) => r.required() }),
            note,
          ],
          preview: { select: { title: 'post.title', subtitle: 'note' } },
        },
        {
          type: 'object',
          name: 'linkEntry',
          title: 'Something else I read',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'url', title: 'URL', type: 'url', validation: (r) => r.required() }),
            // The publication or the person: "Julia Evans", "APNIC Blog". It is what makes a
            // list of five links scannable, and it is the one thing a URL does not give you
            // at a glance.
            defineField({ name: 'source', title: 'Source', type: 'string', description: 'The publication or the person, e.g. "APNIC Blog".' }),
            note,
          ],
          preview: { select: { title: 'title', subtitle: 'source' } },
        },
        {
          type: 'object',
          name: 'noteEntry',
          title: 'Just a thought',
          fields: [
            defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'body', title: 'Body', type: 'text', rows: 4, validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'heading', subtitle: 'body' } },
        },
      ],
    }),
    // 9.5. Most digests should be public; the occasional one should not have to be.
    defineField({
      name: 'archived',
      title: 'Publish to the archive',
      type: 'boolean',
      initialValue: true,
      description: 'Show this digest at /blog/digests after it is sent. An archive is what makes subscribing a decision rather than a leap: it replaces a description of the emails with the emails themselves.',
    }),

    // ── Written by the send, never by hand ────────────────────────────────────
    defineField({
      name: 'sentAt',
      title: 'Sent',
      type: 'datetime',
      readOnly: true,
      description: 'Written by the send. Its presence IS "sent" — there is no separate status field to disagree with it.',
    }),
    defineField({
      name: 'recipientCount',
      title: 'Sent to',
      type: 'number',
      readOnly: true,
      description: 'How many confirmed subscribers it went to. A record of what happened, not a target.',
    }),
  ],
  orderings: [{ title: 'Newest first', name: 'sentDesc', by: [{ field: 'sentAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'title', sentAt: 'sentAt', count: 'recipientCount' },
    prepare: ({ title, sentAt, count }) => ({
      title: title || 'Untitled digest',
      subtitle: sentAt ? `Sent ${String(sentAt).slice(0, 10)} to ${count ?? 0}` : 'Draft — not sent',
    }),
  },
})
