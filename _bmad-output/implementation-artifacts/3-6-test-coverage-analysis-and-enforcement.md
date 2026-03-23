# Story 3.6: Test Coverage Analysis and Enforcement

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want test coverage measured and reported across both apps with a minimum 70% threshold enforced,
so that gaps in test coverage are visible and the codebase maintains a meaningful quality bar.

## Acceptance Criteria

1. **Given** unit tests exist in `apps/api`, **When** `pnpm --filter @todo-app/api test:coverage` is run, **Then** c8 generates a coverage report showing line, branch, and function coverage percentages. **And** the report is output in both a human-readable format (terminal summary) and a machine-readable format (lcov) for CI consumption. **And** the command exits with a non-zero code if any coverage dimension falls below 70%.

2. **Given** unit tests exist in `apps/web`, **When** `pnpm --filter @todo-app/web test:coverage` is run, **Then** Vitest generates a coverage report showing line, branch, and function coverage percentages. **And** the report is output in both terminal summary and lcov format. **And** the command exits with a non-zero code if any coverage dimension falls below 70%.

3. **Given** coverage is run across both apps, **When** the results are reviewed, **Then** all CQRS handlers (`create-todo`, `find-todos`, `update-todo`, `delete-todo`) have individual coverage >= 70%. **And** all frontend components (`TodoList`, `TodoItem`, `CreateTodoForm`) have individual coverage >= 70%. **And** any coverage gaps identified below the threshold are documented with a brief explanation of why (e.g. untestable bootstrap code excluded via c8 ignore comments).

4. **Given** the GitHub Actions CI pipeline runs, **When** the coverage step executes, **Then** coverage reports for both apps are generated and the pipeline fails if either app is below the 70% threshold. **And** coverage reports are uploaded as CI artifacts so they can be reviewed after the run.

## Tasks / Subtasks

- [x] Task 1: Raise backend coverage thresholds from 10% to 70% (AC: #1)
  - [x] 1.1 Update `apps/api/package.json` `test:coverage` script: change `--lines 10 --functions 10 --branches 10 --statements 10` to `--lines 70 --functions 70 --branches 70 --statements 70`
  - [x] 1.2 Run `pnpm --filter apps/api test:coverage` — check which files/handlers fall below 70%
  - [x] 1.3 If coverage fails, write missing unit tests for under-covered handlers (see Task 3)

- [x] Task 2: Raise frontend coverage thresholds from 10% to 70% (AC: #2)
  - [x] 2.1 Update `apps/web/vite.config.mts` — change `thresholds: { lines: 10, functions: 10, branches: 10, statements: 10 }` to `{ lines: 70, functions: 70, branches: 70, statements: 70 }`
  - [x] 2.2 Run `pnpm --filter @todo-app/web test:coverage` — check which files/components fall below 70%
  - [x] 2.3 If coverage fails, write missing unit tests for under-covered components (see Task 4)

- [x] Task 3: Fill backend test coverage gaps (AC: #3)
  - [x] 3.1 Run coverage and identify specific files below 70% — focus on CQRS handlers: `create-todo.handler.ts`, `find-todos.handler.ts`, `update-todo.handler.ts`, `delete-todo.handler.ts`
  - [x] 3.2 For each handler below 70%, add test cases covering: happy path, error path (not found, invalid input), edge cases (empty data, boundary values)
  - [x] 3.3 Test files MUST be co-located: `*.spec.ts` next to the source file, using `node:test` (`describe`/`it`/`assert`)
  - [x] 3.4 If infrastructure/bootstrap code (e.g. `src/index.ts`, `src/server/`, DI container setup) drags coverage below 70%, add `/* c8 ignore start */` / `/* c8 ignore stop */` comments with a brief `// reason:` comment explaining the exclusion
  - [x] 3.5 Re-run `pnpm --filter apps/api test:coverage` — confirm all thresholds pass at 70%

- [x] Task 4: Fill frontend test coverage gaps (AC: #3)
  - [x] 4.1 Run coverage and identify specific files below 70% — focus on components: `TodoList`, `TodoItem`, `CreateTodoForm`
  - [x] 4.2 For each component below 70%, add test cases covering: renders correctly, user interactions (click, submit, toggle), loading states, error states, empty states
  - [x] 4.3 Test files MUST be co-located: `*.spec.tsx` next to the component, using Vitest + Testing Library + MSW for API mocking
  - [x] 4.4 If bootstrap/config code (e.g. `main.tsx`, `AppProvider.tsx`, `routes/index.tsx`) is already excluded in the Vitest coverage config — verify exclusions are correct and sufficient
  - [x] 4.5 Re-run `pnpm --filter @todo-app/web test:coverage` — confirm all thresholds pass at 70%

- [x] Task 5: Update CI to upload coverage artifacts (AC: #4)
  - [x] 5.1 In `.github/workflows/release.yml`, after the existing "Coverage — api" and "Coverage — web" steps, add an `actions/upload-artifact@v4` step that uploads `apps/api/coverage/` and `apps/web/coverage/` directories as a single artifact named `coverage-reports`
  - [x] 5.2 The CI coverage steps already enforce thresholds via non-zero exit codes — verify they still work after the threshold change (no additional configuration needed for fail-on-threshold)

- [x] Task 6: Document coverage gaps (AC: #3)
  - [x] 6.1 After all tests pass at 70%, review the coverage report for any files with `c8 ignore` or Vitest exclude entries
  - [x] 6.2 Add a brief comment in this story's Completion Notes listing any exclusions and their rationale

## Dev Notes

### What Already Exists — DO NOT Recreate

| Item | Location | Current State |
|------|----------|---------------|
| Backend `test:coverage` script | `apps/api/package.json` | `c8 --check-coverage --lines 10 ... node --test src/**/*.spec.ts` — **change thresholds only** |
| Frontend coverage config | `apps/web/vite.config.mts` `test.coverage` block | v8 provider, reporters: text/html/lcov, thresholds at 10% — **change thresholds only** |
| CI coverage steps | `.github/workflows/release.yml` | Already runs `pnpm --filter @todo-app/api test:coverage` and `pnpm --filter @todo-app/web test:coverage` — **add artifact upload only** |
| Frontend coverage excludes | `apps/web/vite.config.mts` | Already excludes: `main.tsx`, `AppProvider.tsx`, `routes/index.tsx`, `*.types.ts`, `helpers/**`, `test/**`, `e2e/**` — verify these are sufficient |
| Backend test runner | `node:test` | Uses `describe`/`it`/`assert` from `node:test`. NOT Vitest. Co-located `*.spec.ts` files |
| Frontend test runner | Vitest 4.0.18 + Testing Library | Globals enabled (`describe`, `it`, `expect`, `vi` without imports). Co-located `*.spec.tsx` files |
| API mocking (frontend) | MSW 2.12.10 + @mswjs/data | Handlers in `src/test/`. Never mock fetch directly. |

### Backend Testing Patterns — MUST Follow

- Test runner: `node:test` — import `{ describe, it, before, after, mock }` from `node:test` and `assert` from `node:assert/strict`
- **NOT Vitest** — do not use `expect()`, `vi.fn()`, or any Vitest API in `apps/api`
- Co-locate test files: `create-todo.handler.spec.ts` next to `create-todo.handler.ts`
- Backend tests are unit/integration tests that test handlers directly — they do NOT require a running Fastify server (that's what E2E Cucumber tests are for)
- Use `#src/*` and `#tests/*` path aliases (Node subpath imports defined in `package.json`, not tsconfig)
- ESM imports require `.ts` extension: `import { foo } from './bar.ts'`
- No `console.log` in tests — use `assert` for assertions

### Frontend Testing Patterns — MUST Follow

- Test runner: Vitest 4.0.18 with globals enabled
- Rendering: `@testing-library/react` — `render()`, `screen`, `fireEvent`, `waitFor`
- API mocking: MSW handlers from `src/test/` — never mock fetch/axios directly
- Use typed hooks in tests: `useAppDispatch`, `useAppSelector` — same as production code
- Path alias: `@/` maps to `src/`
- File suffix: `*.spec.tsx` for component tests, `*.spec.ts` for non-component tests

### c8 Configuration Details (Backend)

The c8 config is entirely inline in the `test:coverage` script. There is no `.c8rc` file. The current script:

```
c8 --check-coverage --lines 10 --functions 10 --branches 10 --statements 10 --reporter=text --reporter=lcov node --test src/**/*.spec.ts
```

Change to:

```
c8 --check-coverage --lines 70 --functions 70 --branches 70 --statements 70 --reporter=text --reporter=lcov node --test src/**/*.spec.ts
```

No other c8 changes are needed. The `--check-coverage` flag already causes non-zero exit on threshold failure.

### Vitest Coverage Configuration Details (Frontend)

In `apps/web/vite.config.mts`, the `test.coverage` block:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'lcov'],
  thresholds: {
    lines: 10,      // → change to 70
    functions: 10,   // → change to 70
    branches: 10,    // → change to 70
    statements: 10,  // → change to 70
  },
  exclude: [
    // ... existing excludes — do not modify
  ],
}
```

Change only the four threshold values. Do not modify the exclude list, provider, or reporters.

### CI Artifact Upload Pattern

Add after existing coverage steps in `.github/workflows/release.yml`:

```yaml
- name: Upload coverage reports
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: coverage-reports
    path: |
      apps/api/coverage/
      apps/web/coverage/
    retention-days: 14
```

Use `if: always()` so artifacts are uploaded even when coverage thresholds fail — this lets developers review the report to understand what's below threshold.

### Previous Story Learnings (Story 3.5 — Docker Containerisation)

- Story 3.5 fixed several pre-existing TS/lint regressions in the web package. These are already resolved — do not re-fix them.
- The `apps/web/tsconfig.app.json` was updated to exclude spec/test files from the production Vite bundle. This is already done.
- No source code in `apps/api/src/` or `apps/web/src/` was changed in Story 3.5 (infrastructure only). Coverage baselines should reflect Stories 3.1–3.4 work.

### Git Intelligence

Recent commits are mostly infrastructure (Docker, BMad tooling). The last feature work was Stories 3.1–3.4 which implemented:
- `update-todo` handler + tests (3.1)
- `delete-todo` handler + tests (3.2)
- Complete/delete UI + TodoItem component + tests (3.3)
- Mobile responsive layout (3.4, no new tests expected)

All four CQRS handlers have existing spec files from their respective stories. The question is whether they meet 70%.

### What This Story is NOT

- NOT about writing E2E tests — E2E (Cucumber) tests already exist from earlier stories and are not measured by c8/Vitest coverage
- NOT about changing test infrastructure or runners — keep node:test for backend, Vitest for frontend
- NOT about adding new features or changing application code — only tests and configuration
- NOT about load testing (k6) — that's separate from coverage

### Project Structure Notes

Files to modify:
- `apps/api/package.json` — update threshold values in `test:coverage` script
- `apps/web/vite.config.mts` — update threshold values in coverage config
- `.github/workflows/release.yml` — add artifact upload step

Files potentially created (new tests to fill gaps):
- `apps/api/src/modules/todos/**/*.spec.ts` — additional backend handler test cases
- `apps/web/src/features/todos/components/**/*.spec.tsx` — additional frontend component test cases

No changes to: application source code, database, Docker, shared package, or E2E tests.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.6: Test Coverage Analysis and Enforcement]
- [Source: _bmad-output/planning-artifacts/architecture.md — Testing strategy, CI/CD section]
- [Source: _bmad-output/planning-artifacts/prd.md — NFR20-NFR22: Testability requirements]
- [Source: _bmad-output/project-context.md — Testing Rules section]
- [Source: apps/api/package.json — Current test:coverage script with c8 at 10%]
- [Source: apps/web/vite.config.mts — Current Vitest coverage config with thresholds at 10%]
- [Source: .github/workflows/release.yml — Current CI coverage steps without artifact upload]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Frontend tests initially failed with import resolution errors — `vite-tsconfig-paths` only resolves aliases for files included in `tsconfig.app.json`, but spec files are excluded from it. Fixed by adding an explicit `resolve.alias` for `@` in `vite.config.mts`.

### Completion Notes List

- **Task 1–2:** Raised coverage thresholds from 10% to 70% in both `apps/api/package.json` (c8 flags) and `apps/web/vite.config.mts` (Vitest thresholds). Updated stale comments referencing "Story 3.7" to "Story 3.6".
- **Task 3:** Backend coverage already at 95.66% statements / 98.95% branches / 81.57% functions / 95.66% lines. All four CQRS handlers (create-todo, find-todos, update-todo, delete-todo) at 100% coverage. No additional tests needed. No `c8 ignore` comments were added.
- **Task 4:** Frontend coverage at 93.42% statements / 93.93% branches / 88.46% functions / 93.79% lines. All three todo components (TodoList, TodoItem, CreateTodoForm) at 100% coverage. Fixed test import resolution by adding `resolve.alias` to `vite.config.mts`. No new tests needed — existing tests already exceed 70%.
- **Task 5:** Added `actions/upload-artifact@v4` step to CI workflow with `if: always()` so coverage reports are uploaded even on threshold failure. Artifact named `coverage-reports`, retained for 14 days.
- **Task 6 — Coverage exclusions:**
  - **Backend (c8):** No `c8 ignore` comments exist. Infrastructure code (`src/index.ts`, `src/server/`, DI container) is not measured by c8 because only `src/**/*.spec.ts` files (and their imports) are included in the test run — c8 only measures code loaded during test execution.
  - **Frontend (Vitest):** Pre-existing exclusions in `vite.config.mts` cover bootstrap/config files: `main.tsx`, `AppProvider.tsx`, `routes/index.tsx`, `*.types.ts`, `helpers/**`, `test/**`, `e2e/**`. These exclusions are correct — they represent framework bootstrapping, type-only files, and test infrastructure that cannot be meaningfully unit-tested.

### File List

- `apps/api/package.json` — updated c8 thresholds from 10% to 70%
- `apps/web/vite.config.mts` — updated Vitest thresholds from 10% to 70%, added `resolve.alias` for `@`, updated stale comment
- `.github/workflows/release.yml` — added coverage artifact upload step, updated comment
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status updated to review
- `_bmad-output/implementation-artifacts/3-6-test-coverage-analysis-and-enforcement.md` — story file updated

### Change Log

- 2026-03-23: Implemented Story 3.6 — raised coverage thresholds to 70% for both apps, fixed frontend test import resolution, added CI coverage artifact upload. All 47 tests pass (17 backend + 30 frontend). Backend: 95.66% / 98.95% / 81.57% / 95.66%. Frontend: 93.42% / 93.93% / 88.46% / 93.79%.
