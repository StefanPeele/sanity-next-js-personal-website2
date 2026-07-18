import { defineField, defineType } from 'sanity'
// sanity/schemas/objects/whatIGotWrong.ts

export default defineType({
  name: 'whatIGotWrong',
  title: 'What I Got Wrong First',
  type: 'object',
  description: 'Your initial misconception before understanding clicked. This is the most relatable content you can write — readers who are confused feel seen, readers who understood it feel validated.',
  fields: [
    defineField({
      name: 'misconception',
      title: 'What I thought',
      type: 'string',
      description: 'The wrong idea. State it plainly and without hedging — that honesty is the whole point.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'correction',
      title: 'What it actually is',
      type: 'text',
      rows: 3,
      description: 'The correct understanding. Write it as if explaining to someone who had the same misconception you did.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'whyItMatters',
      title: 'Why the distinction matters',
      type: 'text',
      rows: 2,
      description: 'Optional but powerful. What would you have gotten wrong in practice if you had kept the misconception?',
    }),
  ],
  preview: {
    select: { title: 'misconception', subtitle: 'correction' },
    prepare({ title, subtitle }) {
      return { title: `✗ I thought: ${title}`, subtitle: subtitle?.slice(0, 80) }
    },
  },
})