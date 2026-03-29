import { TagIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'skill',
  title: 'Technical Skill',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Skill Name',
      type: 'string',
      description: 'e.g., OSPF Routing or Cisco IOS',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: ['Infrastructure', 'Systems', 'Programming', 'Tools']
      }
    }),
    defineField({
      name: 'description',
      title: 'Detailed Intel (Toggle Content)',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'The detailed explanation that appears when the user expands the toggle.',
    }),
  ],
})