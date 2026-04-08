import { defineArrayMember, defineField, defineType } from 'sanity'
// sanity/schemas/objects/wiresharkCallout.ts

export default defineType({
  name: 'wiresharkCallout',
  title: 'Wireshark Callout Block',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Wireshark Screenshot',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
      description: 'Upload your Wireshark capture screenshot here.',
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      placeholder: 'e.g. TCP three-way handshake captured on eth0',
      description: 'Shown at the bottom when no callout is active.',
    }),
    defineField({
      name: 'callouts',
      title: 'Callout Annotations',
      type: 'array',
      description: 'Number each callout sequentially. Numbers appear as badges on the screenshot.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'number',
              title: 'Callout Number',
              type: 'number',
              validation: (Rule) => Rule.required().min(1).integer(),
            }),
            defineField({
              name: 'rowDescription',
              title: 'Row Description',
              type: 'string',
              placeholder: 'e.g. Frame 1 — TCP SYN from client 192.168.1.10',
              description: 'Short label identifying which row/frame this refers to.',
            }),
            defineField({
              name: 'explanation',
              title: 'Explanation',
              type: 'text',
              rows: 3,
              description: 'What does this packet or row tell us? Teach the reader.',
            }),
          ],
          preview: {
            select: { title: 'number', subtitle: 'rowDescription' },
            prepare({ title, subtitle }) {
              return { title: `Callout ${title}`, subtitle: subtitle ?? 'No description' }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'caption', media: 'image' },
    prepare({ title, media }) {
      return {
        title: title ?? 'Wireshark Capture',
        subtitle: 'Callout Block',
        media,
      }
    },
  },
})