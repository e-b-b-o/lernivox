# Lernivox — Monorepo Folder Structure

```
lernivox/
├── apps/
│   ├── web/                    # Next.js App Router frontend application
│   │   ├── app/                # App Router routes ((marketing), (auth), (workspace))
│   │   ├── components/         # Reusable UI & feature components
│   │   ├── styles/             # Global CSS and Tailwind definitions
│   │   └── tailwind.config.ts  # Tailwind theme with BrightPath color tokens
│   ├── api/                    # NestJS REST API application
│   │   ├── src/common/         # Exception filters, validation pipes, logging
│   │   ├── src/config/         # Validated environment configuration
│   │   ├── src/health/         # Readiness & health check endpoints
│   │   └── src/main.ts         # Bootstrap with Swagger & versioned prefix (/api/v1)
│   └── worker/                 # NestJS background worker application
│       ├── src/health/         # Worker startup/readiness checks
│       ├── src/processors/     # BullMQ job processors (document ingestion)
│       └── src/main.ts         # Standalone worker application context
├── packages/
│   ├── database/               # PostgreSQL & Prisma ORM integration
│   │   ├── prisma/             # Prisma schema & SQL migrations (with pgvector)
│   │   └── src/                # Singleton PrismaClient factory and exports
│   ├── storage/                # Provider-agnostic storage abstraction
│   │   ├── src/adapters/       # Local filesystem & provisional Cloudinary adapters
│   │   └── src/storage.interface.ts # Universal StorageService contract
│   ├── ai-core/                # AI orchestration, chunking & LLM abstractions
│   │   ├── src/interfaces/     # AiProvider interface
│   │   ├── src/primitives/     # Text chunking with semantic overlap
│   │   └── src/providers/      # Provisional Gemini provider adapter
│   ├── contracts/              # Shared DTOs, job payloads, and queue names
│   ├── eslint-config/          # Shared ESLint configuration rules
│   └── typescript-config/      # Shared TypeScript base, Next.js, and NestJS tsconfigs
├── infra/
│   └── docker/                 # Local development infrastructure (Postgres + Redis)
│       ├── docker-compose.yml  # Docker Compose definition with persistent volumes
│       └── README.md           # Instructions for local container management
├── docs/
│   ├── product/                # Requirements, workflows, and user personas
│   ├── architecture/           # Topology, folder structure, and pipeline flows
│   ├── decisions/              # Architectural Decision Records (ADRs)
│   └── design/                 # Visual design references (BrightPath) & tokens
├── frontend/                   # Legacy prototype reference (preserved undisturbed)
├── backend/                    # Legacy prototype reference (preserved undisturbed)
├── pnpm-workspace.yaml         # Workspace configuration (apps/*, packages/*)
├── turbo.json                  # Turborepo task pipeline and caching rules
├── package.json                # Monorepo root scripts & dev dependencies
├── .env.example                # Documented configuration template
└── README.md                   # Development guide and quick start
```

---

## Workspace Package Boundaries

1. **Applications (`apps/`)**:
   - `apps/web` consumes `@lernivox/contracts`.
   - `apps/api` consumes `@lernivox/database`, `@lernivox/contracts`, `@lernivox/storage`, and `@lernivox/ai-core`.
   - `apps/worker` consumes `@lernivox/database`, `@lernivox/contracts`, `@lernivox/storage`, and `@lernivox/ai-core`.
   - Applications must never depend on each other directly.

2. **Packages (`packages/`)**:
   - Shared packages must be high-cohesion and single-responsibility.
   - Circular dependencies between packages are strictly forbidden.
   - Internal package namespace: `@lernivox/*`.
