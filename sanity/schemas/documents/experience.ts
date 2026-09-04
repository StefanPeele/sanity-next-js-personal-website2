import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'experience',
  title: 'Work Experience',
  type: 'document',
  fields: [
    defineField({
      name: 'role',
      title: 'Role / Job Title',
      type: 'string',
    }),
    defineField({
      name: 'company',
      title: 'Company Name',
      type: 'string',
    }),
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'string',
      description: 'e.g., Jan 2023 - Present',
    }),
    defineField({
      name: 'startDate',
      title: 'Start date',
      type: 'date',
      description: 'Drives ordering and the displayed date range. The Duration text above is only a fallback.',
      validation: (rule) => rule.required().warning('Without a start date this role sorts to the bottom of the resume.'),
    }),
    defineField({ name: 'endDate', title: 'End date', type: 'date' }),
    defineField({ name: 'current', title: 'Current role', type: 'boolean', initialValue: false }),
    defineField({ name: 'location', title: 'Location', type: 'string' }),
    defineField({ name: 'highlights', title: 'Highlights', type: 'array', of: [{ type: 'string' }], description: 'Three to five outcome-led bullets. These are what a recruiter scans.' }),
    defineField({ name: 'techStack', title: 'Tools and technologies', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'description',
      title: 'Job Description',
      type: 'array',
      of: [{ type: 'block' }], // This creates a rich-text editor so you can make bullet points!
    }),
  ],
  orderings: [{ title: 'Newest first', name: 'startDesc', by: [{ field: 'startDate', direction: 'desc' }] }],
  preview: { select: { title: 'role', subtitle: 'company' } },
})
