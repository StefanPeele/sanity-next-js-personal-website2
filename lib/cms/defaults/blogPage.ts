// lib/cms/defaults/blogPage.ts — copy and section toggles for /blog.
import type { NavLink } from './navigation'

export const DEFAULT_BLOG_PAGE = {
  header: {
    title: 'Writing',
    lede: 'Perspective pieces, deep dives, and field notes on network engineering, infrastructure, and the work of learning it.',
    metaTitle: 'Writing',
    metaDescription: 'Perspective pieces, concept deep dives, and field notes on network engineering, infrastructure, and the work of learning it.',
  },
  statsLabels: { posts: 'posts', series: 'series', latest: 'Latest' },
  featured: { heading: 'Featured', readLabel: 'Read' },
  directory: {
    enabled: true,
    topicsHeading: 'Topics',
    toolsHeading: 'Explore',
    statsHeading: 'At a glance',
    totalLabel: 'Posts',
    latestLabel: 'Latest',
    seriesLabel: 'Series',
    readLabel: 'Read',
    noTopics: 'No topics yet',
  },
  referenceLinks: [
    { label: 'OSI model reference', kind: 'internal', path: '/blog/osi-model', icon: 'layers' },
    { label: 'Garden', kind: 'internal', path: '/garden', icon: 'sprout' },
    { label: 'Knowledge graph', kind: 'internal', path: '/graph', icon: 'network' },
    { label: 'Library', kind: 'internal', path: '/library', icon: 'library' },
    { label: 'Glossary', kind: 'internal', path: '/glossary', icon: 'type' },
    { label: 'Learning paths', kind: 'internal', path: '/paths', icon: 'route' },
    { label: 'Series', kind: 'internal', path: '/blog/series', icon: 'list-ordered' },
    { label: 'Review deck', kind: 'internal', path: '/review', icon: 'rotate-ccw' },
  ] as NavLink[],
  seriesRail: { enabled: true, heading: 'Series', ctaLabel: 'All series', ctaHref: '/blog/series', lede: '', emptyState: '' },
  readingStrip: { enabled: true, heading: 'Currently reading', ctaLabel: 'Library', ctaHref: '/library', lede: '', emptyState: '' },
  notesStrip: { enabled: true, heading: 'Recently tended notes', ctaLabel: 'Garden', ctaHref: '/garden', lede: '', emptyState: '' },
  list: {
    heading: 'All posts',
    filterLabels: { lane: 'Type', category: 'Topic', tag: 'Tag', sort: 'Sort' },
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
