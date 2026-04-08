'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// components/blog/LayerExplorer.tsx

const DEFAULT_LAYERS = [
  {
    number: 7,
    name: 'Application',
    color: '#6ee7b7',
    protocols: 'HTTP, DNS, SMTP, FTP, SNMP',
    description:
      'Provides network services directly to end-user applications. This is the layer your browser, email client, and other apps interact with.',
    realWorld:
      'When you type a URL in Chrome, the Application layer initiates an HTTP GET request.',
  },
  {
    number: 6,
    name: 'Presentation',
    color: '#93c5fd',
    protocols: 'TLS/SSL, JPEG, ASCII, MPEG',
    description:
      'Handles data translation, encryption, and compression. Ensures data from one system can be read by another regardless of format.',
    realWorld: "TLS encrypts your HTTPS traffic here before it's sent down the stack.",
  },
  {
    number: 5,
    name: 'Session',
    color: '#c4b5fd',
    protocols: 'NetBIOS, RPC, PPTP',
    description:
      'Manages sessions between applications — establishing, maintaining, and terminating connections between two devices.',
    realWorld:
      'When a video call drops and reconnects, the Session layer handles re-establishing that connection.',
  },
  {
    number: 4,
    name: 'Transport',
    color: '#fde68a',
    protocols: 'TCP, UDP, SCTP',
    description:
      'Provides end-to-end communication, error recovery, and flow control. TCP ensures reliable ordered delivery; UDP prioritizes speed over reliability.',
    realWorld:
      "TCP's three-way handshake (SYN → SYN-ACK → ACK) occurs here before any application data is exchanged.",
  },
  {
    number: 3,
    name: 'Network',
    color: '#fdba74',
    protocols: 'IP, ICMP, OSPF, BGP',
    description:
      'Handles logical addressing and routing between different networks. Routers operate at this layer, making forwarding decisions based on IP addresses.',
    realWorld:
      'Your router uses OSPF or BGP to determine the optimal path to forward packets across the internet.',
  },
  {
    number: 2,
    name: 'Data Link',
    color: '#f9a8d4',
    protocols: 'Ethernet, 802.11, ARP, STP',
    description:
      'Provides node-to-node data transfer and handles error detection within a single network segment. Switches operate here using MAC addresses.',
    realWorld:
      'ARP resolves IP addresses to MAC addresses. STP prevents bridge loops in switched networks.',
  },
  {
    number: 1,
    name: 'Physical',
    color: '#d1d5db',
    protocols: 'Copper, Fiber, Radio, DSL',
    description:
      'Handles the actual physical transmission of raw bits over a medium. NICs, cables, and hubs operate at this layer.',
    realWorld:
      'A Cat6a cable transmitting electrical signals at 10Gbps, or single-mode fiber transmitting light pulses.',
  },
]

interface LayerOverride {
  layerNumber: number
  protocols?: string
  description?: string
  realWorld?: string
}

interface LayerExplorerProps {
  value?: {
    title?: string
    overrides?: LayerOverride[]
  }
}

export function LayerExplorer({ value }: LayerExplorerProps) {
  const [activeLayer, setActiveLayer] = useState<number | null>(null)

  const layers = DEFAULT_LAYERS.map((layer) => {
    const override = value?.overrides?.find((o) => o.layerNumber === layer.number)
    return override ? { ...layer, ...override } : layer
  })

  const active = layers.find((l) => l.number === activeLayer)

  return (
    <div className="my-10 border border-white/10 rounded-lg overflow-hidden bg-[#0f0f0f]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500">
          {value?.title || 'OSI Model Explorer'}
        </span>
        <span className="font-mono text-[10px] text-stone-700">Click a layer to inspect</span>
      </div>

      <div className="grid md:grid-cols-2 md:divide-x divide-white/5">
        {/* Layer list */}
        <div className="p-3 space-y-0.5">
          {layers.map((layer) => (
            <button
              key={layer.number}
              onClick={() =>
                setActiveLayer(activeLayer === layer.number ? null : layer.number)
              }
              className={`w-full flex items-center gap-4 px-4 py-3 rounded transition-all duration-200 text-left group ${
                activeLayer === layer.number ? 'bg-white/5' : 'hover:bg-white/[0.03]'
              }`}
            >
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold text-black"
                style={{ backgroundColor: layer.color }}
              >
                {layer.number}
              </span>
              <span className="flex-1 font-serif text-base text-white group-hover:text-stone-200 transition-colors">
                {layer.name}
              </span>
              <span className="font-mono text-[9px] text-stone-700 hidden sm:block">
                {layer.protocols.split(',')[0].trim()}
              </span>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className="p-6 min-h-[300px] flex items-center justify-center border-t md:border-t-0 border-white/5">
          <AnimatePresence mode="wait">
            {active ? (
              <motion.div
                key={active.number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm font-bold text-black flex-shrink-0"
                    style={{ backgroundColor: active.color }}
                  >
                    {active.number}
                  </span>
                  <h3 className="font-serif text-2xl text-white">
                    {active.name} Layer
                  </h3>
                </div>

                <p className="text-stone-400 text-sm leading-relaxed mb-5">
                  {active.description}
                </p>

                <div className="mb-5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-600 mb-2">
                    Protocols &amp; Standards
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {active.protocols.split(',').map((p) => (
                      <span
                        key={p}
                        className="font-mono text-[10px] text-stone-400 border border-white/10 px-2 py-1 rounded-sm"
                      >
                        {p.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-600 mb-2">
                    Real World
                  </p>
                  <p className="text-stone-500 text-sm italic font-serif leading-relaxed">
                    {active.realWorld}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-mono text-[10px] text-stone-700 uppercase tracking-widest text-center"
              >
                Select a layer to inspect
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}