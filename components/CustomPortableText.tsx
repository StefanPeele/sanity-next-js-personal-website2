import ImageBox from '@/components/ImageBox'
import { TimelineSection } from '@/components/TimelineSection'
import { CodeBlock } from '@/components/CodeBlock'
import { KnowledgeQuiz } from '@/components/blog/KnowledgeQuiz'
import { LayerExplorer } from '@/components/blog/LayerExplorer'
import { PacketAnimator } from '@/components/blog/PacketAnimator'
import { WiresharkCallout } from '@/components/blog/WiresharkCallout'
import { SideNote } from '@/components/blog/SideNote'
import { SectionBreak } from '@/components/blog/SectionBreak'
import { FailureNote } from '@/components/blog/FailureNote'
import { WhatIGotWrong, WhatEngineersUse, TheProblemSolved, ConceptStressTest } from '@/components/blog/LearningBlocks'
import { GlossaryTerm } from '@/components/blog/GlossaryTerm'
import { HeadingAnchor } from '@/components/article/HeadingAnchor'
import { slugify, countWords } from '@/lib/reading'
import type { PathSegment } from '@sanity/client/csm'
import { PortableText, type PortableTextBlock, type PortableTextComponents } from 'next-sanity'
import type { Image } from 'sanity'
import { FOCUS } from '@/lib/ui'
// components/CustomPortableText.tsx
// Shared Portable Text renderer. When `article` is true the headings get stable
// slugified ids (deduped -2, -3 …), a data-words attribute with the word count
// of the section that follows (for TOC reading times) and a hover anchor link.

type AnyBlock = PortableTextBlock & { _key: string; _type: string; style?: string; children?: Array<{ text?: string }>; title?: string }

// Every heading style the Studio offers, not a subset. This set is what decides which
// blocks get an id, an anchor and a TOC entry -- it held only h2/h3/h4, so h1, h5 and h6
// were rendered but unreachable. That is why one post shipped with seven <h5> elements,
// no ids, and an entirely empty Contents column.
const HEADING_STYLES = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

/** Precompute ids + section word counts so SSR markup already carries them. */
function buildHeadingMeta(blocks: AnyBlock[]): Map<string, { id: string; words: number }> {
  const meta = new Map<string, { id: string; words: number }>()
  const taken = new Set<string>()
  let current: string | null = null
  let words = 0

  const flush = () => {
    if (current) {
      const m = meta.get(current)
      if (m) m.words = words
    }
    words = 0
  }

  for (const b of blocks) {
    if (!b) continue
    const isHeading = (b._type === 'block' && b.style && HEADING_STYLES.has(b.style)) || b._type === 'sectionBreak'
    if (isHeading) {
      flush()
      const text = b._type === 'sectionBreak' ? (b.title ?? '') : (b.children ?? []).map((c) => c.text ?? '').join('')
      const base = slugify(text)
      let id = base
      let n = 2
      while (taken.has(id)) id = `${base}-${n++}`
      taken.add(id)
      meta.set(b._key, { id, words: 0 })
      current = b._key
      continue
    }
    if (b._type === 'block' && Array.isArray(b.children)) {
      words += countWords((b.children as Array<{ text?: string }>).map((c) => c.text ?? '').join(''))
    }
  }
  flush()
  return meta
}

export function CustomPortableText({
  id = null,
  type = null,
  path = [],
  paragraphClasses,
  value,
  article = false,
}: {
  id?: string | null
  type?: string | null
  path?: PathSegment[]
  paragraphClasses?: string
  value: PortableTextBlock[]
  /** Enables heading ids/anchors, reader font-size variable, glossary marks. */
  article?: boolean
}) {
  const headingMeta = article ? buildHeadingMeta(value as AnyBlock[]) : null

  const headingProps = (key: string | undefined) => {
    const m = key ? headingMeta?.get(key) : undefined
    return m ? { id: m.id, 'data-words': m.words } : {}
  }

  const bodyText = article
    ? 'text-[length:var(--article-fs,1rem)]'
    : 'text-base md:text-lg'

  const components: PortableTextComponents = {

    // ── Block-level elements ───────────────────────────────────────
    block: {
      normal: ({ children }) => (
        <p className={paragraphClasses ?? `mb-6 leading-[1.7] text-stone-300 ${bodyText}`}>{children}</p>
      ),
      // Rendered as <h2>, not <h1>, and deliberately.
      //
      // Every surface that renders this component already supplies the page's own <h1>:
      // BlogArticleHeader on an article, Header.tsx on project and personal pages, and
      // their own markup on /garden and /glossary. So a body "Heading 1" was ALWAYS a
      // second h1 on the page, against CLAUDE.md's one-h1-per-page rule. Measured on
      // production: /blog/the-creation-of-my-personal-portfolio-site rendered two.
      //
      // It was also the only heading style with no headingProps, so it had no id, no
      // anchor link, and -- because ArticleProvider collects `h2, h3` -- it never appeared
      // in the table of contents. A large heading the contents could not reach.
      //
      // The visual treatment is kept, so an author who picked "Heading 1" still gets the
      // largest section heading. Only the tag and the missing props change.
      //
      // Found by the verifier subagent, outside the claim it was given.
      h1: ({ children, value: v }) => {
        const p = headingProps(v?._key)
        return (
          <h2 {...p} className="group mt-16 mb-6 font-serif text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight scroll-mt-28">
            {children}
            {p.id && <HeadingAnchor id={p.id} />}
          </h2>
        )
      },
      h2: ({ children, value: v }) => {
        const p = headingProps(v?._key)
        return (
          <h2 {...p} className="group mt-20 mb-5 font-serif text-[32px] md:text-[38px] font-semibold text-white leading-tight tracking-tight scroll-mt-28">
            {children}
            {p.id && <HeadingAnchor id={p.id} />}
          </h2>
        )
      },
      h3: ({ children, value: v }) => {
        const p = headingProps(v?._key)
        return (
          <h3 {...p} className="group mt-12 mb-4 font-serif text-[26px] md:text-[30px] font-semibold text-white leading-snug scroll-mt-28">
            {children}
            {p.id && <HeadingAnchor id={p.id} />}
          </h3>
        )
      },
      h4: ({ children, value: v }) => {
        const p = headingProps(v?._key)
        return (
          <h4 {...p} className="group mt-9 mb-3 font-serif text-[22px] md:text-[24px] font-semibold text-stone-200 leading-snug scroll-mt-28">
            {children}
            {p.id && <HeadingAnchor id={p.id} />}
          </h4>
        )
      },
      // h5 and h6 had NO renderer, so Portable Text fell back to a bare tag with no id,
      // no anchor and no TOC entry. Measured on production: /blog/the-field… renders seven
      // <h5> elements with no id and an entirely empty Contents column, plus an H1→H5
      // heading-level skip. The Studio offers H1–H6 by default; the pipeline handled two of
      // them. Found by the verifier while checking something else.
      h5: ({ children, value: v }) => {
        const p = headingProps(v?._key)
        return (
          <h5 {...p} className="group mt-8 mb-3 font-serif text-[19px] md:text-[20px] font-semibold text-stone-200 leading-snug scroll-mt-28">
            {children}
            {p.id && <HeadingAnchor id={p.id} />}
          </h5>
        )
      },
      h6: ({ children, value: v }) => {
        const p = headingProps(v?._key)
        return (
          <h6 {...p} className="group mt-6 mb-2 font-sans text-[17px] font-semibold text-stone-200 leading-snug scroll-mt-28">
            {children}
            {p.id && <HeadingAnchor id={p.id} />}
          </h6>
        )
      },
      blockquote: ({ children }) => (
        // A pull quote that recedes is backwards: this was text-stone-400 against a
        // stone-300 body, so it read dimmer than the prose it was meant to lift out of.
        // The left rule went with it — the space now does that work.
        <blockquote className="my-14 font-serif italic text-[1.15em] text-stone-200 leading-relaxed">
          {children}
        </blockquote>
      ),
    },

    // ── List elements ──────────────────────────────────────────────
    list: {
      bullet: ({ children }) => (
        <ul className="my-6 space-y-3 pl-0 list-none">{children}</ul>
      ),
      number: ({ children }) => (
        <ol className="my-6 space-y-3 pl-0 list-none">{children}</ol>
      ),
    },
    listItem: {
      bullet: ({ children }) => (
        <li className={`flex items-start gap-3 text-stone-300 leading-relaxed ${bodyText}`}>
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-500" aria-hidden="true" />
          <span>{children}</span>
        </li>
      ),
      number: ({ children, index }) => (
        <li className={`flex items-start gap-4 text-stone-300 leading-relaxed ${bodyText}`}>
          <span className="shrink-0 font-mono text-xs text-stone-400 mt-1 w-5 text-right" aria-hidden="true">
            {(index ?? 0) + 1}.
          </span>
          <span>{children}</span>
        </li>
      ),
    },

    // ── Inline marks ───────────────────────────────────────────────
    marks: {
      link: ({ children, value: v }) => {
        const href: string = v?.href ?? '#'
        const external = /^https?:\/\//i.test(href)
        return (
          <a
            className={`article-link text-white decoration-stone-500 underline underline-offset-4 transition hover:decoration-white hover:text-stone-200 ${FOCUS}`}
            href={href}
            rel={external ? 'noreferrer noopener' : undefined}
            target={external ? '_blank' : undefined}
          >
            {children}
          </a>
        )
      },
      code: ({ children }) => (
        <code className="font-mono text-[0.875em] text-stone-200 bg-surface-fill border border-edge rounded px-1.5 py-0.5">
          {children}
        </code>
      ),
      strong: ({ children }) => (
        <strong className="font-semibold text-stone-100">{children}</strong>
      ),
      em: ({ children }) => (
        <em className="italic font-serif text-stone-300">{children}</em>
      ),
      sidenote: ({ children, value: v }) => (
        <SideNote note={v?.note}>{children}</SideNote>
      ),
      glossary: ({ children, value: v }) => (
        <GlossaryTerm slug={v?.slug} term={v?.term} definition={v?.definition}>{children}</GlossaryTerm>
      ),
    },

    // ── Custom block types ─────────────────────────────────────────
    types: {
      image: ({ value: v }: { value: Image & { alt?: string; caption?: string; keepColor?: boolean } }) => (
        <figure
          className="my-16 rounded-xl overflow-hidden border border-edge-faint shadow-2xl bg-surface"
          {...(v?.keepColor === false ? { 'data-desaturate': '' } : {})}
        >
          <ImageBox
            image={v}
            alt={v.alt ?? ''}
            classesWrapper="relative aspect-[16/9] w-full h-auto"
          />
          {v?.caption && (
            <figcaption className="meta-label px-4 py-3 text-stone-400 text-center border-t border-edge-faint">
              {v.caption}
            </figcaption>
          )}
        </figure>
      ),

      timeline: ({ value: v }: { value: { items: unknown; _key: string } }) => {
        const { items, _key } = v ?? {}
        return (
          <TimelineSection
            key={_key}
            id={id ?? ''}
            type={type ?? ''}
            path={[...path, { _key }, 'items']}
            timelines={items as React.ComponentProps<typeof TimelineSection>['timelines']}
          />
        )
      },

      code: ({ value: v }: { value: { code?: string; language?: string; filename?: string; highlightedLines?: number[] } }) => (
        <CodeBlock value={v} />
      ),

      // ── Interactive blog features ──────────────────────────────
      knowledgeQuiz:    ({ value: v }) => <KnowledgeQuiz value={v} />,
      layerExplorer:    ({ value: v }) => <LayerExplorer value={v} />,
      packetAnimator:   ({ value: v }) => <PacketAnimator value={v} />,
      wiresharkCallout: ({ value: v }) => <WiresharkCallout value={v} />,

      // ── Editorial features ─────────────────────────────────────
      sectionBreak: ({ value: v }) => {
        const m = headingMeta?.get(v?._key)
        return <SectionBreak value={v} id={m?.id} words={m?.words} />
      },
      failureNote:  ({ value: v }) => <FailureNote value={v} />,

      // ── Learning blocks ────────────────────────────────────────
      whatIGotWrong:    ({ value: v }) => <WhatIGotWrong value={v} />,
      whatEngineersUse: ({ value: v }) => <WhatEngineersUse value={v} />,
      theProblemSolved: ({ value: v }) => <TheProblemSolved value={v} />,
      conceptStressTest:({ value: v }) => <ConceptStressTest value={v} />,
    },
  }

  return (
    <PortableText
      components={components}
      value={value}
    />
  )
}
