Build Brief for Coding Agent (Module 0)

Use this as the single source of truth. Follow the conventions below, then deliver the Module 0 scope. Avoid shortcuts; adhere to the stack and patterns exactly.

1) Global Context (applies to all modules)
Product

A web application with:

Frontend: React Single-Page App (SPA).

Backend: Mastra (AI workflows) running an HTTP server with Hono and exposing a REST API.

Database & Sync: Postgres as the system of record, ElectricSQL for client sync (proxy-auth pattern).

ORM: Drizzle ORM for database access.

Storage: S3-compatible (MinIO) for local dev, to be used in modules after Module 0.

Email: Resend for transactional emails (used in later modules).

Monorepo & Package Management

Monorepo with workspaces: Root contains two workspaces: api and client.

Package manager: pnpm.

TypeScript everywhere (frontend and backend).

Single .env strategy: Root-level environment variables consumed by both apps; allow service-specific overrides if needed.

Runtime & Conventions

Node.js 20+ for backend tooling.

React 18+ with React Router on the client.

UI: shadcn/ui with Tailwind.

HTTP: Hono server (mounted within Mastra’s server).

Security: Session authentication via httpOnly cookie. JWT may be used as the cookie payload. No localStorage for session secrets.

Data flow guardrails:

Reads that need live sync go through ElectricSQL shapes via a backend proxy endpoint.

Writes go through the backend API (never write directly from client to DB).

Testing scope for Module 0: Manual QA checklist; automated tests are not required for Module 0 but code should be structured to enable testing later.

2) Architecture Overview
High-Level

Monorepo root: Houses workspace config, Docker Compose for infrastructure, and shared env.

API app (/api):

Mastra instance configured with Postgres storage adapter.

Hono routes mounted into the Mastra server for REST endpoints.

Drizzle ORM connected to Postgres.

ElectricSQL shape proxy-auth endpoint that filters data by the authenticated user and strictly validates shape parameters.

Client app (/client):

Vite + React + TypeScript + React Router + shadcn/ui.

Auth pages (register, login), a protected area, and a page to trigger a Mastra workflow and view synced results.

ElectricSQL client binds to the backend’s proxy-auth shape endpoint; the client never talks to the Electric service directly.

Data & Sync Model (Module 0 scope)

Tables (minimum):

Users (email, passwordHash, timestamps, optional emailVerifiedAt not required in Module 0).

Sessions (or equivalent JWT cookie strategy with expiration).

Jokes (userId, text, timestamps).

Reads: Jokes list is streamed to the client using Electric shape via the backend proxy, filtered to the logged-in user.

Writes: API endpoint triggers the Mastra “tell me a joke” workflow, stores the result in the jokes table; Electric sync reflects the change to the client.

3) Infrastructure & Environments
Docker (development)

Postgres with logical replication enabled (required by ElectricSQL).

ElectricSQL service running alongside Postgres for dev.

MinIO included in the stack but not used in Module 0 features; it should be available and healthy.

Environment Variables (root-level)

Define the following (names exact; values to be set for local dev):

DATABASE_URL (Postgres connection string)

ELECTRIC_URL (Electric service base URL; not exposed publicly)

JWT_SECRET (backend JWT signing key)

COOKIE_NAME (session cookie name)

MASTRA_PORT (backend server port)

RESEND_API_KEY (held for future modules; can be placeholder in Module 0)

S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, S3_REGION, S3_FORCE_PATH_STYLE (for MinIO; placeholder acceptable in Module 0)

Client config for API base URL (e.g., VITE_API_BASE) consumed by the frontend build

Security Defaults

Use httpOnly cookies for session token.

SameSite Lax or Strict in dev; Secure when running behind HTTPS.

Electric service must not be exposed directly to the public network; all client sync requests go through the backend proxy-auth route.

The proxy-auth route must strictly validate allowed shapes and ownership filters.

4) Tooling & Quality

Formatting & Linting: Prettier + ESLint (TypeScript).

Drizzle migrations: Generate and apply as part of the setup; do not rely on implicit schema sync.

Git hygiene: Initial commit contains the monorepo skeleton and infra; subsequent commits are scoped and descriptive.

Documentation: A root-level README describing how to run the stack, env setup, and Module 0 acceptance checklist.

5) Build Order (Module 0)

Follow this order to reduce integration errors:

Initialize monorepo with workspaces api and client.

Bootstrap backend using the official Mastra CLI into /api. Configure:

Mastra with Postgres storage adapter.

Hono mounted into Mastra server for REST routes.

Drizzle ORM wired to DATABASE_URL.

Create DB schema and migrations for Users, Sessions (or session-equivalent), and Jokes. Apply migrations.

Bring up Docker infrastructure (Postgres with logical replication, Electric service, MinIO). Confirm health checks.

Implement backend endpoints:

Auth: register, login, logout. Cookie-based session with expiration.

Workflow: trigger “tell me a joke” (Mastra) and persist the result to the jokes table.

Electric shape proxy-auth endpoint: enforces authenticated user scope and only permits approved shapes.

Bootstrap frontend in /client with React, TypeScript, Vite, React Router, and shadcn/ui.

Implement auth flows on the client:

Registration and login pages.

Logout action.

Protected route that redirects unauthenticated users to the login page.

Session persistence across page refreshes (httpOnly cookie-based; client state reflects authentication).

Wire ElectricSQL on the client:

Connect to the backend’s shape proxy endpoint for the jokes feed filtered by current user.

Ensure lists update live after a workflow-triggered insert.

Add UI for workflow:

Authenticated button/action to trigger “tell me a joke”.

List the user’s past jokes (live-updating via Electric).

Documentation & QA:

README sections for setup and run instructions.

Acceptance checklist and manual test steps.

6) Module 0 — Functional Requirements (MVP)

Backend:

Runs a single server process with Mastra and Hono.

Uses Postgres as the Mastra storage adapter.

Uses Drizzle ORM for all database access.

ElectricSQL is running and integrated via a backend proxy-auth route to provide user-scoped shapes.

Provides endpoints for:

Registration (email, password) that persists a new user.

Login that sets an httpOnly session cookie and persists across refreshes.

Logout that clears the session.

Workflow trigger to run “tell me a joke” and persist the joke tied to the authenticated user.

Frontend:

SPA built with React, TypeScript, Vite, React Router, and shadcn/ui.

Registration and login screens.

A protected page that only logged-in users can access; unauthenticated access redirects to login.

A button/interaction to trigger the “tell me a joke” workflow.

A view that displays the authenticated user’s past jokes, live-synced through ElectricSQL shapes via the backend proxy.

Ability to log out.

Data & Sync:

All synced reads use ElectricSQL via the backend’s proxy-auth route (recommended approach).

All writes go through backend API endpoints; Electric sync reflects changes to the client.

Non-Goals for Module 0:

Email verification, password reset flows.

Multi-tenant organizations, RBAC, audit logs, notifications, idea module, file uploads.

7) Acceptance Criteria (Module 0)

Server & Infra:

Backend starts successfully with Mastra + Hono, connected to Postgres.

Electric service runs and is reachable from the backend only; client access is solely through the backend proxy-auth route.

Drizzle migrations applied; required tables exist.

Auth:

A new user can register with email and password; entry appears in the database.

The user can log in; an httpOnly session cookie is set.

Session persists after page refresh.

The user can log out; session cookie is cleared; protected routes redirect to login thereafter.

Workflow & Data:

When authenticated, the user can trigger “tell me a joke”.

The generated joke is stored in the jokes table associated with the user.

The jokes list in the client updates to include the newly created joke without a manual refresh, using ElectricSQL sync.

Unauthenticated users cannot access protected data or endpoints and are redirected as appropriate.

Client UX:

SPA routes:

Public: login, registration.

Private: dashboard or jokes page (accessible only when authenticated).

Protected route logic enforces access and correct redirection.

Basic UI implemented using shadcn/ui primitives.

Documentation:

README includes a quick start (infra up, env setup, running backend and client) and the acceptance checklist above.

8) Deliverables (Module 0)

Monorepo with api and client workspaces configured via pnpm workspaces.

Docker Compose file for Postgres (with logical replication), Electric service, and MinIO (even if unused in Module 0).

Root-level environment configuration documented and consumed by both apps.

Backend app with:

Mastra configured with Postgres storage.

Hono routes for auth, workflow trigger, and Electric proxy-auth for shapes.

Drizzle ORM with migrations for Users, Sessions (or equivalent), and Jokes.

Frontend app with:

React + TS + Vite + React Router + shadcn/ui setup.

Auth forms and flows.

Protected route and redirect behavior.

Jokes page with live list via ElectricSQL through the backend proxy.

Root README describing setup, run, and Module 0 acceptance.

9) Constraints and Guardrails

Do not expose the Electric service directly to the browser. All shape traffic must go through the backend proxy-auth endpoint with strict validation and user scoping.

Use httpOnly cookies for auth; do not store tokens in localStorage.

Writes go through the backend API; the client must never write directly to the database or Electric.

Prefer minimal, well-named env variables as listed above; validate presence on startup.

Keep the code structured and ready for future modules (workspaces, RBAC, email, file storage) without adding those features in Module 0.

10) Notes for Next Modules (for context only)

Module 1: Multi-tenant workspaces, roles/entitlements, invitations, Resend emails, MinIO uploads, admin/owner rules.

Module 2: Audit Log (single-table, enterprise-ready), platform- and org-level views with entitlements.

Module 3: Notification system with inbox UX and email preferences.

Module 4: Idea Evaluation (ideas, scorecards, Mastra evaluation workflow).

End of brief.