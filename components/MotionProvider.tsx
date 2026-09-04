'use client'

import { MotionConfig } from 'framer-motion'
// components/MotionProvider.tsx
// Site-wide framer-motion config. `reducedMotion="user"` disables transform/layout
// animations when the OS asks for reduced motion; opacity still animates.

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
