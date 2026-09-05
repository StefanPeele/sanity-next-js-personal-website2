/**
 * Sets up the Presentation Resolver API,
 * see https://www.sanity.io/docs/presentation-resolver-api for more information.
 */

import {resolveHref} from '@/sanity/lib/utils'
import {defineDocuments, defineLocations} from 'sanity/presentation'

export const mainDocuments = defineDocuments([
  { route: '/blog/:slug', filter: `_type == "post" && slug.current == $slug` },
  { route: '/garden/:slug', filter: `_type == "note" && slug.current == $slug` },
  { route: '/photography/:slug', filter: `_type == "gallery" && slug.current == $slug` },
  { route: '/blog/series/:slug', filter: `_type == "series" && slug.current == $slug` },
  { route: '/paths/:slug', filter: `_type == "learningPath" && slug.current == $slug` },
  {
    route: '/projects/:slug',
    filter: `_type == "project" && slug.current == $slug`,
  },
  {
    route: '/:slug',
    filter: `_type == "page" && slug.current == $slug`,
  },
])

export const locations = {
  post: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({ locations: [{ title: doc?.title || 'Untitled', href: resolveHref('post', doc?.slug)! }] }),
  }),
  note: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({ locations: [{ title: doc?.title || 'Untitled', href: resolveHref('note', doc?.slug)! }] }),
  }),
  gallery: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({ locations: [{ title: doc?.title || 'Untitled', href: resolveHref('gallery', doc?.slug)! }] }),
  }),
  series: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({ locations: [{ title: doc?.title || 'Untitled', href: resolveHref('series', doc?.slug)! }] }),
  }),
  learningPath: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({ locations: [{ title: doc?.title || 'Untitled', href: resolveHref('learningPath', doc?.slug)! }] }),
  }),
  blogPage: defineLocations({ message: 'Edits here change the Writing page', tone: 'positive', locations: [{ title: 'Writing', href: resolveHref('blogPage')! }] }),
  gardenPage: defineLocations({ message: 'Edits here change the Garden page', tone: 'positive', locations: [{ title: 'Garden', href: resolveHref('gardenPage')! }] }),
  libraryPage: defineLocations({ message: 'Edits here change the Library page', tone: 'positive', locations: [{ title: 'Library', href: resolveHref('libraryPage')! }] }),
  projectsPage: defineLocations({ message: 'Edits here change the Projects page', tone: 'positive', locations: [{ title: 'Projects', href: resolveHref('projectsPage')! }] }),
  resumePage: defineLocations({ message: 'Edits here change the Resume page', tone: 'positive', locations: [{ title: 'Resume', href: resolveHref('resumePage')! }] }),
  contactPage: defineLocations({ message: 'Edits here change the Contact page', tone: 'positive', locations: [{ title: 'Contact', href: resolveHref('contactPage')! }] }),
  nowPage: defineLocations({ message: 'Edits here change the Now page', tone: 'positive', locations: [{ title: 'Now', href: resolveHref('nowPage')! }] }),
  usesPage: defineLocations({ message: 'Edits here change the Uses page', tone: 'positive', locations: [{ title: 'Uses', href: resolveHref('usesPage')! }] }),
  photographyPage: defineLocations({ message: 'Edits here change the Photography page', tone: 'positive', locations: [{ title: 'Photography', href: resolveHref('photographyPage')! }] }),
  servicesPage: defineLocations({ message: 'Edits here change the Services page', tone: 'positive', locations: [{ title: 'Services', href: resolveHref('servicesPage')! }] }),
  navigation: defineLocations({ message: 'Used in the header, footer and search on every page', tone: 'caution' }),
  taxonomy: defineLocations({ message: 'Labels used across the whole site', tone: 'caution' }),
  articleUi: defineLocations({ message: 'Used on every article page', tone: 'caution' }),
  knowledgePages: defineLocations({ message: 'Glossary, learning paths, review, series and graph pages', tone: 'caution' }),
  errorPages: defineLocations({ message: 'Shown on 404 and error pages', tone: 'caution' }),
  settings: defineLocations({
    message: 'This document is used on all pages',
    tone: 'caution',
  }),
  home: defineLocations({
    message: 'This document is used to render the front page',
    tone: 'positive',
    locations: [{title: 'Home', href: resolveHref('home')!}],
  }),
  project: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({
      locations: [
        {
          title: doc?.title || 'Untitled',
          href: resolveHref('project', doc?.slug)!,
        },
      ],
    }),
  }),
  page: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) => ({
      locations: [
        {
          title: doc?.title || 'Untitled',
          href: resolveHref('page', doc?.slug)!,
        },
      ],
    }),
  }),
}
