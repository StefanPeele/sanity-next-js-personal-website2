import {TimelineItem, type MilestoneLike} from '@/components/TimelineItem'
import {studioUrl} from '@/sanity/lib/api'
import type {StudioPathLike} from '@sanity/client/csm'
import {createDataAttribute, stegaClean} from 'next-sanity'
import {OptimisticSortOrder} from './OptimisticSortOrder'

interface TimelineEntry {
  _key: string
  title?: string | null
  milestones?: (MilestoneLike & {_key: string})[] | null
}

export function TimelineSection({
  timelines,
  id,
  type,
  path,
}: {
  timelines: TimelineEntry[]
  id: string | null
  type: string | null
  path: StudioPathLike
}) {
  const dataAttribute =
    id && type
      ? createDataAttribute({
          baseUrl: studioUrl,
          id,
          type,
          path,
        })
      : null

  return (
    <div className="flex flex-col gap-8 pt-16 text-stone-300 md:flex-row" data-sanity={dataAttribute?.()}>
      <OptimisticSortOrder id={id ?? ''} path={path}>
        {timelines?.map((timeline) => {
          const {title, milestones, _key} = timeline
          return (
            <div className="max-w-[80%] md:max-w-[50%]" key={_key} data-sanity={dataAttribute?.([{_key}])}>
              <div className="pb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400">{stegaClean(title)}</div>
              <OptimisticSortOrder id={id ?? ''} path={[...path, {_key}, 'milestones']}>
                {milestones?.map((experience) => (
                  <div
                    key={experience._key}
                    data-sanity={dataAttribute?.([{_key}, 'milestones', {_key: experience._key}])}
                    className="group"
                  >
                    <TimelineItem milestone={stegaClean(experience)} />
                  </div>
                ))}
              </OptimisticSortOrder>
            </div>
          )
        })}
      </OptimisticSortOrder>
    </div>
  )
}
