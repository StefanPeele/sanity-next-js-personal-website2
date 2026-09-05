// components/HomePage.tsx — server component. Sections come from Studio → Site → Home → Sections.

import { SectionRenderer, type HomeContext } from '@/components/home/HomeSections'
import { DEFAULT_HOME_SECTIONS, type HomeSection } from '@/lib/cms/defaults/home'
import { withDefaults } from '@/lib/cms/withDefaults'

export function HomePage(ctx: HomeContext) {
  const raw = (ctx.data.sections ?? []) as Partial<HomeSection>[]
  // Merge each Studio section over its default (by _type); unknown types are dropped.
  const sections: HomeSection[] =
    raw.length > 0
      ? raw
          .map((s) => {
            const def = DEFAULT_HOME_SECTIONS.find((d) => d._type === s._type)
            return def ? (withDefaults(s, def) as HomeSection) : null
          })
          .filter((s): s is HomeSection => s !== null)
      : DEFAULT_HOME_SECTIONS

  return (
    <div className="w-full flex flex-col items-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900/40 via-black to-black">
      <SectionRenderer sections={sections} ctx={ctx} />
    </div>
  )
}
