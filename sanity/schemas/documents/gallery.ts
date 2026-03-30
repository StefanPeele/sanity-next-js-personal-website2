import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'gallery',
  title: 'Photography Gallery',
  type: 'document',
  // --- NEW: Define a fieldset with a 2-column grid layout ---
  fieldsets: [
    {
      name: 'technical',
      title: 'Technical Profile',
      options: {
        columns: 2, // Forces fields in this set to sit side-by-side
        collapsible: true, // Lets you collapse the whole section if you don't need it
        collapsed: false,
      },
    },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The name of this photo or shoot.',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'text',
      description: 'A quick description of the photo, equipment used, etc.',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'e.g., Portraits, Events, Landscapes',
    }),
    
    // --- ASSIGN TECHNICAL FIELDS TO THE FIELDSET ---
    defineField({
      name: 'aperture',
      title: 'Aperture',
      type: 'string',
      fieldset: 'technical',
      description: 'e.g., f/1.4',
    }),
    defineField({
      name: 'shutter',
      title: 'Shutter Speed',
      type: 'string',
      fieldset: 'technical',
      description: 'e.g., 1/250s',
    }),
    defineField({
      name: 'iso',
      title: 'Film Stock / ISO',
      type: 'string',
      fieldset: 'technical',
      description: 'e.g., ISO 100 or Portra 400',
    }),
    defineField({
      name: 'system',
      title: 'Camera System',
      type: 'string',
      fieldset: 'technical',
      description: 'e.g., SONY A7III',
    }),
    defineField({
      name: 'lens',
      title: 'Lens / Gear',
      type: 'string',
      fieldset: 'technical',
      description: 'e.g., 35mm f/1.4 GM',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      fieldset: 'technical',
      description: 'e.g., Tokyo, Japan',
    }),
    // Notes stays outside the columns since it's a wider text box
    defineField({
      name: 'notes',
      title: 'Extra Notes / Conditions',
      type: 'text',
      fieldset: 'technical',
      description: 'Any extra details, lighting conditions, or thoughts.',
    }),
  ],
})