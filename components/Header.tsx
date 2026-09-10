import {CustomPortableText} from '@/components/CustomPortableText'
import type {PathSegment} from '@sanity/client/csm'
import type {PortableTextBlock} from 'next-sanity'

interface HeaderProps {
  id: string | null
  type: string | null
  path: PathSegment[]
  centered?: boolean
  description?: PortableTextBlock[] | null
  title?: string | null
  /** Small mono label rendered above the title. */
  eyebrow?: string
}

export function Header(props: HeaderProps) {
  const {id, type, path, title, description, centered = false, eyebrow} = props
  if (!description && !title) {
    return null
  }
  return (
    <div className={centered ? 'text-center' : 'w-full lg:w-4/5'}>
      {eyebrow && (
        <span className="meta-label text-stone-400 border-l border-stone-700 pl-4 mb-4 block">
          {eyebrow}
        </span>
      )}
      {title && (
        <h1 className="font-serif text-4xl font-bold tracking-tight text-white md:text-6xl">{title}</h1>
      )}
      {description && (
        <div className="mt-4 text-pretty font-serif text-xl text-stone-400 md:text-2xl">
          <CustomPortableText
            id={id}
            type={type}
            path={path}
            value={description}
            paragraphClasses="font-serif text-xl text-stone-400 md:text-2xl leading-relaxed"
          />
        </div>
      )}
    </div>
  )
}
