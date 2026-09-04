// public/sw.js
// Caches the last 8 visited blog articles for offline reading.
// Strategy: network-first with cache fallback.
// Only caches GET requests for /blog/ article pages.

const CACHE_NAME = 'sp-offline-v1'
const MAX_ITEMS  = 8

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  // Remove old caches
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET requests for blog article pages
  if (request.method !== 'GET') return
  if (!url.pathname.match(/^\/blog\/.+/) || url.pathname === '/blog/') return

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response.ok && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, clone)
            // Evict oldest entries beyond MAX_ITEMS
            cache.keys().then(keys => {
              if (keys.length > MAX_ITEMS) {
                const toDelete = keys.slice(0, keys.length - MAX_ITEMS)
                toDelete.forEach(k => cache.delete(k))
              }
            })
          })
        }
        return response
      })
      .catch(() =>
        // Network failed — serve from cache if available
        caches.match(request).then(cached => {
          if (cached) return cached
          // Return a minimal offline page
          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title></head>
             <body style="background:#0a0a0a;color:#d6d3d1;font-family:monospace;padding:3rem;text-align:center;">
               <p style="font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#57534e;">
                 Stefan Peele Archive
               </p>
               <h1 style="font-size:2rem;margin:2rem 0 1rem;font-family:Georgia,serif;">You're offline</h1>
               <p style="color:#78716c;margin-bottom:2rem;">This article wasn't cached. Visit it online to read it.</p>
               <a href="/blog" style="color:#d6d3d1;text-decoration:underline;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">
                 ← Back to Archive
               </a>
             </body></html>`,
            { status: 503, headers: { 'Content-Type': 'text/html' } }
          )
        })
      )
  )
})