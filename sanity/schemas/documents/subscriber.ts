import { EnvelopeIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
// sanity/schemas/documents/subscriber.ts
// Newsletter subscribers written by app/actions/subscribe.ts (double opt-in).
// To send a broadcast: Vision → *[_type == "subscriber" && status == "confirmed"].email
// → paste into a Resend Audience → Resend Broadcasts. See README.md.

export default defineType({
  name: 'subscriber',
  title: 'Subscriber',
  type: 'document',
  icon: EnvelopeIcon,
  readOnly: false,
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending confirmation', value: 'pending' },
          { title: 'Confirmed', value: 'confirmed' },
          { title: 'Unsubscribed', value: 'unsubscribed' },
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      description: 'Where the form was submitted from (footer, article, /blog).',
    }),
    defineField({
      name: 'token',
      title: 'Confirmation token',
      type: 'string',
      description: 'Random secret used in confirm/unsubscribe links. Do not share.',
      readOnly: true,
    }),
    defineField({ name: 'createdAt', title: 'Subscribed at', type: 'datetime', readOnly: true }),
    defineField({ name: 'confirmedAt', title: 'Confirmed at', type: 'datetime', readOnly: true }),
    defineField({ name: 'unsubscribedAt', title: 'Unsubscribed at', type: 'datetime', readOnly: true }),
  ],
  orderings: [
    { title: 'Newest first', name: 'createdAtDesc', by: [{ field: 'createdAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'email', subtitle: 'status' },
  },
})
