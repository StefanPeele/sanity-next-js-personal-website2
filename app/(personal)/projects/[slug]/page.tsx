import {CustomPortableText} from '@/components/CustomPortableText'
import {Header} from '@/components/Header'
import ImageBox from '@/components/ImageBox'
import {studioUrl} from '@/sanity/lib/api'
import {sanityFetch} from '@/sanity/lib/live'
import {projectBySlugQuery, slugsByTypeQuery} from '@/sanity/lib/queries'
import {urlForOpenGraphImage} from '@/sanity/lib/utils'
import type {Metadata, ResolvingMetadata} from 'next'
import {createDataAttribute, toPlainText} from 'next-sanity'
import {draftMode} from 'next/headers'
import Link from 'next/link'
import {notFound} from 'next/navigation'

type Props = {
  params: Promise<{slug: string}>
}

export async function generateMetadata(
  {params}: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const {data: project} = await sanityFetch({
    query: projectBySlugQuery,
    params,
    stega: false,
  })
  // @ts-ignore the image type sometimes fails
  const ogImage = urlForOpenGraphImage(project?.coverImage)

  return {
    title: project?.title,
    description: project?.overview ? toPlainText(project.overview) : (await parent).description,
    openGraph: ogImage
      ? {
          images: [ogImage, ...((await parent).openGraph?.images || [])],
        }
      : {},
  }
}

export async function generateStaticParams() {
  const {data} = await sanityFetch({
    query: slugsByTypeQuery,
    params: {type: 'project'},
    stega: false,
    perspective: 'published',
  })
  return data
}

export default async function ProjectSlugRoute({params}: Props) {
  const {data} = await sanityFetch({query: projectBySlugQuery, params})

  if (!data?._id && !(await draftMode()).isEnabled) {
    notFound()
  }

  const dataAttribute =
    data?._id && data._type
      ? createDataAttribute({
          baseUrl: studioUrl,
          id: data._id,
          type: data._type,
        })
      : null

  // EXTRACTING THE NEW DATA
  const {client, coverImage, description, duration, overview, site, tags, title, techStack, githubUrl, liveUrl, boardUrl, architecture} = data ?? {}

  const startYear = duration?.start ? new Date(duration.start).getFullYear() : undefined
  const endYear = duration?.end ? new Date(duration?.end).getFullYear() : 'Now'

  return (
    <div className="w-full bg-[#0a0a0a] min-h-screen text-stone-300 pb-24">
      <div className="max-w-4xl mx-auto pt-24 space-y-12">
        
        {/* Header - Styled for dark mode */}
        <div className="border-b border-white/5 pb-8 mb-8">
          <Header
            id={data?._id || null}
            type={data?._type || null}
            path={['overview']}
            title={title || (data?._id ? 'Untitled' : '404 Project Not Found')}
            description={overview}
          />
        </div>

        {/* Cinematic Cover Image */}
        <div className="rounded-xl border border-white/5 overflow-hidden shadow-2xl bg-[#111]">
          <ImageBox
            data-sanity={dataAttribute?.('coverImage')}
            image={coverImage as any}
            alt={title || "Cover Image"}
            classesWrapper="relative aspect-[21/9] w-full filter contrast-110"
          />

          {/* Metadata Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5 border-t border-white/5 text-[10px] font-mono uppercase tracking-widest text-stone-500 bg-[#0f0f0f]">
            
            {!!(startYear && endYear) && (
              <div className="p-4 flex flex-col justify-center">
                <span className="text-stone-600 mb-1">Timeline</span>
                <span className="text-stone-300" data-sanity={dataAttribute?.('duration.start')}>{startYear} - {endYear}</span>
              </div>
            )}

            {client && (
              <div className="p-4 flex flex-col justify-center">
                <span className="text-stone-600 mb-1">Client/Org</span>
                <span className="text-stone-300 truncate">{client}</span>
              </div>
            )}

            {site && (
              <div className="p-4 flex flex-col justify-center">
                <span className="text-stone-600 mb-1">Production URL</span>
                <Link target="_blank" className="text-stone-300 hover:text-white transition-colors truncate" href={site}>
                  {(site as string).replace(/^https?:\/\//, '')}        
                </Link>
              </div>
            )}

            <div className="p-4 flex flex-col justify-center">
              <span className="text-stone-600 mb-1">Tags</span>
              <div className="flex gap-2 overflow-hidden whitespace-nowrap">
                {(tags as any)?.slice(0, 2).map((tag: string, key: number) => (
                  <span key={key} className="text-stone-300">#{tag}</span>
                ))}
                {tags && (tags as any).length > 2 && <span className="text-stone-600">+{(tags as any).length - 2}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* TECH STACK & LINKS ACTION BAR */}
        {(((techStack as any) && (techStack as any).length > 0) || githubUrl || liveUrl || boardUrl) && (
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 py-8 border-y border-white/5">
            
            {/* Tech Stack Pills */}
            <div className="flex-1">
              <h3 className="text-[10px] font-mono tracking-[0.3em] text-stone-600 uppercase mb-4">Architecture Stack</h3>
              <div className="flex flex-wrap gap-2">
                {(techStack as any)?.map((tech: string, index: number) => (
                  <span key={index} className="px-3 py-1 text-[11px] font-mono tracking-wide bg-white/5 border border-white/10 text-stone-300 rounded-sm hover:bg-white/10 transition-colors">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* External Action Links */}
            <div className="flex flex-col gap-3 min-w-[200px]">
              {githubUrl && (
                <Link href={githubUrl as string} target="_blank" rel="noreferrer" className="flex items-center justify-between px-4 py-2 text-xs font-mono tracking-widest uppercase bg-[#111] border border-white/10 hover:border-white/30 transition-all rounded-sm text-stone-300 group">
                  <span>Repository</span>
                  <span className="text-stone-600 group-hover:text-white transition-colors">↗</span>
                </Link>
              )}
              {boardUrl && (
                <Link href={boardUrl as string} target="_blank" rel="noreferrer" className="flex items-center justify-between px-4 py-2 text-xs font-mono tracking-widest uppercase bg-[#111] border border-white/10 hover:border-white/30 transition-all rounded-sm text-stone-300 group">
                  <span>Project Board</span>
                  <span className="text-stone-600 group-hover:text-white transition-colors">↗</span>
                </Link>
              )}
              {liveUrl && (
                <Link href={liveUrl as string} target="_blank" rel="noreferrer" className="flex items-center justify-between px-4 py-2 text-xs font-mono tracking-widest uppercase bg-white text-black hover:bg-stone-200 transition-all rounded-sm font-bold group">
                  <span>Live Demo</span>
                  <span className="text-stone-600 group-hover:text-black transition-colors">→</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* TOPOLOGY & ARCHITECTURE IMAGES */}
        {architecture && (architecture as any[]).length > 0 && (
          <div className="space-y-6 pt-4">
             <h3 className="text-[10px] font-mono tracking-[0.3em] text-stone-600 uppercase">System Topologies</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {(architecture as any[]).map((image: any, idx: number) => (
                 <div key={idx} className="relative group rounded-md overflow-hidden border border-white/5 bg-[#111]">
                   <ImageBox image={image} alt={image.alt || `Architecture diagram ${idx + 1}`} classesWrapper="relative aspect-[4/3] w-full" />
                   {image.caption && (
                     <div className="absolute bottom-0 w-full bg-black/80 backdrop-blur-md p-3 text-[10px] font-mono text-stone-400 border-t border-white/10">
                       {image.caption}
                     </div>
                   )}
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* FULL CASE STUDY (Rich Text) */}
        {description && (
          <div className="pt-8 prose prose-invert prose-stone max-w-none prose-img:rounded-md prose-img:border prose-img:border-white/10 prose-p:text-stone-400 prose-p:leading-relaxed prose-headings:font-serif prose-headings:font-normal prose-a:text-white prose-a:decoration-stone-600 hover:prose-a:decoration-white prose-a:underline-offset-4">
            <CustomPortableText
              id={data?._id || null}
              type={data?._type || null}
              path={['description']}
              value={description as any}
            />
          </div>
        )}
      </div>
    </div>
  )
}