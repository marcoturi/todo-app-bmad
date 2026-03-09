---
project_name: 'todo-app-bmad'
user_name: 'Marco'
date: '2026-03-07'
sections_completed:
  ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical rules and patterns AI agents must follow when implementing code in this project. Focused on unobvious details agents might otherwise miss._

---

## Monorepo Structure

This is a **moon-managed monorepo** with pnpm workspaces. Never treat workspaces as standalone projects.

```
todo-app-bmad/
├── apps/
│   ├── web/          → React frontend (react-redux-boilerplate)
│   └── api/          → Fastify backend (fastify-boilerplate)
├── packages/
│   └── shared/       → Shared types/utilities between web and api
├── docker-compose.yml → Postgres at monorepo root (not per-app)
├── moon.yml
└── .moon/
```

- Package manager: **pnpm 10.x only**. Never use npm or yarn anywhere.
- Node version: **24.x** (native TypeScript execution). Check `.nvmrc`.
- Run `moon run <app>:<task>` for cross-workspace tasks; run `pnpm <script>` inside a workspace for local tasks.
- Docker Compose at the **root** manages Postgres. Never define a separate DB service per app.

---

## Technology Stack & Versions

### Frontend (`apps/web`)

| Layer | Technology | Version |
|---|---|---|
| Build | Vite + React + SWC | Vite 7.3.1, React 19.2.4 |
| Language | TypeScript | 5.9.3 |
| State | Redux Toolkit (RTK Query, Immer, Reselect) | 2.11.2 |
| UI | Radix UI + shadcn/ui + Tailwind CSS | Tailwind 4.2.1 |
| Linting/Formatting | Biome | 2.4.6 |
| Unit/Integration tests | Vitest + Testing Library + jsdom | Vitest 4.0.18 |
| E2E tests | Cucumber + Playwright | Playwright 1.58.2 |
| API mocking | MSW + @mswjs/data | MSW 2.12.10 |
| Monitoring | Sentry | 10.42.0 |
| Router | React Router DOM | 7.13.1 |

### Backend (`apps/api`)

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js native TypeScript (no build step) | ≥ 24 |
| Framework | Fastify + Awilix DI + Pino logging | Fastify 5.8.2 |
| Language | TypeScript | 5.9.3 |
| API | REST only (TypeBox schemas + Swagger UI) | — |
| Database | postgres.js + DBMate migrations | postgres.js 3.4.8 |
| Linting/Formatting | Biome | 2.4.6 |
| Unit/Integration tests | node:test + c8 coverage | — |
| E2E tests | Cucumber + Gherkin | 12.7.0 |
| Load tests | k6 | — |
| Telemetry | OpenTelemetry (disabled by default) | — |

### Shared (`packages/shared`)

- TypeScript types shared between `apps/web` and `apps/api`.
- REST client types generated from the OpenAPI spec (`openapi-typescript`).
- Import in frontend as `@todo-app/shared` (configure via pnpm workspace alias).

---

## Critical Implementation Rules

### Language-Specific Rules

**TypeScript (both apps)**

- `strict: true` on both sides.
- Backend: `noImplicitAny: true`. Frontend: `noImplicitAny: false`.
- Always use `import type` for type-only imports (enforced by Biome `useImportType`).
- Use `unknown` instead of `any` for error catches and untyped values.
- No `enum` — use `const` objects with derived union types: `const Status = { ... } as const; type Status = typeof Status[keyof typeof Status]`.
- Prefer `const` over `let`. Never use `var`.
- Prefer `for...of` over `.forEach()` (enforced by Biome `noForEach`).

**Backend-specific TypeScript**

- ESM-only: always include `.ts` extension in imports (e.g., `import { foo } from './bar.ts'`).
- Path aliases use Node subpath imports (`#src/*`, `#tests/*`) defined in `package.json`, **not** in `tsconfig.json`.
- No build step — code runs directly via `node --import` with native TypeScript stripping.

**Frontend-specific TypeScript**

- Path alias: `@/` maps to `src/`. Never use relative imports that go above the current feature folder.
- Use `import.meta.env.VITE_*` for env vars, never `process.env`. Always import env from `src/shared/config/env.ts`, not directly from `import.meta.env`.
- Use `null` (not `undefined`) as the return value for components that render nothing.

---

### Backend Architecture Rules (`apps/api`)

**Dependency flow is strictly inward — never violate this:**

```
Route → Handler → Domain → Repository
```

- Routes handle HTTP only: validate input, format response. Zero business logic.
- Handlers orchestrate use cases. Never import from `src/shared/db/` or `database/` directly in handlers.
- Domain services contain pure business logic. No infrastructure dependencies.
- Repositories contain all SQL. Handlers access data only through repository ports (interfaces).
- All REST routes are prefixed with `/api` (configured in `src/server/index.ts`). Never hardcode `/api` in individual route files.

**Module independence**

- No direct imports between modules. Cross-module communication uses CQRS buses only.
  - Commands/queries: request-response via `CommandBus` / `QueryBus` (`register`/`execute`).
  - Events: fire-and-forget via `EventBus` (`on`/`emit`).
- Each module lives in `src/modules/<name>/` as a vertical slice.

**CQRS patterns**

- Action creators use `actionCreatorFactory('<module>')` with embedded `<Payload, Result>` phantom types.
- **Never** pass a manual generic to `bus.execute()` — the type is inferred from the action creator.
- **Never** use `ReturnType<typeof creator>` for handler params — use `HandlerAction<typeof creator>`.
- Middlewares must **never mutate** the action — always spread into a new object.
- `CommandMiddleware` returns `Promise<unknown>`; `EventMiddleware` returns `void`. Don't mix them.

**Dependency injection (Awilix)**

- Kebab-case filenames are auto-converted to camelCase DI identifiers (e.g., `create-todo.handler.ts` → `createTodoHandler`).
- Handlers receive all dependencies as a single destructured object: `function makeHandler({ dep1, dep2 }: Dependencies)`.
- Declare module-specific DI types via `declare global { export interface Dependencies { ... } }` in the module's `index.ts`.

**Database**

- Always use tagged template literals for parameterized queries: `` db`SELECT * FROM ${db(tableName)} WHERE id = ${id}` ``.
- Table names use `db(tableName)` (identifier interpolation). Values use `${value}` (auto-parameterized).
- Transactions: `withTransaction(async (tx) => { ... })`.
- Extend `SqlRepositoryBase` for generic CRUD; implement repository port interface.
- Migrations live in `db/migrations/`; create with `pnpm db:create-migration <name>`.

**Logging and errors**

- Never use `console.log` — use the injected Pino `logger` dependency.
- Domain errors extend `ExceptionBase`. Use built-in exceptions: `NotFoundException`, `ConflictException`, `ArgumentInvalidException`, etc.
- Always include a descriptive message: `throw new NotFoundException('Todo with id X not found')`.

**Schemas**

- Use TypeBox (`Type.Object`, `Type.String`, etc.) for all request/response schemas.
- Schema files are named `<command|query>.schema.ts` and co-located with their handler.

---

### Frontend Architecture Rules (`apps/web`)

**Vertical slice architecture**

```
src/
├── features/<feature>/
│   ├── store/        → Redux slice, selectors, RTK Query hooks, types, specs
│   ├── components/   → Feature-specific React components
│   ├── hooks/        → Feature-specific React hooks
│   └── services/     → Services consumed by Redux
├── shared/
│   ├── config/       → env.ts, sentry.ts
│   ├── helpers/      → style.utils.ts (cn()), localStorage, etc.
│   └── store/        → Redux store setup, base RTK Query API, typed hooks
├── UI/
│   ├── Elements/     → shadcn/ui based reusable components
│   └── Layout/       → Page layouts, Header, global.css (Tailwind theme)
└── routes/           → Route definitions + lazy-loaded page components
```

**State management (Redux)**

- Components only dispatch actions and display data via selectors. Zero business logic in components.
- Business and domain logic belongs in selectors and reducers (pure functions).
- Side effects (API calls, async flows) go in RTK Query, thunks, or listener middleware.
- Always use typed hooks: `useAppDispatch` and `useAppSelector` from `src/shared/store/types.ts`. Never use raw `useDispatch`/`useSelector`.
- Store is configured in `src/shared/store/index.ts`.

**API layer**

- The frontend communicates with the backend via **REST only** (no GraphQL).
- RTK Query base API is defined in `src/shared/store/api.ts`.
- Feature-level API hooks are defined in `features/<feature>/store/` and extend the base API.
- Use shared types from `packages/shared` for REST request/response types. Do not duplicate types.
- Backend base URL comes from `import.meta.env.VITE_API_URL` via `src/shared/config/env.ts`.

**UI and styling**

- Tailwind CSS 4 via `@tailwindcss/vite` plugin. No PostCSS config needed.
- Theme defined as CSS variables in `src/UI/Layout/global.css` using `@theme inline`.
- shadcn/ui components live in `src/UI/Elements/`. Add via `npx shadcn@latest add <component>`.
- Use `cn()` helper from `src/shared/helpers/style.utils.ts` for class merging (combines `clsx` + `tailwind-merge`).
- Never write raw CSS files for feature styles — use Tailwind utility classes.

**Routing**

- All routes are lazy-loaded with `React.lazy()`.
- `AppProvider.tsx` wraps everything in `<Suspense>`. New routes must be added to `src/routes/index.tsx`.
- Page components live in `src/routes/<PageName>/`.

**API mocking**

- MSW handles API mocking in both tests and development.
- Mock handlers live in `src/test/`. Mock DB uses `@mswjs/data`.
- In tests, import mock handlers from `src/test/` — never mock fetch/axios directly.

---

### Testing Rules

**Backend (`apps/api`)**

- Unit/integration tests: `*.spec.ts` files co-located with source, using `node:test` (`describe`/`it`/`assert`). No Vitest on the backend.
- E2E tests: Gherkin `.feature` files in `tests/<feature>/`, step definitions in `tests/<feature>/<feature>.steps.ts`.
- E2E test server: use `buildApp()` from `tests/support/server.ts` — creates a Fastify instance without binding to a port.
- Load tests: k6 scripts in `tests/<feature>/` alongside E2E.
- Never use `console` in tests — use the test server's logger or `assert`.
- Run `pnpm test:e2e` requires Postgres running (use Docker Compose at root).

**Frontend (`apps/web`)**

- Unit/integration tests: Vitest 4 + Testing Library. Test files use `.spec.ts` / `.spec.tsx` suffix co-located with source.
- Mock data files use `.mocks.spec.ts` suffix and are excluded from test runs.
- Vitest globals (`describe`, `it`, `expect`, `vi`) are available without imports.
- E2E tests: Cucumber + Playwright. Run `pnpm exec playwright install` once before first E2E run.
- E2E command: `pnpm e2e:local` (requires dev server running separately).
- Use MSW for all API mocking in tests. Never bypass MSW with direct fetch mocks.
- Always run `pnpm test` and `pnpm build` before submitting changes.

---

### Code Quality & Style Rules

**Both apps**

- **Biome 2.4.6** is the single tool for linting, formatting, and import sorting. Never add ESLint or Prettier.
- Style: single quotes, 2-space indent, trailing commas, semicolons, LF line endings, 80-char line width (backend: 100-char).
- File naming: `kebab-case` only (enforced by Biome).
- Run `pnpm check` before committing. Auto-fix with `pnpm check:fix`.
- No `console` anywhere in source — backend uses injected Pino `logger`; frontend uses Sentry/error tracking utilities.

**Backend-specific**

- No classes for business logic — use factory functions and composition.
- `noExplicitAny` is a Biome error in source files (relaxed in test files only).

**Frontend-specific**

- `noImplicitAny: false` but still avoid `any` — prefer `unknown`.
- Use `import.meta.env` not `process.env`.

---

### Development Workflow Rules

**Commits and releases**

- Conventional Commits enforced by commitlint: `type(scope): description`.
- Valid types: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`, `perf`, `ci`, `build`, `revert`.
- Example: `feat(todos): add create todo endpoint`.
- Releases are automated via semantic-release on merge to `main`. Never manually bump versions or edit `CHANGELOG.md`.
- Pre-commit hook (Husky) runs `biome check --staged` automatically.

**Environment variables**

- Backend: copy `.env.example` → `.env` via `pnpm create:env`. Postgres connection string is `DBMATE_DATABASE_URL`.
- Frontend: env vars must be prefixed `VITE_`. Always centralized in `src/shared/config/env.ts`.
- Never commit `.env` files. Never hardcode secrets or DSNs.
- Docker Compose at monorepo root provides Postgres. Start with `docker compose up postgres -d` from root.

**Database workflow**

- Migrations are SQL files managed by DBMate in `apps/api/db/migrations/`.
- Create: `pnpm db:create-migration <name>` (inside `apps/api`).
- Apply: `pnpm db:migrate` (inside `apps/api`, requires running Postgres).
- Seeds: `pnpm db:seed` (inside `apps/api`).

**Architecture validation (backend)**

- Run `pnpm deps:validate` to verify layer boundaries with dependency-cruiser.
- This runs in CI — do not merge PRs that fail dependency boundary checks.

---

### Critical Don't-Miss Rules

**Backend**

- ❌ Never import `src/shared/db/` or `database/` directly in a handler file.
- ❌ Never import directly from one module into another — use CQRS buses.
- ❌ Never pass a manual generic to `bus.execute<T>()` — infer from action creator.
- ❌ Never use `ReturnType<typeof creator>` for handler params — use `HandlerAction<typeof creator>`.
- ❌ Never mutate `action.meta` in middleware — always spread: `{ ...action, meta: { ...action.meta } }`.
- ❌ Never omit `.ts` extension in ESM imports.
- ❌ Never define path aliases in `tsconfig.json` — use Node subpath imports in `package.json`.
- ❌ Never put business logic in route files.
- ❌ Never use `npm` or `yarn` — pnpm only.
- ❌ Never add enums — use `const` objects with derived types.

**Frontend**

- ❌ Never put business logic in React components — components dispatch and display only.
- ❌ Never use raw `useDispatch`/`useSelector` — always use typed `useAppDispatch`/`useAppSelector`.
- ❌ Never import `import.meta.env` directly — always use `src/shared/config/env.ts`.
- ❌ Never mock fetch/axios directly in tests — always use MSW handlers.
- ❌ Never use relative imports that go above the current feature folder — use `@/` alias.
- ❌ Never add PostCSS config — Tailwind 4 uses the Vite plugin.
- ❌ Never install shadcn/ui components as npm packages — use `npx shadcn@latest add <component>` to copy them into `src/UI/Elements/`.

**Monorepo**

- ❌ Never define a database service per app — Docker Compose is at the monorepo root only.
- ❌ Never duplicate REST request/response types between `apps/web` and `apps/api` — put them in `packages/shared`.
- ❌ Never run `pnpm install` inside a workspace directly — run from the monorepo root.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code in this project.
- Follow ALL rules exactly as documented — especially architecture boundaries and CQRS patterns.
- When in doubt about where code belongs, refer to the folder structure and layer rules above.
- Update this file if new patterns emerge during development.

**For Humans:**

- Keep this file lean and focused on what agents need to know.
- Update when technology stack or architecture decisions change.
- Remove rules that become obvious over time.

_Last Updated: 2026-03-07_