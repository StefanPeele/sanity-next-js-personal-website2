import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { LayerExplorer } from '@/components/blog/LayerExplorer'
import { PacketAnimator } from '@/components/blog/PacketAnimator'
import { client } from '@/sanity/lib/client'
import type { Metadata } from 'next'
// app/blog/osi-model/page.tsx

const settingsQuery = `*[_type == "settings"][0]`

export const metadata: Metadata = {
  title: 'OSI Model Reference | Stefan Peele',
  description:
    'An interactive reference for the 7-layer OSI model — protocols, real-world examples, and a full packet journey walkthrough. Built for CCNA students and network engineers.',
  openGraph: {
    title: 'OSI Model Reference | Stefan Peele',
    description:
      'Interactive 7-layer OSI model explorer with packet journey animator. Click any layer to inspect protocols and real-world deployment examples.',
    type: 'article',
    url: 'https://stefanpeele.com/blog/osi-model',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OSI Model Reference | Stefan Peele',
    description: 'Interactive OSI model explorer with packet journey animator.',
  },
}

const PACKET_STEPS = [
  {
    _key: 's1',
    label: 'Browser initiates HTTP GET',
    description:
      "Your browser constructs an HTTP GET request for the URL. This happens entirely at the Application layer — the browser doesn't yet know or care how the bytes will travel.",
    layer: 7,
    layerName: 'Application',
  },
  {
    _key: 's2',
    label: 'TLS encrypts the payload',
    description:
      'Before leaving the Application layer, TLS encrypts the HTTP data. At the Presentation layer, the data is transformed from readable text into ciphertext that only the destination server can decrypt.',
    layer: 6,
    layerName: 'Presentation',
  },
  {
    _key: 's3',
    label: 'TCP segments the data',
    description:
      'The Transport layer breaks the data into segments and adds a TCP header with source/destination port numbers (e.g., your ephemeral port → port 443), sequence numbers, and flags. This is where the three-way handshake was established.',
    layer: 4,
    layerName: 'Transport',
  },
  {
    _key: 's4',
    label: 'IP adds logical addressing',
    description:
      'The Network layer encapsulates the TCP segment into a packet, adding your source IP and the destination IP. Your router uses this IP header to make forwarding decisions.',
    layer: 3,
    layerName: 'Network',
  },
  {
    _key: 's5',
    label: 'Ethernet frames the packet',
    description:
      "The Data Link layer wraps the packet in an Ethernet frame, adding your MAC address as source and your default gateway's MAC as destination. ARP resolved this MAC address earlier.",
    layer: 2,
    layerName: 'Data Link',
  },
  {
    _key: 's6',
    label: 'Bits hit the wire',
    description:
      'The Physical layer converts the frame into electrical signals (copper) or light pulses (fiber) and transmits them. Your NIC fires the bits onto the Cat6 cable at up to 1Gbps.',
    layer: 1,
    layerName: 'Physical',
  },
]

export default async function OSIModelPage() {
  const settings = await client.fetch(settingsQuery)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-stone-300 selection:bg-stone-500/30">
      <Navbar data={settings} />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">

        {/* Breadcrumb */}
        <div className="mb-12 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-stone-600">
          <Link href="/blog" className="hover:text-stone-400 transition-colors">
            Editorial
          </Link>
          <span>/</span>
          <span className="text-stone-500">Reference</span>
          <span>/</span>
          <span className="text-white">OSI Model</span>
        </div>

        {/* Header */}
        <header className="mb-16 border-b border-white/5 pb-10">
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-stone-500 block mb-4 border-l border-stone-700 pl-4">
            Reference // Layer Architecture
          </span>
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-none mb-6">
            OSI Model<span className="text-stone-600">.</span>
          </h1>
          <p className="text-stone-500 font-sans text-base max-w-2xl leading-relaxed">
            The Open Systems Interconnection model is the conceptual framework that everything in
            networking is built on. Seven layers. Each with a job. Click any layer to inspect its
            protocols, what it actually does, and how it shows up in the real world.
          </p>
        </header>

        {/* Layer Explorer */}
        <section className="mb-16">
          <LayerExplorer />
        </section>

        {/* Packet Journey */}
        <section className="mb-20">
          <h2 className="font-serif text-2xl text-white mb-3 pb-4 border-b border-white/5">
            Packet Journey
          </h2>
          <p className="text-stone-500 text-sm mb-6 max-w-xl">
            Step through how a real HTTPS request travels down the OSI stack from your browser
            to the wire — one layer at a time.
          </p>
          <PacketAnimator
            value={{
              scenario: 'HTTPS GET Request — Full Stack Walkthrough',
              steps: PACKET_STEPS,
            }}
          />
        </section>

        {/* Quick Reference Table */}
        <section className="mb-20">
          <h2 className="font-serif text-2xl text-white mb-6 pb-4 border-b border-white/5">
            Quick Reference
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[11px]">
              <thead>
                <tr className="border-b border-white/5 text-stone-600 uppercase tracking-widest">
                  <th className="text-left py-3 pr-6 w-8">#</th>
                  <th className="text-left py-3 pr-6">Layer</th>
                  <th className="text-left py-3 pr-6">PDU</th>
                  <th className="text-left py-3 pr-6">Addressing</th>
                  <th className="text-left py-3">Key Protocols</th>
                </tr>
              </thead>
              <tbody className="text-stone-500">
                {[
                  { n: 7, name: 'Application',  pdu: 'Data',    addr: 'URL / FQDN',  proto: 'HTTP, HTTPS, DNS, SMTP, FTP, SNMP' },
                  { n: 6, name: 'Presentation', pdu: 'Data',    addr: '—',           proto: 'TLS/SSL, JPEG, ASCII, MPEG' },
                  { n: 5, name: 'Session',      pdu: 'Data',    addr: '—',           proto: 'NetBIOS, RPC, PPTP' },
                  { n: 4, name: 'Transport',    pdu: 'Segment', addr: 'Port number', proto: 'TCP, UDP, SCTP' },
                  { n: 3, name: 'Network',      pdu: 'Packet',  addr: 'IP address',  proto: 'IP, ICMP, OSPF, BGP, EIGRP' },
                  { n: 2, name: 'Data Link',    pdu: 'Frame',   addr: 'MAC address', proto: 'Ethernet, 802.11, ARP, STP, VLAN' },
                  { n: 1, name: 'Physical',     pdu: 'Bit',     addr: '—',           proto: 'DSL, SONET, 802.3, 802.11 (PHY)' },
                ].map((row) => (
                  <tr
                    key={row.n}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 pr-6 text-stone-700">{row.n}</td>
                    <td className="py-3 pr-6 text-stone-300">{row.name}</td>
                    <td className="py-3 pr-6">{row.pdu}</td>
                    <td className="py-3 pr-6">{row.addr}</td>
                    <td className="py-3 text-stone-600">{row.proto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Related posts placeholder */}
        <section>
          <h2 className="font-serif text-2xl text-white mb-6 pb-4 border-b border-white/5">
            Related Posts
          </h2>
          <p className="font-mono text-[10px] text-stone-700 uppercase tracking-widest">
            Posts tagged with OSI Model will appear here.
          </p>
        </section>

      </main>
    </div>
  )
}