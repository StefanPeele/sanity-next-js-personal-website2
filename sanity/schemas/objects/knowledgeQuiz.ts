import { defineArrayMember, defineField, defineType } from 'sanity'
// sanity/schemas/objects/knowledgeQuiz.ts

export default defineType({
  name: 'knowledgeQuiz',
  title: 'Knowledge Check Quiz',
  type: 'object',
  fields: [
    // ── Delivery mode ───────────────────────────────────────────────
    defineField({
      name: 'triggerAfterSection',
      title: 'Trigger after section (heading text)',
      type: 'string',
      description:
        'Type the exact text of an h2 heading in this article. A floating "Check your understanding" pill will appear after the reader scrolls past that section — no inline quiz block. Leave blank to render the quiz inline instead.',
      placeholder: 'e.g. How Routing Decisions Are Made',
    }),
    defineField({
      name: 'isGated',
      title: 'Gate content below? (inline mode only)',
      type: 'boolean',
      initialValue: false,
      description:
        'When enabled and triggerAfterSection is blank, readers must answer correctly before the content below is revealed. Ignored when triggerAfterSection is set.',
    }),

    // ── Quiz content ────────────────────────────────────────────────
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (Rule) => Rule.required().min(10),
    }),
    defineField({
      name: 'options',
      title: 'Answer Options',
      type: 'array',
      validation: (Rule) => Rule.required().min(2).max(5),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'text',
              title: 'Option Text',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'isCorrect',
              title: 'Is Correct Answer?',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {
            select: { title: 'text', subtitle: 'isCorrect' },
            prepare({ title, subtitle }) {
              return { title, subtitle: subtitle ? '✓ Correct' : '✗ Incorrect' }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'explanation',
      title: 'Explanation (shown after answer)',
      type: 'text',
      rows: 3,
      description: 'Why is the correct answer right? This reinforces retention.',
    }),
  ],
  preview: {
    select: {
      title: 'question',
      gated: 'isGated',
      trigger: 'triggerAfterSection',
    },
    prepare({ title, gated, trigger }) {
      let subtitle = 'Inline Quiz'
      if (trigger) subtitle = `Floating — after "${trigger}"`
      else if (gated) subtitle = '🔒 Gated Inline Quiz'
      return { title: title ?? 'Untitled Quiz', subtitle }
    },
  },
})