import {OptimisticSortOrder} from '@/components/OptimisticSortOrder'
import type {SettingsQueryResult} from '@/sanity.types'
import {studioUrl} from '@/sanity/lib/api'
import {resolveHref} from '@/sanity/lib/utils'
import {createDataAttribute, stegaClean} from 'next-sanity'
import Link from 'next/link'

interface NavbarProps {
  data: SettingsQueryResult
}
export function Navbar(props: NavbarProps) {
  const {data} = props
  const dataAttribute =
    data?._id && data?._type
      ? createDataAttribute({
          baseUrl: studioUrl,
          id: data._id,
          type: data._type,
        })
      : null
  return (
    <header
      // UPGRADED: Changed bg-white/80 to bg-[#F5F2EB]/80 to seamlessly blend with your background while keeping the blur!
      className="sticky top-0 z-10 flex flex-wrap items-center gap-x-5 bg-[#F5F2EB]/80 px-4 py-4 backdrop-blur md:px-16 md:py-5 lg:px-32 transition-colors duration-300"
      data-sanity={dataAttribute?.('menuItems')}
    >
      <OptimisticSortOrder id={data?._id} path="menuItems">
        {data?.menuItems?.map((menuItem) => {
          const href = resolveHref(menuItem?._type, menuItem?.slug)
          if (!href) {
            return null
          }
          return (
            <Link
              key={menuItem._key}
              // UPGRADED: Swapped harsh black/gray for soft stone, added Soft Navy on hover, and ensured we use your modern sans font!
              className={`text-lg transition-colors duration-200 md:text-xl font-sans ${
                menuItem?._type === 'home' 
                  ? 'font-extrabold text-stone-800 hover:text-[#4A5D6E]' 
                  : 'font-medium text-stone-500 hover:text-[#4A5D6E]'
              }`}
              data-sanity={dataAttribute?.([
                'menuItems',
                {_key: menuItem._key as unknown as string},
              ])}
              href={href}
            >
              {stegaClean(menuItem.title)}
            </Link>
          )
        })}
      </OptimisticSortOrder>
    </header>
  )
}