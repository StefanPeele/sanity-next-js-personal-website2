import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { firstPostSlug } from './helpers'
// tests/smoke.spec.ts
// Every reserved route returns 200 with exactly one <h1> and a #content landmark; unknown slugs 404
// with the Studio-editable copy; feeds/sitemap/robots parse; the article page has one TOC, one progress
// bar and the reader menu; no CSP violations are reported; axe finds no critical/serious issues.

const PAGES = [
  '/', '/blog', '/blog/series', '/blog/osi-model', '/garden', '/graph', '/library', '/glossary',
  '/projects', '/resume', '/photography', '/photography/albums', '/services', '/contact',
  '/now', '/uses', '/offline',
]

for (const path of PAGES) {
  test(`${path} renders with one h1 and a content landmark`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response?.status(), `${path} status`).toBe(200)
    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('#content')).toHaveCount(1)
  })
}

test('unknown slug returns 404 with the error-page copy', async ({ page }) => {
  const response = await page.goto('/definitely-missing-page')
  expect(response?.status()).toBe(404)
  await expect(page.locator('h1')).toContainText(/not found/i)
})

test('studio route loads', async ({ request }) => {
  const res = await request.get('/studio')
  expect(res.status()).toBe(200)
})

test('sitemap.xml lists routes and excludes reserved paths', async ({ request }) => {
  const res = await request.get('/sitemap.xml')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('xml')
  const body = await res.text()
  expect(body).toContain('<urlset')
  expect(body).toContain('/blog</loc>')
  expect(body).not.toContain('/offline</loc>')
  expect(body).not.toContain('/studio</loc>')
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

test('health endpoint reports status', async ({ request }) => {
  const res = await request.get('/api/health')
  const json = await res.json()
  expect(['operational', 'degraded']).toContain(json.status)
})

test('security headers are present', async ({ request }) => {
  const res = await request.get('/')
  const h = res.headers()
  expect(h['x-content-type-options']).toBe('nosniff')
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(h['content-security-policy'] ?? h['content-security-policy-report-only']).toContain("default-src 'self'")
})

test.describe('article page', () => {
  test('keeps one TOC per breakpoint, one progress bar and the reader menu', async ({ page, request }) => {
    const slug = await firstPostSlug(request)
    test.skip(!slug, 'no blog posts published yet')
    const response = await page.goto(`/blog/${slug}`)
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('[role="progressbar"]')).toHaveCount(1)
    await expect(page.getByRole('button', { name: /reading options/i })).toHaveCount(1)
    // Desktop: the sidebar TOC is visible, the mobile one is not.
    await expect(page.locator('[data-toc="sidebar"]')).toBeVisible()
    await expect(page.locator('[data-toc="mobile"]')).toBeHidden()
    // None of the removed floating widgets are present.
    await expect(page.locator('[data-floating-toolbar], .sp-cursor, .sp-crt-overlay')).toHaveCount(0)
  })

  test('reader menu opens and closes with Escape', async ({ page, request }) => {
    const slug = await firstPostSlug(request)
    test.skip(!slug, 'no blog posts published yet')
    await page.goto(`/blog/${slug}`)
    const button = page.getByRole('button', { name: /reading options/i })
    await button.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(button).toBeFocused()
  })

  test('mobile shows one TOC and no floating pills', async ({ browser, request }) => {
    const slug = await firstPostSlug(request)
    test.skip(!slug, 'no blog posts published yet')
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    const page = await context.newPage()
    await page.goto(`/blog/${slug}`)
    await expect(page.locator('[data-toc="mobile"]')).toBeVisible()
    await expect(page.locator('[data-toc="sidebar"]')).toBeHidden()
    await expect(page.locator('[role="progressbar"]')).toHaveCount(1)
    await context.close()
  })
})

test('no CSP violations on the main routes', async ({ page, request }) => {
  const slug = await firstPostSlug(request)
  const violations: string[] = []
  page.on('console', (msg) => {
    const text = msg.text()
    // Vercel analytics scripts 404 outside Vercel, and the report-only note is informational.
    if (/_vercel\/|upgrade-insecure-requests/.test(text)) return
    if (/Content Security Policy|Refused to (load|execute|connect|apply|frame)/i.test(text)) violations.push(text)
  })
  for (const path of ['/', '/blog', '/services', '/photography', '/graph', ...(slug ? [`/blog/${slug}`] : [])]) {
    await page.goto(path)
    await page.waitForLoadState('networkidle').catch(() => {})
  }
  expect(violations, violations.join('\n')).toEqual([])
})

// Axe reads computed colours; with enter animations mid-flight it sees half-faded text. Reduced
// motion renders the resting state, which is what a reader with the preference gets anyway.
test.describe('accessibility', () => {
test.use({ contextOptions: { reducedMotion: 'reduce' } })

for (const path of ['/', '/blog', '/services']) {
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

test('first post has no critical/serious accessibility violations', async ({ page, request }) => {
  const slug = await firstPostSlug(request)
  test.skip(!slug, 'no blog posts published yet')
  await page.goto(`/blog/${slug}`)
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
  expect(blocking, blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`).join('\n')).toEqual([])
})
})
