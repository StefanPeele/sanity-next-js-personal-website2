// docs/audit/render-toolbar-variants.mjs
//
// The reading toolbar's trigger, three size/placement variants, captured at 1440 and 390.
// CSS and DOM injected at runtime against the real page, so no application code changes
// until one is chosen. Same technique as render-card-options.mjs and render-divider-options.
//
// Today's trigger: 44px circle, 18px icon, 20px from the right edge at lg (16px on mobile),
// #d6d3d1 on a 72%-translucent surface. Stefan's brief: more clearance from the edge, a
// larger and higher-contrast icon, and "findable without being told it's there".
//
//   node docs/audit/render-toolbar-variants.mjs
//
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const SLUG = process.env.SLUG || 'the-field-the-moment-and-what-it-means-for-us-networking-industry'
const OUT = path.join('docs', 'audit', 'screenshots', 'toolbar-variants')
fs.mkdirSync(OUT, { recursive: true })

const VARIANTS = {
  baseline: '',

  // A — the same thing, bigger and louder, in the same place.
  A: `
    .reading-toolbar { right: 2rem !important; }
    @media (max-width: 1023px) { .reading-toolbar { right: 1.5rem !important; bottom: calc(1.5rem + env(safe-area-inset-bottom,0px)) !important; } }
    .reading-toolbar-trigger {
      width: 52px !important; height: 52px !important;
      color: #ffffff !important;
      background: var(--surface-raised) !important;
      border-color: var(--edge-strong) !important;
      box-shadow: 0 8px 26px rgb(0 0 0 / 0.5) !important;
    }
    .reading-toolbar-trigger svg { width: 22px !important; height: 22px !important; }
  `,

  // B — a labelled pill at lg, a circle on mobile. The label is the discoverability lever:
  // nothing else on the page tells a reader the control exists.
  B: `
    .reading-toolbar { right: 2rem !important; }
    @media (max-width: 1023px) { .reading-toolbar { right: 1.5rem !important; bottom: calc(1.5rem + env(safe-area-inset-bottom,0px)) !important; } }
    .reading-toolbar-trigger {
      width: auto !important; height: 52px !important;
      padding: 0 1.1rem !important; gap: 0.6rem;
      border-radius: 9999px !important;
      color: #ffffff !important;
      background: var(--surface-raised) !important;
      border-color: var(--edge-strong) !important;
      box-shadow: 0 8px 26px rgb(0 0 0 / 0.5) !important;
    }
    .reading-toolbar-trigger svg { width: 22px !important; height: 22px !important; }
    .reading-toolbar-trigger::after {
      content: 'Reading';
      font-family: var(--font-mono), 'IBM Plex Mono', monospace;
      font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap;
    }
    @media (max-width: 1023px) {
      .reading-toolbar-trigger { width: 52px !important; padding: 0 !important; }
      .reading-toolbar-trigger::after { content: none; }
    }
  `,

  // C — bigger and louder, but moved out of the vertical centre to the lower right, which is
  // where a reader who has used any other site expects a settings affordance to be.
  C: `
    @media (min-width: 1024px) {
      .reading-toolbar { right: 2rem !important; top: auto !important; bottom: 2rem !important; transform: none !important; }
    }
    @media (max-width: 1023px) { .reading-toolbar { right: 1.5rem !important; bottom: calc(1.5rem + env(safe-area-inset-bottom,0px)) !important; } }
    .reading-toolbar-trigger {
      width: 56px !important; height: 56px !important;
      color: #0a0a0a !important;
      background: #e7e5e4 !important;
      border-color: #e7e5e4 !important;
      box-shadow: 0 8px 26px rgb(0 0 0 / 0.55) !important;
    }
    .reading-toolbar-trigger svg { width: 24px !important; height: 24px !important; }
  `,
}

const browser = await chromium.launch()
try {
  for (const width of [1440, 390]) {
    for (const [name, css] of Object.entries(VARIANTS)) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
      const page = await ctx.newPage()
      await page.goto(`${BASE}/blog/${SLUG}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await page.waitForTimeout(1400)
      await page.evaluate(() => document.querySelectorAll('[data-sonner-toaster],[data-sonner-toast]').forEach((e) => e.remove()))
      if (css) await page.addStyleTag({ content: css })
      // Scroll into the body so the capture shows the trigger against prose, which is the
      // context a reader actually meets it in.
      await page.evaluate(() => window.scrollTo(0, 1400))
      await page.waitForTimeout(500)
      // The rail fades when idle; wake it so the capture shows its resting visible state.
      await page.mouse.move(width / 2, 400)
      await page.waitForTimeout(300)

      const m = await page.evaluate(() => {
        const el = document.querySelector('.reading-toolbar-trigger')
        const rail = document.querySelector('.reading-toolbar')
        if (!el || !rail) return null
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        const svg = el.querySelector('svg')
        const sr = svg?.getBoundingClientRect()
        return {
          w: Math.round(r.width), h: Math.round(r.height),
          clearance: Math.round(document.documentElement.clientWidth - r.right),
          icon: sr ? Math.round(sr.width) : 0,
          colour: cs.color,
          bg: cs.backgroundColor,
          centreY: Math.round(r.top + r.height / 2),
        }
      })
      console.log(`${String(width).padEnd(5)} ${name.padEnd(9)} ${m ? `${m.w}x${m.h} icon ${m.icon}px  clearance ${m.clearance}px  colour ${m.colour}  y ${m.centreY}` : 'NOT FOUND'}`)
      await page.screenshot({ path: path.join(OUT, `${name}-${width}.png`) })
      await ctx.close()
    }
    console.log('')
  }
} finally {
  await browser.close()
}
console.log(`frames in ${OUT}`)
