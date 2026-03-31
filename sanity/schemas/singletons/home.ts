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
    // --- PROFILE IMAGE FIELD ---
    defineField({
      name: 'profileImage',
      title: 'Profile Image',
      description: 'Your professional/editorial portrait used for the hero hover and about section.',
      type: 'image',
      options: {
        hotspot: true, // Enables UI for cropping and focal point
      },
    }),
    defineField({
      name: 'overview',
      description: 'Used for the <meta> description tag and the personal website subheader.',
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
                fields: [{ name: 'href', type: 'url', title: 'Url' }],
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

    // --- DYNAMIC STATUS & LOCATION ---
    defineField({
      name: 'currently',
      title: 'Currently Status',
      type: 'string',
      initialValue: 'Exploring light & architecture',
    }),
    defineField({
      name: 'location',
      title: 'Current Location',
      type: 'string',
      initialValue: 'New York City',
    }),

    // --- PHILOSOPHY & GOALS ---
    defineField({
      name: 'manifesto',
      title: 'Manifesto Text',
      type: 'text',
      description: 'Your creative philosophy shown at the bottom of the cinematic box.',
    }),
    defineField({
      name: 'aspirations',
      title: 'Career Aspirations',
      type: 'text',
      description: 'A forward-looking statement about where you want to take your work.',
    }),

    // --- EXPERTISE PILLARS ---
    defineField({
      name: 'expertisePillars',
      title: 'Expertise Pillars',
      description: 'Define 3 core strengths or focus areas (e.g., Narrative, Tech, Vision).',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Pillar Title' },
            { name: 'description', type: 'string', title: 'Pillar Description' },
          ],
        }),
      ],
      validation: (rule) => rule.max(3),
    }),

    defineField({
      name: 'showcaseProjects',
      title: 'Showcase projects',
      type: 'array',
      readOnly: false, // <--- WE FORCEFULLY UNLOCKED THE FIELD HERE
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
      media: 'profileImage' // Shows the uploaded photo in the Sanity sidebar
    },
    prepare({title, media}) {
      return { subtitle: 'Home', title, media }
    },
  },
})