import {CogIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import { DEFAULT_SETTINGS } from '@/lib/cms/defaults/settings'

export default defineType({
  name: 'settings',
  title: 'Identity & SEO',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'identity', title: 'Identity & SEO', default: true },
    { name: 'links', title: 'Links' },
    { name: 'footer', title: 'Footer' },
    { name: 'newsletter', title: 'Newsletter' },
    { name: 'legacy', title: 'Legacy' },
  ],
  fields: [
    // ── Identity & SEO ──────────────────────────────────────────
    defineField({ name: 'siteName', title: 'Site name', type: 'string', group: 'identity', initialValue: DEFAULT_SETTINGS.siteName }),
    defineField({ name: 'legalName', title: 'Full name', type: 'string', group: 'identity', initialValue: DEFAULT_SETTINGS.legalName }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string', group: 'identity', description: 'Appended to page titles in the browser tab.', initialValue: DEFAULT_SETTINGS.tagline }),
    defineField({ name: 'description', title: 'Site description', type: 'text', rows: 3, group: 'identity', description: 'Default meta description and social preview text.', initialValue: DEFAULT_SETTINGS.description }),
    defineField({ name: 'keywords', title: 'Keywords', type: 'array', of: [{ type: 'string' }], group: 'identity', initialValue: DEFAULT_SETTINGS.keywords }),
    defineField({ name: 'jobTitle', title: 'Job title', type: 'string', group: 'identity', initialValue: DEFAULT_SETTINGS.jobTitle }),
    defineField({ name: 'knowsAbout', title: 'Areas of expertise', type: 'array', of: [{ type: 'string' }], group: 'identity', initialValue: DEFAULT_SETTINGS.knowsAbout }),
    defineField({ name: 'location', title: 'Location', type: 'object', group: 'identity', initialValue: DEFAULT_SETTINGS.location, fields: [
      defineField({ name: 'city', title: 'City', type: 'string' }),
      defineField({ name: 'region', title: 'State / region', type: 'string' }),
    ] }),
    defineField({ name: 'school', title: 'School', type: 'string', group: 'identity', initialValue: DEFAULT_SETTINGS.school }),
    defineField({ name: 'bookingEmail', title: 'Booking sender email', type: 'string', group: 'identity', description: 'The From address for booking and newsletter emails. Must be verified in Resend.', initialValue: DEFAULT_SETTINGS.bookingEmail }),

    // ── Footer copy ─────────────────────────────────────────────
    defineField({ name: 'footer', title: 'Footer', type: 'object', group: 'footer', initialValue: DEFAULT_SETTINGS.footer, fields: [
      defineField({ name: 'ctaLabel', title: 'Contact button label', type: 'string' }),
      defineField({ name: 'directoryHeading', title: 'Pages column heading', type: 'string' }),
      defineField({ name: 'networkHeading', title: 'Links column heading', type: 'string' }),
      defineField({ name: 'copyrightNote', title: 'Note under the copyright line', type: 'string' }),
      defineField({ name: 'networkLabels', title: 'Link labels', type: 'object', fields: [
        defineField({ name: 'email', title: 'Email', type: 'string' }),
        defineField({ name: 'github', title: 'GitHub', type: 'string' }),
        defineField({ name: 'linkedin', title: 'LinkedIn', type: 'string' }),
        defineField({ name: 'gitbook', title: 'Gitbook', type: 'string' }),
        defineField({ name: 'instagram', title: 'Instagram', type: 'string' }),
        defineField({ name: 'bluesky', title: 'Bluesky', type: 'string' }),
        defineField({ name: 'trello', title: 'Trello', type: 'string' }),
        defineField({ name: 'rss', title: 'RSS', type: 'string' }),
      ] }),
    ] }),

    // ── Newsletter copy ─────────────────────────────────────────
    defineField({ name: 'newsletter', title: 'Newsletter', type: 'object', group: 'newsletter', initialValue: DEFAULT_SETTINGS.newsletter, fields: [
      defineField({ name: 'heading', title: 'Heading', type: 'string' }),
      defineField({ name: 'blurb', title: 'Blurb', type: 'text', rows: 2 }),
      defineField({ name: 'placeholder', title: 'Input placeholder', type: 'string' }),
      defineField({ name: 'buttonLabel', title: 'Button label', type: 'string' }),
      defineField({ name: 'successMessage', title: 'Success message', type: 'string' }),
      defineField({ name: 'hint', title: 'Hint under the form', type: 'string' }),
    ] }),

    defineField({
      group: 'legacy',
      deprecated: { reason: 'Navigation is edited under Site → Navigation.' },
      hidden: true,
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
      group: 'links',
      name: 'email',
      title: 'Contact Email',
      type: 'string',
      description: 'The email address used in the "Initiate Contact" footer button.',
    }),
    defineField({
      group: 'links',
      name: 'github',
      title: 'GitHub URL',
      type: 'url',
    }),
    defineField({
      group: 'links',
      name: 'linkedin',
      title: 'LinkedIn URL',
      type: 'url',
    }),
    defineField({
      group: 'links',
      name: 'trello',
      title: 'Trello URL',
      type: 'url',
      description: 'Link to your public project board or portfolio tracking.',
    }),
    defineField({ name: 'instagram', title: 'Instagram URL', type: 'url' }),
    defineField({ name: 'bluesky', title: 'Bluesky URL', type: 'url' }),
    defineField({ name: 'gitbook', title: 'Gitbook URL', type: 'url' }),
    defineField({
      group: 'links',
      name: 'calendlyUrl',
      title: 'Scheduling link (Calendly)',
      type: 'url',
      description: 'When set, "Schedule a consultation" buttons open this. When empty they scroll to the inquiry form.',
    }),
    defineField({
      group: 'identity',
      name: 'openTo',
      title: 'Open-to status line',
      type: 'string',
      description: 'Shown on the contact page and homepage, e.g. "Open to Summer 2027 network / infrastructure internships".',
    }),
    
    // --- DYNAMIC FOOTER HEADLINE (SPLIT FOR STYLING) ---
    defineField({
      group: 'footer',
      name: 'footerHeadlinePrefix',
      title: 'Footer Headline (First Part)',
      type: 'string',
      description: 'Text before the styled highlight (e.g., "Let\'s bring")',
    }),
    defineField({
      group: 'footer',
      name: 'footerHeadlineHighlight',
      title: 'Footer Headline (Highlighted Part)',
      type: 'string',
      description: 'The italicized, colored text (e.g., "intent & logic")',
    }),
    defineField({
      group: 'footer',
      name: 'footerHeadlineSuffix',
      title: 'Footer Headline (Last Part)',
      type: 'string',
      description: 'Text after the highlight (e.g., "to your next project.")',
    }),

    // --- NEW PHOTOGRAPHY ARCHIVE FIELDS ---
    defineField({
      group: 'legacy',
      hidden: true,
      deprecated: { reason: 'Edited under Site → Photography.' },
      name: 'archiveTitle',
      title: 'Photography Archive Title',
      type: 'string',
      description: 'The main title on the photography albums page.',
      initialValue: 'The Archives',
    }),
    defineField({
      group: 'legacy',
      hidden: true,
      deprecated: { reason: 'Edited under Site → Photography.' },
      name: 'archiveSubtitle',
      title: 'Photography Archive Subtitle',
      type: 'string',
      description: 'The small mono-spaced subtitle on the photography albums page.',
      initialValue: 'STRUCTURED VOLUMES AND EDITORIAL COLLECTIONS.',
    }),

    defineField({
      group: 'legacy',
      hidden: true,
      deprecated: { reason: 'Not rendered. Footer copy is under the Footer tab.' },
      name: 'footerInfo',
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
      group: 'identity',
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
        subtitle: 'Identity, SEO, links, footer, newsletter',
      }
    },
  },
})