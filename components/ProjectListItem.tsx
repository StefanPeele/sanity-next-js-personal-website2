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
          classesWrapper="relative aspect-[16/9]"
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
        {/* Title */}
        <div className="mb-2 text-xl font-extrabold tracking-tight md:text-2xl">
          {project.title}
        </div>
        {/* Overview  */}
        <div className="font-serif text-gray-500">
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
            <div className="text-sm font-medium lowercase md:text-lg text-gray-600" key={key}>
              #{tag}
            </div>
          ))}
        </div>

        {/* NEW: Tech Stack Badges */}
        {project.techStack && project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech, index) => (
              <span key={index} className="px-2 py-1 text-xs font-semibold bg-black text-white rounded-md">
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* NEW: Links / Buttons */}
        <div className="flex flex-row gap-3 mt-2">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noreferrer" className="px-4 py-2 text-sm font-bold bg-gray-200 hover:bg-gray-300 transition rounded-md text-black">
              GitHub
            </a>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer" className="px-4 py-2 text-sm font-bold bg-black hover:bg-gray-800 transition rounded-md text-white">
              Live Demo
            </a>
          )}
        </div>
      </div>
    </div>
  )
}