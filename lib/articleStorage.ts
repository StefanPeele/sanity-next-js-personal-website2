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
