// lib/cms/defaults/errorPages.ts

export const DEFAULT_ERROR_PAGES = {
  notFound: {
    title: 'Page not found',
    body: 'That page does not exist, or it moved.',
    hint: 'Check the address, or start from one of these.',
    primaryCta: { label: 'Home', kind: 'internal', path: '/' },
    links: [
      { label: 'Writing', kind: 'internal', path: '/blog' },
      { label: 'Projects', kind: 'internal', path: '/projects' },
    ],
  },
  error: {
    title: 'Something went wrong',
    body: 'The page hit an error while rendering.',
    retryLabel: 'Try again',
    homeLabel: 'Home',
    referenceLabel: 'Reference',
  },
  offline: {
    title: 'You are offline',
    body: 'This article is not saved on this device yet. The last articles you opened are kept for offline reading.',
  },
}

export type ErrorPagesCopy = typeof DEFAULT_ERROR_PAGES
