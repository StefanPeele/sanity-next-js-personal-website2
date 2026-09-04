// lib/dates.ts
// Timezone-safe formatting. Sanity `date` fields are YYYY-MM-DD; parsing them with
// `new Date()` yields UTC midnight, which shows the previous day in US timezones and
// causes hydration mismatches. Always format with these helpers.

type Style = 'long' | 'short' | 'month' | 'iso' | 'relative'

const LONG: Intl.DateTimeFormatOptions  = { month: 'long',  day: 'numeric', year: 'numeric', timeZone: 'UTC' }
const SHORT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }
const MONTH: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric', timeZone: 'UTC' }

export function parseDate(input?: string | Date | null): Date | null {
  if (!input) return null
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input
  // Date-only strings are treated as UTC midnight deliberately; we format in UTC too.
  const d = new Date(input.length === 10 ? `${input}T00:00:00Z` : input)
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(input?: string | Date | null, style: Style = 'long', fallback = ''): string {
  const d = parseDate(input)
  if (!d) return fallback
  switch (style) {
    case 'iso':      return d.toISOString().slice(0, 10)
    case 'short':    return d.toLocaleDateString('en-US', SHORT)
    case 'month':    return d.toLocaleDateString('en-US', MONTH)
    case 'relative': return relativeTime(d)
    default:         return d.toLocaleDateString('en-US', LONG)
  }
}

export function relativeTime(d: Date, now = new Date()): string {
  const diff = (now.getTime() - d.getTime()) / 1000
  const abs = Math.abs(diff)
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (abs < 60) return rtf.format(-Math.round(diff), 'second')
  if (abs < 3600) return rtf.format(-Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(-Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(-Math.round(diff / 86400), 'day')
  if (abs < 86400 * 365) return rtf.format(-Math.round(diff / (86400 * 30)), 'month')
  return rtf.format(-Math.round(diff / (86400 * 365)), 'year')
}

export function yearOf(input?: string | Date | null): number | null {
  const d = parseDate(input)
  return d ? d.getUTCFullYear() : null
}

export function daysSince(input?: string | Date | null, now = new Date()): number | null {
  const d = parseDate(input)
  return d ? Math.floor((now.getTime() - d.getTime()) / 86400000) : null
}
