import { defineField, defineType } from 'sanity'
// sanity/schemas/documents/mediaItem.ts
// Powers the Library page — books, articles, white papers, podcasts, etc.

export default defineType({
  name: 'mediaItem',
  title: 'Library Item',
  type: 'document',

  groups: [
    { name: 'info',       title: '📖 Info',       default: true },
    { name: 'assessment', title: '💭 Assessment' },
    { name: 'connections', title: '🔗 Connections' },
  ],

  fields: [

    // ── Core info ─────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'info',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'author',
      title: 'Author / Creator',
      type: 'string',
      group: 'info',
      description: 'For podcasts: the host or show name. For RFCs: the working group or lead author.',
    }),

    defineField({
      name: 'mediaType',
      title: 'Media Type',
      type: 'string',
      group: 'info',
      options: {
        list: [
          { title: '📚 Book', value: 'book' },
          { title: '📰 Article', value: 'article' },
          { title: '📑 White Paper', value: 'whitepaper' },
          { title: '🏭 Industry Paper', value: 'industry-paper' },
          { title: '📋 RFC / Standard', value: 'rfc' },
          { title: '📄 Research Paper', value: 'research-paper' },
          { title: '🎙 Podcast', value: 'podcast' },
          { title: '📧 Newsletter', value: 'newsletter' },
          { title: '🎥 Video / Course', value: 'video' },
          { title: '📖 Documentation', value: 'documentation' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'coverImage',
      title: 'Cover / Thumbnail',
      type: 'image',
      group: 'info',
      description: 'Book cover, podcast thumbnail, publication logo. Upload square or portrait images for best results.',
      options: { hotspot: true },
    }),

    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'info',
      options: {
        list: [
          { title: '📖 Currently reading / listening', value: 'current' },
          { title: '✅ Finished', value: 'finished' },
          { title: '📌 Want to read', value: 'want-to-read' },
          { title: '🔄 Reference — dipping in and out', value: 'reference' },
          { title: '🚫 Abandoned', value: 'abandoned' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'url',
      title: 'URL / Link',
      type: 'url',
      group: 'info',
      description: 'Link to the book on Amazon, the article URL, the podcast episode, the RFC page, etc.',
    }),

    defineField({
      name: 'startedAt',
      title: 'Started',
      type: 'date',
      group: 'info',
    }),

    defineField({
      name: 'finishedAt',
      title: 'Finished',
      type: 'date',
      group: 'info',
    }),

    defineField({
      name: 'progressPercent',
      title: 'Progress (for currently reading)',
      type: 'number',
      group: 'info',
      description: 'A rough percentage. 0–100. Updated manually — honesty over precision. Only meaningful while status is "Currently reading".',
      hidden: ({ document }) => document?.status !== 'current',
      validation: (rule) =>
        rule
          .min(0)
          .max(100)
          .custom((value, context) => {
            const status = (context.document as { status?: string } | undefined)?.status
            if (value !== undefined && value !== null && status !== 'current') {
              return 'Progress only applies while the status is "Currently reading". Clear it or change the status.'
            }
            return true
          }),
    }),

    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      group: 'info',
      options: {
        list: [
          { title: 'Networking', value: 'networking' },
          { title: 'Security', value: 'security' },
          { title: 'Systems / Infrastructure', value: 'systems' },
          { title: 'Photography', value: 'photography' },
          { title: 'Business / Career', value: 'business' },
          { title: 'Writing / Communication', value: 'writing' },
          { title: 'General / Other', value: 'general' },
        ],
      },
    }),

    // ── Assessment ────────────────────────────────────────────────
    defineField({
      name: 'oneSentenceTake',
      title: 'One-sentence take',
      type: 'string',
      group: 'assessment',
      description: 'Your honest reaction. No summaries — just your take. This is mandatory because it forces you to commit to an opinion.',
      validation: (rule) => rule.required().error('A one-sentence take is required for every library item — no exceptions. Commit to an opinion.'),
    }),

    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'string',
      group: 'assessment',
      description: 'No stars. A direct statement.',
      options: {
        list: [
          { title: '🔄 Changed how I think', value: 'changed-thinking' },
          { title: '✓ Worth the time', value: 'worth-it' },
          { title: '→ Fine', value: 'fine' },
          { title: '✗ Not for me', value: 'not-for-me' },
          { title: '⚠ Abandoned — here\'s why', value: 'abandoned' },
        ],
        layout: 'radio',
      },
    }),

    defineField({
      name: 'keyIdea',
      title: 'Key idea retained',
      type: 'text',
      rows: 3,
      group: 'assessment',
      description: 'The one thing you actually retained and use. One paragraph max. If you can\'t write this, you didn\'t really read it.',
    }),

    defineField({
      name: 'quote',
      title: 'One quote worth keeping',
      type: 'text',
      rows: 3,
      group: 'assessment',
      description: 'Optional. One quote maximum — choosing the one forces honesty about what actually mattered. Leave blank if nothing stood out.',
    }),

    defineField({
      name: 'abandonedReason',
      title: 'Why I abandoned it',
      type: 'string',
      group: 'assessment',
      description: 'Only fill this in if status is Abandoned. Be direct — "The first 50 pages were padding" is useful information.',
    }),

    // ── Connections ───────────────────────────────────────────────
    defineField({
      name: 'influencedPosts',
      title: 'Posts this influenced',
      type: 'array',
      group: 'connections',
      description: 'Which blog posts or notes did reading this directly contribute to? This is the most important field in the Library — it makes the connection between your reading and your writing visible to readers.',
      of: [{ type: 'reference', to: [{ type: 'post' }] }],
    }),
    defineField({
      name: 'influencedNotes',
      title: 'Garden notes this influenced',
      type: 'array',
      group: 'connections',
      of: [{ type: 'reference', to: [{ type: 'note' }] }],
    }),
    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'array',
      group: 'assessment',
      description: 'Passages worth keeping. One per entry.',
      of: [{ type: 'text', rows: 3 }],
    }),

  ],

  orderings: [
    { title: 'Status', name: 'status', by: [{ field: 'status', direction: 'asc' }] },
    { title: 'Recently finished', name: 'finishedAt', by: [{ field: 'finishedAt', direction: 'desc' }] },
    { title: 'Category', name: 'category', by: [{ field: 'category', direction: 'asc' }] },
  ],

  preview: {
    select: { title: 'title', mediaType: 'mediaType', status: 'status', media: 'coverImage' },
    prepare({ title, mediaType, status, media }) {
      const typeIcons: Record<string, string> = {
        book: '📚', article: '📰', whitepaper: '📑', 'industry-paper': '🏭',
        rfc: '📋', 'research-paper': '📄', podcast: '🎙', newsletter: '📧',
        video: '🎥', documentation: '📖',
      }
      const statusDot: Record<string, string> = { current: '●', finished: '✓', 'want-to-read': '○', reference: '⟳', abandoned: '✗' }
      return {
        title: `${typeIcons[mediaType] ?? '📖'} ${title}`,
        subtitle: `${statusDot[status] ?? ''} ${status}`,
        media,
      }
    },
  },
})