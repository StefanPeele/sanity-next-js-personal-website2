import { BasketIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
import { DEFAULT_SERVICES_PAGE } from '@/lib/cms/defaults/servicesPage'
// sanity/schemas/singletons/servicesPage.ts — /services copy and booking-form labels.
// Package prices live in code (lib/pricing.ts) because they are tied to Airtable option names.

const str = (name: string, title = name) => defineField({ name, title, type: 'string' })
const text = (name: string, title = name, rows = 3) => defineField({ name, title, type: 'text', rows })
const obj = (name: string, title: string, fields: ReturnType<typeof defineField>[], extra: Record<string, unknown> = {}) =>
  defineField({ name, title, type: 'object', fields, ...extra })
const strs = (names: string[]) => names.map((n) => str(n))

export default defineType({
  name: 'servicesPage',
  title: 'Services page',
  type: 'document',
  icon: BasketIcon,
  initialValue: DEFAULT_SERVICES_PAGE,
  groups: [
    { name: 'hero', title: 'Hero', default: true },
    { name: 'packages', title: 'Packages' },
    { name: 'sections', title: 'Sections' },
    { name: 'faq', title: 'FAQ' },
    { name: 'booking', title: 'Booking form' },
  ],
  fields: [
    obj('header', 'Header', [text('title', 'Title (line breaks allowed)', 3), text('lede', 'Intro', 2), str('metaTitle', 'SEO title'), text('metaDescription', 'SEO description', 2)], { group: 'hero' }),
    defineField({ name: 'stats', title: 'Stats row', type: 'array', of: [{ type: 'labelValue' }], group: 'hero' }),
    defineField({ name: 'packages', title: 'Packages section', type: 'sectionCopy', group: 'packages' }),
    obj('tabLabels', 'Tab labels', strs(['portrait', 'event', 'specialty']), { group: 'packages' }),
    obj('njitToggle', 'NJIT toggle', [str('label'), str('offText', 'Text when off'), str('idNote', 'ID note'), obj('savingsCopy', 'Savings copy', strs(['portrait', 'event', 'specialty']))], { group: 'packages' }),
    obj('standardDelivery', 'Standard delivery banner', [str('heading'), defineField({ name: 'items', title: 'Items', type: 'array', of: [{ type: 'object', name: 'deliveryItem', fields: [str('title'), str('description')] }] })], { group: 'packages' }),
    obj('packageCard', 'Package card labels', strs(['startingAt', 'njitRate', 'publicLabel', 'deliveryLabel', 'idealFor', 'includes', 'includesNote', 'expandingSoon', 'expandingSoonNote', 'recommended', 'available', 'wip', 'consultLabel', 'inquiryLabel', 'addOnsHeading', 'addOnsLede', 'inquiryHeading', 'inquiryLede', 'inquiryEyebrow']), { group: 'packages' }),
    obj('physicalProducts', 'Physical products section', [
      defineField({ name: 'enabled', title: 'Show', type: 'boolean' }), str('heading'), text('lede', 'Intro', 3),
      defineField({ name: 'tiers', title: 'Tiers', type: 'array', of: [{ type: 'object', name: 'tier', fields: [str('tier', 'Key (core|premium)'), str('label'), text('description', 'Description', 2)] }] }),
      str('includedLabel'), text('note', 'Note', 3), str('noteSub', 'Note subline'),
      obj('chooserLabels', 'Chooser labels', strs(['core', 'premium', 'final'])),
    ], { group: 'sections' }),
    obj('promise', 'Promise section', [
      defineField({ name: 'enabled', title: 'Show', type: 'boolean' }), str('heading'),
      defineField({ name: 'pillars', title: 'Pillars', type: 'array', of: [{ type: 'object', name: 'pillar', fields: [str('label'), text('body', 'Body', 3)] }] }),
      obj('guarantee', 'Guarantee', [str('label'), str('headline'), str('subline')]),
    ], { group: 'sections' }),
    obj('faq', 'FAQ', [defineField({ name: 'enabled', title: 'Show', type: 'boolean' }), str('heading'), defineField({ name: 'items', title: 'Questions', type: 'array', of: [{ type: 'faqItem' }] })], { group: 'faq' }),
    defineField({ name: 'testimonials', title: 'Testimonials section', type: 'sectionCopy', group: 'sections' }),
    obj('booking', 'Booking form', strs(['heading', 'intro', 'successTitle', 'successBody', 'namePlaceholder', 'emailPlaceholder', 'phonePlaceholder', 'packagePlaceholder', 'notSureLabel', 'expandingSoonSuffix', 'expandingSoonNote', 'availabilityPlaceholder', 'njitCheckbox', 'njitNote', 'addOnsLabel', 'selectedLabel', 'messagePlaceholder', 'submitLabel', 'sendingLabel', 'closeLabel', 'triggerLabel', 'packageError', 'genericError']), { group: 'booking' }),
  ],
  preview: { prepare: () => ({ title: 'Services page' }) },
})
