import { defineField, defineType } from 'sanity'
// sanity/schemas/documents/learningPath.ts
// An ordered route through posts and notes: "CCNA in order", "Windows Server from zero".

export default defineType({
  name: 'learningPath',
  title: 'Learning Path',
  type: 'document',
  icon: () => '🧭',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'description',
      title: 'Who this is for and what they will be able to do',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'level',
      title: 'Level',
      type: 'string',
      options: {
        list: [
          { title: 'Foundations', value: 'foundations' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' },
        ],
        layout: 'radio',
      },
      initialValue: 'foundations',
    }),
    defineField({
      name: 'estimatedHours',
      title: 'Estimated hours',
      type: 'number',
      validation: (r) => r.min(0),
    }),
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'array',
      description: 'In reading order. Each step is a post or a garden note plus an optional note on why it is here.',
      of: [
        {
          type: 'object',
          name: 'step',
          fields: [
            defineField({ name: 'post', title: 'Post', type: 'reference', to: [{ type: 'post' }] }),
            defineField({ name: 'gardenNote', title: 'Garden note', type: 'reference', to: [{ type: 'note' }] }),
            defineField({ name: 'note', title: 'Why this step', type: 'string' }),
          ],
          validation: (r) =>
            r.custom((v: { post?: unknown; gardenNote?: unknown } | undefined) =>
              v?.post || v?.gardenNote ? true : 'Pick a post or a note',
            ),
          preview: {
            select: { post: 'post.title', note: 'gardenNote.title', why: 'note' },
            prepare({ post, note, why }) {
              return { title: post ?? note ?? 'Empty step', subtitle: why }
            },
          },
        },
      ],
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'level' } },
})
