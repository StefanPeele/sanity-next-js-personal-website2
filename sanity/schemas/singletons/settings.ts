import {CogIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'settings',
  title: 'Settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'menuItems',
      title: 'Menu Item list',
      description: 'Links displayed on the header of your site.',
      type: 'array',
      of: [
        {
          title: 'Reference',
          type: 'reference',
          to: [
            { type: 'home' },
            { type: 'page' },
            { type: 'project' },
          ],
        },
      ],
    }),

    // --- NEW SOCIAL & CONTACT FIELDS ---
    defineField({
      name: 'email',
      title: 'Contact Email',
      type: 'string',
      description: 'The email address used in the "Initiate Contact" footer button.',
    }),
    defineField({
      name: 'github',
      title: 'GitHub URL',
      type: 'url',
    }),
    defineField({
      name: 'linkedin',
      title: 'LinkedIn URL',
      type: 'url',
    }),
    defineField({
      name: 'trello',
      title: 'Trello URL',
      type: 'url',
      description: 'Link to your public project board or portfolio tracking.',
    }),
    
    // --- DYNAMIC FOOTER HEADLINE (SPLIT FOR STYLING) ---
    defineField({
      name: 'footerHeadlinePrefix',
      title: 'Footer Headline (First Part)',
      type: 'string',
      description: 'Text before the styled highlight (e.g., "Let\'s bring")',
    }),
    defineField({
      name: 'footerHeadlineHighlight',
      title: 'Footer Headline (Highlighted Part)',
      type: 'string',
      description: 'The italicized, colored text (e.g., "intent & logic")',
    }),
    defineField({
      name: 'footerHeadlineSuffix',
      title: 'Footer Headline (Last Part)',
      type: 'string',
      description: 'Text after the highlight (e.g., "to your next project.")',
    }),

    // --- NEW PHOTOGRAPHY ARCHIVE FIELDS ---
    defineField({
      name: 'archiveTitle',
      title: 'Photography Archive Title',
      type: 'string',
      description: 'The main title on the photography albums page.',
      initialValue: 'The Archives',
    }),
    defineField({
      name: 'archiveSubtitle',
      title: 'Photography Archive Subtitle',
      type: 'string',
      description: 'The small mono-spaced subtitle on the photography albums page.',
      initialValue: 'STRUCTURED VOLUMES AND EDITORIAL COLLECTIONS.',
    }),

    defineField({
      name: 'footer',
      description: 'This is a block of text that will be displayed at the bottom of the page (Legacy/Additional info).',
      title: 'Footer Info',
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
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'Url',
                  },
                ],
              },
            ],
          },
        }),
      ],
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      description: 'Displayed on social cards and search engine results.',
      options: {
        hotspot: true,
      },
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Settings',
        subtitle: 'Menu, Social Links, Metadata, and Titles',
      }
    },
  },
})