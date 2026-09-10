// app/(personal)/projects/page.tsx
import ImageBox from '@/components/ImageBox'
import { ProjectIconLinks, RepoMetaLine } from '@/components/portfolio/ProjectLinks'
import { yearOf } from '@/lib/dates'
import { getRepoMetaMap } from '@/lib/github'
import { sanityFetch } from '@/sanity/lib/live'
import { projectsQuery } from '@/sanity/lib/queries'
import type { Metadata } from 'next'
import Link from 'next/link'
import { toPlainText } from 'next-sanity'
import { getCopy } from '@/lib/cms/loaders'
import { personalPagesQuery } from '@/sanity/lib/queries-services'
import { DEFAULT_PERSONAL_PAGES } from '@/lib/cms/defaults/personalPages'
import { FOCUS } from '@/lib/ui'

export async function generateMetadata(): Promise<Metadata> {
  const h = (await getCopy(personalPagesQuery, DEFAULT_PERSONAL_PAGES)).projects.header
  return { title: h.metaTitle || h.title, description: h.metaDescription || h.lede }
}

export default async function ProjectsIndexRoute() {
  const copy = (await getCopy(personalPagesQuery, DEFAULT_PERSONAL_PAGES)).projects
  const { data: projects } = await sanityFetch({ query: projectsQuery })
  const sorted = [...projects].sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
  const repos = await getRepoMetaMap(sorted.map((p) => p.githubUrl))

  return (
    <div className="w-full min-h-screen text-stone-300 pb-24">
      <div className="max-w-6xl mx-auto pt-24 space-y-12">
        <div className="border-b border-white/5 pb-12">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight">{copy.header.title}</h1>
          <p className="mt-4 text-stone-400 font-sans text-base max-w-xl">{copy.header.lede}</p>
        </div>

        {sorted.length === 0 ? (
          <p className="py-24 text-center font-sans text-stone-400 text-sm">{copy.emptyState}</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-8 list-none m-0 p-0">
            {sorted.map((project) => {
              const startYear = yearOf(project.duration?.start)
              const endYear = project.duration?.end ? yearOf(project.duration.end) : copy.card.presentLabel
              const repo = project.githubUrl ? repos.get(project.githubUrl) : undefined
              const href = `/projects/${project.slug}`
              return (
                <li key={project._id} className="group relative rounded-xl overflow-hidden bg-[#111] border border-white/5 hover:border-white/20 focus-within:border-white/30 transition-colors duration-500 flex flex-col">
                  <Link href={href} className={`block relative aspect-[16/9] w-full overflow-hidden border-b border-white/5 ${FOCUS}`} aria-label={project.title ?? 'Project'}>
                    {project.coverImage ? (
                      <ImageBox
                        image={project.coverImage}
                        alt={project.coverImage.alt !== 'Image' ? project.coverImage.alt : (project.title ?? '')}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        width={1200}
                        classesWrapper="h-full w-full rounded-none"
                        imageClassName="opacity-80 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center font-mono text-stone-400 text-xs">{copy.card.noCoverLabel}</div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      {project.featured && (
                        <span className="meta-label bg-amber-500 text-black px-2 py-1 rounded-sm font-bold">{copy.card.featuredBadge}</span>
                      )}
                      {startYear && (
                        <span className="meta-label bg-black/60 backdrop-blur-md px-2 py-1 rounded-sm border border-white/10 text-white">
                          {startYear} – {endYear}
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h2 className="text-2xl font-serif font-bold text-white group-hover:text-stone-200 transition-colors">
                        <Link href={href} className={`${FOCUS} rounded-sm`}>{project.title}</Link>
                      </h2>
                      <ProjectIconLinks title={project.title} githubUrl={project.githubUrl} liveUrl={project.liveUrl} className="shrink-0" />
                    </div>

                    {project.role && (
                      <p className="meta-label text-stone-400 mb-3">{project.role}</p>
                    )}

                    {project.outcome ? (
                      <p className="text-stone-300 text-sm leading-relaxed mb-4 line-clamp-3">
                        <span className="meta-label text-amber-400 mr-2">{copy.card.outcomeLabel}</span>{project.outcome}
                      </p>
                    ) : project.overview ? (
                      <p className="text-stone-400 text-sm leading-relaxed mb-4 line-clamp-3">{toPlainText(project.overview)}</p>
                    ) : null}

                    {repo && <RepoMetaLine meta={repo} className="mb-4" />}

                    {project.techStack && project.techStack.length > 0 && (
                      <ul className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-white/5 list-none m-0 p-0" aria-label="Tech stack">
                        {project.techStack.slice(0, 5).map((tech) => (
                          <li key={tech} className="px-2 py-1 text-xs font-mono tracking-wide bg-white/5 border border-white/10 text-stone-300 rounded-sm">{tech}</li>
                        ))}
                        {project.techStack.length > 5 && (
                          <li className="px-2 py-1 text-xs font-mono tracking-wide text-stone-400">+{project.techStack.length - 5}</li>
                        )}
                      </ul>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
