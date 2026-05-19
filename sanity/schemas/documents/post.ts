import { defineField, defineType } from 'sanity'
// sanity/schemas/documents/post.ts

export default defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug URL',
      type: 'slug',
      description: 'Click "Generate" to automatically create a URL from the title',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'isFeatured',
      title: 'Feature this post?',
      description: 'Turn this on to make this the massive hero article at the top of the blog.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'categories',
      title: 'Categories & Topics',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'category' } }],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
    }),
    defineField({
      name: 'mainImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt / Short Summary',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'body',
      title: 'Article Content',
      type: 'array',
      of: [
        // ── Standard text blocks with sidenote annotation ─────────
        {
          type: 'block',
          marks: {
            annotations: [
              // Standard link
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                  }),
                ],
              },
              // Sidenote — margin annotation
              {
                name: 'sidenote',
                type: 'object',
                title: 'Sidenote / Definition',
                icon: () => '📎',
                fields: [
                  defineField({
                    name: 'note',
                    type: 'text',
                    title: 'Note, definition, or fact',
                    rows: 3,
                    description: 'This appears in the margin alongside the highlighted text.',
                    validation: (rule) => rule.required(),
                  }),
                ],
              },
            ],
          },
        },
        { type: 'image' },
        { type: 'code' },
        // ── Interactive blog features ──────────────────────────────
        { type: 'knowledgeQuiz' },
        { type: 'layerExplorer' },
        { type: 'packetAnimator' },
        { type: 'wiresharkCallout' },
        // ── New editorial features ─────────────────────────────────
        { type: 'sectionBreak' },
        { type: 'failureNote' },
      ],
    }),

    // ── Sources ───────────────────────────────────────────────────
    defineField({
      name: 'sources',
      title: 'Sources & References',
      description: 'Cite every claim. These render as a footnote section at the bottom of the post.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'source',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
            }),
            defineField({
              name: 'author',
              title: 'Author / Organization',
              type: 'string',
            }),
            defineField({
              name: 'type',
              title: 'Source Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Article', value: 'article' },
                  { title: 'RFC / Standard', value: 'rfc' },
                  { title: 'Research Paper', value: 'paper' },
                  { title: 'Book', value: 'book' },
                  { title: 'Documentation', value: 'documentation' },
                  { title: 'Video', value: 'video' },
                  { title: 'Other', value: 'other' },
                ],
              },
              initialValue: 'article',
            }),
            defineField({
              name: 'description',
              title: 'Brief Description (optional)',
              type: 'string',
              description: 'One line on why this source matters or what it covers',
            }),
          ],
          preview: {
            select: { title: 'title', author: 'author', type: 'type' },
            prepare({ title, author, type }) {
              const icons: Record<string, string> = {
                article: '📰',
                rfc: '📋',
                paper: '📄',
                book: '📚',
                documentation: '📖',
                video: '🎥',
                other: '🔗',
              }
              return {
                title: `${icons[type] ?? '🔗'} ${title}`,
                subtitle: author ?? '',
              }
            },
          },
        },
      ],
    }),
  ],
})