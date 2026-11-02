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

### **Major Product Transformation: From Course-Centered Platform to Book-Centered Personal & Collaborative Workspaces (Phase 0 & Phase 1)**
- **Status**: **Complete**
- **Outcome**: Successfully transitioned Lernivox's core paradigm from course-centric organization to a clean, book-centered architecture (`Document/Material <-> 1:1 Workspace`). Backfilled all 3 existing digested books into persistent workspaces with 100% data preservation (0 chunks lost, 0 embeddings lost, 0 re-ingestion, 0 re-embedding). Implemented central backend authorization policy (`verifyDocumentAccess`), one-way `PERSONAL` -> `GROUP` workspace transition rule, transformed `/dashboard` into a book-centered library ("My Books" & "Shared with Me"), created canonical workspace route `/dashboard/workspaces/[workspaceId]`, built backward compatibility redirect adapter for `/dashboard/tutor`, safely retired obsolete routes (`/dashboard/library`, `/dashboard/courses`, `/dashboard/practice`, `/dashboard/groups`, `/dashboard/progress`) with client redirects to `/dashboard`, and preserved existing 3-pane study reader and private AI conversations.

---

## 4. Architecture Decisions

### Confirmed Decisions
- [x] **Product Paradigm**: **Book-Centered Personal & Collaborative Workspaces**. One uploaded document/material has one persistent workspace (`Document <-> 1:1 Workspace`).
- [x] **Workspace Types**: `PERSONAL` (single learner, private AI tutor, personal notes & progress) and `GROUP` (collaborative learning around shared material, shared outline/reader, private AI conversations per member, role permissions).
- [x] **One-Way Workspace Conversion Rule**: A `PERSONAL` workspace can be converted into a `GROUP` workspace by its owner; a `GROUP` workspace can **never** be converted back into a `PERSONAL` workspace. Enforced at domain/service layer.
- [x] **Authorization & Isolation Policy**: Centralized in `WorkspacesService.verifyDocumentAccess(userId, documentId)`. Access granted if user is workspace owner or active workspace member. Deletions restricted strictly to workspace owner. Individual progress and private AI chats remain strictly user-isolated.
- [x] **Product Name**: Lernivox.
- [x] **Repository Management**: Monorepo with `pnpm` workspaces and Turborepo (`turbo`).
- [x] **Frontend Framework**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS. Canonical workspace route: `/dashboard/workspaces/[workspaceId]`.
- [x] **Backend Framework**: NestJS 11, TypeScript, structured as modular domains (`WorkspacesModule`, `DocumentsModule`, `TutorModule`, `QuizzesModule`, `AuthModule`).
- [x] **Primary Database**: PostgreSQL 16 accessed via Prisma ORM 7.x, leveraging `pgvector` for vector embeddings and hybrid search.
- [x] **Database Driver Adapter**: `@prisma/adapter-pg` with connection pooling.
- [x] **Vector Dimensions**: `vector(768)` supporting standard modern embeddings (e.g., Google `gemini-embedding-2` / `text-embedding-004`).
- [x] **Asynchronous Processing**: Dedicated worker service using NestJS, Redis 7, and BullMQ for reliable document processing.
- [x] **AI Orchestration**: Native TypeScript RAG pipeline for parsing, chunking, embedding, source citation, and LLM orchestration (`@lernivox/ai-core`).
- [x] **Visual Design Direction**: Guided by the [BrightPath](https://brightpath-wbs.framer.website/) Framer aesthetic (warm cream `#f4f0e5`, elevated surfaces `#faf7f3` / `#ffffff`, borders `#eae4d3`, deep forest `#14261d`, terracotta `#e8722c`, soft peach `#f9d8c0`, typography: Bricolage Grotesque display, Instrument Sans body).
- [x] **Route Retirement & Compatibility**: Retired routes (`/dashboard/library`, `/dashboard/courses`, `/dashboard/practice`, `/dashboard/groups`, `/dashboard/progress`) safely redirect to `/dashboard`. Compatibility adapter on `/dashboard/tutor?documentId=...` resolves and redirects to canonical `/dashboard/workspaces/[workspaceId]`.

---

## 5. Implementation Roadmap

| Phase | Description | Status | Verification Criteria |
|:---:|---|:---:|---|
| **Phase 0** | **Reconciliation & Migration Planning** | **Complete** | Audit of active database, 3 ready documents, 1,429 chunks/embeddings, schema migration strategy, and data preservation plan. |
| **Phase 1** | **Book-Centered Core Foundation** | **Complete** | 1:1 Workspace domain model, idempotent backfill, access control, one-way conversion invariant, "My Books" launcher, canonical `/dashboard/workspaces/[workspaceId]` route, compatibility redirects, 100% data preservation verified. |
| **Phase 2** | **Personal-to-Group Conversion and Collaboration** | Planned | Convert Personal to Group UI, invitations, membership management, group roles, shared group discussions, private conversation sharing. |
| **Phase 3** | **Workspace Learning Features** | Planned | In-workspace quizzes, attempts, flashcards, reviews, and per-user learning progress metrics. |
| **Phase 4** | **Optional AI Learning Plans** | Planned | AI-assisted structured study sequences, adaptive recommendations based on quiz performance. |

---

## 6. Current Task Record

- **Task**: Major Product Transformation: Transition to Book-Centered Workspaces (Phase 0 & Phase 1)
- **Status**: **Complete**
- **Objective**:
  - Transform Lernivox from course-centric organization to a book-centered platform where one uploaded document has one persistent workspace (`PERSONAL` or `GROUP`).
  - Preserve all existing digested books (3 documents, 1,429 chunks, 1,429 embeddings, reading progress, and conversations) without re-uploading or re-embedding.
  - Implement idempotent database migration and backfill.
  - Create centralized access control, one-way conversion rule, and backend `WorkspacesModule`.
  - Transform `/dashboard` into clean "My Books" & "Shared with Me" launcher with `+ Add Material` flow.
  - Create canonical workspace route `/dashboard/workspaces/[workspaceId]`, preserving 3-pane study reader.
  - Implement compatibility redirect on `/dashboard/tutor` and retire obsolete routes to `/dashboard`.
- **Work Completed**:
  1. Audited PostgreSQL: 3 documents, 1,429 chunks, 1,429 embeddings, 3 conversations, 2 reading progress records.
  2. Updated Prisma schema: Added `WorkspaceType` (`PERSONAL`, `GROUP`), `WorkspaceRole` (`OWNER`, `MEMBER`), refactored `Workspace` to 1:1 with `Document`, added `WorkspaceMember`, updated `Document` and `Conversation` relations.
  3. Created migration `20261102203500_book_centered_workspaces` with idempotent embedded PL/pgSQL backfill and standalone programmatic helper `packages/database/src/backfill.ts`.
  4. Created `@lernivox/contracts/src/workspaces.ts` with DTOs and updated document DTOs.
  5. Implemented `WorkspacesModule` in `apps/api`:
     - `verifyDocumentAccess(userId, documentId)`: centralized access check for workspace owner or member.
     - `listUserWorkspaces(userId)`: returns `{ myBooks, sharedWithMe }`.
     - `getWorkspaceById(userId, workspaceId)` and `getWorkspaceByDocumentId(userId, documentId)`.
     - `convertToGroupWorkspace(userId, workspaceId)`: strictly enforces irreversible `PERSONAL` -> `GROUP` conversion (throwing 400 Bad Request on invalid transitions).
  6. Updated `DocumentsService` and `TutorService` to route access checks through `WorkspacesService` and associate new uploads with workspaces.
  7. Rebuilt `apps/web/app/(workspace)/dashboard/page.tsx` as "My Books" launcher with book cards, reading progress bars, workspace badges, polling, and modal supporting file upload and text notes with initial workspace type selection.
  8. Created canonical workspace route `apps/web/app/(workspace)/dashboard/workspaces/[workspaceId]/page.tsx` with full 3-pane study layout, outline, PDF reader, AI tutor sidecar, citation inspector, and quiz modal.
  9. Updated `TutorHeader.tsx` with workspace type badge and back-to-books link.
  10. Replaced `/dashboard/tutor/page.tsx` with backward compatibility redirect adapter preserving query parameters.
  11. Retired `/dashboard/library`, `/dashboard/courses`, `/dashboard/practice`, `/dashboard/groups`, and `/dashboard/progress` with client redirects to `/dashboard`.
- **Verification**:
  - `pnpm type-check`: 11/11 tasks passed across all packages.
  - `pnpm test`: All unit & integration tests passed (99 in API, 10 in Database, 18 in AI-Core).
  - `pnpm build`: 7/7 tasks passed, `next build` generated 15/15 static and dynamic pages.
  - PostgreSQL Data Integrity Audit:
    - `documents_count`: 3 (100% preserved)
    - `ready_documents`: 3 (100% preserved)
    - `chunks_count`: 1,429 (100% preserved)
    - `embeddings_count`: 1,429 (100% preserved)
    - `workspaces_count`: 3 (backfilled 1:1)
    - `workspace_members_count`: 3 (all assigned role `OWNER`)
    - `conversations_count`: 3 (linked to workspaces)
    - `messages_count`: 12 (100% preserved)
    - `reading_progress_count`: 2 (100% preserved)
    - Re-ingestion/re-embedding calls: 0
- **Processes and Ports**:
  - Cleaned up: No agent-spawned background processes or dev watchers remaining.
  - Persistent infrastructure: `lernivox-postgres` active on port 5433, `lernivox-redis` active on port 6379.
- **Known Issues / Blockers**: None.
- **Next Recommended Action**: Execute Phase 2 — Personal-to-Group Conversion and Collaboration.
  - Refine vertical typography spacing and heading prominence without custom CSS or awkward empty gaps.
  - Verify with `pnpm type-check` and `pnpm build`.
- **Work Completed**:
  - Inspected all application routes and identified exact locations of decorative eyebrow elements immediately above primary `<h1>` headings.
  - Removed decorative eyebrow badges across all 8 user-facing views:
    - `/dashboard` (`apps/web/app/(workspace)/dashboard/page.tsx`): Removed `My Learning Space` pill badge and cleaned up unused `Compass` import.
    - `/dashboard/progress` (`apps/web/app/(workspace)/dashboard/progress/page.tsx`): Removed `Evidence-Based Progress` pill badge and cleaned up unused `BarChart2` import.
    - `/dashboard/practice` (`apps/web/app/(workspace)/dashboard/practice/page.tsx`): Removed `Practice Center` pill badge.
    - `/dashboard/library` (`apps/web/app/(workspace)/dashboard/library/page.tsx`): Removed `Study Library` pill badge and cleaned up unused `BookOpen` import.
    - `/dashboard/courses` (`apps/web/app/(workspace)/dashboard/courses/page.tsx`): Removed `Academic Workspaces` pill badge.
    - `/dashboard/groups` (`apps/web/app/(workspace)/dashboard/groups/page.tsx`): Removed `Collaborative Learning` pill badge.
    - `/dashboard/settings` (`apps/web/app/(workspace)/dashboard/settings/page.tsx`): Removed `Profile & Preferences` pill badge and cleaned up unused `Settings` icon import.
    - `/dashboard/practice/quizzes/[quizId]` (`apps/web/app/(workspace)/dashboard/practice/quizzes/[quizId]/page.tsx`): Removed `AI Assessment Engine` pill badge from generation loading state.
  - Verified and preserved functional badges and indicators:
    - Kept difficulty indicators (`{quiz.difficulty} Level`) and source chapter badges (`{quiz.sourceChapter}`).
    - Kept evaluation outcome pills (`Assessment Mastered` / `Needs Reinforcement`).
    - Kept document format tags, processing state badges, and form labels.
  - Preserved natural editorial vertical rhythm: headings start directly at the top of each header container with descriptions positioned immediately beneath (`mt-1`).
  - Verified that `/` (marketing homepage), `/login`, and `/register` natively start with clean `<h1>` headings.
- **Files Created/Modified**:
  - `apps/web/app/(workspace)/dashboard/progress/page.tsx`
  - `apps/web/app/(workspace)/dashboard/practice/page.tsx`
  - `apps/web/app/(workspace)/dashboard/library/page.tsx`
  - `apps/web/app/(workspace)/dashboard/courses/page.tsx`
  - `apps/web/app/(workspace)/dashboard/groups/page.tsx`
  - `apps/web/app/(workspace)/dashboard/settings/page.tsx`
  - `apps/web/app/(workspace)/dashboard/page.tsx`
  - `apps/web/app/(workspace)/dashboard/practice/quizzes/[quizId]/page.tsx`
  - `PROGRESS.md`
- **Verification Evidence**:
  - `pnpm type-check`: 11/11 tasks passing across all packages and apps with 0 errors.
  - `pnpm build`: 7/7 builds passing, 15/15 Next.js routes statically or dynamically compiled with 0 errors.
  - Processes and Ports: Zero orphan dev server processes; PostgreSQL (port 5433) and Redis (port 6379) active and healthy.

---

## 7. Known Issues & Blockers

1. **Gemini Free Tier Rate Limits**:
   - Google Generative AI Free Tier enforces rate limits. The system handles 429 errors using bounded exponential backoff with `RetryInfo` headers, token-overlap heuristics for short answer grading, and MockAiProvider fallbacks.
2. **Local Infrastructure Required for Runtime Workflows**:
   - Runtime database operations require `infra/docker/docker-compose.yml` (`pnpm infra:up`) so PostgreSQL (pgvector on port 5433) and Redis (port 6379) are accessible.

---

## 8. Next Recommended Action

**Phase 3: Active Recall Flashcards & Spaced Repetition**:
- Implement SM-2 algorithm scheduler, flashcard generation processor from document sections, interactive flipping deck study interface, and retention metrics.

---

## 9. Update History

- **2026-11-02**:
  - Completed Remove Decorative Eyebrow Labels Above Page Headings:
    - Inspected all user-facing views across the application for decorative eyebrow labels, badges, or uppercase captions positioned immediately above primary page headings.
    - Removed decorative eyebrow badges across all 8 identified views (`/dashboard`, `/dashboard/progress`, `/dashboard/practice`, `/dashboard/library`, `/dashboard/courses`, `/dashboard/groups`, `/dashboard/settings`, and `/dashboard/practice/quizzes/[quizId]` generation state).
    - Preserved all functional badges and indicators: difficulty badges (`{quiz.difficulty} Level`), chapter indicators, passing/mastery status pills (`Assessment Mastered` / `Needs Reinforcement`), processing status, card metadata tags, form labels, and citation indicators.
    - Preserved natural editorial vertical rhythm: headings start directly at the top of each header container with descriptions positioned immediately beneath (`mt-1`).
    - Verified that `/` (marketing homepage), `/login`, and `/register` natively start with clean `<h1>` headings.
    - Verified 100% pass on `pnpm type-check` (11/11 tasks passing) and `pnpm build` (7/7 package builds successful, 15/15 Next.js static/dynamic routes cleanly generated). Clean port audit confirmed with zero orphan processes.
  - Completed Phase 2: Chapter-Grounded Quizzes & Active Recall Assessments:
    - Added additive schema fields and migration `20261102143707_add_quiz_generation_and_grading_fields`.
    - Created `@lernivox/ai-core` quiz generation and grading primitives with MockAiProvider and live Gemini support.
    - Implemented BullMQ `QuizGenerationProcessor` in `@lernivox/worker` with concurrency and idempotency.
    - Implemented `QuizzesModule` in `apps/api` with anti-tamper question delivery, attempt tracking, and multi-format grading.
    - Built BrightPath `GenerateQuizModal`, updated Practice Center (`/dashboard/practice`) with live quizzes and polling, and built dedicated taking/results interface (`/dashboard/practice/quizzes/[quizId]`).
    - Integrated contextual "Practice" trigger in Study Space (`/dashboard/tutor`).
    - Verified 100% pass on `pnpm type-check` (11/11), `pnpm test` (120/120), and `pnpm build` (7/7). Clean port audit confirmed.
  - Completed Phase 0 & Phase 1 — Information Architecture Reconciliation & Application IA Foundation:
    - Implemented shared authenticated application shell `apps/web/app/(workspace)/layout.tsx` supporting Application Mode and Focused Study Mode (`/dashboard/tutor`).
    - Separated My Learning (`/dashboard`) from Study Library (`/dashboard/library`).
    - Built redesigned My Learning student home (`/dashboard`) with all 8 blueprint sections.
    - Built Library page with physical book cards, search, file type filters, and sorting.
    - Built foundational destination screens: Courses (`/dashboard/courses`), Practice Center (`/dashboard/practice`), Study Groups (`/dashboard/groups`), Progress (`/dashboard/progress`), and Profile & Settings (`/dashboard/settings`).
    - Updated `ProfileMenu.tsx` and `TutorHeader.tsx` navigation links.
    - Verified 100% pass on `pnpm type-check` (11/11), `pnpm test` (104/104), and `pnpm build` (15/15 Next.js routes). Port hygiene maintained.
  - Completed Complete Implementation, Functionality & Technical Health Audit:
    - Conducted exhaustive code, architectural, and data audit across the entire Lernivox monorepo.
    - Verified all 15 audit dimensions without modifying database records or consuming external AI quota.
    - Verified automated suites: `pnpm type-check` (11/11 passing), `pnpm test` (104/104 passing), and `pnpm build` (7/7 passing).
  - Completed Viewport Displacement & Route Transition Scroll Restoration Fix:
    - Resolved the issue shown in Screenshot 29 where returning from `/dashboard/tutor` to `/dashboard` left the navbar shifted down with an empty top void.
    - Diagnosed the console warning `Skipping auto-scroll behavior due to 'position: sticky' or 'position: fixed' on element`: Next.js App Router skipped scrolling to top on navigation because `tutor/page.tsx` used `fixed inset-0` and mutated `document.body.style.position = 'fixed'`.
    - Replaced `fixed inset-0` with `h-[100dvh] max-h-[100dvh] w-full flex flex-col overflow-hidden overscroll-none select-none` and switched to a non-invasive scroll listener with `window.scrollTo({ top: 0, left: 0, behavior: 'instant' })` on mount and unmount.
    - Added an instant scroll-to-top effect on `/dashboard` mount.
    - Removed `scroll-smooth` and `overflow-x-clip` from `RootLayout` (`<html>` and `<body>`), restoring native `position: sticky` behavior to headers in Chromium.
    - Verified with `pnpm type-check` (11/11 passing), `pnpm test` (104/104 passing), and `pnpm build` (7/7 passing, 9/9 Next.js static routes).
  - Completed Viewport Displacement & Layout Shifting Elimination:
    - Fixed root window-level scrolling (`window.scrollY > 0`) that created 150px–280px empty gaps and displaced the top navigation bar when opening books or navigating in `/dashboard/tutor`.
    - Created `apps/web/lib/scroll-utils.ts` and replaced all instances of `element.scrollIntoView()` with container-scoped `.scrollTo()`.
    - Updated `textareaRef.current?.focus({ preventScroll: true })` in `CopilotSidecar.tsx` to stop focus-induced window panning.
    - Verified with `pnpm type-check` (11/11 passing), `pnpm test` (104/104 passing), and `pnpm build` (7/7 passing, 9/9 Next.js static routes).
  - Completed Mobile 2-Column Bookshelf Responsive Hardening (320px–480px):
    - Resolved 320px viewport layout blowout on `/dashboard` bookshelf where two-column book cards collided and overlapped centrally.
    - Enforced fluid mathematics for narrow 320px screens: container padding `px-3 sm:px-6 lg:px-8 min-w-0` leaving 296px available width; `gap-2.5 sm:gap-4 md:gap-6` yielding 143px column tracks.
    - Removed `justify-items: center` and applied `w-full min-w-0 max-w-full` on `BookCard.tsx`.
    - Eliminated horizontal drop shadows on mobile (`shadow-[0_3px_0_0_#1B3428]`), preventing cross-column shadow collision.
    - Implemented fluid cover ratio (`aspect-[3/4.2]`), line-clamped typography (`line-clamp-3 text-[11px] sm:text-sm`), and constrained badges.
    - Hardened action button row with `min-w-0 flex-1 truncate` on `[Open & Study]`, conditional `xs:block` sparkle icon, and compact `w-7 h-7 sm:w-8 sm:h-8 shrink-0` delete trigger.
    - Verified with `pnpm type-check` (11/11 passing), `pnpm test` (104/104 passing), and `pnpm build` (7/7 passing, 9/9 Next.js static routes).

- **2026-11-01 (Part 4)**:
  - Completed Critical PDF Viewer Flickering, Original Document Rendering & Outline Fix:
    - Diagnosed and resolved the root cause of PDF viewer flickering: inline callbacks in `page.tsx` invalidated the `DocumentReader` loading effect dependency array on every render, repeatedly executing cleanup (`loadingTask.destroy()`), setting `loadingPdf: true`, and resetting the viewer.
    - Implemented explicit viewer lifecycle states (`INITIALIZING` -> `FETCHING` -> `LOADED` -> `RENDERING_PAGE` -> `READY` / `ERROR`) and guarded `pdfDoc` with `loadedDocIdRef` so ordinary UI interactions (sidebar toggles, zoom, page navigation, AI sidecar toggles, conversation switches) never reload the document.
    - Kept canvas container mounted once loaded; page switches display a subtle in-place overlay spinner instead of unmounting or flashing the full-screen loading placeholder.
    - Verified ground truth of original uploaded textbook binary: magic bytes `%PDF-1.5`, size `3,313,546` bytes, SHA-256 `f6b4313758ce6994103cfce7b791974e18f49e7f77fa3fcf4b8c466276b30141`, streamed via `GET /api/v1/documents/:id/file` with byte-range HTTP 206 support.
    - Implemented deterministic outline extraction primitives in `@lernivox/ai-core` for PDF trees, DOCX headings, and plain text with zero AI quota consumption.
    - Updated `DocumentOutlinePane` with explicit labels (`Embedded Outline` vs `Detected headings`) and honest empty state (`No document outline available`).
    - Verified monorepo with 11/11 type-checks, 104/104 tests passing, and 7/7 production build tasks.
  - Completed Dashboard, Library & Document Reader UX Refinement:
    - Simplified dashboard UI: removed obsolete badges, reduced vertical padding, and unified upload buttons to single `+ Add Study Material`.
    - Transformed 3D book cards into clickable, keyboard-navigable links with `e.stopPropagation()` on nested action buttons.
    - Updated profile menu with `Visit Homepage` link and enhanced homepage navbar with `Go to Dashboard` + compact profile menu.
    - Integrated `pdfjs-dist` in `DocumentReader` with retina canvas rendering, single authoritative page jump control, and browser PDF embed toggle.
    - Implemented Okular-like PDF document outline via `pdfDoc.getOutline()` and `pdfDoc.getPageIndex()` with zero AI token consumption.
    - Deduplicated header controls: single `Contents` toggle on left, `← Library` on right, saved sessions consolidated inside AI sidecar, and rebranded to `Lernivox AI`.
    - Implemented mutually exclusive mobile panel overlay (`activeMobilePanel`) with backdrop dismissal and Escape key support.
    - Verified full build (`pnpm build`), type safety (`pnpm type-check`), and all test suites (`pnpm test` 87/87, API 75/75).
  - Completed Document-Centric Copilot Workspace & Study Library Redesign:
    - Designed and implemented full-viewport Three-Pane Reader Workspace at `/dashboard/tutor?documentId=...`:
      - Left Pane (`DocumentOutlinePane`): deterministic Table of Contents hierarchy with active scroll-spy chapter tracking, bookmarks tab with persistence and navigation, validated page jump, desktop 48px rail collapse, and mobile slide-over drawer.
      - Center Pane (`DocumentReader`): typeset serif reading canvas, folio numbers, inline citation auto-scrolling and highlighting (`#FBE8DC` with fade), zoom controls, embedded PDF streaming toggle (`/api/v1/documents/:id/file`), and "Explain this paragraph" contextual selection.
      - Right Pane (`CopilotSidecar`): 380–420px docked AI Copilot sidecar, structured pedagogical response renderer, inline citation navigation pills (`[S1]`, `[S2]`) directly controlling reader scroll/highlight, integrated saved session switcher, and collapsible floating bottom-right tactile button ("Ask Copilot ✨").
      - Header (`TutorHeader`): full-width reader navigation with Library back-link, document identity, format badge, page indicator, ready status pill, New Session, and ProfileMenu.
    - Redesigned Study Library (`/dashboard`):
      - Replaced generic flat cards with a physical 3D bookshelf (`BookCard`) featuring spine crease, layered page edges, tactile drop shadows, cover palette derived from document ID, format badge, page count, and direct "Open & Study" / "Inspect Notes" / "Delete" actions.
      - Aligned dashboard navbar and canvas with the marketing homepage container (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`).
      - Created `ProfileMenu`: compact avatar trigger with accessible dropdown displaying initials, user display name, email mono pill, tier, and tactile Sign Out.
      - Enforced mandatory logout behavior: server-side session revocation, client auth state purge, and redirect strictly to `/` (public homepage).
    - Database & Backend:
      - Added `DocumentReadingProgress` and `DocumentBookmark` models via additive migration `20261101163000_add_reading_progress_and_bookmarks` (zero table drops, zero data loss, all 1,417 chunks and embeddings intact).
      - Added byte-range streaming endpoint `GET /api/v1/documents/:id/file` (`HTTP 206 Partial Content`, `Content-Range`) with strict ownership validation.
      - Added deterministic Table of Contents parser `GET /api/v1/documents/:id/outline` extracting all 25 chapters and page offsets from introductory chunks with zero Gemini token spend.
      - Added endpoints for reading progress (`GET`, `PUT`) and bookmarks (`GET`, `POST`, `DELETE`).
    - Verified strict typing (`pnpm type-check` 11/11), all unit and integration tests (`pnpm test` 87/87), and production builds (`pnpm build` 7/7, Next.js 9/9 static routes).
  - Completed Phase 5: Complete AI Tutor & Source-Grounded Learning Engine:
    - Implemented additive migration `20261101150000_add_conversation_document_and_message_metadata` adding `documentId` to `conversations` and `metadata` to `conversation_messages`.
    - Preserved all 1,417 chunks and 768-D embeddings of Document `1d80138a` with zero re-embedding and zero database resets.
    - Implemented `packages/ai-core` prompt builder (`buildTutorPrompt`), citation validator (`validateAndMapCitations`), response parser (`parseTutorResponse`), and Gemini 429 backoff retry loop.
    - Created `packages/contracts/src/tutor.ts` with shared interfaces for conversations, messages, citations, and chunk details.
    - Implemented NestJS `TutorModule` with `RetrievalService` (pgvector cosine similarity search), `TutorService`, and `TutorController` with full authentication and ownership enforcement.
    - Built tactile Next.js study workspace at `apps/web/app/(workspace)/dashboard/tutor/page.tsx` with conversation sidebar, message stream, interactive citation pills, and slide-over source passage verification drawer.
    - Integrated "Ask AI / Study" entry point into the student dashboard.
    - Verified all 11/11 type-checks, 87/87 automated tests, and 7/7 monorepo production builds.
  - Resolved Gemini Embedding 404 via `gemini-embedding-001` / `gemini-embedding-2` / `gemini-embedding-2-preview` (768-D):
    - Replaced deprecated/unavailable `text-embedding-004` default with active models supporting MRL truncation (`outputDimensionality: 768`).
    - Added `dns.setDefaultResultOrder('ipv4first')` and `AbortSignal.timeout(30000)` to eliminate IPv6 network timeouts and connection hangs.
    - Implemented exponential/RetryInfo rate-limit backoff (`maxRetries = 40`) and daily quota exhaustion detection.
    - Added idempotent chunk resume logic in `document-ingestion.processor.ts` to allow long documents to resume across runs.
    - Completed full ingestion: all 1,417/1,417 chunks embedded with `dimension = 768` in PostgreSQL `chunk_embeddings`. Document `1d80138a` status: `READY` (pageCount: 461, totalTokens: 342,290).
    - Passed all compiler checks (`pnpm type-check` 11/11), worker tests (`pnpm --filter @lernivox/worker test` 3/3), and monorepo test suite (`pnpm test` 67/67).

- **2026-11-01**:
  - Completed Gemini Embedding 404 Error Audit & Diagnostic:
    - Traced embedding invocation to `apps/worker/src/processors/document-ingestion.processor.ts:153` calling `GeminiProvider.generateEmbeddings` in `packages/ai-core/src/providers/gemini.provider.ts:86-98`.
    - Executed live `curl` against `v1beta/models/text-embedding-004:embedContent` reproducing 404 `NOT_FOUND`.
    - Queried `v1beta/models` and verified `text-embedding-004` is absent from the account/key; identified supported alternatives: `gemini-embedding-001` and `gemini-embedding-2`.
    - Validated that `gemini-embedding-001` and `gemini-embedding-2` successfully return 768 dimensions when passed `"outputDimensionality": 768`.
    - Documented root cause and actionable fix proposal.
  - Completed Complete Dashboard UI/UX Redesign & Brand Parity:
    - Redesigned `apps/web/app/(workspace)/dashboard/page.tsx` to match the Lernivox landing page tactile brand language (`#F4F0E5` canvas, `#FAF8F4` card surface, deep forest `#1B3428` borders and 3D offset shadows).
    - Replaced generic header with tactile Framer header: orange book icon, bold wordmark, removed `"Student Workspace"` tag, and styled user profile initials avatar and tactile pill Sign Out button.
    - Created editorial hero section with tilted accent word (`library.`), hand-drawn orange marker doodle SVG, and tactile 3D action buttons.
    - Transformed document cards into tactile course cards (`border-[2px] border-[#1B3428]`, `shadow-[0_4px_0_0_#1B3428]`, rounded `[24px]`).
    - Completely replaced coder tags and raw `GEMINI_API_KEY` errors with student-friendly reconnection notice and retry actions.
    - Redesigned upload and notes inspection modals with tactile styling.
    - Verified all typechecks (`pnpm type-check` 11/11), tests (`pnpm test` 67/67), and Next.js production build (`next build` 8/8 routes).
  - Completed Fix Dual Active Navigation State & Harden Scroll-Spy Engine:
    - Confirmed DOM ground-truth: `id="how-it-works"` is uniquely on Section 2 (`HeroUpload.tsx:150`) and `id="readiness"` is uniquely on Section 5 (`page.tsx:436`). Zero nested or duplicate IDs found.
    - Set `activeSection` to single string primitive `'how-it-works'` in `apps/web/components/marketing/Navbar.tsx`.
    - Replaced `IntersectionObserver` with calibrated "Single Topmost Winner" scroll spy (`window.scrollY + 140` vs. section `offsetTop`).
    - Enforced strict single-match equality check (`const isActive = activeSection === targetId`) and active `font-bold` styling across desktop and mobile navigation loops.
    - Verified all typechecks (`pnpm type-check` 11/11), tests (`pnpm test` 67/67), and Next.js production build (`next build` 8/8 routes).
  - Completed Mobile Menu Layout Realignment & Bi-Directional Animation Engine:
    - Fixed vertical layout drift by removing `my-auto` and anchoring the link stack directly below the top header with `mt-6 w-full` and row border dividers (`border-b border-[#1B3428]/10`).
    - Implemented bi-directional smooth animation engine via permanent DOM mounting with CSS transition states (`duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]`, `opacity-0 -translate-y-4 invisible` to `opacity-100 translate-y-0 visible`).
    - Docked bottom actions via `mt-auto pt-8 border-t border-[#1B3428]/10 shrink-0`.
    - Passed all compiler checks (`pnpm type-check` 11/11), tests (`pnpm test` 67/67), and production build (`next build` 8/8 routes).
  - Completed Mobile Menu Scroll-Lock, Header Pinning & Auth Link Prominence:
    - Implemented body scroll-lock and gesture drag containment (`overflow: hidden`, `touchAction: none`) on mobile menu open.
    - Pinned full-viewport drawer (`fixed inset-0 z-50 w-full h-[100dvh] bg-[#FAF8F4]`) with a permanent top header row containing Brand Logo and Close (`✕`) button.
    - Covered underlying hero text with 100% solid cream background to eliminate ghosting text bleed.
    - Removed status pill badge (`Verified Grounding Engine • Ready`) and restyled the auth link into a prominent, high-contrast action with bold terracotta underline.
    - Passed all compiler checks (`pnpm type-check` 11/11), tests (`pnpm test` 67/67), and production build (`next build` 8/8 routes).
  - Completed Auth Layout Centering & Right Showcase Decluttering:
    - Perfectly centered left-column auth forms vertically and horizontally (`items-center justify-center`) inside a unified `w-full max-w-[420px]` stack across `/login` and `/register`.
    - Detached "Back to homepage" link to absolute positioning (`absolute top-6 sm:top-8 left-6 sm:left-8`), eliminating vertical skew.
    - Decluttered right column showcase (`AuthShowcase.tsx`) by removing top metadata pills and bottom carousel dots, focusing cleanly on the student photo cutout arch and value proposition lockup with balanced gap spacing.
    - Verified strict typing (`pnpm type-check` 11/11), static build (`next build` 8/8 routes), and tests (`pnpm test` 67/67).

- **2026-10-28**:
  - Completed Phase 0 (Agent Instructions & Progress Tracking).
  - Completed Phase 1 (Monorepo Foundation).
  - Established `pnpm workspaces` and `Turborepo` monorepo structure.
  - Authored comprehensive architecture documentation and ADRs.
- **2026-10-29**:
  - Completed Repository Cleanup, Rename Audit, and Git Hygiene.
  - Completed Phase 2: Domain Data Model, Prisma migrations, pgvector vector helper utility, seeder, and 10/10 database tests.
  - Completed Phase 3: Complete Authentication Feature (End to End).
  - Completed Phase 4: Redesigned Homepage and End-to-End Document Upload.
- **2026-10-31**:
  - Completed Hero Section Layout Fix: Headline Underline Clearance & Full-Bleed Ribbon Bleed.
  - Completed Hero Section Polish: Headline Color Split, Clockwise Word Decline, Compact Body Copy & Showcase Elevation.
  - Completed Hero Headline Elevated "u" Anchor & Multi-Stroke Hand-Drawn Marker Underline Refactor.
  - Completed Hero Headline Vertical Clearance & Breathing Room Adjustment.
  - Completed Pixel-Perfect Reference Cloud Divider Refactor & Section Shaking Root Cause Resolution.
  - Completed Unified Compound `#features` Section (Interactive Lesson Preview & Academic Retention Engine).
  - Completed Section 3 & 4 Asymmetric Split Layout & Single-Word Hero Accent Refactor.
  - Completed Section 4 Fan-Spread Card Tilts, Spacing Wedges, Tactile 3D Badges & Height Alignment Refactor.
  - Completed Section 5 & 6 Student-Friendly Copy, Readiness Tracker & Study Groups Refactor.
  - Completed Section 7 Pricing Refactor.
  - Completed Navbar Anchor Scroll Landing Position & Section Background Bleed Fix.
  - Completed Section 8 FAQ Section Refactor.
  - Completed Pixel-Accurate FAQ Transition and Final CTA Redesign.
  - Completed Reference-Inspired Editorial Footer Recreation for Lernivox.
  - Completed Comprehensive Mobile Responsiveness & Viewport Hardening (320px–480px).
  - Completed Pixel-Accurate Footer Refinement & Cloud Canopy Integration.
  - Completed Global Editorial Scroll-Reveal Animation Engine.
  - Completed Route-Transition Animation Persistence.
  - Completed Mobile Anchor Alignment, Smooth Hamburger Drawer & Two-Sided Auth Pages.
  - Completed Humanize & Rebuild Authentication Showcase (Right Column):
    - Replaced technical calculus wireframe with real student photography cutout (`/images/student-reading.png` / `/assets/cta_student_male_right.png`) sitting over an organic peach arch backdrop (`#FBE8DC`, `rounded-t-[160px] rounded-b-[40px]`).
    - Added floating tactile testimonial card (`Verified Student` badge in `#E2EBD8`, 5 gold amber stars in `#F59E0B`, `"Lernivox explained my hardest course topics in 10 minutes when the textbook made no sense."`, attributed to `— Biology Major, 2nd Year` with 3D tactile border and `-2deg` tilt).
    - Added humanized copy: `"Study with clarity, not confusion."` with subtitle `"Turn heavy textbooks, tangled lecture slides, and weekly syllabi into plain-English explanations and practice quizzes you can trust."` and 3-pill carousel indicator.
    - Verified identical display across `/login` and `/register` with full mobile responsiveness (hidden `< 1024px`, 50/50 split `≥ 1024px`), leaving left authentication forms completely untouched.
    - Passed all compiler checks (`pnpm type-check` 11/11), tests (`pnpm test` 67/67), and static build (`next build` 8/8 routes).
- **2026-11-02**:
  - Completed Tri-Pane Mobile Drawer Architecture, Continuous PDF Scroll & UI Polish:
    - Fixed duplicate plus glyph on `/dashboard` primary action button and empty state button (`Add Study Material`).
    - Removed redundant desktop collapse icon button inside TOC sidebar header next to `Marks (0)`.
    - Hardened AI Chat message composer contrast (`placeholder:text-[#14261D]/60`, `text-[#14261D]/75 font-medium`, `border-[1.5px] border-[#E8722C]`).
    - Converted PDF viewer from single-page pagination stepper to continuous vertical scroll stream with lazy `IntersectionObserver` canvas rendering (1000px root margin) across all 461 pages, eliminating horizontal dead margins and fitting 100% container width.
    - Implemented mutually exclusive mobile slide-over overlay drawer state machine (`mobileDrawer: 'none' | 'toc' | 'chat'`) and strictly hidden desktop sidebars (`hidden lg:flex`), preventing PDF crushed width and duplicate sidebars on mobile viewports.
    - Verified with `pnpm type-check` (11/11 passing), `pnpm test` (104/104 passing), and `pnpm build` (7/7 passing).
  - Completed Dashboard Simplification, Mobile Header De-duplication, PDF Text Selection & RAG Chat 500 Fix:
    - Pushed "Your study Library" comfortably down from the dashboard navbar with responsive vertical clearance (`pt-10 pb-14 sm:pt-16 md:pt-20 lg:pt-24 sm:pb-20`).
    - Retired developer chunks/passages inspection modal and card button from `/dashboard` and `BookCard.tsx`.
    - Removed redundant mobile secondary navigation pills (Row 2 `[Contents]` and `[Lernivox AI]`) from `/dashboard/tutor/page.tsx`, consolidating reader actions in `TutorHeader.tsx`.
    - Integrated native PDF text selection, highlighting, and copying via PDF.js `TextLayer` and `.textLayer` CSS styling in `apps/web/styles/globals.css`.
    - Resolved AI Tutor chat HTTP 500 failures by setting `gemini-3.5-flash` in `GeminiProvider` and `TutorModule`, validating `gemini-embedding-001` (768-D MRL truncation) against live endpoints, and wrapping semantic chunk retrieval in `tutor.service.ts` with graceful fallback.
  - Completed Major Product Transformation: Transition to Book-Centered Workspaces (Phase 0 & Phase 1):
    - Redesigned core product domain around `Document/Material <-> 1:1 Workspace` model, defining `PERSONAL` and `GROUP` workspace types and enforcing irreversible `PERSONAL` -> `GROUP` conversion rule at service layer.
    - Idempotently backfilled all 3 existing ready documents in active PostgreSQL into 1:1 `PERSONAL` workspaces with owner memberships and linked conversations. Zero chunks, embeddings, conversations, or reading progress lost; zero re-ingestion or re-embedding required.
    - Implemented centralized backend authorization policy (`verifyDocumentAccess`) in `WorkspacesModule` ensuring workspace owners and members can access document binaries, outlines, chunks, and citations, while deletions remain restricted to the owner.
    - Transformed `/dashboard` into clean book-centered library with "My Books" and "Shared with Me" collections, persistent reading progress indicators, and `+ Add Material` flow supporting initial workspace type selection.
    - Implemented canonical workspace route `/dashboard/workspaces/[workspaceId]`, preserving the 3-pane study layout (outline, PDF reader, and AI tutor sidecar).
    - Built compatibility redirect adapter on `/dashboard/tutor?documentId=...` and safely retired obsolete routes (`/dashboard/library`, `/dashboard/courses`, `/dashboard/practice`, `/dashboard/groups`, `/dashboard/progress`) to `/dashboard`.
    - Fully verified with `pnpm type-check` (11/11 passing), `pnpm test` (all passing across API, database, and AI-core), and `pnpm build` (7/7 passing with all static/dynamic routes generated).

