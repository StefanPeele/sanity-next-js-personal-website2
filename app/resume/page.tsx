import { client } from '@/sanity/lib/client'
import { PortableText } from '@portabletext/react'
import { Navbar } from '@/components/Navbar'

// Updated Query: Fetches the timestamp and the new activeDirective field
const resumeQuery = `{
  "experiences": *[_type == "experience"] | order(duration desc),
  "skills": *[_type == "skill"] | order(category asc),
  "settings": *[_type == "settings"][0],
  "page": *[_type == "page" && slug.current == "resume"][0] {
    _updatedAt,
    activeDirective,
    "resumeUrl": resumeFile.asset->url
  }
}`

export default async function ResumePage() {
  const { experiences, skills, settings, page } = await client.fetch(resumeQuery)

  // Format the "Last Updated" date dynamically from Sanity
  const lastUpdated = page?._updatedAt 
    ? new Date(page._updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
    : 'Recently'

  return (
    // Added print:bg-white and print:text-black to force a clean white background on print
    <div className="min-h-screen bg-[#1a1a1a] text-stone-300 selection:bg-stone-500/30 print:bg-white print:text-black">
      
      {/* Hide navbar when printing */}
      <div className="print:hidden">
        <Navbar data={settings} />
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-16 print:pt-10 print:gap-8">
        
        {/* LEFT: WORK LOG */}
        <div className="lg:col-span-8">
          <header className="mb-20 print:mb-10">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 print:text-gray-500 block">
                Dossier // Curriculum Vitae
              </span>
              
              {/* LIVE STATUS TRACKER */}
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-stone-400 print:text-gray-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 print:hidden"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 print:bg-gray-400"></span>
                </span>
                System Last Updated: {lastUpdated}
              </div>
            </div>

            <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tight text-white print:text-black leading-none">
              Stefan <br /> Peele II<span className="text-stone-600 print:text-gray-400">.</span>
            </h1>
          </header>

          <div className="space-y-16 border-l border-stone-800 print:border-gray-300 ml-4">
            {experiences?.map((job: any) => (
              <div key={job._id} className="relative pl-8 md:pl-12 group">
                {/* Timeline node */}
                <div className="absolute -left-[5px] top-2 w-[9px] h-[9px] rounded-full bg-stone-900 border border-stone-700 group-hover:bg-white transition-all duration-500 print:bg-white print:border-black" />
                <p className="font-mono text-[10px] text-stone-500 print:text-gray-600 uppercase tracking-widest mb-2">{job.duration}</p>
                <h2 className="text-2xl font-serif text-white group-hover:text-stone-200 print:text-black transition-colors">{job.role}</h2>
                <h3 className="text-stone-500 print:text-gray-600 text-sm italic mb-6">{job.company}</h3>
                <div className="prose prose-invert prose-stone prose-sm max-w-none opacity-80 print:prose-p:text-black print:opacity-100">
                  <PortableText value={job.description} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: INTERACTIVE INTEL & DOWNLOAD */}
        <aside className="lg:col-span-4 space-y-10">
          
          <div className="bg-white/5 border border-white/5 p-8 rounded-lg backdrop-blur-sm shadow-2xl print:shadow-none print:border-gray-300 print:bg-transparent print:p-0">
            <h4 className="font-mono text-[10px] tracking-[0.4em] uppercase text-white print:text-black mb-8 border-b border-white/10 print:border-gray-300 pb-4">
              Technical Intel
            </h4>
            
            <div className="space-y-4">
              {skills?.length > 0 ? skills.map((skill: any) => (
                <details key={skill._id} className="group border-b border-white/5 print:border-gray-200 pb-4 cursor-pointer print:block">
                  <summary className="flex justify-between items-center list-none font-mono text-[11px] uppercase tracking-widest text-stone-400 group-hover:text-white print:text-black transition-colors">
                    {skill.title}
                    <span className="text-stone-600 group-open:rotate-45 transition-transform print:hidden">+</span>
                  </summary>
                  <div className="mt-4 text-xs text-stone-400 leading-relaxed bg-black/40 p-4 rounded border border-white/5 print:bg-transparent print:border-none print:text-black print:p-0 print:block">
                    <PortableText value={skill.description} />
                  </div>
                </details>
              )) : (
                <p className="text-[10px] text-stone-600 italic uppercase tracking-widest">No intel modules found.</p>
              )}
            </div>
          </div>

          {/* ACTIVE DIRECTIVE / CURRENTLY LEARNING */}
          {page?.activeDirective && (
            <div className="px-2">
              <p className="font-mono flex items-center gap-2 text-[9px] text-stone-500 print:text-gray-600 uppercase tracking-widest mb-3">
                <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full print:bg-black"></span>
                Active Directive
              </p>
              <p className="text-xs text-stone-300 print:text-black leading-relaxed">
                {page.activeDirective}
              </p>
            </div>
          )}

          <div className="px-2 opacity-60 print:opacity-100">
            <p className="font-mono text-[9px] text-stone-500 print:text-gray-600 uppercase tracking-widest mb-2">Education</p>
            <p className="text-xs text-stone-300 print:text-black">NJIT / B.S. IT - Security Specialization</p>
            <p className="text-[10px] text-stone-600 print:text-gray-500">Expected 2028</p>
          </div>

          {/* DOWNLOAD SECTION - Hiden on Print! */}
          <div className="p-8 border border-dashed border-stone-800 rounded-lg text-center group hover:border-stone-400 transition-all duration-500 print:hidden">
            <p className="font-mono text-[9px] text-stone-500 uppercase tracking-widest mb-4">Hard Copy Access</p>
            <a 
              href={page?.resumeUrl ? `${page.resumeUrl}?dl=Stefan_Peele_Resume.pdf` : "#"} 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-black font-mono text-[10px] tracking-[0.2em] uppercase px-8 py-4 rounded-sm hover:invert transition-all active:scale-95"
            >
              Download PDF →
            </a>
            {!page?.resumeUrl && (
               <p className="text-[8px] text-red-900 mt-2 uppercase">PDF not uploaded in Sanity</p>
            )}
          </div>

        </aside>
      </main>
    </div>
  )
}