# Lernivox

Lernivox is an AI-powered, document-first learning platform. Instead of restricting learners to predefined courses, it lets users bring their own study materials—books, PDFs, Word documents, and text notes—and build a complete learning environment directly around those sources.

Inside Lernivox, learners read their materials in dedicated workspaces, ask source-grounded questions, generate quizzes and spaced-repetition flashcards tied to specific chapters or page ranges, follow structured learning plans, track objective progress, and study alongside peers in shared group spaces.

**Live Demo:** [Explore Lernivox](https://lernivox.vercel.app)

---

## The Problem Lernivox Solves

Most digital study tools force learners to fragment their workflow across separate applications or abandon their own books for rigid courseware:

- **Static materials lack interactivity:** Learners often already have textbooks, lecture notes, and reference documents, but plain file viewers offer no built-in way to test comprehension or extract guided explanations.
- **Course-centric platforms limit autonomy:** Traditional platforms organize everything around fixed, pre-authored courses rather than adapting to the exact book, syllabus, or document a person needs to master.
- **Independent study can stall on dense topics:** Working through complex sections alone is slow when there is no immediate way to ask targeted follow-up questions anchored to a confusing passage.
- **Generic AI chats are not source-grounded:** Standard chat interfaces rarely maintain structured chapter boundaries, chunk retrieval, and verifiable citations linked back to the learner's own textbook pages.
- **Tool fragmentation breaks focus:** Students routinely juggle a PDF reader, a separate flashcard deck app, ad-hoc quiz prompts, spreadsheets for study plans, and chat apps when studying in groups.
- **Group study mixes discussion with private study:** Studying the same book with classmates often splits shared resource management from individual practice and private AI questions.

Lernivox brings reading, grounded AI tutoring, practice assessments, progress tracking, and peer collaboration into a single workspace anchored to the document itself.

---

## Main Features

### Document-Based Learning
- Upload supported study materials (`.pdf`, `.docx`, `.doc`, and `.txt`) to automatically provision a dedicated persistent workspace (`1:1` document-to-workspace model).
- Background ingestion extracts text, builds structured outlines/sections, segments passages into overlapping chunks, and stores vector embeddings for retrieval.
- Organize materials from a searchable, filterable library dashboard (`My BOOKS`) displaying active reading progress and ingestion states.

### AI Learning Assistant
- Ask questions scoped directly to the uploaded material in natural language.
- Receive contextual explanations grounded in retrieved source chunks with verifiable source citations and page/excerpt previews.
- Study across any subject represented by the uploaded material rather than selecting from a preset catalog.

### In-Platform Reading Experience
- Read PDFs (`pdfjs-dist` with native selectable text layer) and DOCX documents (`docx-preview`) inside a virtualized reader built with `@tanstack/react-virtual`.
- Navigate via extracted document outlines, section headings, or page jumps without leaving the workspace.
- Automatically save and restore last reading position along with user-created passage bookmarks and snippets.
- Launch contextual AI queries or practice sessions directly from selected passages or outline chapters.

### Practice, Revision, and Progress Tracking
- **Range-Grounded Quizzes:** Generate assessments scoped to the entire book, specific outline chapters, or custom page/chunk ranges across multiple-choice, short-answer, fill-in-the-blank, and true/false questions, with attempt history and a dedicated missed-questions review queue.
- **Flashcards with SM-2 Spaced Repetition:** Generate chapter- or passage-grounded decks and review cards using the SuperMemo SM-2 algorithm (`Again`, `Hard`, `Good`, `Easy`) tracking individual ease factor, interval, and next review date.
- **Adaptive Learning Plans:** Create structured, source-backed study schedules broken into sessions, log completed study activities, and pause, resume, or adapt plans based on recorded progress.
- **Objective Progress Tracking:** Monitor reading completion, quiz accuracy, flashcard retention, and topic understanding strictly derived from persisted learner activity rather than synthetic scores.

### Personal and Collaborative Workspaces
- Start in private **Personal** workspaces or permanently convert a workspace into a **Group** workspace with shareable, token-hashed invitation links (`7`-day expiry and owner revocation).
- Keep shared material, document outlines, quizzes, and decks synchronized across group members while keeping two separate communication layers: a shared **Group Discussion** thread anchored to book sections and **Private AI Tutor** conversations per member.
- Explicitly share immutable snapshots of helpful AI tutor conversations into the group workspace, while keeping quiz attempts, flashcard reviews, and progress stats private to each learner.

### Account Management
- Register and sign in with email and password using Argon2id password hashing, JWT access tokens, and HTTP-only rotating refresh token cookies.
- Manage account profile details, change passwords (with active session revocation), and persist AI tutor and study reminder preferences.

---

## Technology Stack and Why It Was Chosen

| Technology | Role | Engineering Reason |
|---|---|---|
| **Next.js 15 (App Router)** | Web framework & routing | Provides file-system routing across public pages, auth routes, and authenticated study workspaces, built-in static optimization, and clean font/asset bundling. |
| **React 19** | UI component architecture | Supports stateful, interactive interfaces across the virtualized document reader, real-time AI tutor drawer, quiz runner, and SM-2 flashcard study view. |
| **TypeScript** | Language across all apps & packages | Enforces shared compile-time contracts (`@lernivox/contracts`) between frontend forms/hooks, NestJS DTOs, database queries, and worker job payloads. |
| **Tailwind CSS** | Utility-first styling | Accelerates consistent responsive layout engineering across mobile, tablet, and desktop views without maintaining brittle global stylesheet cascades. |
| **NestJS 11** | Backend API & worker DI framework | Enforces clear domain module boundaries (`auth`, `documents`, `workspaces`, `tutor`, `quizzes`, `flashcards`, `learning-plans`) with built-in validation pipes, guards, and Swagger generation. |
| **PostgreSQL 16** | Primary relational database | Gives ACID guarantees for multi-user workspaces, role authorization, one-way personal-to-group workspace invariants (enforced in services and database triggers), and relational learning histories. |
| **Prisma ORM 7 (`@prisma/adapter-pg`)** | Type-safe data access & migrations | Keeps schema evolution explicit via SQL migrations while exposing strongly typed query models to both the API and worker services. |
| **pgvector** | Vector similarity storage & search | Stores `768`-dimension chunk embeddings alongside relational metadata inside PostgreSQL with HNSW cosine indexes, avoiding the operational overhead of synchronizing a separate vector database. |
| **Redis 7** | Queue broker & coordination store | Provides low-latency persistence for BullMQ job queues, retries, backoff state, and job deduplication across stateless API and worker instances. |
| **BullMQ** | Asynchronous background job system | Manages reliable queueing, exponential retries, stalled-job locks, and deterministic job IDs for document ingestion, quiz generation, flashcard generation, and AI orchestration. |
| **Cloudinary** | Production object storage adapter | Implements the provider-agnostic `@lernivox/storage` interface cleanly alongside a local filesystem adapter for offline development. |
| **Google Gemini** | LLM & text embeddings (`@lernivox/ai-core`) | Powers document chunk embeddings (`gemini-embedding-2`) and grounded tutoring, evaluation, quiz, flashcard, and study-plan generation behind an abstracted provider interface. |
| **PDF.js, docx-preview & TanStack Virtual** | Client document rendering | Renders native selectable PDF text layers and formatted DOCX views with virtualized windowing so large multi-hundred-page textbooks stay responsive in the browser. |
| **pdf-parse & mammoth** | Server-side text extraction | Reliably extracts raw text and page/section structure from uploaded PDF and DOCX/DOC files inside the background worker. |
| **pnpm & Turborepo** | Monorepo tooling | Shares local packages (`@lernivox/contracts`, `@lernivox/database`, `@lernivox/ai-core`, `@lernivox/storage`) cleanly with cached task pipelines for `build`, `lint`, `type-check`, and `test`. |

### Why Document Ingestion Is Asynchronous

Parsing multi-hundred-page PDFs, normalizing text, computing overlapping semantic chunks, requesting external embedding vectors for every chunk, and generating structured quizzes or flashcard decks can take tens of seconds and consume significant memory. Running that pipeline inside a synchronous HTTP request would cause gateway timeouts, block API event loops, and risk partial database writes if a client disconnects.

Instead, the NestJS API validates the upload, persists the file and initial database record (`QUEUED`), enqueues a deduplicated BullMQ job in Redis, and returns immediately (`HTTP 201`). A dedicated NestJS worker consumes those jobs independently with explicit lock durations, automatic retry handling, and status updates (`PROCESSING` → `READY` or `FAILED`) polled cleanly by the frontend.

---

## System Architecture

Lernivox runs as three coordinated TypeScript applications backed by shared workspace libraries:

1. **Frontend (`apps/web`):** Next.js 15 application serving the marketing landing page, authentication flows, document dashboard, and interactive study workspaces. Communicates with the REST API using credentials-included requests with single-flight silent token refresh.
2. **REST API (`apps/api`):** Modular NestJS server handling authentication, authorization (`PERSONAL` / `GROUP` workspace ownership & membership checks), multipart document upload, reader progress/bookmarks, private tutor chats, group discussions, quizzes, flashcard SM-2 reviews, learning plans, and worker wake/readiness coordination (`WorkerWakeService`).
3. **Background Worker (`apps/worker`):** Standalone NestJS + BullMQ service processing long-running queues (`document-ingestion`, `quiz-generation`, `flashcard-generation`, `ai-orchestration`) while exposing lightweight HTTP control endpoints (`/healthz`, `/readyz`, `/internal/wake`) so free-tier web service deployments can be woken cleanly on demand.
4. **Shared Persistence & Domain Packages (`packages/*`):**
   - `@lernivox/database` manages PostgreSQL + `pgvector` schema, migrations, and HNSW vector similarity helpers.
   - `@lernivox/storage` abstracts document reads/writes across local disk and Cloudinary.
   - `@lernivox/ai-core` implements sliding-window semantic chunking, vector embedding calls, RAG retrieval formatting, and structured LLM prompts with provider fallback support.
   - `@lernivox/contracts` shares TypeScript interfaces, queue constants, and DTO types across apps.

### Document Lifecycle

1. A learner uploads a `.pdf`, `.docx`, `.doc`, or `.txt` file from the dashboard.
2. `apps/api` validates MIME type, extension, and size constraints, stores the raw asset through `@lernivox/storage`, creates the `Document` (`QUEUED`) and paired `PERSONAL` `Workspace` records in PostgreSQL, and enqueues an ingestion job in BullMQ/Redis.
3. If the worker service is hosted behind an on-demand wake endpoint, `WorkerWakeService` triggers and polls readiness asynchronously without blocking the upload response.
4. `apps/worker` pulls the job, downloads the binary from storage, extracts text (`pdf-parse` for PDFs, `mammoth` for DOCX, UTF-8 decoding for text), extracts section structure, and segments content into overlapping chunks.
5. For each chunk batch, `@lernivox/ai-core` generates `768`-dimension vector embeddings and `apps/worker` persists chunks + `pgvector` embeddings transactionally, updating the document status to `READY` (or `FAILED` on unrecoverable errors after BullMQ retries).
6. The frontend detects `READY` status via bounded polling and unlocks the full workspace for reading, bookmarking, source-grounded AI tutoring, quiz/flashcard generation, learning plans, and optional group collaboration.

---

## Project Structure

```text
lernivox/
├── apps/
│   ├── web/                     # Next.js 15 frontend (App Router, Tailwind CSS, PDF.js / DOCX viewer)
│   ├── api/                     # NestJS 11 REST API (auth, workspaces, documents, AI features, Swagger)
│   └── worker/                  # NestJS + BullMQ background worker & HTTP health/wake endpoints
├── packages/
│   ├── ai-core/                 # Text chunking, Gemini/mock AI providers, RAG prompt & generation logic
│   ├── contracts/               # Shared DTOs, queue names, job payloads, and auth/domain types
│   ├── database/                # Prisma 7 schema, SQL migrations, pgvector HNSW setup & seeding
│   ├── storage/                 # Provider-agnostic StorageService (Local disk & Cloudinary adapters)
│   ├── eslint-config/           # Shared workspace ESLint 8 rulesets
│   └── typescript-config/       # Shared tsconfig presets (base, Next.js, NestJS)
├── infra/
│   └── docker/                  # Docker Compose for local PostgreSQL 16 (pgvector) & Redis 7
├── docs/                        # Product, architecture, API, and design documentation
├── .env.example                 # Template of required and optional environment variables
├── .nvmrc                       # Pinned Node.js version (24)
├── package.json                 # Root workspace scripts and Turborepo orchestration
├── pnpm-workspace.yaml          # pnpm workspace boundaries
├── turbo.json                   # Turborepo task dependency pipeline
└── render.yaml                  # Render Blueprint configuration for lernivox-api & lernivox-worker
```

---

## Running Locally

### Prerequisites

- **Node.js `24`** (matching [`.nvmrc`](./.nvmrc))
- **pnpm `>= 9`** (repository `packageManager` uses `pnpm@12.5.1`)
- **Docker & Docker Compose** (for PostgreSQL 16 with `pgvector` and Redis 7)
- *(Optional for live AI generation & cloud file uploads)* Google Gemini API key (`GEMINI_API_KEY`) and Cloudinary account (`CLOUDINARY_URL`). By default, `.env.example` uses `STORAGE_DRIVER=local` for disk uploads during development.

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/e-b-b-a/lernivox.git
cd lernivox
pnpm install
```

### 2. Configure Environment Variables

Copy the environment template at the repository root and fill in any optional provider keys:

```bash
cp .env.example .env
```

Core variables documented in [`.env.example`](./.env.example):
- **Server & Frontend URLs:** `PORT`, `WORKER_PORT`, `CORS_ORIGIN`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`
- **Database & Cache:** `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, `REDIS_HOST`, `REDIS_PORT`
- **Authentication:** `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN_DAYS`, `COOKIE_SECURE`, `COOKIE_DOMAIN`
- **AI & Storage Providers:** `AI_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_EMBEDDING_MODEL`, `STORAGE_DRIVER`, `CLOUDINARY_URL`

> Never commit real API keys, database URLs, or secrets into version control.

### 3. Start Local Infrastructure

Start PostgreSQL 16 (`pgvector`, mapped to host port `5433` to avoid local `5432` conflicts) and Redis 7 (`6379`):

```bash
pnpm infra:up
```

### 4. Generate Prisma Client and Run Migrations

```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Start the Development Servers

Run all three applications concurrently via Turborepo:

```bash
pnpm dev
```

Or launch services individually in separate terminals:

```bash
pnpm --filter @lernivox/web dev     # Next.js frontend: http://localhost:3000
pnpm --filter @lernivox/api dev     # NestJS REST API:  http://localhost:4000/api/v1
pnpm --filter @lernivox/worker dev  # BullMQ Worker & health server (WORKER_PORT=4001)
```

### 6. Verification & Quality Commands

```bash
pnpm lint        # Run ESLint across workspace packages
pnpm type-check  # Run TypeScript compiler checks across all packages
pnpm test        # Execute unit and integration test suites
pnpm build       # Build shared packages, API, worker, and Next.js production bundle
```

---

## Deployment Overview

The live environment splits frontend delivery, stateful API/worker execution, persistence, and AI inference across specialized managed services (defined in [`render.yaml`](./render.yaml) for backend services):

- **Vercel (`apps/web`):** Hosts the Next.js 15 frontend application at `https://lernivox.vercel.app` and serves static and App Router routes globally.
- **Render (`apps/api` & `apps/worker`):** Runs `lernivox-api` and `lernivox-worker` as Node.js Free Web Services. Because Render Free services spin down after inactivity, the API's `WorkerWakeService` wakes `lernivox-worker` via `/internal/wake` and probes `/readyz` before/during ingestion polling while the client UI surfaces honest waiting states (`Worker starting...`, `Queued`, `Delayed`).
- **Neon:** Managed PostgreSQL with the `pgvector` extension enabled (`DATABASE_URL`), preserving schema data and HNSW vector indexes independently of Render's ephemeral filesystem.
- **Upstash:** Managed TLS Redis (`rediss://` via `REDIS_URL`) powering BullMQ queues and job state.
- **Cloudinary (`CLOUDINARY_URL`):** Durable cloud object storage for uploaded user documents across ephemeral API and worker containers.
- **Google Gemini (`GEMINI_API_KEY`):** Handles document embeddings and LLM inference for grounded tutoring, assessments, flashcards, and learning plans.
