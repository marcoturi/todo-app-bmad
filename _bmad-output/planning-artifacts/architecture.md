---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: complete
completedAt: "2026-03-07"
inputDocuments:
  - '_bmad-output/project-context.md'
  - '_bmad-output/planning-artifacts/product-brief-todo-app-bmad-2026-03-07.md'
workflowType: 'architecture'
project_name: 'todo-app-bmad'
user_name: 'Marco'
date: '2026-03-07'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

Four CRUD operations on a single `todo` resource: create, read (list), update (completion toggle), and delete. All operations are synchronous request/response — no real-time, streaming, or background processing needed. UI states (empty, loading, error) are handled entirely client-side via RTK Query's built-in state management.

**Non-Functional Requirements:**

- Performance: UI interactions < 200ms perceived latency; API < 300ms p95. Achievable with simple indexed DB queries and RTK Query cache management.
- Reliability: Zero data loss across sessions. DB is single source of truth — no local-only todo state.
- Extensibility: Schema and module structure must accommodate future auth and richer metadata (priorities, due dates) without rewrite.
- Quality: 0 dependency-cruiser violations, 0 TypeScript errors, 0 Biome errors. All enforced in CI.

**Scale & Complexity:**

- Complexity level: Low
- Primary domain: Full-stack web (React SPA + REST API + PostgreSQL)
- Single resource: `todos` — one backend module, one frontend feature slice
- No cross-module communication needed in v1
- No real-time requirements — standard request/response throughout

### Technical Constraints & Dependencies

- Moon-managed monorepo: `apps/web` (React), `apps/api` (Fastify), `packages/shared`
- Package manager: pnpm 10.x only; Node 24.x required
- Backend: ESM-only, native TypeScript execution, no build step
- Database: PostgreSQL via Docker Compose at monorepo root; DBMate migrations
- REST only — no GraphQL endpoints needed
- Path aliases: `#src/*` / `#tests/*` via `package.json` subpath imports (not tsconfig)
- Shared types: `packages/shared` — OpenAPI-generated; imported as `@todo-app/shared`
- No auth, no sessions, no middleware for security in v1

### Cross-Cutting Concerns Identified

- **Error handling:** TypeBox validation at route layer; `ExceptionBase` domain errors; Fastify error handler plugin; RTK Query error state → user-visible UI feedback
- **Type safety:** Shared OpenAPI types in `packages/shared` eliminate duplication between `apps/api` response DTOs and `apps/web` RTK Query hooks
- **Testing strategy:** Backend node:test unit + Cucumber/Gherkin E2E; Frontend Vitest + Testing Library unit + Cucumber/Playwright E2E
- **Observability:** Pino logger via DI on backend; Sentry on frontend (error tracking)
- **Architecture enforcement:** dependency-cruiser validates layer boundaries in CI

---

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application — React SPA (frontend) + Fastify REST API (backend) + PostgreSQL (database) — managed as a moon monorepo with pnpm workspaces.

### Starter Options Considered

The technology stack is fully predetermined by the project's boilerplate selection. Both starters are production-ready, actively maintained, and authored by the project owner — no evaluation of alternatives was needed.

### Selected Starters

#### Frontend: `marcoturi/react-redux-boilerplate` → `apps/web`

**Initialization:**

```bash
npx degit marcoturi/react-redux-boilerplate apps/web
```

**Architectural Decisions Provided:**

- **Language & Runtime:** TypeScript 5.9.3, `noImplicitAny: false`, strict mode
- **Build Tooling:** Vite 7.3.1 + SWC + `@tailwindcss/vite` (no PostCSS)
- **UI System:** React 19.2.4 + Radix UI + shadcn/ui + Tailwind CSS 4.2.1
- **State Management:** Redux Toolkit 2.11.2 (RTK Query, Immer, Reselect)
- **Routing:** React Router DOM 7.13.1 — lazy-loaded routes via `React.lazy()`
- **API Mocking:** MSW 2.12.10 + `@mswjs/data` for tests and development
- **Unit/Integration Tests:** Vitest 4.0.18 + Testing Library + jsdom
- **E2E Tests:** Cucumber 12.7.0 + Playwright 1.58.2
- **Linting/Formatting:** Biome 2.4.6 (replaces ESLint + Prettier)
- **Monitoring:** Sentry 10.42.0 with Redux state replay
- **Code Organisation:** Vertical slice architecture (`src/features/<feature>/`)
- **Path Alias:** `@/` → `src/`
- **Releases:** Husky + Commitlint + Semantic-release

#### Backend: `marcoturi/fastify-boilerplate` → `apps/api`

**Initialization:**

```bash
npx degit marcoturi/fastify-boilerplate apps/api
```

**Architectural Decisions Provided:**

- **Language & Runtime:** TypeScript 5.9.3, Node ≥ 24, native TS execution (no build)
- **Framework:** Fastify 5.8.2 + Awilix 13.0.3 DI + Pino logging
- **API Style:** REST only — TypeBox schemas + Swagger UI (GraphQL disabled/removed)
- **Database Client:** postgres.js 3.4.8 + DBMate migrations
- **Architecture Pattern:** Clean Architecture + CQRS + DDD + Hexagonal
- **Dependency Flow:** Route → Handler → Domain → Repository (enforced by dependency-cruiser)
- **Unit/Integration Tests:** node:test + c8 coverage — `*.spec.ts` co-located with source
- **E2E Tests:** Cucumber 12.7.0 + Gherkin `.feature` files
- **Load Tests:** k6
- **Linting/Formatting:** Biome 2.4.6
- **Path Aliases:** `#src/*`, `#tests/*` via `package.json` subpath imports
- **Releases:** Husky + Commitlint + Semantic-release
- **Telemetry:** OpenTelemetry (disabled by default)

#### Shared Package: `packages/shared`

**Setup:** New pnpm workspace package — no degit template.

- TypeScript types shared between `apps/web` and `apps/api`
- Hand-written types for v1 (API surface is minimal: 1 resource, 4 endpoints)
- OpenAPI-generated types via `openapi-typescript` is the v2+ upgrade path when the API surface grows
- Imported in frontend as `@todo-app/shared` via pnpm workspace alias

### Monorepo Orchestration

**Tool:** [moon](https://moonrepo.dev/) — task runner and monorepo manager

```
todo-app-bmad/
├── .moon/              → moon workspace config
├── apps/
│   ├── web/            → react-redux-boilerplate scaffold
│   └── api/            → fastify-boilerplate scaffold
├── packages/
│   └── shared/         → hand-written shared types (OpenAPI generation in v2+)
├── docker-compose.yml  → PostgreSQL (single, at root)
└── moon.yml
```

**Note:** pnpm workspaces alone would suffice for this project's size. Moon is chosen for task dependency awareness and future-proofing as the monorepo grows, not because it is strictly required for v1.

**Note:** Project initialization — scaffolding the monorepo, running degit for both apps, and setting up `packages/shared` — constitutes the first implementation epic.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- Database schema design — defines the persistence contract for all layers
- API error response shape — required for consistent frontend error handling
- Frontend API integration strategy — determines RTK Query cache behaviour
- Todo description validation rules — enforced at route and shared type level
- CORS configuration — required for frontend ↔ backend communication in dev and prod

**Deferred Decisions (Post-MVP):**

- Authentication strategy (JWT / session / OAuth) — architecture not closed to it; `id` UUID on todos table ready for future `user_id` FK
- OpenAPI type generation pipeline — hand-written types in `packages/shared` for v1; `openapi-typescript` generation added in v2+ when API surface grows
- Rate limiting — not needed for single-user, no-auth v1
- Caching layer (Redis etc.) — simple DB queries are fast enough for v1 scope

---

### Data Architecture

**Database:** PostgreSQL (Docker Compose at monorepo root)
**Migration tool:** DBMate — SQL migration files in `apps/api/db/migrations/`

**`todos` table schema:**

```sql
CREATE TABLE todos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT        NOT NULL CHECK (char_length(description) > 0),
  completed   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX todos_created_at_idx ON todos (created_at ASC);
```

**Schema decisions rationale:**

- `UUID` primary key — no sequential IDs exposed to clients; future `user_id` FK can be added without schema conflict when auth is introduced
- `TEXT` (not `VARCHAR(n)`) — PostgreSQL TEXT is equally efficient; avoids an arbitrary length constraint at the storage layer (validation enforced at the API layer instead)
- `updated_at` — included in v1 even though not surfaced in the UI; trivially cheap to maintain and valuable for v2 auditing and sorting
- `created_at` indexed ASC — list is always returned in creation order; index ensures this is fast even as the table grows
- No nullable columns in v1 — clean, predictable domain model

**Domain entity (`Todo`):**

```typescript
export type Todo = {
  id: string;           // UUID
  description: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};
```

---

### Authentication & Security

**v1 decision:** No authentication. Single-user, no sessions, no tokens, no auth middleware anywhere in the stack.

**Extensibility preserved:**

- `todos.id` is UUID — a future `user_id UUID REFERENCES users(id)` column can be added via migration without disrupting existing data
- CQRS handler signatures are protocol-agnostic — an auth middleware on the CommandBus/QueryBus can be added without touching handler logic
- No auth assumptions baked into domain types or repository interfaces

---

### API & Communication Patterns

**API style:** REST only. No GraphQL endpoints — Mercurius plugin is removed/disabled from the fastify-boilerplate scaffold.

**Base path:** `/api/v1/` — versioned from day one.

**Endpoints:**

| Method | Path | Handler | Description |
|---|---|---|---|
| `GET` | `/api/v1/todos` | `FindTodosQuery` | Retrieve all todos, ordered by `created_at ASC` |
| `POST` | `/api/v1/todos` | `CreateTodoCommand` | Create a new todo |
| `PATCH` | `/api/v1/todos/:id` | `UpdateTodoCommand` | Toggle completion status |
| `DELETE` | `/api/v1/todos/:id` | `DeleteTodoCommand` | Permanently delete a todo |

**Error response shape — RFC 9457 (Fastify native):**

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Todo with id 'abc-123' not found"
}
```

HTTP status codes used:

- `200` — successful GET, PATCH, DELETE
- `201` — successful POST (todo created)
- `400` — validation failure (TypeBox schema rejection)
- `404` — todo not found by id
- `500` — unexpected server error

**CORS configuration:**

- Dev: `http://localhost:5173` (Vite dev server)
- Production: `FRONTEND_URL` environment variable
- Allowed methods: `GET, POST, PATCH, DELETE`
- No credentials (no auth in v1)

**Input validation:**

- All request bodies validated by TypeBox schemas at the route layer
- `description`: non-empty string, max 500 characters
- `id` (path param): UUID format validated before handler invocation

---

### Frontend Architecture

**API integration:** RTK Query with tag-based cache invalidation.

- Base API defined in `src/shared/store/api.ts`
- Todos feature API extends base with tag `'Todo'`
- `getTodos` query — provides `['Todo']` tag
- `createTodo`, `updateTodo`, `deleteTodo` mutations — each invalidates `['Todo']` tag, triggering automatic list re-fetch
- No optimistic updates in v1 — API response is fast enough that tag invalidation re-fetch is imperceptible to the user

**Rationale for tag invalidation over optimistic updates:**
Optimistic updates add rollback complexity (especially for delete) with no measurable UX benefit given the < 200ms API target. Tag invalidation is simpler, correct by default, and easier for future developers to understand.

**Frontend feature structure:**

```
src/features/todos/
├── store/
│   ├── todos.api.ts        → RTK Query endpoints (getTodos, createTodo,
│   │                          updateTodo, deleteTodo)
│   ├── todos.slice.ts      → Redux slice (UI state only, if needed)
│   └── todos.types.ts      → Feature-local types (imports from @todo-app/shared)
├── components/
│   ├── TodoList.tsx         → List container (loading/empty/error states)
│   ├── TodoItem.tsx         → Single todo row (complete toggle + delete)
│   └── CreateTodoForm.tsx   → Input form for new todo
└── hooks/
    └── useTodos.ts          → Encapsulates RTK Query hooks for components
```

**Route:** Single page app — one route `/` renders the todo list directly. No nested routing needed for v1.

---

### Infrastructure & Deployment

**Local development:**

```bash
# 1. Start Postgres
docker compose up postgres -d          # from monorepo root

# 2. Start backend
cd apps/api && pnpm db:migrate && pnpm start

# 3. Start frontend
cd apps/web && pnpm dev
```

**Environment variables:**

Backend (`apps/api/.env`):

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/todos
DBMATE_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/todos
HOST=localhost
PORT=3000
FRONTEND_URL=http://localhost:5173
```

Frontend (`apps/web/.env`):

```
VITE_API_URL=http://localhost:3000
```

**CI/CD:** GitHub Actions — lint + type-check + unit tests + E2E tests on every push to `main`. Semantic-release on merge to `main`.

**Deployment:** Not in scope for v1 — local development only. Docker Compose provides the full local stack.

---

### Decision Impact Analysis

**Implementation sequence driven by decisions:**

1. Monorepo scaffolding (moon + degit both boilerplates + `packages/shared`)
2. Docker Compose + DBMate migration for `todos` table
3. Backend `todos` module (CQRS handlers + repository + routes)
4. Shared types in `packages/shared` (hand-written for v1)
5. Frontend `todos` feature slice (RTK Query + components)
6. E2E tests — backend Cucumber + frontend Playwright

**Cross-component dependencies:**

- `packages/shared` types must exist before frontend RTK Query hooks are written
- DB migration must run before any backend E2E tests execute
- CORS config in `apps/api` must be correct before frontend can call backend locally

---

## Implementation Patterns & Consistency Rules

_These rules exist to prevent AI agents from making different but equally valid choices that would create inconsistency. Every rule here has a reason — if in doubt, follow the rule, not your intuition._

---

### Naming Patterns

**Database naming — `snake_case` throughout:**

- Tables: `todos` (plural, lowercase)
- Columns: `created_at`, `updated_at`, `user_id` (snake_case)
- Indexes: `todos_created_at_idx` (table + column + `idx`)
- Migrations: `YYYYMMDDHHMMSS_create_todos_table.sql` (DBMate default)

**API naming — plural resource, kebab-case paths:**

- Resource: `/api/v1/todos` (plural noun, lowercase)
- Path params: `:id` (never `:todoId` or `:todo_id`)
- Query params: `camelCase` (e.g. `?sortBy=createdAt`)
- No trailing slash on any route

**Backend file naming — `kebab-case` only (Biome enforced):**

- Handlers: `create-todo.handler.ts`, `find-todos.handler.ts`
- Routes: `create-todo.route.ts`, `find-todos.route.ts`
- Schemas: `create-todo.schema.ts`, `find-todos.schema.ts`
- Repository: `todo.repository.ts`, `todo.repository.port.ts`
- Domain: `todo.domain.ts`, `todo.errors.ts`, `todo.types.ts`
- Mapper: `todo.mapper.ts`
- Module index: `index.ts`

**Frontend file naming — PascalCase for components, camelCase for others:**

- Components: `TodoList.tsx`, `TodoItem.tsx`, `CreateTodoForm.tsx`
- Hooks: `useTodos.ts`
- Store files: `todos.api.ts`, `todos.slice.ts`, `todos.types.ts`
- Spec files: `TodoList.spec.tsx`, `todos.api.spec.ts`

**TypeScript naming:**

- Types and interfaces: `PascalCase` — `Todo`, `CreateTodoRequest`, `TodoResponse`
- Constants: `SCREAMING_SNAKE_CASE` — `MAX_DESCRIPTION_LENGTH`
- Functions/variables: `camelCase` — `createTodo`, `findTodos`
- No `I` prefix on interfaces (e.g. `TodoRepository` not `ITodoRepository`)

---

### Structure Patterns

**Backend module structure — always this exact layout for `todos`:**

```
src/modules/todos/
├── commands/
│   ├── create-todo/
│   │   ├── create-todo.handler.ts
│   │   ├── create-todo.route.ts
│   │   └── create-todo.schema.ts
│   ├── update-todo/
│   │   ├── update-todo.handler.ts
│   │   ├── update-todo.route.ts
│   │   └── update-todo.schema.ts
│   └── delete-todo/
│       ├── delete-todo.handler.ts
│       ├── delete-todo.route.ts
│       └── delete-todo.schema.ts
├── queries/
│   └── find-todos/
│       ├── find-todos.handler.ts
│       ├── find-todos.route.ts
│       └── find-todos.schema.ts
├── database/
│   ├── todo.repository.port.ts
│   └── todo.repository.ts
├── domain/
│   ├── todo.domain.ts
│   ├── todo.errors.ts
│   └── todo.types.ts
├── dtos/
│   └── todo.response.dto.ts
├── todo.mapper.ts
└── index.ts
```

**Frontend feature structure — always this exact layout for `todos`:**

```
src/features/todos/
├── store/
│   ├── todos.api.ts
│   ├── todos.slice.ts
│   └── todos.types.ts
├── components/
│   ├── TodoList.tsx
│   ├── TodoList.spec.tsx
│   ├── TodoItem.tsx
│   ├── TodoItem.spec.tsx
│   ├── CreateTodoForm.tsx
│   └── CreateTodoForm.spec.tsx
└── hooks/
    └── useTodos.ts
```

**Test file placement:**

- Backend: `*.spec.ts` co-located with source file (e.g. `create-todo.handler.spec.ts`)
- Frontend: `*.spec.tsx` co-located with component (e.g. `TodoItem.spec.tsx`)
- Backend E2E: `tests/todos/` — `.feature` files + `.steps.ts` files
- Frontend E2E: `e2e/todos/` — `.feature` files + `.steps.ts` files

---

### Format Patterns

**API response — direct object (no wrapper):**

```typescript
// ✅ Correct — direct response
// GET /api/v1/todos → TodoResponse[]
// POST /api/v1/todos → TodoResponse        (201)
// PATCH /api/v1/todos/:id → TodoResponse   (200)
// DELETE /api/v1/todos/:id → 204 No Content (empty body)

// ❌ Wrong — no wrapper objects
// { data: TodoResponse[], success: true }
// { result: TodoResponse }
```

**JSON field naming — `camelCase` in API responses:**

```json
{
  "id": "uuid",
  "description": "Buy milk",
  "completed": false,
  "createdAt": "2026-03-07T12:00:00.000Z",
  "updatedAt": "2026-03-07T12:00:00.000Z"
}
```

- DB columns are `snake_case` (`created_at`); API responses are `camelCase` (`createdAt`). The mapper handles this conversion.
- Dates as ISO 8601 strings always — never Unix timestamps.

**`packages/shared` types — single source of truth:**

```typescript
// packages/shared/src/todos.ts
export type Todo = {
  id: string;
  description: string;
  completed: boolean;
  createdAt: string;   // ISO string in transit (not Date — JSON has no Date type)
  updatedAt: string;
};

export type CreateTodoRequest = {
  description: string;
};

export type UpdateTodoRequest = {
  completed: boolean;
};
```

Note: `createdAt`/`updatedAt` are `string` in shared types (JSON transport), `Date` in the backend domain entity (after mapper conversion).

---

### Communication Patterns

**CQRS action naming — verb + noun, PascalCase:**

- `CreateTodo`, `UpdateTodo`, `DeleteTodo` — commands (state-changing)
- `FindTodos` — query (read-only)
- Action creator prefix matches module name: `todoActionCreator`

**RTK Query endpoint naming — camelCase verb + noun:**

- `getTodos` (maps to `FindTodos` query)
- `createTodo` (maps to `CreateTodo` command)
- `updateTodo` (maps to `UpdateTodo` command)
- `deleteTodo` (maps to `DeleteTodo` command)
- Tag name: `'Todo'` (singular PascalCase)

**Redux state — UI state only in the todos slice:**

- The RTK Query cache IS the server state — never duplicate it in the slice
- The Redux slice holds only UI-specific state (e.g. form input value if needed)
- Never store `todos[]` in the Redux slice — use `useGetTodosQuery()` directly

---

### Process Patterns

**Error handling — backend:**

- Route layer: TypeBox schema validation → automatic 400 with field errors
- Handler layer: Throw typed domain errors (`NotFoundException`, etc.)
- Never catch and swallow errors in handlers — let the Fastify error handler plugin respond
- Log errors with the injected `logger`, never `console`

**Error handling — frontend:**

- Use RTK Query `isError` + `error` from query/mutation hooks
- Display user-visible error messages in the component, not in the Redux slice
- Never `console.error` in components — use Sentry error tracking utilities
- All four operations (get, create, update, delete) must have visible error states in the UI

**Loading states — frontend:**

- Use RTK Query `isLoading` / `isFetching` from `useGetTodosQuery()`
- `isLoading`: true only on first load (no cached data yet) → show skeleton/spinner
- `isFetching`: true on re-fetch after mutation → can show subtle indicator
- Never block the entire UI on mutation loading — only the affected item

**Date handling:**

- Backend: `Date` objects in domain entities and repository layer
- API transport: ISO 8601 strings (`toISOString()` in mapper `toResponse`)
- Frontend: Treat dates as strings — do not parse to `Date` objects in v1 (no date display in UI; `createdAt` not surfaced to user)

---

### Enforcement Guidelines

**All AI Agents MUST:**

- Follow `kebab-case` filenames on backend, PascalCase components on frontend
- Never add columns/fields not in the agreed schema without updating this document
- Never wrap API responses in an envelope object
- Keep `camelCase` in JSON responses, `snake_case` in DB columns
- Maintain the exact module folder structure defined above
- Use `@todo-app/shared` types for all request/response contracts — never inline
- Run `pnpm check` and `pnpm deps:validate` before considering any task complete

**Pattern Violations to Watch For:**

- `userId` in DB columns (should be `user_id`)
- `created_at` in JSON responses (should be `camelCase`)
- Wrapping responses: `{ data: [...] }` (should be direct array)
- `console.log` anywhere in source (use `logger` or Sentry)
- Direct module-to-module imports on backend (use CQRS buses)
- Defining types in both `apps/api` and `apps/web` (use `packages/shared`)

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
todo-app-bmad/                              ← monorepo root
├── .moon/                                  ← moon workspace config
│   └── workspace.yml
├── .github/
│   └── workflows/
│       └── release.yml                     ← CI/CD: lint + test + release
├── apps/
│   ├── api/                                ← Fastify backend
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   │   └── 20260307000000_create_todos_table.sql
│   │   │   └── seeds/
│   │   ├── src/
│   │   │   ├── index.ts                    ← App entry point
│   │   │   ├── instrumentation.ts          ← OTel setup (disabled by default)
│   │   │   ├── config/
│   │   │   │   └── env.ts                  ← env-schema + TypeBox env validation
│   │   │   ├── modules/
│   │   │   │   ├── index.ts                ← Global DI registrations
│   │   │   │   └── todos/
│   │   │   │       ├── commands/
│   │   │   │       │   ├── create-todo/
│   │   │   │       │   │   ├── create-todo.handler.ts
│   │   │   │       │   │   ├── create-todo.handler.spec.ts
│   │   │   │       │   │   ├── create-todo.route.ts
│   │   │   │       │   │   └── create-todo.schema.ts
│   │   │   │       │   ├── update-todo/
│   │   │   │       │   │   ├── update-todo.handler.ts
│   │   │   │       │   │   ├── update-todo.handler.spec.ts
│   │   │   │       │   │   ├── update-todo.route.ts
│   │   │   │       │   │   └── update-todo.schema.ts
│   │   │   │       │   └── delete-todo/
│   │   │   │       │       ├── delete-todo.handler.ts
│   │   │   │       │       ├── delete-todo.handler.spec.ts
│   │   │   │       │       ├── delete-todo.route.ts
│   │   │   │       │       └── delete-todo.schema.ts
│   │   │   │       ├── queries/
│   │   │   │       │   └── find-todos/
│   │   │   │       │       ├── find-todos.handler.ts
│   │   │   │       │       ├── find-todos.handler.spec.ts
│   │   │   │       │       ├── find-todos.route.ts
│   │   │   │       │       └── find-todos.schema.ts
│   │   │   │       ├── database/
│   │   │   │       │   ├── todo.repository.port.ts
│   │   │   │       │   └── todo.repository.ts
│   │   │   │       ├── domain/
│   │   │   │       │   ├── todo.domain.ts
│   │   │   │       │   ├── todo.errors.ts
│   │   │   │       │   └── todo.types.ts
│   │   │   │       ├── dtos/
│   │   │   │       │   └── todo.response.dto.ts
│   │   │   │       ├── todo.mapper.ts
│   │   │   │       ├── todo.mapper.spec.ts
│   │   │   │       └── index.ts            ← actionCreatorFactory + DI declarations
│   │   │   ├── server/
│   │   │   │   ├── index.ts                ← Fastify instance setup + /api prefix
│   │   │   │   └── plugins/                ← CORS, Swagger, error handler, CQRS, DI
│   │   │   └── shared/
│   │   │       ├── cqrs/                   ← CommandBus, QueryBus, EventBus, middlewares
│   │   │       ├── db/                     ← postgres.js connection, SqlRepositoryBase
│   │   │       ├── exceptions/             ← ExceptionBase + built-in exceptions
│   │   │       └── utils/
│   │   ├── tests/
│   │   │   ├── todos/
│   │   │   │   ├── create-todo.feature
│   │   │   │   ├── find-todos.feature
│   │   │   │   ├── update-todo.feature
│   │   │   │   ├── delete-todo.feature
│   │   │   │   └── todos.steps.ts
│   │   │   ├── shared/                     ← Shared step definitions
│   │   │   └── support/
│   │   │       ├── server.ts               ← buildApp() test server factory
│   │   │       └── hooks.ts                ← before/after hooks (DB setup/teardown)
│   │   ├── .env.example
│   │   ├── .dependency-cruiser.cjs
│   │   ├── biome.json
│   │   ├── cucumber.mjs
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                                ← React frontend
│       ├── e2e/
│       │   └── todos/
│       │       ├── todos.feature           ← Cucumber E2E scenarios
│       │       └── todos.steps.ts          ← Playwright step definitions
│       ├── public/
│       │   └── mockServiceWorker.js        ← MSW service worker
│       ├── src/
│       │   ├── main.tsx                    ← App entry point
│       │   ├── AppProvider.tsx             ← Redux + Router + Suspense + ErrorBoundary
│       │   ├── routes/
│       │   │   ├── index.tsx               ← Route tree
│       │   │   └── Home/
│       │   │       └── index.tsx           ← Home page (renders TodoList)
│       │   ├── features/
│       │   │   └── todos/
│       │   │       ├── store/
│       │   │       │   ├── todos.api.ts    ← RTK Query: getTodos, createTodo,
│       │   │       │   │                      updateTodo, deleteTodo
│       │   │       │   ├── todos.slice.ts  ← UI-only state (if needed)
│       │   │       │   └── todos.types.ts  ← imports from @todo-app/shared
│       │   │       ├── components/
│       │   │       │   ├── TodoList.tsx
│       │   │       │   ├── TodoList.spec.tsx
│       │   │       │   ├── TodoItem.tsx
│       │   │       │   ├── TodoItem.spec.tsx
│       │   │       │   ├── CreateTodoForm.tsx
│       │   │       │   └── CreateTodoForm.spec.tsx
│       │   │       └── hooks/
│       │   │           └── useTodos.ts
│       │   ├── shared/
│       │   │   ├── config/
│       │   │   │   ├── env.ts              ← VITE_API_URL centralised here
│       │   │   │   └── sentry.ts
│       │   │   ├── helpers/
│       │   │   │   └── style.utils.ts      ← cn() helper
│       │   │   └── store/
│       │   │       ├── index.ts            ← Redux store setup
│       │   │       ├── api.ts              ← RTK Query base API
│       │   │       └── types.ts            ← useAppDispatch, useAppSelector
│       │   ├── UI/
│       │   │   ├── Elements/               ← shadcn/ui components
│       │   │   └── Layout/
│       │   │       ├── Header.tsx
│       │   │       └── global.css          ← Tailwind @theme inline
│       │   └── test/
│       │       ├── handlers.ts             ← MSW request handlers
│       │       ├── db.ts                   ← @mswjs/data mock DB
│       │       └── setup.ts                ← Vitest setup file
│       ├── .env.example
│       ├── biome.json
│       ├── components.json                 ← shadcn/ui config
│       ├── cucumber.mjs
│       ├── index.html
│       ├── package.json
│       ├── tailwind.config.mjs
│       ├── tsconfig.json
│       ├── tsconfig.app.json
│       ├── tsconfig.node.json
│       └── vite.config.mts
│
├── packages/
│   └── shared/                             ← Hand-written shared types (v1)
│       ├── src/
│       │   ├── index.ts                    ← Re-exports all types
│       │   └── todos.ts                    ← Todo, CreateTodoRequest, UpdateTodoRequest
│       ├── package.json                    ← name: "@todo-app/shared"
│       └── tsconfig.json
│
├── docker-compose.yml                      ← PostgreSQL service (monorepo root)
├── moon.yml                                ← Moon task definitions
├── package.json                            ← pnpm workspace root
├── pnpm-workspace.yaml                     ← Workspace: apps/*, packages/*
└── README.md
```

---

### Architectural Boundaries

**API Boundaries:**

- All backend routes served under `/api/v1/` — never bare paths
- TypeBox schema validation at every route entry point
- Fastify error handler plugin normalises all errors to RFC 9457 shape
- CORS allows only `http://localhost:5173` (dev) or `FRONTEND_URL` (prod)
- No route has direct DB access — all data flows through the CQRS bus

**Component Boundaries (backend — strictly enforced by dependency-cruiser):**

```
Route → Handler → Domain → Repository
  ↑         ↑        ↑          ↑
HTTP    Use case   Business   Data
layer  orchestration  logic   access
```

- Routes import only schemas and call `bus.execute()`
- Handlers import only repository ports (interfaces) and domain services
- Domain has zero infrastructure imports
- Repositories are the only files that import from `src/shared/db/`

**Component Boundaries (frontend):**

- Components dispatch actions and read selectors — no direct API calls
- RTK Query hooks live in `features/todos/store/todos.api.ts` only
- `src/shared/store/api.ts` is the base — feature APIs extend it
- `packages/shared` is imported via `@todo-app/shared` — never via relative path

**Data Boundaries:**

- PostgreSQL is the single source of truth — no local storage, no in-memory persistence
- RTK Query cache is derived state — always re-fetched from DB after mutations
- `packages/shared` types define the API contract boundary between `apps/api` and `apps/web`

---

### Data Flow

```
User Action (UI)
  → RTK Query mutation hook
    → POST/PATCH/DELETE /api/v1/todos
      → Fastify route (TypeBox validation)
        → CommandBus.execute(command)
          → Handler (use case logic)
            → TodoRepository (postgres.js SQL)
              → PostgreSQL
            ← domain entity
          ← result
        ← TodoResponse (via mapper)
      ← HTTP response (201/200/204)
    ← RTK Query invalidates 'Todo' tag
      → GET /api/v1/todos (automatic re-fetch)
        → QueryBus.execute(query)
          → TodoRepository.findAll()
            → PostgreSQL
          ← Todo[]
        ← TodoResponse[] (via mapper)
      ← RTK Query updates cache
  → React re-renders with updated list
```

---

### Integration Points

**Frontend ↔ Backend:**

- Protocol: HTTP/1.1 REST
- Base URL: `VITE_API_URL` env var (centralised in `src/shared/config/env.ts`)
- Content-Type: `application/json` on all requests with a body
- No auth headers in v1

**Backend ↔ Database:**

- Driver: postgres.js tagged template literals
- Connection: lazy singleton via `getDb()` in `src/shared/db/postgres.ts`
- Connection string: `DATABASE_URL` env var

**Monorepo ↔ Shared Types:**

- `packages/shared` is a pnpm workspace package
- Imported as `@todo-app/shared` in both `apps/api` (response DTOs) and `apps/web` (RTK Query types)
- `packages/shared/src/index.ts` re-exports all public types

---

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are compatible. TypeScript 5.9.3 and Biome 2.4.6 are identical across both apps. postgres.js tagged templates integrate cleanly with `SqlRepositoryBase`. RTK Query tag invalidation works correctly with synchronous REST. ESM-only backend has no CJS boundary issues. `packages/shared` hand-written types require no build pipeline.

**Pattern Consistency:**
All naming and structural patterns are internally consistent. `snake_case` DB columns map to `camelCase` JSON via the mapper without ambiguity. CQRS action names align with RTK Query endpoint names. All routes correctly sit under `/api/v1/`.

**Important Note — Mercurius Removal:**
The fastify-boilerplate scaffold includes Mercurius (GraphQL). Architecture specifies REST-only. The monorepo setup story must explicitly remove Mercurius, graphql-tools, and all GraphQL resolvers/schemas from `apps/api` to prevent agents assuming GraphQL is available.

---

### Requirements Coverage Validation ✅

All 8 functional requirements and all 7 non-functional requirements are fully supported by the architectural decisions. Every FR is traceable to a specific endpoint → handler → repository → DB column. Every NFR is addressable within the chosen stack without additional tooling.

---

### Implementation Readiness Validation ✅

**Decision Completeness:** All critical decisions documented with exact versions, rationale, and cascading implications. No ambiguous decisions remain.

**Structure Completeness:** Full file tree defined down to individual spec files. Every file has a documented purpose. No placeholder directories.

**Pattern Completeness:** All 6 potential conflict categories addressed — naming, structure, format, communication, error handling, loading states. Concrete examples provided for response format, shared types, and CQRS patterns.

---

### Gap Analysis Results

**Critical Gaps:** None.

**Important Items for Implementation Stories:**

1. **Mercurius removal (Priority: High)** — Must be an explicit task in the monorepo setup story. Remove: `mercurius`, `@graphql-tools/load-files`, `@graphql-tools/merge`, and all `*.graphql-schema.ts` and `*.resolver.ts` files.

2. **`updated_at` explicit update (Priority: Medium)** — PostgreSQL does not auto-update `updated_at` without a trigger. The `UpdateTodo` repository method must explicitly set `updated_at = now()` in the UPDATE query. This must be called out in the `update-todo` story acceptance criteria.

---

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Low — single resource, single user)
- [x] Technical constraints identified (monorepo, ESM-only, REST-only)
- [x] Cross-cutting concerns mapped (error handling, type sharing, testing)

**Architectural Decisions**

- [x] Critical decisions documented with versions and rationale
- [x] Technology stack fully specified (both apps + shared)
- [x] Database schema defined with extensibility rationale
- [x] API contract defined (endpoints, status codes, error shape)
- [x] Frontend integration strategy defined (RTK Query tag invalidation)
- [x] CORS configuration defined (dev + prod)
- [x] Validation rules defined (description: non-empty, max 500 chars)

**Implementation Patterns**

- [x] Naming conventions established (DB, API, files, TypeScript)
- [x] Exact module/feature folder structures defined
- [x] Response format patterns defined (no wrapper, camelCase JSON)
- [x] Shared types structure defined with v1/v2 upgrade path
- [x] CQRS + RTK Query naming alignment documented
- [x] Error handling patterns defined for both layers
- [x] Loading state patterns defined for frontend

**Project Structure**

- [x] Complete monorepo directory tree defined
- [x] Component boundaries established and enforced by tooling
- [x] Data flow traced end-to-end (UI → RTK Query → API → DB → back)
- [x] Integration points documented (CORS, env vars, connection strings)

---

### Architecture Readiness Assessment

**Overall Status: ✅ READY FOR IMPLEMENTATION**

**Confidence Level: High**

**Key Strengths:**

- Both boilerplates are authored by the project owner — deep familiarity, no unknown surprises in the scaffold
- Single resource (`todos`) with no cross-module dependencies — minimal risk of integration conflicts between implementation stories
- All patterns derived from existing boilerplate conventions — agents familiar with the boilerplates will find this immediately recognisable
- Explicit file-level structure means no agent has to make structural guesses

**Areas for Future Enhancement (Post-MVP):**

- OpenAPI type generation pipeline to replace hand-written `packages/shared`
- `updated_at` trigger at DB level to avoid application-level responsibility
- Auth middleware on CQRS bus (pattern is ready, just not wired)
- RTK Query optimistic updates for richer UX when API grows in complexity