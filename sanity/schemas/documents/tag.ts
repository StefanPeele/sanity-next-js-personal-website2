import { defineField, defineType } from 'sanity'
import { TagIcon } from '@sanity/icons'
// sanity/schemas/documents/tag.ts
// Shared tags used across notes in the digital garden.
// Using references (not free text) keeps tags consistent and linkable.

export default defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Tag name',
      type: 'string',
      description: 'Keep it short and specific. Use lowercase. "ospf" not "OSPF Routing Protocol". Tags should be reusable across many notes.',
      validation: (rule) =>
        rule.required().custom(async (title, context) => {
          if (!title) return true
          const id = (context.document?._id ?? '').replace(/^drafts\./, '')
          const client = context.getClient({ apiVersion: '2025-02-27' })
          const dupes = await client.fetch<number>(
            `count(*[_type == "tag" && lower(title) == lower($t) && !(_id in [$id, "drafts." + $id])])`,
            { t: title, id },
          )
          return dupes > 0 ? `A tag called "${title}" already exists. Reuse it instead of creating a duplicate.` : true
        }),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 64, isUnique: (slug, context) => context.defaultIsUnique(slug, context) },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description (optional)',
      type: 'string',
      description: 'One sentence clarifying what this tag covers. Useful when the tag name alone is ambiguous.',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Helps group tags in the cloud. Pick the closest match.',
      options: {
        list: [
          { title: 'Networking', value: 'networking' },
          { title: 'Security', value: 'security' },
          { title: 'Systems', value: 'systems' },
          { title: 'Tools', value: 'tools' },
          { title: 'Concepts', value: 'concepts' },
          { title: 'Career', value: 'career' },
          { title: 'Photography', value: 'photography' },
          { title: 'Writing', value: 'writing' },
          { title: 'Other', value: 'other' },
        ],
      },
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'category' },
    prepare({ title, subtitle }) {
      return { title: `#${title}`, subtitle: subtitle ?? 'Uncategorized' }
    },
  },
})