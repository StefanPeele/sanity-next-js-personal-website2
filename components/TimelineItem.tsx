import ImageBox from '@/components/ImageBox'
import type {ImageBoxImage} from '@/components/ImageBox'
import {yearOf} from '@/lib/dates'

export interface MilestoneLike {
  _key?: string
  title?: string | null
  description?: string | null
  tags?: string[] | null
  image?: ImageBoxImage | null
  duration?: {start?: string | null; end?: string | null} | null
}

export function TimelineItem({milestone}: {milestone: MilestoneLike}) {
  const {description, duration, image, tags, title} = milestone
  const startYear = yearOf(duration?.start)
  const endYear = duration?.end ? yearOf(duration.end) : 'Now'

  return (
    <div className="flex min-h-[200px] font-sans last:pb-2">
      <div className="flex flex-col">
        <div className="relative overflow-hidden rounded-md bg-stone-900 border border-white/10" style={{width: '65px', height: '65px'}}>
          {image && <ImageBox image={image} alt={title || ''} sizes="65px" width={130} classesWrapper="h-[65px] w-[65px]" />}
        </div>
        <div className="mt-2 w-px grow self-center bg-white/10 group-last:hidden" />
      </div>
      <div className="flex-initial pl-4">
        <div className="font-serif text-lg text-white">{title}</div>
        <div className="meta-label text-stone-400 mt-1">
          {tags?.map((tag) => (
            <span key={tag}>
              {tag}
              <span className="mx-1" aria-hidden="true">●</span>
            </span>
          ))}
          {startYear ?? ''}{startYear ? ' – ' : ''}{endYear}
        </div>
        <div className="pb-5 pt-3 text-stone-400 text-sm leading-relaxed">{description}</div>
      </div>
    </div>
  )
}
