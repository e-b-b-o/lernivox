# ADR-006: Authentication and Session Strategy

## Status
**Confirmed**

## Context
Lernivox requires a robust, production-minded authentication and session management architecture that securely bridges the Next.js frontend (`apps/web`) and NestJS backend API (`apps/api`). The previously unresolved decision was whether to use NextAuth / Auth.js within Next.js or a backend-centric NestJS Passport system with refresh token rotation.

Given that Lernivox features a decoupled architecture (Next.js frontend, NestJS REST API, and asynchronous NestJS background workers) that must also support future mobile clients or third-party API integrations, relying solely on Next.js-bound authentication sessions creates architectural coupling and makes API authorization clumsy for non-Next.js callers.

Furthermore, credential security requires:
1. Immunity to Cross-Site Scripting (XSS) credential theft (no tokens stored in `localStorage` or `sessionStorage`).
2. Robust Cross-Site Request Forgery (CSRF) mitigation.
3. Server-side session tracking with immediate revocation capabilities (e.g. user logout, password reset, or incident response).
4. Secure Google OAuth 2.0 integration that links external identities without accidental account hijacking or merging unverified identities.

## Decision
Adopt a **NestJS-managed authentication system** utilizing Passport strategies (`passport-jwt`, `passport-local`, `passport-google-oauth20`) and dual-token rotation:

### 1. Token Architecture
- **Access Token**:
  - Signed JWT (JSON Web Token) with a short lifespan (**15 minutes**).
  - Contains essential claims: `sub` (User ID), `email`, and `role`.
  - Returned in JSON payload and retained **strictly in client-side in-memory state** (React Context).
  - Never persisted to `localStorage`, `sessionStorage`, or unmanaged cookies.
- **Refresh Token & Server-Side Session**:
  - Cryptographically secure, high-entropy 256-bit random token with a lifespan of **7 days**.
  - Persisted in the PostgreSQL database within a dedicated `UserSession` table (`user_sessions`).
  - Stored only as a cryptographic hash (`tokenHash` using SHA-256) to ensure database leaks do not compromise active sessions.
  - Delivered to the client exclusively via a secure, `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth`, `Secure` (in production) cookie.
  - Invisible to client-side JavaScript (`document.cookie`), mitigating XSS token extraction.

### 2. Token Rotation & Reuse Detection
- When `/api/v1/auth/refresh` is invoked with a valid refresh cookie:
  1. The incoming token is hashed and looked up in `user_sessions`.
  2. If the session is revoked or expired: request is rejected with `401 Unauthorized`.
  3. **Reuse Detection**: If a previously rotated or revoked token is presented, this indicates possible token compromise; all active sessions for that user are immediately invalidated (`isRevoked: true`).
  4. If valid: a new access token and a fresh refresh token are generated. The current session record is updated with the new token hash and extended expiry, and the new cookie is returned in `Set-Cookie`.

### 3. Password Hashing & Security
- Passwords are encrypted using **Argon2id** (`argon2`), the winner of the Password Hashing Competition (PHC), providing high memory-hardness against GPU/ASIC attacks.
- Plaintext passwords are never logged, stored, or echoed.
- Email addresses are strictly validated and lowercased to prevent duplicate or ambiguous accounts.
- Sensitive authentication routes (`/register`, `/login`, `/refresh`) are protected against brute-force attacks via NestJS rate limiting (`@nestjs/throttler`).

### 4. Google OAuth 2.0 Integration
- Server-managed OAuth flow initiated via `GET /api/v1/auth/google` and handled at `GET /api/v1/auth/google/callback`.
- Google client secrets remain strictly on the backend.
- Existing accounts are safely linked via `UserIdentity` (provider: `GOOGLE`, `providerAccountId: googleId`).
- Accounts are linked only when Google profile verification flags confirm verified ownership of the email.
- Upon successful authentication, the backend sets the secure `refreshToken` cookie and redirects the browser to the frontend callback (`${FRONTEND_URL}/auth/callback`), where the client automatically initializes its in-memory session.

### 5. Session Revocation & Logout
- `POST /api/v1/auth/logout` identifies the active session from the refresh cookie, marks the database session as revoked (`isRevoked: true`), and clears the client cookie by sending `maxAge: 0`.

## Consequences
- **Positive**:
  - Maximum resistance to XSS credential exfiltration.
  - Full server-side session auditability, tracking device information (`userAgent`, `ipAddress`), and instant revocation.
  - Decoupled API architecture cleanly usable by web, future mobile, and backend workers.
  - Standardized Passport ecosystem compatible with future enterprise SSO (SAML, OIDC).
- **Negative / Trade-offs**:
  - Refresh rotation requires an active database check on each refresh cycle (cached / optimized via index on `tokenHash`).
  - Next.js SSR / Server Components needing auth must route API requests or pass along cookies with credentials.
