// lib/cms/defaults/blogPage.ts — copy and section toggles for /blog.

export const DEFAULT_BLOG_PAGE = {
  header: {
    title: 'Blog',
    lede: "A beat on network engineering and the infrastructure industry, written by someone still learning it. I cover it the way I wish someone had covered it for me, including the service providers and MSPs operating here in New Jersey.",
    metaTitle: 'Blog',
    metaDescription: "Network engineering and the infrastructure industry, including the service providers and MSPs operating here in New Jersey.",
  },
  // 2.3. One line under the lede, not a tooltip and not a panel.
  //
  // A tooltip hides the invitation behind a hover, which on touch does not exist at all, and
  // an invitation to critique is the least appropriate thing on the page to gate behind a
  // hover. A panel is louder than one sentence deserves and would compete with the featured
  // post directly below it. The fold has the room: 9 links above it against a reference
  // median of 26, the emptiest of thirteen measured pages.
  //
  // The second sentence is the part most sites omit and the part that matters. It tells the
  // reader what HAPPENS to their correction, which is a promise the corrections system in
  // Phase 3B already keeps.
  critiqueInvite: {
    enabled: true,
    text: 'Corrections and disagreements are welcome. Anything that changes a post gets credited on it.',
    email: 'swp9@njit.edu',
    emailLabel: 'Email me',
  },
  statsLabels: { posts: 'posts', series: 'series', latest: 'Latest' },
  featured: { heading: 'Featured', readLabel: 'Read' },
  seriesRail: { enabled: true, heading: 'Series', ctaLabel: 'All series', ctaHref: '/blog/series' },
  readingStrip: { enabled: true, heading: 'Currently reading', ctaLabel: 'Library', ctaHref: '/library' },
  notesStrip: { enabled: true, heading: 'Recently tended notes', ctaLabel: 'Garden', ctaHref: '/garden' },
  list: {
    heading: 'All posts',
    // `status` (3.5) is the epistemic filter. Its row only renders when at least one post
    // actually carries a status, so it stays invisible until the vocabulary is in use.
    filterLabels: { lane: 'Type', category: 'Topic', tag: 'Tag', sort: 'Sort', status: 'Checked' },
    sortLabels: { newest: 'Newest', oldest: 'Oldest', longest: 'Longest' },
    allLabel: 'All',
    readLabel: 'Read',
    readAgainLabel: 'Read again',
    emptyState: 'No posts match these filters yet.',
    clearLabel: 'Clear filters',
    postCount: '{n} posts',
    // 4.1 / 4.4 / 4.5. The lane chip row is gone -- the sections are the lanes -- so
    // `filterLabels.lane` is now only used for the active-filter heading.
    findLabel: 'Find a post',
    findPlaceholder: 'Find a post',
    filtersLabel: 'Filters',
    seeAllLabel: 'All {n} →',
    riverHeading: 'Everything else',
  },
  // 4.2. Placeholder cards for posts that are planned but not written. `items` is EMPTY by
  // default on purpose -- shipping invented post titles would be fake content on a site
  // whose whole subject is not doing that. Add real planned topics in Studio and they
  // appear; delete an entry when the post lands and it disappears. That is the "trivially
  // removable" requirement, and it needs no code change.
  planned: {
    enabled: true,
    heading: 'Planned',
    note: 'Written up next. These are the gaps I already know about.',
    label: 'Not written yet',
    treatment: 'dark' as 'dark' | 'glass',
    items: [] as Array<{ _key?: string; topic: string; lane?: string | null }>,
  },
}

export type BlogPageCopy = typeof DEFAULT_BLOG_PAGE
