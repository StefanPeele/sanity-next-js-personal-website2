// components/portfolio/ProjectLinks.tsx
// Icon links (GitHub / live / docs) and the GitHub metadata line shared by
// the project index cards and the project page.

import { BookOpen, ExternalLink, GitFork, Star } from 'lucide-react'
import { FaGithub } from 'react-icons/fa'
import { formatDate } from '@/lib/dates'
import type { RepoMeta } from '@/lib/github'

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'

interface ProjectLinksProps {
  title?: string | null
  githubUrl?: string | null
  liveUrl?: string | null
  docsUrl?: string | null
  className?: string
}

export function ProjectIconLinks({ title, githubUrl, liveUrl, docsUrl, className = '' }: ProjectLinksProps) {
  const name = title ?? 'Project'
  const links: { href: string; label: string; icon: React.ReactNode }[] = []
  if (githubUrl) links.push({ href: githubUrl, label: `${name} on GitHub`, icon: <FaGithub size={14} aria-hidden /> })
  if (liveUrl) links.push({ href: liveUrl, label: `${name} live site`, icon: <ExternalLink size={14} aria-hidden /> })
  if (docsUrl) links.push({ href: docsUrl, label: `${name} documentation`, icon: <BookOpen size={14} aria-hidden /> })
  if (links.length === 0) return null
  return (
    <ul className={`flex items-center gap-1 list-none m-0 p-0 ${className}`}>
      {links.map((l) => (
        <li key={l.href}>
          <a
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={l.label}
            title={l.label}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-stone-400 hover:text-white hover:border-white/30 transition-colors ${FOCUS}`}
          >
            {l.icon}
          </a>
        </li>
      ))}
    </ul>
  )
}

export function RepoMetaLine({ meta, className = '' }: { meta: RepoMeta; className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-widest text-stone-400 ${className}`}>
      {meta.language && <span>{meta.language}</span>}
      <span className="inline-flex items-center gap-1"><Star size={11} aria-hidden /> {meta.stars}<span className="sr-only"> stars</span></span>
      {meta.forks > 0 && <span className="inline-flex items-center gap-1"><GitFork size={11} aria-hidden /> {meta.forks}<span className="sr-only"> forks</span></span>}
      {meta.pushedAt && <span>Pushed {formatDate(meta.pushedAt, 'short')}</span>}
      {meta.license && <span>{meta.license}</span>}
    </p>
  )
}
