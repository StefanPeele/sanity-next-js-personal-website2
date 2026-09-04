import { defineField, defineType } from 'sanity'
// sanity/schemas/documents/note.ts
// Notes are the digital garden layer beneath blog posts.
// They are shorter, rougher, and more honest than posts.
// A note can be a seedling (raw idea) → growing → evergreen (stable reference).
// Visibility is handled by Sanity's built-in draft/publish system:
//   Draft = private. Published = public on /garden.

export default defineType({
  name: 'note',
  title: 'Note',
  type: 'document',

  groups: [
    { name: 'content',     title: '✍ Content',     default: true },
    { name: 'metadata',    title: '🌱 Garden'                     },
    { name: 'connections', title: '🔗 Connections'                },
  ],

  fields: [

    // ── Content ───────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      description: 'Short and direct. Often a question or a concept name. "Why does BGP use TCP?" or "OSPF cost calculation" — not a full sentence.',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'body',
      title: 'Content',
      type: 'array',
      group: 'content',
      description: `
        Notes are not blog posts. They are allowed to be incomplete, rough, and uncertain.
        Write what you know right now — even if it's two sentences.
        A seedling note with three sentences is better than a blank note waiting to be perfect.
        You can use Sidenote annotations and Code blocks here.
      `,
      of: [
        {
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [defineField({ name: 'href', type: 'url', title: 'URL' })],
              },
              {
                name: 'sidenote',
                type: 'object',
                title: '📎 Sidenote',
                icon: () => '📎',
                fields: [
                  defineField({
                    name: 'note',
                    type: 'text',
                    title: 'Note or definition',
                    rows: 2,
                    validation: (rule) => rule.required(),
                  }),
                ],
              },
            ],
          },
        },
        { type: 'code' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', type: 'string', title: 'Alt text', validation: (r) => r.required() }),
            defineField({ name: 'caption', type: 'string', title: 'Caption' }),
          ],
        },
      ],
    }),

    // ── Garden metadata ───────────────────────────────────────────
    defineField({
      name: 'status',
      title: 'Growth status',
      type: 'string',
      group: 'metadata',
      description: `
        SEEDLING 🌱 — Raw idea. Possibly wrong. Worth capturing. You're not committed to this being true yet.
        The page will say "This is an early-stage thought — treat it accordingly."

        GROWING 🌿 — Being actively developed. Has structure. Starting to verify against real experience.

        EVERGREEN 🌲 — Stable and reliable. You'd confidently link to this from a blog post or
        recommend it to someone learning the topic. The destination of a good note.
      `,
      options: {
        list: [
          { title: '🌱 Seedling — raw idea, possibly wrong', value: 'seedling' },
          { title: '🌿 Growing — being developed, partially verified', value: 'growing' },
          { title: '🌲 Evergreen — stable, reliable, linkable', value: 'evergreen' },
        ],
        layout: 'radio',
      },
      initialValue: 'seedling',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'metadata',
      description: 'Assign 1–6 tags from your shared tag library. Tags power the garden filter. Create new tags in the Tags section before using them here.',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
      validation: (rule) => rule.max(6).warning('More than 6 tags dilutes the signal.'),
    }),

    defineField({
      name: 'origin',
      title: 'Where this came from',
      type: 'string',
      group: 'metadata',
      description: 'Provenance matters. Where did this idea enter your thinking?',
      options: {
        list: [
          { title: '💡 Original thought', value: 'original' },
          { title: '🔬 Lab observation — noticed while working', value: 'lab' },
          { title: '📚 Reading — from a book, article, or paper', value: 'reading' },
          { title: '💬 Conversation — from a mentor, peer, or class', value: 'conversation' },
          { title: '🎓 Course material — CCNA, NJIT, or similar', value: 'course' },
        ],
        layout: 'radio',
      },
    }),

    defineField({
      name: 'lastTended',
      title: 'Last tended',
      type: 'date',
      group: 'metadata',
      description: 'Update this whenever you significantly revise the note. "Last tended" shows the garden is alive — not a graveyard of half-finished thoughts.',
    }),

    // ── Connections ───────────────────────────────────────────────
    defineField({
      name: 'relatedNotes',
      title: 'Related notes',
      type: 'array',
      group: 'connections',
      description: 'Links between notes create the connective tissue of your garden. Two linked notes are more valuable than two isolated ones. Link aggressively — even weak connections are worth marking.',
      of: [{ type: 'reference', to: [{ type: 'note' }] }],
    }),

    defineField({
      name: 'relatedPosts',
      title: 'Related blog posts',
      type: 'array',
      group: 'connections',
      description: 'When a note grows into a blog post, or when a blog post references this note, link them here. The connection makes both more useful.',
      of: [{ type: 'reference', to: [{ type: 'post' }] }],
    }),

  ],

  orderings: [
    { title: 'Last tended', name: 'lastTended', by: [{ field: 'lastTended', direction: 'desc' }] },
    { title: 'Status', name: 'status', by: [{ field: 'status', direction: 'asc' }] },
    { title: 'Title A–Z', name: 'title', by: [{ field: 'title', direction: 'asc' }] },
  ],

  preview: {
    select: { title: 'title', status: 'status', media: 'body.0' },
    prepare({ title, status }) {
      const icons: Record<string, string> = {
        seedling: '🌱',
        growing:  '🌿',
        evergreen:'🌲',
      }
      return {
        title: `${icons[status] ?? '📝'} ${title}`,
        subtitle: status ?? 'No status',
      }
    },
  },
})