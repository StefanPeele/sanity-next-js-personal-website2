'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
// components/article/useReadAloud.ts
// Web Speech API reader for the article body. Speaks one paragraph/heading at a
// time and highlights it with .sp-reading-now. `supported` is false (and the
// toolbar hides the control) when speechSynthesis is missing.

export type ReadAloudStatus = 'idle' | 'playing' | 'paused'

/* 5.2 asks for read-aloud "with voice selection — multiple voices, speed control".

   THE TRAP, and it is the whole reason voices are state rather than a getter:
   `speechSynthesis.getVoices()` returns an EMPTY ARRAY on the first call in Chrome. The list
   arrives asynchronously and fires `voiceschanged`. Read it once at mount and the control
   renders with no voices, permanently, on the browser most people use. */

const RATE_STEPS = [0.8, 1, 1.25, 1.5] as const
const STORAGE_VOICE = 'sp_tts_voice'
const STORAGE_RATE = 'sp_tts_rate'

const SELECTOR = '[data-article] > h2, [data-article] > h3, [data-article] > h4, [data-article] > p, [data-article] > blockquote, [data-article] > ul > li, [data-article] > ol > li'

export function useReadAloud() {
  const [supported, setSupported] = useState(false)
  const [status, setStatus] = useState<ReadAloudStatus>('idle')
  const [index, setIndex] = useState(-1)
  const [total, setTotal] = useState(0)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURI] = useState<string | null>(null)
  const [rate, setRateState] = useState<number>(1)
  // Read inside speakFrom, which is a useCallback that must not be rebuilt on every rate
  // change — a new identity there restarts the utterance chain mid-sentence.
  const voiceRef = useRef<string | null>(null)
  const rateRef = useRef(1)
  const nodesRef = useRef<HTMLElement[]>([])
  const currentRef = useRef<HTMLElement | null>(null)
  const stoppedRef = useRef(false)
  const statusRef = useRef<ReadAloudStatus>('idle')
  const indexRef = useRef(-1)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feature detection after mount (avoids a server/client mismatch)
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window)
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
      currentRef.current?.classList.remove('sp-reading-now')
    }
  }, [])

  // Voices, and the reason this is an event listener and not a one-off read.
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const synth = window.speechSynthesis
    const load = () => {
      // English only. A full list is 200+ entries on a stock Windows install, which is not a
      // control, it is a phone book — and the articles are in English.
      const all = synth.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('en'))
      // Deduplicate by name: some platforms list the same voice once per locale.
      const seen = new Set<string>()
      const list = all.filter((v) => (seen.has(v.name) ? false : (seen.add(v.name), true)))
        .sort((a, b) => Number(b.default) - Number(a.default) || a.name.localeCompare(b.name))
      setVoices(list)
    }
    load()
    synth.addEventListener('voiceschanged', load)
    return () => synth.removeEventListener('voiceschanged', load)
  }, [])

  // Restore the reader's choices once, after mount.
  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_VOICE)
      const r = Number(localStorage.getItem(STORAGE_RATE))
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (v) { setVoiceURI(v); voiceRef.current = v }
      if (RATE_STEPS.includes(r as typeof RATE_STEPS[number])) { setRateState(r); rateRef.current = r }
    } catch { /* private mode: the defaults are correct */ }
  }, [])

  const clearHighlight = () => {
    currentRef.current?.classList.remove('sp-reading-now')
    currentRef.current = null
  }

  const speakFromRef = useRef<(i: number) => void>(() => {})
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
    if (!text) { speakFromRef.current(i + 1); return }

    clearHighlight()
    el.classList.add('sp-reading-now')
    currentRef.current = el
    setIndex(i)
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = rateRef.current
    // Refs, not state: a voice or rate picked mid-article must apply to the NEXT paragraph
    // without rebuilding speakFrom, because a new identity there restarts the chain.
    const wanted = voiceRef.current
    const chosen = wanted ? window.speechSynthesis.getVoices().find((v) => v.voiceURI === wanted) : null
    if (chosen) u.voice = chosen
    u.onend = () => { if (!stoppedRef.current) speakFromRef.current(i + 1) }
    u.onerror = () => { if (!stoppedRef.current) { clearHighlight(); setStatus('idle'); setIndex(-1) } }
    window.speechSynthesis.speak(u)
  }, [])
  useEffect(() => { speakFromRef.current = speakFrom }, [speakFrom])
  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { indexRef.current = index }, [index])

  const play = useCallback(() => {
    if (!supported) return
    const synth = window.speechSynthesis
    if (status === 'paused') { synth.resume(); setStatus('playing'); return }
    stoppedRef.current = false
    synth.cancel()
    nodesRef.current = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR))
    setTotal(nodesRef.current.length)
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

  const setVoice = useCallback((uri: string | null) => {
    voiceRef.current = uri
    setVoiceURI(uri)
    try { if (uri) localStorage.setItem(STORAGE_VOICE, uri); else localStorage.removeItem(STORAGE_VOICE) } catch { /* ignore */ }
    // A queued utterance keeps the voice it was created with, so a change only reaches the
    // reader on the next paragraph. Re-speaking from the CURRENT one makes it immediate,
    // which is what anyone auditioning a voice expects.
    if (statusRef.current === 'playing') {
      const i = indexRef.current
      window.speechSynthesis.cancel()
      speakFromRef.current(Math.max(0, i))
    }
  }, [])

  const setRate = useCallback((r: number) => {
    rateRef.current = r
    setRateState(r)
    try { localStorage.setItem(STORAGE_RATE, String(r)) } catch { /* ignore */ }
    if (statusRef.current === 'playing') {
      const i = indexRef.current
      window.speechSynthesis.cancel()
      speakFromRef.current(Math.max(0, i))
    }
  }, [])

  return {
    supported, status, index, total, play, pause, stop,
    voices, voiceURI, setVoice, rate, setRate, rateSteps: RATE_STEPS,
  }
}

