// components/home/HomeSections.tsx — server components for each homepage block.
// Order and visibility come from `home.sections` (Studio); copy has code defaults.

import Link from 'next/link'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import ImageBox from '@/components/ImageBox'
import { ProjectIconLinks } from '@/components/portfolio/ProjectLinks'
import { CurrentlyReading } from '@/components/knowledge/CurrentlyReading'
import { RecentlyTended } from '@/components/knowledge/RecentlyTended'
import { formatDate } from '@/lib/dates'
import { articleTypeMeta } from '@/lib/site'
import { navHref, type NavigationData } from '@/lib/cms/defaults/navigation'
import type { HomeSection } from '@/lib/cms/defaults/home'
import type { TaxonomyData } from '@/lib/cms/defaults/taxonomy'
import type { SiteSettings } from '@/lib/cms/loaders'
import type { HomeIntelQueryResult, HomePageQueryResult } from '@/sanity.types'

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

const pt: PortableTextComponents = {
  marks: {
    link: ({ children, value }) => {
      const href: string = value?.href ?? '#'
      const external = !href.startsWith('/')
      return (
        <a href={href} className={`text-white underline decoration-stone-600 underline-offset-4 hover:decoration-white transition-colors ${FOCUS}`} target={external ? '_blank' : undefined} rel={external ? 'noreferrer noopener' : undefined}>
          {children}
        </a>
      )
    },
    strong: ({ children }) => <strong className="font-bold text-stone-100">{children}</strong>,
  },
  block: { normal: ({ children }) => <p className="mb-2 last:mb-0">{children}</p> },
}

export type HomeData = NonNullable<HomePageQueryResult>
export type HomeContext = {
  data: HomeData
  intel: HomeIntelQueryResult | null
  settings: SiteSettings
  nav: NavigationData
  taxonomy: TaxonomyData
}

type S<T extends HomeSection['_type']> = Extract<HomeSection, { _type: T }>

function SectionHeading({ id, children, cta }: { id: string; children: React.ReactNode; cta?: { label: string; href: string } }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-10">
      <h2 id={id} className="text-stone-50 text-2xl md:text-3xl font-serif font-bold">{children}</h2>
      {cta && <Link href={cta.href} className={`font-sans text-sm text-stone-400 hover:text-white rounded-sm ${FOCUS}`}>{cta.label} →</Link>}
    </div>
  )
}

export function HeroSection({ s, ctx }: { s: S<'homeHero'>; ctx: HomeContext }) {
  const { data, nav, settings } = ctx
  return (
    <section className="relative w-full flex flex-col justify-center p-6 md:p-12 lg:p-20 lg:min-h-[70vh]" aria-labelledby="hero-name">
      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
        <div className={`${s.showNav ? 'lg:col-span-2' : 'lg:col-span-5'} flex flex-col items-start space-y-6`}>
          <h1 id="hero-name" className="text-stone-50 text-4xl md:text-6xl lg:text-7xl font-serif tracking-tight font-bold leading-[0.95]">
            {data.title || settings.siteName}
          </h1>
          <div className="text-stone-300 font-sans text-base leading-relaxed max-w-md">
            {data.overview ? <PortableText value={data.overview} components={pt} /> : settings.description}
          </div>
        </div>
        {s.showNav && (
          <nav aria-label="Sections" className="lg:col-span-3 flex flex-col w-full">
            {nav.primary.map((item) => (
              <Link key={navHref(item) + item.label} href={navHref(item)} className={`group relative flex items-center justify-between py-5 md:py-7 border-b border-white/5 hover:border-white/20 transition-all duration-500 hover:pl-4 ${FOCUS} rounded-sm`}>
                <span className="flex flex-col">
                  <span className="text-white text-2xl md:text-4xl font-serif">{item.label}</span>
                  {item.description && <span className="text-stone-400 font-sans text-sm mt-1">{item.description}</span>}
                </span>
                <span className="w-8 h-px bg-stone-700 group-hover:w-12 group-hover:bg-white transition-all" aria-hidden="true" />
              </Link>
            ))}
          </nav>
        )}
      </div>
      <div className="relative z-10 w-full max-w-6xl mx-auto mt-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 font-sans text-sm text-stone-400 border-t border-white/5 pt-6">
        <div className="flex flex-col md:flex-row gap-2 md:gap-8">
          {data.currently && <p><span className="text-stone-400 mr-2">{s.currentlyLabel}:</span>{data.currently}</p>}
          <p><span className="text-stone-400 mr-2">{s.locationLabel}:</span>{data.location || `${settings.location.city}, ${settings.location.region}`}</p>
        </div>
        {s.footnote && <span className="text-stone-400">{s.footnote}</span>}
      </div>
    </section>
  )
}

export function OpenToSection({ s, ctx }: { s: S<'homeOpenTo'>; ctx: HomeContext }) {
  const openTo = ctx.settings.openTo?.trim()
  if (!openTo) return null
  return (
    <section className="w-full max-w-6xl mx-auto px-6 md:px-12 py-6" aria-label="Availability">
      <p className="inline-flex flex-wrap items-center gap-3 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-4 py-2 font-sans text-sm text-emerald-200">
        <span className="inline-flex rounded-full h-2 w-2 bg-emerald-400" aria-hidden="true" />
        {openTo}
        <Link href="/contact" className={`underline underline-offset-4 decoration-emerald-500/50 hover:decoration-emerald-200 ${FOCUS} rounded-sm`}>{s.ctaLabel}</Link>
      </p>
    </section>
  )
}

export function AboutSection({ s, ctx }: { s: S<'homeAbout'>; ctx: HomeContext }) {
  const { data, settings } = ctx
  const profileImage = data.profileImage
  const bio = data.aspirations || s.fallbackBio
  return (
    <section className="w-full max-w-6xl mx-auto py-20 md:py-28 px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center border-t border-white/5" aria-labelledby="about-heading">
      <div className="relative group aspect-[4/5] bg-stone-900 rounded-2xl overflow-hidden border border-white/5">
        {profileImage ? (
          <ImageBox image={profileImage} alt={profileImage.alt !== 'Image' ? profileImage.alt : `${settings.siteName}, portrait`} sizes="(max-width: 1024px) 100vw, 50vw" width={1200} classesWrapper="h-full w-full rounded-none" imageClassName="grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 opacity-80 group-hover:opacity-100" />
        ) : (
          <div className="w-full h-full bg-stone-800 flex items-center justify-center text-stone-400 font-sans text-sm">{s.imagePlaceholder}</div>
        )}
      </div>
      <div className="space-y-8">
        <div className="space-y-4">
          <p className="section-label">{s.heading}</p>
          <h2 id="about-heading" className="text-stone-50 text-4xl md:text-5xl font-serif font-bold tracking-tight leading-[1.1] whitespace-pre-wrap">
            {data.manifesto || s.fallbackManifesto}
          </h2>
        </div>
        <div className="space-y-4 text-stone-300 font-sans text-base leading-relaxed max-w-md border-l border-stone-800 pl-6 whitespace-pre-wrap">
          {bio.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
        </div>
        {data.expertisePillars && data.expertisePillars.length > 0 && (
          <ul className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5 list-none m-0 p-0">
            {data.expertisePillars.map((pillar, i) => (
              <li key={`${pillar.title}-${i}`}>
                <span className="block text-white font-serif text-lg">{pillar.title}</span>
                <span className="text-stone-400 font-sans text-sm mt-1 block">{pillar.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export function ShowcaseSection({ s, ctx }: { s: S<'homeShowcase'>; ctx: HomeContext }) {
  const showcase = (ctx.data.showcaseProjects ?? []).filter((p) => p.slug).slice(0, s.limit || 3)
  if (showcase.length === 0) return null
  return (
    <section className="w-full max-w-6xl mx-auto py-20 px-6 md:px-12 border-t border-white/5" aria-labelledby="showcase-heading">
      <SectionHeading id="showcase-heading" cta={{ label: s.ctaLabel, href: '/projects' }}>{s.heading}</SectionHeading>
      <ul className={`grid grid-cols-1 gap-6 list-none m-0 p-0 ${showcase.length === 1 ? 'md:grid-cols-1' : showcase.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {showcase.map((project) => (
          <li key={project._key} className="group rounded-xl overflow-hidden bg-[#111] border border-white/5 hover:border-white/20 focus-within:border-white/30 transition-colors flex flex-col">
            <Link href={`/projects/${project.slug}`} className={`block relative aspect-[16/10] overflow-hidden border-b border-white/5 ${FOCUS}`} aria-label={project.title ?? 'Project'}>
              {project.coverImage ? (
                <ImageBox image={project.coverImage} alt={project.coverImage.alt !== 'Image' ? project.coverImage.alt : (project.title ?? '')} sizes="(max-width: 768px) 100vw, 33vw" width={900} classesWrapper="h-full w-full rounded-none" imageClassName="opacity-80 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-700" />
              ) : (
                <div className="h-full w-full bg-[#1a1a1a]" />
              )}
            </Link>
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-xl font-serif font-bold text-white"><Link href={`/projects/${project.slug}`} className={`${FOCUS} rounded-sm`}>{project.title}</Link></h3>
                <ProjectIconLinks title={project.title} githubUrl={project.githubUrl} liveUrl={project.liveUrl} className="shrink-0" />
              </div>
              {project.role && <p className="text-stone-400 font-sans text-sm mb-3">{project.role}</p>}
              {project.outcome ? (
                <p className="text-stone-300 text-sm leading-relaxed line-clamp-3">{project.outcome}</p>
              ) : project.overview ? (
                <div className="text-stone-400 text-sm leading-relaxed line-clamp-3"><PortableText value={project.overview} components={pt} /></div>
              ) : null}
              {project.techStack && project.techStack.length > 0 && (
                <ul className="flex flex-wrap gap-2 mt-auto pt-4 list-none m-0 p-0" aria-label="Tech stack">
                  {project.techStack.slice(0, 4).map((t) => <li key={t} className="px-2 py-1 text-xs font-sans bg-white/5 border border-white/10 text-stone-300 rounded-sm">{t}</li>)}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function WritingSection({ s, ctx }: { s: S<'homeWriting'>; ctx: HomeContext }) {
  const featured = ctx.intel?.featuredPost ?? null
  const recents = (ctx.intel?.recentPosts ?? []).filter((p) => p.slug).slice(0, s.limit || 3)
  const lanes = ctx.taxonomy.articleLanes
  if (!featured && recents.length === 0) return null
  return (
    <section className="w-full max-w-6xl mx-auto py-20 px-6 md:px-12 border-t border-white/5" aria-labelledby="writing-heading">
      <SectionHeading id="writing-heading" cta={{ label: 'All writing', href: '/blog' }}>{s.heading}</SectionHeading>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {featured && featured.slug && (
          <Link href={`/blog/${featured.slug}`} className={`lg:col-span-7 group block relative rounded-xl overflow-hidden bg-[#111] border border-white/5 hover:border-white/20 transition-colors duration-500 ${FOCUS}`}>
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
              {featured.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${featured.imageUrl}?w=1200&auto=format`} alt="" width={1200} height={675} loading="lazy" className="h-full w-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
              ) : (
                <div className="w-full h-full bg-[#1a1a1a]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/40 to-transparent" aria-hidden="true" />
              <span className="absolute top-4 left-4 border border-white/10 bg-black/50 backdrop-blur-md px-3 py-1 rounded-sm text-xs font-sans text-white">{s.featuredBadge}</span>
            </div>
            <div className="p-8">
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3 group-hover:text-stone-200 transition-colors">{featured.title}</h3>
              {featured.excerpt && <p className="text-stone-400 text-sm leading-relaxed mb-6 line-clamp-2">{featured.excerpt}</p>}
              <div className="flex items-center gap-4 font-sans text-sm text-stone-400">
                <span>{formatDate(featured.publishedAt, 'short', 'Draft')}</span>
                {articleTypeMeta(featured.articleType, lanes) && <span style={{ color: articleTypeMeta(featured.articleType, lanes)!.color }}>{articleTypeMeta(featured.articleType, lanes)!.label}</span>}
                <span className="ml-auto group-hover:text-white transition-colors">{s.readLabel} →</span>
              </div>
            </div>
          </Link>
        )}
        {recents.length > 0 && (
          <div className={`${featured ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
            <h3 className="section-label mb-4 border-b border-white/5 pb-3">{s.recentHeading}</h3>
            <ul className="flex flex-col gap-4 list-none m-0 p-0">
              {recents.map((post) => (
                <li key={post._id}>
                  <Link href={`/blog/${post.slug}`} className={`group block p-5 rounded-xl bg-[#111] border border-white/5 hover:border-white/20 transition-colors ${FOCUS}`}>
                    <span className="block text-lg font-serif font-bold text-white group-hover:text-stone-200">{post.title}</span>
                    <span className="flex items-center gap-3 font-sans text-sm text-stone-400 mt-2">
                      <span>{formatDate(post.publishedAt, 'short', 'Draft')}</span>
                      {articleTypeMeta(post.articleType, lanes) && <span style={{ color: articleTypeMeta(post.articleType, lanes)!.color }}>{articleTypeMeta(post.articleType, lanes)!.short}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

export function ReadingSection({ s, ctx }: { s: S<'homeReading'>; ctx: HomeContext }) {
  const items = ctx.intel?.currentlyReading ?? []
  if (items.length === 0) return null
  return (
    <section className="w-full max-w-6xl mx-auto py-16 px-6 md:px-12 border-t border-white/5" aria-labelledby="reading-heading">
      <SectionHeading id="reading-heading" cta={{ label: s.ctaLabel, href: '/library' }}>{s.heading}</SectionHeading>
      <CurrentlyReading items={items} title="" />
    </section>
  )
}

export function NotesSection({ s, ctx }: { s: S<'homeNotes'>; ctx: HomeContext }) {
  const notes = ctx.intel?.recentNotes ?? []
  if (notes.length === 0) return null
  return (
    <section className="w-full max-w-6xl mx-auto py-16 px-6 md:px-12 border-t border-white/5" aria-labelledby="notes-heading">
      <SectionHeading id="notes-heading" cta={{ label: s.ctaLabel, href: '/garden' }}>{s.heading}</SectionHeading>
      <RecentlyTended notes={notes} title="" />
    </section>
  )
}

export function SectionRenderer({ sections, ctx }: { sections: HomeSection[]; ctx: HomeContext }) {
  return (
    <>
      {sections.filter((s) => s.enabled !== false).map((s, i) => {
        const key = `${s._type}-${i}`
        switch (s._type) {
          case 'homeHero': return <HeroSection key={key} s={s} ctx={ctx} />
          case 'homeOpenTo': return <OpenToSection key={key} s={s} ctx={ctx} />
          case 'homeAbout': return <AboutSection key={key} s={s} ctx={ctx} />
          case 'homeShowcase': return <ShowcaseSection key={key} s={s} ctx={ctx} />
          case 'homeWriting': return <WritingSection key={key} s={s} ctx={ctx} />
          case 'homeReading': return <ReadingSection key={key} s={s} ctx={ctx} />
          case 'homeNotes': return <NotesSection key={key} s={s} ctx={ctx} />
          default: return null
        }
      })}
    </>
  )
}
