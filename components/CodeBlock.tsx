'use client'

import { useState } from 'react'
//components/CodeBlock.tsx
export function CodeBlock({ value }: any) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    // If you are using the official Sanity code plugin, the code is stored in value.code
    const textToCopy = value?.code || value?.text || ''
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative my-8 rounded-lg bg-[#0a0a0a] border border-white/10 overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-white/5">
        <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">
          {value?.language || 'terminal'}
        </span>
        <button
          onClick={handleCopy}
          className="text-[10px] font-mono uppercase tracking-widest text-stone-400 hover:text-white transition-colors"
        >
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono text-stone-300">
        <code>{value?.code || value?.text}</code>
      </pre>
    </div>
  )
}