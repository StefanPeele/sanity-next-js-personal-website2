import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'gallery',
  title: 'Photography Gallery',
  type: 'document',
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
        hotspot: true, // This lets you crop the image right inside the Studio!
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
  ],
})