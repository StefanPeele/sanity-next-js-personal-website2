// lib/github.ts
// Server-side fetch of public repository metadata for project cards and pages.
// Unauthenticated calls get 60 req/hour; set GITHUB_TOKEN to raise the limit.
// Every failure path resolves to null so a GitHub hiccup never breaks a build.

import 'server-only'

export interface RepoMeta {
  fullName: string
  url: string
  description: string | null
  stars: number
  forks: number
  language: string | null
  pushedAt: string | null
  topics: string[]
  license: string | null
}

const GITHUB_HOSTS = new Set(['github.com', 'www.github.com'])

/** Returns { owner, repo } for a github.com URL, otherwise null. */
export function parseGithubUrl(input?: string | null): { owner: string; repo: string } | null {
  if (!input) return null
  try {
    const url = new URL(input)
    if (!GITHUB_HOSTS.has(url.hostname)) return null
    const [owner, repo] = url.pathname.split('/').filter(Boolean)
    if (!owner || !repo) return null
    return { owner, repo: repo.replace(/\.git$/, '') }
  } catch {
    return null
  }
}

interface GithubRepoResponse {
  full_name: string
  html_url: string
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  pushed_at: string | null
  topics?: string[]
  license?: { spdx_id?: string | null; name?: string | null } | null
}

export async function getRepoMeta(githubUrl?: string | null): Promise<RepoMeta | null> {
  const parsed = parseGithubUrl(githubUrl)
  if (!parsed) return null

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'stefanpeele.com',
  }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  try {
    const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
      headers,
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as GithubRepoResponse
    return {
      fullName: data.full_name,
      url: data.html_url,
      description: data.description,
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      language: data.language,
      pushedAt: data.pushed_at,
      topics: data.topics ?? [],
      license: data.license?.spdx_id && data.license.spdx_id !== 'NOASSERTION' ? data.license.spdx_id : null,
    }
  } catch {
    return null
  }
}

/** Fetch metadata for many URLs at once; missing/failed entries are simply absent. */
export async function getRepoMetaMap(urls: Array<string | null | undefined>): Promise<Map<string, RepoMeta>> {
  const unique = Array.from(new Set(urls.filter((u): u is string => !!u)))
  const results = await Promise.all(unique.map(async (u) => [u, await getRepoMeta(u)] as const))
  const map = new Map<string, RepoMeta>()
  for (const [u, meta] of results) if (meta) map.set(u, meta)
  return map
}
