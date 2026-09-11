// lib/cms/defaults/blogPage.ts — copy and section toggles for /blog.

export const DEFAULT_BLOG_PAGE = {
  header: {
    title: 'Blog',
    lede: 'Perspective pieces, deep dives, and lab notes on network engineering, infrastructure, and the work of learning it.',
    metaTitle: 'Blog',
    metaDescription: 'Perspective pieces, concept deep dives, and lab notes on network engineering, infrastructure, and the work of learning it.',
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
