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

## 6. Current Task Record

- **Task**: Lernivox — Phase 4: Redesigned Homepage and End-to-End Document Upload
- **Objective**: Build the complete, responsive marketing homepage based on the BrightPath design reference, featuring an interactive textbook upload experience directly from the hero. Implement the complete backend and background worker pipeline for uploading, storing (packages/storage), extracting, chunking (packages/ai-core), embedding (pgvector), and indexing learning materials with real-time/polled status reporting and document library management.
- **Status**: **Complete**
- **Work Completed**:
  1. **BrightPath Design System Reference Analysis**:
     - Extracted exact palette tokens (`tokens.json`, `components.md`, `rules.md`, `layout.md`): warm cream canvas (`#f4f0e5`), elevated card surfaces (`#faf7f3` / `#ffffff`), deep forest (`#14261d`), terracotta accent (`#e8722c`), soft peach (`#f9d8c0`), warm stone dividers (`#eae4d3`).
     - Integrated `Bricolage_Grotesque` display font (tight -0.08em tracking) and `Instrument_Sans` body font via `next/font/google`.
     - Applied signature tactile shadows (`shadow-[0px_4px_0px_0px_#14261d]` and `shadow-[0px_4px_0px_0px_#b26e45]`).
  2. **Complete 9-Section Marketing Homepage (`apps/web/app/(marketing)/page.tsx`)**:
     - **Section 1: Hero & Upload Entry Point**: Compelling value proposition ("Turn your textbooks into real understanding") with the interactive `HeroUpload` module.
     - **Section 2: How It Works**: 4-step card sequence (Upload Materials, Semantic Ingestion, Guided Explanation, Verified Practice) with numbered pills and tactile depth.
     - **Section 3: Guided Learning Preview**: `GuidedLearningPreview` component demonstrating a realistic topic (Calculus I: The Chain Rule) with learning objective, intuitive gear analogy, worked calculation, interactive multiple-choice check with feedback, and exact Stewart Calculus §2.5 p. 198 Theorem 2 citation.
     - **Section 4: Learning Features**: 6 cards highlighting Guided AI Tutor, Step-by-Step Worked Methods, Chapter Quizzes & Feedback, Problem-Solving Challenges, Structured Revision Cards, and Verifiable Page Citations.
     - **Section 5: Progress and Exam Preparation**: Topic readiness metrics and chapter completion diagnostic previews.
     - **Section 6: Collaborative Learning**: Overview of study groups and shared textbook indexes.
     - **Section 7: Transparent Freemium Pricing**: Free Starter ($0/mo) vs Pro Scholar early access tiers.
     - **Section 8: Frequently Asked Questions (FAQ)**: Interactive accordion answering supported formats, zero hallucination guarantee, document privacy, and BullMQ worker architecture.
     - **Section 9: Final Call to Action**: Tactile high-conversion banner directing students to start studying.
  3. **Interactive Hero Upload Module (`apps/web/components/marketing/HeroUpload.tsx`)**:
     - Dual-tab support: File Dropzone (PDF, DOCX, TXT up to 25 MB) and Pasted Text Notes.
     - Drag-and-drop feedback, file validation (empty, oversized, unsupported format).
     - Auth-aware execution:
       - Logged-in students: directly uploads via `api.documents.uploadFile`, enqueues ingestion, and redirects smoothly to `/dashboard`.
       - Logged-out visitors: clear prompt indicating authentication is required to index private documents; provides safe "Sign In to Ingest" and "Create Free Account" flows without anonymous uploads or localStorage leaks.
  4. **Authenticated Document Library & Ingestion Manager (`apps/web/app/(workspace)/dashboard/page.tsx`)**:
     - Lists all authenticated student documents with safe metadata.
     - Real-time status badges: `UPLOADED`, `PROCESSING`, `EXTRACTING`, `CHUNKING`, `EMBEDDING`, `READY`, `FAILED`.
     - Polling mechanism: automatically polls every 3s while documents are actively processing; terminates polling when all jobs reach terminal states.
     - Direct upload modal inside workspace for adding new course materials or notes.
     - "Inspect Chunks" modal displaying extracted semantic chunks, token counts, and 768-dim pgvector status.
     - Delete document action with confirmation dialog, deleting physical storage files and database records.
  5. **NestJS Documents Module (`apps/api/src/documents`)**:
     - Implemented `DocumentsController` and `DocumentsService` with endpoints `/documents/upload`, `/documents/text`, `GET /documents`, `GET /documents/:id`, `GET /documents/:id/chunks`, `DELETE /documents/:id`.
     - Strictly enforced server-side ownership checks (`403 Forbidden` / `404 Not Found`).
     - Integrated `StorageModule` and BullMQ queue `QueueName.DOCUMENT_INGESTION`.
  6. **Background Ingestion Worker (`apps/worker`)**:
     - Implemented `DocumentIngestionProcessor`:
       - Downloads file from `StorageService`.
       - Extracts text using `pdf-parse` (PDF) and `mammoth` (DOCX), or utf-8 decoding (TXT).
       - Generates chunks with `@lernivox/ai-core` `chunkText`.
       - Guarantees idempotency on retries by deleting existing chunks before re-inserting.
       - Generates 768-dim vector embeddings and stores them via `storeChunkVector` using pgvector.
       - Records status transitions: `PROCESSING` -> `EXTRACTING` -> `CHUNKING` -> `EMBEDDING` -> `READY`.
       - Captures failures safely in `errorCode` and `errorMessage` on the `Document` record.
  7. **AI Core & Provider Abstraction (`packages/ai-core`)**:
     - Created `MockAiProvider` for deterministic 768-dim vector embeddings in test and mock environments.
     - Updated `GeminiProvider` with real REST API calls and strict key validation (throws when credentials are missing or placeholders).
- **Files Created / Modified**:
  - `packages/contracts/src/documents.ts` (Created)
  - `packages/contracts/src/index.ts` (Modified)
  - `packages/ai-core/src/providers/mock.provider.ts` (Created)
  - `packages/ai-core/src/providers/gemini.provider.ts` (Modified)
  - `packages/ai-core/src/index.ts` (Modified)
  - `apps/api/package.json` (Modified)
  - `apps/api/src/app.module.ts` (Modified)
  - `apps/api/src/config/env.validation.ts` (Modified)
  - `apps/api/src/common/prisma/prisma.service.ts` (Modified)
  - `apps/api/src/common/storage/storage.module.ts` (Created)
  - `apps/api/src/documents/dto/create-pasted-text.dto.ts` (Created)
  - `apps/api/src/documents/dto/document-response.dto.ts` (Created)
  - `apps/api/src/documents/documents.service.ts` (Created)
  - `apps/api/src/documents/documents.controller.ts` (Created)
  - `apps/api/src/documents/documents.module.ts` (Created)
  - `apps/api/src/documents/documents.service.spec.ts` (Created - 11 tests)
  - `apps/api/src/documents/documents.controller.spec.ts` (Created - 6 tests)
  - `apps/worker/package.json` (Modified)
  - `apps/worker/jest.config.js` (Created)
  - `apps/worker/src/worker.module.ts` (Modified)
  - `apps/worker/src/prisma/prisma.service.ts` (Created)
  - `apps/worker/src/prisma/prisma.module.ts` (Created)
  - `apps/worker/src/storage/storage.module.ts` (Created)
  - `apps/worker/src/processors/document-ingestion.processor.ts` (Created)
  - `apps/worker/src/processors/document-ingestion.processor.spec.ts` (Created - 3 tests)
  - `apps/web/tailwind.config.ts` (Modified - Wide 1440px bounds, Fraunces serif font, expanded warm palette, card & pill shadows)
  - `apps/web/styles/globals.css` (Modified - Warm cream root CSS variables, Instrument Sans antialiasing, fadeIn animations)
  - `apps/web/app/layout.tsx` (Modified - Added Fraunces Google font with italic styles, smooth scroll, warm body background)
  - `apps/web/components/ui/button.tsx` (Modified - Pill-shaped rounded-full buttons, refined heights, soft elevation, no bottom drop-shadows)
  - `apps/web/components/ui/card.tsx` (Modified - rounded-[2rem], soft elevated surface bg-white/80 backdrop-blur-md, border-stone-200/80, shadow-card)
  - `apps/web/app/(marketing)/layout.tsx` (Modified - Expansive max-w-[1440px] navigation and footer, h-24 header, pill actions)
  - `apps/web/app/(marketing)/page.tsx` (Modified - Expansive 1440px sections, py-24/36 padding, scaled typography with Fraunces italics, elevated cards)
  - `apps/web/components/marketing/HeroUpload.tsx` (Modified - max-w-4xl container, rounded-[2.5rem], pill tabs, generous padding, format chips)
  - `apps/web/components/marketing/GuidedLearningPreview.tsx` (Modified - max-w-5xl, rounded-[2.5rem], editorial quotes, pill options)
  - `apps/web/app/(auth)/login/page.tsx` (Modified - max-w-xl card, rounded-[2.5rem], pill buttons, rounded-2xl inputs)
  - `apps/web/app/(auth)/register/page.tsx` (Modified - max-w-xl card, rounded-[2.5rem], pill buttons, rounded-2xl inputs)
  - `apps/web/app/(workspace)/dashboard/page.tsx` (Modified - Expansive 1440px container, rounded-[2rem] document cards, rounded-[2.5rem] modals)
  - `PROGRESS.md` (Modified)
- **Verification**:
  - `pnpm test`: 3/3 tasks passed (5.40s).
    - `@lernivox/database`: 10/10 tests passed (including pgvector similarity search, document lifecycle, referential integrity).
    - `@lernivox/api`: 54/54 tests passed (auth, session rotation, document uploads, pasted text, ownership security, deletion).
    - `@lernivox/worker`: 3/3 tests passed (document ingestion processor, status transitions, chunk generation, mock pgvector embedding, failure modes).
    - Total: **67/67 automated tests passing**.
  - `pnpm type-check`: 11/11 tasks passed (2.58s). Zero TypeScript errors across the monorepo.
  - `pnpm --filter @lernivox/web build`: Completed successfully (code 0). Static prerendering of all 8 routes (`/`, `/_not-found`, `/auth/callback`, `/dashboard`, `/login`, `/register`).
- **Processes and Ports**:
  - Port 5433: PostgreSQL container (`lernivox-postgres`, active persistent infrastructure).
  - Port 6379: Redis container (`lernivox-redis`, active persistent infrastructure).
  - Ports 3000 and 4000 verified clean and free (`ss -tulpn`).
  - Zero lingering background processes.

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
  - **Completed Site-Wide Design System Overhaul**:
    - Expanded global viewport and container bounds from narrow `max-w-4xl` / `max-w-5xl` to expansive `max-w-[1440px]` (`wide`) with fluid padding `px-6 md:px-12 xl:px-16`.
    - Increased vertical section breathing room to `py-24 md:py-36` and hero stature to `pt-20 pb-28 md:pt-32 md:pb-44`.
    - Scaled typography hierarchy across all pages: Hero titles up to `text-5xl md:text-7xl lg:text-8xl font-black`, section headers up to `text-4xl md:text-6xl font-extrabold`, body paragraphs to `text-lg md:text-xl text-stone-600 leading-relaxed`.
    - Integrated Google `Fraunces` editorial serif font with italic styling (`font-serif italic font-normal text-lernivox-terracotta`) for signature punchy headline emphasis.
    - Converted buttons site-wide to friendly pill shapes (`rounded-full px-7 py-3.5 text-base md:text-lg font-medium transition-all`) and removed muddy bottom drop-shadows.
    - Upgraded cards across all 9 marketing sections, HeroUpload (`max-w-4xl`), GuidedLearningPreview (`max-w-5xl`), Login & Register (`max-w-xl`), and Student Workspace Dashboard to soft elevated surfaces (`bg-white/90 backdrop-blur-md`, `border-stone-200/80`, `rounded-[2rem]` / `rounded-[2.5rem]`, and diffuse `shadow-card` / `shadow-card-hover`).
    - Verified with `pnpm type-check` (11/11), `pnpm test` (67/67), and `pnpm --filter @lernivox/web build` (8/8 static routes). Ports 3000 and 4000 clean.

