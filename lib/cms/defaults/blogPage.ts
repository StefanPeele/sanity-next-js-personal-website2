// lib/cms/defaults/blogPage.ts — copy and section toggles for /blog.

export const DEFAULT_BLOG_PAGE = {
  header: {
    title: 'Blog',
    lede: 'Perspective pieces, deep dives, and field notes on network engineering, infrastructure, and the work of learning it.',
    metaTitle: 'Blog',
    metaDescription: 'Perspective pieces, concept deep dives, and field notes on network engineering, infrastructure, and the work of learning it.',
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
  },
}

export type BlogPageCopy = typeof DEFAULT_BLOG_PAGE
