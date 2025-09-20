# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cygnus is an Astro-based music application with AI composition features and drum transcription capabilities. It runs on Cloudflare Workers with D1 database and R2 storage, using Svelte components for interactive UI elements.

## Development Commands

- `npm run dev` — Start Astro dev server on port 4330
- `npm run dev:wrangler` — Run Astro dev server proxied through Wrangler Pages
- `npm run build` — Build for production (outputs to `dist/`)
- `npm run preview` — Preview production build
- `npm run test` — Run Playwright e2e tests
- `npm run test:ui` — Open Playwright test UI
- `npm run test:unit` — Run Vitest unit tests
- `npm run lint` — Run ESLint
- `npm run lint:fix` — Run ESLint with auto-fix
- `npm run format` — Format code with Prettier
- `npm run format:check` — Check code formatting
- `npm run db:setup` — Initialize D1 database with schema from `migrations/0001_init.sql`

## Deployment Commands

- `npm run cf:deploy` — Build and deploy to Cloudflare Workers
- `npm run cf:pages:deploy` — Build and deploy to Cloudflare Pages

## Architecture

### Tech Stack
- **Framework**: Astro 5 with SSR (`output: 'server'`)
- **UI Components**: Svelte 5 with TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Storage**: Cloudflare R2 for file uploads
- **Audio**: Tone.js for MIDI playback, @tonejs/midi for parsing
- **Music Notation**: abcjs for sheet music rendering
- **Testing**: Playwright for e2e, Vitest for unit tests

### Project Structure
- `src/pages/` — Astro pages and routing
- `src/components/` — Svelte components (PascalCase naming)
- `src/layouts/` — Astro layout components
- `src/stores/` — Svelte stores for state management
- `src/lib/` — Shared utilities and helpers
- `src/styles/` — Global styles and Tailwind config
- `tests/` — Playwright test specs
- `migrations/` — D1 database migrations
- `public/` — Static assets

### Key Features
- **Music Gallery**: Browse and play AI-generated compositions
- **Admin Panel**: Song management with upload/edit capabilities
- **Drum Transcription**: Upload audio files for AI-powered MIDI transcription (requires Crux API server)
- **MIDI Preview**: Visual notation and audio playback

### Authentication
- Simple passkey-based auth (dev passkey: "devpass")
- Protected admin routes

### External Dependencies
- **Crux API**: Python server for drum transcription at `http://localhost:8000`
- Environment variable: `PUBLIC_CRUX_API_URL` (defaults to localhost:8000)

## Database Schema

Uses Cloudflare D1 with a `songs` table:
- `id` (PRIMARY KEY)
- `song_name`, `artist`, `bpm`
- `release_date`, `is_released`
- `created_date`, `origin`
- `r2_key` (R2 storage reference)

## Code Conventions

- TypeScript everywhere (use `lang="ts"` in Svelte)
- 2-space indentation
- PascalCase for components (`AdminUpload.svelte`)
- camelCase for stores and utilities (`jobsStore`)
- Tailwind-first styling
- ESLint + Prettier enforcement via Husky pre-commit hooks

## Testing

- Playwright specs in `tests/*.spec.ts`
- Shared test utilities in `tests/fixtures`
- Run `npx playwright install` if browsers missing
- Unit tests with Vitest for components and utilities

## Cloudflare Configuration

### wrangler.toml bindings:
- D1 database: `DB` (binding name)
- R2 bucket: `CYGNUS_BUCKET`
- Environment variables in `[vars]` section

### Local Development
- Uses Astro's Cloudflare platform proxy
- Database setup: `npm run db:setup`
- Bindings available via `locals.runtime.env` in Astro

## Common Issues

- Ensure Crux API server is running for drum transcription features
- Check CORS configuration if API calls fail
- Verify D1 database is initialized before first run
- Port 4330 is hardcoded for dev server