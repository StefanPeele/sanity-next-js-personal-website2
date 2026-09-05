// scripts/seed-content.ts
// Publishes the code defaults for every Site singleton into Sanity so Studio
// opens with real, editable content instead of empty forms.
//
//   npx tsx scripts/seed-content.ts            create missing singletons, patch home/settings
//   npx tsx scripts/seed-content.ts --dry-run  print what would change, write nothing
//   npx tsx scripts/seed-content.ts --force    createOrReplace every singleton (overwrites edits!)
//
// Idempotent: a second run reports "0 created / N skipped". Needs SANITY_API_WRITE_TOKEN
// (Editor) plus NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET in .env.local.
// The site never depends on these documents existing — lib/cms/loaders falls back to
// the same defaults — so seeding is a convenience for editors, not a runtime requirement.

import { loadEnvConfig } from '@next/env'
import { createClient } from '@sanity/client'
import { SINGLETON_DEFAULTS } from '../lib/cms/defaults'
import { withKeys } from '../lib/cms/withDefaults'

loadEnvConfig(process.cwd())

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const force = args.has('--force')

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const writeToken = process.env.SANITY_API_WRITE_TOKEN
// A dry run only reads, so it works with the read token (or anonymously on a public dataset).
const token = dryRun ? process.env.SANITY_API_READ_TOKEN || writeToken : writeToken
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-02-27'

if (!projectId || !dataset) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET.')
  process.exit(1)
}
if (!writeToken && !dryRun) {
  console.error('Missing SANITY_API_WRITE_TOKEN (an Editor token). Use --dry-run to preview without one.')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false })

/** Singletons that already exist on most installs: only fill in missing fields. */
const PATCH_ONLY = new Set(['home', 'settings'])

type Plain = Record<string, unknown>

/** Flatten nested defaults into dotted paths for setIfMissing (arrays are set whole). */
function flatten(value: Plain, prefix = ''): Plain {
  const out: Plain = {}
  for (const [k, v] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v as Plain, path))
    else out[path] = v
  }
  return out
}

async function main() {
  console.log(`Seeding ${projectId}/${dataset}${dryRun ? ' (dry run)' : ''}${force ? ' (FORCE: overwriting edits)' : ''}\n`)
  if (force && !dryRun) console.warn('--force replaces every singleton with the code defaults. Studio edits will be lost.\n')

  let created = 0, patched = 0, skipped = 0, failed = 0

  for (const [name, defaults] of Object.entries(SINGLETON_DEFAULTS)) {
    const doc = { _id: name, _type: name, ...withKeys(defaults, name) } as Plain & { _id: string; _type: string }
    try {
      // Older singletons (home) were created with a random id; find them by type.
      const existing = await client.fetch<Plain | null>('*[_type == $type && !(_id in path("drafts.**"))][0]', { type: name })
      const existingId = typeof existing?._id === 'string' ? existing._id : name

      if (force) {
        console.log(`${existing ? 'replace' : 'create '}  ${name}${existingId !== name ? ` (${existingId})` : ''}`)
        if (!dryRun) await client.createOrReplace({ ...doc, _id: existingId })
        created++
        continue
      }

      if (!existing) {
        console.log(`create   ${name}`)
        if (!dryRun) await client.createIfNotExists(doc)
        created++
        continue
      }

      if (PATCH_ONLY.has(name)) {
        // Fill only fields the document does not have yet; never touch edited values.
        const flat = flatten(withKeys(defaults, name) as Plain)
        const missing = Object.fromEntries(Object.entries(flat).filter(([path]) => getPath(existing as Plain, path) === undefined))
        if (Object.keys(missing).length === 0) {
          console.log(`skip     ${name} (complete)`)
          skipped++
          continue
        }
        console.log(`patch    ${name}${existingId !== name ? ` (${existingId})` : ''}: ${Object.keys(missing).join(', ')}`)
        if (!dryRun) await client.patch(existingId).setIfMissing(missing).commit()
        patched++
        continue
      }

      console.log(`skip     ${name} (exists)`)
      skipped++
    } catch (err) {
      failed++
      console.error(`FAILED   ${name}:`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`\n${created} created, ${patched} patched, ${skipped} skipped, ${failed} failed.`)
  if (failed > 0) process.exit(1)
}

function getPath(obj: Plain, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Plain)[key] : undefined), obj)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
