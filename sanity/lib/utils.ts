import {dataset, projectId} from '@/sanity/lib/api'
import {createImageUrlBuilder} from '@sanity/image-url'
import type {Image} from 'sanity'

const imageBuilder = createImageUrlBuilder({
  projectId: projectId || '',
  dataset: dataset || '',
})

export const urlForImage = (source: Image | null | undefined) => {
  // Ensure that source image contains a valid reference
  if (!source?.asset?._ref) {
    return undefined
  }

  return imageBuilder?.image(source).auto('format').fit('max')
}

export function urlForOpenGraphImage(image: Image | null | undefined) {
  return urlForImage(image)?.width(1200).height(627).fit('crop').url()
}

export function resolveHref(documentType?: string, slug?: string | null): string | undefined {
  switch (documentType) {
    case 'home':
      return '/'
    case 'page':
      return slug ? `/${slug}` : undefined
    case 'project':
      return slug ? `/projects/${slug}` : undefined
    case 'post':
      return slug ? `/blog/${slug}` : undefined
    case 'note':
      return slug ? `/garden/${slug}` : undefined
    case 'gallery':
      return slug ? `/photography/${slug}` : undefined
    case 'series':
      return slug ? `/blog/series/${slug}` : undefined
    case 'glossaryTerm':
      return slug ? `/glossary#${slug}` : '/glossary'
    case 'blogPage': return '/blog'
    case 'servicesPage': return '/services'
    case 'personalPages': return '/projects'
    case 'knowledgePages': return '/garden'
    case 'articleUi': return '/blog'
    case 'errorPages': return '/this-page-does-not-exist'
    default:
      return undefined
  }
}
