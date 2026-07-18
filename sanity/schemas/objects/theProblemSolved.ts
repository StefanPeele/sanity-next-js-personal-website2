import { defineField, defineType } from 'sanity'
// sanity/schemas/objects/theProblemSolved.ts

export default defineType({
  name: 'theProblemSolved',
  title: 'The Problem This Solved',
  type: 'object',
  description: 'Every protocol, design pattern, and standard exists because someone had a specific problem. Tell that story. BGP wasn\'t invented because engineers liked complexity — it was invented because the early internet literally couldn\'t scale.',
  fields: [
    defineField({
      name: 'context',
      title: 'Historical context',
      type: 'text',
      rows: 4,
      description: 'Two to four sentences. What was broken, what was missing, or what was impossible before this existed? Be concrete — dates, scale, or consequences make it real.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'externalLink',
      title: 'Further reading (optional)',
      type: 'url',
      description: 'Link to an RFC, a Wikipedia article, or a paper that covers the history in more depth.',
    }),
    defineField({
      name: 'year',
      title: 'Year / era (optional)',
      type: 'string',
      description: 'e.g. "1989" or "early 1990s" — grounding it in time makes it more tangible.',
    }),
  ],
  preview: {
    select: { title: 'context' },
    prepare({ title }) {
      return { title: `🕰 ${title?.slice(0, 80)}` }
    },
  },
})