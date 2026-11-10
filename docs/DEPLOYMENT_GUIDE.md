# Lernivox — Production & Free-Tier Deployment Guide

**Audience**: Application Owner, Technical Founders, Full-Stack Developers  
**Stack**: Monorepo (`pnpm workspaces` + `Turborepo`), Next.js 15 (App Router), NestJS 12, TypeScript 5, PostgreSQL 16 (+ `pgvector`), Redis 7 (+ BullMQ), Cloudinary / Cloudflare R2  
**Date of Limit Verification**: November 2026  

---

## 1. Architecture Overview: What Needs to Be Deployed?

Lernivox is architected as a cohesive TypeScript monorepo. It requires deploying **3 code execution services** and provisioning **3 managed infrastructure resources**.

```text
                                 [ Users / Browsers ]
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    Service 1: Next.js Web Frontend    │
                      │    (apps/web — SSR & React 19 Client) │
                      └───────────────────┬───────────────────┘
                                          │  HTTPS / WSS / REST
                                          ▼
                      ┌───────────────────────────────────────┐
                      │      Service 2: NestJS Core API       │
                      │       (apps/api — Modular Backend)    │
                      └──────────────┬────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  Resource 1:     │       │  Resource 2:     │       │  Resource 3:     │
│  PostgreSQL 16   │       │  Redis 7 Cache   │       │  Object Storage  │
│  + pgvector      │       │  & Message Queue │       │  (Cloudinary/R2) │
└────────┬─────────┘       └────────┬─────────┘       └────────┬─────────┘
         ▲                          ▲                          ▲
         │                          │ BullMQ Job Enqueue       │
         │                          │ & State Tracking         │
         │                          ▼                          │
         │            ┌───────────────────────────┐            │
         └────────────┤ Service 3: BullMQ Worker  ├────────────┘
                      │ (apps/worker — Ingestion) │
                      └───────────────────────────┘
```

### The 3 Deployable Code Services

| Service | Monorepo Path | Role & Runtime | HTTP Exposure |
| :--- | :--- | :--- | :--- |
| **Web Frontend** | `apps/web` | Next.js 15 App Router, React 19, Tailwind CSS. Delivers the marketing homepage, dashboard bookshelf, virtualized reader, quizzes, flashcards, and settings. | **Public** (Ports 80/443) |
| **Core API** | `apps/api` | NestJS REST API, authentication (JWT + HttpOnly refresh cookies), workspace access controls, document APIs, tutor streaming endpoints. | **Public** (Port 4000) |
| **Background Worker** | `apps/worker` | Dedicated TypeScript BullMQ worker. Handles CPU/memory-intensive tasks: document parsing, chunking, OpenAI/Gemini vector embeddings, quiz/flashcard generation, and plan recalculations. | **Private / Internal** (No public HTTP port required) |

### The 3 Managed Infrastructure Resources

| Resource | Recommended Provider | Engine & Features Required |
| :--- | :--- | :--- |
| **Database** | Neon or Supabase | PostgreSQL 16 with the **`pgvector`** extension enabled. Stores user profiles, workspaces, documents, chapters, text chunks, 768-dim vector embeddings, quizzes, and learning plans. |
| **Queue & Cache** | Upstash Redis | Redis 7 with standard **Redis TCP/TLS protocol**. Powers BullMQ job queues, concurrency locks, and real-time processing signals. *(Note: HTTP REST endpoints cannot power BullMQ workers).* |
| **Object Storage** | Cloudinary or Cloudflare R2 | S3-compatible or Cloudinary storage for uploaded textbook PDFs and documents up to 1 MiB. Prevents storing user files on ephemeral web server filesystems. |

### Internal Packages (Never Deployed Separately)

The packages inside `packages/*` are shared internal dependencies:
- `packages/database`: Prisma schema, client, and migrations.
- `packages/contracts`: Shared TypeScript types, API contracts, and DTOs.
- `packages/ai-core`: LLM provider abstractions, chunking logic, and prompt templates.
- `packages/storage`: Storage adapter interface and Cloudinary/S3 implementations.
- `packages/typescript-config` & `packages/eslint-config`: Shared configurations.

> [!IMPORTANT]
> **Monorepo Build Context Invariant**: Internal packages are **compiled directly into the applications** (`apps/web`, `apps/api`, `apps/worker`) during the build step. You **never** deploy `packages/database` or `packages/ai-core` as standalone cloud services.

---

## 2. Realistic Free-Tier Hosting Comparison

You can run Lernivox for **$0/month** for portfolio demos, capstone evaluations, and closed student trials. However, free tiers have strict architectural limitations that you must understand before launching.

### Hosting Candidates Evaluated

| Platform & Component | Documented Free Allowance | Critical Limitations | Production Verdict |
| :--- | :--- | :--- | :--- |
| **Vercel Hobby**<br>*(Web Frontend)* | Unlimited deployments, 100 GB bandwidth, 100 fast builds/mo, automatic SSL. | Restricted to **non-commercial, personal use**. 10-second serverless execution cap. | **PASS for Demos / Student Portfolios**.<br>Must upgrade to Pro ($20/mo) for commercial products. |
| **Northflank Sandbox**<br>*(API & Worker)* | 2 services, 2 jobs, 1 database, **$20/month included credit**. **No sleeping on sandbox services**. | Sandbox is intended for testing and small workloads. Shared CPU bursts. Credit cap. | **PASS FOR CONTINUOUS TESTING**.<br>Can run both API and Worker continuously without 15m sleeping. |
| **Render Free Web Services**<br>*(API & Worker)* | 750 free instance-hours/month shared across workspace. Free automatic TLS on `onrender.com`. | **Free Web Services sleep after 15m of inactivity** (causing 50–90s cold starts). Worker requires lightweight HTTP server to qualify as Web Service. Free PostgreSQL **expires after 30 days** (must use external Neon). Free tier lacks private networking. | **PASS FOR DEMOS / PORTFOLIO (WITH WAKE PROTOCOL)**.<br>Fully supported via Lernivox's built-in HTTP control interface and asynchronous wake protocol. **Zero paid background workers required**. |
| **Neon PostgreSQL**<br>*(Database)* | 0.5–1 GB storage, 100 compute-hours/month, native `pgvector` support. | Compute scales to zero after 5 minutes of inactivity (1–3s cold start on first query). 100 compute-hours cap requires careful usage. | **PASS FOR DEMOS / CLOSED BETA**.<br>Fully supports `pgvector`. Scale-to-zero is acceptable for low-volume demos. |
| **Upstash Redis**<br>*(Queue)* | 256 MB storage, **500,000 commands/month**, TLS support, native TCP. | BullMQ workers poll Redis continuously. Unoptimized workers can exhaust 500k commands in 15 days even without active jobs. | **PASS WITH TUNED POLLING**.<br>Must set BullMQ worker `drainDelay` and `stalledInterval` to avoid burning free commands. |
| **Cloudinary**<br>*(Object Storage)* | 25 monthly credits (~25 GB storage or bandwidth). | Bandwidth and transformation limits. | **RECOMMENDED**.<br>Active driver in Lernivox codebase (`STORAGE_DRIVER=cloudinary`). |

### Free vs. Paid Readiness Matrix

| Environment Tier | Target Traffic | Hosting Cost | Infrastructure Setup | Reliability Expectations |
| :--- | :--- | :--- | :--- | :--- |
| **Free Portfolio / Demo** | 1–5 concurrent users | **$0 / month** | Vercel (Web) + Northflank Sandbox (API + Worker) + Neon (DB) + Upstash (Redis) + Cloudinary | Mild cold starts on database (1–3s). Suitable for grading, stakeholder showcases, and personal learning. |
| **Closed Student Beta** | 10–50 students | **$0 – $15 / month** | Same as above, or add Neon Launch tier ($19/mo) to eliminate scale-to-zero compute limits. | Always-on database. Continuous BullMQ worker processing. Real-time document ingestion. |
| **Dependable Commercial** | 100+ active students | **$45 – $75 / month** | Vercel Pro ($20) + Northflank Paid Micro nodes ($15) + Managed PostgreSQL ($20) + Upstash Pro ($10) | 99.9% uptime, daily automated backups, zero sleep, SLA guarantees, point-in-time recovery. |

---

## 3. Recommended Free-Tier Deployment Topology

The recommended zero-cost setup requires **3 platform accounts**:

1. **Vercel** (Account 1): Hosts `apps/web`.
2. **Render or Northflank** (Account 2): Hosts `apps/api` (Web Service) and `apps/worker` (Web Service on Render, or Dedicated Worker on Northflank).
3. **Neon + Upstash + Cloudinary** (Account 3 & Data Providers): Provides managed Postgres, Redis, and file storage.

```text
[ Browser / Client ]
        │
        ├───> (HTTPS) ───> Vercel: apps/web (https://lernivox.vercel.app)
        │
        └───> (HTTPS) ───> Northflank: apps/api (https://api-lernivox.northflank.app)
                                 │
                                 ├───> Neon PostgreSQL: (postgresql://...@ep-...neon.tech/lernivox)
                                 ├───> Upstash Redis:    (rediss://default:...@...upstash.io:6379)
                                 ├───> Cloudinary:       (cloudinary://...)
                                 └───> Gemini AI API:    (Generative Language API)
                                         ▲
                                         │ BullMQ Job Stream
                                         ▼
                           Northflank: apps/worker (Continuous Background Runner)
```

> [!TIP]
> **Data Region Colocation**: Choose the **same cloud region** (e.g., `us-east-1` AWS / Virginia, Oregon, or `eu-central-1` Frankfurt) for Neon, Upstash, and your API/Worker hosts. Cross-region network latency severely degrades vector searches and Redis polling.

---

### 3.1 Render Free Web Services Architecture (Two Free Web Services)

If deploying to **Render**, Lernivox operates entirely within **Render Free Web Services** without purchasing Render Paid Background Workers ($7/mo) or paying for compute:

```text
                               ┌────────────────────────────────────────┐
                               │           Vercel Frontend              │
                               │        (https://lernivox.vercel.app)   │
                               └───────────────────┬────────────────────┘
                                                   │
                                                   │ HTTPS REST Requests
                                                   ▼
                               ┌────────────────────────────────────────┐
                               │   Render Free Web Service 1: API       │
                               │   (https://lernivox-api.onrender.com)  │
                               └─────────────┬────────────────────┬─────┘
                                             │                    │
                      BullMQ Job Enqueue     │                    │ Authenticated HTTP Wake Signal
                      via Redis TCP/TLS      │                    │ (POST /internal/wake)
                                             ▼                    ▼
   ┌───────────────────────────────────────────┐        ┌──────────────────────────────────────────┐
   │          Upstash Redis (TCP/TLS)          │        │ Render Free Web Service 2: Worker        │
   │      Single durable source of truth       │◄───────┤ (https://lernivox-worker.onrender.com)   │
   │      Stores queued ingestion & AI jobs    │        │                                          │
   └───────────────────────────────────────────┘        │ • Listens on 0.0.0.0:$PORT               │
                         ▲                              │ • GET /healthz (Liveness, 200 OK)        │
                         │                              │ • GET /readyz (BullMQ/Redis ready check) │
                         │ Job Dequeue                  │ • POST /internal/wake (Protected signal) │
                         └──────────────────────────────┤ • Processes BullMQ ingestion/AI jobs     │
                                                        └────────────────────┬─────────────────────┘
                                                                             │
                                                                             ▼
                                                        ┌──────────────────────────────────────────┐
                                                        │       Neon PostgreSQL (+ pgvector)       │
                                                        │       Persistent Chunks & 768-dim Vectors │
                                                        └──────────────────────────────────────────┘
```

#### How the Render Free Worker Operates:
1. **Render Free Web Service Qualification**: Render only provides free compute for **Web Services** (services that bind to an assigned port and respond to HTTP requests). Render's "Background Worker" service type has *no free tier* ($7/mo min). To run for free, `apps/worker` includes a native, lightweight Node.js HTTP control server that binds to `0.0.0.0:${PORT}` and serves `/healthz`, `/readyz`, and `/internal/wake`.
2. **Idle Sleep Behavior (15 Minutes)**: Free Web Services on Render automatically sleep after 15 minutes of inactivity to conserve free instance-hours. No keep-alive pingers are used (artificial keep-alive monitors violate Render terms and exhaust the 750 monthly free instance-hours).
3. **Asynchronous Non-Blocking Wake Trigger**: When a student uploads a document or creates a quiz/flashcard deck, `apps/api` adds the job to Upstash Redis and asynchronously issues an authenticated `POST /internal/wake` to the worker's public URL. The upload HTTP response returns to the student in milliseconds without blocking.
4. **Cold-Start Resilience & Coalescing**: Render wakes the sleeping worker upon receiving the HTTP wake request (~50–60s cold start). `WorkerWakeService` coalesces concurrent wake signals so multiple uploads share a single wake request, and retries with backoff and jitter up to 90 seconds.
5. **Throttled Status-Poll Recovery**: When the student's browser polls `/api/v1/documents/:id/status`, if the document remains in `QUEUED` or `UPLOADED` state, the API triggers a throttled wake attempt (at most once every 30 seconds), ensuring jobs are never orphaned even if an initial wake packet was dropped.
6. **Zero Data Loss**: Upstash Redis is the durable queue. Even if the worker is cold-starting or sleeping, jobs remain safely persisted in Redis until the worker wakes and dequeues them. All chunk embeddings are saved permanently in Neon PostgreSQL.

---

## 4. Exact Repository Folder Settings & Build Commands

### 4.1 Web Frontend (`apps/web`) on Vercel

In the Vercel Project Settings:

- **Git Repository**: Connect the Lernivox repository.
- **Framework Preset**: `Next.js`.
- **Root Directory**: `apps/web`.
- **Include source files outside Root Directory**: **`ENABLE` / Checked** (Required because `apps/web` imports from `packages/contracts`).
- **Build Command**: Leave as default (`next build`) or override with `cd ../.. && pnpm --filter @lernivox/web build`.
- **Output Directory**: Leave default (`.next`).
- **Install Command**: `pnpm install`.
- **Node.js Version**: `20.x` or `22.x`.

### 4.2 Backend API (`apps/api`) on Northflank

In Northflank, create a **Combined Service** or **Web Service**:

- **Build Source**: Git Repository.
- **Build Type**: `Buildpack` or `Dockerfile`.
- **Build Context Directory**: **`.` (Repository Root)** *(Do NOT set to `apps/api`! The build requires the root `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `packages/*`)*.
- **Build Command**:
  ```bash
  pnpm install --frozen-lockfile && pnpm --filter @lernivox/database db:generate && pnpm --filter @lernivox/database build && pnpm --filter @lernivox/api build
  ```
- **Start Command**:
  ```bash
  node apps/api/dist/main.js
  ```
- **Port Mapping**: Port `4000` (HTTP) exposed to public web traffic.
- **Health Check Path**: `GET /api/v1/health` (Port 4000).

### 4.3 Background Worker (`apps/worker`) on Northflank

In Northflank, create a **Deployment** / **Background Worker Service**:

- **Build Source**: Git Repository (same branch).
- **Build Context Directory**: **`.` (Repository Root)**.
- **Build Command**:
  ```bash
  pnpm install --frozen-lockfile && pnpm --filter @lernivox/database db:generate && pnpm --filter @lernivox/database build && pnpm --filter @lernivox/worker build
  ```
- **Start Command**:
  ```bash
  node apps/worker/dist/main.js
  ```
- **Port Mapping**: **None** (Workers consume jobs directly from Redis; no external ingress port).
- **Restart Policy**: `Always` / `Unless Stopped`.

### 4.4 Backend API & Background Worker on Render (Two Free Web Services)

You can deploy both services using either the **`render.yaml` Blueprint** or the **Render Dashboard UI**.

#### A. Using Render Blueprint (`render.yaml`)
1. In your Render Dashboard, click **New +** > **Blueprint**.
2. Select your connected Lernivox Git repository.
3. Render automatically detects the root `render.yaml` and sets up both Web Services (`lernivox-api` and `lernivox-worker`).
4. Enter the required non-synced secret environment variables (`DATABASE_URL`, `REDIS_URL`, `GEMINI_API_KEY`, Cloudinary keys, frontend URLs) when prompted.
5. Click **Apply**.

#### B. Manual Creation via Render Dashboard UI
If configuring manually via the Render UI:

**Service 1: `lernivox-api` (Render Free Web Service)**
- **Type**: `Web Service`
- **Name**: `lernivox-api`
- **Region**: `Oregon` (or match your Neon / Upstash region)
- **Branch**: `main`
- **Root Directory**: `.` *(Leave blank or enter `.` — required for monorepo packages)*
- **Runtime**: `Node`
- **Instance Type**: `Free`
- **Build Command**:
  ```bash
  pnpm install --frozen-lockfile && pnpm --filter @lernivox/database db:generate && pnpm --filter @lernivox/contracts build && pnpm --filter @lernivox/database build && pnpm --filter @lernivox/storage build && pnpm --filter @lernivox/ai-core build && pnpm --filter @lernivox/api build
  ```
- **Start Command**:
  ```bash
  pnpm --filter @lernivox/api start
  ```
- **Health Check Path**: `/api/v1/health`
- **Environment Variables**: Add variables from Section 5.2. Note: Set `WORKER_BASE_URL` to `https://lernivox-worker.onrender.com` and generate a shared `WORKER_WAKE_SECRET`.

**Service 2: `lernivox-worker` (Render Free Web Service with HTTP Control)**
- **Type**: `Web Service` *(Select "Web Service", NOT "Background Worker")*
- **Name**: `lernivox-worker`
- **Region**: `Oregon` *(Must match API region)*
- **Branch**: `main`
- **Root Directory**: `.`
- **Runtime**: `Node`
- **Instance Type**: `Free`
- **Build Command**:
  ```bash
  pnpm install --frozen-lockfile && pnpm --filter @lernivox/database db:generate && pnpm --filter @lernivox/contracts build && pnpm --filter @lernivox/database build && pnpm --filter @lernivox/storage build && pnpm --filter @lernivox/ai-core build && pnpm --filter @lernivox/worker build
  ```
- **Start Command**:
  ```bash
  pnpm --filter @lernivox/worker start
  ```
- **Health Check Path**: `/healthz`
- **Environment Variables**: Add variables from Section 5.3. Set `WORKER_WAKE_SECRET` to the exact same string set on `lernivox-api`.

### 4.5 PostgreSQL Database Release Step (Automated in Render Pipeline)

Database migrations run automatically in the Render deployment pipeline via `preDeployCommand` and `startCommand`:

```bash
# Defined in render.yaml and root package.json:
pnpm db:migrate
# Which executes:
pnpm --filter @lernivox/database exec prisma migrate deploy
```

> [!TIP]
> In `render.yaml`, `lernivox-api` is configured with:
> - `preDeployCommand: pnpm db:migrate`
> - `startCommand: pnpm db:migrate && pnpm --filter @lernivox/api start`
>
> This guarantees that whenever Render builds or deploys a new release, pending Prisma migrations are automatically executed against Neon PostgreSQL before the API opens its listening port. If all migrations are already applied, `prisma migrate deploy` verifies schema state in <300ms and exits cleanly with 0.

> [!CAUTION]
> **Never Run `prisma db push` or `prisma migrate reset` in Production**:
> - `prisma migrate deploy` applies verified, checked-in SQL migrations from `packages/database/prisma/migrations`.
> - `prisma migrate reset` will permanently drop all tables and delete user records.

---

## 5. Complete Environment Variable Inventory

Never commit real values to Git. Set these in the respective platform secret dashboards.

### 5.1 Web Frontend (`apps/web` on Vercel)

| Variable | Description | Production Example / Setting |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Public API endpoint reachable from the browser | `https://api-lernivox.northflank.app/api/v1` |

> [!WARNING]
> Only variables prefixed with `NEXT_PUBLIC_` are baked into client-side browser bundles. Never put `DATABASE_URL`, `JWT_SECRET`, or AI API keys in `apps/web`.

### 5.2 Core API (`apps/api` on Render or Northflank)

| Variable | Description | Production Example / Setting |
| :--- | :--- | :--- |
| `NODE_ENV` | Node environment | `production` |
| `PORT` | API listening port | `10000` (Render) or `4000` (Northflank) |
| `DATABASE_URL` | PostgreSQL connection string (with SSL) | `postgresql://user:pass@ep-cool-fog-123.us-east-1.aws.neon.tech/lernivox?sslmode=require&schema=public` |
| `REDIS_URL` | Upstash Redis connection string (TCP/TLS) | `rediss://default:pass@cool-panther-123.upstash.io:6379` *(preferred)* |
| `REDIS_HOST` | Upstash Redis host (if not using REDIS_URL) | `cool-panther-123.upstash.io` |
| `REDIS_PORT` | Upstash Redis TLS port | `6379` |
| `REDIS_PASSWORD` | Upstash Redis password | `your_upstash_redis_password` |
| `REDIS_TLS` | Enable TLS connection for cloud Redis | `true` |
| `WORKER_BASE_URL` | Worker public URL for Render wake signals | `https://lernivox-worker.onrender.com` *(Omit if worker never sleeps)* |
| `WORKER_WAKE_SECRET` | Cryptographic secret for worker wake authentication | `generate-random-base64-string-min-32-characters` |
| `CORS_ORIGIN` | Allowed web frontend origin(s) | `https://lernivox.vercel.app` *(or custom domain)* |
| `FRONTEND_URL` | Root URL of frontend for redirects | `https://lernivox.vercel.app` |
| `JWT_SECRET` | 64+ char high-entropy string for access tokens | `generate-random-base64-string-min-64-characters` |
| `JWT_EXPIRES_IN` | Access token lifetime | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Refresh cookie lifetime | `7` |
| `COOKIE_SECURE` | Enforce HTTPS for authentication cookies | `true` |
| `COOKIE_SAME_SITE` | Cookie SameSite attribute | `none` *(Required for cross-site Vercel + Render domains)* |
| `COOKIE_DOMAIN` | Optional parent domain for subdomains | Leave blank if using separate Vercel/Render domains |
| `AI_PROVIDER` | Active LLM provider | `gemini` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini LLM model | `gemini-2.5-flash` |
| `STORAGE_DRIVER` | File storage driver | `cloudinary` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API access key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your_cloudinary_api_secret` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID (Optional) | `123...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret (Optional) | `GOCSPX-...` |
| `GOOGLE_CALLBACK_URL` | Google OAuth redirect destination | `https://lernivox-api.onrender.com/api/v1/auth/google/callback` |

### 5.3 Background Worker (`apps/worker` on Render or Northflank)

| Variable | Description | Value Matching API |
| :--- | :--- | :--- |
| `NODE_ENV` | Node environment | `production` |
| `PORT` | Worker HTTP control listening port (Render) | `10000` *(assigned automatically by Render)* |
| `DATABASE_URL` | Direct connection to Neon PostgreSQL | **Identical to API** |
| `REDIS_URL` | Upstash Redis connection string (TCP/TLS) | **Identical to API** |
| `REDIS_HOST` | Upstash Redis host (if not using REDIS_URL) | **Identical to API** |
| `REDIS_PORT` | Upstash Redis port | `6379` |
| `REDIS_PASSWORD` | Upstash Redis password | **Identical to API** |
| `REDIS_TLS` | Enable TLS | `true` |
| `WORKER_WAKE_SECRET` | Shared secret to authorize wake requests | **Identical to API WORKER_WAKE_SECRET** |
| `AI_PROVIDER` | Active LLM provider | `gemini` |
| `GEMINI_API_KEY` | Google Gemini API key | **Identical to API** |
| `GEMINI_MODEL` | Gemini LLM model | `gemini-2.5-flash` |
| `STORAGE_DRIVER` | File storage driver | `cloudinary` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier | **Identical to API** |
| `CLOUDINARY_API_KEY` | Cloudinary API access key | **Identical to API** |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | **Identical to API** |

---

## 6. Authentication, Cookies, CORS & Cross-Domain Caveats

Lernivox utilizes a secure authentication model:
- Short-lived Access Tokens (15 minutes).
- `HttpOnly`, `SameSite`, `Secure` Refresh Cookies (7 days).

### Cross-Domain Cookie Rules (Vercel vs. Northflank)

When `apps/web` is hosted on `lernivox.vercel.app` and `apps/api` is on `api-lernivox.northflank.app`:
1. They reside on **different public effective top-level domains (eTLDs)** (`vercel.app` vs. `northflank.app`).
2. Browsers treat cookies sent between them as **third-party cross-site cookies**.
3. For the refresh cookie to be accepted:
   - `COOKIE_SECURE=true` (Must be served over HTTPS).
   - In NestJS cookie settings, `SameSite` must be set to `'none'`.
   - `CORS_ORIGIN` must explicitly match `https://lernivox.vercel.app` (no wildcard `*`).
   - The web client must specify `credentials: 'include'` on every request.

> [!TIP]
> **Best Practice — Custom Domain Strategy**:
> Using your own custom domain (e.g. `$10/year` on Namecheap or Cloudflare) completely eliminates cross-site cookie blocking by third-party tracking protectors:
> - Frontend: `app.yourdomain.com` (Vercel CNAME)
> - API: `api.yourdomain.com` (Northflank CNAME)
> - With shared parent domain (`.yourdomain.com`), cookies use `SameSite: 'lax'`, which Safari and Chrome never block.

---

## 7. Step-by-Step Deployment Walkthrough (From Zero to Running)

Follow these 20 steps in sequential order. Do not skip ahead.

### Phase 1: Managed Cloud Infrastructure Setup

1. **Create Neon PostgreSQL Database**:
   - Sign up at [neon.tech](https://neon.tech).
   - Create a project named `lernivox-production`.
   - Select your preferred region (e.g., US East / AWS `us-east-1`).
   - In the Neon SQL Console, run:
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     ```
   - Copy the connection string: `postgresql://[user]:[password]@[host]/lernivox?sslmode=require`.

2. **Create Upstash Redis Database**:
   - Sign up at [upstash.com](https://upstash.com).
   - Create a Redis database named `lernivox-queue` in the **same region** as your Neon database.
   - Select the **TCP/TLS** connection tab.
   - Note down: `Host`, `Port` (6379), and `Password`.

3. **Create Cloudinary Account for Document Storage**:
   - Sign up at [cloudinary.com](https://cloudinary.com).
   - Retrieve your `Cloud Name`, `API Key`, and `API Secret` from the Dashboard.

4. **Obtain Gemini AI API Key**:
   - Sign up at [aistudio.google.com](https://aistudio.google.com).
   - Create an API key with access to `gemini-3.5-flash` and `gemini-embedding-2`.

### Phase 2: Database Migration Release Step

5. **Apply Prisma Database Migrations**:
   - **Automated**: `render.yaml` automatically executes `pnpm db:migrate` in `preDeployCommand` and `startCommand` on Render.
   - **Manual or One-Time Local Migration**: If deploying manually from the dashboard or testing Neon connectivity locally:
     ```bash
     DATABASE_URL="postgresql://[user]:[pass]@[neon-host]/lernivox?sslmode=require&schema=public" pnpm db:migrate
     ```
   - Verify output: `No pending migrations to apply` or `All migrations have been successfully applied`.

### Phase 3: Backend API & Worker Deployment (Render Free Web Services)

You can deploy the API and Worker to Render using the automated **Blueprint** or by manually creating two Free Web Services:

#### Option A: One-Click Render Blueprint (Recommended)
6. **Deploy via `render.yaml` Blueprint**:
   - Log into [render.com](https://render.com).
   - Click **New +** > **Blueprint**.
   - Connect your GitHub repository (`main` branch).
   - Render reads the root `render.yaml` and provisions two Free Web Services: `lernivox-api` and `lernivox-worker`.
   - Populate the non-synced environment secrets (`DATABASE_URL`, `REDIS_URL`, `GEMINI_API_KEY`, Cloudinary keys).
   - Once `lernivox-worker` is provisioned, set `WORKER_BASE_URL` on `lernivox-api` to `https://lernivox-worker.onrender.com`.
   - Click **Apply**.

#### Option B: Manual Render Free Web Services Creation
6. **Deploy `lernivox-api` (Render Free Web Service)**:
   - Click **New +** > **Web Service**.
   - Connect your repository.
   - Region: Match your Neon / Upstash region (e.g. `Oregon`).
   - Root Directory: `.` (Repository root).
   - Runtime: `Node`. Plan: `Free`.
   - Build Command:
     ```bash
     pnpm install --frozen-lockfile && pnpm --filter @lernivox/database db:generate && pnpm --filter @lernivox/contracts build && pnpm --filter @lernivox/database build && pnpm --filter @lernivox/storage build && pnpm --filter @lernivox/ai-core build && pnpm --filter @lernivox/api build
     ```
   - Start Command: `pnpm --filter @lernivox/api start`
   - Health Check Path: `/api/v1/health`
   - Populate environment variables from Section 5.2. Generate a secure `JWT_SECRET` and `WORKER_WAKE_SECRET`.

7. **Deploy `lernivox-worker` (Render Free Web Service)**:
   - Click **New +** > **Web Service** *(Select Web Service, NOT Background Worker)*.
   - Connect your repository. Same region as API.
   - Root Directory: `.`. Runtime: `Node`. Plan: `Free`.
   - Build Command:
     ```bash
     pnpm install --frozen-lockfile && pnpm --filter @lernivox/database db:generate && pnpm --filter @lernivox/contracts build && pnpm --filter @lernivox/database build && pnpm --filter @lernivox/storage build && pnpm --filter @lernivox/ai-core build && pnpm --filter @lernivox/worker build
     ```
   - Start Command: `pnpm --filter @lernivox/worker start`
   - Health Check Path: `/healthz`
   - Populate environment variables from Section 5.3. Set `WORKER_WAKE_SECRET` to match the API secret exactly.

8. **Link API to Worker Wake URL**:
   - Once `lernivox-worker` is created, copy its public URL (e.g., `https://lernivox-worker.onrender.com`).
   - In `lernivox-api` environment variables, set `WORKER_BASE_URL` = `https://lernivox-worker.onrender.com`.
   - Save and trigger a manual redeploy on `lernivox-api`.

9. **Verify API & Worker Live Health**:
   - Check API health: `curl -I https://lernivox-api.onrender.com/api/v1/health` (HTTP 200).
   - Check Worker liveness: `curl -I https://lernivox-worker.onrender.com/healthz` (HTTP 200).
   - Check Worker readiness: `curl https://lernivox-worker.onrender.com/readyz` (`{"status":"ready", ...}`).
   - Verify wake security: `curl -X POST https://lernivox-worker.onrender.com/internal/wake` without headers returns `401 Unauthorized`.

10. **Confirm Queue Connection in Logs**:
    - Inspect worker logs in Render Dashboard:
      `[LernivoxWorker] Render Free Web Service HTTP control interface listening on 0.0.0.0:10000`
      `[WorkerHealthService] Queue listener configured for Redis`

### Phase 4: Frontend Web Deployment

11. **Deploy Next.js Web App on Vercel**:
    - Log into [vercel.com](https://vercel.com) and import the repository.
    - Set Root Directory: `apps/web`.
    - Check **Include source files outside Root Directory**.
    - Add Environment Variable:
      - `NEXT_PUBLIC_API_URL` = `https://[your-api-domain].northflank.app/api/v1`
    - Click **Deploy**.

12. **Configure Production CORS on API**:
    - Return to Northflank API environment variables.
    - Set `CORS_ORIGIN` = `https://[your-vercel-domain].vercel.app`.
    - Set `FRONTEND_URL` = `https://[your-vercel-domain].vercel.app`.
    - Restart the API service to apply changes.

---

## 8. Post-Deployment Smoke-Test Checklist

Verify that all systems function together in production:

- [ ] **1. Public Homepage**: Visit the Vercel URL. Confirm that the warm parchment palette (`#F4EFE4`), centered 3-zone desktop navbar, two-pole mobile header, and 2-line headline render crisply.
- [ ] **2. User Registration**: Register a new student account (`/register`). Confirm redirection to `/dashboard`.
- [ ] **3. Authentication Persistence**: Refresh the browser. Confirm you stay logged in via the silent refresh token flow without being kicked back to `/login`.
- [ ] **4. Document Ingestion**: Upload a sample PDF or DOCX file (< 1 MiB). Confirm that:
  - The API receives the file and streams progress percentage.
  - The BullMQ worker logs `Processing document: [doc-id]`.
  - The document status transitions from `PROCESSING` to `READY`.
- [ ] **5. Native Virtualized Reader**: Open the workspace (`/dashboard/workspaces/[id]`). Confirm pages render without any `<embed>` or `<iframe>` tags. Select text and verify citation highlighting.
- [ ] **6. AI Grounded Tutoring**: Ask the tutor a question about the uploaded material. Verify a streaming response grounded in exact citations (`p. 3`).
- [ ] **7. Quiz Generation**: Generate a 5-question chapter quiz. Verify instant scoring and failed-question review history.
- [ ] **8. Spaced-Repetition Flashcards**: Generate a deck, review cards using the SM-2 buttons, and verify score calculations.
- [ ] **9. Adaptive Learning Plan**: Offer and preview an adaptive plan from the AI tutor. Activate the plan and mark a session complete.
- [ ] **10. Group Privacy**: Invite a second test user to a group workspace. Verify that individual quiz scores and flashcard reviews remain 100% private.

---

## 9. Troubleshooting & FAQ

### Q1: The BullMQ Worker is running out of Upstash Redis commands
**Cause**: BullMQ default worker configuration checks the Redis queue every few milliseconds.  
**Fix**: In `apps/worker/src/ingestion/ingestion.processor.ts`, configure worker options with longer poll intervals:
```ts
new Worker('document-ingestion', processFn, {
  connection: redisConnection,
  drainDelay: 5000,       // Wait 5s before polling empty queue
  stalledInterval: 60000, // Check stalled jobs once per minute
});
```

### Q2: Authentication fails with `401 Unauthorized` on refresh
**Cause**: The browser is blocking third-party cross-site cookies between `.vercel.app` and `.northflank.app`.  
**Fix**: Set `COOKIE_SECURE=true` and `SameSite='none'` on the API, or map both services to subdomains of a single custom domain (e.g. `app.lernivox.com` and `api.lernivox.com`).

### Q3: Vercel build fails with `Cannot find module '@lernivox/contracts'`
**Cause**: Vercel attempted to build `apps/web` in isolation without monorepo workspace packages.  
**Fix**: In Vercel Project Settings > General, enable **Include source files outside the Root Directory in the Build Cache**.

---

*End of Deployment Guide. Maintain this document whenever environment schemas or deployment topologies change.*

