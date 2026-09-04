// app/actions/email-templates.ts
// Shared HTML shell for every transactional email the site sends.
// NOT a server action file — plain helpers. Every caller must escape user
// input with escapeHtml() before interpolating it into these templates.

import { SITE } from '@/lib/site'

export const MONO = "font-family:'IBM Plex Mono','Courier New',monospace;"
export const SERIF = 'font-family:Lora,Georgia,serif;'

/** Small uppercase label used above sections. */
export function eyebrow(text: string): string {
  return `<p style="${MONO}font-size:10px;text-transform:uppercase;letter-spacing:0.3em;color:#78716c;margin:0 0 12px 0;">${text}</p>`
}

/** Bordered panel. */
export function panel(inner: string): string {
  return `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:20px;margin-bottom:24px;">${inner}</div>`
}

/** Two-column key/value table. Values must already be escaped. */
export function kvTable(rows: Array<[string, string]>): string {
  return `<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="${MONO}font-size:9px;text-transform:uppercase;letter-spacing:0.3em;color:#78716c;padding:8px 16px 8px 0;white-space:nowrap;vertical-align:top;">${label}</td>
        <td style="font-size:13px;color:#d6d3d1;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${value}</td>
      </tr>`,
    )
    .join('')}</table>`
}

export function button(href: string, label: string): string {
  return `<a href="${href}" style="${MONO}display:inline-block;background:#ffffff;color:#0a0a0a;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:14px 24px;border-radius:4px;">${label}</a>`
}

/**
 * Full document. `title` is the h1, `preheader` the tiny label above it.
 * `body` is trusted HTML assembled from the helpers above.
 */
export function emailShell(opts: { preheader: string; title: string; body: string; signoff?: string }): string {
  const signoff = opts.signoff ?? 'Stefan Peele'
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="${MONO}background:#0a0a0a;color:#d6d3d1;padding:32px 16px;margin:0;">
  <div style="max-width:560px;margin:0 auto;">
    <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.3em;color:#78716c;margin:0 0 24px 0;">${opts.preheader}</p>
    <h1 style="${SERIF}font-size:28px;font-weight:700;color:#ffffff;margin:0 0 20px 0;line-height:1.15;">${opts.title}</h1>
    ${opts.body}
    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;margin-top:8px;">
      <p style="font-size:12px;color:#a8a29e;margin:0 0 4px 0;">${signoff}</p>
      <p style="font-size:10px;color:#78716c;margin:0;">${SITE.url.replace(/^https?:\/\//, '')} &nbsp;·&nbsp; ${SITE.email} &nbsp;·&nbsp; @stefs.lens</p>
    </div>
  </div>
</body></html>`
}

export function paragraph(text: string): string {
  return `<p style="font-size:14px;color:#a8a29e;margin:0 0 16px 0;line-height:1.7;">${text}</p>`
}

export function bulletList(items: string[]): string {
  return `<ul style="font-size:13px;color:#a8a29e;line-height:1.8;padding-left:20px;margin:0 0 12px 0;">${items
    .map((i) => `<li>${i}</li>`)
    .join('')}</ul>`
}
