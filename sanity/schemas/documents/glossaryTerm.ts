import { defineField, defineType } from 'sanity'
// sanity/schemas/documents/glossaryTerm.ts
// Define a term once. Any occurrence of the term (or an alias) in an article body
// gets a hover definition card automatically — no markup needed in the post.

export default defineType({
  name: 'glossaryTerm',
  title: 'Glossary Term',
  type: 'document',
  icon: () => '📖',
  fields: [
    defineField({
      name: 'term',
      title: 'Term',
      type: 'string',
      description: 'Exactly as it appears in prose, e.g. "BGP" or "spanning tree".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'term', maxLength: 64 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'aliases',
      title: 'Aliases',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Other spellings that should also get the hover card, e.g. "Border Gateway Protocol", "STP".',
    }),
    defineField({
      name: 'definition',
      title: 'Short definition',
      type: 'text',
      rows: 2,
      description: 'One or two plain-language sentences. This is what the hover card shows.',
      validation: (rule) => rule.required().max(280),
    }),
    defineField({
      name: 'longDefinition',
      title: 'Longer explanation',
      type: 'array',
      of: [{ type: 'block' }, { type: 'code' }],
      description: 'Optional. Shown on the /glossary page only.',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: ['Routing', 'Switching', 'Security', 'Storage', 'Windows', 'Linux', 'Cloud', 'Wireless', 'Protocols', 'Hardware', 'Process', 'Other'],
      },
    }),
    defineField({
      name: 'relatedPosts',
      title: 'Related posts',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'post' }] }],
    }),
    defineField({
      name: 'relatedNotes',
      title: 'Related garden notes',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'note' }] }],
    }),
  ],
  orderings: [{ title: 'A–Z', name: 'term', by: [{ field: 'term', direction: 'asc' }] }],
  preview: { select: { title: 'term', subtitle: 'definition' } },
})
