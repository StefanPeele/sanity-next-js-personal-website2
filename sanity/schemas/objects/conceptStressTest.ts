import { defineField, defineType } from 'sanity'
// sanity/schemas/objects/conceptStressTest.ts

export default defineType({
  name: 'conceptStressTest',
  title: 'Concept Stress Test',
  type: 'object',
  description: 'The single most effective retention technique: force the reader to think before they see the answer. Place this at the end of a major section. Not multiple choice — a prompt that asks them to formulate their own answer before revealing yours.',
  fields: [
    defineField({
      name: 'prompt',
      title: 'The question / prompt',
      type: 'string',
      description: 'Ask them to apply, explain, or predict — not recite. "What would happen to your OSPF adjacencies if you changed the Hello interval on one router but not the other?" is better than "What does OSPF stand for?"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'answer',
      title: 'Your answer',
      type: 'text',
      rows: 5,
      description: 'Hidden behind a "Reveal Answer" button. Write this as the answer you wish someone had given you when you were learning. Be direct, be complete, acknowledge edge cases.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'hint',
      title: 'Hint (optional)',
      type: 'string',
      description: 'A nudge that points toward the answer without giving it away. "Think about what the Hello packet contains." Use sparingly.',
    }),
  ],
  preview: {
    select: { title: 'prompt' },
    prepare({ title }) {
      return { title: `❓ ${title}` }
    },
  },
})