---
stepsCompleted: [1, 2, 3, 4]
status: complete
completedAt: "2026-03-07"
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-todo-app-bmad-2026-03-07.md'
  - '_bmad-output/planning-artifacts/architecture.md'
---

# todo-app-bmad - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for todo-app-bmad, decomposing the requirements from the Product Brief and Architecture Decision Document into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can create a new todo by entering a short text description and submitting it — the todo appears in the list immediately after creation.
FR2: User can view all todos on load — the full list of todos (active and completed) is displayed in creation order (created_at ASC).
FR3: User can toggle a todo's completion status — completed todos are visually distinguished from active ones at a glance.
FR4: User can permanently delete a todo — the list updates immediately after deletion.
FR5: The application displays a clear, inviting empty state when no todos exist.
FR6: The application displays a visible loading state while the todo list is being fetched.
FR7: The application displays user-visible error feedback for any API failure (create, complete, delete, fetch).
FR8: The application is mobile-responsive — usable on both desktop and mobile viewports.

### NonFunctional Requirements

NFR1: Performance — UI interactions (add, complete, delete) must have < 200ms perceived latency under normal conditions.
NFR2: Performance — API response time must be < 300ms p95 under normal conditions.
NFR3: Performance — Page load to interactive (first visit) must be < 2s on a standard connection.
NFR4: Reliability — Task persistence across browser refresh and sessions must be 100% — zero data loss.
NFR5: Reliability — API error rate under normal conditions must be < 1%.
NFR6: Architecture Conformance — Zero dependency-cruiser layer boundary violations, enforced in CI.
NFR7: Architecture Conformance — Zero TypeScript strict mode errors on `tsc --noEmit`.
NFR8: Architecture Conformance — Zero Biome lint/format violations, enforced in pre-commit hook.
NFR9: Test Coverage — All four core user actions (create, view, complete, delete) covered by passing Cucumber E2E scenarios on both backend and frontend.
NFR10: Test Coverage — Backend unit/integration tests cover core domain handlers and repository.
NFR11: Extensibility — Schema and module structure must accommodate future auth and richer metadata (priorities, due dates) without architectural rewrite.

### Additional Requirements

**From Architecture — Starter Templates & Monorepo Setup (Critical: impacts Epic 1 Story 1):**
- Architecture specifies a monorepo scaffold using two degit-based boilerplates: `marcoturi/react-redux-boilerplate` → `apps/web` and `marcoturi/fastify-boilerplate` → `apps/api`, orchestrated with moon and pnpm workspaces.
- Monorepo scaffolding (moon + degit both boilerplates + `packages/shared`) constitutes the FIRST implementation epic.
- **Mercurius removal (Priority: High)** — The fastify-boilerplate scaffold includes Mercurius (GraphQL). This must be explicitly removed in the monorepo setup story. Remove: `mercurius`, `@graphql-tools/load-files`, `@graphql-tools/merge`, and all `*.graphql-schema.ts` and `*.resolver.ts` files.

**From Architecture — Database & Infrastructure:**
- PostgreSQL via Docker Compose at the monorepo root; DBMate manages SQL migration files.
- `todos` table schema: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `description TEXT NOT NULL CHECK (char_length(description) > 0)`, `completed BOOLEAN NOT NULL DEFAULT FALSE`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- Index on `created_at ASC` for ordered list queries.
- **`updated_at` explicit update (Priority: Medium)** — PostgreSQL does not auto-update `updated_at` without a trigger. The `UpdateTodo` repository method must explicitly set `updated_at = now()` in the UPDATE query.

**From Architecture — API Design:**
- REST-only API under base path `/api/v1/`. No GraphQL.
- Four endpoints: `GET /api/v1/todos`, `POST /api/v1/todos`, `PATCH /api/v1/todos/:id`, `DELETE /api/v1/todos/:id`.
- Error responses follow RFC 9457 shape (Fastify native): `{ statusCode, error, message }`.
- HTTP status codes: 200 (GET/PATCH/DELETE success), 201 (POST success), 400 (validation failure), 404 (not found), 500 (unexpected error).
- Input validation: `description` non-empty string, max 500 characters. `id` path param validated as UUID format at route layer.
- CORS: `http://localhost:5173` in dev; `FRONTEND_URL` env var in production.
- API responses are direct objects/arrays — no wrapper envelopes. JSON field names are `camelCase`. Dates as ISO 8601 strings.

**From Architecture — Shared Types (`packages/shared`):**
- `packages/shared` is a pnpm workspace package (`@todo-app/shared`) exporting hand-written TypeScript types for v1: `Todo`, `CreateTodoRequest`, `UpdateTodoRequest`.
- Both `apps/api` and `apps/web` import from `@todo-app/shared` — types are never duplicated inline.

**From Architecture — Backend (Clean Architecture + CQRS):**
- Backend pattern: Clean Architecture + CQRS + DDD + Hexagonal.
- Dependency flow strictly enforced by dependency-cruiser: Route → Handler → Domain → Repository.
- CQRS handlers: `CreateTodoCommand`, `UpdateTodoCommand`, `DeleteTodoCommand` (commands); `FindTodosQuery` (query).
- Exact backend module folder structure as defined in Architecture must be followed.
- `pino` logger injected via Awilix DI — never `console.log`.

**From Architecture — Frontend (React + Redux + RTK Query):**
- API integration via RTK Query with tag-based cache invalidation (`'Todo'` tag).
- No optimistic updates in v1 — tag invalidation re-fetch is the strategy.
- Loading states: use RTK Query `isLoading` (first load) and `isFetching` (re-fetch) from `useGetTodosQuery()`.
- Error states: all four operations must display user-visible feedback via RTK Query `isError`/`error`.
- Dates treated as strings on the frontend — `createdAt` not surfaced in the UI in v1.
- Exact frontend feature folder structure as defined in Architecture must be followed.

**From Architecture — Testing Strategy:**
- Backend: `node:test` unit tests + Cucumber/Gherkin E2E tests. `*.spec.ts` co-located with source. E2E `.feature` files in `tests/todos/`.
- Frontend: Vitest + Testing Library unit tests + Cucumber/Playwright E2E. `*.spec.tsx` co-located with components. E2E `.feature` files in `e2e/todos/`.

**From Architecture — CI/CD:**
- GitHub Actions workflow: lint + type-check + unit tests + E2E tests on every push to `main`.
- Semantic-release on merge to `main`.
- `dependency-cruiser` validates layer boundaries in CI (zero violations required).

### FR Coverage Map

FR1: Epic 2 — Backend + frontend implementation of todo creation (POST /api/v1/todos + CreateTodoForm)
FR2: Epic 2 — Backend + frontend implementation of todo list view (GET /api/v1/todos + TodoList)
FR3: Epic 3 — Backend + frontend implementation of completion toggle (PATCH /api/v1/todos/:id + TodoItem)
FR4: Epic 3 — Backend + frontend implementation of delete (DELETE /api/v1/todos/:id + TodoItem)
FR5: Epic 2 — Empty state UI in TodoList component
FR6: Epic 2 — Loading state UI in TodoList component (RTK Query isLoading)
FR7: Epic 2 (get + create errors) + Epic 3 (update + delete errors) — User-visible error feedback across all four operations; list state preserved on failure (FR16)
FR8: Epic 3 — Mobile-responsive layout applied across all components
FR9 (PRD FR17): Epic 2 — Enter key submission in CreateTodoForm (Story 2.4)
FR10 (PRD FR18): Epic 2 — Input cleared after successful create (Story 2.4)
FR11 (PRD FR19): Epic 2 — Input text preserved on failed create (Story 2.4)
FR12 (PRD FR26): Epic 1 — README-driven local setup, zero undocumented steps (Story 1.5)

NFR1: Epic 2 + Epic 3 — < 200ms UI interaction latency (RTK Query tag invalidation strategy)
NFR2: Epic 2 + Epic 3 — < 300ms API p95 (indexed DB queries, simple handlers)
NFR3: Epic 2 — < 2s page load to interactive (Vite SPA, RTK Query initial fetch)
NFR4: Epic 3 — Vite production build with code splitting + tree-shaking verified (Story 3.9)
NFR5: Epic 2 — 100% task persistence (PostgreSQL single source of truth, RTK Query re-fetch after mutations)
NFR6: Epic 2 + Epic 3 — < 1% API error rate (TypeBox validation, typed domain errors)
NFR7: Epic 1 — Zero dependency-cruiser violations (configured in CI pipeline)
NFR8: Epic 1 — Zero TypeScript errors (enforced in CI via tsc --noEmit)
NFR9: Epic 1 — Zero Biome violations (enforced via pre-commit hook and CI)
NFR10: Epic 2 + Epic 3 — All four core actions covered by Cucumber E2E (backend + frontend)
NFR11: Epic 2 + Epic 3 — Backend unit/integration tests covering all handlers and repository
NFR12: Epic 1 — Extensible schema and module structure (UUID PKs, versioned API, CQRS, vertical slice)
NFR13: Epic 3 — All error states dismissible or retryable — no unrecoverable UI states (Stories 2.3, 2.4, 3.3)
NFR14: Epic 3 — prefers-reduced-motion respected via Tailwind motion-reduce: variant (Story 3.8)
NFR15: Epic 3 — Visible keyboard focus indicators on all interactive controls (Story 3.8)
NFR16: Epic 3 — ARIA live regions on loading, empty, and error states (Story 3.8)

## Epic List

### Epic 1: Project Foundation
Set up the complete monorepo infrastructure so that all subsequent feature epics can be built and delivered independently. After this epic, both app scaffolds are in place, the database schema exists, the shared types package is initialised, the CI/CD pipeline validates every push, and a README enables any developer to run the full stack from a clean clone.
**FRs covered:** FR26 (README-driven setup — Story 1.5)
**NFRs covered:** NFR6, NFR7, NFR8, NFR11

### Epic 2: Users Can View and Create Todos
A user can open the app, see their full task list (with empty and loading states), and add new tasks. This delivers the first meaningful user experience — the moment Alex sees a clean empty state and adds her first task. Includes backend API, shared types, and frontend UI for the view and create operations.
**FRs covered:** FR1, FR2, FR5, FR6, FR7 (partial — fetch and create error states)
**NFRs covered:** NFR1, NFR2, NFR3, NFR4, NFR5, NFR9 (partial — create + view E2E), NFR10 (partial)

### Epic 3: Users Can Complete and Delete Todos
A user can mark todos as complete (with clear visual distinction) and permanently delete todos they no longer need. This completes the full task lifecycle loop and makes the product shippable. Includes backend API, frontend UI, error states for all remaining operations, mobile-responsive layout across all components, and full Docker containerisation so the app can be run with a single `docker compose up`.
**FRs covered:** FR3, FR4, FR7 (complete — update and delete error states), FR8
**NFRs covered:** NFR1, NFR9 (complete — all four E2E scenarios), NFR10 (complete)

---

## Epic 1: Project Foundation

Set up the complete monorepo infrastructure so that all subsequent feature epics can be built and delivered independently. After this epic, both app scaffolds are in place, the database schema exists, the shared types package is initialised, and the CI/CD pipeline validates every push.

### Story 1.1: Monorepo Scaffolding and Boilerplate Initialization

As a developer,
I want the moon-managed pnpm monorepo scaffolded with both app boilerplates and the shared package,
So that the project has a clean, consistent foundation for all subsequent development.

**Acceptance Criteria:**

**Given** a new empty repository,
**When** the developer runs the monorepo setup sequence,
**Then** the monorepo root has `pnpm-workspace.yaml`, `moon.yml`, and `package.json` configured for pnpm 10.x and Node 24.x.
**And** `apps/web` is initialised from `marcoturi/react-redux-boilerplate` via `npx degit marcoturi/react-redux-boilerplate apps/web`.
**And** `apps/api` is initialised from `marcoturi/fastify-boilerplate` via `npx degit marcoturi/fastify-boilerplate apps/api`.
**And** `packages/shared` exists as a pnpm workspace package with `name: "@todo-app/shared"` in its `package.json`, a `tsconfig.json`, and an `src/index.ts` entry point.
**And** `.moon/workspace.yml` correctly references all three workspace members (`apps/web`, `apps/api`, `packages/shared`).
**And** `pnpm install` completes successfully from the monorepo root with no errors.

**Given** the `apps/api` scaffold has been initialised from `marcoturi/fastify-boilerplate`,
**When** the developer removes GraphQL dependencies,
**Then** `mercurius`, `@graphql-tools/load-files`, `@graphql-tools/merge`, and all GraphQL-related packages are removed from `apps/api/package.json`.
**And** all `*.graphql-schema.ts` and `*.resolver.ts` files are deleted from `apps/api/src/`.
**And** `pnpm install` still completes successfully after removal.
**And** `pnpm --filter apps/api check` passes with zero Biome errors after removal.

**Given** the monorepo is fully scaffolded,
**When** the developer inspects the test and E2E scripts in each app,
**Then** `apps/api/package.json` contains scripts: `test` (runs node:test unit tests), `test:coverage` (runs unit tests with c8 coverage report), and `test:e2e` (runs Cucumber E2E suite).
**And** `apps/web/package.json` contains scripts: `test` (runs Vitest unit tests), `test:coverage` (runs Vitest with coverage reporter), and `test:e2e` (runs Cucumber + Playwright E2E suite).
**And** running `pnpm --filter apps/api test` and `pnpm --filter apps/web test` both exit with code 0 on the scaffolded boilerplate.

---

### Story 1.2: Database Infrastructure Setup

As a developer,
I want Docker Compose PostgreSQL and DBMate migrations configured for the todos database,
So that the backend has a reliable, reproducible local database with the correct schema from day one.

**Acceptance Criteria:**

**Given** the monorepo root has a `docker-compose.yml`,
**When** the developer runs `docker compose up postgres -d`,
**Then** a PostgreSQL instance is running and accessible at `localhost:5432` with database `todos`, user `postgres`, password `postgres`.

**Given** the PostgreSQL instance is running,
**When** the developer runs `pnpm db:migrate` from `apps/api`,
**Then** DBMate applies the migration file `apps/api/db/migrations/20260307000000_create_todos_table.sql`.
**And** the `todos` table exists with columns: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `description TEXT NOT NULL CHECK (char_length(description) > 0)`, `completed BOOLEAN NOT NULL DEFAULT FALSE`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
**And** a `todos_created_at_idx` index exists on `todos (created_at ASC)`.

**Given** a `.env.example` file exists in `apps/api`,
**When** a developer copies it to `apps/api/.env`,
**Then** the file contains `DATABASE_URL`, `DBMATE_DATABASE_URL`, `HOST`, `PORT`, and `FRONTEND_URL` with correct default values for local development.

**Given** a `.env.example` file exists in `apps/web`,
**When** a developer copies it to `apps/web/.env`,
**Then** the file contains `VITE_API_URL=http://localhost:3000`.

**Given** the backend server is running,
**When** `GET /health` is called on `apps/api`,
**Then** the response is `200 OK` with a JSON body indicating service health (e.g. `{ "status": "ok" }`).
**And** the `/health` route is registered outside the `/api/v1/` prefix so it is always reachable.
**And** the Docker `HEALTHCHECK` instruction in `apps/api/Dockerfile` polls this endpoint to determine container health.

---

### Story 1.3: Shared Types Package

As a developer,
I want the `@todo-app/shared` package to export all TypeScript types for the todo API contract,
So that both `apps/api` and `apps/web` consume the same type definitions without duplication.

**Acceptance Criteria:**

**Given** the `packages/shared` package is initialised,
**When** `packages/shared/src/todos.ts` is created,
**Then** it exports a `Todo` type with `{ id: string; description: string; completed: boolean; createdAt: string; updatedAt: string }` — dates as ISO strings for JSON transport.
**And** it exports a `CreateTodoRequest` type with `{ description: string }`.
**And** it exports an `UpdateTodoRequest` type with `{ completed: boolean }`.

**Given** `packages/shared/src/index.ts` exists,
**When** it is imported by either app,
**Then** it re-exports all public types from `todos.ts`.

**Given** `packages/shared/tsconfig.json` is configured,
**When** `tsc --noEmit` runs in the package,
**Then** there are zero TypeScript errors.

**Given** `apps/api` imports from `@todo-app/shared`,
**When** the import resolves at runtime in the ESM-only Node 24.x environment,
**Then** no module resolution errors occur.

**Given** `apps/web` imports from `@todo-app/shared`,
**When** the import resolves in the Vite 7.x build environment,
**Then** no module resolution errors occur.

---

### Story 1.4: CI/CD Pipeline Configuration

As a developer,
I want a GitHub Actions CI/CD pipeline configured,
So that every push to `main` automatically validates the codebase and semantic-release handles versioning on merge.

**Acceptance Criteria:**

**Given** a push is made to the `main` branch,
**When** the GitHub Actions workflow runs,
**Then** the workflow runs Biome lint/format checks across both apps — failing on any violation.
**And** the workflow runs `tsc --noEmit` type-checks across both apps — failing on any TypeScript error.
**And** the workflow runs unit tests in `apps/api` and `apps/web`.
**And** the workflow runs E2E tests for both backend (Cucumber/Gherkin) and frontend (Cucumber/Playwright).

**Given** the CI workflow runs,
**When** dependency-cruiser validation is executed,
**Then** zero architecture layer boundary violations are reported — the build fails on any violation.

**Given** the CI workflow runs unit tests,
**When** coverage reports are generated for `apps/api` and `apps/web`,
**Then** the pipeline enforces a minimum of 70% meaningful coverage — failing the build if the threshold is not met.
**And** coverage reports are generated using c8 (backend) and Vitest's built-in coverage reporter (frontend).

**Given** a PR is merged to `main`,
**When** all CI checks pass,
**Then** semantic-release runs and creates a versioned release based on conventional commits.

---

### Story 1.5: README and Developer Onboarding Documentation

As a developer,
I want a complete README that guides me from a clean clone to a fully running application,
So that I can set up, run, and contribute to the project without needing to ask any questions or consult undocumented steps.

**Acceptance Criteria:**

**Given** a developer clones the repository for the first time,
**When** they open the root `README.md`,
**Then** it documents all prerequisites with exact versions: Node.js 24.x, pnpm 10.x, Docker Desktop (or Docker Engine + Compose plugin).

**Given** the prerequisites are met,
**When** the developer follows the README setup sequence,
**Then** the sequence covers these steps in order: clone the repo, run `pnpm install` from the monorepo root, copy `.env.example` to `.env` in both `apps/api` and `apps/web`, run `docker compose up postgres -d`, run `pnpm db:migrate` from `apps/api`, start the backend with `pnpm start` from `apps/api`, start the frontend with `pnpm dev` from `apps/web`.
**And** each step includes the exact command to run — no implicit or assumed knowledge required.
**And** following the sequence results in the app running and accessible in the browser with no additional steps.

**Given** a developer wants to run the test suite,
**When** they consult the README testing section,
**Then** it documents: `pnpm --filter apps/api test` (backend unit tests), `pnpm --filter apps/api test:e2e` (backend Cucumber E2E), `pnpm --filter apps/web test` (frontend unit tests), `pnpm --filter apps/web test:e2e` (frontend Playwright E2E), and `pnpm --filter apps/web test:a11y` (accessibility audit).

**Given** a developer wants to run the full stack via Docker,
**When** they consult the README Docker section,
**Then** it documents: copy root `.env.example` to `.env`, run `docker compose up --build`, and confirms the frontend and API ports to access.

**Given** a developer wants to understand the project structure,
**When** they read the README,
**Then** it includes a brief project structure overview listing the monorepo members (`apps/api`, `apps/web`, `packages/shared`) with a one-line description of each.
**And** it includes a link or reference to the Architecture Decision Document (`_bmad-output/planning-artifacts/architecture.md`) for deeper technical context.

---

## Epic 2: Users Can View and Create Todos

A user can open the app, see their full task list (with empty and loading states), and add new tasks. This delivers the first meaningful user experience — the moment Alex sees a clean empty state and adds her first task. Covers the full vertical slice: backend API, shared types integration, and frontend UI for the view and create operations with error handling.

### Story 2.1: Find Todos API Endpoint

As an API consumer,
I want a `GET /api/v1/todos` endpoint that returns all todos ordered by creation date,
So that clients can retrieve the complete todo list.

**Acceptance Criteria:**

**Given** the backend todos module is being built,
**When** the domain, repository, and DI registration are implemented,
**Then** `src/modules/todos/domain/todo.types.ts` defines the `Todo` domain entity with fields: `id: string`, `description: string`, `completed: boolean`, `createdAt: Date`, `updatedAt: Date`.
**And** `src/modules/todos/domain/todo.errors.ts` defines `TodoNotFoundError` extending `NotFoundException` from `src/shared/exceptions/`.
**And** `src/modules/todos/database/todo.repository.port.ts` exports a `TodoRepositoryPort` interface with `findAll()`, `findById()`, `create()`, `update()`, and `delete()` methods.
**And** `src/modules/todos/database/todo.repository.ts` implements `TodoRepositoryPort` using `postgres.js` tagged template literals, with `findAll()` querying `SELECT * FROM todos ORDER BY created_at ASC`.
**And** `src/modules/todos/todo.mapper.ts` converts DB `snake_case` rows to domain `camelCase` and domain `Todo` (with `Date` objects) to `TodoResponse` DTO (with ISO 8601 strings).
**And** `src/modules/todos/dtos/todo.response.dto.ts` uses types from `@todo-app/shared`.
**And** `src/modules/todos/index.ts` registers `TodoRepository` with Awilix and all handlers with the CQRS bus.

**Given** the database contains zero todos,
**When** `GET /api/v1/todos` is called,
**Then** the response is `200 OK` with an empty JSON array `[]`.

**Given** the database contains multiple todos,
**When** `GET /api/v1/todos` is called,
**Then** the response is `200 OK` with a JSON array of todo objects ordered by `createdAt ASC`.
**And** each todo object has fields: `id` (UUID string), `description` (string), `completed` (boolean), `createdAt` (ISO 8601 string), `updatedAt` (ISO 8601 string).
**And** the response is a direct array — no wrapper envelope (e.g. NOT `{ data: [...] }`).

**Given** the `FindTodosQuery` handler is unit tested in `find-todos.handler.spec.ts`,
**When** the tests run,
**Then** they cover: successful list retrieval and empty list — all passing.

**Given** the Cucumber E2E test suite runs `find-todos.feature`,
**When** scenarios execute against the live server and database,
**Then** all scenarios pass, including: empty list, list with one todo, list with multiple todos in creation order.

**Given** the `GET /api/v1/todos` endpoint is implemented,
**When** the API contract is validated using an HTTP client tool (e.g. Postman MCP or equivalent),
**Then** the response shape exactly matches the `Todo[]` type defined in `@todo-app/shared` — field names, types, and date format (ISO 8601) all confirmed.
**And** the response `Content-Type` header is `application/json`.
**And** the contract validation result is documented (screenshot or exported collection) as part of story completion evidence.

---

### Story 2.2: Create Todo API Endpoint

As an API consumer,
I want a `POST /api/v1/todos` endpoint that creates a new todo,
So that clients can add todos to the list.

**Acceptance Criteria:**

**Given** a valid request body `{ "description": "Buy milk" }`,
**When** `POST /api/v1/todos` is called,
**Then** the response is `201 Created` with the newly created todo object: `{ id, description, completed: false, createdAt, updatedAt }`.
**And** the todo is persisted in the database and retrievable via `GET /api/v1/todos`.

**Given** a request body with an empty description `{ "description": "" }`,
**When** `POST /api/v1/todos` is called,
**Then** the response is `400 Bad Request` with RFC 9457 error shape: `{ "statusCode": 400, "error": "Bad Request", "message": "..." }`.

**Given** a request body with a description exceeding 500 characters,
**When** `POST /api/v1/todos` is called,
**Then** the response is `400 Bad Request` with RFC 9457 error shape.

**Given** a request body with no `description` field,
**When** `POST /api/v1/todos` is called,
**Then** the response is `400 Bad Request`.

**Given** the `CreateTodoCommand` handler is unit tested in `create-todo.handler.spec.ts`,
**When** the tests run,
**Then** they cover: successful creation, empty description rejection, description too long rejection — all passing.

**Given** the Cucumber E2E test suite runs `create-todo.feature`,
**When** scenarios execute,
**Then** all scenarios pass, including: successful creation with correct response shape, empty description rejection, description too long rejection.

**Given** the `POST /api/v1/todos` endpoint is implemented,
**When** the API contract is validated using an HTTP client tool (e.g. Postman MCP or equivalent),
**Then** a successful creation request returns status `201` with a response body matching the `Todo` type from `@todo-app/shared`.
**And** an invalid request (empty description) returns status `400` with an RFC 9457 error body: `{ statusCode, error, message }`.
**And** the contract validation result is documented as part of story completion evidence.

---

### Story 2.3: Todo List UI with Loading and Empty States

As Alex (the user),
I want to see all my todos on the page with clear loading and empty states,
So that I always know the current status of my task list.

**Acceptance Criteria:**

**Given** the RTK Query todos API slice is configured in `src/features/todos/store/todos.api.ts`,
**When** it is set up,
**Then** it extends the base API with tag `'Todo'` and defines the `getTodos` query calling `GET /api/v1/todos`, providing the `['Todo']` tag.
**And** it defines the `createTodo` mutation calling `POST /api/v1/todos`, invalidating the `['Todo']` tag.
**And** `src/features/todos/store/todos.types.ts` imports `Todo` and `CreateTodoRequest` from `@todo-app/shared` — no inline type duplication.
**And** `src/features/todos/hooks/useTodos.ts` encapsulates `useGetTodosQuery` and `useCreateTodoMutation` and exposes a clean interface to components.
**And** `VITE_API_URL` is centralised in `src/shared/config/env.ts` and used as the base URL.

**Given** the app is loading todos for the first time (no cached data),
**When** the `TodoList` component renders,
**Then** a visible loading indicator (skeleton or spinner) is displayed while `isLoading` is true from `useGetTodosQuery()`.

**Given** the API returns an empty array,
**When** the `TodoList` component renders,
**Then** a clear, inviting empty state message is displayed (e.g. "No tasks yet — add one above!").
**And** no todo items are rendered.

**Given** the API returns a non-empty list,
**When** the `TodoList` component renders,
**Then** all todos are displayed in creation order (oldest first).
**And** each todo shows its description text.
**And** completed todos are visually distinct from active todos (e.g. strikethrough text, muted colour, checked checkbox).

**Given** the API returns an error,
**When** the `TodoList` component renders with `isError: true`,
**Then** a user-visible error message is displayed (e.g. "Failed to load tasks. Please try again.").
**And** no crash or blank screen occurs.
**And** the todo list displayed to the user is unchanged from its state before the failed operation — no partial or silent mutations occur.
**And** the error message is dismissible or a retry affordance is provided so the user can attempt the operation again.

**Given** `TodoList.spec.tsx` is created,
**When** it runs under Vitest + Testing Library with MSW,
**Then** tests cover: loading state, empty state, populated list, error state — all passing.

---

### Story 2.4: Create Todo Form UI

As Alex (the user),
I want to type a task description and submit it to add a new todo,
So that I can add tasks to my list without friction.

**Acceptance Criteria:**

**Given** the user opens the app,
**When** the `CreateTodoForm` component renders,
**Then** a text input field and a submit button (or Enter key support) are visible.
**And** the input has a clear placeholder indicating its purpose (e.g. "Add a new task...").

**Given** the user types a non-empty description and submits,
**When** the `createTodo` mutation is dispatched,
**Then** the form input is cleared immediately after submission.
**And** the todo list re-fetches automatically via RTK Query `['Todo']` tag invalidation and the new todo appears.
**And** the perceived latency from submit to list update is under 200ms under normal conditions.

**Given** the user attempts to submit an empty input,
**When** the submit action is triggered,
**Then** the form does not dispatch the `createTodo` mutation.
**And** a validation message is shown to the user.

**Given** the input field has focus and contains a non-empty value,
**When** the user presses the Enter key,
**Then** the `createTodo` mutation is dispatched — Enter key submission is equivalent to activating the submit control.

**Given** the `createTodo` mutation returns an error,
**When** the component renders with `isError: true`,
**Then** a user-visible error message is displayed near the form (e.g. "Failed to add task. Please try again.").
**And** the input field still contains the text the user entered — the value is not cleared on failure.
**And** the error message is dismissible or a retry affordance is provided so the user can attempt the operation again.

**Given** `CreateTodoForm.spec.tsx` is created,
**When** it runs under Vitest + Testing Library with MSW,
**Then** tests cover: successful creation and list update, empty input validation, API error display — all passing.

---

### Story 2.5: Backend Cucumber E2E Tests for View and Create

As a developer,
I want Cucumber/Gherkin E2E tests covering the find and create todo operations,
So that the backend API is validated end-to-end against a real database.

**Acceptance Criteria:**

**Given** the Cucumber E2E suite is configured in `apps/api/cucumber.mjs`,
**When** `tests/todos/find-todos.feature` and `tests/todos/create-todo.feature` are created,
**Then** `find-todos.feature` contains scenarios: retrieve empty list, retrieve list with one todo, retrieve list with multiple todos in creation order.
**And** `create-todo.feature` contains scenarios: successful creation with correct 201 response, empty description returns 400, description over 500 chars returns 400, missing description field returns 400.

**Given** `tests/todos/todos.steps.ts` contains step definitions using the `buildApp()` test server factory from `tests/support/server.ts`,
**When** the Cucumber E2E suite runs,
**Then** all scenarios in both feature files pass with zero failures.
**And** `tests/support/hooks.ts` ensures the database is cleaned between scenarios.

**Given** the CI pipeline runs,
**When** the backend E2E step executes,
**Then** all Cucumber scenarios pass and the pipeline does not fail on flaky tests.

---

### Story 2.6: Frontend Cucumber E2E Tests for View and Create

As a developer,
I want Cucumber + Playwright E2E tests covering the view and create todo user journeys,
So that the full frontend experience is validated in a real browser against the live stack.

**Acceptance Criteria:**

**Given** the Cucumber + Playwright E2E suite is configured in `apps/web/cucumber.mjs`,
**When** `e2e/todos/todos.feature` is created,
**Then** it contains scenarios: empty state is shown on first load, user can add a new todo and it appears in the list, newly added todo persists after page reload.

**Given** `e2e/todos/todos.steps.ts` contains Playwright step definitions,
**When** the E2E suite runs against the live app (frontend + backend + DB),
**Then** all scenarios pass with zero failures.

---

## Epic 3: Users Can Complete and Delete Todos

A user can mark todos as complete (with clear visual distinction) and permanently delete todos they no longer need. This completes the full task lifecycle loop and makes the product shippable. Covers the remaining backend endpoints, frontend interactions, all remaining error states, the mobile-responsive layout across all components, and Docker containerisation so the full stack runs with a single `docker compose up`.

### Story 3.1: Update Todo API Endpoint (Toggle Completion)

As an API consumer,
I want a `PATCH /api/v1/todos/:id` endpoint that updates a todo's completion status,
So that clients can mark todos as complete or incomplete.

**Acceptance Criteria:**

**Given** a todo with `id` exists in the database with `completed: false`,
**When** `PATCH /api/v1/todos/:id` is called with body `{ "completed": true }`,
**Then** the response is `200 OK` with the updated todo object including `completed: true`.
**And** `updatedAt` in the response reflects the time of the update and is greater than `createdAt`.
**And** the repository executes `UPDATE todos SET completed = $1, updated_at = now() WHERE id = $2 RETURNING *` — explicitly setting `updated_at`.

**Given** a todo exists with `completed: true`,
**When** `PATCH /api/v1/todos/:id` is called with body `{ "completed": false }`,
**Then** the response is `200 OK` with the updated todo object including `completed: false`.

**Given** a todo with the specified `id` does not exist,
**When** `PATCH /api/v1/todos/:id` is called,
**Then** the response is `404 Not Found` with RFC 9457 error shape: `{ "statusCode": 404, "error": "Not Found", "message": "Todo with id '...' not found" }`.

**Given** the `:id` path parameter is not a valid UUID,
**When** `PATCH /api/v1/todos/:id` is called,
**Then** the response is `400 Bad Request` (UUID format validated at route layer by TypeBox).

**Given** the `UpdateTodoCommand` handler is unit tested in `update-todo.handler.spec.ts`,
**When** the tests run,
**Then** they cover: mark as complete, mark as incomplete, todo not found — all passing.

**Given** the Cucumber E2E test suite runs `update-todo.feature`,
**When** scenarios execute,
**Then** all scenarios pass, including: mark complete, mark incomplete, not found, invalid UUID.

---

### Story 3.2: Delete Todo API Endpoint

As an API consumer,
I want a `DELETE /api/v1/todos/:id` endpoint that permanently removes a todo,
So that clients can delete todos from the list.

**Acceptance Criteria:**

**Given** a todo with `id` exists in the database,
**When** `DELETE /api/v1/todos/:id` is called,
**Then** the response is `200 OK` with an empty body.
**And** the todo is no longer retrievable via `GET /api/v1/todos`.

**Given** a todo with the specified `id` does not exist,
**When** `DELETE /api/v1/todos/:id` is called,
**Then** the response is `404 Not Found` with RFC 9457 error shape.

**Given** the `:id` path parameter is not a valid UUID,
**When** `DELETE /api/v1/todos/:id` is called,
**Then** the response is `400 Bad Request`.

**Given** the `DeleteTodoCommand` handler is unit tested in `delete-todo.handler.spec.ts`,
**When** the tests run,
**Then** they cover: successful deletion, todo not found, invalid UUID — all passing.

**Given** the Cucumber E2E test suite runs `delete-todo.feature`,
**When** scenarios execute,
**Then** all scenarios pass, including: successful deletion, not found, invalid UUID.

---

### Story 3.3: Complete and Delete Todo UI

As Alex (the user),
I want to mark a todo as complete and delete todos I no longer need,
So that I can manage the full lifecycle of my tasks.

**Acceptance Criteria:**

**Given** the RTK Query todos API slice is updated in `src/features/todos/store/todos.api.ts`,
**When** the `updateTodo` and `deleteTodo` mutations are added,
**Then** `updateTodo` calls `PATCH /api/v1/todos/:id` and invalidates the `['Todo']` tag.
**And** `deleteTodo` calls `DELETE /api/v1/todos/:id` and invalidates the `['Todo']` tag.
**And** `src/features/todos/store/todos.types.ts` imports `UpdateTodoRequest` from `@todo-app/shared`.
**And** `src/features/todos/hooks/useTodos.ts` exposes `useUpdateTodoMutation` and `useDeleteTodoMutation`.

**Given** an active todo is displayed in the list,
**When** the user toggles the completion control (e.g. checkbox),
**Then** the `updateTodo` mutation is dispatched with `{ completed: true }`.
**And** after the mutation resolves, the todo is visually updated to show as completed (e.g. strikethrough text, muted colour, checked checkbox).
**And** the perceived latency from toggle to visual update is under 200ms under normal conditions.

**Given** a completed todo is displayed in the list,
**When** the user toggles the completion control,
**Then** the `updateTodo` mutation is dispatched with `{ completed: false }`.
**And** after the mutation resolves, the todo is visually updated to show as active.

**Given** a todo is displayed in the list,
**When** the user clicks the delete control (e.g. trash icon button),
**Then** the `deleteTodo` mutation is dispatched.
**And** after the mutation resolves, the todo is removed from the list.

**Given** the `updateTodo` mutation returns an error,
**When** the `TodoItem` component renders with `isError: true`,
**Then** a user-visible error message is displayed (e.g. "Failed to update task. Please try again.").
**And** the todo's completion state in the list is unchanged from before the failed operation — no silent mutation occurs.
**And** the error message is dismissible or a retry affordance is provided.

**Given** the `deleteTodo` mutation returns an error,
**When** the `TodoItem` component renders with `isError: true`,
**Then** a user-visible error message is displayed (e.g. "Failed to delete task. Please try again.").
**And** the todo remains visible in the list — it is not removed on failure.
**And** the error message is dismissible or a retry affordance is provided.

**Given** `TodoItem.spec.tsx` is created,
**When** it runs under Vitest + Testing Library with MSW,
**Then** tests cover: toggle complete, toggle incomplete, delete, update error, delete error — all passing.

**Given** `e2e/features/todos/todos.feature` is updated with complete and delete Playwright scenarios,
**When** `pnpm --filter @todo-app/web test:e2e` runs against the live stack,
**Then** scenarios pass covering: complete a todo (toggle to done), uncomplete a todo (toggle back to active), and delete a todo.
**And** `e2e/steps/todos/todos.steps.ts` is extended with step definitions for toggle and delete interactions via the `TodoPage` page object.
**And** all existing scenarios from Story 2.6 continue to pass — no regressions.

---

### Story 3.4: Mobile-Responsive Layout

As Alex (the user),
I want the app to be fully usable on both desktop and mobile viewports,
So that I can manage my tasks from any device.

**Acceptance Criteria:**

**Given** the app is viewed on a mobile viewport (≤ 375px wide),
**When** the todo list and create form render,
**Then** all interactive controls (input, submit, complete toggle, delete) are usable with touch — no overlapping or clipped elements.
**And** text is readable without horizontal scrolling.

**Given** the app is viewed on a desktop viewport (≥ 1024px wide),
**When** the todo list and create form render,
**Then** the layout is appropriately sized and centred — not stretched to full width on large screens.

**Given** the Tailwind CSS layout is implemented across all components,
**When** the UI is reviewed,
**Then** the `Header`, todo list container, and create form all use responsive Tailwind classes.
**And** the `cn()` helper from `src/shared/helpers/style.utils.ts` is used for all conditional class merging.
**And** no hardcoded pixel widths are used where responsive classes are appropriate.

---

### Story 3.5: Docker Containerisation

As a developer,
I want the full application stack containerised with Docker Compose,
So that the entire app (frontend, backend, and database) can be started with a single `docker compose up` command in any environment.

**Acceptance Criteria:**

**Given** a `Dockerfile` is created in `apps/api`,
**When** it is built,
**Then** it uses a multi-stage build: a build/install stage and a lean production stage.
**And** the production image runs as a non-root user.
**And** the image exposes the correct port (3000) and starts the Fastify server via the configured start command.
**And** a `HEALTHCHECK` instruction is included that polls `GET /health` (or equivalent) to report container health.

**Given** a `Dockerfile` is created in `apps/web`,
**When** it is built,
**Then** it uses a multi-stage build: a Node build stage (runs `pnpm build`) and an Nginx production stage that serves the built static assets.
**And** the production image runs as a non-root user.
**And** the Nginx configuration proxies `/api/` requests to the backend container.
**And** a `HEALTHCHECK` instruction is included.

**Given** the root `docker-compose.yml` is updated,
**When** `docker compose up` is run from the monorepo root,
**Then** three services start: `postgres`, `api`, and `web`.
**And** the `api` service depends on `postgres` being healthy before starting.
**And** the `web` service depends on `api` being healthy before starting.
**And** the `postgres` service uses a named volume for data persistence across restarts.
**And** all inter-service communication uses Docker internal networking — no hardcoded `localhost` references between containers.

**Given** environment configuration is needed for each service,
**When** `docker-compose.yml` references environment variables,
**Then** a root-level `.env.example` documents all required variables for the compose stack: `DATABASE_URL`, `FRONTEND_URL`, `VITE_API_URL`, and `POSTGRES_*` credentials.
**And** sensitive values are never hardcoded in `docker-compose.yml` — they are sourced from environment variables or a `.env` file.

**Given** a developer clones the repository on a clean machine,
**When** they copy `.env.example` to `.env` and run `docker compose up --build`,
**Then** the full stack builds and starts successfully with no manual intervention.
**And** the frontend is accessible at `http://localhost:80` (or a documented port).
**And** the backend API is accessible at `http://localhost:3000/api/v1/todos`.
**And** `docker compose logs` shows structured logs from all three services with no fatal errors.

**Given** a `test` compose profile or override is defined,
**When** `docker compose --profile test up` is run,
**Then** the stack starts in a configuration suitable for running E2E tests (e.g. test database, deterministic seed state).

---

### Story 3.6: Test Coverage Analysis and Enforcement

As a developer,
I want test coverage measured and reported across both apps with a minimum 70% threshold enforced,
So that gaps in test coverage are visible and the codebase maintains a meaningful quality bar.

**Acceptance Criteria:**

**Given** unit tests exist in `apps/api`,
**When** `pnpm --filter apps/api test:coverage` is run,
**Then** c8 generates a coverage report showing line, branch, and function coverage percentages.
**And** the report is output in both a human-readable format (terminal summary) and a machine-readable format (lcov or json) for CI consumption.
**And** the command exits with a non-zero code if any coverage dimension falls below 70%.

**Given** unit tests exist in `apps/web`,
**When** `pnpm --filter apps/web test:coverage` is run,
**Then** Vitest generates a coverage report showing line, branch, and function coverage percentages.
**And** the report is output in both terminal summary and lcov/json format.
**And** the command exits with a non-zero code if any coverage dimension falls below 70%.

**Given** coverage is run across both apps,
**When** the results are reviewed,
**Then** all CQRS handlers (`create-todo`, `find-todos`, `update-todo`, `delete-todo`) have individual coverage ≥ 70%.
**And** all frontend components (`TodoList`, `TodoItem`, `CreateTodoForm`) have individual coverage ≥ 70%.
**And** any coverage gaps identified below the threshold are documented with a brief explanation of why (e.g. untestable bootstrap code excluded via c8 ignore comments).

**Given** the GitHub Actions CI pipeline runs,
**When** the coverage step executes,
**Then** coverage reports for both apps are generated and the pipeline fails if either app is below the 70% threshold.
**And** coverage reports are uploaded as CI artifacts so they can be reviewed after the run.

---

### Story 3.7: Accessibility Audit

As a developer,
I want an automated accessibility audit run against the frontend using axe-core via Playwright,
So that the application meets WCAG AA compliance and is usable by people relying on assistive technologies.

**Acceptance Criteria:**

**Given** the frontend is running (either locally or in the Docker stack),
**When** the Playwright-based accessibility audit script runs using `@axe-core/playwright`,
**Then** it audits the main page (`/`) in three states: empty todo list, populated todo list, and loading state.
**And** zero WCAG AA critical or serious violations are reported across all three states.
**And** the audit results are output to a human-readable report file (e.g. `accessibility-report.json` or terminal summary).

**Given** the accessibility audit is configured,
**When** it checks the `CreateTodoForm` component,
**Then** the input field has an accessible label (visible or `aria-label`).
**And** the submit button has a descriptive accessible name.
**And** error messages are associated with their input via `aria-describedby` or equivalent.

**Given** the accessibility audit checks the `TodoList` and `TodoItem` components,
**When** it evaluates the list structure,
**Then** the todo list is rendered as a semantically correct list element (`<ul>` / `<ol>` with `<li>` items).
**And** the completion toggle (checkbox) has an accessible label identifying which todo it controls.
**And** the delete button has an accessible name that identifies which todo will be deleted (e.g. `aria-label="Delete: Buy milk"`).

**Given** the colour contrast of completed vs. active todo styles is checked,
**When** Lighthouse or axe contrast analysis runs,
**Then** all text elements meet the WCAG AA minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text.

**Given** the audit script exists in the project,
**When** it is run via `pnpm --filter apps/web test:a11y` (or equivalent),
**Then** it exits with code 0 on zero violations and non-zero on any WCAG AA violation, enabling CI enforcement.

**Given** each interactive control (input field, submit button, completion toggle, delete button) is focused via keyboard Tab navigation,
**When** the element receives focus,
**Then** a clearly visible focus indicator is rendered — not hidden or styled away.
**And** the focus indicator meets WCAG AA minimum contrast requirements against its background.

**Given** the loading state, empty state, and error messages are dynamic UI regions,
**When** these states are triggered (e.g. API call starts, error is returned),
**Then** the relevant container has an appropriate `aria-live` attribute (`aria-live="polite"` for loading/empty, `aria-live="assertive"` for errors) so screen readers announce the change without requiring focus movement.
**And** error messages rendered in `TodoList`, `CreateTodoForm`, and `TodoItem` are associated with their context via `role="alert"` or `aria-live="assertive"`.

**Given** any CSS transitions or animations are used in the UI (e.g. fade-in of todo items, spinner animation),
**When** the user has `prefers-reduced-motion: reduce` set in their operating system,
**Then** all motion is suppressed or reduced to an instant transition — no spinning, sliding, or fading animations play.
**And** the Tailwind CSS `motion-reduce:` variant or a global `@media (prefers-reduced-motion: reduce)` rule is used to enforce this.

---

### Story 3.8: Security Review and Performance Baseline

As a developer,
I want a security review of the codebase and a documented performance baseline,
So that common vulnerabilities are identified and remediated before shipping, and performance targets from the spec are verified.

**Acceptance Criteria:**

**Given** the backend codebase is complete,
**When** an AI-assisted security review is conducted,
**Then** the review checks for: SQL injection risk (postgres.js tagged templates confirm parameterised queries), XSS risk (all API responses are JSON — no raw HTML rendered), input validation gaps (TypeBox schemas cover all request bodies and path params), and missing security headers.
**And** any findings are documented in `docs/security-review.md` with severity (critical / high / medium / low) and remediation applied or noted.
**And** zero critical or high severity findings remain unaddressed at story completion.

**Given** the frontend codebase is complete,
**When** the security review covers the React app,
**Then** the review confirms: no `dangerouslySetInnerHTML` usage, no secrets or API keys committed in source, `VITE_API_URL` is the only env var exposed to the client bundle, and all user-supplied content is rendered as text (not HTML).
**And** findings are documented in `docs/security-review.md`.

**Given** the full stack is running via `docker compose up`,
**When** Chrome DevTools (or Playwright's `page.metrics()`) is used to measure performance,
**Then** page load to interactive on first visit is measured and documented — target: < 2s.
**And** a create-todo interaction round-trip (form submit → list update) is measured — target: < 200ms perceived latency.
**And** a `GET /api/v1/todos` API call is measured under normal conditions — target: < 300ms p95.
**And** results are documented in `docs/performance-baseline.md` with pass/fail against each NFR target.

**Given** the performance baseline document exists,
**When** any result fails its NFR target,
**Then** the failure is noted with a proposed investigation path (e.g. slow DB query, large bundle, unoptimised render).
**And** at least the critical path (page load + create interaction) must meet targets before the story is considered done.

**Given** the Vite production build is run via `pnpm --filter apps/web build`,
**When** the build completes successfully,
**Then** the build output confirms code splitting is applied — multiple chunks are generated rather than a single monolithic bundle.
**And** no individual JavaScript chunk exceeds 500kb uncompressed.
**And** the build output (or a bundle analyser report) is included in `docs/performance-baseline.md` as evidence of tree-shaking and code splitting.