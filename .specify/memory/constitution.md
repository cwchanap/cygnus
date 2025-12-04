<!--
SYNC IMPACT REPORT
==================
Version change: 0.0.0 → 1.0.0 (MAJOR - initial ratification)
Modified principles: N/A (initial version)
Added sections:
  - Core Principles (5 principles)
  - Development Standards
  - Quality Gates
  - Governance
Removed sections: None (initial version)
Templates checked:
  ✅ .specify/templates/plan-template.md - Compatible (Constitution Check section present)
  ✅ .specify/templates/spec-template.md - Compatible (requirements-driven approach)
  ✅ .specify/templates/tasks-template.md - Compatible (phased approach with testing)
Follow-up TODOs: None
-->

# Cygnus Constitution

## Core Principles

### I. Monorepo Coherence

The Cygnus repository is an Nx-managed monorepo. All projects (`cygnus-web`, `cygnus-api`, `cygnus-web-e2e`) MUST:

- Respect Nx task orchestration and caching boundaries
- Define targets in their respective `project.json` files
- Use workspace-level scripts for cross-project operations
- Share dependencies through the root `package.json` or `pyproject.toml`

**Rationale**: Nx provides build caching, task dependency management, and consistent tooling. Bypassing Nx leads to inconsistent builds and broken CI pipelines.

### II. Type Safety & Strictness

All code MUST be type-safe and pass static analysis:

- **TypeScript**: Use `lang="ts"` in Svelte components; no `any` types without justification
- **Python**: Type hints required for public functions; `ruff` and `black` enforcement
- **Database**: Drizzle ORM schemas MUST match D1 migrations exactly
- **API contracts**: Request/response types MUST be explicitly defined

**Rationale**: Type safety prevents runtime errors and improves maintainability. The cost of upfront typing is lower than debugging production issues.

### III. Test Coverage Requirements

Testing MUST follow this hierarchy:

1. **E2E tests** (Playwright): Critical user journeys and cross-system integration
2. **Unit tests** (Vitest/pytest): Business logic and utility functions
3. **Contract tests**: API boundaries between frontend and backend

Tests are NOT optional for:
- New user-facing features (requires at least one e2e test)
- Bug fixes (requires regression test)
- API endpoint changes (requires contract test)

**Rationale**: The drum transcription feature involves ML models and complex audio processing. Without tests, regressions go undetected until production.

### IV. Platform-Aware Development

Code MUST account for deployment targets:

- **Frontend**: Cloudflare Workers edge runtime (no Node.js-specific APIs)
- **Backend**: Standard Python runtime (TensorFlow/Celery compatible)
- **Storage**: D1 for structured data, R2 for binary assets (MIDI, audio files)

Environment-specific code MUST be isolated:
- Use `locals.runtime.env` for Cloudflare bindings in Astro
- Use environment variables for API configuration
- Never hardcode URLs or credentials

**Rationale**: Cloudflare Workers have runtime restrictions (no filesystem, limited APIs). Code that works locally may fail at the edge.

### V. Simplicity Over Abstraction

Before adding complexity, justify it:

- No new dependencies without documented rationale
- No abstractions for single-use cases
- No premature optimization without measured performance issues
- Prefer standard library solutions over third-party packages

**Rationale**: Cygnus is a focused music application. Over-engineering obscures the core functionality and increases maintenance burden.

## Development Standards

### Code Style Enforcement

**Frontend (cygnus-web)**:
- ESLint + Prettier via Husky pre-commit hooks
- 2-space indentation for JS/TS/Svelte
- PascalCase for components, camelCase for utilities

**Backend (cygnus-api)**:
- Black formatting (max line length 100)
- Ruff linting
- Snake_case for Python modules and functions

### Commit Conventions

- Commits MUST pass all pre-commit hooks (lint-staged)
- Commit messages SHOULD follow conventional commits format
- Breaking changes MUST be documented in commit body

### Branch Strategy

- `main` is the protected default branch
- Feature branches: `feature/short-description`
- Bug fixes: `fix/issue-description`
- All changes require PR review before merging

## Quality Gates

### Pre-Merge Checklist

- [ ] All tests pass (`bun run test`)
- [ ] Linting passes (`bun run lint`)
- [ ] Formatting correct (`bun run format:check`)
- [ ] Build succeeds (`bun run build`)
- [ ] No TypeScript errors
- [ ] API changes documented

### Deployment Readiness

- [ ] D1 migrations applied and tested
- [ ] R2 bucket permissions verified
- [ ] Environment variables configured in Cloudflare dashboard
- [ ] API server accessible at expected URL

## Governance

### Amendment Process

1. Propose changes via PR to `.specify/memory/constitution.md`
2. Document rationale for each principle addition/modification/removal
3. Update dependent templates if principles change
4. Increment version according to semantic versioning:
   - MAJOR: Principle removal or incompatible redefinition
   - MINOR: New principle or expanded guidance
   - PATCH: Clarifications and wording improvements

### Compliance

- Code reviews MUST verify adherence to these principles
- CI pipelines enforce automated quality gates
- Exceptions require documented justification in PR description

### Runtime Guidance

For day-to-day development guidance, refer to:
- `CLAUDE.md` for development commands and architecture details
- `README.md` for quickstart and project overview

**Version**: 1.0.0 | **Ratified**: 2025-12-03 | **Last Amended**: 2025-12-03
