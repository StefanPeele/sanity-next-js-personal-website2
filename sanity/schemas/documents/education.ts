import { defineField, defineType } from 'sanity'
// sanity/schemas/documents/education.ts

export default defineType({
  name: 'education',
  title: 'Education',
  type: 'document',
  icon: () => '🏛️',
  fields: [
    defineField({ name: 'school', title: 'School', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'degree', title: 'Degree', type: 'string', description: 'e.g. B.S.' }),
    defineField({ name: 'field', title: 'Field of study', type: 'string', description: 'e.g. Information Technology — Security Specialization' }),
    defineField({ name: 'startDate', title: 'Start', type: 'date' }),
    defineField({ name: 'endDate', title: 'End (or expected)', type: 'date' }),
    defineField({ name: 'expected', title: 'End date is expected, not earned', type: 'boolean', initialValue: true }),
    defineField({ name: 'details', title: 'Details', type: 'array', of: [{ type: 'string' }], description: 'Coursework, honors, clubs. One per line.' }),
  ],
  preview: { select: { title: 'school', subtitle: 'field' } },
})
