import { defineField, defineType } from 'sanity'
// sanity/schemas/objects/failureNote.ts

export default defineType({
  name: 'failureNote',
  title: 'Failure / Lesson Note',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      options: {
        list: [
          { title: '⚠ What Failed', value: 'failed' },
          { title: '⚡ What I Learned', value: 'lesson' },
          { title: '🔧 What I Fixed', value: 'fixed' },
          { title: '⚠ Warning', value: 'warning' },
        ],
        layout: 'radio',
      },
      initialValue: 'failed',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'text',
      rows: 4,
      description: 'Be direct. What specifically went wrong, what you learned, or what to watch out for.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { label: 'label', content: 'content' },
    prepare({ label, content }) {
      const labelMap: Record<string, string> = {
        failed: '⚠ What Failed',
        lesson: '⚡ What I Learned',
        fixed: '🔧 What I Fixed',
        warning: '⚠ Warning',
      }
      return {
        title: labelMap[label] ?? 'Failure Note',
        subtitle: content?.slice(0, 80) + '...',
      }
    },
  },
})
