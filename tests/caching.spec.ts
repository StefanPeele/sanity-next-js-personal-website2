import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Guards the defect that made a comment deleted in Sanity stay on the live article for ever.
//
// next-sanity's production default is `revalidate: false` -- cached with no expiry -- so the
// ONLY thing that could ever clear a page's data was a revalidatePath from the Sanity
// webhook. When that webhook stopped arriving, content did not go stale for an hour, it went
// stale until the next deploy. 31 of 36 prerendered routes were in that state.
//
// `sanity/lib/live.ts` sets fetchOptions.revalidate, and because Next derives a route's
// revalidation period from the lowest revalidate among the fetches inside it, that one value
// also gives every STATIC route an expiry. This asserts the build output, not the source:
// the config could be present and still not reach the routes.

type Manifest = { routes?: Record<string, { initialRevalidateSeconds?: number | false }> }

/**
 * Assets and framework routes legitimately never expire -- they are immutable or empty.
 *
 * The exclusion is by EXTENSION and is deliberately narrow. A blanket "any route with a dot"
 * silently excused /blog/feed.xml, /blog/feed.json and /sitemap.xml -- three prerendered
 * surfaces whose whole job is to carry content that changes with every post, and the exact
 * three the test below benchmarks against while never inspecting them.
 */
const IMMUTABLE = new RegExp('[.](?:ico|png|jpg|svg|webmanifest|txt)$', 'i')

function isContentRoute(route: string): boolean {
  if (route.startsWith('/_')) return false
  if (IMMUTABLE.test(route)) return false
  return true
}

/** The syndication surfaces, named so a regression on them fails by name. */
const SYNDICATION = ['/blog/feed.xml', '/blog/feed.json', '/sitemap.xml']

test.describe('caching', () => {
  test('no content route is cached without an expiry', async () => {
    const file = path.join(process.cwd(), '.next', 'prerender-manifest.json')
    expect(fs.existsSync(file), 'the build output must be present — run npm run build').toBe(true)
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8')) as Manifest
    const routes = Object.entries(manifest.routes ?? {})

    // Precondition. An empty list would make every assertion below vacuously true, which is
    // how this suite has produced false passes before.
    expect(routes.length, 'the manifest lists prerendered routes').toBeGreaterThan(10)

    const content = routes.filter(([route]) => isContentRoute(route))
    expect(content.length, 'there are content routes to check').toBeGreaterThan(5)

    const frozen = content.filter(([, v]) => v.initialRevalidateSeconds === false).map(([route]) => route)
    expect(frozen, `these routes would serve build-time content for ever: ${frozen.join(', ')}`).toEqual([])
  })

  test('the feeds and the sitemap revalidate, and are the slowest thing here', async () => {
    const file = path.join(process.cwd(), '.next', 'prerender-manifest.json')
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8')) as Manifest
    const routes = manifest.routes ?? {}

    for (const route of SYNDICATION) {
      const entry = routes[route]
      expect(entry, `${route} must be prerendered for this to mean anything`).toBeTruthy()
      const seconds = entry?.initialRevalidateSeconds
      expect(typeof seconds, `${route} must have a numeric expiry, not ${String(seconds)}`).toBe('number')
      expect(seconds as number, `${route} would serve build-time content for ever`).toBeGreaterThan(0)
      expect(seconds as number, `${route} is slower than an hour`).toBeLessThanOrEqual(3600)
    }
  })

  test('every content route revalidates within an hour', async () => {
    const file = path.join(process.cwd(), '.next', 'prerender-manifest.json')
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8')) as Manifest
    const tooSlow = Object.entries(manifest.routes ?? {})
      .filter(([route]) => isContentRoute(route))
      .filter(([, v]) => typeof v.initialRevalidateSeconds === 'number' && v.initialRevalidateSeconds > 3600)
      .map(([route, v]) => `${route}=${v.initialRevalidateSeconds}s`)
    expect(tooSlow, `slower than the feeds, which are the slowest thing here on purpose`).toEqual([])
  })
})
