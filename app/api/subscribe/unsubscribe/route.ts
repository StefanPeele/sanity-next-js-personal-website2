import { NextResponse, type NextRequest } from 'next/server'
import { escapeHtml } from '@/lib/security'
import { SITE } from '@/lib/site'
import { getWriteClient } from '@/sanity/lib/writeClient'
// app/api/subscribe/unsubscribe/route.ts — one-click unsubscribe (GET from email links,
// POST for RFC 8058 List-Unsubscribe-Post). Returns a tiny HTML page.

export const dynamic = 'force-dynamic'

function page(title: string, body: string, status = 200) {
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${escapeHtml(title)} — ${escapeHtml(SITE.name)}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0a0a;color:#d6d3d1;font-family:Georgia,serif}
main{max-width:32rem;padding:2rem;text-align:center}h1{color:#fff;font-size:2rem;margin:0 0 .75rem}p{color:#a8a29e;line-height:1.6}
a{color:#fff}small{display:block;margin-top:2rem;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#a8a29e}</style>
</head><body><main><h1>${escapeHtml(title)}</h1><p>${body}</p><small><a href="${escapeHtml(SITE.url)}">stefanpeele.com</a></small></main></body></html>`
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

async function handle(token: string | null | undefined) {
  const client = getWriteClient()
  if (!token || token.length > 128 || !client) {
    return page('Link not recognized', `This unsubscribe link is invalid or expired. Email <a href="mailto:${escapeHtml(SITE.email)}">${escapeHtml(SITE.email)}</a> and I'll remove you by hand.`, 400)
  }
  try {
    const doc = await client.fetch<{ _id: string } | null, { t: string }>(
      `*[_type == "subscriber" && token == $t][0]{ _id }`,
      { t: token },
    )
    if (!doc) return page('Link not recognized', 'No subscription matches this link. You may already be removed.', 404)
    await client
      .patch(doc._id)
      .set({ status: 'unsubscribed', unsubscribedAt: new Date().toISOString() })
      .commit()
    return page("You're unsubscribed", 'No more emails from me. If this was a mistake, you can sign up again any time from the site footer.')
  } catch (err) {
    console.error('[subscribe/unsubscribe] failed', err)
    return page('Something went wrong', `Could not update your subscription. Email <a href="mailto:${escapeHtml(SITE.email)}">${escapeHtml(SITE.email)}</a> and I'll take care of it.`, 500)
  }
}

export async function GET(req: NextRequest) {
  return handle(req.nextUrl.searchParams.get('token')?.trim())
}

export async function POST(req: NextRequest) {
  return handle(req.nextUrl.searchParams.get('token')?.trim())
}
