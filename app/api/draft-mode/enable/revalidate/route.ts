import { revalidatePath, revalidateTag } from 'next/cache'
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

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.SANITY_REVALIDATE_SECRET

    // Validate the webhook secret
    if (!secret) {
      return NextResponse.json(
        { message: 'SANITY_REVALIDATE_SECRET is not set' },
        { status: 500 }
      )
    }

    const { isValidSignature, body } = await parseBody<{
      _type: string
      slug?: { current?: string }
    }>(req, secret)

    if (!isValidSignature) {
      return NextResponse.json(
        { message: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    if (!body?._type) {
      return NextResponse.json(
        { message: 'Bad request — missing _type' },
        { status: 400 }
      )
    }

    const { _type, slug } = body

    // Revalidate based on document type
    switch (_type) {
      case 'post': {
        const postSlug = slug?.current

        // Always revalidate the blog listing page
        revalidatePath('/blog')

        if (postSlug) {
          // Revalidate the specific post page
          revalidatePath(`/blog/${postSlug}`)
        }

        // Revalidate the sitemap and RSS feed
        revalidatePath('/')
        revalidatePath('/graph')
        revalidatePath('/sitemap.xml')
        revalidatePath('/blog/feed.xml')
        revalidatePath('/blog/feed.json')

        return NextResponse.json({
          revalidated: true,
          paths: postSlug
            ? ['/', '/blog', `/blog/${postSlug}`, '/graph', '/sitemap.xml', '/blog/feed.xml']
            : ['/', '/blog', '/graph', '/sitemap.xml', '/blog/feed.xml'],
        })
      }

      case 'settings': {
        // Settings change affects every page (navbar, footer)
        revalidatePath('/', 'layout')
        return NextResponse.json({
          revalidated: true,
          paths: ['/ (layout)'],
        })
      }

      case 'home': {
        revalidatePath('/')
        return NextResponse.json({
          revalidated: true,
          paths: ['/'],
        })
      }

      case 'gallery': {
        const gallerySlug = slug?.current
        revalidatePath('/photography')
        if (gallerySlug) revalidatePath(`/photography/${gallerySlug}`)
        revalidatePath('/sitemap.xml')
        return NextResponse.json({
          revalidated: true,
          paths: gallerySlug
            ? ['/photography', `/photography/${gallerySlug}`, '/sitemap.xml']
            : ['/photography', '/sitemap.xml'],
        })
      }

      case 'project': {
        const projectSlug = slug?.current
        revalidatePath('/projects')
        if (projectSlug) revalidatePath(`/projects/${projectSlug}`)
        return NextResponse.json({
          revalidated: true,
          paths: projectSlug
            ? ['/projects', `/projects/${projectSlug}`]
            : ['/projects'],
        })
      }

      case 'note': {
        const noteSlug = slug?.current
        revalidatePath('/garden')
        if (noteSlug) revalidatePath(`/garden/${noteSlug}`)
        revalidatePath('/graph')
        revalidatePath('/sitemap.xml')
        return NextResponse.json({ revalidated: true, paths: ['/garden', '/graph', '/sitemap.xml'] })
      }

      case 'tag':
      case 'series':
      case 'glossaryTerm':
      case 'learningPath': {
        revalidatePath('/blog')
        revalidatePath('/garden')
        revalidatePath('/graph')
        revalidatePath('/glossary')
        revalidatePath('/paths', 'layout')
        revalidatePath('/sitemap.xml')
        return NextResponse.json({ revalidated: true, paths: ['/blog', '/garden', '/graph', '/glossary', '/paths', '/sitemap.xml'] })
      }

      case 'mediaItem': {
        revalidatePath('/library')
        revalidatePath('/graph')
        revalidatePath('/now')
        return NextResponse.json({ revalidated: true, paths: ['/library', '/graph', '/now'] })
      }

      case 'experience':
      case 'skill':
      case 'certification':
      case 'education': {
        revalidatePath('/resume')
        revalidatePath('/now')
        return NextResponse.json({ revalidated: true, paths: ['/resume', '/now'] })
      }

      case 'testimonial': {
        revalidatePath('/services')
        return NextResponse.json({ revalidated: true, paths: ['/services'] })
      }

      default: {
        revalidatePath('/', 'layout')
        return NextResponse.json({
          revalidated: true,
          paths: ['/ (layout — full revalidation)'],
          note: `Unknown type: ${_type}`,
        })
      }
    }
  } catch (err) {
    console.error('Revalidation error:', err)
    return NextResponse.json(
      { message: 'Internal server error', error: String(err) },
      { status: 500 }
    )
  }
}