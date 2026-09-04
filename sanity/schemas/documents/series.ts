import { defineField, defineType } from 'sanity'
// sanity/schemas/documents/series.ts
// A series groups posts into an ordered sequence ("Home Lab Build", "PowerShell Library").
// Posts point at the series and carry their own seriesOrder.

export default defineType({
  name: 'series',
  title: 'Series',
  type: 'document',
  icon: () => '🧵',
  fields: [
    defineField({
      name: 'title',
      title: 'Series title',
      type: 'string',
      description: 'e.g. "Building the Physical Home Lab" or "PowerShell for the Real World".',
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
      name: 'description',
      title: 'What this series covers',
      type: 'text',
      rows: 3,
      description: 'One or two sentences. Shown on the series banner in every post and on the series page.',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'In progress — more parts coming', value: 'in-progress' },
          { title: 'Complete', value: 'complete' },
          { title: 'Paused', value: 'paused' },
        ],
        layout: 'radio',
      },
      initialValue: 'in-progress',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'status' },
  },
})
