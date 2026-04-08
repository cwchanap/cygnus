# Cygnus Monorepo (Nx)

This repository is managed with Nx and contains the Cygnus web application plus its end-to-end test project:

- `cygnus-web/`: the Astro + Svelte frontend.
- `cygnus-web-e2e/`: the Playwright end-to-end test suite.

Backend drum-transcription service work now lives outside this repository.

## Quickstart

```sh
# install JS dependencies
bun install

# run the frontend locally
bun run dev

# inspect project graph
bun run nx graph
```

## Project Commands

### cygnus-web (Astro)

- Local dev: `bun run dev` (or `bun run dev:wrangler` for the Cloudflare Pages proxy)
- Build: `bun run build`
- Preview: `bun run preview`
- Lint: `bun run lint` (auto-fix with `bun run lint:fix`)
- Format check: `bun run format:check` (write with `bun run format`)
- Tests: `bun run test` (unit + e2e; unit only: `bun run test:unit`; e2e only: `bun run test:e2e`)
- Database init: `bun run db:setup`
- Deploy: `bun run cf:deploy` (Workers) or `bun run cf:pages:deploy` (Pages)

### cygnus-web-e2e (Playwright)

- E2E tests: `bun run test:e2e`
- UI runner: `bun run test:ui`

## Cloudflare Notes (cygnus-web)

- `astro.config.mjs` uses the Cloudflare adapter with `output: 'server'`.
- `wrangler.toml` targets `dist/_worker.js` for Workers deploys and can also be used for Pages builds.
- Configure KV/D1 bindings and secrets in `wrangler.toml` or your deployment environment (keep secrets out of source).

Authenticate with `wrangler login` before deploying. Use `bun run cf:deploy` for Workers or `bun run cf:pages:deploy` for Pages static hosting.
