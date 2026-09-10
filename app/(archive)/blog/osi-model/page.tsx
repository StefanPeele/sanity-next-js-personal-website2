import Link from 'next/link'
import { LayerExplorer } from '@/components/blog/LayerExplorer'
import { PacketAnimator } from '@/components/blog/PacketAnimator'
import type { Metadata } from 'next'
import { getCopy } from '@/lib/cms/loaders'
import { knowledgePagesQuery } from '@/sanity/lib/queries-article-ui'
import { DEFAULT_KNOWLEDGE_PAGES } from '@/lib/cms/defaults/knowledgePages'
import { absoluteUrl } from '@/lib/site'
import { FOCUS } from '@/lib/ui'
// app/blog/osi-model/page.tsx

export async function generateMetadata(): Promise<Metadata> {
  const h = (await getCopy(knowledgePagesQuery, DEFAULT_KNOWLEDGE_PAGES)).osi.header
  const title = h.metaTitle || h.title
  const description = h.metaDescription || h.lede
  return {
    title,
    description,
    openGraph: { title, description, type: 'article', url: absoluteUrl('/blog/osi-model') },
    twitter: { card: 'summary_large_image', title, description },
  }
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
  const copy = (await getCopy(knowledgePagesQuery, DEFAULT_KNOWLEDGE_PAGES)).osi
  const col = copy.quickReference.columns
  return (
    <div className="min-h-screen text-stone-300 selection:bg-stone-500/30">

      <main id="content" className="max-w-5xl mx-auto px-6 pt-32 pb-24">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-10 flex items-center gap-2 font-sans text-sm text-stone-400">
          <Link href="/blog" className={`hover:text-white transition-colors rounded-sm ${FOCUS}`}>{copy.backLabel}</Link>
          <span aria-hidden="true">/</span>
          <span className="text-stone-200">{copy.breadcrumbLabel}</span>
        </nav>

        {/* Header */}
        <header className="mb-16 border-b border-edge-faint pb-10">
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-none mb-6">
            {copy.header.title}
          </h1>
          <p className="text-stone-400 font-sans text-base max-w-2xl leading-relaxed">
            {copy.header.lede}
          </p>
        </header>

        {/* Layer Explorer */}
        <section className="mb-16">
          <LayerExplorer />
        </section>

        {/* Packet Journey */}
        <section className="mb-20">
          <h2 className="font-serif text-2xl text-white mb-3 pb-4 border-b border-edge-faint">
            {copy.packetJourney.heading}
          </h2>
          <p className="text-stone-400 text-sm mb-6 max-w-xl">
            {copy.packetJourney.lede}
          </p>
          <PacketAnimator
            value={{
              scenario: copy.packetJourney.scenario,
              steps: PACKET_STEPS,
            }}
          />
        </section>

        {/* Quick Reference Table */}
        <section className="mb-20">
          <h2 className="font-serif text-2xl text-white mb-6 pb-4 border-b border-edge-faint">
            {copy.quickReference.heading}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="border-b border-edge-faint text-stone-400 uppercase tracking-widest">
                  <th className="text-left py-3 pr-6 w-8">{col.n}</th>
                  <th className="text-left py-3 pr-6">{col.layer}</th>
                  <th className="text-left py-3 pr-6">{col.pdu}</th>
                  <th className="text-left py-3 pr-6">{col.addressing}</th>
                  <th className="text-left py-3">{col.protocols}</th>
                </tr>
              </thead>
              <tbody className="text-stone-400">
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
                    className="border-b border-edge-faint hover:bg-surface-veil transition-colors"
                  >
                    <td className="py-3 pr-6 text-stone-400">{row.n}</td>
                    <td className="py-3 pr-6 text-stone-300">{row.name}</td>
                    <td className="py-3 pr-6">{row.pdu}</td>
                    <td className="py-3 pr-6">{row.addr}</td>
                    <td className="py-3 text-stone-400">{row.proto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>


      </main>
    </div>
  )
}