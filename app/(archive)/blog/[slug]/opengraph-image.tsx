import { ImageResponse } from 'next/og'
import { client } from '@/sanity/lib/client'
import { articleOgQuery } from '@/sanity/lib/queries-article'
import { ARTICLE_TYPES, SITE, articleTypeMeta } from '@/lib/site'
import { formatDate } from '@/lib/dates'
// app/(archive)/blog/[slug]/opengraph-image.tsx
// Branded OG card: lane colour from ARTICLE_TYPES, reading time, series part, site name.
// Runs on the Node runtime (the stega-enabled client is not edge-safe).

export const size = { width: 1200, height: 630 }
export const alt = `${SITE.name} | Digital Archive`
export const contentType = 'image/png'

const MONO = '"Courier New", monospace'
const SERIF = 'Georgia, serif'

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await client.fetch(articleOgQuery, { slug }, { stega: false })

  const title = post?.title ?? `${SITE.name} | Digital Archive`
  const excerpt = post?.excerpt ?? SITE.description
  const lane = articleTypeMeta(post?.articleType) ?? ARTICLE_TYPES['concept-deep-dive']
  const accent = lane.color
  const date = formatDate(post?.publishedAt, 'long')
  const minutes = Math.max(1, Math.round((post?.wordCount ?? 0) / 220))
  const series = post?.series?.title ? `${post.seriesOrder ? `Part ${post.seriesOrder} · ` : ''}${post.series.title}` : null
  const categories = (post?.categories ?? []).filter((c): c is string => !!c).slice(0, 2)

  const displayTitle = title.length > 70 ? title.slice(0, 67) + '…' : title
  const displayExcerpt = excerpt.length > 130 ? excerpt.slice(0, 127) + '…' : excerpt

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px', height: '630px', display: 'flex', flexDirection: 'column',
          backgroundColor: '#0a0a0a', position: 'relative', fontFamily: SERIF, overflow: 'hidden',
        }}
      >
        {post?.mainImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain elements
          <img
            src={`${post.mainImageUrl}?w=1200&h=630&fit=crop&auto=format&q=60`}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.14, filter: 'grayscale(100%)' }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.85) 60%, rgba(20,20,20,0.95) 100%)' }} />
        {/* Lane-coloured top rule */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: accent }} />
        {/* Lane glow */}
        <div style={{ position: 'absolute', right: '-120px', top: '-120px', width: '420px', height: '420px', borderRadius: '50%', background: lane.bg, filter: 'blur(20px)' }} />

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: '56px 72px' }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ fontFamily: MONO, fontSize: '13px', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, border: `1px solid ${accent}`, padding: '8px 14px', borderRadius: '2px', display: 'flex' }}>
                {lane.label}
              </div>
              {series && (
                <div style={{ fontFamily: MONO, fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(214,211,209,0.8)', display: 'flex' }}>
                  {series}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {categories.map((cat) => (
                <div key={cat} style={{ fontFamily: MONO, fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(168,162,158,0.8)', border: '1px solid rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: '2px', display: 'flex' }}>
                  {cat}
                </div>
              ))}
            </div>
          </div>

          {/* Title + excerpt */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ fontFamily: SERIF, fontSize: displayTitle.length > 45 ? '54px' : '64px', fontWeight: 700, color: '#ffffff', lineHeight: 1.08, letterSpacing: '-0.02em', display: 'flex' }}>
              {displayTitle}
            </div>
            <div style={{ fontFamily: SERIF, fontSize: '21px', color: 'rgba(214,211,209,0.8)', lineHeight: 1.45, fontStyle: 'italic', maxWidth: '860px', display: 'flex' }}>
              {displayExcerpt}
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', border: `1px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: '14px', color: '#ffffff' }}>
                SP
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontFamily: MONO, fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ffffff', display: 'flex' }}>{SITE.name}</div>
                <div style={{ fontFamily: MONO, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(168,162,158,0.7)', display: 'flex' }}>stefanpeele.com · Digital Archive</div>
              </div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(168,162,158,0.8)', display: 'flex', gap: '18px' }}>
              {date && <span>{date}</span>}
              <span style={{ color: accent }}>{minutes} min read</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
