import { ImageIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'gallery',
  title: 'Photography Gallery',
  type: 'document',
  icon: ImageIcon,
  fieldsets: [
    {
      name: 'technical',
      title: 'Shoot Technical Profile (Defaults)',
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
      description: 'DRAG AND DROP MULTIPLE IMAGES HERE FOR BULK UPLOAD. Click "Edit" on individual images to add specific titles and technical specs.',
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
              name: 'title',
              type: 'string',
              title: 'Image Title (Overrides Gallery Title)',
              description: 'e.g., "Ahmet - Headshot"',
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Specific Photo Caption (Optional)',
            },
            // --- INDIVIDUAL TECHNICAL SPECS ---
            {
              name: 'aperture',
              type: 'string',
              title: 'Aperture (e.g., f/2.8)',
            },
            {
              name: 'shutter',
              type: 'string',
              title: 'Shutter Speed (e.g., 1/250)',
            },
            {
              name: 'iso',
              type: 'string',
              title: 'ISO (Overrides shoot default)',
            },
            {
              name: 'lensOverride',
              type: 'string',
              title: 'Lens Override',
              description: 'Fill this out ONLY if this specific shot used a different lens than the shoot default.',
            },
            {
              name: 'systemOverride',
              type: 'string',
              title: 'Camera Override',
              description: 'Fill this out ONLY if this specific shot used a different camera than the shoot default.',
            }
          ],
        },
      ],
      options: {
        layout: 'grid',
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
      to: [{ type: 'category' }],
      description: 'e.g., Editorial, Architecture, Portraits',
    }),
    
    // --- TECHNICAL PROFILE (General specs for the whole shoot) ---
    defineField({
      name: 'system',
      title: 'Default Camera System',
      type: 'string',
      fieldset: 'technical',
      initialValue: 'SONY A7III',
    }),
    defineField({
      name: 'lens',
      title: 'Default Lens / Gear',
      type: 'string',
      fieldset: 'technical',
      description: 'Primary glass used for this volume.',
    }),
    defineField({
      name: 'iso',
      title: 'Default Film Stock / ISO',
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