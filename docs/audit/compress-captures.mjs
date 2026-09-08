import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join('docs', 'audit', 'screenshots', 'site-inventory')
const MAX_W = 1100
const Q = 58

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.name.endsWith('.jpg')) out.push(p)
  }
  return out
}

const files = walk(ROOT)
let before = 0, after = 0, skipped = 0
sharp.cache(false)

for (const f of files) {
  const sz = fs.statSync(f).size
  before += sz
  try {
    const img = sharp(f)
    const meta = await img.metadata()
    // Very tall full-page shots exceed sharp's default pixel limit; raise it per-file.
    const pipe = sharp(f, { limitInputPixels: 4_000_000_000 })
    const buf = await (meta.width > MAX_W ? pipe.resize({ width: MAX_W }) : pipe)
      .jpeg({ quality: Q, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toBuffer()
    if (buf.length < sz) { fs.writeFileSync(f, buf); after += buf.length }
    else { after += sz; skipped++ }
  } catch (e) {
    after += sz; skipped++
    console.log('skip', path.basename(f), String(e).slice(0, 60))
  }
}

const mb = (b) => (b / 1048576).toFixed(1) + 'MB'
console.log(`${files.length} files: ${mb(before)} -> ${mb(after)} (${skipped} unchanged)`)
