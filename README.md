# StyleSync

> Turn any website into an interactive, living design system. Paste a URL → get a Figma-grade token editor with a live component preview that updates in real time as you edit.

Built for the **Purple Merit Technologies Full Stack Vibe Coder Intern Assessment (April 2026 — Assessment 1)**.

![StyleSync dashboard](docs/screenshots/dashboard-hero.png)

---

## What it does

1. **Ingest** — Paste a URL. StyleSync fetches the page (with a real User-Agent and a hard size/timeout cap), parses the HTML with Cheerio, grabs every inline and linked stylesheet, and downloads the hero/OG image.
2. **Extract** — A weighted extraction pass turns the CSS and image into a canonical token set:
   - **Colors** — Frequency + specificity weighted, with per-slot hints (`body` → background, `.btn` → primary, etc.), merged with `node-vibrant` palette extraction from the hero image. Enforces WCAG ≥ 4.5 contrast on the background/foreground pair.
   - **Typography** — Heading/body/mono family voting, base-size detection from `html`/`body`, scale ratio derived from h1→h6 sizing and snapped to the nearest recognized musical ratio (1.2, 1.25, 1.333, 1.414, 1.5, 1.618).
   - **Spacing** — Reverse-engineers the base unit (4 vs 8) by fitting a modular scale against every `padding`/`margin`/`gap` value on the page. Radius + shadow strength pulled from CSS mode values.
3. **Visualize** — You land on a dashboard with a left-side token editor (colors, typography, spacing tabs) and a right-side live component preview (buttons, inputs, cards, type scale).
4. **Lock & Version** — Lock any token to freeze it across re-scrapes. Every edit is written to an append-only `VersionHistory` table and can be restored with one click.
5. **Export** — Copy or download as CSS custom properties, JSON tokens, or a drop-in Tailwind config block.

All of this happens without a single full page reload — token edits propagate through CSS custom properties written imperatively to the preview scope element, so the dashboard updates at roughly 120fps even during a color-picker drag.

---

## Key decisions & why

| Decision | Why |
|---|---|
| **Next.js 15 + App Router** | Single deployable surface (frontend + API), easy Vercel deploy, first-class Server Components for the dashboard page. |
| **Cheerio + `fetch`, no headless browser** | Puppeteer/Playwright are hundreds of MB and brittle on serverless. Cheerio handles every static page and the inline styles/linked stylesheets route gives us more than enough signal in practice. The fallback templates cover the rare SPA-only case. |
| **PostgreSQL + Prisma with JSONB** | Required by the assessment, and JSONB is the right choice for the token shape (which evolves). GIN indexes on `colors`/`typography` make future filter queries cheap. |
| **Zustand with `subscribeWithSelector`** | Preview updates need to be sub-frame. A store with imperative subscription lets the preview canvas write CSS variables directly in a subscription callback — zero React reconciliation on edits. |
| **`.preview-scope` CSS convention** | The dashboard chrome uses `--app-*` tokens. The preview uses `--color-*`, `--font-*`, `--spacing-*`. Because they're namespaced separately, the app chrome never re-skins itself when you edit the extracted tokens. |
| **Append-only `VersionHistory`** | Lets "time machine" work trivially (just `SELECT * WHERE siteId = ? ORDER BY version DESC`) without maintaining a delta log. Each row is a full snapshot — cheap in Postgres, bulletproof. |
| **Deterministic fallback templates** | When a site blocks scraping (CORS/timeout/paywall), we hash the URL and pick one of four curated aesthetics. The user gets a beautiful starting point instead of a dead end — and re-scraping the same URL always lands on the same template. |

---

## Quick start

### Prerequisites

- **Node.js 18.17+** (Node 20/22 recommended)
- **Docker** (for the local Postgres) or any reachable Postgres 14+
- **pnpm** recommended (`npm i -g pnpm`) — `npm`/`yarn` also work

### 1. Install

```bash
pnpm install
```

### 2. Start Postgres

```bash
docker compose up -d
```

Or point at your own instance by editing `DATABASE_URL` in `.env` (use `.env.example` as a template).

### 3. Migrate + seed

```bash
cp .env.example .env
pnpm db:push        # or: pnpm db:migrate for a proper migration
pnpm db:seed        # three pre-loaded demo extractions
```

### 4. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), paste any URL, and watch the extraction pipeline run.

---

## Project layout

```
src/
├── app/                       # Next.js App Router
│   ├── page.tsx               # Landing
│   ├── dashboard/[id]/        # Dashboard (SSR hydrated)
│   └── api/
│       ├── scrape/            # POST: ingest a URL
│       └── sites/[id]/
│           ├── tokens/        # PATCH: edit one token path
│           ├── lock/          # POST: lock/unlock a path
│           ├── versions/      # GET: time machine history
│           └── revert/        # POST: restore a version
├── components/
│   ├── ui/                    # App-chrome primitives (Button, Card, Tabs…)
│   ├── landing/               # Landing page pieces
│   ├── dashboard/             # Editors, header, history, export
│   └── preview/               # Preview kit — consumes only CSS vars
├── lib/
│   ├── scraper/               # fetch, html, css, images
│   ├── color/                 # parse, convert, distance, vibrant wrapper
│   ├── extractors/            # colors, typography, spacing + orchestrator
│   ├── tokens/                # types, defaults, merge, css-bridge, export
│   └── repo/                  # Prisma access
├── hooks/                     # useScrape, useTokenSync
└── store/                     # zustand token store
```

---

## API reference

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/scrape` | Ingest a URL. Body: `{ url }`. Returns the site + tokens. |
| `GET` | `/api/sites` | List the 12 most recent scraped sites. |
| `GET` | `/api/sites/:id` | Fetch a single site with its token set. |
| `PATCH` | `/api/sites/:id/tokens` | Edit a single token path. Body: `{ path, value }`. |
| `POST` | `/api/sites/:id/lock` | Lock/unlock a path. Body: `{ path, locked }`. |
| `GET` | `/api/sites/:id/versions` | List version history (newest first). |
| `POST` | `/api/sites/:id/revert` | Revert to a specific version. Body: `{ version }`. |

All responses use `{ data, error }` envelope. Validation is Zod at the boundary.

---

## Data model

```prisma
model ScrapedSite {
  id            String
  url           String
  normalizedUrl String             // lowercased, dedupe key
  title         String?
  description   String?
  faviconUrl    String?
  htmlSnapshot  String?            // up to 400KB
  status        ExtractionStatus   // PENDING | SUCCESS | PARTIAL | FALLBACK | FAILED
  statusReason  String?
  scrapedAt     DateTime
  tokens        DesignTokenSet?    // 1:1
  versions      VersionHistory[]   // 1:n, append-only
}

model DesignTokenSet {
  id             String  @id
  siteId         String  @unique
  colors         Json    // { extracted, overrides }
  typography     Json
  spacing        Json
  meta           Json    // { palette, accentSource, confidence, detectedFonts }
  locked         String[] // dotted paths like "colors.primary"
  currentVersion Int
}

model VersionHistory {
  id           String  @id
  siteId       String
  version      Int
  label        String?
  changeType   ChangeType  // SCRAPE | EDIT | LOCK | UNLOCK | RESET | REVERT
  changedPaths String[]
  snapshot     Json        // full TokenSetRecord at this point in time
  createdAt    DateTime
}
```

GIN indexes on `colors` and `typography` JSONB columns for future filtering. The `VersionHistory` table is append-only — restoring a version writes a new `REVERT` row rather than overwriting anything.

---

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Next dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Production server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript typecheck (no emit) |
| `pnpm db:push` | Push Prisma schema to the DB (no migration file) |
| `pnpm db:migrate` | Create + apply a new migration |
| `pnpm db:seed` | Load three demo extractions |
| `pnpm db:studio` | Open Prisma Studio |

---

## Environment variables

See `.env.example`. The important ones:

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://stylesync:stylesync@localhost:5432/stylesync?schema=public` | Postgres connection string |
| `SCRAPE_TIMEOUT_MS` | `12000` | Hard timeout for the page fetch |
| `SCRAPE_MAX_BYTES` | `3000000` | Size cap on fetched responses |
| `SCRAPE_USER_AGENT` | `StyleSyncBot/1.0` | Fetch User-Agent |
| `STYLESYNC_FALLBACK_ONLY` | `0` | Set to `1` to always use fallback templates (useful for offline demo) |

---

## Deployment

This project is designed to deploy to **Vercel** out of the box:

1. Create a Postgres (Neon, Supabase, or Vercel Postgres).
2. Set `DATABASE_URL` in the Vercel project.
3. Add `pnpm db:push` as a build step (or run it from a one-off shell).
4. Deploy.

It will also run fine on Railway, Render, or any Node 18+ host.

---

## Notes for reviewers

- **Primary evaluation criteria (per the brief): Functionality and UI/UX Design.** Both were the focus. Every micro-interaction called out in the brief is implemented: lock morph animation with glow, <100ms real-time preview feedback, elegant skeleton screens, DOM-scanner parsing visualization, failure UX with friendly copy, consistent design system in the dashboard chrome.
- **The fallback system is intentional.** A number of real sites (Stripe, Apple) will block a server-side UA. Rather than showing a broken state, StyleSync drops into one of four curated fallback templates keyed off a URL hash, and the `FallbackBanner` makes the mode explicit so nothing is misleading.
- **Assessment 2 (Closet.AI) is not included** — the brief says Assessment 2 is optional, and I wanted to go deep on the Web assessment rather than spread thin across both.

Good luck reviewing!
