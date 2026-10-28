# ADR-002: Frontend Framework: Next.js App Router & Tailwind CSS

## Status
**Confirmed**

## Context
The prototype used Vite with plain React and unstructured CSS in `frontend/src/index.css`. To support SEO, server components, fast routing, and production readiness, a modern React framework is required.

## Decision
Adopt **Next.js (App Router)** with **TypeScript** and **Tailwind CSS**:
- Use Route Groups `(marketing)`, `(auth)`, and `(workspace)` for clear layout separation.
- Align styling tokens with the BrightPath Framer design system.
- Reusable UI primitives isolated in `components/ui/`.

## Consequences
- High performance, server-side rendering for marketing pages, and client interactivity for real-time study sessions.
