# ADR-004: Data Store: PostgreSQL, Prisma ORM 7.x, and pgvector

## Status
**Confirmed**

## Context
The prototype stored metadata in MongoDB Atlas and vectors in a separate local ChromaDB database. Maintaining two distinct databases created dual-state consistency problems and operational complexity.

## Decision
Consolidate relational data and vector embeddings into a single primary data store: **PostgreSQL with the `pgvector` extension** managed via **Prisma ORM 7.x**:
- Relational schema for Users, Workspaces, Courses, Documents, Quizzes.
- Vector column `vector(768)` on `document_chunks` table for cosine similarity queries.
- ORM version: Prisma 7.10.x stable. (Prisma 8 is in Release Candidate and intentionally deferred).

## Consequences
- Single database transactionality and simplified backups.
- Eliminates ChromaDB dependency and MongoDB sync overhead.
