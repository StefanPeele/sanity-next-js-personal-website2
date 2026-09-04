// lib/cms/defaults/settings.ts — defaults for the new fields on the `settings` singleton
// (Identity & SEO, footer copy, newsletter copy). Existing fields (email, github, …) are
// left to the document; these defaults only cover the fields added by the CMS pass.

export const DEFAULT_SETTINGS = {
  siteName: 'Stefan Peele',
  legalName: 'Stefan Peele II',
  tagline: 'Network engineering, infrastructure, and photography',
  description:
    'Network engineering, infrastructure, and photography from Stefan Peele, an NJIT student, network engineer associate, and photographer in Newark, NJ.',
  keywords: ['network engineering', 'infrastructure', 'NJIT', 'photography', 'Newark NJ', 'Stefan Peele'],
  jobTitle: 'Network Engineer Associate (Intern)',
  knowsAbout: ['Network engineering', 'IT infrastructure', 'Photography'],
  location: { city: 'Newark', region: 'NJ' },
  school: 'New Jersey Institute of Technology',
  bookingEmail: 'bookings@stefanpeele.com',
  openTo: '',
  footer: {
    ctaLabel: 'Get in touch',
    directoryHeading: 'Pages',
    networkHeading: 'Elsewhere',
    networkLabels: {
      email: 'Email',
      github: 'GitHub',
      linkedin: 'LinkedIn',
      gitbook: 'Documentation',
      instagram: 'Instagram',
      bluesky: 'Bluesky',
      trello: 'Project board',
      rss: 'RSS feed',
    },
    copyrightNote: 'Network engineer associate and photographer in Newark, NJ.',
  },
  newsletter: {
    heading: 'New writing, straight to your inbox.',
    blurb: 'Network engineering deep dives, field notes and the occasional photo essay. A few emails a month, never more.',
    placeholder: 'you@example.com',
    buttonLabel: 'Subscribe',
    successMessage: 'Check your inbox to confirm.',
    hint: 'Double opt-in. Unsubscribe with one click.',
  },
}

export type SettingsCopy = typeof DEFAULT_SETTINGS
