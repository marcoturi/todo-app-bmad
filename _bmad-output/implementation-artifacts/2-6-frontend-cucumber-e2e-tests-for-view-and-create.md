# Story 2.6: Frontend Cucumber E2E Tests for View and Create

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want Cucumber + Playwright E2E tests covering the view and create todo user journeys,
so that the full frontend experience is validated in a real browser against the live stack.

## Acceptance Criteria

1. **Given** the Cucumber + Playwright E2E suite is configured in `apps/web/cucumber.mjs`, **When** `e2e/features/todos/todos.feature` is created, **Then** it contains scenarios: empty state is shown on first load, user can add a new todo and it appears in the list, newly added todo persists after page reload.

2. **Given** `e2e/steps/todos/todos.steps.ts` contains Playwright step definitions, **When** the E2E suite runs against the live app (frontend + backend + DB), **Then** all scenarios pass with zero failures.

3. **Given** the CI pipeline runs, **When** the web E2E step executes (`pnpm --filter @todo-app/web test:e2e`), **Then** all Cucumber/Playwright scenarios pass and the pipeline does not fail on flaky tests.

## Tasks / Subtasks

- [x] Task 1: Audit existing E2E infrastructure (AC: #1, #2)
  - [x] 1.1 Review `apps/web/e2e/features/todos/create-todo.feature` — confirm 3 creating scenarios exist with live stack
  - [x] 1.2 Review `apps/web/e2e/features/todo-list.feature` — confirm 5 mock-based scenarios exist (loading, empty, list order, strikethrough, error)
  - [x] 1.3 Review `apps/web/e2e/steps/todos/create-todo.steps.ts` — confirm all steps align with create-todo.feature
  - [x] 1.4 Review `apps/web/e2e/steps/todo-list.steps.ts` — confirm all steps align with todo-list.feature
  - [x] 1.5 Review `apps/web/e2e/page-objects/TodoPage.ts` — confirm selectors match actual rendered `data-testid` attributes
  - [x] 1.6 Review `apps/web/e2e/support/common-hooks.ts` — confirm Before/After hooks create fresh browser context per scenario

- [x] Task 2: Create `e2e/features/todos/todos.feature` (AC: #1)
  - [x] 2.1 Create the file with `@todos` tag on the feature
  - [x] 2.2 Add Scenario 1: "Empty state is shown on first load" — uses the existing `page.route` mock approach (same pattern as `todo-list.feature`)
  - [x] 2.3 Add Scenario 2: "User can add a new todo and it appears in the list" — live stack, reuses steps from `create-todo.steps.ts`
  - [x] 2.4 Add Scenario 3: "Newly added todo persists after page reload" — live stack, requires the new "reload" step from Task 3

- [x] Task 3: Create `e2e/steps/todos/todos.steps.ts` (AC: #2)
  - [x] 3.1 Add ONLY the new step `When the user reloads the page` — do NOT duplicate steps already defined in `create-todo.steps.ts` or `todo-list.steps.ts`
  - [x] 3.2 The reload step must wait for the todo list to stabilise (`waitForSelector` on `[data-testid="todo-list"]`) before returning

- [x] Task 4: Run E2E suite locally against live stack and resolve any failures (AC: #2, #3)
  - [x] 4.1 Start Postgres: `docker compose up postgres -d` (from monorepo root)
  - [x] 4.2 Apply migrations: `pnpm --filter @todo-app/api db:migrate` (from monorepo root)
  - [x] 4.3 Start API server: `pnpm --filter @todo-app/api start` (in separate terminal)
  - [x] 4.4 Start frontend dev server: `pnpm --filter @todo-app/web dev` (in separate terminal)
  - [x] 4.5 Run full E2E suite: `pnpm --filter @todo-app/web test:e2e` (from monorepo root)
  - [x] 4.6 Confirm all scenarios pass — including the new `todos.feature` scenarios
  - [x] 4.7 Fix any failures — see Dev Notes for known failure patterns

- [x] Task 5: Verify CI pipeline configuration (AC: #3)
  - [x] 5.1 Review `.github/workflows/release.yml` — confirm the `e2e` job already includes the `pnpm --filter @todo-app/web test:e2e` step
  - [x] 5.2 Confirm CI starts the API and frontend dev servers before running web E2E (see the "Start API server", "Wait for API server", "Start frontend dev server" steps)
  - [x] 5.3 Confirm `SERVER_URL=http://localhost:5173` ENV is used by `cucumber.mjs` via `worldParameters`

## Dev Notes

### What Already Exists — DO NOT Recreate

| Item | Location | Status |
|---|---|---|
| `create-todo.feature` — 3 live stack creating scenarios | `apps/web/e2e/features/todos/create-todo.feature` | ✅ from Story 2.4 |
| `create-todo.steps.ts` — step defs for create feature | `apps/web/e2e/steps/todos/create-todo.steps.ts` | ✅ from Story 2.4 |
| `todo-list.feature` — 5 mock-based list scenarios | `apps/web/e2e/features/todo-list.feature` | ✅ from Story 2.3 |
| `todo-list.steps.ts` — step defs using `page.route` mocking | `apps/web/e2e/steps/todo-list.steps.ts` | ✅ from Story 2.3 |
| `TodoPage` page object — wraps create-todo interactions | `apps/web/e2e/page-objects/TodoPage.ts` | ✅ from Story 2.4 |
| `TodoListPage` page object — wraps mock-based list interactions | `apps/web/e2e/page-objects/todo-list.page.ts` | ✅ from Story 2.3 |
| `common-hooks.ts` — Before (new browser ctx) / After (close ctx) | `apps/web/e2e/support/common-hooks.ts` | ✅ from boilerplate |
| `custom-world.ts` — `ICustomWorld` with `page`, `context`, `parameters` | `apps/web/e2e/support/custom-world.ts` | ✅ from boilerplate |
| `config.ts` — `browser` + `browserOptions` | `apps/web/e2e/support/config.ts` | ✅ from boilerplate |
| `cucumber.mjs` — runner with `require: ['e2e/**/*.ts']`, `paths: ['e2e/**/*.feature']` | `apps/web/cucumber.mjs` | ✅ from boilerplate |
| CI pipeline — `e2e` job starts API + frontend + runs `test:e2e` | `.github/workflows/release.yml` | ✅ from Story 1.4 |

**The primary job of this story is:** add `todos.feature` (3 cross-cutting user journey scenarios) + the single missing "reload" step, then verify everything passes locally and is covered by CI.

---

### Critical Pattern: How the Frontend E2E Suite Runs

The Cucumber + Playwright suite in `apps/web`:

- `cucumber.mjs` uses `ts-node/register` and loads `requireModule: ['ts-node/register']`
- The runner picks up ALL files matching `e2e/**/*.ts` as step definitions and `e2e/**/*.feature` as feature files
- **All step definitions are shared globally** — Cucumber registers them all. Do NOT define the same step pattern in two files.
- Each scenario gets a **fresh browser context and page** created by the `Before` hook in `common-hooks.ts`
- The `SERVER_URL` is provided via `worldParameters` from `cucumber.mjs` → `this.parameters.SERVER_URL`
- The `test:e2e` script (no `--parallel`) runs scenarios sequentially; the `e2e` script uses `--parallel 5`

**Run order per scenario:**
1. `common-hooks.ts` Before → `browser.newContext()` → `context.newPage()` → `this.page` is fresh
2. Scenario steps execute (step defs from across all `e2e/**/*.ts` files)
3. `common-hooks.ts` After → `page.close()` → `context.close()`

**No DB cleanup between scenarios.** The live stack tests assume the DB may contain existing todos from prior test runs. Write assertions that tolerate dirty state (e.g. `toBeVisible()` on a specific description rather than asserting exact list count).

---

### Critical Pattern: Existing Step Definitions Available Without Import

Since `require: ['e2e/**/*.ts']` loads all files, these steps are ALREADY available to `todos.feature` without any additional definition:

**From `create-todo.steps.ts`:**
- `Given('the user navigates to the home page', ...)` — creates `TodoPage`, navigates, waits for list
- `When('the user types {string} in the todo input', ...)` — fills `[data-testid="create-todo-input"]`
- `When('the user submits the create todo form', ...)` — clicks `[data-testid="create-todo-submit"]`, waits networkidle
- `Then('the todo list contains {string}', ...)` — uses `this.page!.locator('[data-testid="todo-description"]').filter({ hasText })`
- `Then('the todo input is empty', ...)`
- `Then('a validation error is displayed', ...)`
- `Then('no new todo is added to the list', ...)`

**From `todo-list.steps.ts`:**
- `Given('the API returns an empty todo list', ...)` — creates `TodoListPage`, registers `page.route('**/api/v1/todos', ...)` returning `[]`
- `When('I visit the home page', ...)` — calls `todoListPage.goto()`
- `Then('I see the empty state message', ...)` — checks `[data-testid="todo-list-empty"]`
- `Then('I see the loading indicator', ...)`
- `Then('I see {int} todos in the list', ...)`
- ... and others

---

### New Files to Create

#### `apps/web/e2e/features/todos/todos.feature`

```gherkin
@todos
Feature: Todo User Journeys

  Scenario: Empty state is shown on first load
    Given the API returns an empty todo list
    When I visit the home page
    Then I see the empty state message

  Scenario: User can add a new todo and it appears in the list
    Given the user navigates to the home page
    When the user types "Buy groceries" in the todo input
    And the user submits the create todo form
    Then the todo list contains "Buy groceries"

  Scenario: Newly added todo persists after page reload
    Given the user navigates to the home page
    When the user types "Walk the dog" in the todo input
    And the user submits the create todo form
    And the user reloads the page
    Then the todo list contains "Walk the dog"
```

#### `apps/web/e2e/steps/todos/todos.steps.ts`

```typescript
import { When } from '@cucumber/cucumber';
import type { ICustomWorld } from '../../support/custom-world';

When('the user reloads the page', async function (this: ICustomWorld) {
  await this.page!.reload();
  await this.page!.waitForSelector(
    '[data-testid="todo-list"], [data-testid="todo-list-empty"]',
  );
  await this.page!.waitForLoadState('networkidle');
});
```

---

### Critical Pattern: data-testid Selectors

These are the `data-testid` attributes the E2E tests depend on. Verify they exist in the rendered DOM before running:

| Selector | Component | Description |
|---|---|---|
| `[data-testid="todo-list"]` | `TodoList` | Rendered when todos exist |
| `[data-testid="todo-list-empty"]` | `TodoList` | Rendered when list is empty |
| `[data-testid="todo-list-loading"]` | `TodoList` | Rendered while fetching |
| `[data-testid="todo-list-error"]` | `TodoList` | Rendered on API error |
| `[data-testid="todo-item"]` | `TodoItem` | Each todo row wrapper |
| `[data-testid="todo-description"]` | `TodoItem` | The description text span |
| `[data-testid="create-todo-input"]` | `CreateTodoForm` | The text input |
| `[data-testid="create-todo-submit"]` | `CreateTodoForm` | The submit button |
| `[data-testid="create-todo-validation-error"]` | `CreateTodoForm` | Validation error message |

---

### Critical Pattern: Required Environment Variables for Local Test Run

The frontend connects to the backend using `VITE_API_URL`. For E2E to work against the live stack:

```
# apps/web/.env
VITE_API_URL=http://localhost:3000

# apps/api/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/todos?sslmode=disable
DBMATE_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/todos?sslmode=disable
HOST=localhost
PORT=3000
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=info
NODE_ENV=development
```

The E2E command passes `SERVER_URL=http://localhost:5173` as world parameter via `cucumber.mjs`.

---

### Critical Pattern: Dirty DB Tolerance

Because there is no `DELETE /api/v1/todos` yet (Story 3.2), the DB cannot be cleaned between scenario runs. The test design for live stack scenarios uses **existence checks**, not **exact count checks**:

- ✅ `Then the todo list contains "Buy groceries"` — checks for presence with `toBeVisible()`
- ✅ `Then the todo list contains "Walk the dog"` — same
- ❌ Do NOT assert `I see 1 todo in the list` for live stack tests (count depends on prior runs)

The "empty state" scenario uses Playwright route mocking (`page.route`) so it never actually queries the DB — that scenario always gets an empty response regardless of DB state.

---

### Critical Pattern: Step De-duplication

**NEVER redefine a step that already exists in another file.** Cucumber loads all `e2e/**/*.ts` files globally. Adding a duplicate step pattern causes the runner to throw:

```
Error: Multiple step definitions match:
  "the user navigates to the home page" ...
```

The only new step required is `When the user reloads the page`. Everything else reuses existing definitions.

---

### Architecture Compliance Notes

- **File placements:** New files go in `e2e/features/todos/` (feature files) and `e2e/steps/todos/` (step definitions) — consistent with the existing convention in this project
- **TypeScript:** `e2e/tsconfig.e2e.json` covers E2E TypeScript compilation. Run with `TS_NODE_PROJECT=./e2e/tsconfig.e2e.json` (already set in `test:e2e` script)
- **Biome:** `apps/web/biome.json` covers all source including `e2e/`. Run `pnpm check` after changes
- **No new packages:** All required packages (Cucumber, Playwright, `@cucumber/cucumber`, `@playwright/test`) are already installed in `apps/web`

### Source References

- [Epics: Story 2.6 AC](../../planning-artifacts/epics.md#story-26-frontend-cucumber-e2e-tests-for-view-and-create)
- [Architecture: Frontend E2E test placement](../../planning-artifacts/architecture.md#test-file-placement)
- [Project Context: Frontend testing rules](../../project-context.md#testing-rules)
- [Existing create-todo steps](../../../apps/web/e2e/steps/todos/create-todo.steps.ts)
- [Existing todo-list steps](../../../apps/web/e2e/steps/todo-list.steps.ts)
- [CI pipeline web E2E job](../../../.github/workflows/release.yml)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created
- Task 1: Audited all existing E2E infrastructure — all files present and aligned with story specs
- Task 2: Created `apps/web/e2e/features/todos/todos.feature` with `@todos` tag and 3 cross-cutting user journey scenarios
- Task 3: Created `apps/web/e2e/steps/todos/todos.steps.ts` with only the new `When the user reloads the page` step (no duplications)
- Task 4: Fixed pre-existing dirty-DB `strict mode violation` in `create-todo.steps.ts` `Then the todo list contains` step; all 11 scenarios (5+3+3) pass with 42 steps
- Task 5: CI pipeline confirmed — `pnpm --filter @todo-app/web test:e2e` present, API+frontend servers started before run, `SERVER_URL` baked into `test:e2e` script
- Biome linting: passed on all new/modified files after auto-format
- **Code Review (2026-03-10):** Fixed H1 false-positive risk — replaced `.first()` workaround with `initialDescriptionCounts` baseline Map + `toPass()`-wrapped count-comparison, proving a NEW item was added not just a stale DB entry found. Fixed M2 — added `initialDescriptionCounts.clear()` reinit per scenario in Given step + parallel-warning comment. Fixed M1 — added `TodoPage.ts` to File List (Biome whitespace). All 11 E2E scenarios still pass.

### File List

- `apps/web/e2e/features/todos/todos.feature` (created)
- `apps/web/e2e/steps/todos/todos.steps.ts` (created)
- `apps/web/e2e/steps/todos/create-todo.steps.ts` (modified — added `initialDescriptionCounts` baseline tracking and count-comparison `Then the todo list contains` fix; parallel-warning comment added)
- `apps/web/e2e/page-objects/TodoPage.ts` (modified — Biome auto-format whitespace: `  ) { }` → `  ) {}`)

## Change Log

| Date | Change |
|---|---|
| 2026-03-10 | Story implemented — created `todos.feature` (3 cross-cutting user journey scenarios), created `todos.steps.ts` (single `When the user reloads the page` step), fixed dirty-DB strict mode violation in `create-todo.steps.ts`. All 11 E2E scenarios pass (42 steps). |
| 2026-03-10 | Code review fixes — replaced `.first()` false-positive workaround with `initialDescriptionCounts` count-comparison in `create-todo.steps.ts`; added `TodoPage.ts` to File List; added parallel-warning comment to module-level state. |
