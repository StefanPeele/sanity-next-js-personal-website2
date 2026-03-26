import {CustomPortableText} from '@/components/CustomPortableText'
import ImageBox from '@/components/ImageBox'
import type {ShowcaseProject} from '@/types'
import type {PortableTextBlock} from 'next-sanity'

// We extend the existing type here so TypeScript doesn't get mad about our new fields!
type ExtendedProject = ShowcaseProject & {
  techStack?: string[];
  githubUrl?: string;
  liveUrl?: string;
}

interface ProjectProps {
  project: ExtendedProject
}

export function ProjectListItem(props: ProjectProps) {
  const {project} = props

  return (
    <>
      <div className="w-full xl:w-9/12">
        <ImageBox
          image={project.coverImage}
          alt={`Cover image from ${project.title}`}
          // UPGRADED: Added rounded corners and a soft shadow to the image!
          classesWrapper="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-sm border border-stone-100"
        />
      </div>
      <div className="flex xl:w-1/4">
        <TextBox project={project} />
      </div>
    </>
  )
}

function TextBox({project}: {project: ExtendedProject}) {
  return (
    <div className="relative mt-2 flex w-full flex-col justify-between p-3 xl:mt-0">
      <div>
        {/* UPGRADED Title: Added font-serif and stone-800 to match your new typography */}
        <div className="mb-2 text-xl font-extrabold tracking-tight md:text-2xl text-stone-800 font-serif">
          {project.title}
        </div>
        {/* Overview  */}
        <div className="font-sans text-stone-600 leading-relaxed">
          <CustomPortableText
            id={project._id}
            type={project._type}
            path={['overview']}
            value={project.overview as PortableTextBlock[]}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-y-4">
        {/* Tags */}
        <div className="flex flex-row flex-wrap gap-x-2">
          {project.tags?.map((tag, key) => (
            <div className="text-sm font-medium lowercase md:text-lg text-stone-400" key={key}>
              #{tag}
            </div>
          ))}
        </div>

        {/* UPGRADED: Tech Stack Badges - Soft Navy Tint */}
        {project.techStack && project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech, index) => (
              <span key={index} className="bg-[#4A5D6E]/10 text-[#4A5D6E] text-xs font-bold px-4 py-1.5 rounded-full">
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* UPGRADED: Links / Buttons - Pill shapes and Soft Navy coloring */}
        <div className="flex flex-row gap-3 mt-4">
          {project.githubUrl && (
            <a 
              href={project.githubUrl} 
              target="_blank" 
              rel="noreferrer" 
              // Outline button for GitHub
              className="px-6 py-2.5 text-sm font-semibold border-2 border-[#4A5D6E]/20 text-[#4A5D6E] hover:bg-[#4A5D6E]/5 hover:border-[#4A5D6E] transition-all duration-200 rounded-full flex items-center justify-center"
            >
              GitHub
            </a>
          )}
          {project.liveUrl && (
            <a 
              href={project.liveUrl} 
              target="_blank" 
              rel="noreferrer" 
              // Solid Soft Navy button for Live Demo
              className="px-6 py-2.5 text-sm font-semibold bg-[#4A5D6E] hover:bg-[#394856] transition-colors duration-200 rounded-full text-white flex items-center justify-center shadow-sm"
            >
              Live Demo
            </a>
          )}
        </div>
      </div>
    </div>
  )
}