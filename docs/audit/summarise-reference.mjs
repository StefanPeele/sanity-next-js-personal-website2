// docs/audit/summarise-reference.mjs — reads the JSON the measurement harness wrote
// and prints the numbers that matter, so the writeup quotes measurements not memory.
import fs from 'node:fs'
import path from 'node:path'

const dir = process.argv[2]
const mode = process.argv[3] ?? 'scale'
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()

for (const f of files) {
  const r = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
  if (r.error || !r.data || !r.data.headlines?.length) {
    console.log(`\n### ${r.name}  —  BLOCKED (${r.status ?? r.error})`)
    continue
  }
  const d = r.data
  const heads = d.headlines
  const lead = heads[0]
  const body = d.typeScale.filter((s) => s.px >= 13 && s.px <= 22).sort((a, b) => b.areaPct - a.areaPct)[0]
  console.log(`\n### ${r.name}  (${r.status})  bg ${d.bodyBg}`)

  if (mode === 'scale') {
    console.log(`  distinct sizes on the page: ${d.distinctSizes}`)
    console.log(`  by page area:`)
    for (const s of d.typeScale.slice(0, 8)) {
      console.log(`     ${String(s.px).padStart(5)}px  w${s.weight.padEnd(4)} ${s.face.slice(0, 22).padEnd(24)} x${String(s.count).padStart(4)}  "${(s.sample || '').slice(0, 34)}"`)
    }
    const sizes = [...new Set(heads.map((h) => h.size))].sort((a, b) => b - a)
    console.log(`  headline tiers: ${sizes.slice(0, 6).join(' / ')}`)
    if (body) {
      console.log(`  body-ish: ${body.px}px ${body.face}`)
      console.log(`  LEAD:BODY ratio = ${Math.round((lead.size / body.px) * 100) / 100}x   (lead ${lead.size}px ${lead.face} w${lead.weight})`)
      if (sizes[1]) console.log(`  LEAD:SECOND ratio = ${Math.round((sizes[0] / sizes[1]) * 100) / 100}x`)
    }
    console.log(`  above the fold: ${d.aboveFold.textNodes} text nodes, ${d.aboveFold.links} links`)
    console.log(`  separators: ${d.hrCount} <hr>, ${d.borderedBlocks} bordered blocks >200px`)
  }

  if (mode === 'kickers') {
    if (!d.kickers.length) { console.log('  no kicker candidates detected'); continue }
    for (const k of d.kickers.slice(0, 6)) {
      console.log(`     "${k.text.slice(0, 26).padEnd(28)}" ${String(k.size).padStart(5)}px w${k.weight} ls=${k.ls} ${k.transform.padEnd(9)} ratio ${String(k.ratio).padEnd(6)} gap ${String(k.gapToHeadline).padStart(3)}px  -> ${k.headlineSize}px`)
      console.log(`        ${k.color}  ${k.face}`)
    }
    const rs = d.kickers.map((k) => k.ratio).sort((a, b) => a - b)
    const gs = d.kickers.map((k) => k.gapToHeadline).sort((a, b) => a - b)
    console.log(`  ratio range ${rs[0]}–${rs[rs.length - 1]} (median ${rs[Math.floor(rs.length / 2)]}), gap ${gs[0]}–${gs[gs.length - 1]}px`)
  }
}
