// lib/corrections.ts
// Phase 3B — corrections marked in place, on the passage, with credit.
//
// The same split-the-span transform as lib/glossary.ts, with three differences that matter:
//
//   1. It matches an EXACT anchor string, not a pattern. A correction is about one specific
//      passage; a fuzzy match on the wrong sentence would attach an admission of error to
//      text that was never wrong.
//   2. Every correction is numbered in DATE order, oldest first, and the number is carried
//      into the mark. The marker in the prose and the entry at the foot show the same [c2],
//      so a reader can move between them — arXiv's shape.
//   3. It reports which anchors did NOT match. An author who corrects the passage and then
//      pastes the OLD wording into the anchor gets a correction with no in-place marker,
//      which looks identical to a correction that simply has no anchor. That is a silent
//      failure worth surfacing, so the caller gets the list back.
//
// What this deliberately does NOT do: render the original struck through in the body. The
// brief asks that the original stay "visible or recoverable", and the correction note
// satisfies that. Putting the wrong version back into the prose at full weight, first,
// teaches the error to a reader who came to learn the thing.

import { enumKey } from '@/lib/stega'

export const CORRECTION_KINDS = ['correction', 'clarification', 'update'] as const
export type CorrectionKind = (typeof CORRECTION_KINDS)[number]

/** Reader-facing words. The Studio schema's list must stay in step with this one. */
export const CORRECTION_LABELS: Record<CorrectionKind, { label: string; verb: string }> = {
  correction: { label: 'Correction', verb: 'Corrected' },
  clarification: { label: 'Clarification', verb: 'Clarified' },
  update: { label: 'Update', verb: 'Updated' },
}

export interface CorrectionEntry {
  _key?: string | null
  anchor?: string | null
  kind?: string | null
  was?: string | null
  now?: string | null
  creditTo?: string | null
  creditUrl?: string | null
  date?: string | null
  sourceComment?: string | null
}

/** A correction after numbering and normalising — what both surfaces render from. */
export interface NumberedCorrection {
  key: string
  n: number
  kind: CorrectionKind
  anchor: string
  was: string
  now: string
  creditTo: string | null
  creditUrl: string | null
  date: string
  sourceComment: string | null
  /** False when an anchor was given but no matching passage exists in the body. */
  anchored: boolean
}

export interface CorrectionMarkDef {
  _type: 'correction'
  _key: string
  n: number
  kind: CorrectionKind
  now: string
  was: string
  creditTo: string
  creditUrl: string
  date: string
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

const HEADING_STYLES = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

const kindOf = (v: string | null | undefined): CorrectionKind => {
  const k = enumKey(v)
  return (CORRECTION_KINDS as readonly string[]).includes(k ?? '') ? (k as CorrectionKind) : 'correction'
}

/**
 * Number the corrections, oldest first. Ties break on the Studio array order, which is
 * stable, so [c1] does not change meaning when an unrelated correction is added later —
 * a number that moves would break any link a reader has already shared.
 */
export function numberCorrections(entries: readonly CorrectionEntry[] | null | undefined): NumberedCorrection[] {
  return (entries ?? [])
    .filter((c) => c && (c.now || c.was))
    .map((c, i) => ({ c, i }))
    .sort((a, b) => ((a.c.date ?? '').localeCompare(b.c.date ?? '')) || (a.i - b.i))
    .map(({ c, i }, idx) => ({
      key: c._key ?? `c${i}`,
      n: idx + 1,
      kind: kindOf(c.kind),
      // stega is stripped from the ANCHOR because it is matched against body text, and a
      // draft-mode anchor carries invisible characters the body copy does not.
      anchor: (enumKey(c.anchor) ?? '').trim(),
      was: c.was ?? '',
      now: c.now ?? '',
      creditTo: c.creditTo?.trim() || null,
      creditUrl: c.creditUrl?.trim() || null,
      date: (c.date ?? '').slice(0, 10),
      sourceComment: c.sourceComment?.trim() || null,
      anchored: false,
    }))
}

/**
 * Apply correction marks to a block array. Returns the (possibly unchanged) blocks and the
 * numbered corrections with `anchored` filled in, so the caller can render the foot list and
 * know which anchors failed to match.
 *
 * Blocks are shallow-copied only when changed, so the result is safe to hand to PortableText.
 */
export function applyCorrectionMarks<T extends Block>(
  blocks: T[] | null | undefined,
  entries: readonly CorrectionEntry[] | null | undefined,
): { blocks: T[]; corrections: NumberedCorrection[] } {
  const corrections = numberCorrections(entries)
  if (!Array.isArray(blocks)) return { blocks: [], corrections }
  const pending = corrections.filter((c) => c.anchor.length > 0)
  if (!pending.length) return { blocks, corrections }

  const matched = new Set<string>()

  const out = blocks.map((block) => {
    if (block?._type !== 'block' || !Array.isArray(block.children)) return block
    // Never inside a heading: a heading is a label, and a correction marker in one would
    // land in the table of contents and the anchor link.
    if (block.style && HEADING_STYLES.has(block.style)) return block

    const markDefs = Array.isArray(block.markDefs) ? block.markDefs : []
    // Do not mark inside a link, a sidenote, a glossary term or another correction. Nesting
    // two interactive annotations produces a button inside a button.
    const skipMarkKeys = new Set(
      markDefs
        .filter((d) => d._type === 'link' || d._type === 'sidenote' || d._type === 'glossary' || d._type === 'correction')
        .map((d) => d._key)
        .filter((k): k is string => typeof k === 'string'),
    )

    let changed = false
    const newDefs: CorrectionMarkDef[] = []
    const children: Span[] = []

    for (const span of block.children) {
      if (span?._type !== 'span' || typeof span.text !== 'string' || !span.text) { children.push(span); continue }
      const marks = span.marks ?? []
      if (marks.includes('code') || marks.some((m) => skipMarkKeys.has(m))) { children.push(span); continue }

      let rest = span.text
      let part = 0
      while (true) {
        // Earliest anchor in this span wins; a longer anchor wins a tie, so a correction on
        // a whole sentence is not pre-empted by one on a clause inside it.
        let best: { index: number; c: NumberedCorrection } | null = null
        for (const c of pending) {
          if (matched.has(c.key)) continue
          const index = rest.indexOf(c.anchor)
          if (index === -1) continue
          if (best === null || index < best.index || (index === best.index && c.anchor.length > best.c.anchor.length)) {
            best = { index, c }
          }
        }
        if (!best) {
          if (part > 0) children.push({ ...span, _key: `${span._key ?? 's'}-${part}`, text: rest })
          else children.push(span)
          break
        }

        const { index, c } = best
        matched.add(c.key)
        changed = true
        const markKey = `corr-${c.key}`
        newDefs.push({
          _type: 'correction',
          _key: markKey,
          n: c.n,
          kind: c.kind,
          now: c.now,
          was: c.was,
          creditTo: c.creditTo ?? '',
          creditUrl: c.creditUrl ?? '',
          date: c.date,
        })

        if (index > 0) children.push({ ...span, _key: `${span._key ?? 's'}-${part++}`, text: rest.slice(0, index) })
        children.push({ ...span, _key: `${span._key ?? 's'}-${part++}`, text: c.anchor, marks: [...marks, markKey] })
        rest = rest.slice(index + c.anchor.length)
        if (!rest.length) break
      }
    }

    if (!changed) return block
    return { ...block, children, markDefs: [...markDefs, ...newDefs] }
  })

  return {
    blocks: out,
    corrections: corrections.map((c) => ({ ...c, anchored: matched.has(c.key) })),
  }
}

/** Corrections whose anchor was given but never found — a silent authoring mistake. */
export function unanchoredCorrections(corrections: readonly NumberedCorrection[]): NumberedCorrection[] {
  return corrections.filter((c) => c.anchor.length > 0 && !c.anchored)
}
