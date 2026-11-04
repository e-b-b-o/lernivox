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
| **Phase 4** | **Optional AI Learning Plans** | Planned | AI-assisted structured study sequences, adaptive recommendations based on quiz performance. |

---

## 6. Current Task Record

- **Task**: Unified Reading Workspace, Companion Study Tools, Text Selection & Responsive Architecture
- **Status**: **Complete**
- **Objective**:
  1. Permanent Textbook & TOC: Establish the original textbook reader and Table of Contents as permanent workspace components that never unmount, reload, or lose state when switching companion tools.
  2. Eliminate "Read" as a Study Mode: Completely remove `Read` from the study-mode switcher, mobile navigation, and workspace state. Study modes are strictly `Quizzes | Flashcards | My Progress`.
  3. Independent AI Tutor Companion Tool: Provide dedicated access to AI Tutor through an explicit action rather than a redundant study mode tab.
  4. Professional PDF & Workspace Text Selection: Diagnose and fix native text selection failures in PDF.js and text content (eliminate root-level `select-none`, restore text-layer alignment, provide contextual selection toolbar with `Copy`, `Ask AI`, and `Practice`).
  5. Isolated Rendering Performance: Ensure switching between `Quizzes`, `Flashcards`, `My Progress`, and `AI Tutor` never re-renders or reloads `DocumentReader` and `DocumentOutlinePane`.
  6. Desktop Three-Zone True-Center Grid: Balanced `grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]` with Zone 1 (brand, outline toggle, document title), Zone 2 (mathematically centered Quizzes/Flashcards/Progress + dedicated AI Tutor action), Zone 3 (`← Books` + `ProfileMenu`).
  7. Mobile Architecture & Auto-Hide: Single 48px top bar (back button, running title + page, avatar) and 56px bottom thumb dock (`Outline`, `Practice`, `AI Tutor` with NO `Read`), with scroll-aware auto-hide (down >60px, up ~10px) suspended during text selection and modal interactions.
  8. Secondary PDF Toolbar & Fluid Widths: Continuous/embed 2-state toggle, centered `< Page X / Y >` with chevron jump controls, compact bookmark ribbon toggle, and responsive container widths (`w-[96%]` mobile, `w-[94%]` tablet, `max-w-4xl` desktop).

- **Work Completed**:
  - **Permanent Reading Workspace & Mode Isolation**:
    - Removed `read` completely from `WorkspaceViewMode` in `TutorHeader.tsx` and `page.tsx`. Study modes strictly: `Quizzes | Flashcards | My Progress`.
    - Defined `CompanionToolMode = 'ai-tutor' | 'quizzes' | 'flashcards' | 'progress'`.
    - Wrapped both `DocumentReader` and `DocumentOutlinePane` in `React.memo` with stable props and callback identities. Neither component re-renders or unmounts when toggling companion tools.
    - Verified with automated tests in `apps/web/test/workspace-architecture.test.ts` (6/6 assertions passing).
  - **Desktop Balanced Three-Zone Navigation**:
    - Rebuilt `TutorHeader.tsx` on a true-center CSS grid `grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] h-14`.
    - **Zone 1**: Terracotta squircle brand icon + bold `Lernivox` wordmark, vertical separator `h-5 w-px bg-[#1B3428]/15`, compact tactile `Outline` button, truncated document title (`max-w-[160px] xl:max-w-[260px] 2xl:max-w-[320px]`), and workspace type badge/controls.
    - **Zone 2**: Mathematically centered segmented control (`Quizzes | Flashcards | My Progress`) styled with `whitespace-nowrap px-3 sm:px-4 py-1.5 font-display font-bold text-xs`, plus separate tactile `AI Tutor` button (`Sparkles` + label) with active state highlighting.
    - **Zone 3**: Tactile bordered `← Books` button navigating to `/dashboard`, and compact circular avatar `ProfileMenu`. Zero duplicate Ask AI button.
  - **Mobile Workspace Architecture (<768px) & Immersive Auto-Hide**:
    - Implemented single 48px mobile header: 32x32 back button `←`, single-line running document title and page progress (`doc.title • p. X/Y`), and 32x32 circular profile menu.
    - Implemented 56px mobile thumb dock (`fixed bottom-0 inset-x-0 h-14 bg-[#FAF8F4]/95 backdrop-blur-md`): `Outline`, `Practice`, `AI Tutor` (strictly zero `Read` button; textbook is the default resting state).
    - `Practice` dock button opens a dedicated bottom sheet (`h-[85vh] rounded-t-3xl`) containing segmented tabs for Quizzes, Flashcards, and Progress with mutual exclusion.
    - Added scroll-aware auto-hide on `#pdf-scroll-container`: translates top header `-translate-y-full` and bottom dock `translate-y-full` on scroll down >60px, restores immediately on scroll up ~10px or canvas tap. Auto-hide is suspended when text selection is active or a drawer/sheet is open.
  - **Professional Text Selection & PDF.js Text-Layer Restoration**:
    - Diagnosed root causes:
      1. Root-level `select-none` on outer workspace shell in `page.tsx` cascaded to child containers, suppressing browser native text selection.
      2. Misalignment in `ContinuousPdfPage` caused by flexbox centering (`justify-center`) shifting canvas independently of the absolutely positioned `.textLayer`.
      3. Missing PDF.js text-layer rules (`.endOfContent`, `user-select: text !important`, `pointer-events: auto !important`).
      4. Missing selection toolbar preventDefault on mousedown, which caused button clicks to collapse active selections before execution.
      5. Non-PDF extracted notes view lacked `select-text` styling.
    - Solutions implemented:
      - Removed `select-none` from root workspace `div` in `page.tsx`; applied `select-none` strictly to non-reading chrome toolbars and buttons.
      - Added comprehensive `.textLayer` styles with `user-select: text !important`, `-webkit-user-select: text !important`, `.endOfContent` handling, and terracotta highlight tint `rgba(232, 114, 44, 0.25)` in `apps/web/styles/globals.css`.
      - Locked `ContinuousPdfPage` canvas and textLayer into a shared container with matching dimensions `width: ${pageWidth}px; height: ${actualHeight}px;` without flex-centering offsets.
      - Created responsive contextual floating selection toolbar:
        - `Copy`: Copies text to clipboard via `navigator.clipboard.writeText` with word boundaries, displaying green "Copied!" checkmark feedback for 2s.
        - `Ask AI`: Opens AI Tutor companion sidecar (or mobile sheet) with document title, page number, chapter name, and verbatim excerpt.
        - `Practice`: Contextual practice launcher for the current page.
        - Added `onMouseDown={(e) => e.preventDefault()}` across toolbar buttons to prevent selection collapse.
        - Viewport boundary clamping ensures toolbar never clips outside screen bounds.
      - Added `select-text` and `-webkit-user-select: text` to non-PDF extracted notes `<article>` and `<p>` elements.
  - **Secondary PDF Toolbar & Reading Widths**:
    - Compact 2-state view mode icon toggle: `Continuous` (BookOpen) vs `Embed` (Eye).
    - Centered page indicator with previous/next chevron buttons (`< Page 3 / 10 >`) and numeric jump input.
    - Compact bookmark ribbon toggle: outline when inactive, terracotta fill (`#E8722C`) when active on visible page.
    - Responsive reading widths: mobile `<640px` `w-[96%] max-w-full mx-auto px-1`, tablet `640px–1024px` `w-[94%] max-w-3xl mx-auto px-4`, desktop `≥1024px` `max-w-4xl w-full mx-auto py-6 px-8`.
  - **Unified Companion Sidecar**:
    - Consistent 44px header height across all 4 modes (`AI Study Tutor`, `Quizzes & Tests`, `Flashcard Decks`, `My Progress`) with right collapse button (`PanelRightClose`).
    - Standardized primary generator CTAs to terracotta `#E8722C` with tactile shadow `#B26E45`.
    - Right-edge vertical companion anchor tab (~28px wide) when sidecar is collapsed.

- **Files Created / Modified**:
  - `apps/web/styles/globals.css` (enhanced textLayer selection rules, selection tint, readable text classes)
  - `apps/web/components/workspace/TutorHeader.tsx` (three-zone true-center grid, removed Read, independent AI Tutor, non-wrapping tablet tabs)
  - `apps/web/components/workspace/DocumentReader.tsx` (memoized reader, aligned canvas/textLayer, contextual Copy/Ask AI toolbar, centered `< Page X / Y >`, fluid widths)
  - `apps/web/components/workspace/DocumentOutlinePane.tsx` (memoized outline pane)
  - `apps/web/app/(workspace)/dashboard/workspaces/[workspaceId]/page.tsx` (eliminated select-none on root, isolated companion mode state, mobile 48px header & 56px dock, Practice sheet, auto-hide on scroll)
  - `apps/web/package.json` (added test script)
  - `apps/web/test/workspace-architecture.test.ts` (new automated architectural invariant test suite)
  - `PROGRESS.md`

- **Verification Results**:
  - `pnpm --filter @lernivox/web test`: 6/6 architectural tests passed (100% pass on Read elimination, 3-zone grid, mobile dock, memoized reader, selectable text, and secondary toolbar).
  - `pnpm --filter @lernivox/ai-core test`: 4/4 test suites, 20/20 unit tests passed.
  - `pnpm --filter @lernivox/api test`: 11/11 test suites, 129/129 unit tests passed.
  - `pnpm --filter @lernivox/worker test`: 4/4 test suites, 11/11 unit tests passed.
  - `pnpm type-check`: 11/11 packages type-checked with 0 errors across the entire monorepo.
  - `pnpm --filter @lernivox/web build`: Next.js 15 production build compiled 17/17 static/dynamic routes with exit code 0.
  - `ss -tulpn`: Process and port check confirmed zero orphaned processes or leaked ports.

- **Processes & Ports**:
  - Cleaned up: No agent-spawned background processes or dev servers remaining.

- **Next Recommended Action**:
  - Launch live development environment (`pnpm infra:up && pnpm dev:all`) and verify interactive mouse text-selection, copy-to-clipboard, Ask AI contextual drawer opening, and mobile auto-hide in a live browser.

---

## 7. Update History

- **2026-11-04 (Part 3)**:
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

