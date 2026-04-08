'use client'

import { useState } from 'react'
import ImageBox from '@/components/ImageBox'
// components/blog/WiresharkCallout.tsx

interface Callout {
  _key: string
  number: number
  rowDescription: string
  explanation: string
}

interface WiresharkCalloutProps {
  value: {
    image: any
    caption?: string
    callouts?: Callout[]
  }
}

export function WiresharkCallout({ value }: WiresharkCalloutProps) {
  const [activeCallout, setActiveCallout] = useState<number | null>(null)

  const callouts = value.callouts ?? []
  const active = callouts.find((c) => c.number === activeCallout)

  return (
    <div className="my-10 border border-white/10 rounded-lg overflow-hidden bg-[#0f0f0f]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500">
          Wireshark Capture
        </span>
        <span className="font-mono text-[10px] text-stone-700">
          {callouts.length > 0 ? `${callouts.length} annotations` : 'Lab Evidence'}
        </span>
      </div>

      {/* Screenshot with callout badges */}
      <div className="relative">
        {value.image && (
          <ImageBox
            image={value.image}
            alt={value.caption || 'Wireshark packet capture'}
            classesWrapper="relative w-full aspect-[16/7]"
          />
        )}

        {/* Callout number badges stacked in the top-left */}
        {callouts.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {callouts.map((callout) => (
              <button
                key={callout._key}
                onMouseEnter={() => setActiveCallout(callout.number)}
                onMouseLeave={() => setActiveCallout(null)}
                onClick={() =>
                  setActiveCallout(activeCallout === callout.number ? null : callout.number)
                }
                className={`w-6 h-6 rounded-full font-mono text-[10px] font-bold flex items-center justify-center transition-all duration-200 shadow-lg ${
                  activeCallout === callout.number
                    ? 'bg-white text-black scale-125 ring-2 ring-white/30'
                    : 'bg-emerald-500 text-black hover:scale-110'
                }`}
              >
                {callout.number}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      <div className="p-5 border-t border-white/5 min-h-[72px] flex items-center">
        {active ? (
          <div className="flex gap-4 items-start w-full">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-black font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {active.number}
            </span>
            <div>
              <p className="font-mono text-[10px] text-stone-500 mb-1">
                {active.rowDescription}
              </p>
              <p className="text-stone-400 text-sm leading-relaxed">{active.explanation}</p>
            </div>
          </div>
        ) : (
          <p className="font-mono text-[10px] text-stone-700 uppercase tracking-widest">
            {value.caption || 'Hover a callout number to inspect the capture'}
          </p>
        )}
      </div>
    </div>
  )
}