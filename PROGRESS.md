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
| **Backend API Application** | NestJS 11 modular REST API with Swagger OpenAPI documentation in `apps/api`. Full Auth, Documents, Quizzes, Flashcards, Tutor, Workspaces, and Learning Plans modules. | [`apps/api/`](./apps/api/) | All 171 tests passing; `WorkerWakeService` asynchronous wake triggers on job enqueue; throttled wake on status poll; `0.0.0.0:${PORT}` binding for Render Free Web Services. |
| **Background Worker** | Standalone NestJS worker application with BullMQ processor and native HTTP control server in `apps/worker`. | [`apps/worker/`](./apps/worker/) | Real PDF (`pdf-parse`), DOCX (`mammoth`), and TXT extraction, semantic chunking (`@lernivox/ai-core`), pgvector embedding persistence, status lifecycle. Native HTTP server on `0.0.0.0:${PORT}` serving `GET /healthz`, `GET /readyz`, and `POST /internal/wake`. All 21 unit tests passing. |
| **Database & Vector Package** | PostgreSQL 16 + pgvector schema and Prisma ORM 7.x client in `packages/database`. | [`packages/database/`](./packages/database/), [`docs/architecture/data-model.md`](./docs/architecture/data-model.md) | Domain migration applied, pgvector helpers in `src/vector.ts`, deterministic seeder `src/seed.ts`, 10/10 integration tests passing. |
| **AI Orchestration Package** | Provider-agnostic AI interfaces, text chunker, Gemini REST adapter, and MockAiProvider in `packages/ai-core`. | [`packages/ai-core/`](./packages/ai-core/) | Strict typing, sliding window chunking with semantic overlap, 768-dim vector verification. |
| **Storage Abstraction Package** | Universal `StorageService` contract with Local and Cloudinary adapters in `packages/storage`. | [`packages/storage/`](./packages/storage/) | Provider-agnostic file persistence layer, shared across API and worker. |
| **Shared Contracts Package** | DTOs, queue names, and job payload interfaces in `packages/contracts`. | [`packages/contracts/`](./packages/contracts/) | Shared typing across web, api, and worker applications. |
| **Local Infrastructure** | Isolated Docker Compose setup for PostgreSQL 16 (`pgvector`) and Redis 7 in `infra/docker/`. | [`infra/docker/docker-compose.yml`](./infra/docker/docker-compose.yml) | Controlled via `pnpm infra:up` and `pnpm infra:down`. |
| **Git Hygiene & Ignore Rules** | Reinforced `.gitignore` protecting secrets, dependencies, build artifacts, and local uploads. | [`.gitignore`](./.gitignore), [`.env.example`](./.env.example) | Zero uncommitted tracked files deleted; zero secrets committed. |

---

#### 3. Current Phase

### **Phase 3: Workspace Learning Experience — Quizzes, Flashcards, Individual Progress and Book-Range Selection**
- **Status**: **Complete**
- **Outcome**: Successfully implemented the full Phase 3 learning experience anchored to book workspaces (`Book → Persistent Workspace → Learning`):
  1. **Chapter- and Range-Grounded Quizzes**: Built `BookRangeSelector` with fallback hierarchy (Document TOC Outline -> Detected Section Headings -> Page Range -> Chunk Range) allowing students to select "Entire Material" or custom "From" and "To" inclusive boundaries. Backend validates range, bounds chunk retrieval strictly to selected scope, and permanently records scope on `Quiz.rangeScope`. Built dedicated in-workspace assessment interface (`WorkspaceQuizRunner`) supporting 4 question types (Multiple Choice, Short Answer, Fill in the Blank, True/False) with deterministic objective grading and semantic structured AI evaluation, retry mechanisms, explanations, and source citations.
  2. **Failed-Question & Attempt History**: Saved independent attempts (`QuizAttempt`, `QuizAttemptAnswer`) per user and workspace. Added failed-questions review history isolated per student.
  3. **Flashcards & SM-2 Spaced Repetition**: Built grounded flashcard generation (`generateFlashcards` in `@lernivox/ai-core` and BullMQ processor in `@lernivox/worker`) and deck management. Built dedicated distraction-free review runner (`FlashcardStudyRunner`) with 3D tactile card flip, keyboard shortcuts, and true SM-2 spaced repetition (`1`: Again, `2`: Hard, `3`: Good, `4`: Easy; calculating `easeFactor`, `intervalDays`, `repetition`, `nextReviewAt`).
  4. **Multi-User Privacy in Group Workspaces**: Quizzes and flashcard decks are accessible to workspace members, but quiz attempts, failed questions, flashcard reviews, and progress metrics are strictly private per user.
  5. **Individual Workspace Learning Progress**: Purely derived from persisted learning data (zero fabricated scores): reading progress, assessment metrics, flashcard retention rate, and a topic understanding matrix (`NOT_STARTED`, `LEARNING`, `NEEDS_REVIEW`, `CONFIDENT`).
  6. **Workspace UI Integration**: Top navigation tabs (`Read` | `Quizzes` | `Flashcards` | `My Progress`) in `/dashboard/workspaces/[workspaceId]`, contextual "Practice this chapter" in outline pane, and "Practice this part" in PDF selection menu while preserving reading positions and private AI chat.

---

## 4. Architecture Decisions

### Confirmed Decisions
- [x] **Product Paradigm**: **Book-Centered Personal & Collaborative Workspaces**. One uploaded document/material has one persistent workspace (`Document <-> 1:1 Workspace`).
- [x] **Workspace Types**: `PERSONAL` (single learner, private AI tutor, personal notes & progress) and `GROUP` (collaborative learning around shared material, shared outline/reader, private AI conversations per member, role permissions).
- [x] **One-Way Workspace Conversion Rule**: A `PERSONAL` workspace can be converted into a `GROUP` workspace by its owner; a `GROUP` workspace can **never** be converted back into a `PERSONAL` workspace. Enforced at domain/service layer AND via PostgreSQL trigger `trigger_prevent_group_workspace_downgrade`.
- [x] **Authorization & Isolation Policy**: Centralized in `WorkspacesService.verifyDocumentAccess(userId, documentId)`. Access granted if user is workspace owner or active workspace member. Deletions restricted strictly to workspace owner. Individual progress and private AI chats remain strictly user-isolated.
- [x] **Invitations Security Model**: Cryptographically random 32-byte hex tokens, stored as SHA-256 hashes in database (`WorkspaceInvitation.tokenHash`), 7-day default expiration, revocable by workspace owner, public resolution endpoint `/api/v1/invitations/:token` with safe metadata.
- [x] **Dual Chat Architecture**: Group Workspaces feature two strictly separate conversation systems:
  1. *People <-> People Group Discussion*: Workspace-scoped shared message stream anchored to book chapter/page numbers.
  2. *Person <-> AI Private Tutor*: User-scoped, confidential tutoring with verified source grounding.
- [x] **Conversation Sharing Model**: Sharing an individual AI conversation creates an immutable static snapshot (`SharedConversationSnapshot`) visible to workspace members. Original private conversation continues independently.
- [x] **Book-Range Selection & Bounding**: Students can choose "Entire Material" or a custom inclusive range ("From" to "To"). The hierarchy resolves against: 1. Native PDF bookmarks/outline, 2. Extracted section headings, 3. Page range (`startPage` to `endPage`), 4. Chunk indices for text-only material. Range scope is validated on API, enforced during chunk retrieval in worker, and permanently persisted on `Quiz.rangeScope` and `FlashcardDeck.sourceRange`.
- [x] **In-Workspace Assessment Interface**: Quizzes run in dedicated full-screen workspace view rather than cramped chat sidecars. Multi-question stepper, instant deterministic objective grading, semantic AI evaluation for short answers, explanatory feedback, citations, retry flow, and failed questions review.
- [x] **SM-2 Spaced Repetition**: Standard SuperMemo SM-2 algorithm implemented with numeric ratings: `1` (Again: reset interval to 1 day), `2` (Hard: 1 day, reduced ease), `3` (Good: standard progression 6 days), `4` (Easy: 10 days, increased ease). Tracked per-user and per-card via `UserFlashcardReview`.
- [x] **Multi-User Group Learning Privacy**: In `GROUP` workspaces, quizzes and flashcard decks are shared learning resources, but `QuizAttempt`, `QuizAttemptAnswer`, and `UserFlashcardReview` records are strictly private to `userId`. Progress endpoints only aggregate the calling student's records.
- [x] **Objective Learning Progress**: Zero fabricated scores or arbitrary mastery percentages. Reading progress strictly from `DocumentReadingProgress`, assessment stats strictly from actual `QuizAttempt` scores, flashcard metrics strictly from `UserFlashcardReview` ratings, and topic understanding strictly classified (`NOT_STARTED`, `LEARNING`, `NEEDS_REVIEW`, `CONFIDENT`) based on demonstrated quiz accuracy and card retention.
- [x] **Visual Design Direction**: Guided by the [BrightPath](https://brightpath-wbs.framer.website/) Framer aesthetic (warm cream `#f4f0e5`, elevated surfaces `#faf7f3` / `#ffffff`, borders `#eae4d3`, deep forest `#14261d`, terracotta `#e8722c`, soft peach `#f9d8c0`, typography: Bricolage Grotesque display, Instrument Sans body).

---

## 5. Implementation Roadmap

| Phase | Description | Status | Verification Criteria |
|:---:|---|:---:|---|
| **Phase 0** | **Reconciliation & Migration Planning** | **Complete** | Audit of active database, 3 ready documents, 1,429 chunks/embeddings, schema migration strategy, and data preservation plan. |
| **Phase 1** | **Book-Centered Core Foundation** | **Complete** | 1:1 Workspace domain model, idempotent backfill, access control, one-way conversion invariant, "My Books" launcher, canonical `/dashboard/workspaces/[workspaceId]` route, compatibility redirects, 100% data preservation verified. |
| **Phase 2** | **Personal-to-Group Conversion and Collaboration** | **Complete** | Convert Personal to Group UI, invitations, membership management, group roles, shared group discussions, private conversation sharing. |
| **Phase 3** | **Workspace Learning Experience** | **Complete** | Chapter- and range-grounded quizzes, attempts & failed question history, flashcard generation & SM-2 review, individual progress tracking, BrightPath workspace UI integration. |
| **Phase 4** | **Optional AI Learning Plans & Production Hardening** | **Complete** | Structured, grounded study plans, contextual tutor offer in chat, session stepper & activity tracking, evidence-based schedule adaptation, pause/resume lifecycle, 100% student privacy, OWASP ASVS 5.0 security hardening, bundle optimization (101 kB shared JS), and complete production readiness runbooks. |

---

## 6. Current Task Record

- **Task**: Fix Worker Wake-Up Failures, Ensure End-to-End Document Ingestion, and Redesign My Books Dashboard into Modern Digital Bookshelf
- **Status**: **Complete**
- **Objective**:
  1. *Worker Wake-Up Reliability & Document Ingestion Pipeline*:
     - Diagnosed root cause of `HTTP 429 Too Many Requests` when API triggers `POST /internal/wake` to Render Worker: Render shared outbound IP/Cloudflare edge throttling rapid inter-service calls.
     - Investigated uploaded document `37d136d9-3e1f-41b3-adce-6b353931e348`: confirmed document was queued into Upstash Redis (Job ID 1), worker was asleep when 429 was returned, and document was deleted by user before worker woke up.
     - Implemented dual-path health fallback in `WorkerWakeService`: if wake POST returns 429 or times out, it probes `GET /healthz`. If worker is already awake and connected to BullMQ, wake succeeds immediately.
     - Supported HEAD alongside GET on `/healthz` and `/readyz` in `WorkerHttpService` so edge health checks succeed with 200.
     - Added idempotent 200 response on `/internal/wake` when worker is already ready.
     - Added dynamic `REDIS_URL` parsing in `WorkerHealthService` so `readyz` reflects real Upstash host/port.
     - Added BullMQ cleanup on document deletion in `DocumentsService` to remove queued ingestion jobs for deleted documents.
  2. *Modern Bookshelf Dashboard UI/UX Redesign*:
     - Aligned authenticated navbar in `apps/web/app/(workspace)/layout.tsx` to marketing navbar: `max-w-[1380px]`, `px-4 sm:px-6 md:px-10`, `h-16 md:h-20`, `bg-[#F4EFE4]/95 backdrop-blur-sm`, `border-b-[1.5px] border-[#1B3428]/10`.
     - Built unified search and filters toolbar in `apps/web/app/(workspace)/dashboard/page.tsx`: single parchment bar (`bg-[#FAF8F4] border border-[#1B3428]/10`), clean white search input (`bg-[#FFFFFF] border-[#1B3428]/15 rounded-xl`), placeholder "Search your books...", clear button, and format pills (`All Materials`, `PDF`, `DOCX`, `TXT`).
     - Transformed document cards into physical 1:1.45 digital books in `BookCard.tsx`: real book proportions (`aspect-[1/1.45]`), left spine crease (`w-3 sm:w-4 bg-gradient-to-r from-black/35 via-black/15 to-transparent`), right page-edge bevel (`border-r-[4px] border-r-[#FAF8F4]/80 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.2)]`), bound corners (`rounded-l-xs rounded-r-xl`), and natural serif title wrapping.
     - Added subtle bookshelf grounding line beneath book rows (`after:h-[6px] after:bg-gradient-to-b after:from-[#1B3428]/15 after:to-transparent after:rounded-full`).
     - Consolidated processing state: removed duplicate "Preparing" badge from inside cover, unified status area below cover (stage title, progress bar, percentage, description), and clean "Preparing Material" action button.
     - Enhanced "Shared with Me" and empty library states with friendly visual treatments and direct "Add Your First Book" button.
     - Updated `BookCardSkeleton` in `apps/web/components/ui/loading.tsx` to mirror the exact `aspect-[1/1.45]` book proportions, spine crease, and page-edge bevel.
- **Files Created/Modified**:
  - `apps/api/src/common/worker-wake/worker-wake.service.ts` (modified) — Dual-path probe fallback on 429, sanitized rate-limit headers, and active worker cool-down tracking.
  - `apps/api/src/common/worker-wake/worker-wake.service.spec.ts` (modified) — Unit tests for worker wake retry, timeout handling, and health probing.
  - `apps/api/src/documents/documents.service.ts` (modified) — BullMQ queued job cleanup on document deletion.
  - `apps/worker/src/server/worker-http.service.ts` (modified) — HEAD support on `/healthz` and `/readyz`, idempotent 200 wake responses.
  - `apps/worker/src/health/worker-health.service.ts` (modified) — Dynamic `REDIS_URL` parsing for accurate Upstash connection reporting.
  - `apps/web/app/(workspace)/layout.tsx` (modified) — Aligned navbar background, border, height, and 1380px container to homepage navbar.
  - `apps/web/app/(workspace)/dashboard/page.tsx` (modified) — Unified toolbar with white search input, bookshelf grid layout with shelf grounding, and friendly empty states.
  - `apps/web/components/workspace/BookCard.tsx` (modified) — 1:1.45 digital book geometry, spine crease, page-edge bevel, clean cover, and consolidated processing status.
  - `apps/web/components/ui/loading.tsx` (modified) — Updated `BookCardSkeleton` to match 1:1.45 book proportions and shelf layout.
  - `apps/web/test/loading-and-404-experience.test.ts` (modified) — Added test suite verifying navbar alignment, unified toolbar, 1:1.45 book geometry, and clean processing indicators.
- **Verification**:
  - `pnpm --filter @lernivox/api test`: 14 suites, 175/175 tests passed.
  - `pnpm --filter @lernivox/worker test`: 5 suites, 21/21 tests passed.
  - `pnpm --filter @lernivox/web test`: 4 suites, 42/42 tests passed.
  - `pnpm type-check`: 11/11 package tasks passed with 0 errors.
  - `pnpm build`: 7/7 package builds passed, 17/17 Next.js static and dynamic routes generated.
  - Live Neon PostgreSQL & Upstash Redis verification: confirmed user and database schema healthy, BullMQ queue connectivity active.
- **Processes and Ports**: Port audit confirmed clean via `ss -tulpn` (0 lingering background processes).
- **Known Issues / Blockers**: None.

---

## 7. Next Recommended Action

Deploy the verified changes to Render (`lernivox-api` and `lernivox-worker`) and Vercel (`lernivox-web`), then perform live smoke test of book upload and background ingestion on Render Free.

---

## 8. Update History
  - `package.json` (modified) — Updated root `"db:migrate"`.
  - `PROGRESS.md` (modified)
- **Verification**:
  - `node --test --experimental-strip-types packages/database/test/migrate.test.ts`: 3/3 tests passing.
  - `pnpm --filter @lernivox/api test`: All 175 tests passing across 14 test suites.
  - `pnpm --filter @lernivox/worker test`: All 21 tests passing across 5 test suites.
  - `pnpm --filter @lernivox/web test`: All 41 tests passing across 4 test suites.
  - `pnpm type-check`: 11/11 tasks passing with 0 TypeScript errors across all 9 packages.
  - `pnpm build`: Full monorepo build succeeded across all 7 build targets (including 17 Next.js routes).
  - Port & Process Audit: `ss -tulpn` verified clean (0 lingering processes).
- **Known Issues / Blockers**: None.
- **Next Recommended Action**: Trigger a fresh Render deploy for `lernivox-api`. The migrations will apply automatically on container start, create `public.users` and all remaining tables, verify schema, and start serving traffic cleanly.
     - Removed `Free Student Plan • Instant Setup` badge pill from marketing CTA banner.
  7. *Verification & Tests*:
     - All 36 `@lernivox/web` tests passing.
     - All 175 `@lernivox/api` tests passing (including new unit tests for ordinary email domains and duplicate account rejections).
     - All 11/11 type-check tasks passing.
     - Full monorepo production build (`pnpm build`) passing across all 7 packages and 17 Next.js static/dynamic routes.
     - Port audit verified clean (0 lingering processes).

- **Files Created/Modified**:
  - `render.yaml` — Added `preDeployCommand: pnpm db:migrate` and updated `startCommand: pnpm db:migrate && pnpm --filter @lernivox/api start`.
  - `apps/api/src/common/prisma/prisma.service.ts` — Added database schema startup check for `public.users`.
  - `apps/api/src/auth/dto/register.dto.ts` — Replaced university email example with `you@example.com`.
  - `apps/api/src/auth/dto/login.dto.ts` — Replaced university email example with `you@example.com`.
  - `apps/api/src/auth/dto/auth-response.dto.ts` — Replaced university email example with `you@example.com`.
  - `apps/api/src/auth/auth.service.spec.ts` — Added unit test verifying ordinary consumer email registration.
  - `apps/web/app/(auth)/login/page.tsx` — Simplified supporting copy, updated label to "Email address" and placeholder to `you@example.com`, set `mode="login"` on `AuthShowcase`.
  - `apps/web/app/(auth)/register/page.tsx` — Simplified supporting copy, updated label to "Email address" and placeholder to `you@example.com`, set `mode="register"` on `AuthShowcase`.
  - `apps/web/components/auth/AuthShowcase.tsx` — Added mode-aware headline/subheadline for login and register with simple, natural language.
  - `apps/web/app/(marketing)/page.tsx` — Replaced "Freemium" with "Free plan", simplified descriptions under all section headings to 1 short sentence (14–16px), removed decorative CTA pill.
  - `apps/web/components/marketing/HeroUpload.tsx` — Removed `Interactive Showcase` and `Interactive Preview` decorative tags.
  - `apps/web/components/marketing/GuidedLearningPreview.tsx` — Removed `Interactive Lesson Preview` and `Curated Demonstration` tags.
  - `apps/web/test/api-refresh.test.ts` — Added test cases for ordinary email registrations and duplicate 409 conflict handling.
  - `docs/DEPLOYMENT_GUIDE.md` — Documented automated migration execution in Render pipeline and manual local command.
  - `PROGRESS.md` — Updated task record and roadmap.

- **Verification Results**:
  - `pnpm --filter @lernivox/web test`: 36/36 tests passed (0 failed).
  - `pnpm --filter @lernivox/api test`: 175/175 tests passed (14 suites, 0 failed).
  - `pnpm type-check`: 11/11 tasks passed with 0 TypeScript errors.
  - `pnpm build`: 7/7 package builds passed, 17/17 Next.js static/dynamic routes compiled.
  - `ss -tulpn`: Clean, zero lingering background ports.

- **Next Recommended Action**:
  - Trigger a redeploy on Render or run `pnpm db:migrate` against Neon so that `public.users` and the 13 schema migrations are created in the production database, and verify end-to-end user registration on the live deployed URL.
  - `apps/web/test/api-refresh.test.ts` — Added tests for 500 propagation and clean network error messages.
  - `render.yaml` — Configured `COOKIE_SAME_SITE: none` and `COOKIE_SECURE: "true"`.
  - `docs/DEPLOYMENT_GUIDE.md` — Documented `COOKIE_SAME_SITE` and cross-origin troubleshooting.
  - `PROGRESS.md` — Updated Current Task Record and Update History.

- **Verification Results**:
  - `pnpm --filter @lernivox/api test`: 174/174 unit tests passing across 14 suites (+3 new cookie and config tests).
  - `pnpm --filter @lernivox/web test`: 34/34 tests passing across 2 suites (+2 new error handling tests).
  - `pnpm --filter @lernivox/worker test`: 21/21 tests passing across 5 suites.
  - `pnpm --filter @lernivox/ai-core test`: 25/25 tests passing across 5 suites.
  - `pnpm type-check`: 11/11 package tasks passing with 0 errors across the monorepo.
  - `pnpm build`: 7/7 build tasks succeeded cleanly across the monorepo.
  - Process & Port Hygiene: `ss -tulpn` verified zero leaked processes or lingering ports.

---

## 7. Next Recommended Action

Deploy the updated API and Web application to Render and Vercel, and verify that production database migrations have been executed (`prisma migrate deploy`).

---
  - **Cross-Site UI & API Stabilization**:
    - *Defect 1 (PDF.js Measuring Canvas)*: Added global CSS rule hiding `canvas.hiddenCanvasElement, .hiddenCanvasElement` (`display: none !important; width: 0 !important; height: 0 !important; visibility: hidden !important; pointer-events: none !important`), eliminating the rogue 300x150 black box.
    - *Defect 2 & 3 (Mobile Reader Spacing & Distraction-Free Navigation)*: In `DocumentReader.tsx`, added pointer movement threshold (>8px) to distinguish scrolling from intentional tapping; ignored clicks on interactive controls and text selections; reduced mobile reader padding from `py-6 px-2` to `py-2 px-1`. In `page.tsx`, fixed auto-hide condition to permit `'read'` and `'ai-tutor'` view modes, removed `<main onClick>` capturing taps, and enabled tap-to-toggle navigation.
    - *Defect 4 (Study Plan Activation Whitelist Validation)*: In `apps/api/src/learning-plans/dto/learning-plans.dto.ts`, added `class-validator` decorators (`@IsDefined()`, `@IsObject()`, `@IsArray()`, `@IsString({ each: true })`) to `preferences`, `sessions`, `rangeScope`, and `focusTopics`, eliminating NestJS whitelist errors.
    - *Defect 5 (API Client Empty Body & 204 Handling)*: In `apps/web/lib/api.ts`, updated `request<T>` to handle 204 No Content and empty string bodies cleanly (`return null as T`), safely parse JSON, and throw descriptive `ApiError` for malformed non-JSON data.
    - *Defect 6 (Recommended Next Actions Responsive Layout)*: In `apps/web/components/workspace/WorkspaceProgressView.tsx`, converted cards into a responsive container-aware grid (`isCompactSidecar ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6'`) preventing horizontal crowding in the companion sidecar.
    - *Defect 7 (Modal Stacking Context)*: In `apps/web/components/workspace/GenerateLearningPlanModal.tsx`, portaled modal directly to `document.body` via `createPortal`, added client `mounted` check, background scroll lock (`overflow: hidden`), `Escape` key listener, and `z-50` backdrop covering the sticky header.
    - *Defect 8 (Quiz Button Plus Sign)*: Verified single plus sign (`<Plus className="w-3.5 h-3.5 text-white" /><span>Create New Quiz</span>`).
  - **Security Remediation & Threat Hardening**:
    - *Risk 1 (BOLA in Flashcard Reviews)*: In `apps/api/src/flashcards/flashcards.service.ts`, updated `reviewCard` to authorize access via workspace membership (`deck: { workspace: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] } }`), allowing group members to review shared deck cards while keeping SM-2 review progress strictly isolated per `userId` in `UserFlashcardReview(userId_cardId)`.
    - *Risk 2 (Hostile File Upload & Magic-Byte Validation)*: In `apps/api/src/documents/documents.service.ts`, implemented `validateFileSignature` checking true binary signatures: `%PDF-` (`0x25 0x50 0x44 0x46`) for PDF, `PK\x03\x04` (`0x50 0x4B 0x03 0x04`) for DOCX, OLE2 for `.doc`, and null-byte scanning on the initial 4KB for `.txt`.
    - *Risk 3 (CORS Wildcard Reflection with Credentials)*: In `apps/api/src/main.ts`, updated CORS logic: if `CORS_ORIGIN === '*'`, wildcard reflection is completely disabled in production (`corsOrigin = false`), and restricted to localhost in development.
    - *Risk 4 (API Rate Limiting)*: In `apps/api/src/app.module.ts`, registered `ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }])` with global `APP_GUARD: ThrottlerGuard`, enforcing 120 req/min per IP to protect against DoS and LLM quota exhaustion.
    - *Risk 5 (HTTP Security Headers)*: In `apps/api/src/main.ts`, injected OWASP ASVS 5.0 headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 0`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
    - *Risk 6 (Production Fallback to Dev JWT Secret)*: In `apps/api/src/config/env.validation.ts`, added strict production validation blocking startup if `JWT_SECRET` is unset, matches the development default, or is shorter than 32 characters.
    - *Risk 7 (Swagger API Docs in Production)*: In `apps/api/src/main.ts`, wrapped Swagger docs in `ENABLE_SWAGGER` check defaulting to `false` in production.
  - **Performance Optimization**:
    - Verified Next.js 15 App Router production bundle: shared First Load JS is only **101 kB**; landing page is **123 kB**; workspace suite is **279 kB** (including PDF.js).
    - Capped DocumentReader rendering DPR: `Math.min(window.devicePixelRatio || 1, 2)` bounds peak GPU canvas memory on 3x/4x mobile screens.
    - Cancelled in-flight PDF.js render tasks and wiped text layers cleanly during fast scrolling and zooming.
  - **Operational Deliverables Created**:
    - `docs/PRODUCTION_READINESS.md` — Complete production readiness assessment, acceptance scorecard, and GO verdict.
    - `docs/SECURITY_REVIEW.md` — OWASP ASVS 5.0 threat model, vulnerability audit, AI prompt injection isolation, and data privacy report.
    - `docs/PERFORMANCE_REPORT.md` — Bundle footprint breakdown, virtualization analysis, backend/worker throughput, and database index benchmarks.
    - `docs/OPERATIONS_RUNBOOK.md` — Topology, deployment instructions, Terminus health probes (`/api/v1/health`), Redis monitoring, backup/recovery, and incident runbooks.

- **Files Created/Modified**:
  - `apps/api/src/app.module.ts` — Added `ThrottlerModule` and global `ThrottlerGuard`.
  - `apps/api/src/main.ts` — Added security headers middleware, safe CORS origin handling, and conditional Swagger.
  - `apps/api/src/config/env.validation.ts` — Added production `JWT_SECRET` security checks.
  - `apps/api/src/config/env.validation.spec.ts` — Unit tests for environment variable validation.
  - `apps/api/src/documents/documents.service.ts` — Added `validateFileSignature` with binary magic-byte checks.
  - `apps/api/src/documents/documents.service.spec.ts` — Added 4 tests for magic-byte upload validation.
  - `apps/api/src/flashcards/flashcards.service.ts` — Fixed BOLA in `reviewCard` to permit group workspace reviews while isolating user progress.
  - `apps/api/src/flashcards/flashcards.service.spec.ts` — Added 2 unit tests for group review authorization and non-member rejection.
  - `apps/api/src/learning-plans/dto/learning-plans.dto.ts` — Added `class-validator` decorators to DTOs.
  - `apps/web/lib/api.ts` — Safe parsing for 204 No Content, empty bodies, and malformed JSON.
  - `apps/web/styles/globals.css` — Added rule hiding PDF.js `.hiddenCanvasElement`.
  - `apps/web/components/workspace/GenerateLearningPlanModal.tsx` — Portaled with `createPortal`, `z-50` backdrop, scroll locking, and Escape key listener.
  - `apps/web/components/workspace/WorkspaceProgressView.tsx` — Responsive stacked grid for Recommended Next Actions in narrow companion sidecars.
  - `apps/web/components/workspace/DocumentReader.tsx` — Touch drag tracking, interactive element click bypass, and compact mobile padding.
  - `apps/web/app/(workspace)/dashboard/workspaces/[workspaceId]/page.tsx` — Fixed auto-hide condition, removed `<main onClick>`, added intentional tap toggle.
  - `docs/PRODUCTION_READINESS.md` — Phase 4 Production Readiness Assessment & Acceptance Report.
  - `docs/SECURITY_REVIEW.md` — Security Review & Threat Assessment (ASVS 5.0, OWASP Top 10).
  - `docs/PERFORMANCE_REPORT.md` — Performance Optimization & Baseline Report.
  - `docs/OPERATIONS_RUNBOOK.md` — Production Operations Runbook.
  - `PROGRESS.md` — Updated task record, roadmap, and update history.

- **Verification Results**:
  - `pnpm --filter @lernivox/ai-core test`: 25/25 tests passing across 5 suites.
  - `pnpm --filter @lernivox/api test`: 154/154 tests passing across 13 suites.
  - `pnpm --filter @lernivox/worker test`: 11/11 tests passing across 4 suites.
  - `pnpm --filter @lernivox/web test`: 23/23 architecture invariant tests passing.
  - `pnpm type-check`: 11/11 package tasks passing across the monorepo with 0 errors.
  - `pnpm --filter @lernivox/web build`: 17/17 routes compiled cleanly (`next build`).
  - `Database & Data Preservation`: 3 READY documents, 1,429 chunks/embeddings 100% preserved.
  - `Port & Process Hygiene`: `ss -tulpn` verified zero leaked processes or lingering ports.

- **Processes and Ports**:
  - Inspected listening ports with `ss -tulpn`: only local execution socket; zero leaked test processes.
  - All temporary test processes terminated cleanly.

- **Known Issues / Blockers**: None.

- **Next Recommended Action**:
  - Deploy Lernivox to production infrastructure following `docs/OPERATIONS_RUNBOOK.md` and monitor health via `/api/v1/health`.

- **Files Created/Modified**:
  - `packages/database/prisma/schema.prisma` — Added `StudyPlan` and `StudyScheduleItem` relations and columns.
  - `packages/database/prisma/migrations/20261109120000_add_learning_plans_fields/migration.sql` — Additive schema migration.
  - `packages/contracts/src/learning-plan.ts` — Shared DTOs for offers, previews, sessions, adaptation, and lifecycle.
  - `packages/contracts/src/index.ts` — Exported learning-plan contracts.
  - `packages/ai-core/src/types/plan.types.ts` — Types for plan generator and adaptive engine.
  - `packages/ai-core/src/primitives/plan-generator.ts` — Core plan generation and schedule adaptation primitives.
  - `packages/ai-core/test/plan-generator.test.ts` — 5 unit tests for generation and adaptation.
  - `packages/ai-core/src/index.ts` — Exported plan types and primitives.
  - `apps/api/src/common/prisma/prisma.service.ts` — Added `studyPlan` and `studyScheduleItem` accessors.
  - `apps/api/src/learning-plans/dto/learning-plans.dto.ts` — Request DTOs with validation decorators.
  - `apps/api/src/learning-plans/learning-plans.service.ts` — Service logic for offers, previews, acceptance, updates, adaptation.
  - `apps/api/src/learning-plans/learning-plans.controller.ts` — Controller with 8 authenticated endpoints.
  - `apps/api/src/learning-plans/learning-plans.module.ts` — NestJS module importing PrismaModule and WorkspacesModule.
  - `apps/api/src/learning-plans/learning-plans.service.spec.ts` — 9 unit tests for all service methods.
  - `apps/api/src/app.module.ts` — Registered `LearningPlansModule`.
  - `apps/web/lib/api.ts` — Added `api.learningPlans` client endpoints.
  - `apps/web/components/workspace/LearningPlanOfferBanner.tsx` — Contextual study plan suggestion in AI chat.
  - `apps/web/components/workspace/GenerateLearningPlanModal.tsx` — Grounded preview and customization wizard.
  - `apps/web/components/workspace/WorkspaceLearningPlanView.tsx` — Active plan view, Next Session Spotlight, activity checklist, stepper, pause/resume.
  - `apps/web/components/workspace/TutorHeader.tsx` — Added 5th study mode: `Study Plan` (`Read | Quizzes | Flashcards | Study Plan | My Progress`).
  - `apps/web/components/workspace/CopilotSidecar.tsx` — Integrated `LearningPlanOfferBanner`.
  - `apps/web/components/workspace/RightWorkspacePanel.tsx` — Forwarded offer props to `CopilotSidecar`.
  - `apps/web/app/(workspace)/dashboard/workspaces/[workspaceId]/page.tsx` — Integrated plan view across Desktop, Tablet, and Mobile drawers; added 2.5s inactivity timer.
  - `apps/web/components/workspace/WorkspaceQuizzesView.tsx` — Removed duplicate plus sign on Create New Quiz.
  - `apps/web/components/workspace/WorkspaceProgressView.tsx` — Added breathing room to Recommended Next Actions.
  - `apps/web/test/workspace-architecture.test.ts` — Updated Invariant 1 and added Invariant 23.
  - `PROGRESS.md` — Updated progress log, task status, and roadmap.

- **Verification Results**:
  - `pnpm --filter @lernivox/ai-core test`: 25/25 tests passing across 5 suites.
  - `pnpm --filter @lernivox/api test`: 144/144 tests passing across 12 suites.
  - `pnpm --filter @lernivox/web test`: 23/23 architecture invariant tests passing.
  - `pnpm type-check`: 11/11 package tasks passing across the monorepo with 0 errors.
  - `pnpm --filter @lernivox/web build`: 17/17 routes compiled cleanly (`next build`).
  - `Database audit`: 3 READY documents, 1,429 chunks/embeddings 100% preserved.
  - `ss -tulpn`: Clean, zero orphaned processes.

- **Processes and Ports**:
  - Inspected listening ports with `ss -tulpn`: only local execution socket; zero leaked test processes.
  - All temporary test processes terminated cleanly.

- **Known Issues / Blockers**: None.

- **Next Recommended Action**:
  - Perform real end-to-end browser user testing and prepare for production deployment / user feedback.
      - Terracotta selection highlight (`rgba(232, 114, 44, 0.28) !important;`).
      - Render task cancellation on unmount, page replacement, or zoom changes.
      - Verified citation badge ("Verified Citation Passage") with terracotta ring when navigating from AI citations.
      - Page indicator stamp (`p. ${pageNumber}`).
  - **Native Word DOCX Reader (`NativeDocxViewer`)**:
    - Built native DOCX reader using `docx-preview` (`renderAsync`).
    - Authenticated binary download via `fetch(authorizedUrl)` with bearer token.
    - Renders Word pages with crisp borders, page drop-shadows, tables, typography, and page breaks on the `#F4F0E5` reading canvas.
    - Supports zoom scaling smoothly.
    - Full native text selection with copy, Ask AI, and Practice integration.
  - **Text Selection Isolation & Pinned Page Protection**:
    - Added `pinnedPage` state in `DocumentReader`: when a student selects text or opens the selection menu, the active page is explicitly pinned into `renderedVirtualItems`, guaranteeing the virtualizer never recycles or unmounts the page while selection is active.
    - Portaled floating selection toolbar to `document.body` via `createPortal`, avoiding clipping by scroll containers and preventing stacking-context issues.
    - Clamped toolbar coordinates within viewport boundaries with directional above/below placement.
    - Added `onMouseDown={(e) => e.preventDefault()}` on all action buttons, preventing focus transfer from collapsing browser text selection.
    - Stored immutable snapshot of selected text and source page, ensuring `onExplainParagraph` receives exact text and page number.
  - **Real Document & Performance Verification**:
    - Verified against real 461-page textbook (`1d80138a-157c..._compress.pdf`): 461 pages detected, 40 outline root chapters extracted, virtualizer mounts $\le 7$ pages simultaneously (98.5%+ pages unmounted out of memory).
    - Verified against real 10-page document (`AI-Assisted_Software_Development_Workflow.pdf`): 10 pages detected, text layer renders 75 items on Page 1.
    - All 19 invariant tests passing (`pnpm --filter @lernivox/web test`).
    - 20/20 AI Core tests passing (`pnpm --filter @lernivox/ai-core test`).
    - All 11 type-check tasks passing across the monorepo (`pnpm type-check`).
    - Next.js 15 production build compiled 17/17 routes with 0 errors (`pnpm --filter @lernivox/web build`).
    - Clean port audit confirmed zero orphaned processes (`ss -tulpn`).

- **Files Created / Modified**:
  - `apps/web/package.json` (added `@tanstack/react-virtual`, `docx-preview`)
  - `apps/web/components/workspace/DocumentReader.tsx` (rewrote with native virtualized PDF.js, native DOCX viewer, portaled selection toolbar, pinned page protection, complete embed removal)
  - `apps/web/styles/globals.css` (added annotationLayer styling, docx-wrapper styling)
  - `apps/web/test/workspace-architecture.test.ts` (added Invariant Tests 18 and 19)
  - `pnpm-lock.yaml`
  - `PROGRESS.md`

- **Verification Results**:
  - `pnpm --filter @lernivox/web test`: 19/19 invariant tests passed (100% success).
  - `pnpm --filter @lernivox/ai-core test`: 20/20 tests passed.
  - `pnpm type-check`: 11/11 package tasks passed with 0 errors across the monorepo.
  - `pnpm --filter @lernivox/web build`: Next.js 15 production build succeeded (all 17 static and dynamic routes compiled).
  - `ss -tulpn`: Port audit confirmed zero orphaned background processes or leaked ports.

- **Processes & Ports**:
  - Cleaned up: No agent-spawned background processes or dev servers remaining.

- **Next Recommended Action**:
  - Phase 4: Optional AI Learning Plans (study plan generation, adaptive recommendations based on quiz performance, spaced review scheduling).

---

## 7. Update History

- **2026-11-09**:
  - Completed Group Collaboration Improvements, Responsive Public Navigation & Complete Product Language Refactor:
    - Feature A (Group Workspace Unread Message Notification Badge): Added `model WorkspaceDiscussionReadCursor` to Prisma schema (`workspaceId, userId, lastReadMessageId, lastReadAt`) with migration `20261109170000_add_workspace_discussion_read_cursors`. Implemented `getUnreadDiscussionCount` and `markDiscussionAsRead` in `workspaces.service.ts` with member authorization, cursor upserts, and automatic cursor advances on message creation. Added endpoints `GET /api/v1/workspaces/:id/discussions/unread` and `POST /api/v1/workspaces/:id/discussions/read`. Attached terracotta `#E8722C` notification badge to desktop `TutorHeader` collaborator pill and mobile Row 2 button. Added 6-second visibility-aware unread polling and automatic mark-as-read triggers on discussion view in `page.tsx` and `RightWorkspacePanel.tsx`.
    - Feature B (Auto-Expanding Multiline Discussion Composer): In `GroupDiscussionPane.tsx`, upgraded single-line input to an auto-expanding `<textarea>` (min-height 38px, max-height 140px, internal scroll), Enter to send, Shift+Enter for newline, IME composition guard (`isComposing || keyCode === 229`), draft preservation on error, page anchoring (`[ ] Anchor to p. X`), and terracotta send button.
    - Feature C (Responsive Public Navigation with Compact Dashboard Shortcut): In `Navbar.tsx`, preserved Explore dropdown on tablet and inline links on desktop. On viewports `< 1024px` (`< lg`), added tactile `w-9 h-9 rounded-full bg-[#FAF8F4] border-[1.5px] border-[#1B3428]/20` with `BookOpen` icon immediately to the left of the hamburger button for authenticated users (`aria-label="Go to Dashboard"`), and compact `Sign In` link for unauthenticated users. Updated mobile navigation drawer to `lg:hidden`.
    - Feature D (Complete User-Facing Language Refactor): Refactored all public and workspace copy to reflect actual capabilities: "Understand every book, one question at a time. Users bring their material, read it, ask questions, explore ideas, and learn at their own pace with an AI tutor." Replaced exclusive calculus examples with diverse reading materials (World History, Literature, Computer Science). Replaced technical jargon ("768-dim", "vector embeddings", "BullMQ/Redis") with plain English. Enforced truthful capabilities (1 MB file limit, shared group discussions instead of nonexistent "Quiz Battles"). Updated bookshelf and dashboard progress labels from "Ingesting" to "Preparing".
    - Verified all test suites across the monorepo: Web architecture invariants (29/29 passing including new Test 25), AI-core (25/25 passing), Worker (11/11 passing), API (164/164 passing), full monorepo type-check (11/11 package tasks passing with 0 errors), Next.js 15 production build (17/17 routes compiled cleanly), and port/process audit (`ss -tulpn` clean, 0 orphaned processes).
  - Completed Reader Virtualization Repair, Group Invitations & Final Product UI Polish:
    - Fixed Mobile PDF Reader Virtualization (Priority 1): Diagnosed `useMemo` on `renderedVirtualItems` in `DocumentReader.tsx` caching initial pages [0, 1, 2] because `virtualizer` object reference is stable across scrolls in React, causing readers to enter an endless beige void on mobile swipe and only reappear on desktop resize. Removed `useMemo` to derive `virtualizer.getVirtualItems()` directly on every frame; replaced manual wrapper `paddingBottom: '24px'` and `estimateSize + 24` with native TanStack Virtual `gap` option (`gap: isMobile ? 12 : 24`); pre-detected natural aspect ratio on `docProxy` load by reading Page 1 viewport (`(await docProxy.getPage(1)).getViewport({ scale: 1 })`), eliminating initial slide (0.5625) vs portrait (1.414) layout flash and offset drift; initialized `containerWidth` with `window.innerWidth`; added resize scroll anchoring to `visiblePageRef.current`; wired `virtualizer.resizeItem(...)` inside `handleDimensionsDetected`.
    - Implemented Pending Group Workspace Invitations (Priority 2): Added `declinedAt DateTime?` to `model WorkspaceInvitation` in Prisma schema with additive migration `20261109160000_add_invitation_declined_at`. Exported `PendingInvitationDto` and updated `WorkspacesListResponseDto` in `@lernivox/contracts`. Updated `listUserWorkspaces` in `workspaces.service.ts` to query pending invitations addressed to verified user email (`acceptedAt: null, revokedAt: null, declinedAt: null, expiresAt > now()`) where user is not an active member. Implemented atomic `acceptPendingInvitation` and `declinePendingInvitation` methods in `workspaces.service.ts` and exposed endpoints `POST /invitations/pending/:id/accept` and `POST /invitations/pending/:id/decline` in `invitations.controller.ts`. Added API client helpers `acceptPendingInvite` and `declinePendingInvite` in `apps/web/lib/api.ts`. Built prominent "Pending Group Invitations" card section on `/dashboard` with `[ Decline ]` and `[ Accept & Open ]` actions, navigating directly into accepted workspace.
    - Removed Duplicate Bookshelf Ingestion Progress (Priority 3): In `BookCard.tsx`, eliminated duplicate amber progress bar and percentage inside book cover illustration during `isProcessing`, retaining concise `Ingesting` status badge and format/page count on cover. Kept all rich progress details (percentage, stage title, unit count, and progress bar) exclusively in the dedicated footer below cover.
    - Updated Favicon & Browser Identity (Priority 4): Replaced generic indigo blue `#4F46E5` SVG in `apps/web/app/icon.svg` with warm terracotta `#E8722C` squircle base, subtle `#B24E12` bottom depth, and warm `#FAF8F4` open-book vector glyph. Configured `themeColor: '#FAF8F4'` in `export const viewport: Viewport` in `apps/web/app/layout.tsx`.
    - Redesigned Settings Page Information Architecture (Priority 5 & 6): Aligned `apps/web/app/(workspace)/dashboard/settings/page.tsx` with application navbar and dashboard in shared `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` container. Added "← Back to Dashboard" header link. Rebuilt into responsive master-detail layout: 240px desktop sidebar with active category indicator (`Profile & Account`, `AI Tutor & Learning`, `Schedule & Reviews`), horizontal scrollable tab nav on mobile. Standardized active selection styling across all segmented button groups (`bg-[#14261D] text-[#FAF8F4] font-bold shadow-xs`). Built tactile `h-11` inputs with warm `#FAF8F4` background and `#1B3428]/20` borders. Implemented truthful persistence to `localStorage` (`lernivox_user_preferences`) with sage feedback confirmation.
    - Verified all test suites across the monorepo: Web architecture invariants (28/28 tests passing), AI Core test suite (25/25 tests passing across 5 suites), Worker test suite (11/11 tests passing across 4 suites), API test suite (161/161 tests passing across 13 suites), full monorepo type-check (`pnpm type-check` 11/11 package tasks passing with 0 errors), Next.js 15 production build (`next build` 17/17 routes compiled cleanly), and clean port hygiene (`ss -tulpn` clean, zero lingering processes). Completed Phase 4 End-to-End Acceptance, Security Hardening & Performance Optimization:
  - **Cross-Site UI & API Stabilization**: Resolved 8 reported defects across reader canvas measuring box, mobile reader vertical padding & navigation auto-hiding gestures, study plan DTO whitelist validation, API 204/empty body parsing, Recommended Next Actions companion sidecar layout, modal stacking contexts, and quiz button icons.
  - **OWASP ASVS 5.0 Security Hardening**: Remediated 7 security risks: BOLA in flashcard reviews (authorized via workspace membership while isolating user SM-2 records), binary magic-byte upload validation (`%PDF-`, `PK\x03\x04`, null-byte scanning), safe CORS origin configuration (wildcard reflection refusal), global rate limiting (`ThrottlerModule` 120 req/min), standard security HTTP headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`), strict production `JWT_SECRET` verification, and conditional Swagger docs.
  - **Performance Optimization**: Bounded DocumentReader DPR to 2.0x, cancelled in-flight PDF.js render tasks during fast scrolling, optimized Next.js 15 production build (101 kB shared First Load JS, 123 kB landing page, 279 kB workspace suite).
  - **Production Operational Deliverables**: Authored `docs/PRODUCTION_READINESS.md` (readiness scorecard & GO verdict), `docs/SECURITY_REVIEW.md` (threat model & AI isolation), `docs/PERFORMANCE_REPORT.md` (footprint & throughput), and `docs/OPERATIONS_RUNBOOK.md` (deployment, Terminus probes, backup/recovery, incident playbooks).
  - **Automated Verification**: 25/25 AI Core tests, 154/154 API tests, 11/11 worker tests, 23/23 web architecture invariant tests, 11/11 package type checks, and 17/17 Next.js routes compiled. 100% database data preservation verified. Zero orphaned processes.

- **2026-11-05 (Part 3)**: Completed Master Implementation of Native Virtualized Document Reader:
  - Permanently removed browser Embed, Object, and iframe-based document viewing from Lernivox.
  - Built high-performance native PDF.js document reading engine with `@tanstack/react-virtual` (`useVirtualizer`), rendering separate Hi-DPI Canvas and transparent `TextLayer` with terracotta selection highlights and zero text ghosting.
  - Built native Word DOCX renderer using `docx-preview` (`renderAsync`), rendering layout-faithful Word document pages, tables, and typography without passing DOCX to PDF.js.
  - Implemented text selection isolation with `pinnedPage` protection against premature virtualization recycling and portaled floating selection toolbar (`Copy`, `Ask AI`, `Practice`).
  - Verified on real 461-page textbook (461 pages, 40-item outline, mounting max 5-7 pages in memory) and 10-page document.
  - Added Invariant Tests 18 and 19 to `apps/web/test/workspace-architecture.test.ts`. Passed 19/19 web tests, 20/20 AI Core tests, 11/11 type-check tasks, and Next.js 15 production build.
- **2026-11-05 (Part 2)**: Completed Final Mobile Workspace & Dashboard Responsive Repairs:
  - Replaced duplicate Outline button in mobile Row 2 toolbar with Group Hub collaboration pill (`[👥 count]`) for `GROUP` workspaces and `Convert to Group` action for `PERSONAL` workspaces. Kept Outline exclusively in the mobile bottom dock.
  - Implemented synchronized directional auto-hide on mobile viewports: header translates `-translate-y-full` and bottom dock translates `translate-y-full`, reclaiming 144px total vertical space (`pt-[88px] pb-14` -> `pt-0 pb-0`). Added touch swipe listeners and suspended auto-hide during modals, citations, text selection, or drawers.
  - Eliminated Dashboard Add Learning Material modal stacking leak by portaling dialogs directly to `document.body` via React `createPortal` with `z-50` backdrop (`bg-black/50 backdrop-blur-xs`), background scroll locking, and Escape key dismissal.
  - Upgraded `ManageGroupModal` and `ConvertToGroupModal` with `createPortal` and mobile bottom sheet styling (`rounded-t-[28px]`, tactile drag handle, safe-area inset padding).
  - Added Invariant Test 17 to `apps/web/test/workspace-architecture.test.ts`. Passed 17/17 invariant tests, 11/11 type-check tasks, and Next.js 15 production build (17/17 routes).
- **2026-11-05 (Part 1)**: Completed Targeted Workspace Responsive Corrections (Embed Viewer Standardization, Panel Collision Elimination, Header Hierarchy):
  - Standardized document reader on the Embed viewer (`<iframe id="pdf-embed-frame" src={authorizedEmbedUrl} ... />`) with page navigation and zoom query hash (`#page=${visiblePage}&zoom=${Math.round(zoomLevel * 100)}`), removed mode toggle completely, preserved native page stepper (`< Page 1 / 10 >`) and zoom controls (`[-] [100%] [+]`), bookmark ribbon, and Focus mode; retained selectable extracted text view for DOCX/notes.
  - Fixed workspace panel collisions below 1280px via mutually exclusive coordinated sidebar state: opening Outline automatically collapses Copilot and vice versa; below 1024px Outline and Companion render as overlay drawers with `z-40` backdrop scrim and `z-50` drawer leaving reader 100% width; between 1024px and 1279px at most one sidebar is docked maintaining reader floor $\ge 620\text{px}$; wide desktop ($\ge 1280\text{px}$) preserves 3-panel layout; resize handler deterministically resolves window transitions.
  - Removed duplicate document title from Row 1 top workspace header (`TutorHeader.tsx` Zone 1), leaving only Brand, divider, and Outline trigger; preserved single authoritative document title display in Row 2 reader secondary toolbar.
  - Verified all 16 invariant tests (`pnpm --filter @lernivox/web test`), 11/11 package type-check (`pnpm type-check`), and Next.js 15 production build (`pnpm --filter @lernivox/web build`) compiling 17/17 routes with 0 errors. Clean port audit.
- **2026-11-04 (Part 7)**: Completed Final Responsive Corrections & UI/UX Stabilization. Resolved 1024px crushed-reader defect with single-docked-sidebar rule below 1280px and 620px canvas floor; standardized reader on paginated experience and removed Continuous/Embed toggle; fixed quiz generation CTA hierarchy; cleaned up Flashcards & Progress typography badges and redesigned Current Mastery card into 2 clean rows; restored ProfileMenu as floating popover; implemented Explore dropdown on tablet homepage navbar; removed redundant Outline collapse control. Verified 16/16 tests, 11/11 type-check, and Next.js 15 production build.
- **2026-11-04 (Part 6)**:
  - Completed Application-Wide Responsiveness Audit and Tailwind-First Refactor:
    - Fixed root-cause breakpoint disparity between JS (`< 1024px`) and CSS (`md:hidden` / `hidden lg:flex`) that hid drawers on 768px–1023px tablets.
    - Synchronized mobile vs tablet/desktop boundary cleanly at `768px` (`md:`).
    - Built dedicated tablet slide-over overlays (`hidden md:block lg:hidden`) for Outline (left) and Companion Sidecar (right) with backdrops and Escape key support, keeping the PDF reader wide and un-crushed.
    - Refactored `Navbar.tsx` to remove rigid min-widths (`md:min-w-[220px]`, `md:min-w-[240px]`), using fluid gaps (`gap-3 lg:gap-6 xl:gap-8`) and responsive text (`text-xs md:text-[13px] lg:text-[15px]`).
    - Refactored hero photography cards (`page.tsx`) to fluid percentage bounds (`w-[27%]`, `w-[38%]`, `w-[28%]`), eliminating horizontal scroll across 320px to ultrawide viewports.
    - Refactored `HeroUpload.tsx` sample pills and metadata headers for compact mobile screens (< 380px).
    - Added Invariant 15 test to `workspace-architecture.test.ts`. 15/15 web invariant tests, 135/135 API tests, 20/20 AI Core tests, 11/11 type-check tasks, and Next.js 17-route production build passing. Clean port audit.

- **2026-11-04 (Part 5)**:
  - Repaired mobile profile menu navigation links (`ProfileMenu.tsx`) by preventing mousedown dismissals using `mobileCardRef`.
  - Enabled browser text selection and copying across AI tutor and group chat by removing `select-none` and adding `select-text cursor-text`.
  - Added auto-expanding message composer textarea (`CopilotSidecar.tsx`) scaling smoothly from 44px to 160px.
  - Completed Phase 3B Flashcards:
    - Added `POST /api/v1/workspaces/:workspaceId/flashcards/generate-preview` and two-step interactive generation with preview before saving in `GenerateFlashcardsModal.tsx`.
    - Enforced strict multi-user privacy in group workspaces (`createdById: userId` query-level isolation).
    - Added deck renaming, card editing, and card deletion endpoints.
    - Added Due Cards vs All Cards filter toggle in `FlashcardStudyRunner.tsx`.
    - Automated tests: 14/14 web invariants, 13/13 API flashcards tests, 20/20 AI Core tests. All builds and type checks passing.

- **2026-11-04 (Part 4)**:
  - Completed Marketing Showcase, PDF Text Selection Repair, Desktop Zen Focus Mode & Responsive Workspace Polish:
    - Replaced live file upload on `/how-it-works` marketing page with an interactive simulated document-processing showcase (Neuroscience PDF, Macroeconomics DOCX, Calculus TXT), animated indexing progress, and conversion CTAs.
    - Repaired PDF text selection: removed distorting CSS span overrides, stabilized aspect ratio callbacks against render thrashing, and built non-destructive persistent highlight overlay layer.
    - Renamed mobile bottom dock destination from `Practice` to `Review` (`Outline | Review | AI Tutor`).
    - Implemented Desktop Zen Focus Mode with secondary toolbar `Focus` toggle, smooth sidecar/TOC collapse, 36px minimal ghost bar, `max-w-5xl` canvas, and `Escape` key restoration.
    - Unified mobile top header and reader toolbar into single coordinated 2-row wrapper that hides together on scroll down >60px and reclaims the 88px vertical space (`pt-[88px]` -> `pt-0`). Auto-hide is suspended during text selection.
    - Refined desktop navigation to a balanced three-zone grid with Zone 2 containing strictly `Quizzes | Flashcards | My Progress` (no duplicate AI button).
    - Verified with `pnpm --filter @lernivox/web test` (8/8 passing), `pnpm type-check` (11/11 passing), and Next.js 15 production build (17/17 routes). Clean port audit.
  - Completed Unified Reading Workspace, Companion Study Tools, Text Selection & Responsive Architecture:
    - Removed `Read` completely from study mode navigation (`WorkspaceViewMode` now strictly `Quizzes | Flashcards | My Progress`).
    - Made original textbook reader and outline permanent components that never unmount or reload. Memoized both `DocumentReader` and `DocumentOutlinePane` with stable prop references.
    - Implemented desktop Balanced Three-Zone True-Center Grid in `TutorHeader`: Zone 1 (brand lockup, outline toggle, document title), Zone 2 (mathematically centered Quizzes/Flashcards/Progress + separate `AI Tutor` action button), Zone 3 (`← Books` + `ProfileMenu compact`).
    - Implemented mobile architecture (<768px): single 48px top header (back button, document title + page, profile avatar), 56px bottom thumb dock (`Outline`, `Practice`, `AI Tutor` with zero `Read`), dedicated Practice bottom sheet with tabs for Quizzes/Flashcards/Progress, and scroll-aware auto-hide (down >60px, up ~10px) suspended during text selection and modal interactions.
    - Diagnosed and fixed text selection across PDF.js and reading workspace: removed root `select-none` on workspace container, locked canvas and `.textLayer` relative alignment without flexbox centering offsets, added comprehensive `.textLayer` styles with terracotta highlight tint `rgba(232, 114, 44, 0.25)`, and built floating contextual toolbar with `Copy` (with visual feedback), `Ask AI` (with citation context), and `Practice`.
    - Consolidated secondary PDF toolbar: compact 2-state view mode icon toggle (Continuous vs Embed), centered `< Page X / Y >` with jump input and chevron controls, compact bookmark ribbon toggle, and fluid container widths.
    - Created automated architectural invariant test suite `apps/web/test/workspace-architecture.test.ts` (6/6 passing).
    - Verified: `pnpm type-check` (11/11 passing), 166/166 unit tests passing across packages, Next.js 15 production build compiled 17/17 routes, clean port audit.


- **2026-11-04**:
  - Completed Workspace Study Modes & Companion Panel Architecture (Direction A) & Quiz Runtime Fixes:
    - Fixed `Cannot read properties of undefined (reading 'questionOrder')` in API and Web frontend with safe bounds clamping and empty-state fallbacks.
    - Implemented Direction A Companion Panel Architecture: `DocumentReader` stays continuously mounted in center stage across all study modes (`Read`, `Quizzes`, `Flashcards`, `My Progress`).
    - Multi-mode companion study sidecar (width 360-460px) in desktop layout and slide-over overlay in mobile layout.
    - Segmented header mode switcher: `Read | Quizzes | Flashcards | My Progress`.
    - Removed redundant `[📖 Back to Reader]` button and eliminated competing CTAs in flashcards.
    - Added citation jumping from quiz results, tricky questions, and flashcards directly into reader canvas.
    - Added `"dev:all": "turbo run dev"` to root `package.json`.
    - Verified: `pnpm type-check` (11/11 passing), 140/140 unit tests passing, Next.js build (17/17 routes passing), clean process cleanup.
  - Add workspace learning navigation (Read, Quizzes, Flashcards, My Progress) and contextual triggers ("Practice Chapter" and "Practice this part").
  - Verify 100% data preservation, monorepo type-checking, automated tests, production builds, and clean process cleanup.
- **Work Completed**:
  1. Database Schema & Migration:
     - Updated `packages/database/prisma/schema.prisma` with relations for `Workspace.quizzes`, `Workspace.flashcardDecks`, `User.createdFlashcardDecks`, `User.flashcardReviews`, `Document.flashcardDecks`, `DocumentChunk.flashcardItems`, and `Quiz.workspaceId`/`rangeScope`.
     - Added models `FlashcardDeck`, `FlashcardItem`, `UserFlashcardReview` with SM-2 scheduling fields (`easeFactor`, `intervalDays`, `repetition`, `nextReviewAt`, `lastRating`).
     - Applied additive migration `20261102221500_workspace_learning_quizzes_and_flashcards`.
  2. Shared Contracts (`packages/contracts`):
     - `quizzes.ts`: Added `QuizScopeType`, `RangeSelectionType`, `RangeBoundaryDto`, `QuizRangeScopeDto`, `FailedQuestionDto`, and updated creation/summary DTOs.
     - `flashcards.ts`: Added `FlashcardRating` (1 | 2 | 3 | 4), `FlashcardItemDto`, `FlashcardDeckSummaryDto`, `FlashcardDeckDetailDto`, `CreateFlashcardDeckDto`, `GenerateFlashcardsRequestDto`, `ReviewFlashcardDto`, `FlashcardReviewResultDto`.
     - `progress.ts`: Added `TopicUnderstandingStatus`, `TopicUnderstandingDto`, `WorkspaceReadingProgressDto`, `WorkspaceAssessmentProgressDto`, `WorkspaceFlashcardProgressDto`, `WorkspaceProgressOverviewDto`.
     - `index.ts`: Exported flashcard and progress contracts; registered `JobType.GENERATE_FLASHCARDS`.
  3. AI-Core Package (`packages/ai-core`):
     - Created `types/flashcard.types.ts` and `primitives/flashcard-generator.ts` with MockAiProvider and Gemini structured generation support.
     - Added unit tests in `test/flashcard.test.ts`. 20/20 tests passing in `ai-core`.
  4. Background Worker (`apps/worker`):
     - Updated `QuizGenerationProcessor` to authorize workspace members and filter chunks strictly by `rangeScope` (page range or chunk range).
     - Created `FlashcardGenerationProcessor` in `processors/flashcard-generation.processor.ts` for background deck generation.
     - Registered processor in `WorkerModule` and added unit test suite. 8/8 tests passing in `worker`.
  5. Backend API (`apps/api`):
     - Extended `PrismaService` delegates.
     - Updated `QuizzesService`: Added range validation, `rangeScope` storage, `getWorkspaceQuizzes`, `getFailedQuestions`, and workspace member authorization on quiz endpoints.
     - Created `FlashcardsModule`: `FlashcardsService` with deck generation, manual deck creation, workspace decks listing, deck retrieval with user-specific review scheduling, and SM-2 review rating logic.
     - Extended `WorkspacesService`: Added `getWorkspaceProgress` computing real reading progress, quiz metrics, flashcard retention rate, topic status matrix, and exam readiness level.
     - Added unit tests in `quizzes.service.spec.ts`, `flashcards.service.spec.ts`, and `workspaces.service.spec.ts`. All 132 API tests passing.
  6. Frontend Web (`apps/web`):
     - `apps/web/lib/api.ts`: Added API client methods for quizzes by workspace, failed questions, flashcards endpoints, and workspace progress.
     - `apps/web/components/workspace/BookRangeSelector.tsx`: Range selector supporting Entire Material vs Custom Range, section TOC selection, and page range fallback.
     - `apps/web/components/workspace/GenerateQuizModal.tsx`: Updated with `BookRangeSelector`.
     - `apps/web/components/workspace/WorkspaceQuizRunner.tsx`: Full-screen assessment runner with stepper, all 4 question types, deterministic/semantic AI grading, feedback, citations, and retry.
     - `apps/web/components/workspace/WorkspaceQuizzesView.tsx`: Workspace Quizzes list and Failed Questions review tab.
     - `apps/web/components/workspace/GenerateFlashcardsModal.tsx`: Range-aware flashcard generator modal.
     - `apps/web/components/workspace/FlashcardStudyRunner.tsx`: Dedicated review runner with 3D tactile card flip, SM-2 ratings (`1-4`), keyboard shortcuts (`Space`, `1-4`), and completion breakdown.
     - `apps/web/components/workspace/WorkspaceFlashcardsView.tsx`: Decks list, due count badges, and study launcher.
     - `apps/web/components/workspace/WorkspaceProgressView.tsx`: Progress dashboard with reading bar, assessment stats, flashcard retention, topic matrix (`NOT_STARTED`, `LEARNING`, `NEEDS_REVIEW`, `CONFIDENT`), readiness badge, and privacy notice.
     - `apps/web/components/workspace/TutorHeader.tsx`: Centered navigation switcher (`Read` | `Quizzes` | `Flashcards` | `My Progress`).
     - `apps/web/components/workspace/DocumentOutlinePane.tsx`: Contextual "Practice" button on TOC chapters.
     - `apps/web/components/workspace/DocumentReader.tsx`: Contextual "Practice this part" action in floating text-selection toolbar.
     - `apps/web/app/(workspace)/dashboard/workspaces/[workspaceId]/page.tsx`: Integrated view switching, preserving reading canvas, outline, and AI copilot state.
  7. Verification:
     - `pnpm type-check`: 11/11 tasks passed (0 errors across monorepo).
     - `pnpm test`: 170/170 tests passed (API: 132, Worker: 8, AI-Core: 20, Database: 10).
     - `pnpm build`: 7/7 builds passed, Next.js build compiled 15/15 routes cleanly.
     - PostgreSQL Data Integrity Audit: 3 workspaces, 3 documents (100% READY), 1,429 chunks, 1,429 embeddings, 2 quizzes, 0 lost data.
     - Port Hygiene: Zero orphan processes; only PostgreSQL (5433) and Redis (6379) active.
- **Files Created/Modified**:
  - `packages/database/prisma/schema.prisma`
  - `packages/database/prisma/migrations/20261102221500_workspace_learning_quizzes_and_flashcards/migration.sql`
  - `packages/contracts/src/quizzes.ts`
  - `packages/contracts/src/flashcards.ts`
  - `packages/contracts/src/progress.ts`
  - `packages/contracts/src/index.ts`
  - `packages/ai-core/src/types/flashcard.types.ts`
  - `packages/ai-core/src/primitives/flashcard-generator.ts`
  - `packages/ai-core/src/index.ts`
  - `packages/ai-core/test/flashcard.test.ts`
  - `apps/worker/src/processors/quiz-generation.processor.ts`
  - `apps/worker/src/processors/quiz-generation.processor.spec.ts`
  - `apps/worker/src/processors/flashcard-generation.processor.ts`
  - `apps/worker/src/processors/flashcard-generation.processor.spec.ts`
  - `apps/worker/src/worker.module.ts`
  - `apps/api/src/common/prisma/prisma.service.ts`
  - `apps/api/src/quizzes/dto/quizzes.dto.ts`
  - `apps/api/src/quizzes/quizzes.service.ts`
  - `apps/api/src/quizzes/quizzes.controller.ts`
  - `apps/api/src/quizzes/quizzes.service.spec.ts`
  - `apps/api/src/flashcards/dto/flashcards.dto.ts`
  - `apps/api/src/flashcards/flashcards.service.ts`
  - `apps/api/src/flashcards/flashcards.controller.ts`
  - `apps/api/src/flashcards/flashcards.module.ts`
  - `apps/api/src/flashcards/flashcards.service.spec.ts`
  - `apps/api/src/workspaces/workspaces.service.ts`
  - `apps/api/src/workspaces/workspaces.controller.ts`
  - `apps/api/src/workspaces/workspaces.service.spec.ts`
  - `apps/api/src/app.module.ts`
  - `apps/web/lib/api.ts`
  - `apps/web/components/workspace/BookRangeSelector.tsx`
  - `apps/web/components/workspace/GenerateQuizModal.tsx`
  - `apps/web/components/workspace/WorkspaceQuizRunner.tsx`
  - `apps/web/components/workspace/WorkspaceQuizzesView.tsx`
  - `apps/web/components/workspace/GenerateFlashcardsModal.tsx`
  - `apps/web/components/workspace/FlashcardStudyRunner.tsx`
  - `apps/web/components/workspace/WorkspaceFlashcardsView.tsx`
  - `apps/web/components/workspace/WorkspaceProgressView.tsx`
  - `apps/web/components/workspace/TutorHeader.tsx`
  - `apps/web/components/workspace/DocumentOutlinePane.tsx`
  - `apps/web/components/workspace/DocumentReader.tsx`
  - `apps/web/app/(workspace)/dashboard/workspaces/[workspaceId]/page.tsx`
  - `PROGRESS.md`
- **Processes and Ports**:
  - Cleaned up: No agent-spawned background processes or dev watchers remaining.
  - Persistent infrastructure: `lernivox-postgres` on port 5433, `lernivox-redis` on port 6379.
- **Known Issues / Blockers**: None.
- **Next Recommended Action**: Execute Phase 4 — Adaptive AI Learning Plans (structured study sequences, adaptive practice recommendations based on student's demonstrated weak topics).

---

## 7. Known Issues & Blockers

1. **Gemini Free Tier Rate Limits**:
   - Google Generative AI Free Tier enforces rate limits. The system handles 429 errors using bounded exponential backoff with `RetryInfo` headers, token-overlap heuristics for short answer grading, and MockAiProvider fallbacks.
2. **Local Infrastructure Required for Runtime Workflows**:
   - Runtime database operations require `infra/docker/docker-compose.yml` (`pnpm infra:up`) so PostgreSQL (pgvector on port 5433) and Redis (port 6379) are accessible.

---

## 8. Next Recommended Action

**Phase 4: Adaptive AI Learning Plans & Study Sequences**:
- Implement AI-assisted structured study sequences and adaptive practice recommendations dynamically derived from student's topic understanding matrix (`NEEDS_REVIEW` topics).

-----

## 9. Update History

- **2026-11-02**:
  - Completed Phase 3: Workspace Learning Experience (Quizzes, Flashcards, Individual Progress & Book-Range Selection):
    - Implemented book-range selection (`BookRangeSelector`) resolving boundaries via hierarchy (TOC Outline -> Extracted Headings -> Page Range -> Text Chunks) for "Entire Material" or custom inclusive "From" - "To" ranges.
    - Added backend range validation, bounds chunk retrieval to selected range in `QuizGenerationProcessor` and `FlashcardGenerationProcessor`, and stored scope on `Quiz.rangeScope` and `FlashcardDeck.sourceRange`.
    - Implemented full-featured in-workspace assessment runner (`WorkspaceQuizRunner`) supporting 4 question types with deterministic objective evaluation and semantic AI grading for short answers.
    - Implemented failed questions review history and saved independent attempts per student.
    - Implemented grounded flashcard generation in `@lernivox/ai-core` and dedicated review runner (`FlashcardStudyRunner`) with 3D tactile flip and SM-2 spaced repetition (`1`: Again, `2`: Hard, `3`: Good, `4`: Easy).
    - Guaranteed privacy in GROUP workspaces: shared quizzes and decks, but private attempts, reviews, and progress.
    - Built objective workspace learning progress (`WorkspaceProgressView`) with reading bar, assessment stats, flashcard retention rate, topic matrix (`NOT_STARTED`, `LEARNING`, `NEEDS_REVIEW`, `CONFIDENT`), and exam readiness level with zero fabricated scores.
    - Integrated top navigation tabs (`Read` | `Quizzes` | `Flashcards` | `My Progress`) in workspace view, plus contextual triggers in outline and PDF selection.
    - Verified all 11 type-checks, 170 tests passing, 7/7 production builds, 0 port leaks, and 100% database integrity across 3 workspaces and 1,429 chunks.
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
- **2026-11-04**:
  - Completed Companion Sidecar UX Refinement, Tablet Responsiveness & Workspace Navigation Polish:
    - Eliminated competing sidecar triggers and floating bottom-right buttons (`CopilotSidecar.tsx`, `RightWorkspacePanel.tsx`, `TutorHeader.tsx`).
    - Standardized primary generator CTAs to terracotta `#E8722C` with tactile `#B26E45` offset shadow across Quizzes and Flashcards (`WorkspaceQuizzesView.tsx`, `WorkspaceFlashcardsView.tsx`).
    - Resolved duplicate flashcard generation CTAs: informational-only top banner when 0 decks exist, compact secondary `+ New Deck` when >0 decks exist.
    - Unified companion sidecar header (44-48px height) with contextual study titles and tactile `PanelRightClose`/`X` button.
    - Added right-edge companion panel tactile tab (~28px wide) with sparkle/study icon opening the active study mode when sidecar is collapsed.
    - Simplified reader secondary toolbar with 2-state view mode icon toggle, running book title, strictly centered page indicator, and compact icon-only bookmark ribbon toggle.
    - Fixed segmented navigation wrapping on tablet widths (768px): non-wrapping mode tab buttons, condensed Books icon button below 1024px, and book title moved from header to reader toolbar.
    - Expanded PDF reading area on tablet to 94% width (`max-w-3xl mx-auto`), reducing excess beige margins.
    - Upgraded inactive Table of Contents contrast (`DocumentOutlinePane.tsx`).
    - Verified all compiler checks (`pnpm type-check` 11/11), unit tests (API 129/129, Worker 11/11), and Next.js 15 production build (17/17 routes).
  - Completed Mobile Profile Bottom Sheet, PDF Text-Layer Ghosting Elimination & Responsive Navigation Repair:
    - Fixed mobile profile menu (Screenshot 40): replaced cramped anchored dropdown popover with an accessible, tactile full-width bottom sheet dialog (`md:hidden`) on viewports `< 768px` featuring rounded-t-[28px] card, tactile drag handle, dimmed scrim backdrop (`bg-black/40 backdrop-blur-xs`), `X` dismiss button, user identity, 48px min-height tap targets, background scroll locking, and Escape key listener, while preserving desktop dropdown (`hidden md:block`).
    - Fixed PDF text-layer ghosting & selection alignment (Screenshot 41): eliminated visible doubled black glyphs by enforcing `color: transparent !important;` and `-webkit-text-fill-color: transparent !important;` on `.textLayer span` and `.react-pdf__Page__textContent :is(span, br)` in `globals.css`. Updated terracotta selection tint to `rgba(232, 114, 44, 0.28) !important;`. Removed `flex justify-center` fractional offset from `ContinuousPdfPage` container in `DocumentReader.tsx` to lock canvas and text layer to exact 0-offset pixel coordinates.
    - Fixed tablet and small-desktop header collisions (Screenshot 42): resolved Zone 1 and Zone 2 collisions across 768px–1279px viewports. Set "Lernivox" brand and "Outline" button text to `hidden xl:inline` (icon-only below 1280px), hid document title in header below 1280px (`hidden xl:flex`), condensed Zone 2 segmented labels below 1280px ("Cards", "Progress") with single-row non-wrapping buttons, condensed Books button to icon-only below 1280px, and hid secondary reader toolbar document title below 1280px (`hidden xl:inline`) so the centered `< Page X / Y >` stepper never collides.
    - Verified with all 11 invariant tests in `@lernivox/web`, monorepo type-check (`pnpm type-check` 11/11 tasks passing), production Next.js 15 build (`next build` 17/17 routes generated), and clean port inspection (`ss -tulpn`).
  - Completed Recurring Workspace UI Defects: Root-Cause Analysis, Profile Menu Portal, Responsive Navigation & TOC Rail Removal:
    - Fixed mobile profile card rendering outside viewport (Screenshot 47): Diagnosed ancestor `transition-transform duration-300 translate-y-0` on mobile header creating a local containing block for `position: fixed`. Re-architected with `createPortal(..., document.body)` and viewport-relative coordinates (`top: calc(env(safe-area-inset-top) + 56px)`, `width: min(340px, calc(100vw - 24px))`, `max-height: calc(100dvh - 80px)`), guaranteeing complete visibility of avatar, user info, 48px touch targets, and sign-out button across all mobile viewports.
    - Fixed mobile header compression & avatar clipping at 320px (Screenshots 44 and 46): Rebuilt Row 1 into a constrained 3-column grid `grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-2 h-12 w-full px-3`, protecting the right avatar trigger with stable width, visible border, uncompressed chevron, and 12px right padding, while allowing center document title to truncate gracefully.
    - Restored `Read` as the first study mode tab on desktop and tablet: `Read | Quizzes | Flashcards | My Progress`. `Read` switches the companion sidecar to AI Tutor/reading context while original PDF reader and TOC remain permanently present. Mobile dock navigation remains strictly `Outline | Review | AI Tutor`.
    - Fixed desktop/tablet three-zone header overlap (Screenshots 42, 43, 45): Moved group collaborator pill `[👥 memberCount]` to Zone 3 (accessible across desktop and tablet below 1024px), keeping Zone 1 compact (~72px on tablet) and ensuring Zone 2 segmented tabs stay mathematically centered without overlapping adjacent controls.
    - Completely removed the 48px left TOC icon rail (Screenshots 43 and 45): Replaced collapsed rail rendering with `return null;` in `DocumentOutlinePane.tsx`, reclaiming 48px width directly for the PDF reader canvas. Added a `PanelLeftClose` toggle button in the expanded pane header.
    - Verified with all 12 architectural invariant tests passing in `@lernivox/web`, full monorepo type-check (`pnpm type-check` 11/11 tasks), and production Next.js 15 build (`next build` 17/17 routes).
- **2026-11-09**:
  - Completed Group Collaboration Improvements, Responsive Public Navigation & Complete Product Language Refactor:
    - Feature A (Group Workspace Unread Message Notification Badge): Added `model WorkspaceDiscussionReadCursor` to Prisma schema (`workspaceId, userId, lastReadMessageId, lastReadAt`) with migration `20261109170000_add_workspace_discussion_read_cursors`. Implemented `getUnreadDiscussionCount` and `markDiscussionAsRead` in `workspaces.service.ts` with member authorization, cursor upserts, and automatic cursor advances on message creation. Added endpoints `GET /api/v1/workspaces/:id/discussions/unread` and `POST /api/v1/workspaces/:id/discussions/read`. Attached terracotta `#E8722C` notification badge to desktop `TutorHeader` collaborator pill and mobile Row 2 button. Added 6-second visibility-aware unread polling and automatic mark-as-read triggers on discussion view in `page.tsx` and `RightWorkspacePanel.tsx`.
    - Feature B (Auto-Expanding Multiline Discussion Composer): In `GroupDiscussionPane.tsx`, upgraded single-line input to an auto-expanding `<textarea>` (min-height 38px, max-height 140px, internal scroll), Enter to send, Shift+Enter for newline, IME composition guard (`isComposing || keyCode === 229`), draft preservation on error, page anchoring (`[ ] Anchor to p. X`), and terracotta send button.
    - Feature C (Responsive Public Navigation with Compact Dashboard Shortcut): In `Navbar.tsx`, preserved Explore dropdown on tablet and inline links on desktop. On viewports `< 1024px` (`< lg`), added tactile `w-9 h-9 rounded-full bg-[#FAF8F4] border-[1.5px] border-[#1B3428]/20` with `BookOpen` icon immediately to the left of the hamburger button for authenticated users (`aria-label="Go to Dashboard"`), and compact `Sign In` link for unauthenticated users. Updated mobile navigation drawer to `lg:hidden`.
    - Feature D (Complete User-Facing Language Refactor): Refactored all public and workspace copy to reflect actual capabilities: "Understand every book, one question at a time. Users bring their material, read it, ask questions, explore ideas, and learn at their own pace with an AI tutor." Replaced exclusive calculus examples with diverse reading materials (World History, Literature, Computer Science). Replaced technical jargon ("768-dim", "vector embeddings", "BullMQ/Redis") with plain English. Enforced truthful capabilities (1 MB file limit, shared group discussions instead of nonexistent "Quiz Battles"). Updated bookshelf and dashboard progress labels from "Ingesting" to "Preparing".
    - Verified all test suites across the monorepo: Web architecture invariants (29/29 passing including new Test 25), AI-core (25/25 passing), Worker (11/11 passing), API (164/164 passing), full monorepo type-check (11/11 package tasks passing with 0 errors), Next.js 15 production build (17/17 routes compiled cleanly), and port/process audit (`ss -tulpn` clean, 0 orphaned processes).
  - Completed Reader Virtualization Repair, Group Invitations & Final Product UI Polish:
    - Fixed Mobile PDF Reader Virtualization (Priority 1): Diagnosed `useMemo` on `renderedVirtualItems` in `DocumentReader.tsx` caching initial pages [0, 1, 2] because `virtualizer` object reference is stable across scrolls in React, causing readers to enter an endless beige void on mobile swipe and only reappear on desktop resize. Removed `useMemo` to derive `virtualizer.getVirtualItems()` directly on every frame; replaced manual wrapper `paddingBottom: '24px'` and `estimateSize + 24` with native TanStack Virtual `gap` option (`gap: isMobile ? 12 : 24`); pre-detected natural aspect ratio on `docProxy` load by reading Page 1 viewport (`(await docProxy.getPage(1)).getViewport({ scale: 1 })`), eliminating initial slide (0.5625) vs portrait (1.414) layout flash and offset drift; initialized `containerWidth` with `window.innerWidth`; added resize scroll anchoring to `visiblePageRef.current`; wired `virtualizer.resizeItem(...)` inside `handleDimensionsDetected`.
    - Implemented Pending Group Workspace Invitations (Priority 2): Added `declinedAt DateTime?` to `model WorkspaceInvitation` in Prisma schema with additive migration `20261109160000_add_invitation_declined_at`. Exported `PendingInvitationDto` and updated `WorkspacesListResponseDto` in `@lernivox/contracts`. Updated `listUserWorkspaces` in `workspaces.service.ts` to query pending invitations addressed to verified user email (`acceptedAt: null, revokedAt: null, declinedAt: null, expiresAt > now()`) where user is not an active member. Implemented atomic `acceptPendingInvitation` and `declinePendingInvitation` methods in `workspaces.service.ts` and exposed endpoints `POST /invitations/pending/:id/accept` and `POST /invitations/pending/:id/decline` in `invitations.controller.ts`. Added API client helpers `acceptPendingInvite` and `declinePendingInvite` in `apps/web/lib/api.ts`. Built prominent "Pending Group Invitations" card section on `/dashboard` with `[ Decline ]` and `[ Accept & Open ]` actions, navigating directly into accepted workspace.
    - Removed Duplicate Bookshelf Ingestion Progress (Priority 3): In `BookCard.tsx`, eliminated duplicate amber progress bar and percentage inside book cover illustration during `isProcessing`, retaining concise `Ingesting` status badge and format/page count on cover. Kept all rich progress details (percentage, stage title, unit count, and progress bar) exclusively in the dedicated footer below cover.
    - Updated Favicon & Browser Identity (Priority 4): Replaced generic indigo blue `#4F46E5` SVG in `apps/web/app/icon.svg` with warm terracotta `#E8722C` squircle base, subtle `#B24E12` bottom depth, and warm `#FAF8F4` open-book vector glyph. Configured `themeColor: '#FAF8F4'` in `export const viewport: Viewport` in `apps/web/app/layout.tsx`.
    - Redesigned Settings Page Information Architecture (Priority 5 & 6): Aligned `apps/web/app/(workspace)/dashboard/settings/page.tsx` with application navbar and dashboard in shared `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` container. Added "← Back to Dashboard" header link. Rebuilt into responsive master-detail layout: 240px desktop sidebar with active category indicator (`Profile & Account`, `AI Tutor & Learning`, `Schedule & Reviews`), horizontal scrollable tab nav on mobile. Standardized active selection styling across all segmented button groups (`bg-[#14261D] text-[#FAF8F4] font-bold shadow-xs`). Built tactile `h-11` inputs with warm `#FAF8F4` background and `#1B3428]/20` borders. Implemented truthful persistence to `localStorage` (`lernivox_user_preferences`) with sage feedback confirmation.
    - Verified all test suites across the monorepo: Web architecture invariants (28/28 tests passing), AI Core test suite (25/25 tests passing across 5 suites), Worker test suite (11/11 tests passing across 4 suites), API test suite (161/161 tests passing across 13 suites), full monorepo type-check (`pnpm type-check` 11/11 package tasks passing with 0 errors), Next.js 15 production build (`next build` 17/17 routes compiled cleanly), and clean port hygiene (`ss -tulpn` clean, zero lingering processes).
  - Completed Cross-Site Stabilization and Professional UI/Architecture Fixes:
    - Fixed PDF.js measuring canvas rendering as a 300 × 150 layout-block artifact: added global styling rule for `canvas.hiddenCanvasElement, .hiddenCanvasElement` in `apps/web/styles/globals.css` enforcing `display: none !important; position: absolute !important; width: 0 !important; height: 0 !important; visibility: hidden !important; pointer-events: none !important;`.
    - Fixed API client empty response & 204 parsing crashes: updated `request<T>` in `apps/web/lib/api.ts` to return `null as T` on 204 No Content and empty response bodies (`trimmed.length === 0`), extract structured error JSON or text on HTTP error statuses, safely parse valid JSON, and throw descriptive `ApiError` when non-empty bodies contain malformed non-JSON data (never silently ignoring corrupt responses).
    - Fixed study plan activation NestJS whitelist validation error: added `class-validator` decorators (`@IsDefined()`, `@IsObject()`, `@IsArray()`, `@IsString({ each: true })`) to `preferences`, `sessions`, `rangeScope`, and `focusTopics` in `apps/api/src/learning-plans/dto/learning-plans.dto.ts`, allowing `ValidationPipe` with `forbidNonWhitelisted: true` to validate study plan acceptance payloads.
    - Fixed modal layering, containing block bleed-through, and background scrolling: portaled `GenerateLearningPlanModal` directly to `document.body` via `createPortal`, added `mounted` hydration check, added backdrop scrim (`bg-[#14261D]/60 backdrop-blur-xs`) covering the sticky application header (`z-30`), added body scroll locking (`overflow: hidden`), and wired Escape key and backdrop dismissal.
    - Fixed Recommended Next Actions grid collapsing inside companion sidecar: in `WorkspaceProgressView.tsx`, added container-aware conditional layout (`isCompactSidecar ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6'`), 3rd card span adjustment (`isCompactSidecar ? 'col-span-1' : 'md:col-span-2 lg:col-span-1'`), and compact padding (`p-4 sm:p-5`), preventing horizontal card compression in narrow companion sidecars while preserving spacious multi-column desktop layout.
    - Fixed mobile reader spacing and distraction-free navigation: updated `isAutoHidingAllowed` in `page.tsx` to support both `'read'` and default `'ai-tutor'` companion view modes, removed indiscriminate `<main onClick>` capturing taps, implemented intentional canvas tap toggle in `DocumentReader.tsx` with drag/swipe detection (>8px pointer delta ignored) and interactive element suppression, and reduced excessive reader container top padding from `py-6 px-2 sm:px-4` to `py-2 sm:py-6 px-1 sm:px-4` to eliminate awkward blank gaps.
    - Verified single plus sign on Create New Quiz button (`WorkspaceQuizzesView.tsx`).
    - Verified all test suites across the monorepo: AI-core (25/25 passing across 5 suites), API (144/144 passing across 12 suites), Web architecture invariants (23/23 passing), full monorepo type-check (11/11 package tasks passing with 0 errors), Next.js 15 production build (17/17 routes compiled cleanly), and port/process audit (`ss -tulpn` clean, zero orphaned processes).
  - Completed Mandatory Pre-Phase-4 UI Polish:
    - Fixed mobile reader full screen space reclamation with directional auto-hide on upward scroll, downward reveal, and 2.5-second inactivity reveal timer. Cleaned up timer on unmount and respected `motion-reduce:transition-none`.
    - Removed duplicate `+` sign in `WorkspaceQuizzesView.tsx`, displaying single `<Plus />` icon alongside `Create New Quiz`.
    - Added generous responsive breathing room in `WorkspaceProgressView.tsx` Recommended Next Actions grid (`gap-5 sm:gap-6`, `p-5 sm:p-6`).
  - Completed Phase 3B/3C Closure Checks:
    - Audited active database chunk page metadata: verified all 1,429 chunks across all 3 READY documents (Doc 1: 1 chunk p. 5, Doc 2: 11 chunks pp. 1-10, Doc 3: 1,417 chunks pp. 1-461; unpaginated chunks = 0).
    - Verified flashcard range integrity across 5 ranges (page 1, middle, near end, invalid out-of-bounds with strict `BadRequestException`).
  - Completed Phase 4 — Optional, Adaptive AI Learning Plans Master Implementation:
    - Applied additive non-destructive migration `20261109120000_add_learning_plans_fields` to PostgreSQL.
    - Defined contracts and DTOs in `packages/contracts/src/learning-plan.ts`.
    - Implemented `@lernivox/ai-core` plan generator and adaptive engine (`generateLearningPlan`, `adaptLearningPlan`) with unit test suite in `plan-generator.test.ts`.
    - Implemented NestJS `LearningPlansModule`, `LearningPlansService`, and `LearningPlansController` in `apps/api/src/learning-plans/` with unit test suite in `learning-plans.service.spec.ts`.
    - Built frontend components: `LearningPlanOfferBanner.tsx`, `GenerateLearningPlanModal.tsx`, `WorkspaceLearningPlanView.tsx`, and updated `TutorHeader.tsx` (with 5 modes: `Read`, `Quizzes`, `Flashcards`, `Study Plan`, `My Progress`).
    - Integrated across Desktop sidecar, Tablet slide-over, and Mobile drawers in `page.tsx`.
    - Verified all 23 Web architecture tests (`pnpm --filter @lernivox/web test`), all 144 API tests across 12 suites (`pnpm --filter @lernivox/api test`), all 25 AI-core tests (`pnpm --filter @lernivox/ai-core test`), 11/11 monorepo type-check tasks (`pnpm type-check`), and production build (`next build` 17/17 routes).
    - Confirmed 100% data preservation and 0 lingering background processes or open ports.
  - Completed Final UX Polish, Ingestion Visibility, Authentication Reliability & Reader Rendering Fix:
    - Fixed Blank PDF Pages in Large Documents (Feature G): Diagnosed mid-flight render cancellation & canvas collision caused by `aspectRatio` state in `useEffect` dependency array in `DocumentReader.tsx`. Removed `aspectRatio` from deps (`[pdfDoc, pageNumber, pageWidth, retryCount]`); rewrote RFC 7233 suffix range parser in `documents.service.ts` to return last N bytes (`start = Math.max(0, totalSize - suffixLength), end = totalSize - 1`); added `exposedHeaders` (`Content-Range`, `Accept-Ranges`, `Content-Length`, `Content-Disposition`) to CORS configuration in `main.ts`; added localized "Retry Page" recovery action on canvas render failure.
    - Enforced 1 MiB Hard Maximum Upload Size (Feature F): Exported `MAX_UPLOAD_SIZE_BYTES = 1048576`, `MAX_UPLOAD_SIZE_LABEL = '1 MB'`, and `UPLOAD_SIZE_ERROR_MESSAGE` in `@lernivox/contracts`. Enforced 1 MiB limit in `env.validation.ts`, NestJS `FileInterceptor` limits in `documents.controller.ts`, backend file & UTF-8 pasted text byte checks in `documents.service.ts` (with boundary unit tests), and client-side defense-in-depth size validation in `api.ts` and `dashboard/page.tsx`.
    - Real-Time Document Ingestion Visibility (Feature A): Added progress tracking fields (`processingProgress`, `processingStage`, `processingMessage`, `completedUnits`, `totalUnits`) to `Document` model via additive migration `20261109150000_add_ingestion_progress_fields`. Exposed `DocumentStatusDto` and `GET /api/v1/documents/:id/status` endpoint with workspace authorization. Granular progress updates across all BullMQ worker stages (QUEUED 5%, EXTRACTING 15%-25%, CHUNKING 30%-35%, EMBEDDING 35%-90%, INDEXING 95%, READY 100%, FAILED 0%). Replaced static bookshelf spinner in `BookCard.tsx` with tactile progress bar (stage title, percentage, completed unit count; error badge for failures) and added 2-second dashboard polling during active ingestion.
    - Reliable Silent Access-Token Refresh (Feature C): Centralized in `api.ts` with single-flight shared `refreshPromise` preventing refresh storms for concurrent 401s; retry-once mechanism preserving request URL, method, headers, and replayable bodies (JSON, FormData); exempted auth endpoints from refresh loops; implemented safe session expiration notification (`onSessionExpired`); integrated with `AuthContext.tsx`; authored comprehensive unit test suite `apps/web/test/api-refresh.test.ts` (4 unit tests).
    - Warm Parchment Navbar Styling (Feature B): Standardized workspace header (`TutorHeader.tsx`), secondary reader toolbar (`DocumentReader.tsx`), and marketing navbar (`Navbar.tsx`) on warm `#FAF8F4` parchment with `#1B3428`/10 border.
    - Text-Only Outline Button (Feature D): Removed icon (`List`) from Outline toggle button in `TutorHeader.tsx`, displaying clean text-only pill `<span>Outline</span>` while preserving full interactive behavior and accessibility.
    - Standardized Right-Side Navbar Actions (Feature E): Unified Convert to Group action, Books launcher, and Profile trigger to consistent 36px (`h-9 rounded-full`) action row with consistent borders, background, and typography. Standardized Profile trigger with inner avatar `w-7 h-7 rounded-full bg-[#497E64] text-white text-[11px] font-bold`.
    - Verified all test suites: contracts (built), AI-core (25/25), API (159/159), Worker (11/11), Web (27/27), full monorepo type-check (11/11 package tasks passing with 0 errors), Next.js 15 production build (`next build` 17/17 routes), clean port hygiene (`ss -tulpn`).

  - Completed Phase 3B Stabilization + Phase 3C Individual Workspace Learning Progress:
    - Root-cause diagnosed and resolved Flashcard Generation HTTP 400 Blocker: Discovered chunk page numbers in database were set to `1` across all 1,417 chunks of the 461-page textbook. Executed safe non-destructive backfill mapping page headers (`-- X of 461 --`) to true page numbers across all 1,429 chunks in Doc 3 and Doc 2 with 100% data and embedding preservation. Removed silent whole-document fallbacks in `flashcards.service.ts` and `flashcard-generation.processor.ts` to protect source-range bounds, throwing explicit `BadRequestException` when ranges are out of bounds. Updated `apps/web/lib/api.ts` to unwrap nested NestJS exception messages cleanly. Verified live preview returns 5 grounded flashcards with verified chunk IDs in 1.2s.
    - Repaired Mobile Navigation Auto-Hide & Unified Reader Coordination: Diagnosed parent `page.tsx` attempting DOM query `document.getElementById('pdf-scroll-container')` inside an initial render `useEffect` before `DocumentReader` mounted. Replaced with direct `onScrollDelta` and `onCanvasTap` callback props wired to `#pdf-scroll-container`'s synthetic `onScroll`, `onTouchStart`, `onTouchMove`, and `onClick` handlers. Synchronized mobile top header (`-translate-y-full`), bottom dock (`translate-y-full`), and reading container padding with matching `transition-transform duration-300 ease-in-out`. Enforced auto-hide suppression when modals, drawers, or text selection are active, and immediate restoration on canvas tap or scrolling up.
    - Completed Phase 3C Individual Workspace Learning Progress: Scoped backend queries in `apps/api/src/workspaces/workspaces.service.ts` to `createdById: userId` for flashcard decks and `userId` for quiz attempts, guaranteeing 100% individual privacy even in shared GROUP workspaces. Enhanced `WorkspaceProgressView.tsx` with actionable evidence-based recommendations, topic understanding matrix with direct page navigation links (`onNavigateToPage`), recent attempt history with honest empty state, and privacy guarantee badge.
    - Verified all 22 invariant tests in `@lernivox/web`, 135 API tests across 11 suites, 11 worker tests across 4 suites, 20 AI-core tests, full monorepo type-check (`pnpm type-check` 11/11 tasks passing), and Next.js 15 production build (`next build` 17/17 routes). Verified clean port audit with `ss -tulpn`.

  - Completed Marketing Website Layout Refinement, Responsive Navigation & Product Experience Polish:
    - Standardized shared marketing container standard (`max-w-[1380px] w-full mx-auto px-4 sm:px-6 md:px-10`) across the Public Navbar, Hero section, and How It Works section, achieving pixel-perfect edge alignment with the Features, Readiness, and Groups sections.
    - Unified mobile and tablet (< 1024px) action group to a shared 36px tactile button system: both the `BookOpen` Dashboard button and animated Hamburger button share `w-9 h-9 rounded-full bg-[#F4EFE4] border-[1.5px] border-[#1B3428]/20` with an exact 8px gap (`gap-2`), equal baseline, and matching hover behavior.
    - Balanced the How It Works section: replaced developer jargon ("Semantic chunking", "vector indexing") in the left column with 3 clear, human, benefit-driven step cards ("Bring your material", "Explore what you're reading", "Practice and remember"). Decluttered the right showcase card by removing the redundant promotional banner ("Ready to study your own textbooks?..."), harmonizing column heights at ~480px vs ~490px.
    - Fixed Sign In button text wrapping: applied `inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap px-5 rounded-full` to both `Sign In` and `Create Free Account`, guaranteeing uniform 44px height and single-line labels without vertical text collapse across all 11 viewports.
    - Simplified 4 sample material selector pills to clean category labels (`Fiction`, `Science`, `Economics`, `History`) with secondary format badges (`PDF`, `DOCX`) in a 2×2 mobile / 4-column desktop grid, eliminating truncation and ellipsis.
    - Preserved two-line fluid hero headline (`Understand every book,` and `one question at a time.`) with `clamp(1.35rem, 5.2vw, 5.25rem)` and terracotta unread badge on group member pill.
    - Updated architectural Test 26 in `workspace-architecture.test.ts`. Verified full test suites (30 web tests, 164 api tests, 11 worker tests, 25 ai-core tests), 11/11 type-check tasks, Next.js production build (17/17 routes, 101 kB shared JS), and zero lingering ports with `ss -tulpn`.

  - Completed Final Responsive Homepage Header Correction, Marketing Layout Alignment & Free Deployment Preparation:
    - Diagnosed CSS box-model root cause of navbar boundary misalignment: `Navbar.tsx` previously placed both `max-w-[1380px]` and `px-4 sm:px-6 md:px-10` on the same container element, shrinking the inner content box by 80px (1300px vs 1380px) and insetting logo and controls by 40px relative to the reference section (`Section 3: Features`, `id="features"`, containing "Engineered for genuine academic retention").
    - Standardized two-layer container architecture: outer header element receives `w-full px-4 sm:px-6 md:px-10` while inner container receives `w-full max-w-[1380px] mx-auto` without inline padding, achieving 0.0px boundary deviation across all 13 viewports (320px to 1920px).
    - Resolved mobile bunching with responsive two-pole layout: below `1024px` (`< lg`), navbar inner container operates as `flex items-center justify-between` with Brand Lockup on far left, Zone 2 hidden (`hidden lg:flex`), and `[Dashboard (36px)] [Hamburger (36px)]` on far right with 8px `gap-2`. At `>= lg`, container switches to `lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]` with mathematically centered inline links.
    - Authored comprehensive production and free-tier deployment guide in `docs/DEPLOYMENT_GUIDE.md` (400+ lines): covers 3 deployable code services (`apps/web`, `apps/api`, `apps/worker`), 3 managed resources (PostgreSQL 16 + pgvector, Upstash Redis 7, Cloudinary/R2), honest free-tier evaluations (Vercel, Northflank, Render, Neon, Upstash), Render disqualifications (30-day DB wipe, sleeping API, no free worker), BullMQ polling tuning for Upstash 500k monthly quota, complete environment variable inventories, cookie and CORS architecture (`SameSite=none; Secure` vs custom domain `.yourdomain.com`), and an ordered 20-step walkthrough.
    - Updated Tests 15, 16, and 26 in `workspace-architecture.test.ts`. Verified all 30 web tests, 164 API tests across 13 suites, 11 worker tests, 25 AI-core tests, 11/11 package tasks in `pnpm type-check`, Next.js 15 production build (17/17 routes, 101 kB shared JS), and clean port hygiene (`ss -tulpn`).

  - Completed Final Hero Typography, Navigation Hover & Supporting Copy Polish:
    - Enhanced hero headline font size below 1024px with fluid typography formula `text-[clamp(1.375rem,0.2rem+5.8vw,3.9rem)] lg:text-[clamp(3.9rem,5.2vw,5.25rem)]` and container `max-w-6xl` in `page.tsx`: headline scales smoothly across mobile and tablet (+15% to +28% increase; ~25.4px on iPhone, ~47.8px on iPad) and smoothly continues into desktop sizing (66.6px at 1280px, 74.9px at 1440px, up to 84px on large monitors), strictly preserving the two-line layout ("Understand every book," and "one question at a time.") with 0 overflow across all 14 viewports (320px to 1920px).
    - Standardized public navbar hover styling on the footer link design system in `Navbar.tsx`: changed hover color to terracotta `#E77130` with `transition-colors duration-200 motion-reduce:transition-none`, matching `Footer.tsx` (`hover:text-[#E77130]`). Eliminated font-weight jumping on hover by maintaining constant `font-medium` across both active and inactive states. Preserved the active orange underline (`after:bg-[#E8722C] after:rounded-full`) and added accessible keyboard-focus rings (`focus-visible:ring-[#E77130]/60`).
    - Shortened hero supporting paragraph in `page.tsx` to human, concise copy: `"Bring a book, article, or notes. Read, ask questions, and learn with your AI tutor."` preserving typography, alignment, and natural multiline wrapping without horizontal crowding.
    - Preserved all existing work: centered desktop navbar, two-zone mobile/tablet navbar, shared marketing content width, parchment navbar background, 36px action system, How It Works column balance, 4 diverse sample materials, and single-line 44px CTA buttons.
    - Authored architectural Test 27 in `workspace-architecture.test.ts` (31/31 web tests passing). Verified full monorepo type-check (`pnpm type-check` 11/11 tasks passing), Next.js production build (`next build` 17/17 routes), and clean port audit (`ss -tulpn`).

  - Completed Responsive Hero Typography & CTA Visual Hierarchy Correction:
    - Implemented intentional 3-line mobile and 2-line desktop headline composition in `page.tsx`: on mobile (< 640px), breaks intentionally into 3 lines ("Understand every" / "book, one question" / "at a time.") with mobile fluid clamp `text-[clamp(1.75rem,1.25rem+2.5vw,2.125rem)]` (28px to 34px), creating a strong visual anchor without oversized buttons dominating; on tablet and desktop (>= 640px), breaks intentionally into 2 lines ("Understand every book," / "one question at a time.") with `sm:text-[clamp(2.5rem,5.6vw,3.9rem)] lg:text-[clamp(3.9rem,5.2vw,5.25rem)]` (40px to 84px). Zero text duplication or accessible sentence fragmentation.
    - Resolved desktop supporting paragraph wrapping: widened container to `max-w-4xl` (896px) with `[text-wrap:balance]`, allowing the 80-character sentence ("Bring a book, article, or notes. Read, ask questions, and learn with your AI tutor.") to render as one elegant single line on desktop (720px width < 896px), eliminating the orphaned "tutor." word, while balancing into two lines on tablet and two/three balanced lines on mobile.
    - Corrected mobile CTA visual hierarchy: replaced `w-full max-w-sm` container and 50px heights with `flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12 md:mb-16 w-full mx-auto` and proportional 44px (`h-11`) pill buttons with intrinsic widths (`w-auto inline-flex`) and proportionate horizontal padding (`px-5 sm:px-6`). Buttons stack cleanly on narrow phones (< 390px) and display side by side on wider screens (>= 390px) with zero horizontal overflow, establishing clear hierarchy between primary terracotta action and secondary understated parchment action.
  - Completed Preparation of NestJS API and BullMQ Worker for Render Free Web Services:
    - Implemented Native Worker HTTP Control Server (`apps/worker/src/server/worker-http.service.ts`): Built lightweight Node.js native HTTP server (`http.createServer`) listening on `0.0.0.0:${PORT}` (assigned by Render or defaulting to 4001) that qualifies the BullMQ background worker as a Render Free Web Service ($0/month) without needing paid Background Workers ($7/mo min). Implemented `GET /healthz` (200 OK liveness check for Render automated health checker), `GET /readyz` (readiness probe checking BullMQ/Redis state), and `POST /internal/wake` (authenticated wake endpoint using timing-safe `crypto.timingSafeEqual` comparison against `x-worker-wake-secret` header or Bearer token; rejects invalid secrets with 401, non-POST with 405, and accepts zero execution payloads). Integrated graceful shutdown hooks (`OnApplicationShutdown`).
    - Configured Worker Health & Redis TCP/TLS (`apps/worker`): Enhanced `WorkerHealthService` to record wake counts, last wake timestamp, and uptime. Built `buildRedisConnectionOptions` in `apps/worker/src/config/redis.config.ts` supporting `REDIS_URL` (`rediss://...`) or discrete parameters (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_TLS`), with `lazyConnect: true`, `maxRetriesPerRequest: null`, and `enableReadyCheck: false`. Authored 10 unit tests in `apps/worker/src/server/worker-http.service.spec.ts` (100% passing).
    - Implemented API Asynchronous Wake Client (`apps/api/src/common/worker-wake/worker-wake.service.ts`): Created `WorkerWakeService` in a `@Global()` NestJS module (`WorkerWakeModule`). Built fire-and-forget, non-blocking `wake(reason)` that never delays user upload or quiz responses. Built in-flight request coalescing (`inFlightWakePromise`) to prevent wake storms from concurrent uploads. Built cold-start resilience with exponential backoff and jitter up to 90 seconds (accommodating Render's 50–60s wake delay). Built `wakeThrottled(reason, minIntervalMs = 30000)` called during active document status polling (`getDocumentStatus`) when a document is in `QUEUED`/`UPLOADED` state.
    - Updated API Configuration & Enqueue Triggers: Added `buildRedisConnectionOptions` in `apps/api/src/config/redis.config.ts`. Added optional `REDIS_URL`, `REDIS_PASSWORD`, `REDIS_USERNAME`, `REDIS_TLS`, `WORKER_BASE_URL`, and `WORKER_WAKE_SECRET` in `env.validation.ts`. Bound API listener explicitly to `0.0.0.0:${port}` in `apps/api/src/main.ts`. Wired non-blocking `wake()` into `DocumentsService.uploadDocument()`, `DocumentsService.createFromText()`, `QuizzesService.generateQuiz()`, `QuizzesService.retryQuiz()`, and `FlashcardsService.generateDeck()`. Authored 7 unit tests in `apps/api/src/common/worker-wake/worker-wake.service.spec.ts` (100% passing).
    - Authored Render Blueprint & Deployment Documentation: Created `render.yaml` defining both Free Web Services (`lernivox-api` and `lernivox-worker`) with exact build contexts, build commands, start commands, health check paths, and shared secret references (`fromService`). Updated `docs/DEPLOYMENT_GUIDE.md` with the dual Free Web Service topology, honest free-tier limits assessment (15m inactivity sleep, 50–90s cold starts, 750 shared instance-hours/month, no synthetic pingers), step-by-step instructions, and post-deployment smoke tests.
    - Verified all test suites across the monorepo: Worker test suite (21/21 passing across 5 suites), API test suite (171/171 passing across 14 suites), AI-core test suite (25/25 passing across 5 suites), Web architecture invariants (32/32 passing across 2 suites), full monorepo type-check (`pnpm type-check` 11/11 package tasks passing with 0 errors), monorepo production build (`pnpm build` 7/7 build tasks succeeded), and port/process audit (`ss -tulpn` clean, zero orphaned processes).

  - Resolved Render Production Build Failure: Prisma Client Generation in pnpm Monorepo:
    - Root-cause diagnosed the 22 compilation errors on Render (`TS2305: Module '"@prisma/client"' has no exported member 'PrismaClient' / 'WorkspaceType' / 'WorkspaceRole' / 15 enums` and `TS7006: Parameter 'tx' / 'o' implicitly has an 'any' type`): In fresh CI/Render containers, `pnpm install --frozen-lockfile` provides only stub types in `@prisma/client`. Because `prisma generate` was a separate manual script rather than a build-time dependency or postinstall hook, `packages/database`'s build script (`"build": "tsc"`) ran against ungenerated stubs.
    - Added `"postinstall": "pnpm db:generate"` to root `package.json`, ensuring every fresh `pnpm install` in any environment immediately executes `prisma generate` and populates the client in `node_modules`.
    - Updated `packages/database/package.json` build script from `"build": "tsc"` to `"build": "prisma generate && tsc"`, guaranteeing that `@lernivox/database` compilation is self-generating and resilient even if postinstall was skipped or bypassed.
    - Updated `render.yaml` build commands for both `lernivox-api` and `lernivox-worker` to include `pnpm --filter @lernivox/database db:generate` before package builds.
    - Updated `docs/DEPLOYMENT_GUIDE.md` build commands across Sections 4.2, 4.3, 4.4, and Section 7 Phase 3.
    - Verified clean build after deleting `.prisma/client` and `tsconfig.tsbuildinfo`, verified root `pnpm run postinstall` (411ms), verified full Render API and Worker build chains (exit code 0), full monorepo type-check (11/11 tasks passing), monorepo build (7/7 tasks passing), all test suites passing (API 171/171, Worker 21/21, AI-core 25/25, Web 32/32), and zero open ports/processes via `ss -tulpn`.

  - Resolved Production Authentication Failures & Removed Auth-Page Branding:
    - Diagnosed 401 on `/api/v1/auth/refresh`: Identified that modern browsers block `SameSite=Lax` cookies on cross-site asynchronous requests (Vercel `*.vercel.app` to Render `*.onrender.com`), causing unauthenticated 401 on page load/refresh. Implemented dynamic `getCookieOptions()` in `AuthController` with `SameSite=None` and `Secure=true` in production, and added configurable `COOKIE_SAME_SITE` and `COOKIE_SECURE` options.
    - Diagnosed 500 on `POST /api/v1/auth/login`: Traced potential database connection errors (unapplied migrations `P2021` or SSL/connectivity issues `P1001`), token expiry `NaN` errors, and trailing-slash CORS mismatches. Hardened `REFRESH_TOKEN_EXPIRES_IN_DAYS` parsing in `AuthService`, normalized `CORS_ORIGIN` entries in `main.ts`, and added specific diagnostic logging for Prisma error codes in `AllExceptionsFilter`.
    - Documented Chrome extension error: Determined that `Could not establish connection. Receiving end does not exist.` originates from injected third-party extension scripts (e.g. password managers) failing to receive a background port response on pages with `<input type="password">`, completely unrelated to Lernivox application code.
    - Removed visible Lernivox branding from `/login`, `/register`, and `AuthShowcase`: Removed the brand logo and wordmark header block while preserving the editorial headings ("Welcome back.", "Create your account."), all input fields, validation logic, responsive 44px buttons, and top-left "Back to homepage" navigation.
    - Polished frontend API connection error messages in `api.ts` to remove dev-only port references.
    - Verified all test suites across monorepo: API (174/174), Web (34/34), Worker (21/21), AI-core (25/25), full monorepo type-check (11/11 tasks), and production build (7/7 tasks).

  - Fixed Production Registration Failure (Prisma P2021) & Simplified Public Website:
    - Root-cause isolated the production registration 500 from Render logs: `PrismaClientKnownRequestError: The table public.users does not exist in the current database (P2021)`. Render was deploying `lernivox-api` without running `prisma migrate deploy`, leaving the Neon PostgreSQL database unmigrated with zero tables.
    - Automated migrations in Render: Added `preDeployCommand: pnpm db:migrate` and updated `startCommand: pnpm db:migrate && pnpm --filter @lernivox/api start` in `render.yaml`. Added startup table existence check in `PrismaService.onModuleInit()`.
    - Removed all university email restrictions: Changed labels to "Email address", updated placeholders to `you@example.com`, updated Swagger DTOs, and confirmed ordinary consumer domains (Gmail, Outlook, Yahoo, Proton, custom domains) are accepted.
    - Simplified login and registration copy: Heading "Welcome back" with "Sign in to continue learning with your books."; heading "Create your account" with "Enter your details to get started."
    - Mode-aware `AuthShowcase`: Login shows "Your learning continues here." / "Open your books, ask questions, and pick up where you left off."; Register shows "Make every book easier to understand." / "Bring your books or notes and learn at your own pace."
    - Rewrote Free Plan section: Replaced "Freemium" with "Free plan" (0 Birr / forever), accurately described 1 MB PDF/DOCX/TXT uploads and grounded citations; replaced Pro Scholar tier with "Study Groups" (0 Birr / free preview), eliminating all technical jargon (vector indexing, worker queueing, OCR pipelines).
    - Simplified text under all public section headings: Shortened descriptions to 1 short sentence (14–16px typography hierarchy) across Lesson Preview, Retention, Readiness, Study Groups, Pricing, and CTA banner.
    - Removed decorative tags and labels: Removed `Interactive Showcase` and `Interactive Preview` from `HeroUpload.tsx`, `Interactive Lesson Preview` and `Curated Demonstration` from `GuidedLearningPreview.tsx`, and `Free Student Plan • Instant Setup` from CTA banner.
    - Verified test suites: Web tests (36/36 passed), API tests (175/175 passed), monorepo type-check (11/11 tasks passed), and full production build (7/7 packages, 17/17 Next.js static/dynamic routes passed). Port audit verified clean (0 lingering processes).

  - Completed Branded Google Sign-In Coming Soon, Custom 404 & Responsive Loading Experience:
    - Custom Google Sign-In Coming Soon Modal (`GoogleComingSoonModal.tsx`): Intercepts the Google auth trigger on both `/login` and `/register`, completely avoiding broken OAuth redirects or unneeded API requests. Built accessible dialog with `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`, Escape key listener, and `document.body.style.overflow = 'hidden'` scroll locking. Provides context-aware actions: Login mode prompts "Log in with email" (closes dialog, focuses `#email`) and "Need an account? Create one" (`/register`); Register mode prompts "Create account with email" (closes dialog, focuses `#name` or `#email`) and "Already have an account? Log in" (`/login`). Renders as an accessible bottom-sheet on small mobile screens and a centered tactile card on desktop.
    - Custom Branded 404 Page (`apps/web/app/not-found.tsx`): Created dedicated Next.js App Router 404 page styled with Lernivox's aesthetic (`#F4F0E5`, `#FAF8F4`, `#14261D`, `#E8722C`, Bricolage Grotesque, Instrument Sans). Features custom open-book / lost bookmark illustration motif, clear human copy ("This chapter seems to be missing."), and context-aware action routing: primary "Back to Home" (`/`) plus dynamic secondary action ("Go to My Books" `/dashboard` if authenticated, or "Sign In" `/login` if unauthenticated) leveraging `useAuth()`.
    - Responsive Loading Skeletons (`apps/web/components/ui/loading.tsx`): Built accessible loading primitives (`Skeleton`, `InlineLoader`, `BookCardSkeleton`, `DashboardSkeleton`, `WorkspaceSkeleton`) respecting `motion-reduce:animate-none`.
    - Dashboard & Workspace Loading Integration: Wired `DashboardSkeleton` into `apps/web/app/(workspace)/dashboard/loading.tsx` and `BookCardSkeleton` 5-column grid into `apps/web/app/(workspace)/dashboard/page.tsx` (eliminating cumulative layout shifts). Wired `WorkspaceSkeleton` into `apps/web/app/(workspace)/dashboard/workspaces/[workspaceId]/loading.tsx` and `page.tsx` during `loadingWorkspace`, accurately previewing the 3-zone header, desktop outline and copilot sidebars, natural book page canvas, and mobile bottom dock.
    - Authoring Invariant Tests (`apps/web/test/loading-and-404-experience.test.ts`): Authored 3 comprehensive architectural tests validating modal accessibility, OAuth interception, context-aware 404 routing, and skeleton layout mirroring.
    - Verified test suites: Web tests (39/39 passed across 4 suites), monorepo type-check (11/11 package tasks passed with 0 errors), Next.js production build (`next build` 17/17 routes passed including `/_not-found`), and port audit verified clean (`ss -tulpn` 0 lingering processes).

  - Completed Freemium Pricing Restoration, CTA / Footer Copy Polish & Accessible Authentication Validation:
    - Restored Freemium Pricing Display (`apps/web/app/(marketing)/page.tsx`): Restored visible plan name "Freemium" and displayed price "999 Birr per month" on the right pricing card; removed the unintended "0 Birr" / "during preview" and "Free preview" badge; preserved the clean two-card contrast layout and all feature bullets.
    - Improved CTA / Callout Section (`apps/web/app/(marketing)/page.tsx`): Updated headline to "Your next book is ready to be understood.", description to "Bring your books or notes. Read, ask questions, and learn at your own pace.", primary button to "Get started" (`/register`), secondary button to "Upload a book or notes" (`#how-it-works`), and micro indicator to "Private book storage. Instant setup."
    - Improved Footer Copy (`apps/web/components/marketing/Footer.tsx`): Added concise descriptive copy under the brand wordmark ("Bring your books and notes. Read, ask your AI tutor questions, and understand more as you learn.") and updated bottom attribution to "Turn textbooks into real understanding" while preserving all navigation destinations and responsive behavior.
    - Accessible Frontend Validation & Custom Error UI (`apps/web/app/(auth)/login/page.tsx` & `register/page.tsx`): Added field-level blur and submit validation for email, password, and confirm password with clear inline errors, error borders, `noValidate`, `aria-invalid`, `aria-describedby`, and focus trapping to the first invalid field. Mapped auth-wide error messages (401 credentials, 409 conflict with login link, 500 server error, network errors).
    - Production Database & 401 Investigation: Confirmed missing `public.users` table is resolved via `render.yaml` automated migration command (`pnpm db:migrate && pnpm --filter @lernivox/api start`). Confirmed `POST /api/v1/auth/refresh` 401 response is standard unauthenticated session-check behavior with zero retry loops.
    - Verified all test suites: Web tests (41/41 passing across 4 suites), API tests (175/175 passing across 14 suites), full monorepo type-check (11/11 package tasks passing with 0 errors), and Next.js 15 production build (`next build` 17/17 routes).

  - Fixed Worker Wake-Up Reliability, Verified Document Ingestion Pipeline & Redesigned My Books Dashboard:
    - Diagnosed Worker Wake HTTP 429 Root Cause: Live Upstash Redis inspection confirmed Job ID 1 was queued for document `37d136d9-3e1f-41b3-adce-6b353931e348`. The API received HTTP 429 when calling `POST https://lernivox-worker.onrender.com/internal/wake` because Render's shared egress IP/Cloudflare edge throttles bursts of requests across Render Free web services. Because the wake call failed, the sleeping worker container did not boot in time, leaving the document in `UPLOADED` state with `processingProgress: 0%` until the user deleted it.
    - Implemented Dual-Path Health Probe Fallback in API (`apps/api/src/common/worker-wake/worker-wake.service.ts`): If the wake POST receives 429 or times out, the service probes `GET /healthz`. Since any incoming HTTP traffic triggers Render Free to boot the container, once `/healthz` returns 200 OK, the worker container is confirmed active, connected to Redis, and automatically consuming BullMQ jobs without requiring further wake calls. Added cool-down tracking to prevent edge rate-limit compounding.
    - Enhanced Worker Control HTTP Server (`apps/worker/src/server/worker-http.service.ts` & `apps/worker/src/health/worker-health.service.ts`): Added `HEAD` method support alongside `GET` on `/healthz` and `/readyz` for edge checkers; made `/internal/wake` idempotent returning `200 OK` (`status: 'awake'`) when already initialized; added dynamic `REDIS_URL` parsing so Upstash Redis host and TLS port are correctly reflected on `readyz`.
    - Added BullMQ Queue Cleanup on Document Deletion (`apps/api/src/documents/documents.service.ts`): When a document is deleted, any pending or waiting ingestion jobs in Redis are now safely removed from the queue.
    - Harmonized Authenticated Navbar (`apps/web/app/(workspace)/layout.tsx`): Aligned container width to `max-w-[1380px] px-4 sm:px-6 md:px-10 h-16 md:h-20`, background to `bg-[#F4EFE4]/95 backdrop-blur-sm`, and border to `border-b-[1.5px] border-[#1B3428]/10` to achieve visual continuity with the marketing homepage navbar.
    - Unified Search & Filters Toolbar (`apps/web/app/(workspace)/dashboard/page.tsx`): Replaced disjointed controls with a single parchment toolbar (`bg-[#FAF8F4] border border-[#1B3428]/10 rounded-2xl`), featuring a prominent white search input (`bg-[#FFFFFF] rounded-xl`) with placeholder `"Search your books..."`, search icon, clear button, and format pills (`All Materials`, `PDF`, `DOCX`, `TXT`).
    - Redesigned 1:1.45 Digital Book Cards (`apps/web/components/workspace/BookCard.tsx`): Replaced ordinary cards with digital books featuring standard `aspect-[1/1.45]` proportions, left-edge spine crease (`w-3 sm:w-4 bg-gradient-to-r from-black/35 via-black/15 to-transparent`), right-side page-edge bevel (`border-r-[4px] border-r-[#FAF8F4]/80 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.2)]`), bound corners (`rounded-l-xs rounded-r-xl`), and natural serif title wrapping.
    - Consolidated Processing State: Removed duplicate "Preparing" badge from inside the cover; created a single, uncluttered status block below the cover with stage label, percentage, slim progress bar, and descriptive status; updated the action button to a clean disabled state ("Preparing Material" with spinner), eliminating redundant percentages.
    - Bookshelf Shelf Grounding: Added subtle shelf grounding lines (`after:h-[6px] after:bg-gradient-to-b after:from-[#1B3428]/15 after:to-transparent`) beneath the book rows in the responsive 6-column grid (`grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`).
    - Enhanced Empty States: Refined empty library container with friendly copy and direct "Add Your First Book" button; added warm compact treatment for "Shared with Me".
    - Updated Loading Skeletons (`apps/web/components/ui/loading.tsx`): Updated `BookCardSkeleton` to match exact `aspect-[1/1.45]` proportions, spine crease, and page-edge bevel.
    - Authored Automated Architectural Invariant Tests (`apps/web/test/loading-and-404-experience.test.ts`): Verified navbar alignment, unified toolbar, 1:1.45 book geometry, and non-redundant processing state.
    - Verified all test suites: Web tests (42/42 passed across 4 suites), API tests (175/175 passed across 14 suites), Worker tests (21/21 passed across 5 suites), full monorepo type-check (11/11 package tasks passed with 0 errors), and Next.js 15 production build (7/7 packages, 17/17 routes). Port audit verified clean (`ss -tulpn` 0 lingering processes).








