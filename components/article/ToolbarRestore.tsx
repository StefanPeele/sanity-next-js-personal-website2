'use client'

import { useEffect, useState } from 'react'
import { FOCUS } from '@/lib/ui'
// components/article/ToolbarRestore.tsx
// Phase 5.3 requires the reading toolbar to be dismissible ENTIRELY. Entirely means no stub
// left on the page -- a stub is the chrome the reader just asked to be rid of.
//
// So it has to be recoverable from somewhere else, and the footer is the honest place: it is
// where a reader already goes looking for the things a page does not show them, and it costs
// nothing on every page where the toolbar has not been dismissed, because this renders
// NOTHING unless it has been.

export function ToolbarRestore({ label }: { label: string }) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHidden(localStorage.getItem('sp_toolbar_hidden') === 'true')
    } catch { /* private mode: render nothing, which is the safe default */ }
  }, [])

  if (!hidden) return null

  return (
    <button
      type="button"
      onClick={() => {
        try { localStorage.removeItem('sp_toolbar_hidden') } catch { /* ignore */ }
        // A reload rather than a state lift: the toolbar is mounted by the article page, far
        // from the footer, and threading a context through the whole tree to serve a control
        // that appears for one click is not worth the wiring.
        window.location.reload()
      }}
      className={`font-sans text-xs text-stone-400 hover:text-white underline underline-offset-4 rounded-sm ${FOCUS}`}
    >
      {label}
    </button>
  )
}
