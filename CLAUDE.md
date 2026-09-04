# CLAUDE.md — working notes for stefanpeele.com

## Architecture map

- `app/layout.tsx` — HTML shell: fonts (`--font-serif` Lora, `--font-sans` Inter, `--font-mono` IBM Plex Mono), metadata, JSON-LD, `MotionProvider`, skip link, Sanity live/visual editing, Analytics + SpeedInsights.
- `app/template.tsx` → `components/PageTransition.tsx` — CSS-only route enter animation (`motion-safe:animate-page-enter`).
- `app/(personal)/` — portfolio shell (`Navbar`, `<main id="content">`, `Footer`): home, projects, resume, photography, services, generic `[slug]` pages.
- `app/(archive)/` — knowledge shell (`BlogBackground`, `Navbar`, `Footer`; pages render their own `<main id="content">`): blog, garden, library, paths, feeds.
- `app/graph/` — knowledge graph (standalone page).
- `app/api/` — health, subscribe (confirm/unsubscribe), draft-mode + revalidate webhook, airtable status.
- `app/actions/` — server actions (`booking.ts`, `subscribe.ts`).
- `sanity/schemas/{documents,objects,singletons}` — schema; register new types in `sanity.config.ts`.
- `sanity/lib/queries.ts` — every GROQ query (`defineQuery`); `sanity/lib/live.ts` — `sanityFetch`; `sanity/lib/client.ts` — read client; `sanity/lib/writeClient.ts` — mutating client (needs `SANITY_API_WRITE_TOKEN`).
- `lib/` — `site.ts` (SITE constants, nav, ARTICLE_TYPES), `dates.ts`, `reading.ts`, `security.ts` (escapeHtml, rateLimit, getClientIp), `motion.ts`, `feed.ts`, `portableTextToHtml.ts`.
- `styles/index.css` — base styles, skip link, `.focus-ring`, print styles. `styles/article.css` belongs to article pages.

## Commands

`npm run dev` · `npm run typegen` (after any query/schema change) · `npm run check` (typegen + tsc + lint) · `npm run build` · `npm run test:e2e` (needs `npm run build` and `npx playwright install chromium` once).

## Conventions

- Data: `sanityFetch({ query, params, stega: false })` from `@/sanity/lib/live` in pages, layouts and `generateMetadata`. Route handlers that must not depend on request context (sitemap, feeds, health) use `client.fetch` from `@/sanity/lib/client`.
- Run `npm run typegen` after adding a query or schema field; import result types from `@/sanity.types`.
- Dates from Sanity are `YYYY-MM-DD` — always format with `lib/dates.ts` (UTC) to avoid off-by-one and hydration mismatches.
- Aesthetic: dark archive — `#0a0a0a` background, stone palette, Lora headings, IBM Plex Mono labels. Readable text never below `stone-400`; decorative only may go darker.
- Focus: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400` (or `.focus-ring`).
- Tailwind opacity modifiers only from the scale (`/5`, `/10`, `/20`) or bracketed (`/[0.08]`); arbitrary decimals like `/8` do not compile.
- Motion: tokens in `lib/motion.ts`; Tailwind classes `motion-safe:animate-fade-up|fade-in|draw|page-enter`, `ease-out-expo`, `duration-fast|base|slow`. Always gate animations with `motion-safe:`. framer-motion is wrapped in `MotionConfig reducedMotion="user"`.
- Exactly one `<h1>` per page. Every page needs an element with `id="content"` for the skip link.
- Never import `CustomPortableText` (or other server-only components) from a client component.
- Real copy only — no lorem ipsum, no fake telemetry or metrics.
- Server actions validate with zod, use a honeypot and `rateLimit` from `lib/security.ts`, and return `{ status, message }` objects instead of throwing.
- Escape anything interpolated into HTML/XML with `escapeHtml`.

## Ownership of shared files

- `sanity.config.ts` — many engineers add types; re-read right before editing and change only your import + list entry.
- `sanity/lib/queries.ts` — add queries at the bottom of the relevant section; never rewrite others' queries.
- `package.json` — add deps with `npm i`; do not remove others' dependencies.
- `app/layout.tsx`, `components/Footer.tsx`, `components/Navbar.tsx`, `styles/index.css`, `tailwind.config.ts`, `next.config.ts` — platform-owned; keep edits small and additive.

## Gotchas

- Windows checkout: files may be CRLF. Do not reformat whole files just to change line endings.
- Turbopack + React Compiler: components created inside render and `setState` inside effects are flagged by `eslint-plugin-react-hooks` (currently warnings).
- `next/font` self-hosts Lora/Inter/Plex; only Lexend (dyslexia mode) is fetched from Google Fonts at runtime — keep `fonts.googleapis.com`/`fonts.gstatic.com` in the CSP.
- The CSP is Report-Only; a violation logs but does not block. Enforce by renaming the header in `next.config.ts` once the console is clean.
- `SANITY_API_READ_TOKEN` is required at build time (`sanity/lib/token.ts` throws without it).
- `app/global-error.tsx` cannot use `next/link` or `next/font` — the root layout is gone when it renders.
- `public/sw.js` caches the last eight `/blog/` articles for offline reading; bump `CACHE_NAME` when article markup changes.
