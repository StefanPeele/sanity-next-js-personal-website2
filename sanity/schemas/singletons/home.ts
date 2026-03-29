import {HomeIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'home',
  title: 'Home',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'title',
      description: 'This field is the title of your personal website.',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'overview',
      description:
        'Used both for the <meta> description tag for SEO, and the personal website subheader.',
      title: 'Description',
      type: 'array',
      of: [
        defineArrayMember({
          lists: [],
          marks: {
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'Url',
                  },
                ],
              },
            ],
            decorators: [
              {title: 'Italic', value: 'em'},
              {title: 'Strong', value: 'strong'},
            ],
          },
          styles: [],
          type: 'block',
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    // --- NEW DYNAMIC CONTENT FIELDS ---
    defineField({
      name: 'currently',
      title: 'Currently Status',
      type: 'string',
      description: 'What are you up to right now? (e.g., Exploring light & architecture)',
      initialValue: 'Exploring light & architecture',
    }),
    defineField({
      name: 'location',
      title: 'Current Location',
      type: 'string',
      description: 'Your current city or base.',
      initialValue: 'New York City',
    }),
    defineField({
      name: 'manifesto',
      title: 'Manifesto Text',
      type: 'text',
      description: 'Your creative philosophy shown at the bottom of the page.',
      initialValue: 'I believe in capturing the quiet moments between the noise. My work bridges raw, analog imperfection with precise digital engineering.',
    }),
    // ----------------------------------

    defineField({
      name: 'showcaseProjects',
      title: 'Showcase projects',
      description: 'These are the projects that will appear first on your landing page.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'project'}],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({title}) {
      return {
        subtitle: 'Home',
        title,
      }
    },
  },
})