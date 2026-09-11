// docs/audit/measure-themes.mjs
//
// Phase 5.2 — four article themes, one of them light. The light one is the risk: every
// muted colour on this site was chosen against a near-black ground, and stone-400 on cream
// is about 2.5:1.
//
// CONTRAST IS COMPOSITED, NOT SAMPLED. Reading the first non-transparent ancestor's
// background produced 322 false "low contrast" findings on this project once; the true
// count was 4. Every layer from the element up to the page ground is alpha-composited here
// before the ratio is computed, which is the only way the number means anything when the
// palette is built from rgb(255 255 255 / 0.05) fills.
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE = 'http://127.0.0.1:3000'
const OUT = path.join('docs', 'audit', 'screenshots', 'themes')
const THEMES = ['archive', 'slate', 'paper', 'terminal']
// AA for body text is 4.5:1; 3.0:1 is the large-text threshold. Anything below 3.0 is
// reported as a failure whatever its size, because nothing on an article page is decorative
// text at 24px+ except headings, which are checked at the same bar.
const MIN = 4.5
const MIN_LARGE = 3.0

let pass = 0
let fail = 0
const check = (ok, name, detail) => {
  if (ok) { pass++; console.log(`  PASS  ${name}${detail ? '  -- ' + detail : ''}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '  -- ' + detail : ''}`) }
}

// Runs in the page. Returns every visible text leaf with its composited contrast ratio.
const CONTRAST = () => {
  const parse = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c || '')
    if (!m) return null
    const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number)
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 }
  }
  // src over dst
  const over = (src, dst) => ({
    r: src.r * src.a + dst.r * (1 - src.a),
    g: src.g * src.a + dst.g * (1 - src.a),
    b: src.b * src.a + dst.b * (1 - src.a),
    a: 1,
  })
  const lum = ({ r, g, b }) => {
    const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4) }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
  }
  // Composite every ancestor background from the page ground down to the element.
  const groundOf = (el) => {
    const stack = []
    let n = el
    while (n && n !== document.documentElement) {
      const bg = parse(getComputedStyle(n).backgroundColor)
      if (bg && bg.a > 0) stack.push(bg)
      n = n.parentElement
    }
    const htmlBg = parse(getComputedStyle(document.documentElement).backgroundColor)
    const bodyBg = parse(getComputedStyle(document.body).backgroundColor)
    let base = { r: 255, g: 255, b: 255, a: 1 }
    if (htmlBg && htmlBg.a > 0) base = over(htmlBg, base)
    if (bodyBg && bodyBg.a > 0) base = over(bodyBg, base)
    // Furthest ancestor first, so each paints over the one behind it.
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base)
    return base
  }

  const ZW = new RegExp('[' + String.fromCharCode(0x200b, 0x200c, 0x200d, 0xfeff) + ']', 'g')
  const out = []
  // Walk TEXT NODES, not childless elements. The first version skipped any element that had
  // both text and a child element -- which is most links and headings -- and so passed the
  // site logo at pure white on cream while the screenshot plainly showed it. An element-based
  // scan misses exactly the nodes that matter most.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const seen = new Set()
  const els = []
  let node
  while ((node = walker.nextNode())) {
    if (!(node.nodeValue || '').replace(ZW, '').trim()) continue
    const el = node.parentElement
    if (el && !seen.has(el)) { seen.add(el); els.push(el) }
  }
  els.forEach((el) => {
    const text = (el.textContent || '').replace(ZW, '').trim()
    if (!text) return
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) return
    // aria-hidden text is not for reading -- a "·" separator between metadata items carries
    // nothing and is announced as "middle dot" if it is not hidden. CLAUDE.md allows
    // decorative marks below the readable floor, and this is how the harness tells the two
    // apart instead of flagging a separator in all four themes.
    if (el.closest('[aria-hidden="true"]')) return
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return
    // sr-only and other deliberately clipped text is not shown to anyone.
    if (r.width <= 1 || r.height <= 1) return
    const fg = parse(cs.color)
    if (!fg) return
    const ground = groundOf(el)
    const composited = fg.a < 1 ? over(fg, ground) : fg
    const size = parseFloat(cs.fontSize)
    const bold = parseInt(cs.fontWeight, 10) >= 700
    out.push({
      text: text.slice(0, 40),
      tag: el.tagName,
      cls: String(el.className).slice(0, 34),
      size,
      large: size >= 24 || (bold && size >= 18.66),
      ratio: Math.round(ratio(composited, ground) * 100) / 100,
      color: cs.color,
    })
  })
  return out
}

fs.mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  const page = await ctx.newPage()
  // A real published article, so this measures what a reader actually gets.
  await page.goto(`${BASE}/blog/the-field-the-moment-and-what-it-means-for-us-networking-industry`,
    { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2500)

  for (const theme of THEMES) {
    // Set it the way the reader does -- through the stored setting the provider reads --
    // rather than by adding the class by hand, so this exercises the real code path.
    await page.evaluate((t) => {
      localStorage.setItem('sp_theme', t)
    }, theme)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2200)

    const applied = await page.evaluate(() => {
      const root = document.querySelector('[data-article-root]')
      return {
        cls: root ? Array.from(root.classList).filter((c) => c.startsWith('theme-')) : [],
        ground: root ? getComputedStyle(root).backgroundColor : null,
        colorScheme: document.documentElement.style.colorScheme || getComputedStyle(document.documentElement).colorScheme,
      }
    })
    console.log(String.fromCharCode(10) + `── ${theme} ──  root=${applied.cls.join(',')}  ground=${applied.ground}  color-scheme=${applied.colorScheme}`)
    check(applied.cls.includes(`theme-${theme}`), `the theme class is applied`, applied.cls.join(',') || 'none')
    if (theme === 'paper') {
      check(applied.colorScheme === 'light', 'the light theme sets color-scheme: light on the root', applied.colorScheme)
    } else {
      check(applied.colorScheme === 'dark', 'dark themes keep color-scheme: dark', applied.colorScheme)
    }

    const nodes = await page.evaluate(CONTRAST)
    const bad = nodes.filter((n) => n.ratio < (n.large ? MIN_LARGE : MIN))
    console.log(`  ${nodes.length} visible text leaves measured`)
    if (bad.length) {
      // Group so one repeated utility does not print two hundred times.
      const byClass = new Map()
      bad.forEach((b) => {
        const k = `${b.cls}|${b.color}`
        const cur = byClass.get(k)
        if (!cur || b.ratio < cur.ratio) byClass.set(k, b)
      })
      ;[...byClass.values()].sort((a, b) => a.ratio - b.ratio).slice(0, 10).forEach((b) => {
        console.log(`    ${String(b.ratio).padStart(6)}:1  ${b.tag}.${b.cls}  ${b.size}px  ${b.color}  "${b.text}"`)
      })
    }
    check(bad.length === 0, `every visible text leaf clears AA`, `${bad.length} of ${nodes.length} below threshold`)

    await page.screenshot({ path: path.join(OUT, `theme-${theme}-1440.jpg`), type: 'jpeg', quality: 80 })
    console.log(`  captured theme-${theme}-1440.jpg`)
  }

  // The seven text sizes, and that the default still matches the pre-hydration paint.
  console.log(String.fromCharCode(10) + '── text sizes ──')
  await page.evaluate(() => { localStorage.setItem('sp_theme', 'archive'); localStorage.removeItem('sp_font_size') })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  const defaultFs = await page.evaluate(() => {
    const a = document.querySelector('[data-article]')
    return a ? getComputedStyle(a).getPropertyValue('--article-fs').trim() : null
  })
  // 1.1875rem = 19px. styles/article.css hard-codes this for the pre-hydration paint, so a
  // mismatch means the prose visibly resizes on load.
  check(defaultFs === '1.1875rem', 'the default size still equals the pre-hydration value', String(defaultFs))

  const sizes = []
  for (let i = 0; i < 7; i++) {
    await page.evaluate((n) => localStorage.setItem('sp_font_size', String(n)), i)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1400)
    sizes.push(await page.evaluate(() => {
      const a = document.querySelector('[data-article]')
      const p = a?.querySelector('p')
      return p ? Math.round(parseFloat(getComputedStyle(p).fontSize) * 10) / 10 : null
    }))
  }
  console.log(`  rendered px per step: ${sizes.join(', ')}`)
  check(sizes.every((v, i) => i === 0 || (v ?? 0) > (sizes[i - 1] ?? 0)), 'every step is strictly larger than the last', sizes.join(','))
  check(sizes.length === 7 && new Set(sizes).size === 7, 'seven distinct steps', `${new Set(sizes).size} distinct`)
  await ctx.close()
} finally {
  await browser.close()
}

console.log(String.fromCharCode(10) + `${pass} passed / ${fail} failed`)
process.exit(fail ? 1 : 0)
