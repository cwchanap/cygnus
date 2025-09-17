# Repository Guidelines

## Project Structure & Module Organization

Source lives in `src/`, with Astro pages under `src/pages`, reusable Svelte components in `src/components`, and shared stores/lib code in `src/stores` and `src/lib`. Tailwind-first styling resides in `src/styles`, while static assets ship from `public/`. Playwright specs live in `tests/` (fixtures and global setup included), and database migrations are tracked in `migrations/` for the Cloudflare D1 instance configured via `wrangler.toml`.

## Build, Test, and Development Commands

- `npm run dev` — Start Astro locally on port 4330.
- `npm run dev:wrangler` — Proxy the Astro dev server through Wrangler Pages for end-to-end testing.
- `npm run build` / `npm run preview` — Produce the optimized build in `dist/` and preview it.
- `npm run lint` / `npm run lint:fix` — Run ESLint across TS, Astro, and Svelte files (auto-fix where possible).
- `npm run test` — Execute the Playwright regression suite; `npm run test:ui` opens the runner for focused debugging.
- `npm run db:setup` — Apply the initial D1 schema using `migrations/0001_init.sql`.

## Coding Style & Naming Conventions

Use TypeScript everywhere (`lang="ts"` in Svelte) with 2-space indentation. Components stay in PascalCase (`AdminUpload.svelte`), stores and helpers in camelCase (`jobsStore`). Favor Tailwind utility classes for layout and effects, and colocate related assets with their features. ESLint’s flat config (Astro, Svelte, TS, a11y) must pass before you push; Husky + lint-staged will run on commit.

## Testing Guidelines

Playwright handles UI and routing checks; add new specs in `tests/*.spec.ts` and share setup logic through `tests/fixtures`. Keep selectors resilient and include assertions for page copy or network state. Run `npx playwright install` once per machine if browsers are missing. Aim to cover new flows before opening a PR.

## Commit & Pull Request Guidelines

Follow the conventional commit prefix seen in history (`feat:`, `fix:`, `refactor:`, `style:`). Keep subjects imperative and scoped to one change. For PRs, provide a concise summary, note any database or config updates, attach screenshots for UI tweaks, and list manual or automated test results. Link the relevant issue or task ID when available.
