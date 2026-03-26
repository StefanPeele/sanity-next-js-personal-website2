import { client } from '@/sanity/lib/client'
import { PortableText } from '@portabletext/react'

// 1. The GROQ Query
const experienceQuery = `*[_type == "experience"] {
  _id,
  role,
  company,
  duration,
  description
}`

export default async function ResumePage() {
  // 2. Fetch the data
  const experiences = await client.fetch(experienceQuery)

  // 3. The UI (A clean, vertical timeline layout)
  return (
    <main className="container mx-auto px-5 py-20">
      <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center">Resume & Experience</h1>

      <div className="max-w-3xl mx-auto space-y-10">
        {experiences.map((job: any) => (
          <div key={job._id} className="border-l-4 border-black pl-6 py-2 relative">
            
            {/* The Job Header */}
            <h2 className="text-2xl font-bold">{job.role}</h2>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-1 mb-4">
              <h3 className="text-xl text-gray-700 font-semibold">{job.company}</h3>
              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full w-fit mt-2 md:mt-0">
                {job.duration}
              </span>
            </div>
            
            {/* The Job Description (Rich Text) */}
            <div className="prose text-gray-600 max-w-none">
              {job.description ? <PortableText value={job.description} /> : <p>No description provided.</p>}
            </div>

          </div>
        ))}
      </div>
    </main>
  )
}