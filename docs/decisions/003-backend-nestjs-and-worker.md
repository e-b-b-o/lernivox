# ADR-003: Backend Architecture: NestJS API & BullMQ Worker

## Status
**Confirmed**

## Context
The prototype handled file uploads and generation inside an Express server while delegating RAG to a Python Flask process. Heavy parsing and vectorization blocked request lifecycles.

## Decision
Separate API request handling from asynchronous background execution using **NestJS**:
- `apps/api`: Handles HTTP/WebSocket endpoints, user requests, metadata, and enqueues jobs.
- `apps/worker`: Standalone daemon consuming BullMQ queues on Redis for heavy PDF parsing, text extraction, chunking, and vector embedding.

## Consequences
- Guaranteed API responsiveness regardless of document size.
- Resilient retry semantics and job monitoring via Redis BullMQ.
