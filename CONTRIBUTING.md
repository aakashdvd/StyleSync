# Contributing to StyleSync

Thanks for wanting to improve StyleSync. This guide covers the basics to get you from zero to a merged PR.

## Development setup

Prerequisites:
- Node.js (version pinned in `.nvmrc` — use `nvm use` if you have nvm)
- npm 10+
- SQLite (bundled via Prisma — no separate install needed for local dev)

```bash
git clone https://github.com/aakashdvd/StyleSync.git
cd StyleSync
npm install
npx prisma generate
npx prisma db push
npm run db:seed      # optional, seeds three sample sites
npm run dev
```

The app runs at `http://localhost:3000`.

## Project layout

- `src/app` — Next.js App Router pages and API routes
- `src/components` — React components (shadcn-style primitives in `src/components/ui`)
- `src/lib/scraper` — URL fetch + HTML extraction pipeline
- `src/lib/extractors` — per-token-category extractors (colors, typography, spacing, ...)
- `src/lib/tokens` — token normalization, merging, lock semantics
- `src/store` — Zustand stores for editor state
- `prisma` — schema and seed script

## Making changes

1. Branch off `main`: `git checkout -b feat/short-description`
2. Keep commits focused. One concern per commit.
3. Follow the existing conventional-commit style:
   - `feat(scope): ...` — new user-facing behavior
   - `fix(scope): ...` — bug fix
   - `chore(scope): ...` — tooling, deps, config
   - `docs(scope): ...` — documentation only
   - `refactor(scope): ...` — no behavior change
4. Before opening a PR:
   ```bash
   npm run lint
   npm run typecheck
   ```
5. Open a PR against `main`. The PR template will prompt you for a summary, screenshots, and a testing checklist.

## What makes a good PR

- Small and reviewable. If it's big, split it.
- Describes the *why*, not just the *what*.
- Includes screenshots or a clip for UI changes.
- Doesn't bundle unrelated refactors with feature work.

## Reporting bugs or proposing features

Use the issue forms from the "New issue" button — they ask for the information reviewers need upfront.
