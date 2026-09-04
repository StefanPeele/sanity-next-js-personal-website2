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
import type { PathSegment } from '@sanity/client/csm'
import { PortableText, type PortableTextBlock, type PortableTextComponents } from 'next-sanity'
import type { Image } from 'sanity'
// components/CustomPortableText.tsx

export function CustomPortableText({
  id = null,
  type = null,
  path = [],
  paragraphClasses,
  value,
}: {
  id?: string | null
  type?: string | null
  path?: PathSegment[]
  paragraphClasses?: string
  value: PortableTextBlock[]
}) {
  const components: PortableTextComponents = {

    // ── Block-level elements ───────────────────────────────────────
    block: {
      normal: ({ children }) => (
        <p className={paragraphClasses ?? 'mb-6 leading-[1.85] text-stone-300 text-base md:text-[17px]'}>{children}</p>
      ),
      h1: ({ children }) => (
        <h1 className="mt-16 mb-6 font-serif text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="mt-16 mb-5 font-serif text-3xl md:text-[2rem] font-semibold text-white leading-tight tracking-tight border-b border-white/5 pb-4">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="mt-10 mb-4 font-serif text-2xl md:text-[1.6rem] font-semibold text-white leading-snug">
          {children}
        </h3>
      ),
      h4: ({ children }) => (
        <h4 className="mt-8 mb-3 font-serif text-xl font-semibold text-stone-200 leading-snug">
          {children}
        </h4>
      ),
      blockquote: ({ children }) => (
        <blockquote className="my-10 pl-6 border-l-2 border-stone-600 font-serif italic text-xl text-stone-400 leading-relaxed">
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
        <li className="flex items-start gap-3 text-stone-300 leading-relaxed text-base">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-600" />
          <span>{children}</span>
        </li>
      ),
      number: ({ children, index }) => (
        <li className="flex items-start gap-4 text-stone-300 leading-relaxed text-base">
          <span className="shrink-0 font-mono text-[11px] text-stone-600 mt-1 w-5 text-right">
            {(index ?? 0) + 1}.
          </span>
          <span>{children}</span>
        </li>
      ),
    },

    // ── Inline marks ───────────────────────────────────────────────
    marks: {
      link: ({ children, value }) => (
        <a
          className="text-white decoration-stone-600 underline underline-offset-4 transition hover:decoration-white hover:text-stone-200"
          href={value?.href}
          rel="noreferrer noopener"
          target={value?.href?.startsWith('/') ? undefined : '_blank'}
        >
          {children}
        </a>
      ),
      code: ({ children }) => (
        <code className="font-mono text-[0.875em] text-stone-200 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">
          {children}
        </code>
      ),
      strong: ({ children }) => (
        <strong className="font-semibold text-stone-100">{children}</strong>
      ),
      em: ({ children }) => (
        <em className="italic font-serif text-stone-300">{children}</em>
      ),
      sidenote: ({ children, value }) => (
        <SideNote note={value?.note}>{children}</SideNote>
      ),
    },

    // ── Custom block types ─────────────────────────────────────────
    types: {
      image: ({ value }: { value: Image & { alt?: string; caption?: string } }) => (
        <div className="my-10 rounded-xl overflow-hidden border border-white/5 shadow-2xl bg-[#0a0a0a]">
          <ImageBox
            image={value}
            alt={value.alt}
            classesWrapper="relative aspect-[16/9] w-full h-auto"
          />
          {value?.caption && (
            <div className="px-4 py-3 font-mono text-[10px] text-stone-500 uppercase tracking-widest text-center border-t border-white/5">
              {value.caption}
            </div>
          )}
        </div>
      ),

      timeline: ({ value }: { value: { items: unknown; _key: string } }) => {
        const { items, _key } = value ?? {}
        return (
          <TimelineSection
            key={_key}
            id={id ?? ''}
            type={type ?? ''}
            path={[...path, { _key }, 'items']}
            timelines={items as any}
          />
        )
      },

      code: ({ value }: { value: { code?: string; language?: string } }) => (
        <CodeBlock value={value} />
      ),

      // ── Interactive blog features ──────────────────────────────
      knowledgeQuiz:    ({ value }) => <KnowledgeQuiz value={value} />,
      layerExplorer:    ({ value }) => <LayerExplorer value={value} />,
      packetAnimator:   ({ value }) => <PacketAnimator value={value} />,
      wiresharkCallout: ({ value }) => <WiresharkCallout value={value} />,

      // ── Editorial features ─────────────────────────────────────
      sectionBreak: ({ value }) => <SectionBreak value={value} />,
      failureNote:  ({ value }) => <FailureNote value={value} />,

      // ── New learning blocks ────────────────────────────────────
      whatIGotWrong:    ({ value }) => <WhatIGotWrong value={value} />,
      whatEngineersUse: ({ value }) => <WhatEngineersUse value={value} />,
      theProblemSolved: ({ value }) => <TheProblemSolved value={value} />,
      conceptStressTest:({ value }) => <ConceptStressTest value={value} />,
    },
  }

  return (
    <PortableText
      components={components}
      value={value}
    />
  )
}