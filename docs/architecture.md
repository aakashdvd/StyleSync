# Architecture notes

## The two-token-namespace rule

The single most important convention in the codebase is that **the dashboard chrome and the live preview consume DIFFERENT CSS variables**.

| Surface | Variables | Defined in |
|---|---|---|
| Dashboard chrome (header, buttons, cards, sidebar) | `--app-bg`, `--app-foreground`, `--app-accent`, `--app-radius`, `--font-app-sans`… | `src/app/globals.css` (`:root`) |
| Live preview (everything inside `.preview-scope`) | `--color-primary`, `--font-heading`, `--spacing-md`, `--radius-md`… | Written imperatively at runtime by `applyTokensToElement` |

This separation means the dashboard never visually flickers when you edit a token — only the preview canvas does. It also makes the code self-documenting: if you're inside `.preview-scope`, you can ONLY read `--color-*` etc., and if you're outside, you can ONLY read `--app-*`. Mixing them would be obviously wrong.

## How an edit propagates

```
ColorPicker drag → ColorTokenCard.onChange
    → useTokenStore.editToken("colors.primary", "#abc")
    → mergeTokens (in-memory) writes new override
    → store.resolved derives new TokenSet
    → PreviewCanvas subscription fires
    → applyTokensToElement(scopeRef.current, resolved)
    → CSS variables on the scope element update
    → browser repaints (no React re-render)
```

The PATCH to the server is fired on a 240ms debounce by `useTokenSync` so a drag emitting 60 events per second still only writes a handful of versions.

## Lock semantics

A locked token is a path string in `record.locked`. The lock acts at three layers:

1. **UI layer** — `LockToggle` and the slider/picker components both check `record.locked.includes(path)` and disable input.
2. **Store layer** — `setTokenValue` is a no-op if the path is locked, so even an out-of-band store mutation can't bypass it.
3. **Server layer** — `updateTokenPath` rebuilds the record through the same `setTokenValue` and short-circuits before writing.

When a re-scrape arrives, `mergeRescrape` walks `previous.locked` and copies the previous value (override → extracted) over the fresh extraction so the user's frozen choice survives.

## Resilience

Scraping the open web is messy. The pipeline degrades gracefully at every step:

- **Page fetch fails** (timeout, CORS, 403) → `extractFromUrl` returns `FALLBACK` with a deterministic curated template hashed off the URL.
- **Page fetched but stylesheets are blocked** → still extract from inline styles + image palette; status `PARTIAL` if signal is low.
- **Image download fails** → CSS-only color extraction; the orchestrator records `accentSource: "css"` in meta.
- **node-vibrant crashes** → caught in `extractPalette`, returns null, pipeline keeps going.

Every fallback path writes a row to the DB so the user can still load a dashboard and edit by hand. The `FallbackBanner` component makes the mode explicit.

## Why no headless browser

Puppeteer/Playwright add ~200MB to the bundle, take 2-5 seconds to cold-start on serverless, and are blocked by anti-bot heuristics on roughly the same set of sites that block plain `fetch`. The cost/benefit is bad. If the user really wants to scrape an SPA-only site, the future plan is a small "captured HTML" upload mode — paste the HTML, get the same extraction.

## File-size hygiene

Per the project's coding standards, no source file should grow much past 200 lines. The pipeline is broken into small modules (`scraper/fetch`, `scraper/html`, `scraper/css`, `extractors/colors`, `extractors/typography`, `extractors/spacing`, `extractors/index`) so each one stays focused on one concern. The dashboard editor is split into `color-editor`, `typography-editor`, `spacing-editor`, `lock-toggle`, `reset-button`, `export-panel`, `version-history` for the same reason.
