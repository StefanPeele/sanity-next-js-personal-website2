import { ImageResponse } from 'next/og'
import { client } from '@/sanity/lib/client'
// app/blog/[slug]/opengraph-image.tsx
//
// Next.js auto-detects this file and uses it as the OG image for every
// /blog/[slug] route. No changes needed to generateMetadata.

export const runtime = 'edge'
export const size    = { width: 1200, height: 630 }
export const alt     = 'Stefan Peele | Digital Archive'

interface Post {
  title: string
  excerpt?: string
  categories?: string[]
  publishedAt: string
  mainImageUrl?: string
}

const postQuery = `
  *[_type == "post" && slug.current == $slug][0] {
    title,
    excerpt,
    "categories": categories[]->title,
    publishedAt,
    "mainImageUrl": mainImage.asset->url
  }
`

export default async function OGImage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await client.fetch<Post | null>(postQuery, { slug: params.slug })

  const title      = post?.title      ?? 'Stefan Peele | Digital Archive'
  const excerpt    = post?.excerpt    ?? 'Networking insights and CCNA deep-dives.'
  const categories = post?.categories ?? []
  const date       = post?.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : ''

  // Truncate title and excerpt for layout
  const displayTitle   = title.length > 65   ? title.slice(0, 62) + '...'   : title
  const displayExcerpt = excerpt.length > 120 ? excerpt.slice(0, 117) + '...' : excerpt

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
        {/* Cover image — blurred, darkened background */}
        {post?.mainImageUrl && (
          <img
            src={`${post.mainImageUrl}?w=1200&h=630&fit=crop&auto=format`}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.12,
              filter: 'grayscale(100%)',
            }}
            alt=""
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.85) 60%, rgba(20,20,20,0.95) 100%)',
          }}
        />

        {/* Top border accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.05) 100%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            padding: '60px 72px',
          }}
        >
          {/* Top row — site label + category badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              style={{
                fontFamily: '"Courier New", monospace',
                fontSize: '13px',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgba(168,162,158,0.6)',
              }}
            >
              STEFANPEELE.COM // DIGITAL ARCHIVE
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {categories.slice(0, 2).map((cat) => (
                <div
                  key={cat}
                  style={{
                    fontFamily: '"Courier New", monospace',
                    fontSize: '11px',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    color: 'rgba(168,162,158,0.7)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    padding: '6px 14px',
                    borderRadius: '2px',
                  }}
                >
                  {cat}
                </div>
              ))}
            </div>
          </div>

          {/* Middle — title + excerpt */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: displayTitle.length > 45 ? '52px' : '62px',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              {displayTitle}
            </div>

            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '20px',
                color: 'rgba(168,162,158,0.75)',
                lineHeight: 1.5,
                fontStyle: 'italic',
                maxWidth: '800px',
              }}
            >
              {displayExcerpt}
            </div>
          </div>

          {/* Bottom row — author + date */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Author dot */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Georgia, serif',
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                SP
              </div>
              <div
                style={{
                  fontFamily: '"Courier New", monospace',
                  fontSize: '13px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(168,162,158,0.6)',
                }}
              >
                Stefan Peele
              </div>
            </div>

            <div
              style={{
                fontFamily: '"Courier New", monospace',
                fontSize: '13px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(120,113,108,0.6)',
              }}
            >
              {date}
            </div>
          </div>
        </div>

        {/* Subtle corner grid marks */}
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
    {
      ...size,
    }
  )
}