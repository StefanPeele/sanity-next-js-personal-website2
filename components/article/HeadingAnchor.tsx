'use client'

import { useState } from 'react'
// components/article/HeadingAnchor.tsx
// "#" link that appears on heading hover/focus. Click copies the deep link and
// updates the hash; keyboard users reach it by tabbing through the article.

export function HeadingAnchor({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    history.replaceState(null, '', `#${id}`)
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }).catch(() => {})
  }

  return (
    <a
      href={`#${id}`}
      onClick={onClick}
      className="heading-anchor focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded-sm"
      aria-label={copied ? 'Link copied' : 'Copy link to this section'}
      title="Copy link to this section"
      data-print-hide
    >
      {copied ? '✓' : '#'}
    </a>
  )
}
