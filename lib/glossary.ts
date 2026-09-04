// lib/glossary.ts
// Turns glossary terms into inline hover-card annotations on Portable Text.
//
// The matcher runs on the server (in the article page) and rewrites the block
// array: the first prose occurrence of each term (or alias) is split into its
// own span carrying a `glossary` mark whose markDef holds the definition.
// CustomPortableText renders that mark as <GlossaryTerm>.
//
// Rules: longest pattern first, case-insensitive, whole-word, at most one
// highlight per term per article, never inside headings, code, links or sidenotes.

export interface GlossaryEntry {
  _id?: string
  term: string | null
  slug: string | null
  definition: string | null
  aliases?: Array<string | null> | null
}

export interface GlossaryMarkDef {
  _type: 'glossary'
  _key: string
  slug: string
  term: string
  definition: string
}

type Span = { _type?: string; _key?: string; text?: string; marks?: string[] }
type MarkDef = { _type?: string; _key?: string; [k: string]: unknown }
type Block = {
  _type?: string
  _key?: string
  style?: string
  children?: Span[]
  markDefs?: MarkDef[]
  [k: string]: unknown
}

interface Pattern {
  slug: string
  term: string
  definition: string
  regex: RegExp
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Build the ordered pattern list once per article. */
export function buildGlossaryMatcher(entries: GlossaryEntry[] | null | undefined): Pattern[] {
  if (!entries?.length) return []
  const patterns: Pattern[] = []
  for (const e of entries) {
    if (!e.term || !e.slug || !e.definition) continue
    const variants = [e.term, ...(e.aliases ?? [])]
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 1)
      .map((v) => v.trim())
    if (!variants.length) continue
    // Longest variant first inside the alternation so "Border Gateway Protocol" beats "BGP".
    variants.sort((a, b) => b.length - a.length)
    const alternation = variants.map(escapeRegex).join('|')
    patterns.push({
      slug: e.slug,
      term: e.term,
      definition: e.definition,
      // Lookarounds instead of \b so terms like "802.1Q" or "IPv6" still match cleanly.
      regex: new RegExp(`(?<![A-Za-z0-9_])(?:${alternation})(?![A-Za-z0-9_])`, 'i'),
    })
  }
  // Longest term first so overlapping terms resolve to the more specific one.
  patterns.sort((a, b) => b.term.length - a.term.length)
  return patterns
}

const HEADING_STYLES = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

/**
 * Returns a new block array with glossary marks applied. Blocks are shallow-copied
 * only when changed, so the result is safe to hand straight to PortableText.
 */
export function applyGlossaryMarks<T extends Block>(blocks: T[] | null | undefined, entries: GlossaryEntry[] | null | undefined): T[] {
  if (!Array.isArray(blocks)) return []
  const patterns = buildGlossaryMatcher(entries)
  if (!patterns.length) return blocks

  const used = new Set<string>()
  let counter = 0

  return blocks.map((block) => {
    if (block?._type !== 'block' || !Array.isArray(block.children)) return block
    if (block.style && HEADING_STYLES.has(block.style)) return block

    const markDefs = Array.isArray(block.markDefs) ? block.markDefs : []
    const skipMarkKeys = new Set(
      markDefs
        .filter((d) => d._type === 'link' || d._type === 'sidenote' || d._type === 'glossary')
        .map((d) => d._key)
        .filter((k): k is string => typeof k === 'string'),
    )

    let changed = false
    const newDefs: GlossaryMarkDef[] = []
    const children: Span[] = []

    for (const span of block.children) {
      if (span?._type !== 'span' || typeof span.text !== 'string' || !span.text) { children.push(span); continue }
      const marks = span.marks ?? []
      if (marks.includes('code') || marks.some((m) => skipMarkKeys.has(m))) { children.push(span); continue }

      let rest = span.text
      let part = 0
      while (rest.length) {
        // Earliest match among unused terms wins; ties go to the longer term (already sorted).
        let best: { index: number; length: number; p: Pattern } | null = null
        for (const p of patterns) {
          if (used.has(p.slug)) continue
          const m = p.regex.exec(rest)
          if (m && (best === null || m.index < best.index)) best = { index: m.index, length: m[0].length, p }
        }
        if (!best) { children.push(part === 0 ? span : { ...span, _key: `${span._key ?? 's'}-${part}`, text: rest }); break }

        const { index, length, p } = best
        used.add(p.slug)
        changed = true
        const markKey = `gl-${p.slug}-${counter++}`
        newDefs.push({ _type: 'glossary', _key: markKey, slug: p.slug, term: p.term, definition: p.definition })

        if (index > 0) children.push({ ...span, _key: `${span._key ?? 's'}-${part++}`, text: rest.slice(0, index) })
        children.push({ ...span, _key: `${span._key ?? 's'}-${part++}`, text: rest.slice(index, index + length), marks: [...marks, markKey] })
        rest = rest.slice(index + length)
        if (!rest.length) break
      }
    }

    if (!changed) return block
    return { ...block, children, markDefs: [...markDefs, ...newDefs] }
  })
}

/** Group glossary entries A–Z for the /glossary page. */
export function groupByLetter<T extends { term: string | null }>(entries: T[]): Array<{ letter: string; items: T[] }> {
  const map = new Map<string, T[]>()
  for (const e of entries) {
    const first = (e.term ?? '').trim().charAt(0).toUpperCase()
    const letter = /[A-Z]/.test(first) ? first : '#'
    if (!map.has(letter)) map.set(letter, [])
    map.get(letter)!.push(e)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)))
    .map(([letter, items]) => ({ letter, items: items.sort((a, b) => (a.term ?? '').localeCompare(b.term ?? '')) }))
}
