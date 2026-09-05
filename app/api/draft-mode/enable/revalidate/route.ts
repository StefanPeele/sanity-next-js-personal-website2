import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'
// app/api/draft-mode/enable/revalidate/route.ts
//
// Sanity calls this endpoint via webhook on every document publish/unpublish.
// It revalidates only the affected paths rather than triggering a full redeploy.
//
// Setup in Sanity:
//   Dashboard → API → Webhooks → Add webhook
//   URL: https://stefanpeele.com/api/draft-mode/enable/revalidate
//   Dataset: production
//   Trigger on: Create, Update, Delete
//   Filter: leave empty (all types) — every type is handled below
//   Secret: <generate a random string, add as SANITY_REVALIDATE_SECRET in Vercel>

type Rule = {
  /** Paths always revalidated for this type. `layout` means the whole site. */
  paths: string[]
  /** Path template using the document slug, e.g. '/blog/:slug'. */
  withSlug?: string
}

const FEEDS = ['/sitemap.xml', '/blog/feed.xml', '/blog/feed.json']
const KNOWLEDGE = ['/garden', '/library', '/glossary', '/paths', '/review', '/blog/series', '/graph']
const PERSONAL = ['/projects', '/resume', '/contact', '/now', '/uses', '/photography', '/photography/albums']

/** Document type → paths. Types missing here fall back to a full layout revalidation. */
const RULES: Record<string, Rule> = {
  // Site singletons (copy that renders in the chrome or on every page)
  settings: { paths: ['layout'] },
  navigation: { paths: ['layout'] },
  taxonomy: { paths: ['layout'] },
  errorPages: { paths: ['layout'] },
  articleUi: { paths: ['layout'] },
  home: { paths: ['/'] },
  blogPage: { paths: ['/blog'] },
  knowledgePages: { paths: KNOWLEDGE },
  personalPages: { paths: PERSONAL },
  servicesPage: { paths: ['/services'] },

  // Content documents
  post: { paths: ['/', '/blog', '/graph', ...FEEDS], withSlug: '/blog/:slug' },
  note: { paths: ['/garden', '/graph', '/sitemap.xml'], withSlug: '/garden/:slug' },
  gallery: { paths: ['/photography', '/photography/albums', '/sitemap.xml'], withSlug: '/photography/:slug' },
  project: { paths: ['/projects', '/sitemap.xml'], withSlug: '/projects/:slug' },
  page: { paths: ['/sitemap.xml'], withSlug: '/:slug' },
  series: { paths: ['/blog', '/blog/series', '/graph', '/sitemap.xml'], withSlug: '/blog/series/:slug' },
  learningPath: { paths: ['/paths', '/graph', '/sitemap.xml'], withSlug: '/paths/:slug' },
  tag: { paths: ['/blog', '/garden', '/graph', '/glossary'] },
  glossaryTerm: { paths: ['/glossary', '/graph', '/blog'] },
  category: { paths: ['/blog', '/photography', '/photography/albums'] },
  mediaItem: { paths: ['/library', '/graph', '/now', '/'] },
  experience: { paths: ['/resume', '/now'] },
  skill: { paths: ['/resume'] },
  certification: { paths: ['/resume', '/now'] },
  education: { paths: ['/resume'] },
  testimonial: { paths: ['/services'] },
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.SANITY_REVALIDATE_SECRET
    if (!secret) {
      return NextResponse.json({ message: 'SANITY_REVALIDATE_SECRET is not set' }, { status: 500 })
    }

    const { isValidSignature, body } = await parseBody<{ _type: string; slug?: { current?: string } }>(req, secret)
    if (!isValidSignature) {
      return NextResponse.json({ message: 'Invalid webhook signature' }, { status: 401 })
    }
    if (!body?._type) {
      return NextResponse.json({ message: 'Bad request — missing _type' }, { status: 400 })
    }

    const { _type, slug } = body
    const rule = RULES[_type]

    if (!rule) {
      revalidatePath('/', 'layout')
      return NextResponse.json({ revalidated: true, paths: ['/ (layout — full revalidation)'], note: `Unknown type: ${_type}` })
    }

    const paths = new Set<string>()
    for (const p of rule.paths) {
      if (p === 'layout') {
        revalidatePath('/', 'layout')
        paths.add('/ (layout)')
      } else {
        revalidatePath(p)
        paths.add(p)
      }
    }
    const current = slug?.current
    if (rule.withSlug && current) {
      const p = rule.withSlug.replace(':slug', current)
      revalidatePath(p)
      paths.add(p)
    }

    return NextResponse.json({ revalidated: true, type: _type, paths: [...paths] })
  } catch (err) {
    console.error('Revalidation error:', err)
    return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
  }
}
