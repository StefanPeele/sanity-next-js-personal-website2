'use client'

import { useEffect } from 'react'
// components/ServiceWorkerRegister.tsx — registers /sw.js in production only. Renders nothing.

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
  }, [])
  return null
}
