import { MenuIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
import { DEFAULT_NAVIGATION } from '@/lib/cms/defaults/navigation'
import { navLinksField } from '@/sanity/schemas/objects/site'
// sanity/schemas/singletons/navigation.ts

export default defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  icon: MenuIcon,
  initialValue: DEFAULT_NAVIGATION,
  fields: [
    defineField({ name: 'logoText', title: 'Logo text', type: 'string' }),
    navLinksField('primary', 'Main menu', 'Header links, in order. Drag to reorder.'),
    navLinksField('secondary', 'Secondary links', 'Shown in the footer and the mobile menu.'),
    navLinksField('searchQuickLinks', 'Search quick links', 'Shown in the search box before you type.'),
    defineField({ name: 'drawerFooterLine', title: 'Mobile menu footer line', type: 'string' }),
  ],
  preview: { prepare: () => ({ title: 'Navigation' }) },
})
