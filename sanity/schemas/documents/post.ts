import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug URL',
      type: 'slug',
      description: 'Click "Generate" to automatically create a URL from the title',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    // Featured Toggle for the Hero Section
    defineField({
      name: 'isFeatured',
      title: 'Feature this post?',
      description: 'Turn this on to make this the massive hero article at the top of the blog.',
      type: 'boolean',
      initialValue: false,
    }),
    // Categories / Topics
    defineField({
      name: 'categories',
      title: 'Categories & Topics',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'category' } }],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
    }),
    defineField({
      name: 'mainImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt / Short Summary',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'body',
      title: 'Article Content',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image' }, // Added image support for inline article images
        { type: 'code' },  // Added the new code block support!
      ], 
    }),
  ],
})