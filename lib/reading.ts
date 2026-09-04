// lib/reading.ts
// Word counts and reading time from Portable Text, shared by pages, feeds and cards.

type Span = { _type?: string; text?: string }
type Block = { _type?: string; children?: Span[]; [key: string]: unknown }

export function portableTextToPlain(blocks?: Block[] | null): string {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .map((b) => {
      if (b?._type !== 'block' || !Array.isArray(b.children)) return ''
      return b.children.map((c) => c?.text ?? '').join('')
    })
    .filter(Boolean)
    .join('\n')
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

/** Minutes at 220 wpm, never below 1. Accepts plain text, a word count, or blocks. */
export function readingTime(input: string | number | Block[] | null | undefined): number {
  const words =
    typeof input === 'number' ? input :
    typeof input === 'string' ? countWords(input) :
    countWords(portableTextToPlain(input))
  return Math.max(1, Math.round(words / 220))
}

/** Stable, URL-safe id from heading text. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'section'
}
