# ADR-005: Provisional Choices: Cloudinary Storage & Gemini AI

## Status
**Provisional / Under Evaluation**

## Context
Initial specifications proposed Cloudinary for asset storage and Google Gemini for AI generation. However, committing to specific vendors at the foundational level creates vendor lock-in.

## Decision
1. **File Storage**:
   - Cloudinary is a **provisional candidate** for document hosting.
   - All storage interactions are abstracted behind the `StorageService` interface in `@lernivox/storage`.
   - A local filesystem adapter is provided for offline development and testing.
2. **AI Provider**:
   - Google Gemini is integrated in the legacy prototype and provisional Gemini adapters are structured in `@lernivox/ai-core`.
   - The system is architected around an abstract `AiProvider` interface so alternative providers (Anthropic Claude, OpenAI, or local open weights) can be swapped via configuration without application refactoring.

## Unresolved Decisions
- Final selection of production document storage provider (Cloudinary vs AWS S3 / Cloudflare R2).
- Final selection of production primary and fallback LLM models.
- Production deployment platform (e.g., Vercel + Railway vs. Docker Swarm / Kubernetes).
