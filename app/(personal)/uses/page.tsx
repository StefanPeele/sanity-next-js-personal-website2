// app/(personal)/uses/page.tsx
// HARD-CODED CONTENT. Stefan: replace every "[Add: …]" placeholder with the real
// item, or delete the line. Nothing here is invented — unknown gear is marked.

import { SITE, absoluteUrl } from '@/lib/site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Uses',
  description: `The hardware, software and camera kit ${SITE.name} actually uses for network engineering, study and photography.`,
  alternates: { canonical: absoluteUrl('/uses') },
}

interface UsesItem {
  name: string
  note?: string
  /** True for lines Stefan still needs to fill in — rendered visibly as a placeholder. */
  placeholder?: boolean
}

const SECTIONS: { title: string; items: UsesItem[] }[] = [
  {
    title: 'Work — network engineering',
    items: [
      { name: 'Windows Server / Active Directory', note: 'Users, groups, GPOs and the occasional replication mystery.' },
      { name: 'PowerShell', note: 'AD automation, reporting, and backup verification scripts.' },
      { name: 'SAN storage', note: '[Add: vendor and model of the SAN you administer]', placeholder: true },
      { name: 'Backup platform', note: '[Add: backup software, e.g. Veeam — and the target]', placeholder: true },
      { name: 'Switching and routing', note: '[Add: switch/firewall vendor and models at work]', placeholder: true },
    ],
  },
  {
    title: 'Home lab and study',
    items: [
      { name: 'Laptop', note: '[Add: model, CPU, RAM — the NJIT machine]', placeholder: true },
      { name: 'Lab switch', note: '[Add: home lab switch model]', placeholder: true },
      { name: 'Hypervisor', note: '[Add: Proxmox / Hyper-V / VMware — what runs the lab VMs]', placeholder: true },
      { name: 'Wireshark', note: 'Packet captures for the blog and for figuring out what a device is actually doing.' },
      { name: 'Packet Tracer / GNS3', note: '[Add: which one you use for CCNA study]', placeholder: true },
    ],
  },
  {
    title: 'Photography',
    items: [
      { name: 'Sony A7 III', note: 'Primary body — the default listed on every gallery.' },
      { name: 'Second body', note: '[Add: backup body model]', placeholder: true },
      { name: 'Lenses', note: '[Add: the two or three lenses you shoot most, with focal lengths]', placeholder: true },
      { name: 'Lighting', note: '[Add: flash / strobe and modifiers, if any]', placeholder: true },
      { name: 'Editing', note: '[Add: Lightroom / Capture One and the export presets you rely on]', placeholder: true },
      { name: 'Delivery', note: 'Pixieset galleries — password-protected, downloadable, with a separate print-ready TIFF folder.' },
    ],
  },
  {
    title: 'This site',
    items: [
      { name: 'Next.js + React', note: 'App Router, React Compiler, Turbopack.' },
      { name: 'Sanity', note: 'Content, live preview, and the Studio at /studio.' },
      { name: 'Tailwind CSS', note: 'Dark archive palette, Lora + Inter + IBM Plex Mono.' },
      { name: 'Vercel', note: 'Hosting and Speed Insights.' },
      { name: 'Airtable + Resend', note: 'Booking CRM and transactional email for photography clients.' },
    ],
  },
]

export default function UsesPage() {
  return (
    <div className="w-full min-h-screen text-stone-300 pb-24">
      <div className="max-w-4xl mx-auto pt-24">
        <header className="pb-10 border-b border-white/5 mb-4">
          <span className="text-stone-400 font-mono text-[10px] tracking-[0.4em] uppercase border-l border-stone-700 pl-4 mb-4 block">Directory / Uses</span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight">What I use</h1>
          <p className="mt-6 text-stone-400 text-sm max-w-xl leading-relaxed">
            The tools behind the work, the study and the photographs. Kept short, kept honest — if it is on this list, I use it.
          </p>
        </header>

        {SECTIONS.map((section) => (
          <section key={section.title} aria-labelledby={`uses-${section.title}`} className="py-10 border-b border-white/5 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8">
            <h2 id={`uses-${section.title}`} className="md:col-span-4 font-mono text-[10px] tracking-[0.3em] text-stone-400 uppercase font-sans pt-1">{section.title}</h2>
            <dl className="md:col-span-8 space-y-4 m-0">
              {section.items.map((item) => (
                <div key={item.name}>
                  <dt className="text-white font-serif text-lg">{item.name}</dt>
                  {item.note && (
                    <dd className={`text-sm m-0 mt-0.5 leading-relaxed ${item.placeholder ? 'font-mono text-[11px] text-amber-400/90 border border-dashed border-amber-500/30 rounded px-2 py-1 inline-block' : 'text-stone-400'}`}>
                      {item.note}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  )
}
