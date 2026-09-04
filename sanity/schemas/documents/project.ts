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

    // --- STRUCTURED CASE STUDY ---
    defineField({ name: 'featured', title: 'Feature on homepage', type: 'boolean', initialValue: false }),
    defineField({ name: 'role', title: 'My role', type: 'string', description: 'What you personally owned, e.g. "Sole engineer" or "Storage assessment lead (team of 3)".' }),
    defineField({ name: 'problem', title: 'Problem', type: 'text', rows: 3, description: 'The situation before. What was broken, missing, or at risk.' }),
    defineField({ name: 'constraints', title: 'Constraints', type: 'array', of: [{ type: 'string' }], description: 'Budget, access, time, legacy systems. One per line.' }),
    defineField({ name: 'approach', title: 'Approach', type: 'text', rows: 4, description: 'What you did and why that path over the alternatives.' }),
    defineField({ name: 'outcome', title: 'Outcome', type: 'text', rows: 3, description: 'What changed. Lead with the measurable result.' }),
    defineField({
      name: 'metrics',
      title: 'Metrics',
      type: 'array',
      description: 'Numbers that prove the outcome, e.g. label "Free SSD tier", value "444 GB → 2.1 TB".',
      of: [
        {
          type: 'object',
          name: 'metric',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'value', title: 'Value', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'note', title: 'Note', type: 'string' }),
          ],
          preview: { select: { title: 'value', subtitle: 'label' } },
        },
      ],
    }),
    defineField({ name: 'retrospective', title: 'What I would do differently', type: 'text', rows: 3 }),
    defineField({ name: 'docsUrl', title: 'Documentation URL (Gitbook etc.)', type: 'url' }),
    defineField({ name: 'relatedPosts', title: 'Related posts', type: 'array', of: [{ type: 'reference', to: [{ type: 'post' }] }] }),
    defineField({ name: 'relatedNotes', title: 'Related garden notes', type: 'array', of: [{ type: 'reference', to: [{ type: 'note' }] }] }),

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