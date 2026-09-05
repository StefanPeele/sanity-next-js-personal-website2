import {HomeIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import { DEFAULT_HOME_SECTIONS } from '@/lib/cms/defaults/home'
import { HOME_SECTION_NAMES } from '@/sanity/schemas/objects/home-sections'

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
      description: 'Two or three projects rendered as cards on the homepage, in this order. Fill each project\'s Role and Outcome — the cards lead with them.',
      type: 'array',
      validation: (rule) => rule.max(3).warning('The homepage shows at most three showcase projects.'),
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'project'}],
        }),
      ],
    }),

    defineField({
      name: 'sections',
      title: 'Sections',
      description: 'Which blocks the homepage shows, in this order. Drag to reorder; open a block to hide it or change its labels.',
      type: 'array',
      initialValue: DEFAULT_HOME_SECTIONS,
      of: HOME_SECTION_NAMES.map((name) => defineArrayMember({ type: name })),
      validation: (rule) =>
        rule.custom((value) => {
          const types = ((value as { _type?: string }[] | undefined) ?? []).map((v) => v._type)
          const dupes = types.filter((t, i) => types.indexOf(t) !== i)
          return dupes.length ? `Each section can appear once (duplicate: ${dupes.join(', ')})` : true
        }),
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