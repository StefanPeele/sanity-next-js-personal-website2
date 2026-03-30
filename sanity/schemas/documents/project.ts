import {DocumentIcon, ImageIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'title',
      description: 'This field is the title of your project.',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'overview',
      description: 'Used both for the <meta> description tag for SEO, and project subheader.',
      title: 'Overview',
      type: 'array',
      of: [
        defineArrayMember({
          lists: [],
          marks: {
            annotations: [],
            decorators: [
              { title: 'Italic', value: 'em' },
              { title: 'Strong', value: 'strong' },
            ],
          },
          styles: [],
          type: 'block',
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      description: 'The massive cinematic image used on the project list and hero section.',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'duration',
    }),
    defineField({
      name: 'client',
      title: 'Client / Course / Organization',
      type: 'string',
    }),
    
    // --- IT INFRASTRUCTURE & DEV FIELDS ---
    defineField({
      name: 'techStack',
      title: 'Tech Stack & Tools',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Press enter after each one (e.g., Cisco, AWS, React, Python)',
    }),
    defineField({
      name: 'githubUrl',
      title: 'GitHub Repository URL',
      type: 'url',
    }),
    defineField({
      name: 'liveUrl',
      title: 'Live Demo or Production URL',
      type: 'url',
    }),
    defineField({
      name: 'boardUrl',
      title: 'Project Board URL (Trello, Jira, Notion)',
      type: 'url',
    }),
    
    // --- TOPOLOGIES & DIAGRAMS ---
    defineField({
      name: 'architecture',
      title: 'Architecture & Topologies',
      description: 'Upload your network diagrams, database schemas, or system topologies here.',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            { name: 'caption', type: 'string', title: 'Caption' },
            { name: 'alt', type: 'string', title: 'Alt Text' },
          ]
        }
      ]
    }),

    // --- CASE STUDY CONTENT ---
    defineField({
      name: 'description',
      title: 'Full Case Study',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [{ name: 'href', type: 'url', title: 'Url' }],
              },
            ],
          },
          styles: [],
        }),
        defineArrayMember({ name: 'timeline', type: 'timeline' }),
        // Standard in-line images
        defineField({
          type: 'image',
          icon: ImageIcon,
          name: 'image',
          title: 'Image',
          options: { hotspot: true },
          fields: [
            defineField({ title: 'Caption', name: 'caption', type: 'string' }),
            defineField({ name: 'alt', type: 'string', title: 'Alt text' }),
          ],
        }),
        // NEW: Code snippets for your case studies!
        { type: 'code' },
      ],
    }),
  ],
})