// components/knowledge/WikiLinks.tsx
// Resolves `[[Note title]]` wiki-links inside Portable Text spans before rendering.
//
// This is a pure transform over blocks, run on the server, so CustomPortableText
// stays untouched: resolved links become ordinary `link` marks pointing at
// /garden/[slug]; unresolved links keep their text (brackets stripped) and get a
// `sidenote` annotation reading "No note yet", which renders as a subtle dashed
// underline with a hover hint. Matching is case-insensitive on title or slug.

export interface WikiTarget {
  title?: string | null
  slug?: string | null
}

type Span = { _type: 'span'; _key: string; text?: string; marks?: string[] }
type MarkDef = { _type: string; _key: string; [key: string]: unknown }
type Block = {
  _type: string
  _key: string
  children?: Span[]
  markDefs?: MarkDef[]
  [key: string]: unknown
}

const WIKI = /\[\[([^\]]+?)\]\]/g

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function buildWikiIndex(targets: WikiTarget[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const t of targets) {
    if (!t?.slug) continue
    if (t.title) map.set(norm(t.title), t.slug)
    map.set(norm(t.slug), t.slug)
  }
  return map
}

/** Does this block array contain any [[wiki link]] at all? Cheap pre-check. */
export function hasWikiLinks(blocks: unknown): boolean {
  if (!Array.isArray(blocks)) return false
  return blocks.some(
    (b) =>
      b?._type === 'block' &&
      Array.isArray(b.children) &&
      b.children.some((c: Span) => typeof c?.text === 'string' && /\[\[[^\]]+\]\]/.test(c.text)),
  )
}

/**
 * Returns a new block array with wiki-links turned into marks. Blocks without
 * links are returned as-is (same object identity) so this is cheap to run.
 */
export function resolveWikiLinks<T>(blocks: T, index: Map<string, string>): T {
  if (!Array.isArray(blocks)) return blocks
  let counter = 0
  const out = (blocks as Block[]).map((block) => {
    if (block?._type !== 'block' || !Array.isArray(block.children)) return block
    const needs = block.children.some((c) => typeof c?.text === 'string' && /\[\[[^\]]+\]\]/.test(c.text))
    if (!needs) return block

    const markDefs: MarkDef[] = [...(block.markDefs ?? [])]
    const children: Span[] = []

    for (const child of block.children) {
      if (child?._type !== 'span' || typeof child.text !== 'string' || !/\[\[[^\]]+\]\]/.test(child.text)) {
        children.push(child)
        continue
      }
      let last = 0
      const text = child.text
      WIKI.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = WIKI.exec(text))) {
        if (m.index > last) {
          children.push({ ...child, _key: `${child._key}-t${counter++}`, text: text.slice(last, m.index) })
        }
        const raw = m[1]!
        // Support [[target|display text]]
        const [targetRaw, displayRaw] = raw.split('|')
        const target = (targetRaw ?? '').trim()
        const display = (displayRaw ?? targetRaw ?? '').trim()
        const slug = index.get(norm(target))
        const key = `wiki-${counter++}`
        if (slug) {
          markDefs.push({ _type: 'link', _key: key, href: `/garden/${slug}` })
        } else {
          markDefs.push({ _type: 'sidenote', _key: key, note: `No note yet — "${target}" has not been written up in the garden.` })
        }
        children.push({ ...child, _key: `${child._key}-w${counter++}`, text: display, marks: [...(child.marks ?? []), key] })
        last = m.index + m[0].length
      }
      if (last < text.length) {
        children.push({ ...child, _key: `${child._key}-t${counter++}`, text: text.slice(last) })
      }
    }

    return { ...block, children, markDefs }
  })
  return out as T
}
