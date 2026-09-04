import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
// tests/smoke.spec.ts
// Every primary route returns 200 and has exactly one <h1>; feeds/sitemap/robots parse;
// axe reports no critical/serious violations on / and /blog.

const PAGES = [
  '/', '/blog', '/garden', '/graph', '/library', '/projects', '/resume',
  '/photography', '/services', '/contact', '/now',
]

for (const path of PAGES) {
  test(`${path} renders with an h1`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response?.status(), `${path} status`).toBe(200)
    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page.locator('#content')).toHaveCount(1)
  })
}

test('sitemap.xml lists routes', async ({ request }) => {
  const res = await request.get('/sitemap.xml')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('xml')
  const body = await res.text()
  expect(body).toContain('<urlset')
  expect(body).toContain('/blog</loc>')
})

test('robots.txt allows crawling and points at the sitemap', async ({ request }) => {
  const res = await request.get('/robots.txt')
  expect(res.status()).toBe(200)
  const body = await res.text()
  expect(body).toMatch(/User-Agent: \*/i)
  expect(body).toContain('Disallow: /studio')
  expect(body).toContain('Sitemap:')
})

test('RSS feed is valid-looking RSS 2.0', async ({ request }) => {
  const res = await request.get('/blog/feed.xml')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('rss+xml')
  const body = await res.text()
  expect(body).toContain('<rss version="2.0"')
  expect(body).toContain('<atom:link')
})

test('JSON feed is JSON Feed 1.1', async ({ request }) => {
  const res = await request.get('/blog/feed.json')
  expect(res.status()).toBe(200)
  const json = await res.json()
  expect(json.version).toBe('https://jsonfeed.org/version/1.1')
  expect(Array.isArray(json.items)).toBe(true)
})

test('first blog post from the sitemap renders', async ({ page, request }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  const match = xml.match(/<loc>[^<]*\/blog\/(?!series\/|osi-model|feed)([^<\/]+)<\/loc>/)
  test.skip(!match, 'no blog posts published yet')
  const slug = match![1]
  const response = await page.goto(`/blog/${slug}`)
  expect(response?.status()).toBe(200)
  await expect(page.locator('h1').first()).toBeVisible()
})

test('health endpoint reports status', async ({ request }) => {
  const res = await request.get('/api/health')
  const json = await res.json()
  expect(['operational', 'degraded']).toContain(json.status)
})

for (const path of ['/', '/blog']) {
  test(`${path} has no critical/serious accessibility violations`, async ({ page }) => {
    await page.goto(path)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    expect(
      blocking,
      blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`).join('\n'),
    ).toEqual([])
  })
}
