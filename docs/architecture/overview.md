# Lernivox — Architecture Overview

## 1. System Topology

```
                                  +------------------------------+
                                  |         Next.js Web          |
                                  |          (apps/web)          |
                                  +--------------+---------------+
                                                 |
                                     REST / WS   |
                                                 v
                                  +--------------+---------------+
                                  |         NestJS API           |
                                  |          (apps/api)          |
                                  +----+-------------------+-----+
                                       |                   |
                        Enqueues Jobs  |                   | Queries Data & Vectors
                                       v                   v
+-------------------------+     +------+--------+   +------+----------------+
|       Redis Store       | <-- |  NestJS Worker|   |   PostgreSQL +        |
|  (BullMQ Job Queues)    |     | (apps/worker) |   |   pgvector (Prisma)   |
+-------------------------+     +------+--------+   +-----------------------+
                                       |
                   Embeddings & RAG    v
                                +------+--------+
                                |  AI Provider  |
                                |  (Gemini/etc) |
                                +---------------+
```

---

## 2. Component Responsibilities

### `apps/web` (Frontend)
- Next.js App Router application built in TypeScript and styled with Tailwind CSS.
- Implements design principles from the [BrightPath](https://brightpath-wbs.framer.website/) aesthetic.
- Responsible for client presentation, user authentication sessions, interactive document upload, citation viewing, and quiz interaction.

### `apps/api` (REST API)
- Modular NestJS backend application.
- Exposes versioned REST endpoints (`/api/v1`) with OpenAPI documentation (`/api/docs`).
- Handles authentication, workspace management, document metadata, and enqueuing heavy background processing jobs to Redis.
- Employs strict request validation (`ValidationPipe`) and standardized exception filtering.

### `apps/worker` (Background Processing)
- Standalone NestJS application running as a worker daemon.
- Listens to BullMQ queues (`document-ingestion`, `ai-orchestration`) backed by Redis.
- Executes intensive tasks asynchronously: PDF/DOCX parsing, semantic chunking, embedding generation, and vector indexing into PostgreSQL.

### `packages/database` (Data Layer)
- Prisma ORM schema and migrations for PostgreSQL.
- Implements `pgvector` vector extension for native cosine similarity queries directly alongside relational course data.
- Provides a reusable, singleton client factory for applications.

### `packages/storage` (Asset Storage)
- Provider-agnostic storage abstraction (`StorageService`).
- Local filesystem adapter for zero-dependency development.
- Provisional Cloudinary adapter prepared behind the unified interface.

### `packages/ai-core` (AI Orchestration)
- Standardized `AiProvider` interface isolating LLM provider implementations.
- Implements text parsing, chunking primitives with semantic overlap, and citation grounding.

### `packages/contracts` (Shared Schemas & DTOs)
- Centralizes shared types, queue names, and job payloads across API and worker.

---

## 3. Core Operational Flows

### A. Document Ingestion Flow
```
User uploads PDF
       |
       v
apps/api (validates file, writes to StorageService, creates Document record in DB)
       |
       v
apps/api enqueues `DocumentIngestionJobPayload` into Redis `document-ingestion` queue
       |
       v
apps/worker picks up job from BullMQ
       |
       +--> Downloads file from StorageService
       +--> Parses text and extracts structure
       +--> Calls `chunkText()` from @lernivox/ai-core
       +--> Requests embeddings from AiProvider
       +--> Stores DocumentChunks with vector(768) embeddings in PostgreSQL
       +--> Updates Document status to `READY`
```

### B. Source-Grounded Question Answering (RAG) Flow
```
User asks question in apps/web
       |
       v
apps/api queries AiProvider for question embedding vector
       |
       v
apps/api performs vector cosine similarity query on `document_chunks` via Prisma/pgvector
       |
       v
apps/api selects top matching chunks (context) with page and chapter metadata
       |
       v
apps/api constructs prompt enforcing strict grounding:
"Answer ONLY using the provided excerpts. Cite source page and chapter for every claim."
       |
       v
AiProvider generates completion with citations
       |
       v
apps/web renders response with interactive, verified citation cards
```
