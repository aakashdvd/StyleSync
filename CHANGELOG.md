# Changelog

All notable changes to this project. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] — 2026-04-10

Initial public release for the Purple Merit Technologies Full Stack Vibe Coder Intern Assessment.

### Added

- **Scraping pipeline**: Cheerio-based HTML parser, postcss-safe-parser CSS parser, server-side fetch with timeout/size caps, hero-image picker (og → logo → above-fold), graceful fallback templates.
- **Extractors**: Weighted color extraction with selector hints + node-vibrant fallback; typography extractor with scale-ratio snap; spacing extractor with 4/8 base-unit fit.
- **Dashboard**: Color/typography/spacing editors, popover color picker, drag-to-adjust spacing visualizer, instant CSS-variable preview canvas.
- **Lock system**: Per-token lock with morph animation and lock glow; locks survive re-scraping.
- **Version history**: Append-only audit log with one-click revert ("time machine").
- **Export**: CSS variables, JSON tokens (Style-Dictionary compatible), Tailwind config block.
- **Resilience**: Four curated fallback templates picked deterministically by URL hash.
- **Polish**: Skeleton loading screens, DOM-scanner parsing visualization, inline error states, sonner toasts, dark-mode CSS variables, dynamic OpenGraph image.

### Stack

- Next.js 15 (App Router) · TypeScript · Tailwind CSS
- Postgres 16 · Prisma 5
- Zustand · Radix UI · Framer Motion · Cheerio · postcss · node-vibrant · sonner
