// lib/cms/defaults/servicesPage.ts — every word on /services and the booking form.
// Package prices stay in lib/pricing.ts (they are coupled to the Airtable CRM).

export const DEFAULT_SERVICES_PAGE = {
  header: {
    title: 'Every moment\nworth capturing,\ncaptured right.',
    lede: "Book a free consultation. We'll build your session around what you want to keep.",
    metaTitle: 'Photography services',
    metaDescription: 'Consultation-first photography for NJIT affiliates, professionals, and organizations in Newark, NJ. Every session includes edited JPEGs, print-ready TIFFs, a social media pack, and a physical product.',
  },
  stats: [
    { label: 'Free consultation', value: 'Always', valueSource: 'static' },
    { label: 'Standard turnaround', value: '48 hrs', valueSource: 'static' },
    { label: 'Starting at (NJIT)', value: '', valueSource: 'lowestNjit' },
    { label: 'Portrait sessions from', value: '', valueSource: 'portraitFrom' },
  ] as { label: string; value: string; valueSource: 'static' | 'lowestNjit' | 'portraitFrom' }[],
  packages: { enabled: true, heading: 'Packages', lede: 'Every package starts with a free consultation. We build your session around what you want, then lock in the details.', ctaLabel: '', ctaHref: '', emptyState: '' },
  tabLabels: { portrait: 'Portrait', event: 'Event', specialty: 'Specialty' },
  njitToggle: {
    label: 'NJIT student or affiliate?',
    offText: 'Turn on to see discounted rates for students, faculty and organizations',
    idNote: 'NJIT ID required at booking',
    savingsCopy: { portrait: 'Save $70 to $100 on portrait sessions', event: 'Save $75 to $200 or more on event packages', specialty: 'Discounted rates on specialty sessions' },
  },
  standardDelivery: {
    heading: 'Every session includes',
    items: [
      { title: 'Edited JPEGs', description: 'Full gallery, color-graded, high-res, print-ready via Pixieset' },
      { title: 'Print-ready TIFFs', description: '5 hero shots at full native resolution, labeled for professional printing' },
      { title: 'Social media pack', description: '5 to 8 images in Instagram, Stories, and LinkedIn formats, ready to post' },
    ],
  },
  physicalProducts: {
    enabled: true, heading: "What you'll own", lede: "Every session includes a physical product: something you can hold, hang, or keep on a shelf. A digital gallery lives on your phone. A physical product lives in your home for decades. We'll find the right one during your consultation.", ctaLabel: '', ctaHref: '', emptyState: '',
    tiers: [
      { tier: 'core', label: 'Core', description: 'Choose from framed prints, matted print sets, softcover photobooks, linen print boxes, and more.' },
      { tier: 'premium', label: 'Premium', description: 'Choose from hardcover lay-flat photobooks, large archival framed prints, acrylic blocks, metal prints, leather portfolios, fine art cotton rag prints, backlit LED panels, and more.' },
    ],
    includedLabel: 'included',
    note: "Every session can be extended into something physical: photo books, framed prints, matted portfolios, acrylic panels, engraved wood blocks, and more. We'll talk about what makes sense for you during your consultation.",
    noteSub: 'Pricing discussed during consultation · No hidden costs',
    chooserLabels: { core: 'Choose your physical product', premium: 'Choose your premium keepsake', final: 'Final selection confirmed during consultation' },
  },
  promise: {
    enabled: true, heading: 'The promise', lede: '', ctaLabel: '', ctaHref: '', emptyState: '',
    pillars: [
      { label: 'Time and presence', body: 'I arrive early, stay alert, and remain unobtrusive. Every package includes coverage time, travel, setup, and post-session buffer. You get what you paid for, and usually more.' },
      { label: 'Professional gear', body: 'Two camera bodies, full backup kit, dual-card recording. Technical failure is planned for. Your coverage is never at risk.' },
      { label: 'Three-part delivery', body: 'Every session delivers edited JPEGs, print-ready TIFFs, and a social media pack as standard. Not as add-ons. Not tiered. Every client, every time.' },
    ],
    guarantee: { label: 'Guarantee', headline: 'Satisfaction guaranteed, or I make it right. No questions asked.', subline: 'No ghosting · No excuses · Just communication and solutions' },
  },
  faq: {
    enabled: true, heading: 'Common questions', lede: '', ctaLabel: '', ctaHref: '', emptyState: '',
    items: [
      { question: 'What happens after I schedule a consultation?', answer: "We get on a 20 to 30 minute Zoom call. I'll ask you five questions: what's the occasion, where do you picture these photos living, if you have a style reference, who's coming with you, and what matters most to you about the session. From there I'll walk you through the direction, present two options, and we'll book. No pressure, no sales pitch, just figuring out what makes sense for you." },
      { question: "Why consultation first? Why can't I just book directly?", answer: "Because a package you picked from a menu without talking to me is a package built for someone else. The consultation is how I make sure the session is built around what you actually want: the photos you'll use, the product you'll keep, the experience that matches the moment. It takes 20 minutes and it protects both of us from mismatched expectations." },
      { question: "What's included in the three-part delivery?", answer: "Every session, regardless of package, delivers three things. First, your full gallery of edited JPEGs via Pixieset: high-resolution, color-graded, ready to download and print. Second, your 5 hero shots exported as print-ready TIFFs at full native resolution, labeled for professional printing. Third, a social media pack: 5 to 8 images pre-formatted for Instagram feed, Stories, and LinkedIn, delivered in a separate folder labeled 'Ready to Post.' This is my standard, not an add-on." },
      { question: 'What physical product do I get?', answer: 'Core clients choose one from a menu of accessible products: framed prints, matted print sets, softcover photobooks, linen print boxes, and more. Premium clients choose from a premium keepsake menu: hardcover lay-flat photobooks, large archival framed prints, acrylic print blocks, metal prints, leather portfolios, fine art cotton rag prints, backlit LED panels, and others. We go through the options during the consultation so you can choose based on where you picture the photos living.' },
      { question: 'How quickly will I get my photos?', answer: "Standard turnaround is 48 hours from the day of the shoot. You'll receive a sneak peek to your phone within 24 hours. If you need everything faster, rush delivery is available for $40 and moves your full gallery to same-day or next-morning delivery." },
      { question: 'How do I qualify for the NJIT rate?', answer: "Current NJIT students, faculty, staff, and registered student organizations all qualify. NJIT ID verification is required at booking. If you're not sure whether your organization qualifies, just ask during the consultation. I'm reasonable about it." },
      { question: "What if I'm not satisfied with the results?", answer: "I make it right. If there's a technical failure on my end, a missed key moment, or a delivery issue I caused, I'll own it directly and offer a reshoot, partial refund, or alternate solution. No ghosting, no excuses. If something outside my control disrupts the shoot, such as weather, venue restrictions or last-minute changes, I'll communicate immediately and we'll figure it out together." },
      { question: 'Can I add time or make changes on the day?', answer: "Additional time is $75/hr and needs to be discussed before the shoot, not the morning of. I block my schedule around confirmed sessions. If you think you might need more time, flag it during the consultation and we'll plan for it upfront." },
    ],
  },
  testimonials: { enabled: true, heading: 'What clients said', lede: '', ctaLabel: '', ctaHref: '', emptyState: '' },
  packageCard: {
    startingAt: 'Starting at', njitRate: 'NJIT rate', publicLabel: 'Public', deliveryLabel: 'Delivery', idealFor: 'Ideal for', includes: 'Includes',
    includesNote: 'Full three-part delivery + physical product of your choice', expandingSoon: 'Expanding soon', expandingSoonNote: 'Expanding soon. Ask about it.',
    recommended: 'Recommended', available: 'Available', wip: 'In development',
    consultLabel: 'Schedule a consultation', inquiryLabel: 'Send inquiry',
    addOnsHeading: 'Add-ons', addOnsLede: 'Available for any package',
    inquiryHeading: 'Not sure where to start?', inquiryLede: "Send me a message and I'll follow up within 24 hours. No commitment required.", inquiryEyebrow: 'Questions?',
  },
  booking: {
    heading: "Let's capture something worth keeping.",
    intro: "I'll follow up within 24 hours to confirm availability and next steps.",
    successTitle: 'Inquiry sent',
    successBody: "Check your email. I've sent a confirmation and next steps, and I'll follow up within 24 hours.",
    namePlaceholder: 'Name', emailPlaceholder: 'Email address', phonePlaceholder: 'Phone (optional)',
    packagePlaceholder: 'Select a package', notSureLabel: 'Not sure yet. I have questions', expandingSoonSuffix: 'expanding soon',
    expandingSoonNote: "This tier is expanding soon. Send the inquiry and I'll tell you what's available.",
    availabilityPlaceholder: 'When works for a 20 to 30 minute call? (e.g. weekday evenings, Saturday mornings)',
    njitCheckbox: "I'm an NJIT student, faculty, or affiliate", njitNote: '(NJIT ID required at booking)',
    addOnsLabel: 'Add-ons', selectedLabel: '{n} selected',
    messagePlaceholder: 'Tell me about the occasion. What do you want to walk away with?',
    submitLabel: 'Send inquiry', sendingLabel: 'Sending…', closeLabel: 'Close', triggerLabel: 'Send inquiry',
    packageError: 'Please choose a package (or "Not sure yet").', genericError: 'Something went wrong.',
  },
}

export type ServicesPageCopy = typeof DEFAULT_SERVICES_PAGE
