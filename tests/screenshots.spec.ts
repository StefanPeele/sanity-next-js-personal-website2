import fs from 'node:fs'
import path from 'node:path'
import { test, type Page } from '@playwright/test'
import { firstPostSlug } from './helpers'
// tests/screenshots.spec.ts
// Visual baseline for the whole site: every route at 1440 / 768 / 390, in each state that
// changes what a visitor actually sees.
//   Output: docs/audit/screenshots/baseline/<breakpoint>/<route>-<state>.jpg
//   Run:    npm run build && npm run screenshot   (the config starts `npm start` on :3000)
//
// JPEG at quality 82, matching docs/audit/screenshots/{before,after}. PNG was tried first and
// cost 32.5MB, which exceeds the ~14MB payload this repo's remote accepts in one push. JPEG is
// 11MB for the same 81 captures and stays legible down to the 8px mono labels, because the site
// is light text on a dark ground and chroma subsampling only touches colour, not luminance.
//
// fullPage vs viewport: page-level states are full-page. States defined by a scroll position
// (hero / mid / footer) or by a fixed overlay (lightbox, reader menu, graph hover card) are
// viewport captures - a full-page shot ignores scroll offset, so three "scroll states" would
// be three identical files, and a position:fixed overlay renders in the wrong place when the
// viewport is expanded to the full document height.
//
// Contexts run with reducedMotion: 'reduce'. That is the resting state a baseline wants, and
// it makes the D3 force simulation settle synchronously (KnowledgeGraph.tsx:307).

const OUT = path.join('docs', 'audit', 'screenshots', 'baseline')
const ERROR_LOG = path.join(OUT, '_errors.log')

const BREAKPOINTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '768', width: 768, height: 1024 },
  { name: '390', width: 390, height: 844 },
] as const

/** Routes with no interactive state worth a second capture. */
const SIMPLE_ROUTES: Array<[route: string, name: string]> = [
  ['/library', 'library'],
  ['/projects', 'projects'],
  ['/resume', 'resume'],
  ['/now', 'now'],
  ['/uses', 'uses'],
  ['/contact', 'contact'],
]

// -- plumbing ---------------------------------------------------------------

/** Collect page errors, console errors and failed requests; append them to the run log. */
function watch(page: Page, label: string) {
  const seen = new Set<string>()
  const ignore = (s: string) => /_vercel\/|va\.vercel-scripts|upgrade-insecure-requests/.test(s)
  page.on('pageerror', (e) => {
    if (!ignore(e.message)) seen.add(`[pageerror] ${e.message}`)
  })
  page.on('console', (m) => {
    if (m.type() === 'error' && !ignore(m.text())) seen.add(`[console] ${m.text()}`)
  })
  page.on('requestfailed', (r) => {
    const why = r.failure()?.errorText ?? ''
    if (!ignore(r.url()) && !/ERR_ABORTED/.test(why)) seen.add(`[request] ${r.url()} - ${why}`)
  })
  return () => {
    if (!seen.size) return
    fs.mkdirSync(OUT, { recursive: true })
    fs.appendFileSync(ERROR_LOG, `\n## ${label}\n${[...seen].join('\n')}\n`)
    test.info().annotations.push({ type: 'page-errors', description: `${label}: ${seen.size} error(s)` })
  }
}

/** Note a state we could not reach, instead of failing the whole capture. */
function missing(what: string) {
  test.info().annotations.push({ type: 'state-unavailable', description: what })
}

async function settle(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.evaluate(() => (document.fonts ? document.fonts.ready.then(() => undefined) : undefined))
  // Sweep the document so lazy images decode and in-view animations fire, then return to the top.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let y = 0
        const tick = () => {
          window.scrollTo(0, y)
          y += 600
          if (y < document.documentElement.scrollHeight) setTimeout(tick, 40)
          else {
            window.scrollTo(0, 0)
            setTimeout(resolve, 80)
          }
        }
        tick()
      }),
  )
  await page
    .waitForFunction(() => Array.from(document.images).every((i) => i.complete), null, { timeout: 15_000 })
    .catch(() => {})
  await page.waitForTimeout(350)
}

async function scrollTo(page: Page, where: 'top' | 'middle' | 'bottom') {
  await page.evaluate((w) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo(0, w === 'top' ? 0 : w === 'middle' ? Math.round(max / 2) : max)
  }, where)
  await page.waitForTimeout(300)
}

async function shoot(page: Page, bp: string, name: string, fullPage = true) {
  const file = path.join(OUT, bp, `${name}.jpg`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  await page.screenshot({ path: file, fullPage, type: 'jpeg', quality: 82, animations: 'disabled', caret: 'hide' })
}

// -- captures ---------------------------------------------------------------

for (const bp of BREAKPOINTS) {
  test.describe(`${bp.name}px`, () => {
    test.use({ viewport: { width: bp.width, height: bp.height }, contextOptions: { reducedMotion: 'reduce' } })

    test('home', async ({ page }) => {
      const flush = watch(page, `${bp.name} - /`)
      await page.goto('/')
      await settle(page)
      await shoot(page, bp.name, 'home-full')
      await scrollTo(page, 'top')
      await shoot(page, bp.name, 'home-hero', false)
      await scrollTo(page, 'middle')
      await shoot(page, bp.name, 'home-mid', false)
      await scrollTo(page, 'bottom')
      await shoot(page, bp.name, 'home-footer', false)
      flush()
    })

    test('blog index', async ({ page }) => {
      const flush = watch(page, `${bp.name} - /blog`)
      await page.goto('/blog')
      await settle(page)
      await shoot(page, bp.name, 'blog-default')

      const chips = page.getByRole('group', { name: /filter by category/i }).getByRole('button')
      if ((await chips.count()) > 1) {
        await chips.nth(1).click()
        await settle(page)
        await shoot(page, bp.name, 'blog-category-filtered')
      } else {
        missing('/blog: no category filter chips rendered (taxonomy has no categories in the dataset)')
      }
      flush()
    })

    test('article', async ({ page, request }) => {
      const slug = await firstPostSlug(request)
      test.skip(!slug, 'no published posts in the dataset')
      const flush = watch(page, `${bp.name} - /blog/${slug}`)
      await page.goto(`/blog/${slug}`)
      await settle(page)
      await shoot(page, bp.name, 'post-full')
      await scrollTo(page, 'top')
      await shoot(page, bp.name, 'post-top', false)
      await scrollTo(page, 'middle')
      await shoot(page, bp.name, 'post-mid', false)

      // TOC: below lg this is a <details> under the header, at lg+ an always-open sidebar.
      await scrollTo(page, 'top')
      const mobileToc = page.locator('[data-toc="mobile"]')
      if (await mobileToc.isVisible().catch(() => false)) {
        const isOpen = await mobileToc.evaluate((el) => (el as HTMLDetailsElement).open)
        if (!isOpen) {
          await mobileToc.locator('summary').click()
          await page.waitForTimeout(300)
        }
        await mobileToc.scrollIntoViewIfNeeded()
        await page.waitForTimeout(200)
      }
      await shoot(page, bp.name, 'post-toc-open', false)

      const reader = page.getByRole('button', { name: /reading options/i }).first()
      if (await reader.count()) {
        await reader.click()
        await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {})
        await page.waitForTimeout(300)
        await shoot(page, bp.name, 'post-reader-menu-open', false)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(200)
      } else {
        missing('article: reading-options button not found')
      }

      await scrollTo(page, 'bottom')
      await shoot(page, bp.name, 'post-footer', false)
      flush()
    })

    test('photography', async ({ page }) => {
      const flush = watch(page, `${bp.name} - /photography`)
      await page.goto('/photography')
      await settle(page)
      await shoot(page, bp.name, 'photography-default')

      const tile = page.getByRole('button', { name: /^Open / }).first()
      if (await tile.count()) {
        await tile.click()
        await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {})
        await page.waitForTimeout(600)
        await shoot(page, bp.name, 'photography-lightbox-open', false)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      } else {
        missing('/photography: no photo tiles rendered (no galleries in the dataset)')
      }

      const links = page.getByRole('navigation', { name: /filter by category/i }).getByRole('link')
      if ((await links.count()) > 1) {
        await links.nth(1).click()
        await settle(page)
        await shoot(page, bp.name, 'photography-category-switched')
      } else {
        missing('/photography: no category links rendered')
      }
      flush()
    })

    test('services', async ({ page }) => {
      const flush = watch(page, `${bp.name} - /services`)
      await page.goto('/services')
      await settle(page)
      await shoot(page, bp.name, 'services-njit-off')

      const njit = page.getByRole('switch').first()
      if (await njit.count()) {
        await njit.click()
        await page.waitForTimeout(400)
        await shoot(page, bp.name, 'services-njit-on')
        await njit.click() // back to the default before expanding the form
        await page.waitForTimeout(300)
      } else {
        missing('/services: NJIT switch not found')
      }

      const trigger = page.locator('[aria-controls="booking-panel"]').first()
      if (await trigger.count()) {
        if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click()
        await page.waitForTimeout(700)
        await settle(page)
      } else {
        missing('/services: booking form renders inline (no disclosure button)')
      }
      await shoot(page, bp.name, 'services-booking-open')
      flush()
    })

    test('garden', async ({ page }) => {
      const flush = watch(page, `${bp.name} - /garden`)
      await page.goto('/garden')
      await settle(page)
      await shoot(page, bp.name, 'garden-default')

      const preview = page.getByRole('button', { name: /^Preview /i }).first()
      if (await preview.count()) {
        await preview.click()
        await page.waitForTimeout(500)
        await shoot(page, bp.name, 'garden-note-expanded')
      } else {
        missing('/garden: no note preview buttons (no notes in the dataset)')
      }

      const tags = page.getByRole('group', { name: /filter by tag/i }).getByRole('button')
      if ((await tags.count()) > 1) {
        await tags.nth(1).click()
        await settle(page)
        await shoot(page, bp.name, 'garden-tag-filtered')
      } else {
        missing('/garden: no tag filter chips rendered')
      }
      flush()
    })

    test('graph', async ({ page }) => {
      const flush = watch(page, `${bp.name} - /graph`)
      await page.goto('/graph')
      await settle(page)
      // The "Mapping connections" overlay is bound to the simulation settling state.
      await page
        .getByText(/mapping connections/i)
        .waitFor({ state: 'hidden', timeout: 30_000 })
        .catch(() => {})
      await page.waitForTimeout(800)
      await shoot(page, bp.name, 'graph-settled')

      const node = page.locator('svg [data-id]').first()
      if (await node.count()) {
        await node.hover({ force: true })
        await page.waitForTimeout(600)
        await shoot(page, bp.name, 'graph-node-hovered', false)
      } else {
        missing('/graph: no nodes rendered')
      }
      flush()
    })

    for (const [route, name] of SIMPLE_ROUTES) {
      test(name, async ({ page }) => {
        const flush = watch(page, `${bp.name} - ${route}`)
        await page.goto(route)
        await settle(page)
        await shoot(page, bp.name, `${name}-default`)
        flush()
      })
    }
  })
}
