import { defineArrayMember, defineField, defineType } from 'sanity'
// sanity/schemas/objects/packetAnimator.ts

export default defineType({
  name: 'packetAnimator',
  title: 'Packet Journey Animator',
  type: 'object',
  fields: [
    defineField({
      name: 'scenario',
      title: 'Scenario Label',
      type: 'string',
      placeholder: 'e.g. HTTP GET Request, TCP Three-Way Handshake',
      description: 'Short label shown in the component header.',
    }),
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'array',
      validation: (Rule) => Rule.required().min(2),
      description: 'Each step represents one stage of the packet journey. Order matters.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Step Label',
              type: 'string',
              validation: (Rule) => Rule.required(),
              placeholder: 'e.g. App layer initiates HTTP GET',
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 3,
              description: 'Explain what happens at this step in plain language.',
            }),
            defineField({
              name: 'layer',
              title: 'OSI Layer Number (1–7)',
              type: 'number',
              validation: (Rule) => Rule.required().min(1).max(7).integer(),
            }),
            defineField({
              name: 'layerName',
              title: 'Layer Name',
              type: 'string',
              placeholder: 'e.g. Application, Transport, Network',
            }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'layer' },
            prepare({ title, subtitle }) {
              return { title: title ?? 'Untitled Step', subtitle: `Layer ${subtitle}` }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'scenario' },
    prepare({ title }) {
      return { title: title ?? 'Packet Journey', subtitle: 'Packet Animator' }
    },
  },
})