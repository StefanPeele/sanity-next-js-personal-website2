// app/(personal)/delivery/[token]/page.tsx
// Client delivery page: looks up a Shoot record in Airtable by its delivery
// token and shows status + gallery link. Not indexed, never cached.
//
// Airtable setup (Shoots table):
//   - A single-line text field "Delivery Token" holding a long random string
//     (e.g. an Airtable formula: RECORD_ID() & "-" & <secret>, or paste a UUID).
//   - A URL field "Delivery Link" with the Pixieset gallery URL.
//   - Optional: override field names with AIRTABLE_DELIVERY_TOKEN_FIELD /
//     AIRTABLE_DELIVERY_LINK_FIELD.

import Airtable from 'airtable'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/dates'
import { SITE } from '@/lib/site'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Your delivery', robots: { index: false, follow: false } }

type Props = { params: Promise<{ token: string }> }

const STEPS = ['Inquiry', 'Confirmed', 'Editing', 'Delivered', 'Complete']
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

function normalizeStatus(raw: string): string {
  const s = raw.replace(/[^\p{L}\s]/gu, '').trim().toLowerCase()
  return STEPS.find((step) => s.startsWith(step.toLowerCase())) ?? raw
}

async function lookup(token: string) {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_SHOOTS_TABLE_ID } = process.env
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_SHOOTS_TABLE_ID) return null
  const tokenField = process.env.AIRTABLE_DELIVERY_TOKEN_FIELD ?? 'Delivery Token'
  const linkField = process.env.AIRTABLE_DELIVERY_LINK_FIELD ?? 'Delivery Link'
  const safe = token.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  try {
    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID)
    const records = await base(AIRTABLE_SHOOTS_TABLE_ID)
      .select({ filterByFormula: `{${tokenField}} = "${safe}"`, maxRecords: 1 })
      .firstPage()
    const rec = records[0]
    if (!rec) return null
    const f = rec.fields
    return {
      title: typeof f['Shoot Title'] === 'string' ? f['Shoot Title'] : 'Your session',
      status: typeof f['Status'] === 'string' ? f['Status'] : 'Inquiry',
      pkg: typeof f['Package'] === 'string' ? f['Package'] : null,
      date: typeof f['Shoot Date'] === 'string' ? f['Shoot Date'] : null,
      link: typeof f[linkField] === 'string' ? (f[linkField] as string) : null,
    }
  } catch (err) {
    console.error('[delivery] Airtable lookup failed:', err)
    return null
  }
}

export default async function DeliveryPage({ params }: Props) {
  const { token } = await params
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(token)) notFound()
  const shoot = await lookup(token)
  if (!shoot) notFound()

  const status = normalizeStatus(shoot.status)
  const stepIndex = Math.max(0, STEPS.indexOf(status))

  return (
    <div className="w-full min-h-screen text-stone-300 pb-24">
      <div className="max-w-2xl mx-auto pt-24">
        <span className="text-stone-400 font-mono text-[10px] tracking-[0.4em] uppercase border-l border-stone-700 pl-4 mb-4 block">Client delivery</span>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">{shoot.title}</h1>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-stone-400">
          {[shoot.pkg, shoot.date ? formatDate(shoot.date, 'long') : null].filter(Boolean).join(' · ')}
        </p>

        <ol className="mt-12 grid grid-cols-5 gap-2 list-none m-0 p-0" aria-label="Progress">
          {STEPS.map((step, i) => (
            <li key={step} className="flex flex-col gap-2" aria-current={i === stepIndex ? 'step' : undefined}>
              <span className={`h-1 rounded-full ${i <= stepIndex ? 'bg-amber-400' : 'bg-white/10'}`} aria-hidden="true" />
              <span className={`font-mono text-[9px] uppercase tracking-widest ${i === stepIndex ? 'text-white' : i < stepIndex ? 'text-stone-300' : 'text-stone-400'}`}>{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-12 rounded-xl border border-white/10 bg-white/[0.02] p-8">
          {shoot.link && stepIndex >= 3 ? (
            <>
              <p className="font-serif text-2xl text-white mb-3">Your gallery is ready.</p>
              <p className="text-stone-400 text-sm mb-6">Download everything you want to keep — galleries are not permanent storage.</p>
              <a href={shoot.link} target="_blank" rel="noopener noreferrer" className={`inline-block bg-white text-black font-mono text-[10px] uppercase tracking-[0.2em] font-bold px-6 py-3 rounded-lg hover:bg-stone-200 transition-colors ${FOCUS}`}>
                Open gallery →
              </a>
            </>
          ) : stepIndex === 2 ? (
            <>
              <p className="font-serif text-2xl text-white mb-3">In the darkroom.</p>
              <p className="text-stone-400 text-sm">Culling is done and the edit is underway. A sneak peek lands first; the full gallery follows within the agreed turnaround.</p>
            </>
          ) : (
            <>
              <p className="font-serif text-2xl text-white mb-3">{stepIndex >= 1 ? "We're confirmed." : 'Inquiry received.'}</p>
              <p className="text-stone-400 text-sm">This page updates as your session moves through each stage. Questions? Reply to any email from me or write to <a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a>.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
