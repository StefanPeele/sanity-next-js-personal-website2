import { defineField, defineType } from 'sanity'
// sanity/schemas/documents/certification.ts

export default defineType({
  name: 'certification',
  title: 'Certification',
  type: 'document',
  icon: () => '🎓',
  fields: [
    defineField({ name: 'title', title: 'Certification', type: 'string', description: 'e.g. "CCNA", "CompTIA Security+"', validation: (r) => r.required() }),
    defineField({ name: 'issuer', title: 'Issuer', type: 'string', description: 'e.g. Cisco, CompTIA, Microsoft' }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Earned', value: 'earned' },
          { title: 'In progress', value: 'in-progress' },
          { title: 'Planned', value: 'planned' },
        ],
        layout: 'radio',
      },
      initialValue: 'in-progress',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'earnedAt', title: 'Earned on', type: 'date' }),
    defineField({ name: 'expiresAt', title: 'Expires on', type: 'date' }),
    defineField({ name: 'targetDate', title: 'Target exam date', type: 'date' }),
    defineField({ name: 'progressPercent', title: 'Study progress %', type: 'number', validation: (r) => r.min(0).max(100) }),
    defineField({ name: 'credentialUrl', title: 'Verification URL', type: 'url' }),
    defineField({ name: 'credentialId', title: 'Credential ID', type: 'string' }),
  ],
  preview: { select: { title: 'title', subtitle: 'status' } },
})
