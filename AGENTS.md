# AGENTS.md — Persistent Agent Operating Guidelines for Lernivox

> **Notice to all AI Coding Agents**: This document contains mandatory instructions for any agent working on the Lernivox repository. These rules are non-negotiable. Read this file in full before proposing, planning, or executing any changes.

---

## 1. Core Operating Principles

### A. Documentation Before Implementation
1. **Mandatory Pre-Flight Reading**:
   - Read this file (`AGENTS.md`) and [`PROGRESS.md`](./PROGRESS.md) before undertaking any task.
   - Read any applicable subproject or target directory README files and architectural documentation.
   - Review product requirements, architectural decision records (ADRs), API contracts, design references, and implementation plans.
2. **Inspect Existing Code First**:
   - Inspect existing implementations and tests before modifying or refactoring code.
   - Respect established architectural decisions and follow documented requirements.
   - Identify discrepancies or conflicts between documentation and existing code before proposing or changing code.
3. **No Unilateral Requirement Invention**:
   - If required information is missing, ambiguous, or contradictory, investigate the repository thoroughly and document the issue in [`PROGRESS.md`](./PROGRESS.md).
   - Never silently invent requirements, fabricate API contracts, or ignore documented architectural decisions.
   - Documentation is not optional. Do not begin coding simply because a requested task sounds familiar or straightforward.
4. **Synchronize Decision Updates**:
   - If a task explicitly changes an established decision, immediately update the relevant documentation, architecture decision log, and [`PROGRESS.md`](./PROGRESS.md).

---

### B. Target Architecture & Product Vision

All ongoing and future development on Lernivox must converge toward the agreed target architecture. Do not introduce arbitrary alternative frameworks, databases, or service patterns without explicit architectural authorization.

```
+---------------------------------------------------------------------------------------+
|                                     LERNIVOX MONOREPO                                 |
|                               (pnpm workspaces + Turborepo)                          |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|   +------------------------------------+      +-----------------------------------+   |
|   |             Frontend               |      |              Backend              |   |
|   |     (Next.js App Router, React,    | <--> |      (NestJS, TypeScript,         |   |
|   |       TypeScript, Tailwind CSS)    |      |         Modular Architecture)     |   |
|   +------------------------------------+      +-----------------+-----------------+   |
|                     |                                           |                     |
|                     v                                           v                     |
|        BrightPath Design System Reference              Prisma ORM & PostgreSQL        |
|        (Visual Principles & Aesthetics)                     (+ pgvector)              |
|                                                                 |                     |
|                                               +-----------------+-----------------+   |
|                                               |                                   |   |
|                                               v                                   v   |
|                                    +----------------------+             +-------------------+
|                                    |  TypeScript Worker   |             |  Storage Service  |
|                                    |  (NestJS + BullMQ +  |             |  (Provider-agnostic|
|                                    |        Redis)        |             |  Cloudinary prov.)|
|                                    +----------+-----------+             +-------------------+
|                                               |                                       |
|                                               v                                       |
|                                    +----------------------+                           |
|                                    | AI Orchestration &   |                           |
|                                    | Document Ingestion   |                           |
|                                    | (Source Grounding)   |                           |
|                                    +----------------------+                           |
+---------------------------------------------------------------------------------------+
```

#### 1. Target Tech Stack
- **Product Name**: **Lernivox**
- **Repository Management**: Monorepo managed with **pnpm workspaces** and **Turborepo**.
- **Frontend Application**: **Next.js (App Router)**, **React**, **TypeScript**, and **Tailwind CSS**.
- **Backend Application**: **NestJS** and **TypeScript** (modular architecture).
- **Primary Database**: **PostgreSQL** managed with **Prisma ORM**, with the **pgvector** extension for vector similarity search.
- **Asynchronous Background Processing**: A dedicated TypeScript worker application using **NestJS**, **Redis**, and **BullMQ** for document parsing, chunking, and AI pipeline execution.
- **AI Processing & Ingestion**: Native TypeScript application logic for document parsing, chunking, vector embedding, retrieval-augmented generation (RAG), and agent orchestration. External AI provider selection (e.g., Google Gemini, OpenAI, Claude) remains an explicit abstraction until confirmed.
- **File Storage**: A provider-independent storage interface/adapter. **Cloudinary** is a provisional candidate, not an irreversible architectural commitment.
- **Visual Design Reference**: [BrightPath](https://brightpath-wbs.framer.website/).
  - Adapt its clean typography, polished contrast, subtle borders, card structures, and modern aesthetics to Lernivox’s learning interface. Do not copy its content.
  - The homepage must communicate Lernivox's value proposition clearly and offer an obvious textbook/document upload entry point.

#### 2. Product Scope & Vision
Lernivox transforms textbooks and lecture documents into an interactive, high-retention learning environment:
- Document-based guided learning with verifiable source citations and quote grounding.
- Automated quiz and flashcard generation directly linked to source chapters.
- Problem-solving challenges and structured revision notes.
- Objective learning progress tracking and exam-readiness metrics.
- Personalized study schedules and spaced-repetition revision plans.
- Collaborative study rooms and peer group learning.

*Note: These architectural targets represent the roadmap direction. They do not grant permission to rewrite the entire codebase in a single step.*

---

### C. Inspect Before Changing Code

1. **Understand Existing Code**:
   - Inspect the current implementation and dependencies thoroughly before refactoring or adding code.
   - Respect existing module boundaries, domain separation, and established patterns.
2. **Incremental, High-Cohesion Changes**:
   - Prefer small, coherent, and testable changes over monolithic refactors.
   - Do not rewrite working components or submodules without an explicit requirement.
   - Do not duplicate existing functionality or helper utilities.
3. **Strict Typing & Clean Code**:
   - Maintain strict TypeScript typings.
   - Never use `any` as a shortcut or escape hatch. Define explicit types, interfaces, and DTOs.
   - Do not introduce unnecessary dependencies, third-party libraries, or over-engineered abstractions.
4. **Safety & Non-Destructive Operations**:
   - Never run destructive Git commands (e.g., `git reset --hard`, `git clean -f -d`, `git push --force`) without explicit user instruction.
   - Never discard, overwrite, or reset user changes or working prototype code.
   - Never drop database tables or run destructive database migrations without explicit authorization.

---

### D. Verify Every Meaningful Change

1. **Mandatory Post-Implementation Verification**:
   - **Automated Tests**: Run unit, integration, and end-to-end test suites applicable to the affected code.
   - **Type Checking**: Run `tsc --noEmit` or equivalent compiler checks across affected packages.
   - **Linting & Formatting**: Run configured linters (e.g., `eslint`) and code formatters.
   - **Build Verification**: Run production builds (`pnpm build` or `npm run build`) for affected applications.
   - **Configuration Validation**: Verify environment variable schemas and configuration files.
   - **Git Diff Inspection**: Review `git diff` before declaring completion to guarantee no unintended edits or extraneous files were introduced.
2. **Honest Reporting**:
   - **Never claim a check passed unless it was actually executed and succeeded.**
   - Distinguish pre-existing errors or test failures from newly introduced regressions.
   - If a test or build command cannot run (e.g., missing dependencies, database unavailable), explicitly document the exact blocker in [`PROGRESS.md`](./PROGRESS.md).
   - Writing code does not equal task completion. Verification is mandatory.

---

### E. Mandatory Port and Process Cleanup

Agents frequently start development servers, mock APIs, containers, and workers during testing. Lingering zombie processes exhaust system resources and block future tasks.

1. **Pre-Execution Port Inspection**:
   - Before starting any development server, worker, test runner, or database service:
     - Determine the intended listening port (e.g., 3000, 4000, 5000, 5432, 6379).
     - Check if the port is already occupied using non-destructive inspection tools (e.g., `ss -tulpn`, `lsof -i :<port>`, or `netstat`).
     - Never terminate an existing process solely because its port is occupied.
     - Record the command, process name, assigned PID, and port.
   - Always run temporary processes in managed or cancellable terminal sessions.
2. **Mandatory Post-Task Cleanup**:
   - When a task concludes—whether successful, failed, or blocked:
     - Stop all temporary servers, workers, mock APIs, and test watchers launched during the session.
     - Release all occupied ports.
     - Stop **only** processes that were started by the agent and can be verified by PID.
     - **Never kill unrelated user processes or services** (e.g., user-managed IDE servers, existing local PostgreSQL or Docker daemons).
   - If an agent-initiated process cannot be terminated safely:
     - Immediately record the PID, port number, reason, and manual termination instruction in [`PROGRESS.md`](./PROGRESS.md).
3. **Preserving User Infrastructure**:
   - Persistent development infrastructure (e.g., long-running database containers) explicitly designated to stay up should not be torn down unless requested.
   - Never delete persistent Docker volumes or user database records during cleanup.

---

### F. Manage Configuration & Secrets Safely

1. **Zero Secret Leaks**:
   - Never commit real API keys, secrets, database passwords, JWT tokens, or credentials.
   - Keep `.env` and sensitive files in `.gitignore`.
   - Never log secrets or private keys to the terminal, stdout, or documentation.
2. **Keep `.env.example` Current**:
   - When new environment variables are introduced, update `.env.example` with descriptive keys and safe dummy/placeholder values.
   - Document any new environment dependencies in the relevant project documentation.
3. **No Unauthorized Deployments**:
   - Never deploy to production or execute cloud-infrastructure modification commands without explicit approval.

---

### G. Keep Documentation in Sync & Maintain PROGRESS.md

Whenever code, architecture, schemas, API contracts, environment variables, or workflows change:
1. Update corresponding documentation files immediately.
2. Update [`PROGRESS.md`](./PROGRESS.md) following the maintenance protocol outlined below.
3. Ensure documentation reflects reality—not aspirational states.

---

## 2. Maintenance Protocol for PROGRESS.md

[`PROGRESS.md`](./PROGRESS.md) is the shared, single source of truth for the implementation status of Lernivox. Every agent must adhere to this workflow:

1. **At Task Start**:
   - Read [`PROGRESS.md`](./PROGRESS.md) to confirm the active phase, existing blockers, and previous recommendations.
   - Register the active task under the `Current Task` section before beginning significant implementation.
2. **During Task Execution**:
   - Keep track of commands executed, verification results, opened ports, and temporary processes.
3. **At Task Completion (or Interruption)**:
   - Update `Current Repository State` if packages, services, or structure changed.
   - Update `Implementation Roadmap` status checkboxes where verified progress occurred.
   - Complete the `Current Task` section:
     - **Objective**: Clear summary of what was attempted.
     - **Work Completed**: Concrete summary of changes.
     - **Files Created/Modified**: Exact file paths.
     - **Verification**: Exact commands run and actual outcomes.
     - **Processes and Ports**: Audit of processes launched and confirmation of port cleanup.
     - **Known Issues / Blockers**: Any blocking bugs or missing prerequisites.
   - Update `Next Recommended Action`: Exactly one well-scoped task ready to be executed next.
   - Add a concise, timestamped entry to `Update History`.
4. **Status Definitions**:
   - `Planned`: Defined in roadmap but no work started.
   - `In Progress`: Active implementation underway.
   - `Blocked`: Work cannot proceed due to documented technical dependencies.
   - `Complete`: Implementation finished **and verified** through automated tests, linting, and builds. Never mark complete without verification evidence.
