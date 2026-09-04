'use client'

import { useEffect } from 'react'
// app/global-error.tsx — replaces the root layout when it throws. Must render <html>/<body>.
// No next/font here (layout is gone), so system serif/mono fallbacks are used.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app/global-error]', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0a0a0a', color: '#d6d3d1', fontFamily: 'Georgia, serif' }}>
        <main
          id="content"
          style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
        >
          <div style={{ maxWidth: '32rem', width: '100%', textAlign: 'center' }}>
            <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#a8a29e', marginBottom: '2rem' }}>
              System // Critical fault
            </p>
            <h1 style={{ color: '#fff', fontSize: 'clamp(40px, 8vw, 72px)', lineHeight: 1, margin: '0 0 1.5rem' }}>
              The archive went dark.
            </h1>
            <p style={{ fontStyle: 'italic', color: '#a8a29e', fontSize: 18, margin: '0 0 0.5rem' }}>
              The application shell failed to render.
            </p>
            <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a8a29e', margin: '0 0 3rem' }}>
              {error.digest ? `Reference ${error.digest}` : 'No reference id'}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={reset}
                style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', padding: '12px 20px', background: '#fff', color: '#000', border: 0, cursor: 'pointer' }}
              >
                Try again
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- no router/layout when the shell itself failed */}
              <a
                href="/"
                style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', padding: '12px 20px', border: '1px solid rgba(255,255,255,0.1)', color: '#d6d3d1', textDecoration: 'none' }}
              >
                Home
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
