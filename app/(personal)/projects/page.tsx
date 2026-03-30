import ImageBox from '@/components/ImageBox'
import {sanityFetch} from '@/sanity/lib/live'
import {projectsQuery} from '@/sanity/lib/queries'
import Link from 'next/link'
import {toPlainText} from 'next-sanity'

export const metadata = {
  title: 'Projects Archive | Stefan Peele II',
  description: 'IT Infrastructure, Architecture, and Development Case Studies',
}

export default async function ProjectsIndexRoute() {
  const {data: projects} = await sanityFetch({query: projectsQuery})

  return (
    <div className="w-full bg-[#0a0a0a] min-h-screen text-stone-300 pb-24">
      <div className="max-w-6xl mx-auto pt-24 space-y-12">
        
        {/* Page Header */}
        <div className="border-b border-white/5 pb-12 mb-12">
          <span className="text-stone-500 font-mono text-[10px] tracking-[0.4em] uppercase border-l border-stone-700 pl-4 mb-4 block">
            Directory / Projects
          </span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight">
            Case Studies
          </h1>
          <p className="mt-4 text-stone-400 font-mono text-sm max-w-xl">
            An archive of IT infrastructure, systems architecture, and developmental deployments.
          </p>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project: any) => {
            const startYear = project.duration?.start ? new Date(project.duration.start).getFullYear() : null
            const endYear = project.duration?.end ? new Date(project.duration.end).getFullYear() : 'Present'

            return (
              <Link 
                key={project._id} 
                href={`/projects/${project.slug}`} 
                className="group block relative rounded-xl overflow-hidden bg-[#111] border border-white/5 hover:border-white/20 transition-all duration-500 flex flex-col h-full"
              >
                {/* Image */}
                <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-white/5">
                  {project.coverImage ? (
                    <div className="w-full h-full transform group-hover:scale-105 transition-transform duration-700">
                      <ImageBox 
                        image={project.coverImage} 
                        alt={project.title} 
                        classesWrapper="w-full h-full object-cover filter contrast-110 opacity-70 group-hover:opacity-100 transition-opacity" 
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center font-mono text-stone-600 text-xs">NO ASSET</div>
                  )}
                  {startYear && (
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-sm border border-white/10 text-[9px] font-mono tracking-widest text-white uppercase">
                      {startYear} - {endYear}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <h2 className="text-2xl font-serif font-bold text-white mb-3 group-hover:text-stone-300 transition-colors">
                    {project.title}
                  </h2>
                  
                  {project.overview && (
                    <div className="text-stone-400 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
                      {toPlainText(project.overview)}
                    </div>
                  )}

                  {/* Tech Stack Pills (Limit to 3) */}
                  {project.techStack && project.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-white/5">
                      {project.techStack.slice(0, 3).map((tech: string, index: number) => (
                        <span key={index} className="px-2 py-1 text-[9px] font-mono tracking-wide bg-white/5 border border-white/10 text-stone-300 rounded-sm">
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 3 && (
                        <span className="px-2 py-1 text-[9px] font-mono tracking-wide text-stone-500">
                          +{project.techStack.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {projects.length === 0 && (
          <div className="py-24 text-center font-mono text-stone-500 text-sm">
            Project archive is currently empty. Initialize a new project in Sanity.
          </div>
        )}
      </div>
    </div>
  )
}