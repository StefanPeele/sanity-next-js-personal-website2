# stefanpeele.com

Personal site for Stefan Peele — network engineer associate (intern), NJIT student and photographer in Newark, NJ. Writing, a digital garden, a knowledge graph, project case studies, a photography archive and a booking flow, all driven by Sanity.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, React Compiler), React 19 |
| Content | Sanity v5 (Studio mounted at `/studio`, live preview via `next-sanity`) |
| Styling | Tailwind CSS 3.4 + `@tailwindcss/typography`, Lora / Inter / IBM Plex Mono via `next/font` |
| Motion | framer-motion 13 (`MotionConfig reducedMotion="user"`) + CSS keyframes for route/enter animations |
| Email | Resend (booking inquiries, newsletter double opt-in) |
| Booking CRM | Airtable |
| Hosting | Vercel (Analytics + Speed Insights) |
| Language | TypeScript, strict |

## Routes

| Path | What it is |
| --- | --- |
| `/` | Home |
| `/blog`, `/blog/[slug]` | Writing — four lanes: Perspective, Concept Deep Dive, Field Notes, Transmission |
| `/blog/osi-model` | OSI model reference |
| `/blog/series`, `/blog/series/[slug]` | Article series |
| `/garden`, `/garden/[slug]` | Digital garden notes (seedling → evergreen) |
| `/graph` | Knowledge graph of posts, notes, tags, projects, library |
| `/library` | Reading log |
| `/glossary`, `/paths`, `/review` | Glossary, learning paths, spaced review |
| `/projects`, `/projects/[slug]` | Case studies |
| `/resume` | Experience, skills, certifications, education |
| `/photography`, `/photography/[slug]`, `/photography/albums` | Galleries |
| `/services`, `/contact` | Photography services + booking form |
| `/now`, `/uses` | Now page, tools |
| `/[slug]` | Generic Sanity `page` documents |
| `/blog/feed.xml`, `/blog/feed.json` | RSS 2.0 (full content) and JSON Feed 1.1 |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | Generated from `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts` |
| `/.well-known/security.txt`, `/humans.txt` | RFC 9116 contact, credits |
| `/api/health` | JSON uptime probe (pings Sanity); linked from the footer "Status" |
| `/api/subscribe/confirm`, `/api/subscribe/unsubscribe` | Newsletter double opt-in endpoints |
| `/api/draft-mode/enable` | Sanity Presentation preview entry |
| `/api/draft-mode/enable/revalidate` | Sanity webhook target (on-demand ISR) |
| `/api/airtable/status` | Airtable → site status webhook |
| `/studio` | Sanity Studio |

Route groups: `app/(personal)` (portfolio shell with `<main id="content">`), `app/(archive)` (knowledge shell — pages render their own `<main id="content">`), `app/graph` (standalone).

## Content model (Sanity)

Singletons (all under **Site** in the Studio desk): `settings` (identity, SEO, social links, footer + newsletter copy), `navigation` (primary/secondary nav, search quick links), `home` (copy + `sections[]` toggle/reorder), `blogPage`, `knowledgePages` (garden, library, glossary, paths, review, series, graph), `personalPages` (projects, resume, contact, now, uses, photography), `servicesPage` (services copy, FAQ, booking-form labels), `articleUi` (every article-page label), `taxonomy` (article lanes, note statuses, media types, skill levels — fixed keys, editable labels), `errorPages` (404 / error copy). Every singleton has code defaults in `lib/cms/defaults/*.ts` that double as the schema `initialValue` and the runtime fallback, so an empty or deleted singleton never breaks a page. Documents: `post`, `series`, `category`, `tag`, `note` (garden), `glossaryTerm`, `learningPath`, `mediaItem` (library), `project`, `gallery`, `page`, `experience`, `certification`, `education`, `testimonial`, `subscriber` (newsletter). Objects: interactive article blocks (`knowledgeQuiz`, `layerExplorer`, `packetAnimator`, `wiresharkCallout`), editorial blocks (`sectionBreak`, `failureNote`, `whatIGotWrong`, `whatEngineersUse`, `theProblemSolved`, `conceptStressTest`), `skill`, `timeline`, `milestone`, `duration`.

All GROQ lives in `sanity/lib/queries*.ts` and is wrapped in `defineQuery`; `npm run typegen` regenerates `sanity.types.ts` and `schema.json`. Pages read singletons through the loaders in `lib/cms/loaders.ts` (`getSiteChrome`, `getCopy(query, defaults)`, `getTaxonomy`, `getErrorPages`), which deep-merge the Studio document over the defaults with `withDefaults`.

### Seeding Studio with the defaults

```
npx tsx scripts/seed-content.ts --dry-run   # list what would be created or patched
npx tsx scripts/seed-content.ts             # create missing singletons; fill missing fields on home/settings
npx tsx scripts/seed-content.ts --force     # overwrite every singleton with the code defaults (loses edits)
```

Needs `SANITY_API_WRITE_TOKEN` (an Editor token) in `.env.local`; the dry run works with the read token. The script is idempotent: a second run reports `0 created`. Prices and package names are not seeded — they live in `lib/pricing.ts` because they must match the Airtable option names.

## Environment variables

See `.env.local.example` for comments. Summary:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | public, required | Sanity project |
| `NEXT_PUBLIC_SANITY_DATASET` | public, required | Dataset (`production`) |
| `NEXT_PUBLIC_SANITY_API_VERSION` | public, optional | Defaults to `2025-02-27` |
| `NEXT_PUBLIC_SANITY_PROJECT_TITLE` | public, optional | Studio title |
| `SANITY_API_READ_TOKEN` | server, required | Draft mode + live preview |
| `SANITY_API_WRITE_TOKEN` | server | Newsletter writes `subscriber` documents (missing → form shows a friendly "offline" error). Also used by `scripts/seed-content.ts` |
| `SANITY_REVALIDATE_SECRET` | server | Verifies the Sanity webhook |
| `RESEND_API_KEY` | server | Booking + newsletter emails (`bookings@stefanpeele.com` must be a verified sender) |
| `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_CLIENTS_TABLE_ID`, `AIRTABLE_SHOOTS_TABLE_ID`, `AIRTABLE_WEBHOOK_SECRET` | server | Photography booking CRM |
| `GITHUB_TOKEN` | server, optional | Higher GitHub API rate limit |
| `NEXT_PUBLIC_WEBMENTION_ENABLED` | public, optional | `true` adds the webmention.io `<link>` tags — only after registering at webmention.io |
| `CSP_REPORT_URI` | server, optional | Where CSP violation reports are sent |
| `CSP_REPORT_ONLY` | server, optional | `1` switches the CSP header to report-only while adding a new origin |
| `PLAYWRIGHT_BASE_URL` | test, optional | Run e2e against a deployed URL |

`VERCEL_GIT_COMMIT_SHA` and `VERCEL_DEPLOYMENT_ID` are injected by Vercel and reported by `/api/health`.

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in Sanity + tokens
npm run dev                        # runs typegen first, then next dev --turbopack
```

Studio: <http://localhost:3000/studio>. Presentation/live preview needs `SANITY_API_READ_TOKEN`.

### Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Typegen, then Next dev server |
| `npm run typegen` | `sanity schema extract` + `sanity typegen generate` |
| `npm run check` | typegen → `tsc --noEmit` → `eslint .` |
| `npm run lint` / `lint:fix` | ESLint (next/core-web-vitals + typescript-eslint + react-hooks) |
| `npm run format` | Prettier |
| `npm run build` | `next build --turbopack` + Studio manifest extract |
| `npm run start` | Serve the production build |
| `npm run test:e2e` | Playwright smoke + axe tests against the built app (see Testing) |
| `npm run analyze` | Bundle analyzer |

### Lint

The React Compiler diagnostics from `eslint-plugin-react-hooks` 7 (`set-state-in-effect`, `static-components`, `immutability`, `refs`, `purity`) and `@typescript-eslint/no-explicit-any` are **warnings**, not errors, because roughly 30 pre-existing sites trip them. They are worth fixing; flip them back to `error` in `eslint.config.mjs` once clean.

## Testing

```bash
npx playwright install chromium    # one-time browser download
npm run build
npm run test:e2e                   # starts `npm run start` on 127.0.0.1:3000
```

`tests/smoke.spec.ts` asserts 200 + a visible `h1` + a single `#content` on every primary route, validates the sitemap, robots, RSS and JSON feeds, opens the first blog post found in the sitemap, and runs `@axe-core/playwright` on `/` and `/blog` — critical and serious violations fail the test.

## Deploy

Vercel, production branch `main`. Every push runs `.github/workflows/ci.yml` (typegen → tsc → lint → build, then an optional Playwright job). Required GitHub secrets: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`.

### Sanity webhook (on-demand revalidation)

Sanity → API → Webhooks → Add:

- URL: `https://stefanpeele.com/api/draft-mode/enable/revalidate`
- Dataset: `production`; trigger on create, update, delete; no filter
- Secret: the value of `SANITY_REVALIDATE_SECRET`

The handler is table-driven (`RULES` in `app/api/draft-mode/enable/revalidate/route.ts`): each document type maps to the paths it renders on (post → `/blog`, `/blog/[slug]`, `/graph`, sitemap and feeds; `settings`/`navigation`/`taxonomy`/`articleUi`/`errorPages` → whole layout; `blogPage` → `/blog`; `personalPages` → the six personal routes; and so on). Unknown types revalidate the whole layout.

## Feeds

- `/blog/feed.xml` — RSS 2.0 with `content:encoded` full HTML rendered from Portable Text (`lib/portableTextToHtml.ts`). Interactive blocks are replaced with a "read on the site" note. Lane (Perspective, Deep Dive, …) and categories become `<category>`; the cover image is an `<enclosure>`.
- `/blog/feed.json` — JSON Feed 1.1 with the same items.
- Both are cached `s-maxage=3600, stale-while-revalidate=86400` and advertised in `<head>` via `metadata.alternates.types`.

## Newsletter

Double opt-in, stored in Sanity, delivered by Resend.

1. `components/NewsletterForm.tsx` (`<NewsletterForm />`, optional `variant="inline" | "card"`, `source`) posts to the server action `app/actions/subscribe.ts`.
2. The action validates with zod, checks a honeypot (`website`), rate-limits 5 requests / 10 min per IP (`lib/security.ts`), upserts a `subscriber` document (`status: pending`, random `token`) through `sanity/lib/writeClient.ts` and emails a confirmation link.
3. `/api/subscribe/confirm?token=…` sets `status: confirmed` and redirects to `/blog?subscribed=1`.
4. `/api/subscribe/unsubscribe?token=…` (GET or POST, also in `List-Unsubscribe`) sets `status: unsubscribed`.

**Sending a broadcast:** in Studio → Vision run `*[_type == "subscriber" && status == "confirmed"].email`, paste the list into a Resend Audience, and send from Resend Broadcasts. Include `https://stefanpeele.com/api/subscribe/unsubscribe?token=<token>` per contact if you want per-subscriber unsubscribe links (export `{email, token}` instead).

## Comments

No comment system is wired up yet. The CSP already allows `giscus.app` so a giscus embed on article pages only needs the repo/category IDs.

## Analytics

`@vercel/analytics` (`components/Analytics.tsx`, production only) and `@vercel/speed-insights` render in the root layout. Both are cookieless. Privacy-first alternative if you leave Vercel: [Plausible](https://plausible.io) or self-hosted [Umami](https://umami.is) — a single `<script>` in `app/layout.tsx` plus adding its host to `script-src`/`connect-src` in `next.config.ts`.

## Security headers

`next.config.ts` sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `poweredByHeader: false`, and an **enforced Content-Security-Policy** allowing self, `cdn.sanity.io` / `*.sanity.io`, Vercel analytics and insights, `giscus.app`, Calendly frames, `data:` images and inline styles. When adding a third-party origin, set `CSP_REPORT_ONLY=1` in Vercel to switch the header to report-only, watch the console (or `CSP_REPORT_URI`), then remove the variable. The Playwright suite fails on any CSP violation logged on the main routes.

## SEO / IndieWeb

- JSON-LD `Person` + `WebSite` in the root layout (`components/JsonLd.tsx`); no `SearchAction` because `/blog` does not read a `?q=` parameter.
- Footer carries an `h-card` (`p-name`, `u-url`, `u-email`, `p-note`) and `rel="me"` on social links.
- Webmentions: register at <https://webmention.io> (sign in through the GitHub `rel="me"` link), then set `NEXT_PUBLIC_WEBMENTION_ENABLED=true` to emit `<link rel="webmention">`.

## Accessibility and motion

Skip link → `#content` on every layout. Focus ring: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400` (or the `.focus-ring` utility). Readable text never below `stone-400` on `#0a0a0a`. Motion tokens live in `lib/motion.ts` and mirror Tailwind's `animate-fade-up`, `animate-fade-in`, `animate-draw`, `animate-page-enter`, `ease-out-expo`, `duration-fast|base|slow`; always prefix animations with `motion-safe:`.

## Conventions

See `CLAUDE.md`.
