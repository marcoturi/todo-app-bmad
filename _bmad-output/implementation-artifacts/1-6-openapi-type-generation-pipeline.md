# Story 1.6: OpenAPI Type Generation Pipeline

Status: done

## Story

As a developer,
I want the `@todo-app/shared` package to contain TypeScript types generated from the Fastify TypeBox schemas via the OpenAPI spec,
So that the API contract is always the single source of truth and silent drift between runtime schemas and shared types is impossible.

## Acceptance Criteria

1. **Given** the Fastify server starts,
   **When** `GET /api-docs/json` is called,
   **Then** it returns a valid OpenAPI 3.1.0 JSON document containing all registered API routes and their TypeBox schemas.

2. **Given** the `generate:types` script runs in `apps/api`,
   **When** executed (server must be running or script starts it),
   **Then** `openapi-typescript` generates TypeScript types from `GET /api-docs/json` and writes them to `packages/shared/src/api.ts`.

3. **Given** `packages/shared/src/generated/api.ts` has been generated,
   **When** `packages/shared/src/index.ts` is imported,
   **Then** it re-exports the `Todo`, `CreateTodoRequest`, and `UpdateTodoRequest` types from `packages/shared/src/api.ts` (not from the hand-authored `todos.ts`).

4. **Given** the generated types are the source of truth,
   **When** `packages/shared/src/todos.ts` is examined,
   **Then** it is deleted and no longer present in the repository.

5. **Given** the scaffold type files in `apps/api` and `apps/web` import from `@todo-app/shared`,
   **When** `pnpm -r type:check` runs,
   **Then** `apps/api/src/modules/todos/domain/todo.types.ts` and `apps/web/src/features/todos/store/todos.types.ts` both compile without errors using the generated types.

6. **Given** `pnpm check` and `pnpm -r type:check` are run across all workspaces,
   **When** they complete,
   **Then** there are zero lint, format, or type errors.

7. **Given** the `generate:types` script runs in CI,
   **When** the freshly generated `packages/shared/src/generated/api.ts` is diffed against the committed version,
   **Then** there is zero diff — the committed output exactly matches freshly generated output. If there is a diff, CI fails.

8. **Given** deferred technical debt items from Epic 1 retrospective,
   **When** this story is completed,
   **Then** `coverage/` and `lcov.info` are present in `.gitignore` for both `apps/api` and `apps/web` (retrospective item T2).

9. **Given** the web coverage gate was failing in CI at the end of Epic 1,
   **When** `pnpm --filter @todo-app/web test:coverage` runs,
   **Then** it passes the 10% threshold — the coverage `exclude` patterns in `apps/web/vite.config.mts` cover all zero-coverage scaffold files.

## Tasks / Subtasks

- [x] Task 1: Fix web coverage gate (AC: #9) — BLOCKER, must be done first
  - [x] 1.1 Run `pnpm --filter @todo-app/web test:coverage` locally to identify which source files pull coverage below 10%
  - [x] 1.2 Add any zero-coverage scaffold files (e.g. `todos.types.ts`, `todos.slice.ts`) to the `coverage.exclude` patterns in `apps/web/vite.config.mts`
  - [x] 1.3 Verify `pnpm --filter @todo-app/web test:coverage` passes locally before continuing

- [x] Task 2: Update `generate:types` script to target `packages/shared` (AC: #2)
  - [x] 2.1 Update `apps/api/scripts/generate-types.sh` — change `openapi-typescript` output target from `./client/rest.d.ts` to `../../packages/shared/src/api.ts`
  - [x] 2.2 Remove the GraphQL codegen call from `generate-types.sh` (GraphQL is not used in this project — `codegen.ts` is a boilerplate artefact)
  - [x] 2.3 Delete `apps/api/scripts/codegen.ts` (GraphQL codegen config — boilerplate artefact, not used)
  - [x] 2.4 Remove the `mkdir -p` for any `generated/` subdirectory — output goes directly to `packages/shared/src/api.ts`

- [x] Task 3: Generate the initial types file (AC: #2, #3)
  - [x] 3.1 Start Postgres and run migrations: `docker compose up postgres -d && pnpm --filter @todo-app/api db:migrate`
  - [x] 3.2 Start the API server: `cd apps/api && pnpm start` (or run script's embedded server start)
  - [x] 3.3 Run `pnpm --filter @todo-app/api generate:types` to produce `packages/shared/src/api.ts`
  - [x] 3.4 Inspect generated file — confirm it contains path `/api/v1/todos` (or the current user routes; all registered routes will appear)

- [x] Task 4: Update `packages/shared/src/index.ts` to export from generated types (AC: #3)
  - [x] 4.1 Extract the correct generated type names for `Todo`, `CreateTodoRequest`, `UpdateTodoRequest` from the generated `api.ts`
  - [x] 4.2 Update `packages/shared/src/index.ts` to re-export these types from `./api.ts`
  - [x] 4.3 Ensure the exported names remain `Todo`, `CreateTodoRequest`, `UpdateTodoRequest` (consumers import these names — do not change them)

- [x] Task 5: Delete hand-authored types and update scaffold files (AC: #4, #5)
  - [x] 5.1 Delete `packages/shared/src/todos.ts` — DEFERRED to Story 2.1 (todos routes not yet registered; see Completion Notes)
  - [x] 5.2 Verify `apps/api/src/modules/todos/domain/todo.types.ts` still compiles ✅
  - [x] 5.3 Verify `apps/web/src/features/todos/store/todos.types.ts` still compiles ✅

- [x] Task 6: Add CI drift-detection step (AC: #7)
  - [x] 6.1 Add a new CI step in `.github/workflows/release.yml` within the `ci` job — after `pnpm install`, before lint: start the API server, run `generate:types`, then `git diff --exit-code packages/shared/src/api.ts` to fail if output diverges
  - [x] 6.2 Ensure the CI step has `DATABASE_URL` / `DBMATE_DATABASE_URL` / `LOG_LEVEL` / `NODE_ENV` env vars available (same as the `e2e` job — the server needs them to start)

- [x] Task 7: Add coverage and lcov to .gitignore (AC: #8)
  - [x] 7.1 `coverage/` already present in root `.gitignore` (covers all workspaces); added `lcov.info` to root `.gitignore`
  - [x] 7.2 No per-workspace `.gitignore` files exist — root `.gitignore` applies to entire monorepo ✅

- [x] Task 8: Verify everything (AC: #6)
  - [x] 8.1 Run `pnpm --filter @todo-app/api test:coverage` — passes (4/4 tests, 100% coverage)
  - [x] 8.2 Run `pnpm --filter @todo-app/web test:coverage` — passes (16/16 tests, 91.96% coverage)
  - [x] 8.3 Run `pnpm check` — no lint/format errors (70 api files, 91 web files checked)
  - [x] 8.4 Run `pnpm -r type:check` — no type errors across all 3 workspaces
  - [x] 8.5 Run `pnpm --filter @todo-app/api deps:validate` — no violations (89 modules, 165 dependencies)

## Dev Notes

### Overview

This story has three goals:
1. **Unblock Epic 2** — fix the failing web coverage gate so CI is green.
2. **Establish the correct type contract pattern** — replace hand-authored `packages/shared/src/todos.ts` with OpenAPI-generated types so the Fastify TypeBox schemas are the single source of truth.
3. **Close retrospective technical debt** — T1 (devDep hoisting was already done in the Epic 1 post-story chore), T2 (coverage/.gitignore entries).

**Do this in order:** fix the coverage gate first (Task 1), then the type generation pipeline (Tasks 2–6). Do not proceed to Epic 2 story creation until both CI jobs (`ci` and `e2e`) are green.

---

### What Already Exists (Do NOT Recreate)

| Item | Location | Status |
|---|---|---|
| `@fastify/swagger` plugin | `apps/api/src/server/plugins/swagger.ts` | Registered, serving `/api-docs` and `/api-docs/json` |
| `openapi-typescript` binary | `apps/api/devDependencies` | v7.13.0 — already installed |
| `generate:types` script entry | `apps/api/package.json` | `"generate:types": "bash scripts/generate-types.sh"` |
| `generate-types.sh` | `apps/api/scripts/generate-types.sh` | Exists but targets wrong output path (`./client/rest.d.ts`) and includes dead GraphQL codegen — must be updated to target `../../packages/shared/src/api.ts` |
| `codegen.ts` | `apps/api/scripts/codegen.ts` | Boilerplate GraphQL artefact — DELETE this file |
| Hand-authored shared types | `packages/shared/src/todos.ts` | Correct for now but wrong pattern — DELETE after generation works |
| Scaffold re-export in API domain | `apps/api/src/modules/todos/domain/todo.types.ts` | Re-exports from `@todo-app/shared` — keep as-is, will continue working |
| Scaffold re-export in web store | `apps/web/src/features/todos/store/todos.types.ts` | Re-exports from `@todo-app/shared` — keep as-is, will continue working |
| Web coverage config | `apps/web/vite.config.mts` | `coverage.exclude` list exists but missing some scaffold files |

---

### Task 1 Detail — Web Coverage Gate Fix

The retro identified the likely cause: `vite.config.mts` `coverage.exclude` patterns do not cover all zero-coverage scaffold type files in `apps/web/src/`.

**Current exclude patterns already present:**
```
'**/*.types.ts'    ← this SHOULD already catch todos.types.ts
```

Run locally and read the coverage output carefully:
```bash
pnpm --filter @todo-app/web test:coverage
```

Look for files with `0 |  0 |  0 |  0` in the coverage table that are **not** in the exclude list. Common culprits from the boilerplate:
- `src/features/todos/store/todos.slice.ts` (if it exists)
- `src/routes/Home/index.tsx`
- Any other scaffold files in `src/features/todos/`

The existing pattern `'**/*.types.ts'` should already exclude `todos.types.ts`. If coverage is still failing, the issue may be in other files. Diagnose from the actual output — do not guess.

**Note:** `'**/*.types.ts'` is already in the exclude list. Double check it matches the actual pattern. If the file is `todos.types.ts` and the pattern is `**/*.types.ts`, it should be excluded. The real issue may be something else.

---

### Task 2 Detail — `generate-types.sh` Rewrite

**Current script (stale):**
```bash
# Targets wrong output: ./client/rest.d.ts
pnpm openapi-typescript "$SERVER_URL/api-docs/json" -o ./client/rest.d.ts
# Includes dead GraphQL codegen
pnpm graphql-codegen --config scripts/codegen.ts
```

**Required script (updated):**
```bash
#!/usr/bin/env bash
# Starts the API server, generates TypeScript types from the OpenAPI spec, then stops the server.
set -euo pipefail

SERVER_URL="http://127.0.0.1:3000"
MAX_WAIT=30  # seconds
OUTPUT="../../packages/shared/src/api.ts"

# ── Start the server in the background ──────────────────────────────────────
node --import ./src/instrumentation.ts ./src/index.ts &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

# ── Wait for the health endpoint ────────────────────────────────────────────
echo "Waiting for server to be ready…"
elapsed=0
until curl -sf "$SERVER_URL/health" > /dev/null 2>&1; do
  sleep 1
  elapsed=$((elapsed + 1))
  if [ "$elapsed" -ge "$MAX_WAIT" ]; then
    echo "Server did not become ready within ${MAX_WAIT}s" >&2
    exit 1
  fi
done
echo "Server is ready (took ${elapsed}s)"

# ── Generate REST types (OpenAPI → TypeScript) ───────────────────────────────
echo "Generating types from OpenAPI spec…"
pnpm openapi-typescript "$SERVER_URL/api-docs/json" -o "$OUTPUT"

echo "Done — types written to $OUTPUT"
```

**Script must be run from `apps/api/`** — the relative path `../../packages/shared/src/api.ts` is relative to that directory.

---

### Task 3 Detail — Understanding the Generated Output (`packages/shared/src/api.ts`)

`openapi-typescript` v7 generates a file with this shape:

```typescript
export interface paths {
  "/api/v1/todos": {
    get: {
      responses: {
        200: { content: { "application/json": components["schemas"]["TodoResponseDto"][] } };
      };
    };
  };
  // ... other paths
}

export interface components {
  schemas: {
    TodoResponseDto: {
      id: string;
      description: string;
      completed: boolean;
      createdAt: string;
      updatedAt: string;
    };
    // ... other schemas
  };
}
```

**Important:** The exact generated type names depend on the TypeBox schema names registered in Fastify. The `todoResponseDtoSchema` TypeBox object defined in Story 2.1's `dtos/todo.response.dto.ts` will appear as `TodoResponseDto` in the generated output. However, **at the time Story 1.6 runs, the todos routes do not yet exist** — only the user module routes are registered.

**This means the initial generated `api.ts` will only contain user-related schemas.** This is expected and correct. The approach for `packages/shared/src/index.ts` must account for this:

**Option A (recommended):** Keep the generated file committed as-is initially, and add a `// TODO: Todo types will appear here after Story 2.1` comment. Re-run `generate:types` after Story 2.1 completes. The index.ts should export the Todo types once they appear in the generated file.

**Option B:** Since the todos routes don't exist yet, temporarily keep a thin re-export bridge in `index.ts` that will be updated in Story 2.1 when the generated types include `TodoResponseDto`. The hand-authored `todos.ts` can be deleted at the end of Story 2.1 instead.

**Recommended approach for this story:**
1. Wire the generation pipeline and confirm it works (generates `api.ts` with user schemas)
2. Commit the initial generated file (user schemas only)
3. Update `packages/shared/src/index.ts` to import Todo-related types from `./generated/api.ts` once they exist — or leave a clear comment that Story 2.1 must complete this step
4. Keep `todos.ts` in place until Story 2.1 defines the todos route and re-runs generation

**The key deliverable of Story 1.6 is the generation pipeline itself, not the immediate deletion of `todos.ts`.** If the generated `api.ts` does not yet contain `TodoResponseDto` (because todos routes don't exist), do NOT delete `todos.ts` prematurely — that would break `@todo-app/shared` consumers.

The `packages/shared/src/index.ts` update and `todos.ts` deletion are the **final step of Story 2.1** after the todos endpoint is registered and `generate:types` is re-run.

Document this explicitly in the Completion Notes.

---

### Task 4 Detail — `packages/shared/src/index.ts` Update Strategy

Given the above, the index.ts update has two phases:

**Phase 1 (this story — Story 1.6):** Wire the pipeline; generated file only has user types.
```typescript
// packages/shared/src/index.ts
// Generated types — currently only contains user API types.
// After Story 2.1 adds todos routes, re-run `generate:types` and update this export.
export type {} from './api.ts';

// Hand-authored todo types — kept until Story 2.1 routes are registered and generation includes TodoResponseDto
export type { CreateTodoRequest, Todo, UpdateTodoRequest } from './todos.ts';
```

**Phase 2 (end of Story 2.1):** After `generate:types` is re-run with todos routes registered:
```typescript
// packages/shared/src/index.ts
// All types generated from the OpenAPI spec — single source of truth
export type { Todo, CreateTodoRequest, UpdateTodoRequest } from './api.ts';
// todos.ts deleted — do not re-add
```

Mark in this story's Completion Notes: "Phase 2 (delete todos.ts + update index.ts to use generated types exclusively) is deferred to Story 2.1."

---

### Task 6 Detail — CI Drift Detection Step

Add to `.github/workflows/release.yml` in the `ci` job. The drift check must run with the API's required env vars. Insert after `Install dependencies` and before the `Biome check` step:

```yaml
- name: Generate OpenAPI types (drift check)
  working-directory: apps/api
  run: pnpm generate:types
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/todos?sslmode=disable
    DBMATE_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/todos?sslmode=disable
    HOST: localhost
    PORT: 3000
    FRONTEND_URL: http://localhost:5173
    LOG_LEVEL: info
    NODE_ENV: test
    OTEL_SDK_DISABLED: "true"

- name: Fail if generated types are out of sync
  run: git diff --exit-code packages/shared/src/api.ts
```

**Important:** The `ci` job does NOT have a postgres service container (that's only in the `e2e` job). The `generate:types` script starts the API server which requires a DB connection. Two options:

**Option A (simpler):** Add a postgres service to the `ci` job as well (same config as `e2e` job). This is safe and ensures the drift check runs against a real server.

**Option B (avoids DB in ci):** Modify `swagger.ts` to also support a static export mode that doesn't require a running server (more complex). Not recommended.

**Use Option A.** Add the postgres service block to the `ci` job, mirroring the `e2e` job configuration. The drift check step must come after migrations run too — add a migration step before `generate:types` in `ci`.

**Alternative if postgres-in-ci feels too heavy for this story:** Skip the CI drift check in this story and note it as a follow-up. The pipeline infrastructure (script + generated file committed) is the critical path. Document this decision in Completion Notes if deferred.

---

### Pattern Violations to Prevent

| ❌ Wrong | ✅ Correct |
|---|---|
| Editing `generate-types.sh` to keep GraphQL codegen | Delete GraphQL codegen entirely — it's a boilerplate artefact, no GraphQL in this project |
| Output path `./client/rest.d.ts` | Output path `../../packages/shared/src/api.ts` |
| Deleting `todos.ts` before `generate:types` includes TodoResponseDto | Keep `todos.ts` until Story 2.1 registers todos routes and re-runs generation |
| Changing exported type names (`Todo`, `CreateTodoRequest`, `UpdateTodoRequest`) | Keep the same names — downstream consumers import them |
| Running `generate:types` without a running DB + migrated schema | The server won't start without a valid DB connection — DB must be up |
| Adding `client/` directory to the repo | The old `./client/rest.d.ts` output target created a `client/` dir that should not be committed |

---

### Boilerplate Artefacts to Clean Up

The `generate-types.sh` script references GraphQL tooling that was part of the boilerplate but is not used in this project:
- `pnpm graphql-codegen` call → **remove**
- `apps/api/scripts/codegen.ts` (GraphQL codegen config) → **delete file**
- Any `./client/` directory created by old script runs → **delete if present, add to `.gitignore`**

Check if `apps/api/client/` exists and delete it:
```bash
ls apps/api/client/ 2>/dev/null && rm -rf apps/api/client/ || echo "no client dir"
```

---

### Testing Commands

```bash
# Fix coverage gate first
pnpm --filter @todo-app/web test:coverage

# Generate types (from apps/api directory, with server env vars available)
cd apps/api && pnpm generate:types

# Verify workspace types all compile
pnpm -r type:check

# Lint + format check all workspaces
pnpm check

# API unit tests
pnpm --filter @todo-app/api test:coverage

# Architecture validation
pnpm --filter @todo-app/api deps:validate
```

### Project Structure Notes

**Modify:**
- `apps/api/scripts/generate-types.sh` — fix output path, remove GraphQL codegen
- `apps/web/vite.config.mts` — tighten `coverage.exclude` if needed
- `packages/shared/src/index.ts` — wire generated types (Phase 1 bridge)
- `.github/workflows/release.yml` — add drift detection step (if doing Option A: also add postgres service to `ci` job)

**Create:**
- `packages/shared/src/api.ts` — generated output (committed to repo)

**Delete:**
- `apps/api/scripts/codegen.ts` — GraphQL codegen artefact
- `apps/api/client/` directory — if it exists from old script runs

**Add to `.gitignore`:**
- `apps/api/.gitignore` → `coverage/` and `lcov.info`
- `apps/web/.gitignore` → `coverage/` and `lcov.info`

**Defer to Story 2.1 (do NOT do in this story unless todos routes are registered):**
- Delete `packages/shared/src/todos.ts`
- Update `packages/shared/src/index.ts` to export exclusively from generated types

### References

- [Source: epic-1-retro-2026-03-09.md#Significant Discovery — Epic Update Required] — Story 1.6 mandate and scope
- [Source: epic-1-retro-2026-03-09.md#Action Items T1, T2] — devDep hoisting (already done), coverage gitignore
- [Source: epic-1-retro-2026-03-09.md#Critical Path Before Epic 2] — ordering: coverage fix → 1.6 → epic 2
- [Source: apps/api/package.json#scripts.generate:types] — existing script entry point
- [Source: apps/api/scripts/generate-types.sh] — current script (needs update)
- [Source: apps/api/src/server/plugins/swagger.ts] — `@fastify/swagger` already registered, OpenAPI 3.1.0, `/api-docs/json` endpoint
- [Source: apps/web/vite.config.mts#test.coverage.exclude] — existing exclude patterns
- [Source: packages/shared/src/todos.ts] — hand-authored types to be superseded
- [Source: packages/shared/src/index.ts] — current re-export (needs update)
- [Source: .github/workflows/release.yml] — CI pipeline to add drift detection step
- [Source: architecture.md#Communication Patterns] — `openapi-typescript` generation is the v2+ plan; v1 uses hand-authored types — this story is the bridge

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-5)

### Debug Log References

### Completion Notes List

- ✅ Task 1 (coverage gate): Web coverage was already passing at 91.96% locally — prior chore commits (`b7c131a`, `b9c05eb`) had already resolved the CI failure. The `**/*.types.ts` exclude pattern in `vite.config.mts` correctly excludes `todos.types.ts`. No changes needed to `vite.config.mts`.
- ✅ Task 2 (script rewrite): `generate-types.sh` rewritten — output now targets `../../packages/shared/src/api.ts`, GraphQL codegen removed entirely.
- ✅ Task 3 (generation): `pnpm generate:types` ran successfully. Generated `packages/shared/src/api.ts` contains OpenAPI 3.1.0 types for current user routes (`/api/v1/users`, `/api/v1/users/{id}`, `/health`) and `ApiErrorResponse` schema. No todos routes yet — expected.
- ✅ Task 4 (index.ts): Updated to Phase 1 bridge — wires `./api.ts` (empty re-export for now) alongside existing `./todos.ts` exports. Clear inline comments document the Story 2.1 completion requirement.
- ⏳ Task 5 (todos.ts deletion): INTENTIONALLY DEFERRED to Story 2.1. The todos routes do not yet exist, so the generated `api.ts` does not contain `TodoResponseDto`. Deleting `todos.ts` now would break `@todo-app/shared` consumers. Story 2.1 must: (1) implement the todos endpoint, (2) re-run `pnpm --filter @todo-app/api generate:types`, (3) update `index.ts` to export from `./api.ts` exclusively, (4) delete `./todos.ts`.
- ✅ Task 6 (CI drift check): Added postgres service block to `ci` job (Option A). Added migration step + `generate:types` step + `git diff --exit-code packages/shared/src/api.ts` step before lint. All required env vars included.
- ✅ Task 7 (.gitignore): `coverage/` was already in root `.gitignore`. Added `lcov.info`. No per-workspace `.gitignore` files — root covers entire monorepo.
- ✅ Boilerplate cleanup: Deleted `apps/api/scripts/codegen.ts` (GraphQL codegen artefact) and `apps/api/client/` directory (old output target). Removed stale `client/rest.d.ts` and `client/graphql.ts` entries from root `.gitignore`.

### File List

- `apps/api/scripts/generate-types.sh` — rewritten: new output path, GraphQL codegen removed, port conflict guard added
- `apps/api/scripts/codegen.ts` — DELETED (GraphQL boilerplate artefact)
- `apps/api/client/` — DELETED (old output directory, contained only boilerplate artefacts)
- `packages/shared/src/api.ts` — CREATED (generated from OpenAPI spec, committed as source of truth)
- `packages/shared/src/index.ts` — updated (Phase 1 bridge: comment-only reference to api.ts, retains todos.ts until Story 2.1)
- `apps/api/src/server/plugins/swagger.ts` — updated (fixed stale boilerplate title/description to `todo-app-bmad`)
- `.github/workflows/release.yml` — updated (postgres service added to `ci` job; drift-detection steps added with `--` separator fix)
- `.gitignore` — updated (added `lcov.info`, removed stale `client/` entries)
- `biome.json` — updated (excluded `packages/shared/src/api.ts` from biome — auto-generated file)

## Senior Developer Review (AI)

**Date:** 2026-03-09
**Reviewer:** Claude Sonnet 4.6
**Outcome:** ✅ Approved (all findings resolved)

### Summary

5 findings identified (1 High, 2 Medium, 2 Low) — all fixed before approval. No deferred items.

### Action Items

| # | Severity | Finding | Resolution |
|---|---|---|---|
| 1 | 🔴 High | `export type {} from "./api.ts"` in `index.ts` was a no-op that could confuse the Story 2.1 dev agent into thinking `api.ts` was already wired for type consumption | Replaced with a comment explaining the Story 2.1 requirement |
| 2 | 🟡 Medium | `swagger.ts` still had stale boilerplate title `'fastify-boilerplate'` and description — affects the live OpenAPI spec and Swagger UI | Updated `info.title` to `'todo-app-bmad'` and description accordingly; re-ran `generate:types` to refresh `api.ts` |
| 3 | 🟡 Medium | CI `git diff --exit-code packages/shared/src/api.ts` lacked `--` separator — would produce `fatal: ambiguous argument` error if path matched a branch name | Changed to `git diff --exit-code -- packages/shared/src/api.ts`; added comment explaining the committed-file requirement |
| 4 | 🟢 Low | Auto-generated `api.ts` uses 4-space indentation (openapi-typescript default), violating project `indentWidth: 2` Biome rule — would show errors on `pnpm biome check` at root | Added `!packages/shared/src/api.ts` to root `biome.json` `files.includes` exclusion list |
| 5 | 🟢 Low | `generate-types.sh` had no guard against port 3000 already being in use — could silently generate types from a stale running server | Added pre-flight `curl` check that aborts with a clear error if port 3000 is already occupied |