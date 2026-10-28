# ADR-001: Monorepo Tooling: pnpm Workspaces & Turborepo

## Status
**Confirmed**

## Context
The previous prototype existed as disjointed root folders (`frontend/`, `backend/`, `backend/rag/`) without shared types, cross-package dependency resolution, or unified build orchestration.

## Decision
Adopt **pnpm workspaces** (`pnpm-workspace.yaml`) and **Turborepo** (`turbo.json`) for monorepo package orchestration:
- Shared internal packages under `@lernivox/*`.
- Declarative task pipelines for `build`, `lint`, `type-check`, `test`, and `dev`.
- Fast, symlinked workspace dependency resolution and build caching.

## Consequences
- Single lockfile (`pnpm-lock.yaml`) managed via pnpm.
- Independent deployment capability for `apps/web`, `apps/api`, and `apps/worker`.
