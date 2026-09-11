import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'https://stefanpeele.com';
const MIN_RE = /(\d+)\s*min(?:ute)?s?\b/gi;

function allMins(text) {
  const out = [];
  let m;
  MIN_RE.lastIndex = 0;
  while ((m = MIN_RE.exec(text)) !== null) out.push({ n: Number(m[1]), ctx: text.slice(Math.max(0, m.index - 40), m.index + 20).replace(/\s+/g, ' ') });
  return out;
}

const browser = await chromium.launch();
const results = { viewports: {} };

for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/blog`, { waitUntil: 'networkidle', timeout: 60000 });
  // scroll to bottom to trigger any lazy render / infinite scroll
  for (let i = 0; i < 12; i++) {
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(1500);

  const indexData = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const anchors = [...document.querySelectorAll('a[href^="/blog/"]')];
    const cards = [];
    for (const a of anchors) {
      const href = a.getAttribute('href');
      // climb to the nearest container that is a plausible "card"
      let el = a;
      let best = a;
      for (let i = 0; i < 8 && el; i++) {
        el = el.parentElement;
        if (!el) break;
        const tag = el.tagName.toLowerCase();
        if (tag === 'article' || tag === 'li' || el.matches('[class*="card"]')) { best = el; break; }
        best = el;
        if (el.innerText && el.innerText.length > 600) break;
      }
      cards.push({
        href,
        anchorText: a.innerText,
        cardText: best.innerText,
        cardTag: best.tagName.toLowerCase(),
        cardClass: best.className && best.className.toString ? best.className.toString().slice(0, 120) : ''
      });
    }
    return { bodyText, cards, url: location.href };
  });

  const perPost = {};
  for (const c of indexData.cards) {
    const slug = c.href.replace(/^\/blog\/?/, '').replace(/[?#].*$/, '');
    if (!slug || slug === 'series') continue;
    const mins = allMins(c.cardText).map(x => x.n);
    if (!perPost[slug]) perPost[slug] = new Set();
    mins.forEach(n => perPost[slug].add(n));
  }

  const posts = {};
  for (const slug of Object.keys(perPost)) {
    const p2 = await ctx.newPage();
    await p2.goto(`${BASE}/blog/${slug}`, { waitUntil: 'networkidle', timeout: 60000 });
    await p2.waitForTimeout(1200);
    const art = await p2.evaluate(() => document.body.innerText);
    const artMins = allMins(art);
    posts[slug] = {
      indexCardMins: [...perPost[slug]],
      articleBodyMins: artMins.map(x => x.n),
      articleContexts: artMins.map(x => x.ctx)
    };
    await p2.close();
  }

  results.viewports[vp.name] = {
    indexUrl: indexData.url,
    indexBodyMins: allMins(indexData.bodyText),
    cardCount: indexData.cards.length,
    slugs: Object.keys(perPost),
    posts,
    indexBodyTextSample: indexData.bodyText.slice(0, 4000)
  };
  await ctx.close();
}

await browser.close();
fs.writeFileSync(process.argv[2] || 'probe-out.json', JSON.stringify(results, null, 2));
console.log('done');
