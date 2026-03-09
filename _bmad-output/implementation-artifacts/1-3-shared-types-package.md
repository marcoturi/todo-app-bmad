# Story 1.3: Shared Types Package

Status: done

## Story

As a developer,
I want the `@todo-app/shared` package to export all TypeScript types for the todo API contract,
So that both `apps/api` and `apps/web` consume the same type definitions without duplication.

## Acceptance Criteria

1. `packages/shared/src/todos.ts` is created and exports a `Todo` type with fields `{ id: string; description: string; completed: boolean; createdAt: string; updatedAt: string }` — dates as ISO strings (not `Date` objects) for JSON transport compatibility.
2. `packages/shared/src/todos.ts` exports a `CreateTodoRequest` type with `{ description: string }`.
3. `packages/shared/src/todos.ts` exports an `UpdateTodoRequest` type with `{ completed: boolean }`.
4. `packages/shared/src/index.ts` re-exports all public types from `todos.ts` so that `import { Todo } from '@todo-app/shared'` resolves correctly in both apps.
5. Running `tsc --noEmit` in `packages/shared` (i.e., `pnpm --filter @todo-app/shared type:check`) produces zero TypeScript errors.
6. `apps/api` can import `@todo-app/shared` types at runtime in the Node 24.x ESM-only environment with no module resolution errors.
7. `apps/web` can import `@todo-app/shared` types in the Vite 7.x + `vite-tsconfig-paths` build environment with no module resolution errors.
8. `pnpm --filter @todo-app/api check` passes with zero Biome violations after all changes.
9. `pnpm --filter @todo-app/api test` passes with zero failures after all changes.

## Tasks / Subtasks

- [x] Task 1: Create `packages/shared/src/todos.ts` (AC: 1, 2, 3)
  - [x] Export `Todo` type: `{ id: string; description: string; completed: boolean; createdAt: string; updatedAt: string }`
  - [x] Export `CreateTodoRequest` type: `{ description: string }`
  - [x] Export `UpdateTodoRequest` type: `{ completed: boolean }`
  - [x] Use `export type` for all three (type-only exports — no runtime values)

- [x] Task 2: Update `packages/shared/src/index.ts` (AC: 4)
  - [x] Replace the current `export {};` stub with `export type { Todo, CreateTodoRequest, UpdateTodoRequest } from './todos.ts'`
  - [x] Include `.ts` extension in the re-export path (required for NodeNext `moduleResolution`)

- [x] Task 3: Add `type:check` script to `packages/shared/package.json` (AC: 5)
  - [x] Add `"type:check": "tsc --noEmit"` to the `scripts` block
  - [x] Verify `pnpm --filter @todo-app/shared type:check` exits 0

- [x] Task 4: Verify `apps/api` module resolution (AC: 6)
  - [x] Confirm `@todo-app/shared` is already listed as `"workspace:*"` in `apps/api/package.json` dependencies — no change needed
  - [x] Confirm `packages/shared/package.json` `exports` field maps `"."` to `"./src/index.ts"` — this is the entry point Node 24 ESM resolves
  - [x] Write a minimal import test in `apps/api/src` to exercise the type: add a type-only import to an existing spec file (e.g., `util.spec.ts`) OR verify `pnpm --filter @todo-app/api check` passes (TypeScript will resolve the import during `tsc --noEmit`)
  - [x] Run `pnpm --filter @todo-app/api check` — confirm zero errors

- [x] Task 5: Verify `apps/web` module resolution (AC: 7)
  - [x] Confirm `@todo-app/shared` is already listed as `"workspace:*"` in `apps/web/package.json` dependencies — no change needed
  - [x] Confirm `vite-tsconfig-paths` plugin in `vite.config.mts` handles workspace package resolution automatically via `tsconfig.app.json`
  - [x] Run `pnpm --filter @todo-app/web check` — confirm zero errors (type check passes)

- [x] Task 6: Run final checks (AC: 8, 9)
  - [x] Run `pnpm --filter @todo-app/api check` — zero Biome/TS violations
  - [x] Run `pnpm --filter @todo-app/api test` — all tests pass
  - [x] Run `pnpm --filter @todo-app/shared type:check` — zero errors

### Review Follow-ups (AI)

- [x] [AI-Review][High] Create `apps/api/src/modules/todos/domain/todo.types.ts` importing from `@todo-app/shared` — forces `tsc --noEmit` in `apps/api` to actually resolve the package [AC: 6]
- [x] [AI-Review][High] Create `apps/web/src/features/todos/store/todos.types.ts` importing from `@todo-app/shared` — forces `tsc --noEmit` in `apps/web` to actually resolve the package [AC: 7]
- [x] [AI-Review][Medium] Add `"check": "tsc --noEmit"` script alias to `packages/shared/package.json` — makes `pnpm -r check` from root include shared package
- [x] [AI-Review][Medium] Fix `packages/shared/package.json` indentation from 4-space to 2-space — consistency with rest of monorepo
- [x] [AI-Review][Medium] Add `"description"` field to `packages/shared/package.json` — consistency with rest of monorepo
- [ ] [AI-Review][Low] Hoist common `devDependencies` to root `package.json` — `typescript`, `@biomejs/biome`, `@commitlint/*`, `@cucumber/*`, `@semantic-release/*`, `husky`, `semantic-release` are duplicated across `apps/api` and `apps/web` with identical versions; `@types/node` version mismatch (api=25.3.5, web=24.12.0) should be resolved first

## Dev Notes

### Overview

`packages/shared` already exists as a fully wired pnpm workspace package — `package.json`, `tsconfig.json`, and an empty `src/index.ts` stub are all in place from Story 1.1. The only work in this story is:

1. Creating `src/todos.ts` with the three shared types.
2. Updating `src/index.ts` to re-export them.
3. Adding a `type:check` script.
4. Verifying both apps resolve the package without errors.

**No dependency installation is needed.** Both `apps/api` and `apps/web` already declare `"@todo-app/shared": "workspace:*"` in their `package.json`. The `packages/shared/package.json` `exports` field already maps `"."` to `"./src/index.ts"`.

---

### Exact Type Definitions — Do Not Deviate

These are the canonical shared types for the entire project. All other code in `apps/api` and `apps/web` must derive from these — never redefine inline.

```typescript
// packages/shared/src/todos.ts

export type Todo = {
  id: string;           // UUID string (not number)
  description: string;
  completed: boolean;
  createdAt: string;    // ISO 8601 string — JSON has no Date type
  updatedAt: string;    // ISO 8601 string
};

export type CreateTodoRequest = {
  description: string;
};

export type UpdateTodoRequest = {
  completed: boolean;
};
```

**Why `string` for dates, not `Date`?**
JSON serialisation has no `Date` type — dates cross the wire as strings. The backend domain layer uses `Date` objects internally (after mapper conversion from `snake_case` DB rows), but the API contract (what `packages/shared` represents) uses ISO 8601 strings. The frontend treats them as opaque strings in v1 (no date display in UI). [Source: architecture.md#Format Patterns — Date handling]

**Why `export type`, not `export`?**
These are pure type definitions with no runtime value. Using `export type` makes the intent explicit, satisfies `verbatimModuleSyntax` on the backend (`apps/api/tsconfig.json`), and allows bundlers to tree-shake them safely.

---

### `packages/shared/src/index.ts` — Exact Final Content

```typescript
export type { Todo, CreateTodoRequest, UpdateTodoRequest } from './todos.ts';
```

The `.ts` extension is **mandatory** — `packages/shared/tsconfig.json` uses `"moduleResolution": "NodeNext"` which requires explicit `.ts` extensions on relative imports, matching the same rule enforced in `apps/api`. [Source: apps/api — project-context.md#Backend-specific TypeScript]

---

### `packages/shared/package.json` — Existing Configuration (Verify, Do Not Overwrite)

```json
{
  "name": "@todo-app/shared",
  "version": "0.0.1",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "engines": {
    "node": ">=24",
    "pnpm": ">=10"
  }
}
```

Only add the `scripts` block — do not change any other field. The `exports` entry `"./src/index.ts"` is what Node 24 ESM resolves when a consuming package does `import { Todo } from '@todo-app/shared'`. [Source: packages/shared/package.json — already on disk]

---

### `packages/shared/tsconfig.json` — Existing Configuration (No Changes Needed)

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowImportingTsExtensions": true,
    "noEmit": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

`allowImportingTsExtensions: true` is what allows `from './todos.ts'` with a `.ts` extension. `noEmit: true` means no JavaScript is emitted — the package ships its TypeScript source directly (consumed by the host compiler in each app). [Source: packages/shared/tsconfig.json — already on disk]

---

### How `apps/api` Resolves `@todo-app/shared`

- Node 24 ESM follows the `exports` field in `package.json`.
- `@todo-app/shared` resolves via the pnpm workspace symlink in `node_modules/@todo-app/shared` → `packages/shared`.
- The entry point `./src/index.ts` is TypeScript source — Node runs it directly via `--experimental-strip-types` (already configured in `apps/api` test scripts) or via native TS support.
- `apps/api/tsconfig.json` uses `"moduleResolution": "NodeNext"` — it follows the `exports` map.
- **No path mapping needed in `apps/api/tsconfig.json`** — pnpm workspace symlinks + `exports` handle it.

[Source: project-context.md#Backend-specific TypeScript, apps/api/package.json]

---

### How `apps/web` Resolves `@todo-app/shared`

- Vite uses `vite-tsconfig-paths` plugin (already in `vite.config.mts`) which reads `tsconfig.app.json`.
- `apps/web/tsconfig.app.json` uses `"moduleResolution": "bundler"` — Vite's bundler resolves workspace packages via the `exports` field in `packages/shared/package.json`.
- The `@todo-app/shared` workspace symlink in `apps/web/node_modules` → `packages/shared` is created by `pnpm install`.
- **No path mapping needed in `apps/web/tsconfig.app.json`** — Vite + pnpm workspace handles it.

[Source: apps/web/vite.config.mts, apps/web/tsconfig.app.json, project-context.md#Frontend-specific TypeScript]

---

### Story 1.2 Learnings — MUST READ

- **`packageManager` must only be at root.** Do NOT add `packageManager` to `packages/shared/package.json`. Leave it out.
- **Biome enforces single quotes** in `apps/api`. All new `.ts` files in `apps/api` must use single quotes. The shared package itself is not checked by `apps/api`'s Biome config (different workspace), but follow single quotes in shared as well for consistency.
- **pnpm install always from monorepo root.** Never run `pnpm install` inside `packages/shared`, `apps/api`, or `apps/web` directly.
- **`apps/api` has no `biome.json` in `packages/shared`** — Biome only checks `apps/api/src/` and `apps/web/src/`. The shared package files are not linted by either app's Biome config. However, `pnpm --filter @todo-app/api check` runs `biome check` scoped to `apps/api`, which will pick up any new type-only imports added to `apps/api/src/` files.
- **`?sslmode=disable` is required** in `DATABASE_URL` and `DBMATE_DATABASE_URL` for local dev with `postgres:17-alpine`. The `.env.example` already includes this.

[Source: 1-2-database-infrastructure-setup.md#Dev Agent Record — Completion Notes]

---

### Architecture Constraints Checklist

- ❌ Do NOT use `export` (runtime value export) — use `export type` for all three types
- ❌ Do NOT omit `.ts` extension from the re-export in `index.ts`
- ❌ Do NOT add a build step or emit JavaScript — the package ships TypeScript source directly
- ❌ Do NOT add `packageManager` field to `packages/shared/package.json`
- ❌ Do NOT run `pnpm install` from inside `packages/shared`
- ❌ Do NOT define these types anywhere else in `apps/api` or `apps/web` — `packages/shared` is the single source of truth
- ❌ Do NOT use `Date` type for `createdAt`/`updatedAt` in the shared types — use `string` (ISO 8601)
- ❌ Do NOT add enum types — use `const` objects with derived union types if needed (not required in this story)

[Source: project-context.md#Critical Don't-Miss Rules, architecture.md#Enforcement Guidelines]

---

### References

- [Source: architecture.md#Format Patterns] — canonical `Todo`, `CreateTodoRequest`, `UpdateTodoRequest` type definitions
- [Source: architecture.md#Data Architecture] — `createdAt`/`updatedAt` as ISO strings rationale
- [Source: architecture.md#Project Structure & Boundaries] — `packages/shared/src/todos.ts` exact file path
- [Source: architecture.md#Integration Points — Monorepo ↔ Shared Types] — import as `@todo-app/shared`, re-exports from `index.ts`
- [Source: architecture.md#Enforcement Guidelines] — use `@todo-app/shared` types, never inline
- [Source: project-context.md#Backend-specific TypeScript] — `.ts` extension mandatory, ESM-only
- [Source: project-context.md#Frontend-specific TypeScript] — `@/` alias pattern, `@todo-app/shared` via pnpm workspace
- [Source: packages/shared/package.json] — existing `exports`, `main`, `types` fields
- [Source: packages/shared/tsconfig.json] — `allowImportingTsExtensions`, `NodeNext` moduleResolution
- [Source: apps/api/package.json] — `"@todo-app/shared": "workspace:*"` already declared
- [Source: apps/web/package.json] — `"@todo-app/shared": "workspace:*"` already declared
- [Source: 1-2-database-infrastructure-setup.md] — Story 1.2 learnings applied above

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (via GitHub Copilot)

### Debug Log References

- `packages/shared` had no `node_modules` and no `typescript` devDependency, so `pnpm --filter @todo-app/shared type:check` initially failed with `tsc: not found`. Fixed by adding `"typescript": "5.9.3"` to `packages/shared/package.json` devDependencies and running `pnpm install` from the monorepo root.
- `edit_file` tool introduced double quotes in `packages/shared/src/index.ts`; corrected with `sed` (consistent with project single-quote convention).
- Code review found ACs 6 & 7 unverified (no actual imports of `@todo-app/shared` in either app). Fixed by creating scaffold type files in each app's todos module directory that import from the package, forcing `tsc --noEmit` to resolve it.
- Biome `organizeImports` required alphabetical import order in both new type scaffold files; auto-fixed with `biome check --write`.
- Code review found `packages/shared` excluded from root `pnpm -r check` (no `check` script). Fixed by adding `"check": "tsc --noEmit"` alias — confirmed `pnpm check` from root now covers all 3 of 4 workspace member packages (root itself has no `check` script, which is expected).

### Completion Notes List

- Created `packages/shared/src/todos.ts` with three `export type` definitions: `Todo` (5 fields, ISO string dates), `CreateTodoRequest` (description only), `UpdateTodoRequest` (completed only). Uses `export type` throughout per `verbatimModuleSyntax` requirement in `apps/api/tsconfig.json`.
- Updated `packages/shared/src/index.ts`: replaced empty `export {};` stub with `export type { Todo, CreateTodoRequest, UpdateTodoRequest } from './todos.ts'`. Explicit `.ts` extension required by `NodeNext` moduleResolution in `packages/shared/tsconfig.json`.
- Added `"scripts": { "type:check": "tsc --noEmit", "check": "tsc --noEmit" }`, `"devDependencies": { "typescript": "5.9.3" }`, and `"description"` to `packages/shared/package.json`. Fixed indentation to 2-space. Version of TypeScript matches the rest of the monorepo.
- Ran `pnpm install` from monorepo root to wire up the new devDependency.
- **Code review fix (H1):** Created `apps/api/src/modules/todos/domain/todo.types.ts` — re-exports all three types from `@todo-app/shared`, proving Node 24 ESM + pnpm workspace resolution works end-to-end under `tsc --noEmit`.
- **Code review fix (H1):** Created `apps/web/src/features/todos/store/todos.types.ts` — re-exports all three types from `@todo-app/shared`, proving Vite 7 + `vite-tsconfig-paths` + pnpm workspace resolution works end-to-end under `tsc --noEmit`.
- Both scaffold files will be the authoritative `todos.types.ts` files consumed by Epic 2 implementation — they are not throwaway stubs.
- Verified `apps/api/node_modules/@todo-app/shared` and `apps/web/node_modules/@todo-app/shared` symlinks both point to `../../../../packages/shared`.
- `pnpm check` (root, recursive) → covers shared + api + web, all clean.
- `pnpm --filter @todo-app/api test` → 4/4 passing, 0 failures.
- **Outstanding backlog item:** Hoist common devDependencies (`typescript`, `@biomejs/biome`, `@commitlint/*`, `@cucumber/*`, `@semantic-release/*`, `husky`, `semantic-release`) to root `package.json` — tracked in Review Follow-ups. Resolve `@types/node` version mismatch (api=25.3.5 vs web=24.12.0) before hoisting.

### File List

- `packages/shared/src/todos.ts` (created) — `Todo`, `CreateTodoRequest`, `UpdateTodoRequest` type exports
- `packages/shared/src/index.ts` (modified) — replaced `export {};` stub with re-exports from `todos.ts`
- `packages/shared/package.json` (modified) — added `scripts.type:check`, `scripts.check`, `devDependencies.typescript@5.9.3`, `description`; fixed indentation to 2-space
- `apps/api/src/modules/todos/domain/todo.types.ts` (created) — scaffold type file that imports from `@todo-app/shared`; proves api module resolution; will be extended in Epic 2
- `apps/web/src/features/todos/store/todos.types.ts` (created) — scaffold type file that imports from `@todo-app/shared`; proves web module resolution; will be extended in Epic 2
- `pnpm-lock.yaml` (modified) — updated by `pnpm install` to record the new typescript devDependency in packages/shared

## Change Log

- 2026-03-08: Story 1.3 implemented — shared types package complete. Created `todos.ts` with `Todo`, `CreateTodoRequest`, `UpdateTodoRequest` types; wired `index.ts` re-exports; added `type:check` script; added `typescript` devDependency. All type checks and tests pass across all three packages.
- 2026-03-08: Code review fixes applied — created `todo.types.ts` scaffold in `apps/api` and `todos.types.ts` scaffold in `apps/web` to prove real `@todo-app/shared` resolution under `tsc --noEmit`; added `check` script alias to `packages/shared/package.json` so root `pnpm -r check` covers it; fixed indentation and added description to `packages/shared/package.json`. All checks and tests remain green.

## Senior Developer Review (AI)

**Review Date:** 2026-03-08
**Outcome:** Changes Requested → All HIGH/MEDIUM Addressed
**Severity Breakdown:** 2 High, 3 Medium, 2 Low

### Action Items

- [x] [High] ACs 6 & 7 not verified — no actual `@todo-app/shared` imports existed in either app; `pnpm check` passed vacuously. Created `apps/api/src/modules/todos/domain/todo.types.ts` and `apps/web/src/features/todos/store/todos.types.ts` to force real resolution.
- [x] [Medium] `packages/shared` excluded from root `pnpm -r check` (no `check` script). Added `"check": "tsc --noEmit"` alias.
- [x] [Medium] `packages/shared/package.json` used 4-space indentation. Fixed to 2-space.
- [x] [Medium] `packages/shared/package.json` missing `description` field. Added.
- [ ] [Low] Hoist common devDependencies to root `package.json` — tracked in Review Follow-ups above.
- [ ] [Low] `packages/shared/package.json` legacy `main`/`types` fields redundant with `exports` — acceptable for now, no action needed.