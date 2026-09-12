import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'
import { client } from '@/sanity/lib/client'
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
  /**
   * Phase 8. The document has no slug of its own and lives under a POST -- resolve the
   * post's slug from `post._ref` and revalidate the article. A comment is the first
   * document type on this site whose page cannot be derived from its own fields.
   */
  viaPostRef?: boolean
}

const FEEDS = ['/sitemap.xml', '/blog/feed.xml', '/blog/feed.json']
const KNOWLEDGE = ['/garden', '/library', '/glossary', '/blog/series', '/graph']
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
  tag: { paths: ['/blog', '/garden', '/graph', '/glossary'] },
  glossaryTerm: { paths: ['/glossary', '/graph', '/blog'] },
  category: { paths: ['/blog', '/photography', '/photography/albums'] },
  mediaItem: { paths: ['/library', '/graph', '/now', '/'] },
  experience: { paths: ['/resume', '/now'] },
  skill: { paths: ['/resume'] },
  certification: { paths: ['/resume', '/now'] },
  education: { paths: ['/resume'] },
  testimonial: { paths: ['/services'] },

  // Phase 8. Moderating a comment in the Studio has to reach the article, and nothing
  // else does it: the reader-facing paths revalidate themselves (the server action and the
  // confirm route both call revalidatePath), but a removal happens in the Studio and only
  // this webhook sees it.
  comment: { paths: ['/blog'], viaPostRef: true },

  // EMPTY ON PURPOSE, and this is the entry that matters most in this block.
  //
  // Types missing from RULES fall through to a full-site layout revalidation. A rateBucket
  // is written on EVERY comment attempt, including every refused one, so without this line
  // a spam wave would revalidate the entire site once per attempt -- the cheapest possible
  // denial of service, self-inflicted, through the anti-spam machinery. Neither of these
  // documents renders anywhere.
  rateBucket: { paths: [] },
  blocklist: { paths: [] },
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.SANITY_REVALIDATE_SECRET
    if (!secret) {
      return NextResponse.json({ message: 'SANITY_REVALIDATE_SECRET is not set' }, { status: 500 })
    }

    const { isValidSignature, body } = await parseBody<{
      _type: string
      slug?: { current?: string }
      post?: { _ref?: string }
    }>(req, secret)
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

    if (rule.viaPostRef) {
      const ref = body.post?._ref
      const postSlug = ref
        ? await client.fetch<string | null>(
            `*[_id == $id][0].slug.current`,
            { id: ref },
            { perspective: 'published', useCdn: false },
          )
        : null

      if (postSlug) {
        revalidatePath(`/blog/${postSlug}`)
        paths.add(`/blog/${postSlug}`)
      } else {
        // A DELETE carries no document body, so there is no post._ref to resolve -- and
        // without this branch, deleting a comment left it on the article for ever.
        //
        // Proven in production: a comment created directly in Sanity appeared on the live
        // page in 7 SECONDS, and deleting it did not remove it after 10 minutes, two page
        // requests per 15s, and a fresh deployment. Vercel's Data Cache survives deploys, so
        // only a revalidation clears it, and the revalidation never fired.
        //
        // Revalidating the dynamic route rebuilds every article rather than one. That is the
        // right trade: there is no way to know WHICH article a deleted comment belonged to,
        // and comment deletions are rare -- the designed removal path sets `status` instead,
        // which does carry the body and takes the branch above.
        revalidatePath('/blog/[slug]', 'page')
        paths.add('/blog/[slug] (every article — the payload named no post)')
      }
    }

    return NextResponse.json({ revalidated: true, type: _type, paths: [...paths] })
  } catch (err) {
    console.error('Revalidation error:', err)
    return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
  }
}
