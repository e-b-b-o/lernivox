# Lernivox — Domain Data Model & Database Architecture

> **Status**: Approved Foundation (Phase 2)  
> **ORM & Database**: Prisma ORM 7.x, PostgreSQL 16, pgvector 0.8.x  
> **Driver Adapter**: `@prisma/adapter-pg`

---

## 1. Executive Summary & Architectural Principles

Lernivox relies on a consolidated relational and vector storage model hosted in PostgreSQL 16. The database stores core business entities, course relationships, ingestion workflows, AI study conversations, verifiable source citations, assessments, and vector embeddings within a single ACID-compliant transactional boundary.

### Key Modeling Tenets
1. **Relational Rigor Over Loose JSON**: Core business domain logic, ownership hierarchies, and provenance records use first-class relational tables, foreign keys, and indexes. JSON fields (`Json`) are restricted to naturally dynamic payloads (e.g., custom configuration parameters, arbitrary parser diagnostic metadata).
2. **Strict Identity & Workspace Separation**: Users retain sovereign ownership over their documents and private generated materials. Shared resources (within courses or study groups) operate via explicit junction entities with permission contracts.
3. **Immutability of Ingestion vs. Mutable Study Materials**: Document source files, chunks, and embeddings represent ground truth. User-generated summaries, flashcards, and quizzes reference source passages via relational citations with `onDelete: SetNull` or explicit junction tables, guaranteeing that regenerating or deleting study materials never destroys or corrupts original document data.
4. **Distinct Assessment Definitions vs. Student Attempts**: Quizzes (the template/definition) and Quiz Attempts (a student's historical execution with answers and scores) are strictly distinct entities.
5. **Decoupled Asynchronous Processing**: Long-running document extraction, chunking, and embedding occur asynchronously in BullMQ worker processes. The database tracks fine-grained processing stages (`UPLOADED`, `EXTRACTING`, `CHUNKING`, `EMBEDDING`, `READY`, `FAILED`) and diagnostic errors, enabling reliable, idempotent retry mechanisms.
6. **Isolated Vector Storage & Retrieval**: Vector embeddings are captured alongside their generating model name and dimensionality. Operations involving vector arithmetic and similarity search (`<=>` cosine distance) are executed via pgvector extensions.

---

## 2. Product Domains & Entity Architecture

```
+---------------------------------------------------------------------------------------------------+
|                                        IDENTITY & PREFERENCES                                     |
|  +--------------------+         +-----------------------+         +----------------------------+  |
|  |       User         |<------->|     UserIdentity      |         |       UserPreference       |  |
|  +--------------------+         +-----------------------+         +----------------------------+  |
+---------------------------------------------------------------------------------------------------+
           |                                     |                                   |
           v                                     v                                   v
+---------------------------------------------------------------------------------------------------+
|                                  COURSES & CENTRAL DOCUMENT LIBRARY                               |
|  +--------------------+         +-----------------------+         +----------------------------+  |
|  |       Course       |<------->|    CourseDocument     |<------->|          Document          |  |
|  +--------------------+         +-----------------------+         +----------------------------+  |
|            |                                                                     |                |
|            v                                                                     v                |
|  +--------------------+                                           +----------------------------+  |
|  |    CourseMember    |                                           |      DocumentSection       |  |
|  |    CourseShare     |                                           +----------------------------+  |
+---------------------------------------------------------------------------------------------------+
                                                                                   |
                                                                                   v
+---------------------------------------------------------------------------------------------------+
|                                    INGESTION & RETRIEVAL (PGVECTOR)                               |
|                                 +-----------------------+                                         |
|                                 |     DocumentChunk     |                                         |
|                                 +-----------------------+                                         |
|                                             |                                                     |
|                                             v                                                     |
|                                 +-----------------------+                                         |
|                                 |    ChunkEmbedding     | (pgvector: vector(768))                 |
|                                 +-----------------------+                                         |
+---------------------------------------------------------------------------------------------------+
           |                                     |                                   |
           v                                     v                                   v
+-----------------------------+   +-----------------------------+   +-------------------------------+
|     TUTORING & CITATIONS    |   |    ASSESSMENTS & PROGRESS   |   |   STUDY PLANS & STUDY GROUPS  |
| +-------------------------+ |   | +-------------------------+ |   | +---------------------------+ |
| |       Conversation      | |   | |          Quiz           | |   | |         StudyPlan         | |
| +-------------------------+ |   | +-------------------------+ |   | +---------------------------+ |
|              |              |   |              |              |   |               |               |
|              v              |   |              v              |   |               v               |
| +-------------------------+ |   | +-------------------------+ |   | +---------------------------+ |
| |   ConversationMessage   | |   | |      QuizQuestion       | |   | |     StudyScheduleItem     | |
| +-------------------------+ |   | +-------------------------+ |   | +---------------------------+ |
|              |              |   |              |              |   |                               |
|              v              |   |              v              |   | +---------------------------+ |
| +-------------------------+ |   | +-------------------------+ |   | |        StudyGroup         | |
| |     MessageCitation     | |   | |       QuizAttempt       | |   | |     StudyGroupMember      | |
| +-------------------------+ |   | +-------------------------+ |   | |    StudyGroupResource     | |
|                             |   |              |              |   | +---------------------------+ |
| +-------------------------+ |   |              v              |   +-------------------------------+
| |    LearningMaterial     | |   | +-------------------------+ |
| |    MaterialCitation     | |   | |    QuizAttemptAnswer    | |
| |        Flashcard        | |   | +-------------------------+ |
| +-------------------------+ |   |                             |
+-----------------------------+   | +-------------------------+ |
                                  | |     StudentProgress     | |
                                  | +-------------------------+ |
                                  +-----------------------------+
```

---

### A. Identity, Accounts & Preferences

#### Entities
1. **`User`**: Core user record.
   - `id`: UUID primary key.
   - `email`: Case-insensitive unique string.
   - `name`: Display name.
   - `role`: System authorization role (`USER`, `ADMIN`).
   - `isActive`: Boolean flag for account deactivation.
   - `planTier`: Subscription tier indicator (`FREE`, `PRO`).
   - `deletedAt`: Timestamp for soft-deletion / data retention grace period.
   - `createdAt`, `updatedAt`: Standard audit timestamps.
2. **`UserIdentity`**: Authentication identity provider linkage.
   - Supports decoupled auth (Email/Password, Google OAuth 2.0).
   - `id`: UUID primary key.
   - `userId`: Foreign key referencing `User.id` (`onDelete: Cascade`).
   - `provider`: Identity provider enum or string (`EMAIL_PASSWORD`, `GOOGLE`).
   - `providerAccountId`: Provider's unique identifier (e.g., Google Sub ID, or normalized email).
   - `passwordHash`: Hashed secret (argon2id/bcrypt) when provider is `EMAIL_PASSWORD`; null for OAuth.
   - Constraints: `@@unique([provider, providerAccountId])`, `@@unique([userId, provider])`.
3. **`UserPreference`**: 1-to-1 personalization settings.
   - `id`: UUID primary key.
   - `userId`: Unique foreign key referencing `User.id` (`onDelete: Cascade`).
   - `difficulty`: Preferred baseline difficulty (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`).
   - `explanationLength`: AI tutor output length (`CONCISE`, `BALANCED`, `DETAILED`).
   - `teachingStyle`: Pedagogical framing (`SOCRATIC`, `DIRECT`, `ANALOGICAL`).
   - `dailyStudyTargetMinutes`: Integer target for revision routines (default: 30).
   - `theme`: UI appearance (`SYSTEM`, `LIGHT`, `DARK`).

---

### B. Courses, Permissions & Central Document Library

#### Entities
1. **`Course`**: Academic course or curriculum workspace owned by a student.
   - `id`: UUID primary key.
   - `ownerId`: Foreign key to `User.id` (`onDelete: Cascade`).
   - `name`: Course title (e.g., "Organic Chemistry I").
   - `code`: Optional catalog code (e.g., "CHEM-201").
   - `description`: Narrative course overview.
   - `color`: Accent color code for visual distinction.
   - `isArchived`: Boolean flag indicating completed semesters.
2. **`CourseMember`**: Student membership within a course.
   - `id`: UUID primary key.
   - `courseId`: Foreign key to `Course.id` (`onDelete: Cascade`).
   - `userId`: Foreign key to `User.id` (`onDelete: Cascade`).
   - `role`: Membership level (`OWNER`, `COLLABORATOR`, `STUDENT`).
   - Constraints: `@@unique([courseId, userId])` prevents duplicate memberships.
3. **`CourseShare`**: Explicit sharing grants and invitation tokens.
   - `id`: UUID primary key.
   - `courseId`: Foreign key to `Course.id` (`onDelete: Cascade`).
   - `sharedWithUserId`: Nullable foreign key to `User.id` for direct user-to-user sharing.
   - `permission`: Access level (`VIEW_ONLY`, `CONTRIBUTE`, `MANAGE`).
   - `shareToken`: Unique nullable cryptographic token for URL-based enrollment.
   - `expiresAt`: Nullable expiration date.
   - Constraints: `@@unique([courseId, sharedWithUserId])`.
4. **`Document`**: Central document library item.
   - Documents are uploaded once to a user's library and can be associated with multiple courses without duplicating storage files, text extraction, or vector embeddings.
   - `id`: UUID primary key.
   - `ownerId`: Foreign key to `User.id` (`onDelete: Cascade`).
   - `title`: Human-readable document name.
   - `fileName`: Original file name with extension.
   - `mimeType`: File format enum (`PDF`, `DOCX`, `TXT`, `PASTED_TEXT`).
   - `fileSizeBytes`: Integer byte size.
   - `storagePath`: Provider-agnostic reference (local path, Cloudinary public ID, S3 key).
   - `storageProvider`: Storage engine descriptor (`LOCAL`, `CLOUDINARY`, `S3`).
   - `visibility`: Document access boundary (`PRIVATE`, `SHARED`, `COURSE_ONLY`). Defaults to `PRIVATE`.
   - `status`: Fine-grained ingestion state (`UPLOADED`, `EXTRACTING`, `CHUNKING`, `EMBEDDING`, `READY`, `FAILED`).
   - `errorCode`: Error classification string for failed jobs.
   - `errorMessage`: Sanitized failure description.
   - `pageCount`: Extracted page count.
   - `totalTokens`: Estimated token count.
   - `processingStartedAt`, `processingCompletedAt`: Performance audit timestamps.
5. **`CourseDocument`**: Association table linking central documents to specific courses.
   - `id`: UUID primary key.
   - `courseId`: Foreign key to `Course.id` (`onDelete: Cascade`).
   - `documentId`: Foreign key to `Document.id` (`onDelete: Cascade`).
   - `addedById`: Foreign key to `User.id` who linked the resource.
   - `addedAt`: Creation timestamp.
   - Constraints: `@@unique([courseId, documentId])` ensures zero duplicate associations.
6. **`DocumentSection`**: Hierarchical outline extracted from documents.
   - `id`: UUID primary key.
   - `documentId`: Foreign key to `Document.id` (`onDelete: Cascade`).
   - `title`: Section or chapter title.
   - `chapterNumber`: Optional chapter index.
   - `sectionNumber`: Optional sub-section index.
   - `pageNumber`: Starting page.
   - `startOffset`, `endOffset`: Character index range within source text.
   - `parentSectionId`: Self-referencing foreign key for nested headings.

---

### C. Document Ingestion & Retrieval (pgvector)

#### Entities
1. **`DocumentChunk`**: Text segmentation unit created by the sliding-window chunker.
   - `id`: UUID primary key.
   - `documentId`: Foreign key to `Document.id` (`onDelete: Cascade`).
   - `sectionId`: Optional foreign key to `DocumentSection.id` (`onDelete: SetNull`).
   - `chunkIndex`: Sequential index (0-based) within the document.
   - `content`: Extracted text content.
   - `pageNumber`: Source page number.
   - `chapter`: Source chapter label.
   - `sectionTitle`: Heading context.
   - `startToken`, `endToken`: Approximate token offsets.
   - `tokenCount`: Integer token size.
   - Constraints: `@@unique([documentId, chunkIndex])` prevents duplicate chunks during retry runs.
2. **`ChunkEmbedding`**: Vector representation of a document chunk.
   - `id`: UUID primary key.
   - `chunkId`: Foreign key to `DocumentChunk.id` (`onDelete: Cascade`).
   - `model`: Embedding model identifier (e.g., `text-embedding-004`).
   - `dimension`: Vector dimensionality (e.g., `768`).
   - `embedding`: PostgreSQL vector column `Unsupported("vector(768)")`.
   - Constraints: `@@unique([chunkId, model])` ensures only one vector per chunk per model version.

#### Ingestion Retry & Idempotency Guarantee
- Ingestion jobs are orchestrated through BullMQ (`QueueName.DOCUMENT_INGESTION`).
- When an ingestion job is retried:
  1. The worker resets `Document.status` to `EXTRACTING`.
  2. Document chunks and embeddings are upserted or replaced in a transaction keyed on `(documentId, chunkIndex)`.
  3. No duplicate rows or orphaned chunks remain upon job completion or failure.

---

### D. Tutoring & Generated Learning Materials

#### Entities
1. **`Conversation`**: Socratic study chat session.
   - `id`: UUID primary key.
   - `userId`: Foreign key to `User.id` (`onDelete: Cascade`).
   - `courseId`: Optional foreign key to `Course.id` (`onDelete: SetNull`).
   - `title`: Conversation topic (e.g., "Review of Chapter 4 Thermodynamics").
2. **`ConversationMessage`**: Individual messages within a chat.
   - `id`: UUID primary key.
   - `conversationId`: Foreign key to `Conversation.id` (`onDelete: Cascade`).
   - `sender`: Message author (`USER`, `ASSISTANT`, `SYSTEM`).
   - `content`: Markdown text of the prompt or response.
   - `tokenCount`: Optional token count for usage auditing.
3. **`MessageCitation`**: Verifiable citation grounding an AI response in source chunks.
   - `id`: UUID primary key.
   - `messageId`: Foreign key to `ConversationMessage.id` (`onDelete: Cascade`).
   - `chunkId`: Foreign key to `DocumentChunk.id` (`onDelete: SetNull`).
   - `documentId`: Foreign key to `Document.id` (`onDelete: Cascade`).
   - `quoteSnippet`: Exact quote excerpt extracted from source.
   - `pageNumber`: Source page.
   - `chapter`: Source chapter.
   - `relevanceScore`: Similarity / confidence score.
4. **`LearningMaterial`**: Generated structured study aids (Summaries, Revision Notes, Worked Examples).
   - `id`: UUID primary key.
   - `userId`: Foreign key to `User.id` (`onDelete: Cascade`).
   - `courseId`: Optional foreign key to `Course.id` (`onDelete: SetNull`).
   - `documentId`: Optional foreign key to `Document.id` (`onDelete: SetNull`).
   - `type`: Material category (`SUMMARY`, `REVISION_NOTES`, `WORKED_EXAMPLE`, `FLASHCARD_DECK`).
   - `title`: Material title.
   - `content`: Structured markdown or text body.
   - `metadata`: JSON field for supplementary structured metadata.
5. **`MaterialCitation`**: Provenance link between generated learning materials and original source chunks.
   - `id`: UUID primary key.
   - `materialId`: Foreign key to `LearningMaterial.id` (`onDelete: Cascade`).
   - `chunkId`: Foreign key to `DocumentChunk.id` (`onDelete: SetNull`).
   - `documentId`: Foreign key to `Document.id` (`onDelete: Cascade`).
   - `quoteSnippet`: Exact text quote.
   - `pageNumber`: Source page.
6. **`Flashcard`**: Atomic spaced-repetition card linked to a deck or material.
   - `id`: UUID primary key.
   - `materialId`: Foreign key to `LearningMaterial.id` (`onDelete: Cascade`).
   - `front`: Prompt or concept question.
   - `back`: Explanation or answer.
   - `hint`: Optional hint.
   - `repetitionLevel`: SM-2 repetition tier (0, 1, 2, ...).
   - `easeFactor`: SM-2 ease factor (default: 2.5).
   - `intervalDays`: Days until next review.
   - `nextReviewAt`: Scheduled review timestamp.
   - `lastReviewedAt`: Previous review timestamp.

---

### E. Assessments & Learning Progress

#### Entities
1. **`Quiz`**: Generated assessment definition / question template.
   - `id`: UUID primary key.
   - `userId`: Creator / student foreign key to `User.id` (`onDelete: Cascade`).
   - `courseId`: Optional foreign key to `Course.id` (`onDelete: SetNull`).
   - `documentId`: Optional foreign key to `Document.id` (`onDelete: SetNull`).
   - `title`: Quiz title.
   - `description`: Optional overview.
   - `difficulty`: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`.
2. **`QuizQuestion`**: Individual question within a quiz.
   - `id`: UUID primary key.
   - `quizId`: Foreign key to `Quiz.id` (`onDelete: Cascade`).
   - `questionOrder`: Position index (1, 2, 3...).
   - `questionType`: `MULTIPLE_CHOICE`, `SHORT_ANSWER`, `TRUE_FALSE`.
   - `prompt`: Question prompt text.
   - `expectedAnswer`: Reference answer or explanation.
   - `explanation`: Detailed educational reasoning citing the source.
   - `sourceChunkId`: Optional foreign key to `DocumentChunk.id` (`onDelete: SetNull`).
3. **`QuestionOption`**: Selectable choice for multiple-choice questions.
   - `id`: UUID primary key.
   - `questionId`: Foreign key to `QuizQuestion.id` (`onDelete: Cascade`).
   - `optionOrder`: Position index.
   - `text`: Choice text.
   - `isCorrect`: Boolean correctness flag.
4. **`QuizAttempt`**: Historical student execution of a quiz.
   - **Crucial Distinction**: `Quiz` defines the question set; `QuizAttempt` captures a student's timed execution, recorded responses, and final score.
   - `id`: UUID primary key.
   - `quizId`: Foreign key to `Quiz.id` (`onDelete: Cascade`).
   - `userId`: Foreign key to `User.id` (`onDelete: Cascade`).
   - `startedAt`: Timestamp when attempt began.
   - `completedAt`: Timestamp when attempt submitted.
   - `score`: Final percentage or raw score.
   - `totalQuestions`: Total questions presented.
   - `correctAnswers`: Count of correct responses.
   - `isCompleted`: Completion status flag.
5. **`QuizAttemptAnswer`**: Student's answer to a specific question within an attempt.
   - `id`: UUID primary key.
   - `attemptId`: Foreign key to `QuizAttempt.id` (`onDelete: Cascade`).
   - `questionId`: Foreign key to `QuizQuestion.id` (`onDelete: Cascade`).
   - `selectedOptionId`: Nullable foreign key to `QuestionOption.id` (`onDelete: SetNull`).
   - `submittedAnswer`: Raw text submitted by student.
   - `isCorrect`: Boolean evaluation result.
   - `feedback`: Explanatory feedback on student's specific answer.
   - Constraints: `@@unique([attemptId, questionId])` ensures one answer per question per attempt.
6. **`StudentProgress`**: Topic-level mastery and retention tracking.
   - `id`: UUID primary key.
   - `userId`: Foreign key to `User.id` (`onDelete: Cascade`).
   - `courseId`: Optional foreign key to `Course.id` (`onDelete: SetNull`).
   - `documentId`: Optional foreign key to `Document.id` (`onDelete: SetNull`).
   - `sectionId`: Optional foreign key to `DocumentSection.id` (`onDelete: SetNull`).
   - `topicKey`: Normalized topic identifier or slug.
   - `isCompleted`: Boolean completion flag.
   - `masteryScore`: Comprehension score (0.0 to 1.0).
   - `retentionStrength`: Decay-modeled memory strength (0.0 to 1.0).
   - `lastStudiedAt`: Timestamp of last active study activity.
   - Constraints: `@@unique([userId, documentId, topicKey])`.

---

### F. Study Planning & Collaboration

#### Entities
1. **`StudyPlan`**: Goal-oriented revision schedule.
   - `id`: UUID primary key.
   - `userId`: Foreign key to `User.id` (`onDelete: Cascade`).
   - `courseId`: Optional foreign key to `Course.id` (`onDelete: SetNull`).
   - `title`: Plan title (e.g., "Final Exam Prep — 3 Week Sprint").
   - `targetExamDate`: Deadline timestamp.
   - `isActive`: Active status flag.
2. **`StudyScheduleItem`**: Scheduled study block within a plan.
   - `id`: UUID primary key.
   - `studyPlanId`: Foreign key to `StudyPlan.id` (`onDelete: Cascade`).
   - `scheduledDate`: Target calendar date.
   - `title`: Item title (e.g., "Review Chapter 3 Quizzes").
   - `description`: Optional instructions.
   - `sectionId`: Optional foreign key to `DocumentSection.id` (`onDelete: SetNull`).
   - `topicKey`: Optional topic identifier.
   - `isCompleted`: Boolean completion state.
   - `completedAt`: Timestamp when marked done.
3. **`StudyGroup`**: Collaborative cohort workspace.
   - `id`: UUID primary key.
   - `ownerId`: Foreign key to `User.id` (`onDelete: Cascade`).
   - `courseId`: Optional foreign key to `Course.id` (`onDelete: SetNull`).
   - `name`: Group name (e.g., "BioChem Study Circle").
   - `description`: Group mission / meeting schedule.
4. **`StudyGroupMember`**: Membership within a study group.
   - `id`: UUID primary key.
   - `groupId`: Foreign key to `StudyGroup.id` (`onDelete: Cascade`).
   - `userId`: Foreign key to `User.id` (`onDelete: Cascade`).
   - `role`: Membership permission level (`ADMIN`, `MEMBER`).
   - `joinedAt`: Membership timestamp.
   - Constraints: `@@unique([groupId, userId])` prevents duplicate group memberships.
5. **`StudyGroupInvitation`**: Outbound invitation to join a group.
   - `id`: UUID primary key.
   - `groupId`: Foreign key to `StudyGroup.id` (`onDelete: Cascade`).
   - `inviterId`: Foreign key to `User.id` (`onDelete: Cascade`).
   - `inviteeEmail`: Target invitee email.
   - `role`: Designated role (`ADMIN`, `MEMBER`).
   - `token`: Unique invitation secret token.
   - `status`: `PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`.
   - `expiresAt`: Expiration timestamp.
6. **`StudyGroupResource`**: Shared asset linked to a study group.
   - `id`: UUID primary key.
   - `groupId`: Foreign key to `StudyGroup.id` (`onDelete: Cascade`).
   - `sharedById`: Foreign key to `User.id` (`onDelete: Cascade`).
   - `documentId`: Optional foreign key to `Document.id` (`onDelete: Cascade`).
   - `materialId`: Optional foreign key to `LearningMaterial.id` (`onDelete: Cascade`).
   - `quizId`: Optional foreign key to `Quiz.id` (`onDelete: Cascade`).
   - `permission`: Access mode (`VIEW_ONLY`, `COLLABORATE`).
   - `sharedAt`: Timestamp when shared.

#### Collaboration Access & Member Departure Rules
- **Resource Ownership**: Documents, materials, and quizzes remain owned by their creator (`sharedById`). Sharing an asset into a study group grants access only to registered members of that group.
- **Member Departure**: If a user leaves or is removed from a study group:
  - Their personal account and private documents are unaffected.
  - Resources they contributed to the group remain shared in `StudyGroupResource` unless the creator explicitly unshares them or deletes the underlying resource.
  - The departed member immediately loses access to all other resources shared in the group.
- **Account Deletion**: If a user permanently deletes their account, cascade deletion removes their `StudyGroupResource` share records, revoking group access to their proprietary documents while preserving the group itself.

---

### G. Freemium Readiness & Subscription Architecture

#### Minimal Required Entities (Phase 2)
The product will support a `FREE` and `PRO` plan. To maintain architectural readiness without over-engineering speculative billing logic:
1. **`PlanTier` Enum**:
   - `FREE`: Standard quota (e.g., standard document size, core study tutor).
   - `PRO`: Enhanced quota (larger uploads, unlimited quizzes, priority worker processing).
2. **`Subscription` Model**:
   - `id`: UUID primary key.
   - `userId`: Unique foreign key to `User.id` (`onDelete: Cascade`).
   - `tier`: `PlanTier` (`FREE`, `PRO`).
   - `status`: `ACTIVE`, `CANCELED`, `PAST_DUE`.
   - `currentPeriodEnd`: Optional expiration/renewal date.
   - Constraints: `@@unique([userId])`.

#### Explicitly Deferred Billing Concerns
- Payment gateway webhooks (Stripe, LemonSqueezy).
- Invoice line items and currency conversion tables.
- Hardcoded price tables and credit consumption ledgers.
- Metered feature flag tables.

---

## 3. Data Integrity, Foreign Keys & Deletion Rules Matrix

| Entity | Parent / Related Entity | Relationship | Foreign Key Action | Rationale |
|---|---|---|---|---|
| `UserIdentity` | `User` | 1-to-N | `onDelete: Cascade` | Deleting user removes all associated login identities. |
| `UserPreference` | `User` | 1-to-1 | `onDelete: Cascade` | Settings have no meaning without the user. |
| `Course` | `User` | N-to-1 | `onDelete: Cascade` | Courses owned by the user are deleted when the account is purged. |
| `CourseMember` | `Course`, `User` | N-to-1 | `onDelete: Cascade` | Course or user deletion clears memberships cleanly. |
| `CourseShare` | `Course`, `User` | N-to-1 | `onDelete: Cascade` | Sharing grants expire with course or user deletion. |
| `Document` | `User` | N-to-1 | `onDelete: Cascade` | Central documents belong to user. Cascade deletes on account purge. |
| `CourseDocument` | `Course`, `Document` | N-to-1 | `onDelete: Cascade` | Deleting course removes link; central document remains intact. |
| `DocumentSection`| `Document` | N-to-1 | `onDelete: Cascade` | Sections describe document structure; removed with document. |
| `DocumentChunk` | `Document` | N-to-1 | `onDelete: Cascade` | Chunks belong strictly to document. Zero orphaned chunks. |
| `ChunkEmbedding` | `DocumentChunk` | N-to-1 | `onDelete: Cascade` | Embeddings belong strictly to chunk. Zero orphaned vectors. |
| `Conversation` | `User` | N-to-1 | `onDelete: Cascade` | Student study chats belong to the student. |
| `Conversation` | `Course` | N-to-1 | `onDelete: SetNull` | Deleting a course preserves student's personal study conversations. |
| `ConversationMessage` | `Conversation` | N-to-1 | `onDelete: Cascade` | Messages belong to conversation. |
| `MessageCitation` | `ConversationMessage` | N-to-1 | `onDelete: Cascade` | Citations belong to message. |
| `MessageCitation` | `DocumentChunk` | N-to-1 | `onDelete: SetNull` | If chunk is re-extracted, citation excerpt remains historical record. |
| `LearningMaterial`| `Document` | N-to-1 | `onDelete: SetNull` | Deleting source document does not destroy generated revision notes. |
| `MaterialCitation`| `DocumentChunk` | N-to-1 | `onDelete: SetNull` | Source quotes preserved even if chunk is updated. |
| `Flashcard` | `LearningMaterial` | N-to-1 | `onDelete: Cascade` | Cards belong to the generated deck. |
| `Quiz` | `Document` | N-to-1 | `onDelete: SetNull` | Generated quiz preserved even if source document is removed. |
| `QuizQuestion` | `Quiz` | N-to-1 | `onDelete: Cascade` | Questions belong to the quiz definition. |
| `QuestionOption` | `QuizQuestion` | N-to-1 | `onDelete: Cascade` | Options belong to multiple-choice question. |
| `QuizAttempt` | `Quiz` | N-to-1 | `onDelete: Cascade` | Attempts belong to the quiz. |
| `QuizAttemptAnswer` | `QuizAttempt` | N-to-1 | `onDelete: Cascade` | Answers belong to attempt. |
| `StudentProgress` | `User` | N-to-1 | `onDelete: Cascade` | Mastery metrics belong to student. |
| `StudentProgress` | `Document` | N-to-1 | `onDelete: SetNull` | Topic mastery records survive document removal. |
| `StudyPlan` | `User` | N-to-1 | `onDelete: Cascade` | Study plans belong to student. |
| `StudyScheduleItem`| `StudyPlan` | N-to-1 | `onDelete: Cascade` | Scheduled items belong to plan. |
| `StudyGroup` | `User` | N-to-1 | `onDelete: Cascade` | Group owner deletion cascades group. |
| `StudyGroupMember` | `StudyGroup` | N-to-1 | `onDelete: Cascade` | Group deletion clears memberships. |
| `StudyGroupResource`| `StudyGroup` | N-to-1 | `onDelete: Cascade` | Group deletion removes resource sharing entries. |

### Separation of Database Deletion vs. Object Storage Cleanup
- Deleting a `Document` record in PostgreSQL removes database metadata, sections, chunks, and embeddings immediately via database cascading foreign keys.
- Physical file deletion from external object storage (e.g., Cloudinary, S3, or local disk) is dispatched to a background cleanup job via `StorageService.delete(storagePath)`. A database transaction failure will not leave missing storage files, and storage failure will not rollback database consistency.

---

## 4. Vector Storage & Search Architecture (pgvector)

### A. Dimensionality & Model Binding
- The default vector embedding configuration is based on Google Gemini's `text-embedding-004`, which outputs **768-dimensional** dense vectors.
- In `ChunkEmbedding`, the column is typed as `vector(768)`.
- Metadata columns `model` (e.g., `"text-embedding-004"`) and `dimension` (e.g., `768`) guarantee that if future models or providers (e.g., OpenAI `text-embedding-3-small` with 1536 dimensions) are introduced, different embedding versions can coexist or be migrated cleanly without collision.

### B. Indexing Trade-offs: HNSW vs. IVFFlat vs. Sequential Scan

| Index Strategy | Query Latency | Build Time | Memory Footprint | Dynamic Updates | Recommendation for Lernivox |
|---|---|---|---|---|---|
| **Sequential Scan (Exact)** | Fast for < 10k vectors; linear scale beyond. | Zero (no index required). | Minimal. | Instant. Perfect recall (1.0). | **Active Default for Initial Phase**: Documents are partitioned per user and course; exact scan provides 100% recall with sub-5ms latency for typical student document sets. |
| **HNSW (Hierarchical Navigable Small World)** | Sub-millisecond (approximate). | Moderate to high build time. | High RAM consumption (builds multi-layer graph in memory). | Excellent for dynamic inserts; no re-training needed. | **Recommended for Production at Scale**: Apply `USING hnsw (embedding vector_cosine_ops)` when corpus exceeds 50,000 chunks. |
| **IVFFlat (Inverted File Flat)** | Fast (approximate). | Requires pre-training clusters (`lists`). | Low RAM consumption. | Poor for dynamic inserts before re-clustering. | Not recommended for dynamic multi-document ingestion workloads. |

---
