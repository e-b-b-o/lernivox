# Lernivox Implementation Progress Tracking

> **Single Source of Truth**: This document tracks the implementation progress, architectural decisions, verified repository state, and next steps for **Lernivox**. Every agent must read and update this document in accordance with the guidelines in [`AGENTS.md`](./AGENTS.md).

---

## 1. Project Overview

**Lernivox** is an AI-powered study platform designed to transform textbooks, lecture materials, and academic documents into interactive, source-grounded learning environments. It provides verified citations, quizzes, interactive challenges, personalized study plans, and collaborative study groups.

### Current Architectural Direction
- **Repository Architecture**: Clean monorepo managed with **pnpm workspaces** and **Turborepo**.
- **Frontend**: **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, guided by the [BrightPath](https://brightpath-wbs.framer.website/) visual design system.
- **Backend Core**: **NestJS 11** and **TypeScript** utilizing modular architecture and REST/WebSocket APIs.
- **Primary Data Store**: **PostgreSQL 16** with **Prisma ORM 7.x** and the **pgvector** extension for vector similarity search.
- **Asynchronous Task Processing**: Dedicated TypeScript background worker using **NestJS**, **Redis 7**, and **BullMQ** for document ingestion and AI generation jobs.
- **AI Orchestration**: Native TypeScript RAG pipeline for parsing, chunking, embedding, source citation, and LLM orchestration (`@lernivox/ai-core`).
- **File Storage**: Provider-agnostic storage abstraction (`@lernivox/storage`, with **Cloudinary** as a provisional candidate and local filesystem for development).

---

## 2. Current Repository State (Verified Audit)

The repository has been transitioned into a clean, canonical monorepo. All legacy prototype folders (`frontend/`, `backend/`), stale crash logs (`startup_log.txt`), and legacy container configs (`docker-compose.yml`) have been safely removed.

| Area | Current Implementation State | Files / References | Notes & Verification |
|---|---|---|---|
| **Repository Tooling** | `pnpm workspaces` + `Turborepo` monorepo with Node.js 24 (`.nvmrc`). | [`package.json`](./package.json), [`pnpm-workspace.yaml`](./pnpm-workspace.yaml), [`turbo.json`](./turbo.json), [`.nvmrc`](./.nvmrc) | `pnpm type-check` (11/11 tasks), `pnpm build` (7/7 tasks), `pnpm test` (3/3 tasks) fully passing. |
| **Frontend Application** | Next.js 15 App Router, React 19, Tailwind CSS, TypeScript in `apps/web`. Full BrightPath 9-section homepage, interactive hero upload module, and document library. | [`apps/web/`](./apps/web/) | Production build verified (`next build` outputs static routes `/`, `/login`, `/register`, `/dashboard`, `/_not-found`, `/auth/callback`). |
| **Backend API Application** | NestJS 11 modular REST API with Swagger OpenAPI documentation in `apps/api`. Full Auth and Documents modules. | [`apps/api/`](./apps/api/) | All 54 tests passing; `/api/v1/documents` endpoints for upload, pasted text, retrieval, chunks, and deletion. |
| **Background Worker** | Standalone NestJS worker application with BullMQ processor in `apps/worker`. | [`apps/worker/`](./apps/worker/) | Real PDF (`pdf-parse`), DOCX (`mammoth`), and TXT extraction, semantic chunking (`@lernivox/ai-core`), pgvector embedding persistence, status lifecycle. All 3 unit tests passing. |
| **Database & Vector Package** | PostgreSQL 16 + pgvector schema and Prisma ORM 7.x client in `packages/database`. | [`packages/database/`](./packages/database/), [`docs/architecture/data-model.md`](./docs/architecture/data-model.md) | Domain migration applied, pgvector helpers in `src/vector.ts`, deterministic seeder `src/seed.ts`, 10/10 integration tests passing. |
| **AI Orchestration Package** | Provider-agnostic AI interfaces, text chunker, Gemini REST adapter, and MockAiProvider in `packages/ai-core`. | [`packages/ai-core/`](./packages/ai-core/) | Strict typing, sliding window chunking with semantic overlap, 768-dim vector verification. |
| **Storage Abstraction Package** | Universal `StorageService` contract with Local and Cloudinary adapters in `packages/storage`. | [`packages/storage/`](./packages/storage/) | Provider-agnostic file persistence layer, shared across API and worker. |
| **Shared Contracts Package** | DTOs, queue names, and job payload interfaces in `packages/contracts`. | [`packages/contracts/`](./packages/contracts/) | Shared typing across web, api, and worker applications. |
| **Local Infrastructure** | Isolated Docker Compose setup for PostgreSQL 16 (`pgvector`) and Redis 7 in `infra/docker/`. | [`infra/docker/docker-compose.yml`](./infra/docker/docker-compose.yml) | Controlled via `pnpm infra:up` and `pnpm infra:down`. |
| **Git Hygiene & Ignore Rules** | Reinforced `.gitignore` protecting secrets, dependencies, build artifacts, and local uploads. | [`.gitignore`](./.gitignore), [`.env.example`](./.env.example) | Zero uncommitted tracked files deleted; zero secrets committed. |

---

## 3. Current Phase

### **Phase 4: Redesigned Homepage and End-to-End Document Upload**
- **Status**: **Complete**
- **Outcome**: Designed and implemented the complete BrightPath-aligned marketing homepage with all 9 agreed sections, an interactive hero textbook upload experience (PDF, DOCX, TXT, pasted text), backend NestJS document controller and service with strict ownership security, BullMQ background ingestion worker with PDF/DOCX/TXT extraction, `@lernivox/ai-core` semantic chunking, 768-dim embeddings, pgvector persistence, and an authenticated Next.js document library with real-time status polling, chunk inspection, and deletion.

---

## 4. Architecture Decisions

### Confirmed Decisions
- [x] **Product Name**: Lernivox.
- [x] **Repository Management**: Monorepo with `pnpm` workspaces and Turborepo (`turbo`).
- [x] **Frontend Framework**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS.
- [x] **Backend Framework**: NestJS 11, TypeScript, structured as modular domains.
- [x] **Primary Database**: PostgreSQL 16 accessed via Prisma ORM 7.x, leveraging `pgvector` for vector embeddings and hybrid search.
- [x] **Database Driver Adapter**: `@prisma/adapter-pg` with connection pooling.
- [x] **Domain Data Model**: Central Document Library with many-to-many `CourseDocument` association; separate `QuizAttempt` and `StudentProgress` entities; sovereign cascade deletes with reference preservation (`SetNull`).
- [x] **Vector Dimensions**: `vector(768)` supporting standard modern embeddings (e.g., Google `text-embedding-004`).
- [x] **Asynchronous Processing**: Dedicated worker service using NestJS, Redis 7, and BullMQ for reliable document processing.
- [x] **AI Orchestration**: Native TypeScript application logic for document parsing, semantic chunking, embedding generation, and source-grounded retrieval.
- [x] **Visual Design Direction**: Guided by the [BrightPath](https://brightpath-wbs.framer.website/) Framer aesthetic (warm cream `#f4f0e5`, elevated surfaces `#faf7f3` / `#ffffff`, borders `#eae4d3`, deep forest `#14261d`, terracotta `#e8722c`, soft peach `#f9d8c0`, typography: Bricolage Grotesque display, Instrument Sans body).
- [x] **Homepage Entry Point**: Prominent textbook/document upload experience with clear value proposition and authenticated direct submission.
- [x] **Authentication Mechanism**: NestJS Passport with dual-token rotation (short-lived in-memory access token, rotating HttpOnly refresh cookie, server-side `UserSession` tracking with reuse detection, Argon2id password hashing, and Google OAuth 2.0).
- [x] **Document Ingestion Lifecycle**: `UPLOADED` -> `PROCESSING` -> `EXTRACTING` -> `CHUNKING` -> `EMBEDDING` -> `READY` (or `FAILED` with explicit `errorCode` and user-safe `errorMessage`).

### Provisional Choices (Under Evaluation)
- [ ] **Document/Asset Storage**: Cloudinary is the provisional choice for initial file hosting; isolated behind the abstract `StorageService` interface in `@lernivox/storage`. Local storage adapter used in local development with cross-service relative keys (`documents/${userId}/${docId}_${filename}`).
- [ ] **LLM Provider**: Google Gemini API is currently integrated in `@lernivox/ai-core`; provider selection remains an injectable abstraction (`AiProvider`) with `MockAiProvider` for offline integration tests.

### Unresolved Decisions
- [ ] **Vector Index Strategy**: Choice between HNSW vs. IVFFlat indexes in pgvector depending on initial corpus scale.
- [ ] **Production Hosting Infrastructure**: Evaluation of target platforms (e.g., Vercel + Railway/Render vs. self-hosted Docker Swarm / Kubernetes).

---

## 5. Implementation Roadmap

| Phase | Description | Status | Verification Criteria |
|:---:|---|:---:|---|
| **Phase 0** | **Agent Instructions & Progress Tracking** | **Complete** | `AGENTS.md` and `PROGRESS.md` established at root; existing repository inspected. |
| **Phase 1** | **Monorepo Foundation & Repository Cleanup** | **Complete** | Monorepo established; legacy prototype removed; `.gitignore` reinforced; builds, typechecks, and tests verified. |
| **Phase 2** | **Database, Prisma, PostgreSQL & pgvector Foundation** | **Complete** | Domain schema, migration `20261029000000_domain_data_model`, pgvector helpers, seeder, and 10/10 tests verified. |
| **Phase 3** | **Complete Authentication Feature (End to End)** | **Complete** | NestJS AuthModule, Argon2id, token rotation & reuse detection, HttpOnly cookies, Google OAuth, Next.js login/register/callback, protected dashboard, 37/37 tests. |
| **Phase 4** | **Redesigned Homepage and End-to-End Document Upload** | **Complete** | BrightPath 9-section homepage, interactive hero upload, NestJS DocumentsModule, BullMQ worker extraction (PDF/DOCX/TXT), chunking, 768-dim embeddings, pgvector persistence, document library with live status polling. 67/67 tests passing. |
| **Phase 5** | **User Workspaces & Profile Preferences** | Planned | Comprehensive personal workspaces, study profile settings, spaced repetition targets. |
| **Phase 6** | **Courses & Course Document Organization** | Planned | Course grouping, syllabi assignment, multi-document course libraries. |
| **Phase 7** | **Source-Grounded AI Tutor & Retrieval Engine** | Planned | Vector similarity query with pgvector, citation generator, strict context-grounded conversational tutor. |
| **Phase 8** | **Lessons, Quizzes, Challenges & Revision Materials** | Planned | Chapter-grounded quiz generation, interactive problem-solving challenges, automated flashcard decks. |
| **Phase 9** | **Learning Progress, Study Plans & Exam Readiness** | Planned | Mastery tracking, spaced repetition revision scheduler, exam readiness diagnostic metrics. |
| **Phase 10** | **Study Groups & Collaboration** | Planned | Shared document workspaces, peer study rooms, synchronized quiz challenges. |
| **Phase 11** | **Security Hardening, Accessibility, Testing & Deployment** | Planned | Comprehensive test coverage (unit/integration/E2E), accessibility compliance, rate-limiting, production build validation. |

---

##### 6. Current Task Record

- **Task**: Granular 15-Commit Structured Decomposition & Hygiene Audit
- **Objective**: Decompose all accumulated BrightPath design system tokens, typography upgrades, modular navigation, animated ribbon marquee, hero upload redesign, and reference updates into exactly 15 atomic, conventional commits:
  1. `build(web): configure remote image pattern for unsplash assets`
  2. `style(web): import bricolage and instrument sans fonts and define palette variables`
  3. `style(web): configure tailwind color tokens and typography for brightpath design`
  4. `refactor(web): update root layout font loading and warm canvas background`
  5. `feat(web): add modular brightpath navigation bar with scroll observation`
  6. `refactor(web): integrate navbar and refresh marketing layout container and footer`
  7. `feat(web): create animated undulating svg waving ribbon component`
  8. `style(web): implement inclined hero headline with sketch underline and accent ticks`
  9. `style(web): add tactile pill call-to-action buttons to hero section`
  10. `feat(web): embed waving ribbon ticker and overlapping photography showcase`
  11. `feat(web): redesign hero document upload card with tabbed dropzone and brightpath styling`
  12. `refactor(web): refresh how it works section and marketing page color tokens`
  13. `style(web): harmonize guided learning preview cards and borders with design tokens`
  14. `chore(reference): update design screencasts and prune legacy reference assets`
  15. `docs: record brightpath design overhaul milestones and verification audit in progress tracking`
- **Status**: **Complete**
- **Work Completed**:
  - Divided and staged the entire changeset into 15 logical, atomic commits adhering strictly to Conventional Commits.
  - Verified static prerendering across all 8 Next.js routes (`pnpm --filter @lernivox/web build`).
  - Verified TypeScript compilation across all 9 monorepo packages (`pnpm type-check`).
  - Verified test suite execution with 67/67 automated tests passing (`pnpm test`).
  - Confirmed all development ports (3000, 3001, 4000) freed and released.
- **Files Created/Modified**:
  - `apps/web/next.config.ts` (Commit 1)
  - `apps/web/styles/globals.css` (Commit 2)
  - `apps/web/tailwind.config.ts` (Commit 3)
  - `apps/web/app/layout.tsx` (Commit 4)
  - `apps/web/components/marketing/Navbar.tsx` (Commit 5)
  - `apps/web/app/(marketing)/layout.tsx` (Commit 6)
  - `apps/web/components/marketing/WavingRibbon.tsx` (Commit 7)
  - `apps/web/app/(marketing)/page.tsx` (Commits 8, 9, 10, 12)
  - `apps/web/components/marketing/HeroUpload.tsx` (Commit 11)
  - `apps/web/components/marketing/GuidedLearningPreview.tsx` (Commit 13)
  - `reference/` (Commit 14)
  - `PROGRESS.md` (Commit 15)
- **Verification**:
  - `pnpm type-check`: 11/11 tasks passed. Zero TypeScript errors.
  - `pnpm --filter @lernivox/web build`: Passed (code 0). Static prerendering of all 8 routes (`/`, `/_not-found`, `/auth/callback`, `/dashboard`, `/login`, `/register`).
  - `pnpm test`: 3/3 tasks passed (67/67 automated tests passing).
- **Processes and Ports**:
  - Port 5433: PostgreSQL container (`lernivox-postgres`).
  - Port 6379: Redis container (`lernivox-redis`).
  - Ports 3000, 3001, 4000: Completely freed and released.
  - Zero lingering temporary test or dev processes.

---

## 7. Known Issues & Blockers

1. **Local Infrastructure Required for Runtime Workflows**:
   - Runtime database operations require starting `infra/docker/docker-compose.yml` (`pnpm infra:up`) so PostgreSQL (pgvector) and Redis containers are accessible.
2. **ESLint Command in Non-Web Packages**:
   - Monorepo `pnpm lint` relies on eslint packages that have not yet been hoisted into standalone package bin dirs (scripts exit 127). Typechecking and testing are the primary automated gates.

---

## 8. Next Recommended Action

**Phase 5: User Workspaces & Profile Preferences**
- **Action**: Implement multi-workspace management, student profile preferences (academic level, explanation depth, dark/light theme preference, notification settings), and study schedules.

---

## 9. Update History

- **2026-10-28**:
  - Completed Phase 0 (Agent Instructions & Progress Tracking).
  - Completed Phase 1 (Monorepo Foundation).
  - Established `pnpm workspaces` and `Turborepo` monorepo structure.
  - Authored comprehensive architecture documentation and ADRs.
- **2026-10-29**:
  - Completed Repository Cleanup, Rename Audit, and Git Hygiene.
  - Completed Phase 2: Domain Data Model, Prisma migrations, pgvector vector helper utility, seeder, and 10/10 database tests.
  - Completed Phase 3: Complete Authentication Feature (End to End): NestJS AuthModule, Argon2id, token rotation & reuse detection, HttpOnly cookies, Google OAuth, Next.js login/register/callback, protected dashboard.
  - Completed Phase 4: Redesigned Homepage and End-to-End Document Upload: NestJS DocumentsModule, BullMQ worker with PDF/DOCX/TXT extraction, pgvector embedding persistence, authenticated dashboard.
  - Completed Site-Wide Design System Overhaul.
  - Completed BrightPath Design Token Refactor (Typography, Colors, Layout Scale).
  - Fixed Font Loading, Hero Scale & Navbar Spacing.
  - Completed Bright Path Hero Showcase & Centered Navigation Refactor.
  - Completed Pixel-Perfect Global Navigation Bar Refactor.
  - Completed Navbar and Button Styling Refactor.
  - Completed Exact Computed Framer DOM Specifications for Navbar & Hero Buttons.
  - Completed HeroUpload 2-Column Split Showcase Refactor (`#how-it-works`).
  - **Completed Hero Headline Inclined Effect, Animated Edge-to-Edge Waving Ribbon, and Pill Tags Removal**:
    - Extracted exact mathematical S-wave curve and headline accent vector aesthetics from the BrightPath reference.
    - Set `"into real "` in the exact `#14261D` heading color and isolated `"understanding."` with `#497E64` dark sage green, inclined rotation (`rotate-[3.5deg] origin-bottom-left`), multiple sketch doodle underline strokes in `#E8722C`, and top-right accent ticks (`//`).
    - Implemented `apps/web/components/marketing/WavingRibbon.tsx` with edge-to-edge wave ribbon (`viewBox="0 0 1600 300"`, 42px `#497E64` stroke, `-rotate-[4deg]` tilt) and smooth continuous marquee animation moving behind the 3 photo cards.
    - Removed the three value-prop pill tags under the photography cards.
    - Added `overflow-x-hidden` on `apps/web/app/(marketing)/layout.tsx`.
    - Verification: `pnpm type-check` (11/11), `pnpm --filter @lernivox/web build` (8/8 static routes), `pnpm test` (67/67 automated tests passing), all ports clean.

