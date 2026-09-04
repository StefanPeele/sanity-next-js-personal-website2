import { defineField, defineType } from 'sanity'
// sanity/schemas/documents/testimonial.ts
// Only testimonials with consent = true are ever rendered.

export default defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  icon: () => '💬',
  fields: [
    defineField({ name: 'name', title: 'Client name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'role', title: 'Context', type: 'string', description: 'e.g. "NJIT Graduation 2026" or "Event — Newark"' }),
    defineField({ name: 'quote', title: 'Quote', type: 'text', rows: 4, validation: (r) => r.required().max(500) }),
    defineField({ name: 'date', title: 'Date', type: 'date' }),
    defineField({
      name: 'service',
      title: 'Service',
      type: 'string',
      options: { list: ['Portrait', 'Event', 'Graduation', 'Specialty', 'Other'] },
    }),
    defineField({ name: 'photo', title: 'Photo (optional)', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'consent',
      title: 'Client gave written consent to publish',
      type: 'boolean',
      initialValue: false,
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: 'name', role: 'role', service: 'service', consent: 'consent', media: 'photo' },
    prepare({ title, role, service, consent, media }) {
      const context = [service, role].filter(Boolean).join(' · ')
      return {
        title: `${consent ? '✅' : '⛔'} ${title ?? 'Unnamed'}`,
        subtitle: consent ? context || 'Consented — will publish' : `Not published (no consent)${context ? ` · ${context}` : ''}`,
        media,
      }
    },
  },
})
