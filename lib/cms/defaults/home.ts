// lib/cms/defaults/home.ts — section copy + order for the homepage.
// The `home` document keeps its content fields (title, overview, profileImage, …);
// `sections` controls which blocks render, in what order, with what labels.

export type HomeSection =
  | { _type: 'homeHero'; enabled: boolean; showNav: boolean; currentlyLabel: string; locationLabel: string; footnote: string }
  | { _type: 'homeOpenTo'; enabled: boolean; ctaLabel: string }
  | { _type: 'homeAbout'; enabled: boolean; heading: string; fallbackManifesto: string; fallbackBio: string; imagePlaceholder: string }
  | { _type: 'homeShowcase'; enabled: boolean; heading: string; ctaLabel: string; limit: number }
  | { _type: 'homeWriting'; enabled: boolean; heading: string; featuredBadge: string; recentHeading: string; readLabel: string; limit: number }
  | { _type: 'homeReading'; enabled: boolean; heading: string; ctaLabel: string }
  | { _type: 'homeNotes'; enabled: boolean; heading: string; ctaLabel: string }

export type HomeSectionType = HomeSection['_type']

export const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { _type: 'homeHero', enabled: true, showNav: true, currentlyLabel: 'Currently', locationLabel: 'Location', footnote: '' },
  { _type: 'homeOpenTo', enabled: true, ctaLabel: 'Contact' },
  { _type: 'homeAbout', enabled: true, heading: 'About', fallbackManifesto: 'Logic in infrastructure.\nIntent in imagery.', fallbackBio: 'I study IT security at NJIT and work as a network engineer associate intern at a fabrication company in New Jersey: SAN storage, Active Directory, PowerShell automation and backup. On weekends I photograph sports, portraits and events.\n\nBoth jobs are the same discipline: understand the system, remove what does not belong, and make the result legible to the next person.', imagePlaceholder: 'Add a profile image in the Studio' },
  { _type: 'homeShowcase', enabled: true, heading: 'Selected work', ctaLabel: 'All projects', limit: 3 },
  { _type: 'homeWriting', enabled: true, heading: 'Latest writing', featuredBadge: 'Featured', recentHeading: 'Recent posts', readLabel: 'Read', limit: 3 },
  { _type: 'homeReading', enabled: true, heading: 'Currently reading', ctaLabel: 'Library' },
  { _type: 'homeNotes', enabled: true, heading: 'Recently tended', ctaLabel: 'Garden' },
]

export const DEFAULT_HOME = { sections: DEFAULT_HOME_SECTIONS }
export type HomeCopy = typeof DEFAULT_HOME
