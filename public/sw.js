// public/sw.js
// Offline reading for the archive.
//   - Article navigations (/blog/<slug>): network-first, cached for offline; last 12 kept.
//   - /_next/static/**: cache-first (hashed, immutable) so offline pages are styled and hydrate.
//   - Everything else (RSC payloads, prefetches, API, images): untouched.
// Registered only in production by components/blog/ArticleEffects.tsx.

const PAGE_CACHE = 'sp-pages-v2'
const STATIC_CACHE = 'sp-static-v2'
const MAX_PAGES = 12

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== PAGE_CACHE && k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

function isArticleNavigation(request, url) {
  if (request.method !== 'GET') return false
  if (request.mode !== 'navigate') return false
  if (request.headers.get('RSC') || request.headers.get('Next-Router-Prefetch')) return false
  if (url.origin !== self.location.origin) return false
  return /^\/blog\/[^/]+\/?$/.test(url.pathname) && !/^\/blog\/(feed|series)/.test(url.pathname)
}

async function trimPages() {
  const cache = await caches.open(PAGE_CACHE)
  const keys = await cache.keys()
  if (keys.length > MAX_PAGES) {
    await Promise.all(keys.slice(0, keys.length - MAX_PAGES).map((k) => cache.delete(k)))
  }
}

function offlinePage() {
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · Stefan Peele</title>
<style>
  html,body{margin:0;background:#0a0a0a;color:#d6d3d1;font-family:Georgia,serif;-webkit-font-smoothing:antialiased}
  main{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem 1.5rem;text-align:center}
  .label{font-family:"IBM Plex Mono","Courier New",monospace;font-size:10px;letter-spacing:.4em;text-transform:uppercase;color:#78716c;border-left:1px solid #44403c;padding-left:1rem;margin-bottom:2.5rem}
  h1{font-size:clamp(40px,9vw,88px);font-weight:700;color:#fff;line-height:1;margin:0 0 1.25rem;letter-spacing:-.02em}
  p{font-style:italic;color:#a8a29e;font-size:1.15rem;max-width:32rem;line-height:1.6;margin:0 0 .75rem}
  .meta{font-family:"IBM Plex Mono","Courier New",monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#78716c;font-style:normal;margin-bottom:2.5rem}
  a{font-family:"IBM Plex Mono","Courier New",monospace;font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#0a0a0a;background:#fff;padding:.85rem 1.4rem;text-decoration:none}
  a:hover{background:#e7e5e4}
  .rule{margin-top:4rem;padding-top:2rem;border-top:1px solid rgba(255,255,255,.06);font-family:"IBM Plex Mono","Courier New",monospace;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#57534e}
</style></head>
<body><main>
  <span class="label">Archive // Offline</span>
  <h1>Signal lost.</h1>
  <p>This article isn&rsquo;t saved on this device yet.</p>
  <p class="meta">The last 12 articles you opened are kept for offline reading</p>
  <a href="/blog">Back to the archive</a>
  <div class="rule">STATUS: OFFLINE · STEFANPEELE.COM</div>
</main></body></html>`,
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  let url
  try { url = new URL(request.url) } catch { return }

  // Hashed build assets: cache-first.
  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request)
        if (hit) return hit
        const response = await fetch(request)
        if (response.ok && !response.redirected) event.waitUntil(cache.put(request, response.clone()))
        return response
      }),
    )
    return
  }

  if (!isArticleNavigation(request, url)) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.status === 200 && !response.redirected && response.type === 'basic') {
          const clone = response.clone()
          event.waitUntil(
            caches.open(PAGE_CACHE)
              .then((cache) => cache.put(request, clone))
              .then(trimPages)
              .catch(() => {}),
          )
        }
        return response
      })
      .catch(async () => {
        const cached = await caches.match(request, { cacheName: PAGE_CACHE, ignoreSearch: true })
        return cached ?? offlinePage()
      }),
  )
})
