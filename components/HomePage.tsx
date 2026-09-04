// components/HomePage.tsx
// Server component. The only client state on the page lives in small islands
// (none are needed here today — hover effects are CSS).

import Link from 'next/link'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import ImageBox from '@/components/ImageBox'
import { ProjectIconLinks } from '@/components/portfolio/ProjectLinks'
import { CurrentlyReading } from '@/components/knowledge/CurrentlyReading'
import { RecentlyTended } from '@/components/knowledge/RecentlyTended'
import { formatDate } from '@/lib/dates'
import { PRIMARY_NAV, SITE, articleTypeMeta } from '@/lib/site'
import type { HomeIntelQueryResult, HomePageQueryResult, SettingsQueryResult } from '@/sanity.types'

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

const portableTextComponents: PortableTextComponents = {
  marks: {
    link: ({ children, value }) => {
      const href: string = value?.href ?? '#'
      const external = !href.startsWith('/')
      return (
        <a
          href={href}
          className={`text-white underline decoration-stone-600 underline-offset-4 hover:decoration-white transition-colors ${FOCUS}`}
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer noopener' : undefined}
        >
          {children}
        </a>
      )
    },
    strong: ({ children }) => <strong className="font-bold text-stone-100">{children}</strong>,
  },
  block: {
    normal: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  },
}

interface HomePageProps {
  data: NonNullable<HomePageQueryResult>
  intelData?: HomeIntelQueryResult | null
  settings?: SettingsQueryResult | null
}

export function HomePage({ data, intelData, settings }: HomePageProps) {
  const profileImage = data.profileImage
  const featured = intelData?.featuredPost ?? null
  const recents = intelData?.recentPosts ?? []
  const showcase = (data.showcaseProjects ?? []).filter((p) => p.slug).slice(0, 3)
  const reading = intelData?.currentlyReading ?? []
  const notes = intelData?.recentNotes ?? []
  const openTo = settings?.openTo?.trim()

  return (
    <div className="w-full flex flex-col items-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900/40 via-black to-black">

      {/* ── 1. HERO DIRECTORY ───────────────────────────────────── */}
      <section className="group/hero relative w-full overflow-hidden flex flex-col justify-center p-6 md:p-12 lg:p-20 lg:min-h-[80vh]" aria-labelledby="hero-name">
        {/* Portrait fades in while the name is hovered — pure CSS. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 pointer-events-none opacity-0 scale-105 transition-[opacity,transform] duration-700 ease-out group-has-[.hero-name:hover]/hero:opacity-30 group-has-[.hero-name:hover]/hero:scale-100 bg-cover bg-center"
          style={{ backgroundImage: 'url("/fabshots2026051.jpg")', filter: 'grayscale(100%) contrast(120%) brightness(0.8)' }}
        />

        <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-2 flex flex-col items-start space-y-6">
            <span className="text-stone-400 font-mono text-[10px] tracking-[0.4em] uppercase border-l border-stone-700 pl-4">
              Directory / Index
            </span>
            <h1 id="hero-name" className="hero-name text-stone-50 text-4xl md:text-6xl lg:text-7xl font-serif tracking-tight font-bold leading-[0.9] cursor-default">
              {data.title || SITE.name}
            </h1>
            <div className="text-stone-300 font-sans text-sm leading-relaxed max-w-xs">
              {data.overview ? <PortableText value={data.overview} components={portableTextComponents} /> : SITE.description}
            </div>
            {openTo && (
              <p className="inline-flex items-center gap-3 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                {openTo}
                <Link href="/contact" className={`text-emerald-200 underline underline-offset-4 decoration-emerald-500/50 hover:decoration-emerald-200 ${FOCUS} rounded-sm`}>Contact →</Link>
              </p>
            )}
          </div>

          <nav aria-label="Sections" className="lg:col-span-3 flex flex-col w-full">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center justify-between py-5 md:py-7 border-b border-white/5 hover:border-white/20 transition-all duration-500 hover:pl-4 ${FOCUS} rounded-sm`}
              >
                <span className="flex flex-col">
                  <span className="text-white text-2xl md:text-4xl font-serif">{item.name}</span>
                  <span className="text-stone-400 font-mono text-[9px] tracking-[0.3em] uppercase mt-1 md:opacity-0 md:-translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 transition-all">
                    {item.desc}
                  </span>
                </span>
                <span className="w-8 h-px bg-stone-700 group-hover:w-12 group-hover:bg-white transition-all" aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto mt-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[9px] font-mono tracking-widest text-stone-400 uppercase border-t border-white/5 pt-6">
          <div className="flex flex-col md:flex-row gap-2 md:gap-8">
            <p><span className="text-stone-500 mr-2">Currently:</span>{data.currently || 'Studying, shooting, building'}</p>
            <p><span className="text-stone-500 mr-2">Location:</span>{data.location || `${SITE.location.city}, ${SITE.location.region}`}</p>
          </div>
          <span className="text-stone-500">{new Date().getFullYear()} archive — NJIT</span>
        </div>
      </section>

      {/* ── 2. PROFILE ──────────────────────────────────────────── */}
      <section className="w-full max-w-6xl mx-auto py-24 md:py-32 px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center" aria-labelledby="manifesto">
        <div className="relative group aspect-[4/5] bg-stone-900 rounded-2xl overflow-hidden border border-white/5">
          {profileImage ? (
            <ImageBox
              image={profileImage}
              alt={profileImage.alt !== 'Image' ? profileImage.alt : `${SITE.name}, portrait`}
              sizes="(max-width: 1024px) 100vw, 50vw"
              width={1200}
              classesWrapper="h-full w-full rounded-none"
              imageClassName="grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 opacity-80 group-hover:opacity-100"
            />
          ) : (
            <div className="w-full h-full bg-stone-800 flex items-center justify-center text-stone-400 font-mono text-[10px] uppercase tracking-widest">
              Add a profile image in the Studio
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <span className="text-stone-400 font-mono text-[10px] tracking-[0.4em] uppercase">About</span>
            <h2 id="manifesto" className="text-stone-50 text-4xl md:text-5xl font-serif font-bold tracking-tight leading-[1.1] whitespace-pre-wrap">
              {data.manifesto || 'Logic in infrastructure.\nIntent in imagery.'}
            </h2>
          </div>

          <div className="space-y-6 text-stone-300 font-sans text-sm md:text-base leading-relaxed max-w-md border-l border-stone-800 pl-6 whitespace-pre-wrap">
            {data.aspirations ? (
              <p>{data.aspirations}</p>
            ) : (
              <>
                <p>
                  I study IT security at NJIT and work as a network engineer associate intern at a fabrication company in New Jersey —
                  SAN storage, Active Directory, PowerShell automation and backup. On weekends I photograph sports, portraits and events.
                </p>
                <p>
                  Both jobs are the same discipline: understand the system, remove what does not belong, and make the result legible to the next person.
                </p>
              </>
            )}
          </div>

          {data.expertisePillars && data.expertisePillars.length > 0 && (
            <ul className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5 list-none m-0 p-0">
              {data.expertisePillars.map((pillar, i) => (
                <li key={`${pillar.title}-${i}`}>
                  <span className="block text-white font-serif text-lg">{pillar.title}</span>
                  <span className="text-stone-400 font-mono text-[9px] uppercase tracking-widest mt-1 block">{pillar.description}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── 3. SHOWCASE PROJECTS ────────────────────────────────── */}
      {showcase.length > 0 && (
        <section className="w-full max-w-6xl mx-auto py-24 px-6 md:px-12 border-t border-white/5" aria-labelledby="showcase-heading">
          <div className="flex items-center justify-between gap-4 mb-12">
            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-stone-700" aria-hidden="true" />
              <h2 id="showcase-heading" className="font-mono text-[10px] tracking-[0.4em] text-stone-400 uppercase font-sans">Selected work</h2>
            </div>
            <Link href="/projects" className={`font-mono text-[10px] uppercase tracking-widest text-stone-400 hover:text-white ${FOCUS} rounded-sm`}>All projects →</Link>
          </div>
          <ul className={`grid grid-cols-1 gap-6 list-none m-0 p-0 ${showcase.length === 1 ? 'md:grid-cols-1' : showcase.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            {showcase.map((project) => (
              <li key={project._key} className="group rounded-xl overflow-hidden bg-[#111] border border-white/5 hover:border-white/20 focus-within:border-white/30 transition-colors flex flex-col">
                <Link href={`/projects/${project.slug}`} className={`block relative aspect-[16/10] overflow-hidden border-b border-white/5 ${FOCUS}`} aria-label={project.title ?? 'Project'}>
                  {project.coverImage ? (
                    <ImageBox
                      image={project.coverImage}
                      alt={project.coverImage.alt !== 'Image' ? project.coverImage.alt : (project.title ?? '')}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      width={900}
                      classesWrapper="h-full w-full rounded-none"
                      imageClassName="opacity-80 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-700"
                    />
                  ) : (
                    <div className="h-full w-full bg-[#1a1a1a]" />
                  )}
                </Link>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-xl font-serif font-bold text-white">
                      <Link href={`/projects/${project.slug}`} className={`${FOCUS} rounded-sm`}>{project.title}</Link>
                    </h3>
                    <ProjectIconLinks title={project.title} githubUrl={project.githubUrl} liveUrl={project.liveUrl} className="shrink-0" />
                  </div>
                  {project.role && <p className="font-mono text-[9px] uppercase tracking-widest text-stone-400 mb-3">{project.role}</p>}
                  {project.outcome ? (
                    <p className="text-stone-300 text-sm leading-relaxed line-clamp-3">{project.outcome}</p>
                  ) : project.overview ? (
                    <div className="text-stone-400 text-sm leading-relaxed line-clamp-3"><PortableText value={project.overview} components={portableTextComponents} /></div>
                  ) : null}
                  {project.techStack && project.techStack.length > 0 && (
                    <ul className="flex flex-wrap gap-2 mt-auto pt-4 list-none m-0 p-0" aria-label="Tech stack">
                      {project.techStack.slice(0, 4).map((t) => (
                        <li key={t} className="px-2 py-1 text-[9px] font-mono tracking-wide bg-white/5 border border-white/10 text-stone-300 rounded-sm">{t}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── 4. LATEST WRITING + STRIPS ──────────────────────────── */}
      {(featured || recents.length > 0 || reading.length > 0 || notes.length > 0) && (
        <section className="w-full max-w-6xl mx-auto py-24 px-6 md:px-12 border-t border-white/5" aria-labelledby="intel-heading">
          <div className="flex items-center gap-4 mb-16">
            <div className="h-px w-12 bg-stone-700" aria-hidden="true" />
            <h2 id="intel-heading" className="font-mono text-[10px] tracking-[0.4em] text-stone-400 uppercase font-sans">Latest writing</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {featured && featured.slug && (
              <Link
                href={`/blog/${featured.slug}`}
                className={`lg:col-span-7 group block relative rounded-xl overflow-hidden bg-[#111] border border-white/5 hover:border-white/20 transition-colors duration-500 ${FOCUS}`}
              >
                <div className="relative h-64 md:h-80 w-full overflow-hidden">
                  {featured.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${featured.imageUrl}?w=1200&auto=format`}
                      alt=""
                      width={1200}
                      height={675}
                      loading="lazy"
                      className="h-full w-full object-cover grayscale opacity-60 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1a1a1a]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/40 to-transparent" aria-hidden="true" />
                  <div className="absolute top-4 left-4 border border-white/10 bg-black/50 backdrop-blur-md px-3 py-1 rounded-sm">
                    <span className="text-[9px] font-mono tracking-widest text-white uppercase">Featured</span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3 group-hover:text-stone-200 transition-colors">{featured.title}</h3>
                  {featured.excerpt && <p className="text-stone-400 text-sm leading-relaxed mb-6 line-clamp-2">{featured.excerpt}</p>}
                  <div className="flex items-center gap-4 font-mono text-[10px] text-stone-400 uppercase tracking-widest">
                    <span>{formatDate(featured.publishedAt, 'short', 'Draft')}</span>
                    {articleTypeMeta(featured.articleType) && (
                      <span style={{ color: articleTypeMeta(featured.articleType)!.color }}>{articleTypeMeta(featured.articleType)!.label}</span>
                    )}
                    <span className="group-hover:text-white transition-colors">Read →</span>
                  </div>
                </div>
              </Link>
            )}

            <div className={`${featured ? 'lg:col-span-5' : 'lg:col-span-12'} flex flex-col gap-10`}>
              {recents.length > 0 && (
                <div>
                  <h3 className="font-mono text-[10px] text-stone-400 tracking-widest uppercase mb-4 border-b border-white/5 pb-3 font-sans">Recent posts</h3>
                  <ul className="flex flex-col gap-4 list-none m-0 p-0">
                    {recents.filter((p) => p.slug).map((post) => (
                      <li key={post._id}>
                        <Link href={`/blog/${post.slug}`} className={`group block p-5 rounded-xl bg-[#111] border border-white/5 hover:border-white/20 transition-colors ${FOCUS}`}>
                          <span className="block text-lg font-serif font-bold text-white group-hover:text-stone-200">{post.title}</span>
                          <span className="flex items-center gap-3 font-mono text-[9px] text-stone-400 uppercase tracking-widest mt-3">
                            <span>{formatDate(post.publishedAt, 'short', 'Draft')}</span>
                            {articleTypeMeta(post.articleType) && (
                              <span style={{ color: articleTypeMeta(post.articleType)!.color }}>{articleTypeMeta(post.articleType)!.short}</span>
                            )}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <CurrentlyReading items={reading} />
              <RecentlyTended notes={notes} />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
