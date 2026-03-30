import ImageBox from '@/components/ImageBox'
import {TimelineSection} from '@/components/TimelineSection'
import { CodeBlock } from '@/components/CodeBlock' // <-- NEW IMPORT
import type {PathSegment} from '@sanity/client/csm'
import {PortableText, type PortableTextBlock, type PortableTextComponents} from 'next-sanity'
import type {Image} from 'sanity'

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
  value: PortableTextBlock[] | any
}) {
  const components: PortableTextComponents = {
    block: {
      normal: ({children}) => {
        return <p className={paragraphClasses}>{children}</p>
      },
    },
    marks: {
      link: ({children, value}) => {
        // Combined your hover transition with the new dark mode aesthetics
        return (
          <a
            className="text-white decoration-stone-500 underline underline-offset-4 transition hover:decoration-white hover:opacity-80"
            href={value?.href}
            rel="noreferrer noopener"
            target={value?.href?.startsWith('/') ? undefined : '_blank'}
          >
            {children}
          </a>
        )
      },
    },
    types: {
      image: ({value}: {value: Image & {alt?: string; caption?: string}}) => {
        return (
          <div className="my-8 space-y-2 rounded-xl overflow-hidden border border-white/5 shadow-2xl bg-[#0a0a0a]">
            <ImageBox image={value} alt={value.alt} classesWrapper="relative aspect-[16/9] w-full h-auto" />
            {value?.caption && (
              <div className="p-3 font-mono text-[10px] text-stone-500 uppercase tracking-widest text-center border-t border-white/5">
                {value.caption}
              </div>
            )}
          </div>
        )
      },
      timeline: ({value}) => {
        const {items, _key} = value || {}
        return (
          <TimelineSection
            key={_key}
            id={id || ''}
            type={type || ''}
            path={[...path, {_key}, 'items']}
            timelines={items}
          />
        )
      },
      // 3. THE NEW CODE BLOCK MAPPING
      code: ({ value }) => <CodeBlock value={value} />,
    },
  }

  return <PortableText components={components} value={value} />
}