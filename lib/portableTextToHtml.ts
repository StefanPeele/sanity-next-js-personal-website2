// lib/portableTextToHtml.ts
// Minimal, dependency-free Portable Text → HTML for feeds and emails.
// Handles blocks (paragraphs, headings, blockquotes), lists, marks (strong, em,
// code, underline, strike-through, link, sidenote), images and code blocks.
// Custom interactive blocks are replaced with a short note — readers should open the
// article on the site for those.

import { escapeHtml } from '@/lib/security'
import { absoluteUrl } from '@/lib/site'

type Span = { _type?: string; _key?: string; text?: string; marks?: string[] }
type MarkDef = { _key: string; _type: string; href?: string; note?: string }
type Block = {
  _type?: string
  _key?: string
  style?: string
  listItem?: string
  level?: number
  children?: Span[]
  markDefs?: MarkDef[]
  [key: string]: unknown
}

const INTERACTIVE_LABELS: Record<string, string> = {
  knowledgeQuiz:     'Knowledge quiz',
  layerExplorer:     'OSI layer explorer',
  packetAnimator:    'Packet animator',
  wiresharkCallout:  'Wireshark callout',
  failureNote:       'Failure note',
  whatIGotWrong:     'What I got wrong',
  whatEngineersUse:  'What engineers use',
  theProblemSolved:  'The problem solved',
  conceptStressTest: 'Concept stress test',
}

function renderSpan(span: Span, markDefs: MarkDef[]): string {
  let html = escapeHtml(span.text ?? '')
  for (const mark of span.marks ?? []) {
    const def = markDefs.find((d) => d._key === mark)
    if (def?._type === 'link' && def.href) {
      const href = escapeHtml(def.href)
      html = `<a href="${href}" rel="noopener">${html}</a>`
    } else if (def?._type === 'sidenote' && def.note) {
      html = `${html} <em>[${escapeHtml(def.note)}]</em>`
    } else if (mark === 'strong') html = `<strong>${html}</strong>`
    else if (mark === 'em') html = `<em>${html}</em>`
    else if (mark === 'code') html = `<code>${html}</code>`
    else if (mark === 'underline') html = `<u>${html}</u>`
    else if (mark === 'strike-through') html = `<s>${html}</s>`
  }
  return html
}

function renderTextBlock(block: Block): string {
  const inner = (block.children ?? []).map((c) => renderSpan(c, block.markDefs ?? [])).join('')
  switch (block.style) {
    case 'h1': return `<h1>${inner}</h1>`
    case 'h2': return `<h2>${inner}</h2>`
    case 'h3': return `<h3>${inner}</h3>`
    case 'h4': return `<h4>${inner}</h4>`
    case 'h5': return `<h5>${inner}</h5>`
    case 'h6': return `<h6>${inner}</h6>`
    case 'blockquote': return `<blockquote><p>${inner}</p></blockquote>`
    default: return `<p>${inner}</p>`
  }
}

function imageUrl(block: Block): string | null {
  const asset = block.asset as { _ref?: string; url?: string } | undefined
  if (!asset) return null
  if (asset.url) return asset.url
  // image-<id>-<w>x<h>-<ext>
  const m = asset._ref?.match(/^image-([a-zA-Z0-9]+)-(\d+x\d+)-(\w+)$/)
  if (!m) return null
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
  if (!projectId || !dataset) return null
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${m[1]}-${m[2]}.${m[3]}?w=1200&auto=format`
}

function renderOther(block: Block, permalink: string): string {
  switch (block._type) {
    case 'image': {
      const src = imageUrl(block)
      if (!src) return ''
      const alt = escapeHtml(block.alt ?? '')
      const caption = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ''
      return `<figure><img src="${escapeHtml(src)}" alt="${alt}" />${caption}</figure>`
    }
    case 'code': {
      const lang = block.language ? ` class="language-${escapeHtml(block.language)}"` : ''
      const filename = block.filename ? `<p><code>${escapeHtml(block.filename)}</code></p>` : ''
      return `${filename}<pre><code${lang}>${escapeHtml(block.code ?? '')}</code></pre>`
    }
    case 'sectionBreak': {
      const title = typeof block.title === 'string' ? block.title : ''
      return title ? `<hr /><h2>${escapeHtml(title)}</h2>` : '<hr />'
    }
    default: {
      const label = INTERACTIVE_LABELS[block._type ?? ''] ?? 'Interactive block'
      return `<p><em>[${escapeHtml(label)} — interactive block. <a href="${escapeHtml(permalink)}">Read on the site</a>.]</em></p>`
    }
  }
}

/**
 * Convert a Portable Text array into an HTML string.
 * @param blocks the `body` array from Sanity
 * @param permalink absolute URL of the article, used for the "read on the site" fallback
 */
export function portableTextToHtml(blocks: unknown, permalink = absoluteUrl('/blog')): string {
  if (!Array.isArray(blocks)) return ''
  const out: string[] = []
  let listType: 'ul' | 'ol' | null = null

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`)
      listType = null
    }
  }

  for (const raw of blocks as Block[]) {
    if (!raw || typeof raw !== 'object') continue
    if (raw._type === 'block') {
      if (raw.listItem) {
        const wanted: 'ul' | 'ol' = raw.listItem === 'number' ? 'ol' : 'ul'
        if (listType !== wanted) {
          closeList()
          out.push(`<${wanted}>`)
          listType = wanted
        }
        const inner = (raw.children ?? []).map((c) => renderSpan(c, raw.markDefs ?? [])).join('')
        out.push(`<li>${inner}</li>`)
        continue
      }
      closeList()
      out.push(renderTextBlock(raw))
    } else {
      closeList()
      out.push(renderOther(raw, permalink))
    }
  }
  closeList()
  return out.filter(Boolean).join('\n')
}
