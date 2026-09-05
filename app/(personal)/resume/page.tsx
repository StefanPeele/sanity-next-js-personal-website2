// app/(personal)/resume/page.tsx
import { formatDate } from '@/lib/dates'
import { SITE, absoluteUrl } from '@/lib/site'
import { sanityFetch } from '@/sanity/lib/live'
import { resumeQuery } from '@/sanity/lib/queries'
import type { ResumeQueryResult } from '@/sanity.types'
import { PortableText } from '@portabletext/react'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { getCopy } from '@/lib/cms/loaders'
import { personalPagesQuery } from '@/sanity/lib/queries-services'
import { DEFAULT_PERSONAL_PAGES } from '@/lib/cms/defaults/personalPages'
import { getSettings } from '@/lib/cms/loaders'

export async function generateMetadata(): Promise<Metadata> {
  const h = (await getCopy(personalPagesQuery, DEFAULT_PERSONAL_PAGES)).resume.header
  return { title: h.metaTitle || h.title, description: h.metaDescription || h.lede }
}

type Skill = ResumeQueryResult['skills'][number]
type Cert = ResumeQueryResult['certifications'][number]

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

const LEVEL: Record<NonNullable<Skill['level']>, { label: string; dots: number }> = {
  learning: { label: 'Learning', dots: 1 },
  working: { label: 'Working knowledge', dots: 2 },
  proficient: { label: 'Proficient', dots: 3 },
  deep: { label: 'Deep', dots: 4 },
}
const CATEGORY_ORDER = ['Infrastructure', 'Systems', 'Programming', 'Tools', 'Other']

const FALLBACK_EDUCATION = {
  school: SITE.school,
  degree: 'B.S.',
  field: 'Information Technology — Security Specialization',
  endDate: '2028-05-01',
  expected: true,
}

function dateRange(start?: string | null, end?: string | null, current?: boolean | null, fallback?: string | null): string {
  if (!start) return fallback ?? ''
  const from = formatDate(start, 'month')
  const to = current || !end ? 'Present' : formatDate(end, 'month')
  return `${from} — ${to}`
}

function LevelDots({ level }: { level: Skill['level'] }) {
  const meta = level ? LEVEL[level] : LEVEL.working
  return (
    <span className="inline-flex items-center gap-0.5 ml-2" aria-label={meta.label} title={meta.label}>
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={`inline-block w-1 h-1 rounded-full ${n <= meta.dots ? 'bg-amber-400' : 'bg-white/15'}`} />
      ))}
    </span>
  )
}

function CertRow({ cert }: { cert: Cert }) {
  const pct = Math.max(0, Math.min(100, cert.progressPercent ?? 0))
  return (
    <li className="py-3 border-b border-white/5 last:border-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-stone-200 text-sm">
          {cert.credentialUrl ? (
            <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className={`hover:text-white underline decoration-stone-700 underline-offset-4 ${FOCUS}`}>
              {cert.title}
            </a>
          ) : cert.title}
          {cert.issuer && <span className="text-stone-400 text-xs ml-2">{cert.issuer}</span>}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400 whitespace-nowrap">
          {cert.status === 'earned' && cert.earnedAt && formatDate(cert.earnedAt, 'month')}
          {cert.status === 'in-progress' && (cert.targetDate ? `Target ${formatDate(cert.targetDate, 'month')}` : 'In progress')}
          {cert.status === 'planned' && 'Planned'}
        </span>
      </div>
      {cert.status === 'in-progress' && (
        <div className="mt-2 h-1 w-full rounded-full bg-white/10 overflow-hidden print:hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${cert.title} study progress`}>
          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      )}
    </li>
  )
}

export default async function ResumePage() {
  const [copy, siteSettings] = await Promise.all([getCopy(personalPagesQuery, DEFAULT_PERSONAL_PAGES).then((c) => c.resume), getSettings()])
  const [{ data }, draft] = await Promise.all([sanityFetch({ query: resumeQuery }), draftMode()])
  const experiences = data?.experiences ?? []
  const skills = data?.skills ?? []
  const certifications = data?.certifications ?? []
  const education = data?.education?.length ? data.education : [{ _id: 'fallback', ...FALLBACK_EDUCATION, ...copy.fallbackEducation, startDate: null, details: null }]
  const page = data?.page
  // home.title is the site title; only use it as the person's name when it reads like one.
  const rawTitle = data?.home?.title?.trim()
  const name = rawTitle && !/[|—–:/]/.test(rawTitle) && rawTitle.split(/\s+/).length <= 4 ? rawTitle : SITE.legalName
  const lastUpdated = formatDate(page?._updatedAt, 'short', 'Recently')

  const skillGroups = (copy.skillCategoryOrder.length ? copy.skillCategoryOrder : CATEGORY_ORDER)
    .map((cat) => ({ cat, items: skills.filter((s) => (s.category ?? 'Other') === cat) }))
    .filter((g) => g.items.length > 0)
  const earned = certifications.filter((c) => c.status === 'earned')
  const inProgress = certifications.filter((c) => c.status === 'in-progress')
  const planned = certifications.filter((c) => c.status === 'planned')

  const nameParts = name.split(' ')
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

  return (
    <div className="min-h-screen bg-[#141414] rounded-xl text-stone-300 selection:bg-stone-500/30 print:bg-white print:text-black print:rounded-none">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-16 print:pt-6 print:gap-8 print:px-0">

        {/* LEFT: EXPERIENCE */}
        <div className="lg:col-span-8">
          <header className="mb-20 print:mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <span className="section-label print:text-gray-600">{copy.header.title}</span>
              <span className="font-sans text-sm text-stone-400 print:text-gray-600">{copy.lastUpdatedLabel} {lastUpdated}</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tight text-white print:text-black leading-none">
              {nameParts[0]}{lastName && <><br />{lastName}</>}<span className="text-stone-500 print:text-gray-400">.</span>
            </h1>
            <p className="mt-6 max-w-xl text-stone-300 print:text-gray-800 text-sm md:text-base leading-relaxed">
              {data?.home?.currently ?? copy.fallbackTagline}
              {data?.home?.location && <span className="text-stone-400 print:text-gray-600"> · {data.home.location}</span>}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm text-stone-400 print:text-gray-700">
              {copy.showEmail && <a href={`mailto:${siteSettings.email || SITE.email}`} className={`hover:text-white ${FOCUS}`}>{siteSettings.email || SITE.email}</a>}
              {copy.showGithub && (siteSettings.github || SITE.handles.github) && <a href={siteSettings.github || SITE.handles.github} className={`hover:text-white ${FOCUS}`} target="_blank" rel="noopener noreferrer me">{(siteSettings.github || SITE.handles.github).replace(/^https?:\/\//, '')}</a>}
              <span className="hidden print:inline">{SITE.url.replace(/^https?:\/\//, '')}</span>
            </div>
          </header>

          <section aria-labelledby="experience-heading">
            <h2 id="experience-heading" className="section-label print:text-gray-600 mb-8">
              {copy.sectionLabels.experience}
            </h2>
            {experiences.length === 0 && (
              <p className="text-stone-400 text-sm">{copy.emptyExperience}</p>
            )}
            <ol className="space-y-14 border-l border-stone-800 print:border-gray-300 ml-1 list-none m-0 p-0">
              {experiences.map((job) => (
                <li key={job._id} className="relative pl-8 md:pl-12 group">
                  <span className="absolute -left-[5px] top-2 w-[9px] h-[9px] rounded-full bg-stone-900 border border-stone-600 group-hover:bg-white transition-colors print:bg-white print:border-black" aria-hidden="true" />
                  <p className="font-mono text-[10px] text-stone-400 print:text-gray-600 uppercase tracking-widest mb-2">
                    {dateRange(job.startDate, job.endDate, job.current, job.duration)}
                    {job.location && <span className="ml-3 text-stone-500 print:text-gray-500">{job.location}</span>}
                  </p>
                  <h3 className="text-2xl font-serif text-white print:text-black">{job.role}</h3>
                  <p className="text-stone-400 print:text-gray-700 text-sm italic mb-5">{job.company}</p>

                  {job.highlights && job.highlights.length > 0 && (
                    <ul className="space-y-2 mb-5 list-none m-0 p-0">
                      {job.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-3 text-sm text-stone-300 print:text-black leading-relaxed">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400 print:bg-black" aria-hidden="true" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {job.description && (
                    <div className="prose prose-invert prose-stone prose-sm max-w-none text-stone-400 print:prose-p:text-black print:prose-li:text-black">
                      <PortableText value={job.description} />
                    </div>
                  )}

                  {job.techStack && job.techStack.length > 0 && (
                    <ul className="flex flex-wrap gap-2 mt-5 list-none m-0 p-0" aria-label="Tools and technologies">
                      {job.techStack.map((t) => (
                        <li key={t} className="px-2 py-1 text-[9px] font-mono tracking-wide bg-white/5 border border-white/10 text-stone-300 rounded-sm print:border-gray-300 print:text-black">
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* RIGHT: SKILLS, CERTS, EDUCATION, DOWNLOAD */}
        <aside className="lg:col-span-4 space-y-10">

          <section aria-labelledby="skills-heading" className="bg-white/5 border border-white/5 p-8 rounded-lg print:border-gray-300 print:bg-transparent print:p-0">
            <h2 id="skills-heading" className="section-label print:text-black mb-6 border-b border-white/10 print:border-gray-300 pb-4 font-sans">
              Skills
            </h2>
            {skillGroups.length === 0 ? (
              <p className="text-xs text-stone-400">{copy.emptySkills}</p>
            ) : (
              <div className="space-y-6">
                {skillGroups.map((group) => (
                  <div key={group.cat}>
                    <h3 className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-400 print:text-gray-600 mb-3 font-sans">{group.cat}</h3>
                    <ul className="flex flex-wrap gap-2 list-none m-0 p-0">
                      {group.items.map((skill) =>
                        skill.description && skill.description.length > 0 ? (
                          <li key={skill._id} className="w-full">
                            <details className="group/skill rounded-md border border-white/10 bg-black/30 print:border-gray-300 print:bg-transparent open:border-white/25">
                              <summary className={`cursor-pointer list-none flex items-center justify-between gap-3 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-stone-200 print:text-black ${FOCUS} rounded-md`}>
                                <span className="flex items-center">{skill.title}<LevelDots level={skill.level} /></span>
                                <span className="text-stone-400 group-open/skill:rotate-45 transition-transform print:hidden" aria-hidden="true">+</span>
                              </summary>
                              <div className="px-3 pb-3 text-xs text-stone-400 leading-relaxed prose prose-invert prose-sm max-w-none print:text-black">
                                <PortableText value={skill.description} />
                              </div>
                            </details>
                          </li>
                        ) : (
                          <li key={skill._id} className="flex items-center px-3 py-1.5 rounded-md border border-white/10 bg-black/30 font-mono text-[10px] uppercase tracking-widest text-stone-200 print:border-gray-300 print:bg-transparent print:text-black">
                            {skill.title}<LevelDots level={skill.level} />
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                ))}
                <p className="font-mono text-[8px] uppercase tracking-widest text-stone-400 print:hidden">
                  {copy.levelsLegend}
                </p>
              </div>
            )}
          </section>

          {certifications.length > 0 && (
            <section aria-labelledby="certs-heading" className="px-2">
              <h2 id="certs-heading" className="section-label print:text-gray-600 mb-4">
                {copy.sectionLabels.certifications}
              </h2>
              {earned.length > 0 && (
                <>
                  <h3 className="font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-400 print:text-black mt-4 mb-1 font-sans">{copy.certStatusLabels.earned}</h3>
                  <ul className="list-none m-0 p-0">{earned.map((c) => <CertRow key={c._id} cert={c} />)}</ul>
                </>
              )}
              {inProgress.length > 0 && (
                <>
                  <h3 className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400 print:text-black mt-4 mb-1 font-sans">{copy.certStatusLabels.inProgress}</h3>
                  <ul className="list-none m-0 p-0">{inProgress.map((c) => <CertRow key={c._id} cert={c} />)}</ul>
                </>
              )}
              {planned.length > 0 && (
                <>
                  <h3 className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-400 print:text-black mt-4 mb-1 font-sans">{copy.certStatusLabels.planned}</h3>
                  <ul className="list-none m-0 p-0">{planned.map((c) => <CertRow key={c._id} cert={c} />)}</ul>
                </>
              )}
            </section>
          )}

          {page?.activeDirective && (
            <section className="px-2" aria-labelledby="directive-heading">
              <h2 id="directive-heading" className="font-mono flex items-center gap-2 text-[9px] text-stone-400 print:text-gray-600 uppercase tracking-widest mb-3 font-sans">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full print:bg-black" aria-hidden="true" />
                {copy.sectionLabels.currently}
              </h2>
              <p className="text-xs text-stone-300 print:text-black leading-relaxed">{page.activeDirective}</p>
            </section>
          )}

          <section className="px-2" aria-labelledby="education-heading">
            <h2 id="education-heading" className="font-mono text-[9px] text-stone-400 print:text-gray-600 uppercase tracking-widest mb-3 font-sans">{copy.sectionLabels.education}</h2>
            <ul className="space-y-4 list-none m-0 p-0">
              {education.map((ed) => (
                <li key={ed._id}>
                  <p className="text-sm text-stone-200 print:text-black">{ed.school}</p>
                  <p className="text-xs text-stone-400 print:text-gray-700">{[ed.degree, ed.field].filter(Boolean).join(' ')}</p>
                  {ed.endDate && (
                    <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 print:text-gray-600 mt-1">
                      {ed.expected ? `${copy.expectedLabel} ` : ''}{formatDate(ed.endDate, 'month')}
                    </p>
                  )}
                  {ed.details && ed.details.length > 0 && (
                    <ul className="mt-2 space-y-1 list-none m-0 p-0">
                      {ed.details.map((d) => (
                        <li key={d} className="text-xs text-stone-400 print:text-black">— {d}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {page?.resumeUrl ? (
            <div className="p-8 border border-dashed border-stone-700 rounded-lg text-center hover:border-stone-400 transition-colors print:hidden">
              <p className="font-mono text-[9px] text-stone-400 uppercase tracking-widest mb-4">{copy.sectionLabels.hardCopy}</p>
              <a
                href={`${page.resumeUrl}?dl=Stefan_Peele_Resume.pdf`}
                className={`inline-block bg-white text-black font-mono text-[10px] tracking-[0.2em] uppercase px-8 py-4 rounded-sm hover:bg-stone-200 transition-colors ${FOCUS}`}
              >
                {copy.downloadLabel} →
              </a>
            </div>
          ) : draft.isEnabled ? (
            <p className="font-mono text-[9px] text-amber-400 uppercase tracking-widest px-2 print:hidden">
              {copy.draftHint}
            </p>
          ) : null}

          <p className="px-2 font-mono text-[9px] uppercase tracking-widest text-stone-400 print:hidden">
            {copy.contactPrompt.label} <Link href="/contact" className={`text-stone-200 hover:text-white underline underline-offset-4 ${FOCUS}`}>{copy.contactPrompt.ctaLabel}</Link>
          </p>
        </aside>
      </div>
    </div>
  )
}
