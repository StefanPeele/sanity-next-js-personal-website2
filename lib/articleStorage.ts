// lib/articleStorage.ts — localStorage helpers shared by article components. All guarded.

export const READ_POSTS_KEY = 'sp_read_posts'
export const bookmarkKey = (slug: string) => `sp_bookmark_${slug}`

export type Bookmark = { pct: number; at: number }

export function readBookmark(slug: string): Bookmark | null {
  try {
    const raw = localStorage.getItem(bookmarkKey(slug))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Bookmark>
    if (typeof parsed.pct !== 'number' || !Number.isFinite(parsed.pct)) return null
    return { pct: Math.min(1, Math.max(0, parsed.pct)), at: typeof parsed.at === 'number' ? parsed.at : Date.now() }
  } catch {
    return null
  }
}

export function writeBookmark(slug: string, pct: number): void {
  try { localStorage.setItem(bookmarkKey(slug), JSON.stringify({ pct, at: Date.now() })) } catch { /* private mode */ }
}

export function clearBookmark(slug: string): void {
  try { localStorage.removeItem(bookmarkKey(slug)) } catch { /* ignore */ }
}

/* ── 7.6: where the reader actually stopped ────────────────────────────────────
   Distinct from the bookmark above, and deliberately so. A bookmark is a DECISION --
   the reader pressed "Save my place" and expects to find exactly that spot. This is an
   OBSERVATION, written continuously as they scroll, and it is only ever acted on when
   the reader has turned the resume setting on. Two different promises, so two keys;
   merging them would mean an automatic write silently moving someone's saved place.

   Stored as a FRACTION, like the bookmark, because a pixel offset means nothing across
   the seven text sizes, three column widths and two orientations the reader controls --
   the same article is a different height in each, so restoring 4820px lands somewhere
   else every time. */
export const positionKey = (slug: string) => `sp_position_${slug}`

/** Null unless there is a position worth returning to. */
export function readPosition(slug: string): number | null {
  try {
    const raw = localStorage.getItem(positionKey(slug))
    if (!raw) return null
    const pct = Number(raw)
    // Near the top there is nothing to resume; near the end the reader finished, and
    // returning them to 97% of a piece they completed is worse than returning them nowhere.
    return Number.isFinite(pct) && pct >= 0.05 && pct <= 0.95 ? pct : null
  } catch {
    return null
  }
}

export function writePosition(slug: string, pct: number): void {
  try {
    if (!Number.isFinite(pct) || pct < 0.05 || pct > 0.95) localStorage.removeItem(positionKey(slug))
    else localStorage.setItem(positionKey(slug), String(Math.round(pct * 1000) / 1000))
  } catch { /* private mode */ }
}
