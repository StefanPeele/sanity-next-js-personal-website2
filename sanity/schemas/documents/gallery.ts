import { ImageIcon } from '@sanity/icons' // Optional: adds a nice icon in the studio
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'gallery',
  title: 'Photography Gallery',
  type: 'document',
  icon: ImageIcon,
  fieldsets: [
    {
      name: 'technical',
      title: 'Shoot Technical Profile',
      options: {
        columns: 2,
        collapsible: true,
        collapsed: false,
      },
    },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Gallery Title',
      type: 'string',
      description: 'The name of the event or editorial volume (e.g., "NJIT Tech Summit 2025")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Used for the URL. Click "Generate" based on the title.',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Cover Image',
      type: 'image',
      description: 'This image will represent the gallery on the main photography index page.',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'images',
      title: 'Gallery Images',
      type: 'array',
      description: 'DRAG AND DROP MULTIPLE IMAGES HERE FOR BULK UPLOAD.',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Specific Photo Caption (Optional)',
            }
          ],
        },
      ],
      options: {
        layout: 'grid', // This makes the array look like a contact sheet in the studio
      },
    }),
    defineField({
      name: 'overview',
      title: 'The Story / Context',
      type: 'text',
      description: 'Briefly describe the intent or narrative behind this volume.',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }], // Linking to your existing category document
      description: 'e.g., Editorial, Architecture, Portraits',
    }),
    
    // --- TECHNICAL PROFILE (General specs for the whole shoot) ---
    defineField({
      name: 'system',
      title: 'Camera System',
      type: 'string',
      fieldset: 'technical',
      initialValue: 'SONY A7III',
    }),
    defineField({
      name: 'lens',
      title: 'Lens / Gear',
      type: 'string',
      fieldset: 'technical',
      description: 'Primary glass used for this volume.',
    }),
    defineField({
      name: 'iso',
      title: 'Film Stock / ISO',
      type: 'string',
      fieldset: 'technical',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      fieldset: 'technical',
    }),
    defineField({
      name: 'notes',
      title: 'Extra Notes / Conditions',
      type: 'text',
      fieldset: 'technical',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'mainImage',
    },
  },
})