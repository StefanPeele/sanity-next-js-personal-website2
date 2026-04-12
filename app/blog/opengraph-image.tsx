import { ImageResponse } from 'next/og'
// app/blog/opengraph-image.tsx

export const runtime = 'edge'
export const size    = { width: 1200, height: 630 }
export const alt     = 'Editorial | Stefan Peele'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0a',
          position: 'relative',
          fontFamily: 'Georgia, serif',
          overflow: 'hidden',
        }}
      >
        {/* Top border */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.05) 100%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            padding: '60px 72px',
          }}
        >
          {/* Label */}
          <div
            style={{
              fontFamily: '"Courier New", monospace',
              fontSize: '13px',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: 'rgba(120,113,108,0.7)',
              borderLeft: '2px solid rgba(120,113,108,0.3)',
              paddingLeft: '16px',
            }}
          >
            Intelligence // Archive
          </div>

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '96px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              Editorial
              <span style={{ color: 'rgba(87,83,78,0.8)' }}>.</span>
            </div>
            <div
              style={{
                fontFamily: '"Courier New", monospace',
                fontSize: '16px',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgba(120,113,108,0.6)',
              }}
            >
              CCNA Labs · Concept Deep-Dives · Industry Trends · Real-World Infrastructure
            </div>
          </div>

          {/* Bottom */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: '24px',
            }}
          >
            <div
              style={{
                fontFamily: '"Courier New", monospace',
                fontSize: '13px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(168,162,158,0.5)',
              }}
            >
              STEFANPEELE.COM
            </div>
            <div
              style={{
                fontFamily: '"Courier New", monospace',
                fontSize: '13px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(120,113,108,0.4)',
              }}
            >
              STATUS: ● OPERATIONAL
            </div>
          </div>
        </div>

        {/* Corner marks */}
        {[
          { top: '24px', left: '24px' },
          { top: '24px', right: '24px' },
          { bottom: '24px', left: '24px' },
          { bottom: '24px', right: '24px' },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              ...pos,
              width: '12px',
              height: '12px',
              borderTop: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              borderBottom: i >= 2 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              borderLeft: i % 2 === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              borderRight: i % 2 === 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}
          />
        ))}
      </div>
    ),
    { ...size }
  )
}