import { defineField, defineType } from 'sanity'
// sanity/schemas/objects/sectionBreak.ts

export default defineType({
  name: 'sectionBreak',
  title: 'Section Break',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
      description: 'The name of the next section — shown as the break headline',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'teaser',
      title: 'Section Teaser',
      type: 'text',
      rows: 2,
      description: 'One sentence previewing what this section covers',
    }),
    defineField({
      name: 'style',
      title: 'Break Style',
      type: 'string',
      options: {
        list: [
          { title: 'Subtle — thin divider with text', value: 'subtle' },
          { title: 'Cinematic — full pause, large title', value: 'cinematic' },
        ],
        layout: 'radio',
      },
      initialValue: 'cinematic',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'teaser' },
    prepare({ title, subtitle }) {
      return {
        title: `§ ${title}`,
        subtitle: subtitle || 'Section break',
      }
    },
  },
})
