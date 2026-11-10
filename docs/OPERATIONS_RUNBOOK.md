# Lernivox — Production Operations Runbook

**Audience**: DevOps Engineers, Site Reliability Engineers (SREs), Infrastructure Teams  
**Target Stack**: Docker / Kubernetes, Node.js 24, PostgreSQL 16 + pgvector, Redis 7, Cloudinary / S3 Object Storage  
**Date**: November 9, 2026

---

## 1. Production Architecture Overview

```text
                  [ Internet / CDN ]
                           │
                           ▼
                  [ Reverse Proxy / TLS ]
                           │
          ┌────────────────┴────────────────┐
          ▼                                 ▼
   [ Next.js Web App ]               [ NestJS API ]
   (Port 3000 / SSR)                 (Port 4000)
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
           [ PostgreSQL + pgvector ]                         [ Redis 7 ]
           (Primary Data & Embeddings)                       (Queues & Sessions)
                     ▲                                             ▲
                     │                                             │
                     └──────────────────────┬──────────────────────┘
                                            ▼
                                  [ TypeScript Worker ]
                                  (BullMQ Processing)
```

---

## 2. Environment Configuration

Production environment variables must be injected via secure secrets management (e.g., AWS Secrets Manager, HashiCorp Vault, Kubernetes Secrets).

| Variable | Description | Production Example / Requirement |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | API listening port | `4000` |
| `DATABASE_URL` | PostgreSQL connection string with pgvector | `postgresql://user:pass@db.internal:5432/lernivox?schema=public` |
| `REDIS_HOST` | Redis host | `redis.internal` |
| `REDIS_PORT` | Redis port | `6379` |
| `CORS_ORIGIN` | Explicit frontend origin whitelist | `https://lernivox.com,https://app.lernivox.com` |
| `FRONTEND_URL` | Base web frontend URL | `https://app.lernivox.com` |
| `JWT_SECRET` | Secret key for access tokens | High-entropy random string (>= 64 chars) |
| `JWT_EXPIRES_IN`| Access token lifetime | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Refresh token lifetime | `7` |
| `STORAGE_DRIVER` | Abstract storage provider | `local` (or `cloudinary` / `s3`) |
| `MAX_UPLOAD_SIZE_BYTES` | Maximum file upload size | `26214400` (25 MB) |
| `GEMINI_API_KEY` | Google Gemini API key for embeddings/RAG | Secret key |
| `ENABLE_SWAGGER` | Swagger OpenAPI UI | `false` |

> [!CAUTION]
> In production, the API will refuse to boot if `JWT_SECRET` is unset, matches the development default, or is shorter than 32 characters.

---

## 3. Deployment Procedures

### A. Pre-Deployment Validation
Run monorepo validation checks before deploying:
```bash
pnpm install --frozen-lockfile
pnpm type-check
pnpm --filter @lernivox/ai-core test
pnpm --filter @lernivox/api test
pnpm --filter @lernivox/worker test
pnpm --filter @lernivox/web test
```

### B. Database Migrations
Run Prisma migrations in non-destructive deploy mode:
```bash
pnpm --filter @lernivox/database prisma migrate deploy
```
*Never execute `prisma migrate reset` or `prisma db push --force-reset` on production databases.*

### C. Build & Container Startup
Build all services:
```bash
pnpm --filter @lernivox/api build
pnpm --filter @lernivox/worker build
pnpm --filter @lernivox/web build
```
Start containers using process managers (Docker Compose or Kubernetes Deployments):
- Web: `pnpm --filter @lernivox/web start`
- API: `pnpm --filter @lernivox/api start`
- Worker: `pnpm --filter @lernivox/worker start`

---

## 4. Health Checks & Monitoring

### Readiness & Liveness Probes
The NestJS API exposes a Terminus health check endpoint:
- **URL**: `GET /api/v1/health`
- **Response Format**:
  ```json
  {
    "status": "ok",
    "info": {
      "database": { "status": "up" },
      "redis": { "status": "up" }
    },
    "error": {},
    "details": {
      "database": { "status": "up" },
      "redis": { "status": "up" }
    }
  }
  ```
- **Kubernetes Probe Configuration**:
  ```yaml
  readinessProbe:
    httpGet:
      path: /api/v1/health
      port: 4000
    initialDelaySeconds: 5
    periodSeconds: 10
  livenessProbe:
    httpGet:
      path: /api/v1/health
      port: 4000
    initialDelaySeconds: 15
    periodSeconds: 20
  ```

### Key Metrics to Monitor
1. **API Latency & Error Rate**: Track P95 and P99 latency. Trigger alert if 5xx errors exceed 1% over 5 minutes.
2. **BullMQ Queue Backlog**: Monitor waiting job counts in `document-ingestion` and `ai-orchestration`. Alert if backlog > 100 jobs for > 15 minutes.
3. **Redis Memory Usage**: Alert if Redis memory usage exceeds 80% of maxmemory.
4. **PostgreSQL Connection Pool**: Monitor active connections versus `max_connections`.

---

## 5. Backup & Disaster Recovery

### A. Database Backups
- **Automated Daily Snapshots**:
  ```bash
  pg_dump -Fc -h db.internal -U lernivox -d lernivox > /backups/lernivox_$(date +%Y%m%d_%H%M%S).dump
  ```
- **Point-in-Time Recovery (PITR)**: Enable Write-Ahead Logging (WAL) archiving to S3/GCS.
- **pgvector Index Restoration**:
  When restoring dumps, HNSW vector indexes on `DocumentChunk.embedding` restore automatically as part of the schema dump.

### B. Redis Queue Recovery
- BullMQ stores queue states in Redis using Redis hash and sorted set keys. Enable RDB snapshots (`save 900 1` or AOF persistence with `appendonly yes`).

---

## 6. Incident Response & Troubleshooting

### Scenario 1: AI Provider Quota Exhaustion (HTTP 429)
- **Symptom**: User actions on Quiz/Flashcard generation return `503 Service Unavailable: The AI generation service is currently experiencing high demand.`
- **Action**:
  1. Inspect LLM provider console for quota limits and credit balances.
  2. Switch to fallback secondary provider key or raise rate limits in Google Cloud / AI studio.
  3. BullMQ queues automatically hold and retry failed generation jobs with exponential backoff.

### Scenario 2: Worker Queue Backlog / High Document Uploads
- **Symptom**: Documents remain in `PROCESSING` status for several minutes.
- **Action**:
  1. Scale worker container replicas: `kubectl scale deployment lernivox-worker --replicas=5`.
  2. Workers dynamically pull jobs from the shared Redis queue without requiring API restarts.

### Scenario 3: Suspected Compromised Token / Session Revocation
- **Action**:
  1. Lernivox implements refresh token rotation with automated reuse detection.
  2. If token reuse is detected, the API automatically revokes all sessions for that user and writes a security audit log:
     `WARN [AuthService] Possible token reuse detected for userId=... Revoking all sessions.`
  3. To manually revoke all sessions for a user:
     ```sql
     DELETE FROM "RefreshToken" WHERE "userId" = '<compromised-user-id>';
     ```

---

## 7. Port & Process Management Protocol

- Development and testing must maintain clean port hygiene.
- Verify active listening sockets before and after maintenance operations:
  ```bash
  ss -tulpn
  ```
- Terminate only agent-initiated processes by PID. Never terminate system databases or host container daemons.

