import { escapeHtml } from '@/lib/security'
import { SITE, absoluteUrl } from '@/lib/site'
// lib/digestEmail.ts — PROPOSALS 9.3.
//
// ONE renderer. The "send test to me" path posts to the same handler with a single-recipient
// override and runs through this exact function, because a preview PAGE would be a second
// renderer and would drift. The thing being previewed is an HTML email, and the only honest
// preview of an HTML email is an HTML email in a real client: dark mode, Outlook, a phone.
// None of that is visible in a browser tab.

export type DigestEntry =
  | { _type: 'postEntry'; note?: string | null; post?: { title?: string | null; slug?: string | null } | null }
  | { _type: 'linkEntry'; title?: string | null; url?: string | null; source?: string | null; note?: string | null }
  | { _type: 'noteEntry'; heading?: string | null; body?: string | null }

export type Digest = {
  title?: string | null
  intro?: string | null
  entries?: DigestEntry[] | null
}

const P = 'margin:0 0 14px;font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#1c1917'
const META = 'margin:0 0 4px;font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#78716c'
const H = 'margin:28px 0 6px;font-family:Georgia,serif;font-size:19px;line-height:1.3;color:#0a0a0a'

function entryHtml(e: DigestEntry): string {
  if (e._type === 'postEntry') {
    const title = e.post?.title ?? 'Untitled'
    const href = e.post?.slug ? absoluteUrl(`/blog/${e.post.slug}`) : SITE.url
    return `
      <p style="${META}">From the blog</p>
      <h2 style="${H}"><a href="${escapeHtml(href)}" style="color:#0a0a0a">${escapeHtml(title)}</a></h2>
      <p style="${P}">${escapeHtml(e.note ?? '')}</p>`
  }
  if (e._type === 'linkEntry') {
    return `
      <p style="${META}">${escapeHtml(e.source || 'Elsewhere')}</p>
      <h2 style="${H}"><a href="${escapeHtml(e.url ?? '#')}" style="color:#0a0a0a">${escapeHtml(e.title ?? 'Untitled')}</a></h2>
      <p style="${P}">${escapeHtml(e.note ?? '')}</p>`
  }
  return `
      <h2 style="${H}">${escapeHtml(e.heading ?? '')}</h2>
      <p style="${P}">${escapeHtml(e.body ?? '')}</p>`
}

/** The email. `unsubscribeUrl` is per-recipient; it is never shared between subscribers. */
export function digestEmailHtml(digest: Digest, unsubscribeUrl: string): string {
  const entries = (digest.entries ?? []).map(entryHtml).join('')
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(digest.title ?? 'Digest')}</title></head>
<body style="margin:0;padding:0;background:#f5f5f4">
  <div style="max-width:37rem;margin:0 auto;padding:32px 20px;background:#ffffff">
    <p style="${META}">${escapeHtml(SITE.name)}</p>
    <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:26px;line-height:1.25;color:#0a0a0a">${escapeHtml(digest.title ?? 'Digest')}</h1>
    ${digest.intro ? `<p style="${P}">${escapeHtml(digest.intro)}</p>` : ''}
    ${entries}
    <hr style="margin:32px 0 14px;border:0;border-top:1px solid #e7e5e4">
    <p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:11px;line-height:1.6;color:#78716c">
      You are getting this because you subscribed at ${escapeHtml(SITE.url)}.<br>
      <a href="${escapeHtml(unsubscribeUrl)}" style="color:#78716c">Unsubscribe</a>
    </p>
  </div>
</body></html>`
}

/** Plain text, because a digest that only renders as HTML is a digest some readers cannot read. */
export function digestEmailText(digest: Digest, unsubscribeUrl: string): string {
  const lines: string[] = [digest.title ?? 'Digest', '']
  if (digest.intro) lines.push(digest.intro, '')
  for (const e of digest.entries ?? []) {
    if (e._type === 'postEntry') {
      lines.push(`FROM THE BLOG: ${e.post?.title ?? 'Untitled'}`, e.post?.slug ? absoluteUrl(`/blog/${e.post.slug}`) : SITE.url, e.note ?? '', '')
    } else if (e._type === 'linkEntry') {
      lines.push(`${(e.source || 'ELSEWHERE').toUpperCase()}: ${e.title ?? ''}`, e.url ?? '', e.note ?? '', '')
    } else {
      lines.push(e.heading ?? '', e.body ?? '', '')
    }
  }
  lines.push('---', `You are getting this because you subscribed at ${SITE.url}.`, `Unsubscribe: ${unsubscribeUrl}`)
  return lines.join('\n')
}
