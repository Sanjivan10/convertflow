# ConvertFlow

A full-stack, SEO-first file-conversion platform: a public converter portal plus an
authenticated admin panel with a dynamic Tool Generator and a blog CMS.

Built with **Next.js 16** (App Router, Turbopack), TypeScript, Tailwind CSS v4,
Prisma + PostgreSQL, NextAuth v5, Tiptap, Recharts, and `pdf-lib`.

## What's inside

### Public portal (`/`)
- **Homepage** — hero, live search over every tool, feature strip.
- **`/convert/[slug]`** — programmatic converter pages. Per-route metadata
  (title, description, canonical, OpenGraph), plus `SoftwareApplication`,
  `FAQPage`, and `BreadcrumbList` JSON-LD. Structured H1/H2/H3 and visible
  breadcrumbs.
- **Conversion engines** — all client-side, nothing is uploaded:
  - `IMAGE` — Canvas API (PNG/JPG/WEBP/GIF/BMP, batch, quality control)
  - `PDF` — `pdf-lib` (images→PDF, merge, structural compress)
  - `CUSTOM` — admin-authored script run in the browser
- **`/tools`** — filterable catalog. **`/blog`** + **`/blog/[slug]`** — SSR articles
  with `Article` + `FAQPage` schema.
- **`/sitemap.xml`** — regenerated every 5 min from published tools + posts.
  **`/robots.txt`** — blocks `/admin` and `/api`.
- **`<AdSlot />`** — fixed-aspect-ratio reservations (`min-h-[250px]` /
  `min-h-[600px]`) for zero CLS; renders a placeholder until
  `NEXT_PUBLIC_ADSENSE_CLIENT` is set.

### Admin panel (`/admin`)
- NextAuth v5 credentials auth. `src/proxy.ts` gates `/admin` + `/api/admin`;
  every server action re-checks the session.
- **Dashboard** — pageviews, conversions, published counts, a 14-day Recharts
  traffic area chart, top-tools bar chart, recent file-processing log.
- **Blog CMS** — Tiptap rich-text editor, auto slug, featured image, tags,
  meta title/description, FAQ builder, draft/published toggle.
- **Tool Builder** (`/admin/tool-builder`) — create converter routes, pick an
  engine or paste custom JS, set description / FAQ / SEO fields, publish. Saving
  revalidates the affected public pages and the sitemap.

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in:

```bash
DATABASE_URL="postgresql://…"          # hosted Postgres (Neon / Supabase / Railway / local)
AUTH_SECRET="…"                        # npx auth secret
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_ADSENSE_CLIENT=""          # ca-pub-… (optional)
SEED_ADMIN_EMAIL="admin@convertflow.local"
SEED_ADMIN_PASSWORD="admin12345"
```

### 3. Create the schema + seed data

```bash
npm run db:push      # push schema to the database (or: npm run db:migrate)
npm run db:seed      # admin user + 17 converters + 2 posts + sample analytics
```

### 4. Run

```bash
npm run dev          # http://localhost:3000
```

Sign in at `/admin/login` with the seed credentials above.

## Data model

`User`, `Post`, `Tool`, `AnalyticsEvent`, `ConversionLog` — see
[`prisma/schema.prisma`](prisma/schema.prisma).

Public data-access helpers in `src/lib/{tools,blog,analytics}.ts` fall back to the
static catalog in `src/lib/tool-catalog.ts` when the database is unreachable, so
`next build` and the public site keep working before the DB is wired up.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js (Turbopack) |
| `npm run lint` | ESLint (flat config) |
| `npm run db:push` | Sync schema without migrations |
| `npm run db:migrate` | Create + apply a dev migration |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Prisma Studio |

## Notes on Next.js 16

- `params` / `searchParams` are awaited everywhere.
- Route protection lives in `src/proxy.ts` (the renamed `middleware`, Node runtime).
- Turbopack is the default builder; `turbopack.root` is pinned in `next.config.ts`
  because a sibling project has its own lockfile.
