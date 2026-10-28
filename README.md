# Lernivox — AI-Powered Academic Study Platform

Lernivox transforms textbooks, lecture slides, and academic PDFs into an interactive, high-retention study companion. Powered by source-grounded AI, Lernivox generates verifiable citations, quizzes, interactive challenges, and personalized study schedules.

---

## Architecture & Monorepo Structure

```
lernivox/
├── apps/
│   ├── web/                     # Next.js App Router (React, Tailwind CSS, TypeScript)
│   ├── api/                     # NestJS REST API (OpenAPI, Validation, Health checks)
│   └── worker/                  # NestJS BullMQ Worker (Redis background processing)
├── packages/
│   ├── database/                # PostgreSQL with Prisma ORM 7.x & pgvector
│   ├── storage/                 # Provider-agnostic storage abstraction (Local/Cloudinary)
│   ├── ai-core/                 # AI orchestration primitives, chunking & LLM contracts
│   ├── contracts/               # Shared job payloads, queue definitions, DTOs
│   ├── eslint-config/           # Monorepo ESLint configuration
│   └── typescript-config/       # Base, Next.js, and NestJS tsconfig presets
├── infra/
│   └── docker/                  # Local PostgreSQL (pgvector) and Redis Compose setup
├── docs/                        # Architecture, product, design, and decision records
├── frontend/                    # Legacy prototype reference (preserved undisturbed)
└── backend/                     # Legacy prototype reference (preserved undisturbed)
```

---

## Quick Start & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) `>= 22` (Active environment: Node.js 24)
- [pnpm](https://pnpm.io/) `>= 9` (Active environment: pnpm 12.5)
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose

### 1. Environment Setup
```bash
cp .env.example .env
```
Inspect `.env` to customize local ports if needed. Safe default values are pre-configured for local development.

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Start Local Infrastructure (PostgreSQL with pgvector & Redis)
```bash
# Starts PostgreSQL (port 5433) and Redis (port 6379)
pnpm infra:up

# Check container health status
docker compose -f infra/docker/docker-compose.yml ps
```

### 4. Generate Prisma Database Client
```bash
pnpm db:generate
```

### 5. Run Applications in Development Mode
```bash
# Starts web, api, and worker concurrently via Turborepo
pnpm dev

# Or start specific applications individually:
pnpm --filter @lernivox/web dev       # Next.js frontend on http://localhost:3000
pnpm --filter @lernivox/api dev       # NestJS API on http://localhost:4000/api/v1
pnpm --filter @lernivox/worker dev    # Background worker daemon
```

---

## Verification & Quality Commands

```bash
# Run type-checking across all apps and packages
pnpm type-check

# Run linter across all workspaces
pnpm lint

# Run automated tests
pnpm test

# Build production bundles for all applications and packages
pnpm build
```

---

## API & Health Check Endpoints

- **REST API Prefix**: `http://localhost:4000/api/v1`
- **Health Check Endpoint**: `http://localhost:4000/api/v1/health`
- **Interactive Swagger Docs**: `http://localhost:4000/api/docs`

---

## Legacy Prototype Reference

The original proof-of-concept remains preserved for implementation reference:
- Legacy Frontend: `frontend/` (React + Vite)
- Legacy Backend: `backend/` (Express + Mongoose + MongoDB)
- Legacy RAG Service: `backend/rag/` (Python Flask + ChromaDB)
