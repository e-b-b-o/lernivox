# Lernivox Implementation Progress Tracking

> **Single Source of Truth**: This document tracks the implementation progress, architectural decisions, verified repository state, and next steps for **Lernivox**. Every agent must read and update this document in accordance with the guidelines in [`AGENTS.md`](./AGENTS.md).

---

## 1. Project Overview

**Lernivox** is an AI-powered study platform designed to transform textbooks, lecture materials, and academic documents into interactive, source-grounded learning environments. It provides verified citations, quizzes, interactive challenges, personalized study plans, and collaborative study groups.

### Current Architectural Direction
- **Repository Architecture**: Monorepo managed with **pnpm workspaces** and **Turborepo**.
- **Frontend**: **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind CSS**, guided by the [BrightPath](https://brightpath-wbs.framer.website/) visual design system.
- **Backend Core**: **NestJS** and **TypeScript** utilizing modular architecture and REST/WebSocket APIs.
- **Primary Data Store**: **PostgreSQL** with **Prisma ORM** and the **pgvector** extension for vector similarity search.
- **Asynchronous Task Processing**: Dedicated TypeScript background worker using **NestJS**, **Redis**, and **BullMQ** for document ingestion and AI generation jobs.
- **AI Orchestration**: Native TypeScript RAG pipeline for parsing, chunking, embedding, source citation, and LLM orchestration.
- **File Storage**: Provider-agnostic storage abstraction (with **Cloudinary** as a provisional candidate).

---

## 2. Current Repository State (Verified Audit)

The repository currently contains an early proof-of-concept (prototype) codebase titled "AI Study Kit". It has not yet been transitioned into the target monorepo architecture.

| Area | Current Implementation State | Files / References | Notes & Gaps |
|---|---|---|---|
| **Repository Structure** | Independent root subdirectories (`frontend/`, `backend/`). No root package manager or workspace configuration. | [`.`](./) | Needs transition to `pnpm-workspace.yaml` and Turborepo. |
| **Frontend** | React 18.2.0 + Vite 5.1.0 written in plain JavaScript/JSX with React Router DOM 7.13.0 and Lucide React. | [`frontend/package.json`](./frontend/package.json), [`frontend/src/`](./frontend/src/) | Target is Next.js App Router, TypeScript, and Tailwind CSS. |
| **Backend** | Node.js Express 5.2.1 written in plain JavaScript (CommonJS). REST endpoints for auth, document upload, and generation. | [`backend/package.json`](./backend/package.json), [`backend/src/server.js`](./backend/src/server.js) | Target is NestJS + TypeScript modular architecture. |
| **RAG / AI Service** | Separate Python 3.11 Flask service calling Google Gemini via `google-genai` and `chromadb`. | [`backend/rag/app.py`](./backend/rag/app.py), [`backend/rag/rag.py`](./backend/rag/rag.py) | Target is native TypeScript orchestration with pgvector; Python Chroma service is legacy prototype. |
| **Database** | MongoDB Atlas via Mongoose 9.2.0 (`User`, `Document` schemas). ChromaDB vector storage on local disk/volume. | [`backend/src/models/`](./backend/src/models/), [`docker-compose.yml`](./docker-compose.yml) | Target is PostgreSQL + Prisma ORM + pgvector. |
| **File Storage** | Local filesystem storage handled via Multer middleware, mounted to Docker volume `aistudykit_uploads`. | [`backend/src/middlewares/upload.middleware.js`](./backend/src/middlewares/upload.middleware.js) | Target is a cloud/provider-agnostic storage abstraction. |
| **Containerization** | `docker-compose.yml` orchestrating `backend` (port 4000) and `rag` (port 5000). | [`docker-compose.yml`](./docker-compose.yml) | Currently orchestrates the legacy Express and Python services. |
| **Testing & CI** | Backend `package.json` contains dummy test script (`exit 1`). Frontend has ESLint but no test runner. | [`backend/package.json`](./backend/package.json), [`frontend/package.json`](./frontend/package.json) | Automated test infrastructure is currently absent. |

---

## 3. Current Phase

### **Phase 1: Monorepo Foundation**
- **Status**: **Complete**
- **Goal**: Refactor the existing AI Study Kit repository toward the new Lernivox architecture. Establish a clean monorepo using pnpm workspaces and Turborepo with `apps/web` (Next.js App Router), `apps/api` (NestJS REST API), `apps/worker` (NestJS background worker), reusable `@lernivox/*` packages (`database`, `ai-core`, `storage`, `contracts`, `eslint-config`, `typescript-config`), comprehensive documentation, and local infrastructure (`infra/docker`).

---

## 4. Architecture Decisions

### Confirmed Decisions
- [x] **Product Name**: Lernivox.
- [x] **Repository Management**: Monorepo with `pnpm` workspaces and Turborepo (`turbo`).
- [x] **Frontend Framework**: Next.js (App Router), React, TypeScript, Tailwind CSS.
- [x] **Backend Framework**: NestJS, TypeScript, structured as modular domains.
- [x] **Primary Database**: PostgreSQL accessed via Prisma ORM, leveraging `pgvector` for vector embeddings and hybrid search.
- [x] **Database ORM Version**: Stable Prisma ORM 7.x (`7.10.1` confirmed; Prisma 8 RC deferred).
- [x] **Asynchronous Processing**: Dedicated worker service using NestJS, Redis, and BullMQ for reliable document processing.
- [x] **AI Orchestration**: TypeScript-based application logic for document parsing, semantic chunking, embedding generation, and source-grounded retrieval.
- [x] **Visual Design Direction**: Guided by the [BrightPath](https://brightpath-wbs.framer.website/) Framer aesthetic (modern, contrast-rich, accessible cards, polished typography: Bricolage Grotesque, Instrument Sans, Inter).
- [x] **Homepage Entry Point**: Prominent textbook/document upload experience with clear value proposition.

### Provisional Choices (Under Evaluation)
- [ ] **Document/Asset Storage**: Cloudinary is the provisional choice for initial file hosting; isolated behind the abstract `StorageService` interface in `@lernivox/storage`.
- [ ] **LLM Provider**: Google Gemini API is currently integrated in the prototype; provider selection remains an injectable abstraction (`AiProvider` in `@lernivox/ai-core`) so alternative providers (Anthropic Claude, OpenAI) can be configured seamlessly.

### Unresolved Decisions
- [ ] **Authentication Mechanism**: Evaluation between NextAuth / Auth.js vs. NestJS Passport JWT with refresh token rotation.
- [ ] **Vector Index Strategy**: Choice between HNSW vs. IVFFlat indexes in pgvector depending on initial corpus scale.
- [ ] **Production Hosting Infrastructure**: Evaluation of target platforms (e.g., Vercel + Railway/Render vs. self-hosted Docker Swarm / Kubernetes).

---

## 5. Implementation Roadmap

| Phase | Description | Status | Verification Criteria |
|:---:|---|:---:|---|
| **Phase 0** | **Agent Instructions & Progress Tracking** | **Complete** | `AGENTS.md` and `PROGRESS.md` established at root; existing repository inspected. |
| **Phase 1** | **Monorepo Foundation & Tooling** | **Complete** | Root `pnpm-workspace.yaml`, `turbo.json`, `apps/{web,api,worker}`, `packages/{database,ai-core,storage,contracts,eslint-config,typescript-config}`, `docs/`, `infra/docker`. Builds, typechecks, and tests verified. |
| **Phase 2** | **Database, Prisma, PostgreSQL & pgvector Foundation** | Planned | PostgreSQL Docker service with pgvector, Prisma schema, migrations, connection validation. |
| **Phase 3** | **Backend Modules, Worker & Redis Infrastructure** | Planned | NestJS backend initialization, BullMQ worker setup, Redis integration, health check endpoints. |
| **Phase 4** | **Design System & Redesigned Lernivox Homepage** | Planned | Next.js App Router app, Tailwind configuration matching BrightPath aesthetic, interactive landing page & upload CTA. |
| **Phase 5** | **Authentication & User Workspaces** | Planned | Secure user registration, session management, personal workspaces, profile settings. |
| **Phase 6** | **Courses, Document Library & Ingestion Pipeline** | Planned | Multi-document upload, PDF/DOCX text extraction, chunking, vector embedding generation via BullMQ worker. |
| **Phase 7** | **Source-Grounded AI Tutor & Retrieval Engine** | Planned | Vector similarity query with pgvector, citation generator, strict context-grounded conversational tutor. |
| **Phase 8** | **Lessons, Quizzes, Challenges & Revision Materials** | Planned | Chapter-grounded quiz generation, interactive problem-solving challenges, automated flashcard decks. |
| **Phase 9** | **Learning Progress, Study Plans & Exam Readiness** | Planned | Mastery tracking, spaced repetition revision scheduler, exam readiness diagnostic metrics. |
| **Phase 10** | **Study Groups & Collaboration** | Planned | Shared document workspaces, peer study rooms, synchronized quiz challenges. |
| **Phase 11** | **Security Hardening, Accessibility, Testing & Deployment** | Planned | Comprehensive test coverage (unit/integration/E2E), accessibility compliance, rate-limiting, production build validation. |

---

## 6. Current Task Record

- **Task**: Lernivox — Phase 1: Monorepo Foundation
- **Objective**: Refactor repository toward Lernivox architecture by establishing pnpm workspaces, Turborepo, Next.js web app, NestJS API, NestJS BullMQ worker, reusable @lernivox packages, infrastructure configuration, and architecture/design documentation.
- **Work Completed**:
  1. Inspected live BrightPath design reference tokens, typography, and layout via DOM inspection (`docs/design/visual-reference.md`).
  2. Verified Prisma ORM stable release status (`7.10.1` confirmed stable; Prisma 8 RC deferred).
  3. Established root `pnpm-workspace.yaml`, `turbo.json`, `package.json`, `.gitignore`, and documented `.env.example`.
  4. Created shared configuration packages: `@lernivox/typescript-config` and `@lernivox/eslint-config`.
  5. Created shared domain packages:
     - `@lernivox/contracts`: Shared queue names, job types, and job payload DTOs.
     - `@lernivox/storage`: Provider-agnostic `StorageService` interface, local filesystem adapter, and provisional Cloudinary adapter stub.
     - `@lernivox/ai-core`: Standardized `AiProvider` interface, semantic chunking primitive with overlap (`chunkText`), and provisional Gemini adapter.
     - `@lernivox/database`: Prisma schema supporting PostgreSQL with `pgvector`, initial SQL migration (`0_init`), and singleton client factory using `@prisma/adapter-pg`.
  6. Created applications:
     - `apps/web`: Next.js 15 App Router application with Tailwind CSS configured with BrightPath color tokens, Route Groups `(marketing)`, `(auth)`, `(workspace)`, and accessible textbook upload hero section.
     - `apps/api`: NestJS REST API with versioned prefix (`/api/v1`), Swagger documentation (`/api/docs`), global `AllExceptionsFilter`, global `ValidationPipe`, and `/api/v1/health` endpoint.
     - `apps/worker`: Standalone NestJS background worker with `@nestjs/bullmq` integration and `DocumentIngestionProcessor` queue processor.
  7. Created infrastructure and architecture documentation:
     - `infra/docker/docker-compose.yml`: Local PostgreSQL (pgvector) on port 5433 and Redis 7 on port 6379 with persistent volumes and healthchecks.
     - `docs/product/requirements.md`: Product vision, target personas, and learning workflows.
     - `docs/architecture/overview.md`: Topology, component responsibilities, ingestion and RAG flows.
     - `docs/architecture/folder-structure.md`: Directory structure and package boundaries.
     - `docs/decisions/`: ADR-001 through ADR-005.
     - `docs/design/visual-reference.md`: Verified design tokens and visual principles.
     - Updated root `README.md` with complete quick-start guide, monorepo scripts, and legacy prototype references.
- **Files Created / Modified**:
  - `pnpm-workspace.yaml`, `turbo.json`, `package.json`, `pnpm-lock.yaml`, `.gitignore`, `.env.example`, `README.md`
  - `packages/typescript-config/*`, `packages/eslint-config/*`, `packages/contracts/*`, `packages/storage/*`, `packages/ai-core/*`, `packages/database/*`
  - `apps/web/*`, `apps/api/*`, `apps/worker/*`
  - `infra/docker/*`, `docs/product/*`, `docs/architecture/*`, `docs/decisions/*`, `docs/design/*`
  - `PROGRESS.md`
- **Commands & Checks Run and Actual Outcomes**:
  - `pnpm install`: Succeeded (exit code 0; lockfile generated).
  - `pnpm --filter @lernivox/database db:generate`: Succeeded (exit code 0; generated Prisma client in 69ms).
  - `pnpm type-check`: Succeeded across all 9 workspaces via Turborepo (11 tasks successful, exit code 0).
  - `pnpm build`: Succeeded across all packages and applications via Turborepo (7 tasks successful, exit code 0).
  - `pnpm test`: Succeeded (1 passed test suite, 2 passed tests in `HealthController`, exit code 0).
  - `PORT=4000 pnpm --filter @lernivox/api start`: Launched temporary API server; verified health endpoint via `curl -s http://localhost:4000/api/v1/health` (returned `{"status":"ok","service":"lernivox-api","version":"0.1.0"...}`); verified Swagger docs at `/api/docs` (returned `HTTP/1.1 200 OK`).
  - `pnpm --filter @lernivox/worker start`: Launched temporary worker daemon; verified startup logging and queue initialization.
- **Processes & Ports Opened and Cleanup**:
  - API on port 4000: Started temporarily for curl verification; killed and verified released via `ss -tulpn`.
  - Worker daemon: Started temporarily for startup verification; killed and verified released.
  - Zero lingering background processes; ports 4000, 5000, 5433, 6379 confirmed clean.
- **Original Implementation Integrity**:
  - `frontend/` and `backend/` directories remain completely intact and unmodified.
- **Known Issues or Blockers**:
  - None for Phase 1. Foundation verified.

---

## 7. Known Issues and Technical Debt

1. **Legacy Prototype Reference**:
   - `frontend/` and `backend/` remain in the repository for reference. They are intentionally excluded from `pnpm-workspace.yaml` and will be deprecated once feature modules are migrated.
2. **Local Infrastructure Required for Runtime Workflows**:
   - Runtime database operations require starting `infra/docker/docker-compose.yml` (`pnpm infra:up`) so PostgreSQL (pgvector) and Redis containers are accessible.

---

## 8. Next Recommended Action

**Phase 2: Database, Prisma, PostgreSQL & pgvector Foundation**
- **Action**: Launch the Docker Compose infrastructure (`pnpm infra:up`), execute Prisma migrations against PostgreSQL to enable the `vector` extension and initial relational tables, and create database integration tests and seeding scripts.

---

## 9. Update History

- **2026-10-28**:
  - Completed Phase 0 (Agent Instructions & Progress Tracking).
  - Completed Phase 1 (Monorepo Foundation).
  - Established `pnpm workspaces` and `Turborepo` monorepo structure.
  - Created `apps/web` (Next.js 15), `apps/api` (NestJS REST API), `apps/worker` (NestJS BullMQ worker).
  - Created shared `@lernivox/*` packages: `database`, `storage`, `ai-core`, `contracts`, `eslint-config`, `typescript-config`.
  - Added Docker Compose infrastructure for PostgreSQL 16 (pgvector) and Redis 7.
  - Authored comprehensive documentation (`docs/product`, `docs/architecture`, `docs/decisions`, `docs/design`).
  - Fully verified typechecks, production builds, unit tests, and runtime API/worker startups. All temporary ports cleaned up.

