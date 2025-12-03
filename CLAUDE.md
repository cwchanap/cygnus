# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cygnus is an Nx monorepo containing a music application with AI drum transcription capabilities. The repository includes:

- `cygnus-web/`: Astro 5 + Svelte 5 frontend with SSR on Cloudflare Workers
- `cygnus-api/`: Python FastAPI service for drum transcription using TensorFlow/Magenta
- `cygnus-web-e2e/`: Playwright e2e tests

## Development Commands

### Frontend (cygnus-web)

- `bun run dev` — Start Astro dev server on port 4330
- `bun run dev:wrangler` — Run dev server proxied through Wrangler Pages
- `bun run build` — Build for production (outputs to `cygnus-web/dist/`)
- `bun run preview` — Preview production build
- `bun run test` — Run all tests (unit + e2e)
- `bun run test:unit` — Run Vitest unit tests only
- `bun run test:e2e` — Run Playwright e2e tests only
- `bun run test:ui` — Open Playwright test UI
- `bun run lint` — Run ESLint
- `bun run lint:fix` — Run ESLint with auto-fix
- `bun run format` — Format code with Prettier
- `bun run format:check` — Check code formatting
- `bun run db:setup` — Initialize D1 database with schema from `cygnus-web/migrations/0001_init.sql`

### API (cygnus-api)

- `bun run api:serve` — Start FastAPI server on port 8000 (uses `uv` package manager)
- `bun run api:worker` — Start Celery worker for background transcription jobs
- `bun run api:lint` — Lint Python code with ruff
- `bun run api:format` — Check Python formatting with black
- `bun run api:test` — Run pytest tests

### Deployment

- `bun run cf:deploy` — Build and deploy to Cloudflare Workers
- `bun run cf:pages:deploy` — Build and deploy to Cloudflare Pages

### Nx Commands

The monorepo uses Nx for task orchestration. You can also run commands directly:

- `bun run nx graph` — View project dependency graph
- `bun run nx run cygnus-web:dev` — Run specific target for a project
- `bun run nx run cygnus-api:serve` — Start API server via Nx

## Architecture

### Tech Stack

**Frontend (cygnus-web)**
- Framework: Astro 5 with SSR (`output: 'server'`)
- UI Components: Svelte 5 with TypeScript
- Styling: Tailwind CSS 4
- Database: Cloudflare D1 (SQLite) with Drizzle ORM
- Storage: Cloudflare R2 for file uploads
- Audio: Tone.js for MIDI playback, @tonejs/midi for parsing
- Music Notation: abcjs for sheet music rendering
- ML: TensorFlow.js for client-side drum transcription
- Testing: Playwright for e2e, Vitest for unit tests

**Backend (cygnus-api)**
- Framework: FastAPI with Python 3.12
- ML: TensorFlow 2.x with Magenta for drum transcription
- Task Queue: Celery with Redis
- Audio Processing: librosa, soundfile
- Package Manager: uv (Universal Python package manager)

### Project Structure

**cygnus-web/**
- `src/pages/` — Astro pages and routing
- `src/components/` — Svelte components (PascalCase naming)
- `src/layouts/` — Astro layout components
- `src/stores/` — Svelte stores for state management (toast.ts, midi.ts, jobs.ts)
- `src/lib/` — Shared utilities and helpers
  - `src/lib/db/` — Database schema and Drizzle ORM setup
  - `src/lib/drum/` — TensorFlow.js transcription logic
- `migrations/` — D1 database migrations
- `public/` — Static assets
- `wrangler.toml` — Cloudflare Workers configuration

**cygnus-api/**
- `src/app/` — FastAPI application
  - `main.py` — API server entry point
  - `transcriber.py` — Drum transcription logic
  - `tf2_magenta_model.py` — TensorFlow model wrapper
  - `storage.py` — Storage adapter abstraction
- `src/worker.py` — Celery worker for background jobs
- `src/cli/` — CLI tools (e.g., model conversion)
- `tests/` — pytest test files
- `pyproject.toml` — Python dependencies and tooling config

**cygnus-web-e2e/**
- `tests/` — Playwright test specs

### Key Features

- **Music Gallery**: Browse and play AI-generated compositions (index.astro)
- **Admin Panel**: Song management with upload/edit capabilities (admin.astro, admin/songs.astro)
- **Drum Transcription**: Upload audio files for AI-powered MIDI transcription
  - Client-side: TensorFlow.js transcription (drum-transcription.astro)
  - Server-side: FastAPI backend with Celery worker (requires cygnus-api server)
- **MIDI Preview**: Visual notation and audio playback (midi-preview.astro)

### Authentication

- Simple passkey-based auth (dev passkey: "devpass" in wrangler.toml)
- Protected admin routes with login page (login.astro)

### External Dependencies

- **cygnus-api**: Python server for drum transcription at `http://localhost:8000`
- Environment variable: `PUBLIC_CRUX_API_URL` (defaults to localhost:8000)
- **Redis**: Required for Celery worker background jobs (cygnus-api)

## Database Schema

Uses Cloudflare D1 (SQLite) with a `songs` table:
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `song_name`, `artist`, `bpm` (TEXT/INTEGER)
- `release_date`, `is_released` (TEXT, INTEGER)
- `created_date`, `origin` (TEXT)
- `r2_key` (TEXT) — R2 storage reference for MIDI files

Schema defined in `cygnus-web/migrations/0001_init.sql` and `cygnus-web/src/lib/db/schema.ts` (Drizzle)

## Code Conventions

- TypeScript everywhere (use `lang="ts"` in Svelte components)
- 2-space indentation for JS/TS, 2-space for Svelte
- PascalCase for components (`AdminUpload.svelte`)
- camelCase for stores and utilities (`jobsStore`, `tfjsTranscriber.ts`)
- Tailwind-first styling approach
- ESLint + Prettier enforcement via Husky pre-commit hooks (lint-staged)
- Python: Black formatting, Ruff linting (max line length 100)

## Testing

**Frontend**
- Playwright e2e specs in `cygnus-web-e2e/tests/*.spec.ts`
- Vitest unit tests for components and utilities
- Run `bunx playwright install` if browsers are missing

**Backend**
- pytest tests in `cygnus-api/tests/`
- Run tests with `bun run api:test`

## Cloudflare Configuration

**wrangler.toml bindings (cygnus-web)**
- D1 database: `DB` binding (database name: "cygnus")
- R2 bucket: `CYGNUS_BUCKET` binding (bucket name: "cygnus")
- Environment variables in `[vars]` section (e.g., `PASSKEY = "devpass"`)

**Local Development**
- Astro uses Cloudflare platform proxy (`platformProxy.enabled: true` in astro.config.mjs)
- Database setup: `bun run db:setup` (runs migrations locally)
- Bindings available via `locals.runtime.env` in Astro pages/API routes
- Local dev server runs on port 4330 (hardcoded in package.json)

**Deployment**
- Authenticate with `wrangler login` before deploying
- `bun run cf:deploy` for Workers deployment
- `bun run cf:pages:deploy` for Pages static hosting
- Adapter configured in `cygnus-web/astro.config.mjs` with `@astrojs/cloudflare`

## Monorepo Structure (Nx)

- Root `package.json` defines workspace-level scripts that delegate to Nx targets
- Each project has a `project.json` defining Nx targets (build, serve, test, etc.)
- `nx.json` configures caching and task dependencies
- Nx caches: `build`, `lint`, `test` operations
- Use `bun run nx graph` to visualize project dependencies
- `cygnus-web-e2e` has implicit dependency on `cygnus-web`

## Common Workflows

### Running the full stack locally

1. Start the API server: `bun run api:serve` (port 8000)
2. Start the Celery worker (optional): `bun run api:worker`
3. Start the frontend: `bun run dev` (port 4330)
4. Initialize database if needed: `bun run db:setup`

### Running a single e2e test

```bash
cd cygnus-web-e2e
bun run test tests/admin-upload.spec.ts
```

### Running a single unit test

```bash
cd cygnus-web
bun run test:unit src/lib/utils.test.ts
```

### Deployment checklist

1. Ensure all tests pass: `bun run test`
2. Lint and format: `bun run lint && bun run format:check`
3. Build locally: `bun run build`
4. Deploy: `bun run cf:deploy` or `bun run cf:pages:deploy`
