// lib/anki.ts
// Study exports built from article data:
//   - buildStudyDeck()     → Anki-importable TSV (front<TAB>back<TAB>tags)
//   - articleToMarkdown()  → plain Markdown of the article for "Copy as Markdown"
//   - downloadTextFile()   → browser-only Blob download helper
// Pure functions except downloadTextFile; safe to import from server and client.

type Span = { _type?: string; text?: string; marks?: string[] }
type Block = {
  _type?: string
  _key?: string
  style?: string
  listItem?: string
  level?: number
  children?: Span[]
  markDefs?: Array<{ _type?: string; _key?: string; href?: string }>
  [k: string]: unknown
}

export interface ConceptCardLike { front: string | null; back: string | null }
export interface QuizLike {
  question?: string | null
  explanation?: string | null
  options?: Array<{ text?: string | null; isCorrect?: boolean | null }> | null
}

/** Anki treats a tab as a field separator and a newline as a new note — flatten both. */
function ankiField(text: string): string {
  return text.replace(/\t/g, ' ').replace(/\r?\n/g, '<br>').trim()
}

function ankiTag(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Pull every knowledge quiz out of the body (inline blocks + floating triggers) plus the checkpoint. */
export function collectQuizzes(body: Block[] | null | undefined, checkpoint?: QuizLike | null): QuizLike[] {
  const out: QuizLike[] = []
  if (checkpoint?.question) out.push(checkpoint)
  for (const b of body ?? []) if (b?._type === 'knowledgeQuiz') out.push(b as unknown as QuizLike)
  return out
}

/**
 * Build a TSV deck. Import into Anki with "Fields separated by: Tab" and
 * "Allow HTML in fields" enabled. Third column is a space-separated tag list.
 */
export function buildStudyDeck(input: {
  title: string
  tags?: Array<string | null | undefined>
  conceptCards?: ConceptCardLike[] | null
  quizzes?: QuizLike[] | null
}): string {
  const tags = ['stefanpeele', ankiTag(input.title), ...(input.tags ?? []).filter((t): t is string => !!t).map(ankiTag)]
    .filter(Boolean)
    .join(' ')

  const rows: string[] = []
  for (const card of input.conceptCards ?? []) {
    if (!card.front || !card.back) continue
    rows.push([ankiField(card.front), ankiField(card.back), tags].join('\t'))
  }
  for (const quiz of input.quizzes ?? []) {
    if (!quiz.question) continue
    const correct = (quiz.options ?? []).filter((o) => o?.isCorrect && o.text).map((o) => o!.text as string)
    if (!correct.length) continue
    const back = quiz.explanation ? `${correct.join(' / ')}<br><br><i>${ankiField(quiz.explanation)}</i>` : correct.join(' / ')
    rows.push([ankiField(quiz.question), ankiField(back), tags].join('\t'))
  }
  // Header lines starting with # are ignored by Anki's importer.
  return ['#separator:tab', '#html:true', '#tags column:3', ...rows].join('\n') + '\n'
}

export function countStudyCards(input: { conceptCards?: ConceptCardLike[] | null; quizzes?: QuizLike[] | null }): number {
  const cards = (input.conceptCards ?? []).filter((c) => c.front && c.back).length
  const quiz = (input.quizzes ?? []).filter((q) => q.question && (q.options ?? []).some((o) => o?.isCorrect && o.text)).length
  return cards + quiz
}

// ── Markdown ─────────────────────────────────────────────────────────

function spanToMd(span: Span, block: Block): string {
  let text = span.text ?? ''
  if (!text) return ''
  const marks = span.marks ?? []
  if (marks.includes('code')) return `\`${text}\``
  if (marks.includes('strong')) text = `**${text}**`
  if (marks.includes('em')) text = `*${text}*`
  for (const m of marks) {
    const def = block.markDefs?.find((d) => d._key === m)
    if (def?._type === 'link' && def.href) text = `[${text}](${def.href})`
  }
  return text
}

function blockToMd(block: Block): string {
  const inner = (block.children ?? []).map((s) => spanToMd(s, block)).join('')
  if (block.listItem) {
    const indent = '  '.repeat(Math.max(0, (block.level ?? 1) - 1))
    return `${indent}${block.listItem === 'number' ? '1.' : '-'} ${inner}`
  }
  switch (block.style) {
    case 'h1': return `# ${inner}`
    case 'h2': return `## ${inner}`
    case 'h3': return `### ${inner}`
    case 'h4': return `#### ${inner}`
    case 'blockquote': return `> ${inner}`
    default: return inner
  }
}

export function articleToMarkdown(input: {
  title: string
  url: string
  excerpt?: string | null
  tldr?: string[] | null
  body?: Block[] | null
}): string {
  const lines: string[] = [`# ${input.title}`, '', `Source: ${input.url}`, '']
  if (input.excerpt) lines.push(`> ${input.excerpt}`, '')
  if (input.tldr?.length) {
    lines.push('## TL;DR', '', ...input.tldr.map((t) => `- ${t}`), '')
  }
  let prevWasList = false
  for (const b of input.body ?? []) {
    if (!b) continue
    if (b._type === 'block') {
      const md = blockToMd(b)
      const isList = !!b.listItem
      if (prevWasList && !isList) lines.push('')
      lines.push(md)
      if (!isList) lines.push('')
      prevWasList = isList
      continue
    }
    prevWasList = false
    if (b._type === 'code') {
      const code = typeof b.code === 'string' ? b.code : ''
      const lang = typeof b.language === 'string' ? b.language : ''
      const filename = typeof b.filename === 'string' && b.filename ? `# ${b.filename}\n` : ''
      lines.push('```' + lang, filename + code, '```', '')
    } else if (b._type === 'image') {
      const alt = typeof b.alt === 'string' ? b.alt : 'Image'
      const caption = typeof b.caption === 'string' ? b.caption : ''
      lines.push(`*[Image: ${alt}]${caption ? ` — ${caption}` : ''}*`, '')
    } else if (b._type === 'sectionBreak' && typeof b.title === 'string') {
      lines.push(`## ${b.title}`, '')
    } else if (b._type === 'failureNote' && typeof b.content === 'string') {
      lines.push(`> **Note:** ${b.content}`, '')
    } else if (b._type === 'whatIGotWrong') {
      lines.push(`> **What I got wrong first:** ${String(b.misconception ?? '')}`, `> **Actually:** ${String(b.correction ?? '')}`, '')
    } else if (b._type === 'knowledgeQuiz' && typeof b.question === 'string') {
      lines.push(`**Knowledge check:** ${b.question}`, '')
    }
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

/** Browser only. Triggers a download of `content` as `filename`. */
export function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8'): void {
  if (typeof document === 'undefined') return
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
