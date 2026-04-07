<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0 (MINOR - repository boundary clarification)
Modified principles:
  - I. Monorepo Coherence
  - II. Type Safety & Strictness
  - III. Test Coverage Requirements
  - IV. Platform-Aware Development
Removed sections: None
Templates checked:
  ✅ .specify/templates/plan-template.md - Compatible (Constitution Check section present)
  ✅ .specify/templates/spec-template.md - Compatible (requirements-driven approach)
  ✅ .specify/templates/tasks-template.md - Compatible (phased approach with testing)
Follow-up TODOs: None
-->

# Cygnus Constitution

## Core Principles

### I. Monorepo Coherence

The Cygnus repository is an Nx-managed monorepo. All in-repo projects (`cygnus-web`, `cygnus-web-e2e`) MUST:

- Respect Nx task orchestration and caching boundaries
- Define targets in their respective `project.json` files
- Use workspace-level scripts for cross-project operations
- Share dependencies through the root `package.json`

**Rationale**: Nx provides build caching, task dependency management, and consistent tooling. Bypassing Nx leads to inconsistent builds and broken CI pipelines.

### II. Type Safety & Strictness

All code MUST be type-safe and pass static analysis:

- **TypeScript**: Use `lang="ts"` in Svelte components; no `any` types without justification
- **Database**: Drizzle ORM schemas MUST match D1 migrations exactly
- **Integration contracts**: Request/response types at external service boundaries MUST be explicitly defined

**Rationale**: Type safety prevents runtime errors and improves maintainability. The cost of upfront typing is lower than debugging production issues.

### III. Test Coverage Requirements

Testing MUST follow this hierarchy:

1. **E2E tests** (Playwright): Critical user journeys and cross-system integration
2. **Unit tests** (Vitest): Business logic and utility functions
3. **Integration/contract tests**: Boundaries with external services and platform APIs

Tests are NOT optional for:

- New user-facing features (requires at least one e2e or unit test, depending on scope)
- Bug fixes (requires regression test)
- External integration changes (requires coverage at the affected boundary)

**Rationale**: Drum transcription and playback flows touch browser APIs, storage, and optional external services. Without tests, regressions go undetected until production.

### IV. Platform-Aware Development

Code MUST account for deployment targets:

- **Frontend**: Cloudflare Workers edge runtime (no Node.js-specific APIs)
- **Storage**: D1 for structured data, R2 for binary assets (MIDI, audio files)
- **External services**: Configure integration endpoints through environment variables

Environment-specific code MUST be isolated:

- Use `locals.runtime.env` for Cloudflare bindings in Astro
- Use environment variables for external service configuration
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
- [ ] Integration changes documented when applicable

### Deployment Readiness

- [ ] D1 migrations applied and tested
- [ ] R2 bucket permissions verified
- [ ] Environment variables configured in Cloudflare dashboard
- [ ] External service endpoints configured when required

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

**Version**: 1.1.0 | **Ratified**: 2025-12-03 | **Last Amended**: 2026-04-05
