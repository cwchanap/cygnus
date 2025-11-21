# Cygnus Monorepo (Nx)

This repository is now managed with Nx. Two projects live in the workspace:

- `cygnus-web/`: the Astro + Svelte frontend (moved from the repository root).
- `cygnus-api/`: the Crux FastAPI service (submodule contents copied locally).

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
- Tests: `bun run test` (UI runner `bun run test:ui`, unit `bun run test:unit`)
- Database init: `bun run db:setup`
- Deploy: `bun run cf:deploy` (Workers) or `bun run cf:pages:deploy` (Pages)

### cygnus-api (Crux)

Use Nx to keep commands rooted in the Python project:

- Serve API: `bun run nx run cygnus-api:serve`
- Worker: `bun run nx run cygnus-api:worker`
- Lint: `bun run nx run cygnus-api:lint`
- Format check: `bun run nx run cygnus-api:format`
- Tests: `bun run nx run cygnus-api:test`

## Cloudflare Notes (cygnus-web)

- `astro.config.mjs` uses the Cloudflare adapter with `output: 'server'`.
- `wrangler.toml` targets `dist/_worker.js` for Workers deploys and can also be used for Pages builds.
- Configure KV/D1 bindings and secrets in `wrangler.toml` or your deployment environment (keep secrets out of source).

Authenticate with `wrangler login` before deploying. Use `bun run cf:deploy` for Workers or `bun run cf:pages:deploy` for Pages static hosting.
