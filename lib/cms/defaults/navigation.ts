// lib/cms/defaults/navigation.ts — defaults for the `navigation` singleton.
// Used as Studio initialValue AND as runtime fallback. Plain words, no jargon.

export type NavLink = {
  label: string
  kind: 'internal' | 'external' | 'reference'
  path?: string
  url?: string
  description?: string
  icon?: string
  newTab?: boolean
}

export const DEFAULT_NAVIGATION = {
  logoText: 'S.P.',
  drawerFooterLine: 'Stefan Peele · Newark, NJ',
  primary: [
    { label: 'Projects', kind: 'internal', path: '/projects', description: 'Case studies and infrastructure work' },
    { label: 'Writing', kind: 'internal', path: '/blog', description: 'Essays, deep dives, field notes' },
    { label: 'Garden', kind: 'internal', path: '/garden', description: 'Notes in progress' },
    { label: 'Library', kind: 'internal', path: '/library', description: 'What I read' },
    { label: 'Photography', kind: 'internal', path: '/photography', description: 'Galleries' },
    { label: 'Resume', kind: 'internal', path: '/resume', description: 'Experience and skills' },
  ] as NavLink[],
  secondary: [
    { label: 'Knowledge graph', kind: 'internal', path: '/graph' },
    { label: 'Services', kind: 'internal', path: '/services' },
    { label: 'Contact', kind: 'internal', path: '/contact' },
    { label: 'Now', kind: 'internal', path: '/now' },
    { label: 'Uses', kind: 'internal', path: '/uses' },
    { label: 'OSI model reference', kind: 'internal', path: '/blog/osi-model' },
  ] as NavLink[],
  searchQuickLinks: [
    { label: 'Garden', kind: 'internal', path: '/garden', description: 'Notes in progress', icon: 'sprout' },
    { label: 'Knowledge graph', kind: 'internal', path: '/graph', description: 'How everything connects', icon: 'network' },
    { label: 'Library', kind: 'internal', path: '/library', description: 'What I read', icon: 'library' },
    { label: 'Glossary', kind: 'internal', path: '/glossary', description: 'Terms, defined', icon: 'type' },
    { label: 'OSI model reference', kind: 'internal', path: '/blog/osi-model', description: 'Interactive reference', icon: 'layers' },
  ] as NavLink[],
}

export type NavigationData = typeof DEFAULT_NAVIGATION

/** Resolve a link to an href. Reference links are resolved server-side in GROQ into `path`. */
export function navHref(link: NavLink): string {
  if (link.kind === 'external' && link.url) return link.url
  return link.path || '/'
}
