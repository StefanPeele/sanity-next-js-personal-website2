// docs/audit/probe-ch-inherit.mjs
//
// 7.2 needs ONE measure, set in `ch` at the reader's prose size, applied to children that
// have their OWN font sizes (an h2 is 38px, a paragraph 19px). An unregistered custom
// property is substituted as tokens, so `var(--measure)` holding `56ch` re-resolves against
// each child and an h2 would get 56 characters of 38px type — twice the intended column.
//
// A property registered with `syntax: '<length>'` is supposed to COMPUTE at the element
// that declares it and inherit as an absolute length. This measures whether that is true in
// the browser the suite runs, rather than trusting the spec, and it measures the
// unregistered case beside it as the negative control.
//
//   node docs/audit/probe-ch-inherit.mjs
//
import { chromium } from '@playwright/test'

const HTML = `<!doctype html><meta charset="utf-8">
<style>
  @property --measure-reg { syntax: '<length>'; inherits: true; initial-value: 0px; }
  body { margin: 0; font: 16px/1.5 system-ui, sans-serif; }
  .article { font-size: 19px; width: 2000px; }
  .article.reg   { --measure-reg: 56ch; }
  .article.unreg { --measure-unreg: 56ch; }
  .article.reg   > * { max-width: var(--measure-reg); }
  .article.unreg > * { max-width: var(--measure-unreg); }
  p  { font-size: 19px; margin: 0; }
  h2 { font-size: 38px; margin: 0; }
</style>
<div class="article reg"><p id="rp">x</p><h2 id="rh">x</h2></div>
<div class="article unreg"><p id="up">x</p><h2 id="uh">x</h2></div>
<div class="article" id="probe" style="font-size:19px"><span id="ch1" style="display:inline-block;width:1ch">x</span></div>
`

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent(HTML)
const out = await page.evaluate(() => {
  const w = (id) => Math.round(document.getElementById(id).getBoundingClientRect().width * 100) / 100
  return {
    oneCh19: w('ch1'),
    registered: { p: w('rp'), h2: w('rh') },
    unregistered: { p: w('up'), h2: w('uh') },
  }
})
await browser.close()

const expected = Math.round(out.oneCh19 * 56 * 100) / 100
console.log(`1ch at 19px system-ui: ${out.oneCh19}px  →  56ch = ${expected}px\n`)
console.log(`registered   <length>:  p ${out.registered.p}px   h2 ${out.registered.h2}px`)
console.log(`unregistered token   :  p ${out.unregistered.p}px   h2 ${out.unregistered.h2}px\n`)

const regOk = Math.abs(out.registered.p - expected) < 1 && Math.abs(out.registered.h2 - expected) < 1
const unregDiffers = Math.abs(out.unregistered.h2 - out.unregistered.p) > 1
console.log(regOk
  ? 'PASS  a registered <length> computes ch at the declaring element and inherits as px — the h2 gets the SAME column as the paragraph'
  : 'FAIL  the registered property did not compute at the declaring element')
console.log(unregDiffers
  ? `PASS (negative control)  the unregistered property re-resolves per child: the h2 column is ${Math.round((out.unregistered.h2 / out.unregistered.p) * 100) / 100}× the paragraph's`
  : 'FAIL (negative control)  the unregistered property did not differ — this probe proves nothing')
process.exit(regOk && unregDiffers ? 0 : 1)
