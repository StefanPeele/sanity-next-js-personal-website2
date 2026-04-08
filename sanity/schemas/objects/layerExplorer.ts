import { defineArrayMember, defineField, defineType } from 'sanity'
// sanity/schemas/objects/layerExplorer.ts

export default defineType({
  name: 'layerExplorer',
  title: 'OSI Layer Explorer',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title (optional)',
      type: 'string',
      placeholder: 'Defaults to "OSI Model Explorer"',
      description: 'Override the header label if needed (e.g. "TCP/IP Model Explorer").',
    }),
    defineField({
      name: 'overrides',
      title: 'Layer Overrides (optional)',
      type: 'array',
      description:
        'Override protocols, descriptions, or real-world examples for specific layers. Leave empty to use defaults.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'layerNumber',
              title: 'Layer Number (1–7)',
              type: 'number',
              validation: (Rule) => Rule.required().min(1).max(7).integer(),
            }),
            defineField({
              name: 'protocols',
              title: 'Protocols (comma-separated)',
              type: 'string',
              placeholder: 'e.g. HTTP, DNS, SMTP',
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
            }),
            defineField({
              name: 'realWorld',
              title: 'Real-World Example',
              type: 'text',
              rows: 2,
            }),
          ],
          preview: {
            select: { title: 'layerNumber', subtitle: 'protocols' },
            prepare({ title, subtitle }) {
              return { title: `Layer ${title} Override`, subtitle: subtitle ?? 'No protocols set' }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return { title: title ?? 'OSI Layer Explorer', subtitle: 'Interactive Component' }
    },
  },
})