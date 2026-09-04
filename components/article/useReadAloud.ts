'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
// components/article/useReadAloud.ts
// Web Speech API reader for the article body. Speaks one paragraph/heading at a
// time and highlights it with .sp-reading-now. `supported` is false (and the
// toolbar hides the control) when speechSynthesis is missing.

export type ReadAloudStatus = 'idle' | 'playing' | 'paused'

const SELECTOR = '[data-article] > h2, [data-article] > h3, [data-article] > h4, [data-article] > p, [data-article] > blockquote, [data-article] > ul > li, [data-article] > ol > li'

export function useReadAloud() {
  const [supported, setSupported] = useState(false)
  const [status, setStatus] = useState<ReadAloudStatus>('idle')
  const [index, setIndex] = useState(-1)
  const nodesRef = useRef<HTMLElement[]>([])
  const currentRef = useRef<HTMLElement | null>(null)
  const stoppedRef = useRef(false)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window)
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
      currentRef.current?.classList.remove('sp-reading-now')
    }
  }, [])

  const clearHighlight = () => {
    currentRef.current?.classList.remove('sp-reading-now')
    currentRef.current = null
  }

  const speakFrom = useCallback((i: number) => {
    const nodes = nodesRef.current
    if (i >= nodes.length) {
      clearHighlight()
      setStatus('idle')
      setIndex(-1)
      return
    }
    const el = nodes[i]
    // Read visible text but skip the anchor "#" and glossary/sidenote markers.
    const text = Array.from(el.childNodes)
      .filter((n) => !(n instanceof HTMLElement && (n.classList.contains('heading-anchor') || n.tagName === 'SUP')))
      .map((n) => n.textContent ?? '')
      .join('')
      .replace(/※/g, '')
      .trim()
    if (!text) { speakFrom(i + 1); return }

    clearHighlight()
    el.classList.add('sp-reading-now')
    currentRef.current = el
    setIndex(i)
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = 1
    u.onend = () => { if (!stoppedRef.current) speakFrom(i + 1) }
    u.onerror = () => { if (!stoppedRef.current) { clearHighlight(); setStatus('idle'); setIndex(-1) } }
    window.speechSynthesis.speak(u)
  }, [])

  const play = useCallback(() => {
    if (!supported) return
    const synth = window.speechSynthesis
    if (status === 'paused') { synth.resume(); setStatus('playing'); return }
    stoppedRef.current = false
    synth.cancel()
    nodesRef.current = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR))
    setStatus('playing')
    speakFrom(0)
  }, [supported, status, speakFrom])

  const pause = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.pause()
    setStatus('paused')
  }, [supported])

  const stop = useCallback(() => {
    if (!supported) return
    stoppedRef.current = true
    window.speechSynthesis.cancel()
    clearHighlight()
    setStatus('idle')
    setIndex(-1)
  }, [supported])

  return { supported, status, index, total: nodesRef.current.length, play, pause, stop }
}
