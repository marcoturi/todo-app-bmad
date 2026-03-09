# Story 1.1: Monorepo Scaffolding and Boilerplate Initialization

Status: done

## Story

As a developer,
I want the moon-managed pnpm monorepo scaffolded with both app boilerplates and the shared package,
So that the project has a clean, consistent foundation for all subsequent development.

## Acceptance Criteria

1. Monorepo root has `pnpm-workspace.yaml`, `moon.yml`, and `package.json` configured for pnpm 10.x and Node 24.x.
2. `apps/web` is initialised from `marcoturi/react-redux-boilerplate` via `npx degit marcoturi/react-redux-boilerplate apps/web`.
3. `apps/api` is initialised from `marcoturi/fastify-boilerplate` via `npx degit marcoturi/fastify-boilerplate apps/api`.
4. `packages/shared` exists as a pnpm workspace package with `name: "@todo-app/shared"` in its `package.json`, a `tsconfig.json`, and an `src/index.ts` entry point.
5. `.moon/workspace.yml` correctly references all three workspace members (`apps/web`, `apps/api`, `packages/shared`).
6. `pnpm install` completes successfully from the monorepo root with no errors.
7. `mercurius`, `@graphql-tools/load-files`, `@graphql-tools/merge`, and all GraphQL-related packages are removed from `apps/api/package.json`.
8. All `*.graphql-schema.ts` and `*.resolver.ts` files are deleted from `apps/api/src/`.
9. `pnpm install` still completes successfully after GraphQL removal.
10. `pnpm --filter apps/api check` passes with zero Biome errors after GraphQL removal.
11. `apps/api/package.json` contains scripts: `test`, `test:coverage`, and `test:e2e`.
12. `apps/web/package.json` contains scripts: `test`, `test:coverage`, and `test:e2e`.
13. Running `pnpm --filter apps/api test` and `pnpm --filter apps/web test` both exit with code 0 on the scaffolded boilerplate.

## Tasks / Subtasks

- [x] Task 1: Initialise monorepo root (AC: 1, 5, 6)
  - [x] Create `package.json` at root — `"packageManager": "pnpm@10.x"`, `engines: { node: ">=24" }`, workspaces via `pnpm-workspace.yaml`
  - [x] Create `pnpm-workspace.yaml` referencing `apps/*` and `packages/*`
  - [x] Create `moon.yml` at root (task definitions for cross-workspace orchestration)
  - [x] Create `.moon/workspace.yml` referencing `apps/web`, `apps/api`, `packages/shared`
  - [x] Create `.nvmrc` with `24` (or `lts/jod`)

- [x] Task 2: Scaffold `apps/web` from boilerplate (AC: 2)
  - [x] Run `npx degit marcoturi/react-redux-boilerplate apps/web`
  - [x] Verify `apps/web/package.json` has correct name (e.g. `@todo-app/web`)
  - [x] Confirm Vite 7.x, React 19.x, Redux Toolkit 2.x, Vitest 4.x, Playwright present in dependencies

- [x] Task 3: Scaffold `apps/api` from boilerplate (AC: 3)
  - [x] Run `npx degit marcoturi/fastify-boilerplate apps/api`
  - [x] Verify `apps/api/package.json` has correct name (e.g. `@todo-app/api`)
  - [x] Confirm Fastify 5.x, Awilix 13.x, postgres.js 3.x, node:test, Cucumber present

- [x] Task 4: Remove GraphQL from `apps/api` (AC: 7, 8, 9, 10)
  - [x] Remove packages from `apps/api/package.json`: `mercurius`, `@graphql-tools/load-files`, `@graphql-tools/merge`, and any other `@graphql-*` or `graphql` packages
  - [x] Delete all `*.graphql-schema.ts` files from `apps/api/src/`
  - [x] Delete all `*.resolver.ts` files from `apps/api/src/`
  - [x] Remove any Mercurius plugin registration from `apps/api/src/server/` (e.g. `fastify.register(mercurius, ...)`)
  - [x] Run `pnpm install` from root to regenerate lockfile
  - [x] Run `pnpm --filter apps/api check` — confirm zero Biome violations

- [x] Task 5: Initialise `packages/shared` (AC: 4)
  - [x] Create `packages/shared/package.json` with `name: "@todo-app/shared"`, `version: "0.0.1"`, `main: "src/index.ts"`, and required pnpm workspace fields
  - [x] Create `packages/shared/tsconfig.json` extending root tsconfig with `strict: true`
  - [x] Create `packages/shared/src/index.ts` as empty barrel (will be populated in Story 1.3)
  - [x] Verify `@todo-app/shared` resolves correctly from both `apps/api` and `apps/web` after `pnpm install`

- [x] Task 6: Configure test and E2E scripts (AC: 11, 12, 13)
  - [x] Ensure `apps/api/package.json` scripts include:
    - `"test": "node --import tsx --test src/**/*.spec.ts"` (or equivalent for node:test)
    - `"test:coverage": "c8 node --import tsx --test src/**/*.spec.ts"`
    - `"test:e2e": "cucumber-js"`
  - [x] Ensure `apps/web/package.json` scripts include:
    - `"test": "vitest run"`
    - `"test:coverage": "vitest run --coverage"`
    - `"test:e2e": "cucumber-js"`
  - [x] Run `pnpm --filter apps/api test` from root — must exit 0
  - [x] Run `pnpm --filter apps/web test` from root — must exit 0

- [x] Task 7: Final validation
  - [x] Run `pnpm install` from monorepo root — no errors
  - [x] Run `pnpm --filter apps/api check` — zero Biome violations
  - [x] Run `pnpm --filter apps/web check` — zero Biome violations
  - [x] Confirm no `console.log` calls exist in `apps/api/src/` (Pino logger only)
  - [x] Confirm `.env.example` files are present in both `apps/api` and `apps/web` (from boilerplate — will be completed in Story 1.2)

## Dev Notes

### Overview

This story is purely scaffolding — no business logic is written here. The outcome is a clean, installable monorepo with both boilerplate apps in place, GraphQL stripped from the backend, and the shared types package skeleton ready. No todos module, no DB migrations, no CI pipeline — those are Stories 1.2–1.5.

### Monorepo Tooling

- **Package manager:** pnpm 10.x **only**. Never `npm install` or `yarn`. All installs from the monorepo root.
- **Monorepo manager:** moon — task runner for cross-workspace task dependency. Used in CI to run tasks in the correct order. [Source: architecture.md#Monorepo Orchestration]
- **Node version:** 24.x (LTS). The backend runs native TypeScript via `node --import` — no build step needed. Confirm `.nvmrc` is present.
- **Workspace layout:**
  ```
  todo-app-bmad/
  ├── .moon/workspace.yml
  ├── apps/web/
  ├── apps/api/
  ├── packages/shared/
  ├── docker-compose.yml    ← Postgres (added in Story 1.2)
  ├── moon.yml
  ├── package.json
  └── pnpm-workspace.yaml
  ```

### Boilerplate Initialisation Details

**Frontend (`apps/web`) — `marcoturi/react-redux-boilerplate`:**

Key stack already in the boilerplate (do NOT reinstall or downgrade):
- Vite 7.3.1 + SWC + `@tailwindcss/vite` (no PostCSS — do NOT add `postcss.config.js`)
- React 19.2.4 + Redux Toolkit 2.11.2
- Vitest 4.0.18 + Testing Library + jsdom + MSW 2.12.10
- Cucumber 12.7.0 + Playwright 1.58.2
- Biome 2.4.6 (NO ESLint, NO Prettier — do not add them)
- Path alias: `@/` → `src/` (already configured in `vite.config.mts`)

[Source: architecture.md#Frontend: marcoturi/react-redux-boilerplate]

**Backend (`apps/api`) — `marcoturi/fastify-boilerplate`:**

Key stack already in the boilerplate (do NOT reinstall or downgrade):
- Fastify 5.8.2 + Awilix 13.0.3 + Pino logging
- postgres.js 3.4.8 + DBMate
- node:test + c8 coverage (NOT Vitest — do not add Vitest to the backend)
- Cucumber 12.7.0 + Gherkin
- Biome 2.4.6
- Path aliases: `#src/*`, `#tests/*` via `package.json` subpath imports (NOT tsconfig paths)
- ESM-only: all imports must include `.ts` extension

[Source: architecture.md#Backend: marcoturi/fastify-boilerplate]

### GraphQL Removal — Critical Detail

The fastify-boilerplate includes Mercurius (GraphQL). This project is **REST only**. Remove completely:

**Packages to remove from `apps/api/package.json`:**
- `mercurius`
- `@graphql-tools/load-files`
- `@graphql-tools/merge`
- `graphql` (if present)
- Any other `@graphql-*` packages

**Files to delete:**
- All `*.graphql-schema.ts` in `apps/api/src/`
- All `*.resolver.ts` in `apps/api/src/`

**Plugin registration to remove:**
- Any `fastify.register(mercurius, ...)` call in `apps/api/src/server/` or `apps/api/src/index.ts`

After removal: run `pnpm install` from root, then `pnpm --filter apps/api check` — must be zero violations before the story is considered done. [Source: epics.md#Story 1.1 — GraphQL removal AC]

### `packages/shared` Bootstrap

The shared package is a minimal skeleton in this story — no types are defined yet (those come in Story 1.3). What must exist:

```
packages/shared/
├── src/
│   └── index.ts    ← empty or `export {};`
├── package.json    ← name: "@todo-app/shared", version: "0.0.1"
└── tsconfig.json
```

**`packages/shared/package.json` minimum required fields:**
```json
{
  "name": "@todo-app/shared",
  "version": "0.0.1",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

**Workspace alias resolution:** Both `apps/api` and `apps/web` must add `"@todo-app/shared": "workspace:*"` to their `package.json` dependencies. After `pnpm install`, pnpm resolves the alias via the workspace protocol. [Source: architecture.md#Shared Package]

**Important for `apps/api` (ESM + Node subpath imports):** The backend does not use tsconfig path aliases. If `@todo-app/shared` needs a Node subpath import entry, add it to `apps/api/package.json` imports field:
```json
{
  "imports": {
    "#src/*": "./src/*.ts",
    "#tests/*": "./tests/*.ts"
  }
}
```
The `@todo-app/shared` workspace alias is resolved by pnpm directly — no subpath import entry needed for it.

### Test Script Exact Requirements

**`apps/api` test scripts** — backend uses `node:test`, NOT Vitest:
- `test`: must run `node:test` unit tests (typically via `node --import` or a tsx-based runner since the boilerplate uses native TS execution without a build step)
- `test:coverage`: wraps `test` with `c8` coverage reporter, must exit non-zero if < 70% coverage (configured in Story 3.7 — for now just ensure the script exists and runs)
- `test:e2e`: invokes `cucumber-js` for Gherkin E2E scenarios in `tests/`

**`apps/web` test scripts** — frontend uses Vitest:
- `test`: `vitest run` (single pass, no watch)
- `test:coverage`: `vitest run --coverage` (uses Vitest's built-in `@vitest/coverage-v8`)
- `test:e2e`: `cucumber-js` for Playwright E2E in `e2e/`

Both boilerplates likely already include these — verify they exist and match the pattern above. If the boilerplate uses different script names, rename them to match (e.g. rename `e2e` → `test:e2e`).

### Critical Architecture Rules for This Story

- ❌ Never `npm install` or `yarn` — pnpm only, always from root
- ❌ Never add PostCSS config to `apps/web` — Tailwind 4 uses the Vite plugin
- ❌ Never add ESLint or Prettier to either app — Biome only
- ❌ Never define path aliases in `tsconfig.json` on the backend — use Node subpath imports in `package.json`
- ❌ Never define a `docker-compose.yml` per app — the single root-level one (added in Story 1.2) is the only one
- ❌ Never run `pnpm install` inside a workspace directory — always from the monorepo root

### What Is NOT in Scope for This Story

The following are explicitly deferred to later stories:
- DB migration files → Story 1.2
- Docker Compose → Story 1.2
- `.env.example` files (unless boilerplate provides them) → Story 1.2
- `packages/shared` type definitions (`Todo`, `CreateTodoRequest`, `UpdateTodoRequest`) → Story 1.3
- GitHub Actions CI workflow → Story 1.4
- README documentation → Story 1.5
- Any todos module code (handlers, routes, repository) → Epics 2 & 3

### Project Structure Notes

- This story establishes the exact directory structure all subsequent stories depend on
- The complete target structure is defined in [Source: architecture.md#Complete Project Directory Structure]
- The `src/modules/todos/` directory does not need to be created in this story — it will be created as part of Epic 2
- The `tests/` and `e2e/` directories likely come from the boilerplates — do not restructure them

### References

- [Source: architecture.md#Starter Template Evaluation] — degit commands, boilerplate stack details
- [Source: architecture.md#Monorepo Orchestration] — moon setup, pnpm workspace layout
- [Source: architecture.md#Complete Project Directory Structure] — full target file tree
- [Source: architecture.md#Naming Patterns] — kebab-case backend files, PascalCase frontend components
- [Source: epics.md#Story 1.1] — acceptance criteria, GraphQL removal requirements, test script requirements
- [Source: project-context.md#Monorepo Structure] — critical monorepo rules for AI agents
- [Source: project-context.md#Critical Don't-Miss Rules] — all ❌ rules that apply here

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- **Node 22.x / node:test TypeScript**: The active system uses Node 22.15.0 (not 24.x). Native `.ts` execution requires `--experimental-strip-types` flag on Node 22. Updated `test:unit` and `test:coverage` scripts in `apps/api/package.json` to include this flag. On Node 24.x (target runtime), TypeScript stripping is stable and the flag is unnecessary — the scripts will continue to work.
- **Vitest / VITE_API_URL undefined**: The `react-redux-boilerplate` uses `new URL('/', env.API_URL)` in `src/shared/store/api.ts`. In the test environment, `VITE_API_URL` was undefined, causing `TypeError: Invalid URL`. Fixed by creating `apps/web/.env.test` with `VITE_API_URL=http://localhost:3000`. This is standard Vite/Vitest `.env.test` file convention and loads automatically during test runs.
- **Biome schema version mismatch**: `apps/web/biome.json` referenced schema `2.3.15` but installed Biome is `2.4.6`. Ran `biome migrate --write` inside `apps/web` to update the schema reference. Zero violations confirmed after migration.
- **`apps/api/src/server/index.ts` quote style**: Initial edit used double quotes; Biome enforces single quotes in the API project. Ran `pnpm --filter @todo-app/api check:fix` to auto-correct. Zero violations confirmed.
- **[Code Review] `.moon/workspace.yml` invalid `toolchain` field**: Moon 1.41.7 rejects `toolchain` in `workspace.yml` — it belongs in `.moon/toolchain.yml`. Moved Node/pnpm toolchain config to new `.moon/toolchain.yml`. Also removed `runner.implicitInputs` (no longer a valid field in this moon version). Config now parses cleanly: `pnpm moon query projects` lists all 3 workspace members.
- **[Code Review] `.nvmrc` used non-standard value `24.*`**: Neither nvm nor fnm recognises `24.*` as a valid version string. Updated to exact version `24.11.0`.
- **[Code Review] `packages/shared/tsconfig.json` did not extend root tsconfig**: Story task required extending root tsconfig; the file was standalone and there was no root `tsconfig.json`. Created root `tsconfig.json` with shared base options (`strict`, `esModuleInterop`, `forceConsistentCasingInFileNames`, `skipLibCheck`) and added `"extends": "../../tsconfig.json"` to `packages/shared/tsconfig.json`. Also removed dead `outDir`, `declaration`, `declarationMap`, `sourceMap` options (package exports raw `.ts` sources with no build step) and added `allowImportingTsExtensions` + `noEmit` for consistency with the rest of the monorepo.
- **[Code Review] `pnpm.onlyBuiltDependencies` in `apps/web/package.json`**: pnpm 10 ignores this field in workspace sub-packages and emits a warning on every `pnpm install`. Moved the field to root `package.json` (adding `protobufjs` which pnpm itself surfaced) and removed it from `apps/web/package.json`.
- **[Code Review] `packageManager` declared in sub-packages with conflicting version**: `apps/api` and `apps/web` both declared `packageManager: pnpm@10.31.0` while root declared `pnpm@10.12.4`, causing Corepack to attempt a download on every workspace-directory invocation. Removed `packageManager` from both sub-packages — it is only needed at the monorepo root.
- **[Code Review] `@moonrepo/cli` version pinned to `^1.32.6` (9 minor versions behind installed `1.41.7`)**: Updated root `package.json` to pin exact version `1.41.7` to prevent accidental schema-breaking upgrades.
- **[Code Review] `moon.yml` root task inputs referenced non-existent `src/**/*` paths**: The root `moon.yml` had `inputs: - 'src/**/*'` / `tests/**/*` on all tasks; those paths don't exist at the monorepo root, so moon's cache invalidation would never trigger. Removed all `inputs` and `outputs` blocks from root task definitions.
- **[Code Review] No root `.gitignore`**: Both app boilerplates had their own `.gitignore` files but there was no root-level one to cover `node_modules/`, `.moon/cache/`, `*.tsbuildinfo`, and OS artefacts at the monorepo root. Created root `.gitignore`.

### Completion Notes List

- Monorepo root scaffolded: `package.json` (pnpm@10.12.4, node >=24), `pnpm-workspace.yaml`, `moon.yml`, `.moon/workspace.yml`, `.nvmrc` (24.11.0).
- `apps/web` cloned from `marcoturi/react-redux-boilerplate` via `npx degit`. Renamed package to `@todo-app/web`. Added `test:e2e` script (mirrors `e2e:local`). Added `@todo-app/shared: workspace:*` dependency. Migrated Biome schema to 2.4.6. Removed `packageManager` field (managed at root).
- `apps/api` cloned from `marcoturi/fastify-boilerplate` via `npx degit`. Renamed package to `@todo-app/api`. Removed all GraphQL packages (`mercurius`, `@graphql-tools/load-files`, `@graphql-tools/merge`, `graphql`, `@graphql-codegen/cli`, `@graphql-codegen/typescript`). Deleted 5 GraphQL source files. Removed Mercurius plugin registration and `gql.ts` plugin from `src/server/index.ts`. Updated `matchFilter` to only load `.route.ts` files (not `.resolver.ts`). Added `@todo-app/shared: workspace:*` dependency. Updated test scripts to include `--experimental-strip-types` for Node 22.x compatibility. Removed `packageManager` field (managed at root).
- `packages/shared` created as empty skeleton: `package.json` (name: `@todo-app/shared`, type: module, exports pointing to `src/index.ts`), `tsconfig.json` (extends root, strict mode, NodeNext, no-emit), `src/index.ts` (`export {}`).
- `@todo-app/shared` confirmed symlinked in both `apps/api/node_modules/@todo-app/` and `apps/web/node_modules/@todo-app/` after `pnpm install`.
- All validation gates passed: `pnpm install` ✅, `apps/api check` ✅ (0 violations, 73 files), `apps/web check` ✅ (0 violations, 96 files), `apps/api test` ✅ (4/4 pass), `apps/web test` ✅ (16/16 pass), no `console.log` in `apps/api/src/`, `.env.example` present in both apps.
- Code review fixes applied: `.moon/workspace.yml` + new `.moon/toolchain.yml` (H1), `.nvmrc` → `24.11.0` (M1), root `tsconfig.json` created + `packages/shared/tsconfig.json` updated to extend it (H3), `pnpm.onlyBuiltDependencies` moved to root (M2), `packageManager` removed from sub-packages (M3), `@moonrepo/cli` pinned to `1.41.7` (M4), `moon.yml` inputs cleaned (L3), root `.gitignore` created (L2). All gates re-verified green after fixes.

### File List

- `package.json` *(created)* — monorepo root manifest; pnpm@10.12.4, node >=24, `pnpm.onlyBuiltDependencies`, `@moonrepo/cli` 1.41.7
- `pnpm-workspace.yaml` *(created)* — workspace member globs (`apps/*`, `packages/*`)
- `tsconfig.json` *(created)* — root base TypeScript config extended by `packages/shared`
- `moon.yml` *(created)* — moon root project config with task definitions (no stale `src/**/*` inputs)
- `.moon/workspace.yml` *(created)* — moon workspace config; projects list, vcs, runner
- `.moon/toolchain.yml` *(created)* — moon toolchain config; Node 24.11.0, pnpm 10.12.4
- `.nvmrc` *(created)* — Node version pin: `24.11.0`
- `.gitignore` *(created)* — root-level gitignore covering `node_modules/`, `.moon/cache/`, env files, OS artefacts
- `pnpm-lock.yaml` *(created)* — generated lockfile from `pnpm install`
- `apps/web/` *(created — full boilerplate)* — cloned from `marcoturi/react-redux-boilerplate`
- `apps/web/package.json` *(modified)* — renamed to `@todo-app/web`, removed `packageManager` field, added `test:e2e` script, added `@todo-app/shared` dep, removed `pnpm.onlyBuiltDependencies` (now at root)
- `apps/web/biome.json` *(modified)* — migrated schema reference from 2.3.15 → 2.4.6
- `apps/web/.env.test` *(created)* — test environment variables for Vitest (`VITE_API_URL`, `VITE_SENTRY_DSN`, `VITE_API_MOCKING`)
- `apps/api/` *(created — full boilerplate)* — cloned from `marcoturi/fastify-boilerplate`
- `apps/api/package.json` *(modified)* — renamed to `@todo-app/api`, removed `packageManager` field, removed GraphQL packages, updated test scripts with `--experimental-strip-types`, added `@todo-app/shared` dep
- `apps/api/src/server/index.ts` *(modified)* — removed mercurius registration, removed gql.ts import, updated matchFilter to `.route.ts` only
- `apps/api/src/server/plugins/gql.ts` *(deleted)* — GraphQL schema loader plugin
- `apps/api/src/modules/user/dtos/user.graphql-schema.ts` *(deleted)*
- `apps/api/src/modules/user/commands/create-user/create-user.graphql-schema.ts` *(deleted)*
- `apps/api/src/modules/user/commands/create-user/create-user.resolver.ts` *(deleted)*
- `apps/api/src/modules/user/queries/find-users/find-users.graphql-schema.ts` *(deleted)*
- `apps/api/src/modules/user/queries/find-users/find-users.resolver.ts` *(deleted)*
- `packages/shared/package.json` *(created)* — `@todo-app/shared` skeleton manifest (ESM, exports `./src/index.ts`)
- `packages/shared/tsconfig.json` *(created/modified)* — extends root tsconfig; strict, NodeNext, allowImportingTsExtensions, noEmit
- `packages/shared/src/index.ts` *(created)* — empty barrel export (`export {}`)

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-08 | Scaffolded monorepo root files (`package.json`, `pnpm-workspace.yaml`, `moon.yml`, `.moon/workspace.yml`, `.nvmrc`) | AC 1, 5, 6 — establish monorepo foundation |
| 2026-03-08 | Cloned `apps/web` from `marcoturi/react-redux-boilerplate` via degit; renamed package, added `test:e2e`, added `@todo-app/shared` dep, migrated Biome schema | AC 2, 11, 12 |
| 2026-03-08 | Cloned `apps/api` from `marcoturi/fastify-boilerplate` via degit; renamed package, added `@todo-app/shared` dep | AC 3 |
| 2026-03-08 | Removed all GraphQL/Mercurius packages and source files from `apps/api`; updated `src/server/index.ts` to REST-only | AC 7, 8, 9, 10 |
| 2026-03-08 | Created `packages/shared` skeleton (`package.json`, `tsconfig.json`, `src/index.ts`) | AC 4 |
| 2026-03-08 | Ran `pnpm install` from monorepo root; confirmed workspace resolution for `@todo-app/shared` | AC 6, 9 |
| 2026-03-08 | Updated `apps/api` test scripts to include `--experimental-strip-types` for Node 22.x compatibility | AC 13 — boilerplate test scripts did not run under locally installed Node version |
| 2026-03-08 | Created `apps/web/.env.test` with `VITE_API_URL=http://localhost:3000` | AC 13 — Vitest tests failed with `Invalid URL` when `VITE_API_URL` was undefined in test env |
| 2026-03-08 | [Code Review H1] Moved `toolchain` block from `.moon/workspace.yml` to new `.moon/toolchain.yml`; removed invalid `runner.implicitInputs` field | Moon 1.41.7 rejected `toolchain` in workspace.yml — `pnpm moon query projects` now lists all 3 members cleanly |
| 2026-03-08 | [Code Review H3] Created root `tsconfig.json`; updated `packages/shared/tsconfig.json` to extend it; removed dead `outDir`/`declaration` options; added `allowImportingTsExtensions` + `noEmit` | Story task required extending root tsconfig; package exports raw `.ts` sources so build-output options were misleading |
| 2026-03-08 | [Code Review M1] Updated `.nvmrc` from `24.*` to exact version `24.11.0` | `24.*` is not a valid nvm/fnm version string |
| 2026-03-08 | [Code Review M2] Moved `pnpm.onlyBuiltDependencies` from `apps/web/package.json` to root `package.json` | pnpm 10 ignores this field in workspace sub-packages and warned on every install |
| 2026-03-08 | [Code Review M3] Removed `packageManager` field from `apps/api/package.json` and `apps/web/package.json` | Conflicting versions with root caused Corepack to attempt unnecessary downloads |
| 2026-03-08 | [Code Review M4] Pinned `@moonrepo/cli` to exact version `1.41.7` in root `package.json` | Previous `^1.32.6` diverged from installed version; moon has schema changes across minor versions |
| 2026-03-08 | [Code Review L2] Created root `.gitignore` | No root gitignore left `node_modules/`, `.moon/cache/`, `*.tsbuildinfo`, and OS artefacts untracked at monorepo root |
| 2026-03-08 | [Code Review L3] Removed `inputs`/`outputs` blocks from root `moon.yml` tasks | `src/**/*` and `tests/**/*` paths don't exist at monorepo root; stale inputs defeat moon's cache invalidation |