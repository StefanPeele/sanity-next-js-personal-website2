// lib/cms/withDefaults.ts
// Deep-merge a (possibly null/partial) Sanity document over its code defaults.
// Rules: primitives fall back when null/undefined/''; non-empty arrays win wholesale;
// objects recurse. Sanity bookkeeping keys (_id, _type, _key, _createdAt…) pass through.

type Primitive = string | number | boolean
type Plain = { [key: string]: unknown }

const isPlain = (v: unknown): v is Plain =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export function withDefaults<D>(doc: unknown, defaults: D): D {
  if (!isPlain(doc)) return defaults
  if (!isPlain(defaults)) return (doc as D) ?? defaults

  const out: Plain = { ...(defaults as Plain) }
  for (const [key, value] of Object.entries(doc)) {
    const def = (defaults as Plain)[key]
    if (value === null || value === undefined) continue
    if (typeof value === 'string' && value === '') continue
    if (Array.isArray(value)) {
      out[key] = value.length > 0 ? value : def
      continue
    }
    if (isPlain(value)) {
      out[key] = isPlain(def) ? withDefaults(value, def) : value
      continue
    }
    out[key] = value as Primitive
  }
  return out as D
}

/** Add deterministic `_key`s to every array item so Studio accepts seeded arrays. */
export function withKeys<T>(value: T, path = 'k'): T {
  if (Array.isArray(value)) {
    return value.map((item, i) => {
      const keyed = withKeys(item, `${path}-${i}`)
      return isPlain(keyed) && !('_key' in keyed) ? { _key: `${path}-${i}`, ...keyed } : keyed
    }) as T
  }
  if (isPlain(value)) {
    const out: Plain = {}
    for (const [k, v] of Object.entries(value)) out[k] = withKeys(v, `${path}-${k}`)
    return out as T
  }
  return value
}
