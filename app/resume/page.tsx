import { client } from '@/sanity/lib/client'
import { PortableText } from '@portabletext/react'
import { Navbar } from '@/components/Navbar'

// Updated Query: Now fetches the specific page metadata for the PDF link
const resumeQuery = `{
  "experiences": *[_type == "experience"] | order(duration desc),
  "skills": *[_type == "skill"] | order(category asc),
  "settings": *[_type == "settings"][0],
  "page": *[_type == "page" && slug.current == "resume"][0] {
    "resumeUrl": resumeFile.asset->url
  }
}`

export default async function ResumePage() {
  const { experiences, skills, settings, page } = await client.fetch(resumeQuery)

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-stone-300 selection:bg-stone-500/30">
      <Navbar data={settings} />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* LEFT: WORK LOG */}
        <div className="lg:col-span-8">
          <header className="mb-20">
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block mb-4">
              Dossier // Curriculum Vitae
            </span>
            <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tight text-white leading-none">
              Stefan <br /> Peele II<span className="text-stone-600">.</span>
            </h1>
          </header>

          <div className="space-y-16 border-l border-stone-800 ml-4">
            {experiences?.map((job: any) => (
              <div key={job._id} className="relative pl-8 md:pl-12 group">
                <div className="absolute -left-[5px] top-2 w-[9px] h-[9px] rounded-full bg-stone-900 border border-stone-700 group-hover:bg-white transition-all duration-500" />
                <p className="font-mono text-[10px] text-stone-500 uppercase tracking-widest mb-2">{job.duration}</p>
                <h2 className="text-2xl font-serif text-white group-hover:text-stone-200 transition-colors">{job.role}</h2>
                <h3 className="text-stone-500 text-sm italic mb-6">{job.company}</h3>
                <div className="prose prose-invert prose-stone prose-sm max-w-none opacity-80">
                  <PortableText value={job.description} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: INTERACTIVE INTEL & DOWNLOAD */}
        <aside className="lg:col-span-4 space-y-10">
          
          <div className="bg-white/5 border border-white/5 p-8 rounded-lg backdrop-blur-sm shadow-2xl">
            <h4 className="font-mono text-[10px] tracking-[0.4em] uppercase text-white mb-8 border-b border-white/10 pb-4">
              Technical Intel
            </h4>
            
            <div className="space-y-4">
              {skills?.length > 0 ? skills.map((skill: any) => (
                <details key={skill._id} className="group border-b border-white/5 pb-4 cursor-pointer">
                  <summary className="flex justify-between items-center list-none font-mono text-[11px] uppercase tracking-widest text-stone-400 group-hover:text-white transition-colors">
                    {skill.title}
                    <span className="text-stone-600 group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <div className="mt-4 text-xs text-stone-400 leading-relaxed bg-black/40 p-4 rounded border border-white/5">
                    <PortableText value={skill.description} />
                  </div>
                </details>
              )) : (
                <p className="text-[10px] text-stone-600 italic uppercase tracking-widest">No intel modules found.</p>
              )}
            </div>
          </div>

          {/* DOWNLOAD SECTION */}
          <div className="p-8 border border-dashed border-stone-800 rounded-lg text-center group hover:border-stone-400 transition-all duration-500">
            <p className="font-mono text-[9px] text-stone-500 uppercase tracking-widest mb-4">Hard Copy Access</p>
            <a 
              href={page?.resumeUrl || "#"} 
              download="Stefan_Peele_Resume.pdf"
              className="inline-block bg-white text-black font-mono text-[10px] tracking-[0.2em] uppercase px-8 py-4 rounded-sm hover:invert transition-all active:scale-95"
            >
              Download PDF →
            </a>
            {!page?.resumeUrl && (
               <p className="text-[8px] text-red-900 mt-2 uppercase">PDF not uploaded in Sanity</p>
            )}
          </div>

          <div className="px-2 opacity-40">
            <p className="font-mono text-[9px] text-stone-500 uppercase tracking-widest mb-2">Education</p>
            <p className="text-xs text-stone-300">NJIT / B.S. IT - Security Specialization [cite: 4]</p>
            <p className="text-[10px] text-stone-600">Expected 2028 [cite: 6]</p>
          </div>
        </aside>
      </main>
    </div>
  )
}