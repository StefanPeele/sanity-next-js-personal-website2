// app/(personal)/projects/[slug]/page.tsx
import {CustomPortableText} from '@/components/CustomPortableText'
import {Header} from '@/components/Header'
import ImageBox from '@/components/ImageBox'
import {JsonLd} from '@/components/JsonLd'
import {ProjectIconLinks, RepoMetaLine} from '@/components/portfolio/ProjectLinks'
import {formatDate, yearOf} from '@/lib/dates'
import {getRepoMeta} from '@/lib/github'
import {SITE, absoluteUrl, articleTypeMeta} from '@/lib/site'
import {studioUrl} from '@/sanity/lib/api'
import {client} from '@/sanity/lib/client'
import {sanityFetch} from '@/sanity/lib/live'
import {projectBySlugQuery, slugsByTypeQuery} from '@/sanity/lib/queries'
import {urlForOpenGraphImage} from '@/sanity/lib/utils'
import type {Metadata, ResolvingMetadata} from 'next'
import {createDataAttribute, toPlainText, type PortableTextBlock} from 'next-sanity'
import {draftMode} from 'next/headers'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import type {Image as SanityImage} from 'sanity'
import { getCopy } from '@/lib/cms/loaders'
import { personalPagesQuery } from '@/sanity/lib/queries-services'
import { DEFAULT_PERSONAL_PAGES } from '@/lib/cms/defaults/personalPages'
import { FOCUS } from '@/lib/ui'
import { ArrowRight } from 'lucide-react'

type Props = {params: Promise<{slug: string}>}

type RelatedPost = {title: string | null; slug: string | null; articleType: string | null}
type RelatedNote = {title: string | null; slug: string | null; status: string | null}

export async function generateMetadata({params}: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const {slug} = await params
  const {data: project} = await sanityFetch({query: projectBySlugQuery, params: {slug}, stega: false})
  if (!project) return {}
  const ogImage = urlForOpenGraphImage(project.coverImage as SanityImage | null)
  const description = project.outcome ?? (project.overview ? toPlainText(project.overview) : (await parent).description ?? undefined)
  return {
    title: project.title,
    description,
    alternates: {canonical: absoluteUrl(`/projects/${slug}`)},
    openGraph: {
      title: project.title ?? undefined,
      description,
      type: 'article',
      images: ogImage ? [ogImage] : (await parent).openGraph?.images ?? [],
    },
  }
}

export async function generateStaticParams() {
  const data = await client.fetch(slugsByTypeQuery, {type: 'project'})
  return data.filter((d) => !!d.slug).map((d) => ({slug: d.slug as string}))
}

function Section({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-6 border-t border-white/5">
      <h2 className="meta-label md:col-span-3 text-stone-400 pt-1">{label}</h2>
      <div className="md:col-span-9 text-stone-300 text-base leading-relaxed whitespace-pre-line">{children}</div>
    </section>
  )
}

export default async function ProjectSlugRoute({params}: Props) {
  const copy = (await getCopy(personalPagesQuery, DEFAULT_PERSONAL_PAGES)).projects.detail
  const {slug} = await params
  const {data} = await sanityFetch({query: projectBySlugQuery, params: {slug}})

  if (!data?._id && !(await draftMode()).isEnabled) notFound()

  const dataAttribute =
    data?._id && data._type ? createDataAttribute({baseUrl: studioUrl, id: data._id, type: data._type}) : null

  const {
    client: clientName, coverImage, description, duration, overview, tags, title, techStack,
    githubUrl, liveUrl, boardUrl, docsUrl, architecture, role, problem, constraints, approach,
    outcome, metrics, retrospective,
  } = data ?? {}

  const relatedPosts = ((data?.relatedPosts ?? []) as unknown as (RelatedPost | null)[]).filter((p): p is RelatedPost => !!p?.slug)
  const relatedNotes = ((data?.relatedNotes ?? []) as unknown as (RelatedNote | null)[]).filter((n): n is RelatedNote => !!n?.slug)
  const tagList = (tags ?? []) as unknown as string[]
  const repo = await getRepoMeta(githubUrl)

  const startYear = yearOf(duration?.start)
  const endYear = duration?.end ? yearOf(duration.end) : copy.metaLabels.timeline && 'Present'
  const hasCaseStudy = !!(role || problem || (constraints && constraints.length) || approach || outcome || (metrics && metrics.length) || retrospective)

  const jsonLd = data?._id
    ? {
        '@context': 'https://schema.org',
        '@type': githubUrl ? 'SoftwareSourceCode' : 'CreativeWork',
        name: title,
        headline: title,
        description: outcome ?? (overview ? toPlainText(overview) : undefined),
        url: absoluteUrl(`/projects/${slug}`),
        ...(githubUrl ? {codeRepository: githubUrl, programmingLanguage: repo?.language ?? undefined} : {}),
        keywords: [...(techStack ?? []), ...tagList].join(', ') || undefined,
        author: {'@type': 'Person', name: SITE.name, url: SITE.url},
        dateModified: data._updatedAt,
        ...(duration?.start ? {dateCreated: formatDate(duration.start, 'iso')} : {}),
        image: coverImage?.url ?? undefined,
      }
    : null

  return (
    <div className="w-full min-h-screen text-stone-300 pb-24">
      {jsonLd && <JsonLd data={jsonLd} />}
      <article className="max-w-4xl mx-auto pt-24 space-y-12">

        <div className="border-b border-white/5 pb-8">
          <Header
            id={data?._id || null}
            type={data?._type || null}
            path={['overview']}
            eyebrow={copy.eyebrow}
            title={title || (data?._id ? 'Untitled' : 'Project not found')}
            description={overview as PortableTextBlock[] | null | undefined}
          />
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <ProjectIconLinks title={title} githubUrl={githubUrl} liveUrl={liveUrl} docsUrl={docsUrl} />
            {repo && <RepoMetaLine meta={repo} />}
          </div>
        </div>

        {/* Cover + metadata bar */}
        <div className="rounded-xl border border-white/5 overflow-hidden shadow-2xl bg-[#111]">
          {coverImage && (
            <ImageBox
              data-sanity={dataAttribute?.('coverImage')}
              image={coverImage}
              alt={coverImage.alt !== 'Image' ? coverImage.alt : (title ?? '')}
              sizes="(max-width: 1024px) 100vw, 896px"
              width={1800}
              priority
              classesWrapper="aspect-[21/9] w-full rounded-none"
            />
          )}
          <dl className="meta-label grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5 border-t border-white/5 text-stone-400 bg-[#0f0f0f] m-0">
            {startYear && (
              <div className="p-4 flex flex-col justify-center">
                <dt className="text-stone-400 mb-1">{copy.metaLabels.timeline}</dt>
                <dd className="text-stone-200 m-0" data-sanity={dataAttribute?.('duration.start')}>{startYear} – {endYear}</dd>
              </div>
            )}
            {clientName && (
              <div className="p-4 flex flex-col justify-center">
                <dt className="text-stone-400 mb-1">{copy.metaLabels.client}</dt>
                <dd className="text-stone-200 truncate m-0">{clientName}</dd>
              </div>
            )}
            {role && (
              <div className="p-4 flex flex-col justify-center">
                <dt className="text-stone-400 mb-1">{copy.metaLabels.role}</dt>
                <dd className="text-stone-200 m-0">{role}</dd>
              </div>
            )}
            {tagList.length > 0 && (
              <div className="p-4 flex flex-col justify-center">
                <dt className="text-stone-400 mb-1">{copy.metaLabels.tags}</dt>
                <dd className="flex gap-2 overflow-hidden whitespace-nowrap m-0">
                  {tagList.slice(0, 2).map((tag) => <span key={tag} className="text-stone-200">#{tag}</span>)}
                  {tagList.length > 2 && <span className="text-stone-400">+{tagList.length - 2}</span>}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Structured case study */}
        {hasCaseStudy && (
          <div>
            {problem && <Section label={copy.sectionLabels.problem}>{problem}</Section>}
            {constraints && constraints.length > 0 && (
              <Section label={copy.sectionLabels.constraints}>
                <ul className="space-y-2 list-none m-0 p-0">
                  {constraints.map((c) => (
                    <li key={c} className="flex items-start gap-3"><span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-stone-500" aria-hidden="true" />{c}</li>
                  ))}
                </ul>
              </Section>
            )}
            {approach && <Section label={copy.sectionLabels.approach}>{approach}</Section>}
            {outcome && (
              <Section label={copy.sectionLabels.outcome}>
                <p className="text-white text-lg font-serif leading-relaxed m-0">{outcome}</p>
              </Section>
            )}
            {metrics && metrics.length > 0 && (
              <section className="py-6 border-t border-white/5" aria-label="Metrics">
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 m-0">
                  {metrics.map((m) => (
                    <div key={m._key} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                      <dd className="font-serif text-2xl md:text-3xl text-white font-bold m-0 leading-tight">{m.value}</dd>
                      <dt className="meta-label text-stone-400 mt-2">{m.label}</dt>
 {m.note && <p className="text-xs text-stone-400 mt-1 leading-snug">{m.note}</p>}
                    </div>
                  ))}
                </dl>
              </section>
            )}
            {retrospective && <Section label={copy.sectionLabels.retrospective}>{retrospective}</Section>}
          </div>
        )}

        {/* Stack + action links */}
        {((techStack && techStack.length > 0) || githubUrl || liveUrl || boardUrl || docsUrl) && (
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 py-8 border-y border-white/5">
            {techStack && techStack.length > 0 && (
              <div className="flex-1">
                <h2 className="section-label mb-4 font-sans">{copy.sectionLabels.stack}</h2>
                <ul className="flex flex-wrap gap-2 list-none m-0 p-0">
                  {techStack.map((tech) => (
                    <li key={tech} className="px-3 py-1 text-xs font-mono tracking-wide bg-white/5 border border-white/10 text-stone-300 rounded-sm">{tech}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-3 min-w-[220px]">
              {githubUrl && (
                <a href={githubUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between px-4 py-2 text-xs font-mono tracking-widest uppercase bg-[#111] border border-white/10 hover:border-white/30 transition-colors rounded-sm text-stone-300 group ${FOCUS}`}>
                  <span>{copy.linkLabels.code}</span><span className="text-stone-400 group-hover:text-white" aria-hidden="true">↗</span>
                </a>
              )}
              {docsUrl && (
                <a href={docsUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between px-4 py-2 text-xs font-mono tracking-widest uppercase bg-[#111] border border-white/10 hover:border-white/30 transition-colors rounded-sm text-stone-300 group ${FOCUS}`}>
                  <span>{copy.linkLabels.docs}</span><span className="text-stone-400 group-hover:text-white" aria-hidden="true">↗</span>
                </a>
              )}
              {boardUrl && (
                <a href={boardUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between px-4 py-2 text-xs font-mono tracking-widest uppercase bg-[#111] border border-white/10 hover:border-white/30 transition-colors rounded-sm text-stone-300 group ${FOCUS}`}>
                  <span>{copy.linkLabels.board}</span><span className="text-stone-400 group-hover:text-white" aria-hidden="true">↗</span>
                </a>
              )}
              {liveUrl && (
                <a href={liveUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between px-4 py-2 text-xs font-mono tracking-widest uppercase bg-white text-black hover:bg-stone-200 transition-colors rounded-sm font-bold group ${FOCUS}`}>
                  <span>{copy.linkLabels.live}</span><ArrowRight size={14} aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Architecture */}
        {architecture && architecture.length > 0 && (
          <section className="space-y-6" aria-labelledby="arch-heading">
            <h2 id="arch-heading" className="section-label font-sans">{copy.sectionLabels.architecture}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {architecture.map((image, idx) => (
                <figure key={image._key} className="relative rounded-md overflow-hidden border border-white/5 bg-[#111] m-0">
                  <ImageBox
                    image={image}
                    alt={image.alt !== 'Image' ? image.alt : (image.caption ?? `Architecture diagram ${idx + 1}`)}
                    sizes="(max-width: 768px) 100vw, 448px"
                    width={1200}
                    classesWrapper="aspect-[4/3] w-full rounded-none"
                    imageClassName="object-contain"
                  />
                  {image.caption && (
                    <figcaption className="w-full bg-black/80 p-3 text-xs font-mono text-stone-400 border-t border-white/10">{image.caption}</figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* Free-form case study */}
        {description && (
          <section className="pt-8" aria-label="Full write-up">
            <CustomPortableText
              id={data?._id || null}
              type={data?._type || null}
              path={['description']}
              value={description as unknown as PortableTextBlock[]}
            />
          </section>
        )}

        {/* Related */}
        {(relatedPosts.length > 0 || relatedNotes.length > 0) && (
          <section className="pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8" aria-label="Related reading">
            {relatedPosts.length > 0 && (
              <div>
                <h2 className="section-label mb-4 font-sans">{copy.sectionLabels.relatedWriting}</h2>
                <ul className="space-y-2 list-none m-0 p-0">
                  {relatedPosts.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/blog/${p.slug}`} className={`text-stone-200 hover:text-white font-serif text-lg ${FOCUS} rounded-sm`}>
                        {p.title}
                      </Link>
                      {articleTypeMeta(p.articleType) && (
                        <span className="meta-label ml-2" style={{color: articleTypeMeta(p.articleType)!.color}}>
                          {articleTypeMeta(p.articleType)!.short}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {relatedNotes.length > 0 && (
              <div>
                <h2 className="section-label mb-4 font-sans">{copy.sectionLabels.relatedNotes}</h2>
                <ul className="space-y-2 list-none m-0 p-0">
                  {relatedNotes.map((n) => (
                    <li key={n.slug}>
                      <Link href={`/garden/${n.slug}`} className={`text-stone-200 hover:text-white font-serif text-lg ${FOCUS} rounded-sm`}>{n.title}</Link>
 {n.status && <span className="meta-label ml-2 text-stone-400">{n.status}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </article>
    </div>
  )
}
