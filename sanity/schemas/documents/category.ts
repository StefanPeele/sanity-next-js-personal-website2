import { TagIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Used in /photography?category=<slug>. Generate from the title.',
      options: { source: 'title', maxLength: 48 },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'themeColor',
      title: 'Accent colour',
      type: 'string',
      description: 'Optional hex colour, e.g. #fbbf24.',
      validation: (rule) => rule.regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, { name: 'hex colour', invert: false }).warning('Use a hex colour like #fbbf24.'),
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
})
