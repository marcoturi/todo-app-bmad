# Story 3.3: Complete and Delete Todo UI

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Alex (the user),
I want to mark a todo as complete and delete todos I no longer need,
so that I can manage the full lifecycle of my tasks.

## Acceptance Criteria

1. **Given** the RTK Query todos API slice is updated in `src/features/todos/store/todos.api.ts`, **When** the `updateTodo` and `deleteTodo` mutations are added, **Then** `updateTodo` calls `PATCH /api/v1/todos/:id` with body `{ completed: boolean }` and invalidates the `['Todo']` tag. **And** `deleteTodo` calls `DELETE /api/v1/todos/:id` and invalidates the `['Todo']` tag. **And** `useUpdateTodoMutation` and `useDeleteTodoMutation` are exported from the file.

2. **Given** `src/features/todos/hooks/useTodos.ts` is updated, **When** it runs, **Then** it calls and returns `updateTodo` and `deleteTodo` mutation results (alongside all existing exports — no regressions).

3. **Given** an active todo is displayed in the list, **When** the user clicks the completion toggle (checkbox-style button), **Then** the `updateTodo` mutation is dispatched with `{ completed: true }`. **And** after the mutation resolves, the todo visually shows as completed (strikethrough text, muted colour, checked visual indicator). **And** the toggle is disabled while the mutation is loading.

4. **Given** a completed todo is displayed in the list, **When** the user clicks the completion toggle, **Then** the `updateTodo` mutation is dispatched with `{ completed: false }`. **And** after the mutation resolves, the todo visually shows as active (no strikethrough, normal colour, unchecked indicator).

5. **Given** a todo is displayed, **When** the user clicks the delete button, **Then** the `deleteTodo` mutation is dispatched. **And** after the mutation resolves, the todo is removed from the list (list is re-fetched via tag invalidation). **And** the delete button is disabled while the mutation is loading.

6. **Given** the `updateTodo` mutation returns an error, **When** `TodoItem` renders with `isError: true`, **Then** a user-visible error message is shown inline within the item: `"Failed to update task. Please try again."`. **And** the todo's completion state in the list is unchanged. **And** the error has a dismiss button that calls `reset()` to clear the error state.

7. **Given** the `deleteTodo` mutation returns an error, **When** `TodoItem` renders with `isError: true`, **Then** a user-visible error message is shown inline: `"Failed to delete task. Please try again."`. **And** the todo remains visible in the list. **And** the error has a dismiss button that calls `reset()`.

8. **Given** `TodoItem.spec.tsx` is created, **When** it runs under Vitest + Testing Library with MSW, **Then** tests cover: toggle complete, toggle incomplete, delete, update error (dismissible), delete error (dismissible) — all passing.

9. **Given** `e2e/features/todos/todos.feature` is updated with new Playwright scenarios, **When** `pnpm --filter @todo-app/web test:e2e` runs against the live stack, **Then** scenarios pass covering: complete a todo (toggle to done), uncomplete a todo (toggle back to active), and delete a todo. **And** `e2e/steps/todos/todos.steps.ts` and `e2e/page-objects/TodoPage.ts` are extended with definitions for toggle and delete interactions. **And** all existing scenarios from Stories 2.3, 2.4, 2.6 continue to pass — zero regressions.

## Tasks / Subtasks

- [x] Task 1: Add `updateTodo` and `deleteTodo` mutations to `src/features/todos/store/todos.api.ts` (AC: #1)
  - [x] 1.1 Import `UpdateTodoRequest` from `@todo-app/shared` (alongside existing `CreateTodoRequest`, `Todo`)
  - [x] 1.2 Add `updateTodo` mutation: `PATCH /api/v1/todos/:id` — query shape `{ url: \`api/v1/todos/${id}\`, method: 'PATCH', body }`, returns `Todo`, invalidates tag `['Todo']`
  - [x] 1.3 Add `deleteTodo` mutation: `DELETE /api/v1/todos/:id` — query shape `{ url: \`api/v1/todos/${id}\`, method: 'DELETE' }`, returns `void`, invalidates tag `['Todo']`
  - [x] 1.4 Export `useUpdateTodoMutation` and `useDeleteTodoMutation` from the destructured `todosApi` export line

- [x] Task 2: Update `src/features/todos/hooks/useTodos.ts` to expose update/delete mutations (AC: #2)
  - [x] 2.1 Call `todosApi.useUpdateTodoMutation()` and capture `[updateTodo, updateTodoState]`
  - [x] 2.2 Call `todosApi.useDeleteTodoMutation()` and capture `[deleteTodo, deleteTodoState]`
  - [x] 2.3 Return `updateTodo`, `isUpdating`, `isUpdateError`, `updateTodoReset`, `deleteTodo`, `isDeleting`, `isDeleteError`, `deleteTodoReset` alongside all existing exports (no regressions)

- [x] Task 3: Refactor `src/features/todos/components/TodoItem.tsx` to be interactive (AC: #3–7)
  - [x] 3.1 Import `useUpdateTodoMutation` and `useDeleteTodoMutation` from `@/features/todos/store/todos.api` (call hooks directly inside the component for per-item mutation state isolation)
  - [x] 3.2 Replace the read-only completion indicator `<span>` with an interactive `<button>` (role="checkbox", aria-checked, aria-label, data-testid="todo-toggle-checkbox") that calls `updateTodo({ id: todo.id, completed: !todo.completed })` on click
  - [x] 3.3 Add a delete `<button>` (aria-label=`"Delete: ${todo.description}"`, data-testid="todo-delete-button") that calls `deleteTodo({ id: todo.id })` on click
  - [x] 3.4 Disable both buttons while their respective mutation is loading (`isUpdating` / `isDeleting`)
  - [x] 3.5 Add inline update error block after the `<li>` content: rendered when `isUpdateError === true`, data-testid="todo-update-error", role="alert", text "Failed to update task. Please try again.", with a Dismiss button (`aria-label="Dismiss update error"`) that calls `resetUpdate()`
  - [x] 3.6 Add inline delete error block: rendered when `isDeleteError === true`, data-testid="todo-delete-error", role="alert", text "Failed to delete task. Please try again.", with a Dismiss button (`aria-label="Dismiss delete error"`) that calls `resetDelete()`
  - [x] 3.7 Use `cn()` from `@/shared/helpers/style.utils` for all conditional Tailwind class merging — no inline styles
  - [x] 3.8 Keep existing `data-testid="todo-item"`, `data-testid="todo-description"`, and `aria-label` on `<li>` — no regressions

- [x] Task 4: Add MSW handlers for PATCH and DELETE to `src/test/handlers/todos.ts` (AC: #8)
  - [x] 4.1 Add `http.patch(\`${config.API_URL}/api/v1/todos/:id\`, ...)` handler — intercepts the id from params, returns updated todo with `completed` toggled from the mock list (or hardcodes a sensible response)
  - [x] 4.2 Add `http.delete(\`${config.API_URL}/api/v1/todos/:id\`, ...)` handler — returns `HttpResponse.json(null, { status: 200 })` (empty body 200)
  - [x] 4.3 Export these handlers as part of `todosHandlers` array (used by `vitest.setup` MSW server)

- [x] Task 5: Create `src/features/todos/components/TodoItem.spec.tsx` (AC: #8)
  - [x] 5.1 Import: `screen`, `waitFor` from `@testing-library/react`; `userEvent` from `@testing-library/user-event`; `HttpResponse`, `http` from `msw`; `todosApi` from `@/features/todos/store/todos.api`; `renderWithProviders`, `setupStore` from `@/shared/store/test`; `config` from `@/test/config`; `todoMockList` from `@/test/handlers/todos`; `server` from `../../../../scripts/vitest.setup`; `TodoItem` from `./TodoItem`
  - [x] 5.2 Test helper: pre-seed the cache with `store.dispatch(todosApi.util.upsertQueryData('getTodos', undefined, todoMockList))` and pass `store` to `renderWithProviders` — render `<TodoItem todo={todoMockList[0]} />` (active) and `<TodoItem todo={todoMockList[1]} />` (completed)
  - [x] 5.3 Test "toggles todo to complete": click `[data-testid="todo-toggle-checkbox"]` on active item; `waitFor` that the checkbox has `aria-checked="true"` (or strikethrough appears — depends on RTK Query re-fetch settling); verify 200 response from MSW
  - [x] 5.4 Test "toggles todo back to incomplete": preload completed item; click toggle; verify `aria-checked="false"` after re-fetch
  - [x] 5.5 Test "deletes a todo": click `[data-testid="todo-delete-button"]`; `waitFor` that the item is no longer in the DOM (list re-fetch returns empty or smaller list)
  - [x] 5.6 Test "shows update error and dismisses": `server.use(http.patch(\`${config.API_URL}/api/v1/todos/:id\`, () => HttpResponse.json({...}, { status: 500 })))`; click toggle; `waitFor` that `[data-testid="todo-update-error"]` is in the document; click Dismiss (`aria-label="Dismiss update error"`); `waitFor` that error is gone
  - [x] 5.7 Test "shows delete error and dismisses": `server.use(http.delete(...))` return 500; click delete; `waitFor` `[data-testid="todo-delete-error"]`; click Dismiss; verify error gone and item still present

- [x] Task 6: Extend E2E page object `e2e/page-objects/TodoPage.ts` (AC: #9)
  - [x] 6.1 Add `async toggleTodo(description: string): Promise<void>` — clicks `[data-testid="todo-toggle-checkbox"]` within the `[data-testid="todo-item"]` that contains the given description
  - [x] 6.2 Add `async deleteTodo(description: string): Promise<void>` — clicks `[data-testid="todo-delete-button"]` within the `[data-testid="todo-item"]` that contains the given description; then `waitForLoadState('networkidle')`
  - [x] 6.3 Add `async isTodoCompleted(description: string): Promise<boolean>` — returns whether the description `<span>` inside the matching item has class `line-through`

- [x] Task 7: Add E2E scenarios to `e2e/features/todos/todos.feature` (AC: #9)
  - [x] 7.1 Add scenario: "User can complete a todo" — Given user navigates home, adds "Buy groceries", submits, When user toggles "Buy groceries", Then "Buy groceries" shows as completed (strikethrough)
  - [x] 7.2 Add scenario: "User can uncomplete a completed todo" — navigate, add, toggle to complete, toggle again, verify active state
  - [x] 7.3 Add scenario: "User can delete a todo" — navigate, add "Buy groceries", submit, Then delete "Buy groceries", Then "Buy groceries" is not in the list

- [x] Task 8: Add step definitions to `e2e/steps/todos/todos.steps.ts` (AC: #9)
  - [x] 8.1 `When 'the user completes the todo {string}'` — calls `todoPage.toggleTodo(description)`; `await this.page!.waitForLoadState('networkidle')`
  - [x] 8.2 `When 'the user deletes the todo {string}'` — calls `todoPage.deleteTodo(description)`
  - [x] 8.3 `Then 'the todo {string} is shown as completed'` — assert `isTodoCompleted(description)` returns `true`; also verify `aria-checked="true"` on toggle button
  - [x] 8.4 `Then 'the todo {string} is not in the list'` — assert `page.locator('[data-testid="todo-description"]').filter({ hasText: description }).count()` equals 0

- [x] Task 9: Run and verify locally (AC: #8, #9)
  - [x] 9.1 Run `pnpm --filter @todo-app/web test` — all unit tests pass (new + existing)
  - [x] 9.2 Start full stack (`docker compose up postgres -d`, run API, run web), run `pnpm --filter @todo-app/web test:e2e` — all scenarios pass including previously existing scenarios
  - [x] 9.3 Run `pnpm --filter @todo-app/web check` — zero Biome violations

## Dev Notes

### What Already Exists — DO NOT Recreate

| Item | Location | Notes |
| ---- | -------- | ----- |
| `Todo`, `CreateTodoRequest`, `UpdateTodoRequest` types | `@todo-app/shared` | `UpdateTodoRequest = { completed: boolean }` — do NOT redefine inline |
| `todos.api.ts` base API slice | `src/features/todos/store/todos.api.ts` | Has `getTodos` (query) + `createTodo` (mutation) — **extend** with `updateTodo`+`deleteTodo`, do NOT rewrite the file |
| `useTodos.ts` hook | `src/features/todos/hooks/useTodos.ts` | Returns `todos`, `isLoading`, `isFetching`, `isError`, `error`, `refetch`, `createTodo`, `isCreating`, `isCreateError`, `createError`, `createTodoReset` — **extend**, do NOT break existing return shape |
| `TodoItem.tsx` stub | `src/features/todos/components/TodoItem.tsx` | Already has read-only completion indicator with comment `// actions added in Story 3.3` — **refactor** this file |
| `TodoList.tsx` | `src/features/todos/components/TodoList.tsx` | Passes `todo` prop to `<TodoItem>` — no changes needed; keep `data-testid="todo-list"`, `data-testid="todo-item"` etc. |
| `CreateTodoForm.tsx` dismiss pattern | `src/features/todos/components/CreateTodoForm.tsx` | Reference for how error dismiss works: `{isCreateError && (<div role="alert" ...><button onClick={createTodoReset}>Dismiss</button></div>)}` — follow same pattern |
| `cn()` utility | `src/shared/helpers/style.utils.ts` | Always use for all conditional class merging — never string concatenation, never inline style |
| MSW test `server` | `scripts/vitest.setup` (imported as `../../../../scripts/vitest.setup` relative to `components/`) | Already setup; override per-test with `server.use(...)` — same pattern as `TodoList.spec.tsx` and `CreateTodoForm.spec.tsx` |
| `renderWithProviders`, `setupStore` | `src/shared/store/test` | Used in all spec files — reuse exactly |
| `config.API_URL` | `src/test/config` | Used in MSW handler overrides — do NOT hardcode URLs |
| `todoMockList` | `src/test/handlers/todos` | `[{ id, description: 'Buy groceries', completed: false, ... }, { id, description: 'Walk the dog', completed: true, ... }]` — reuse in `TodoItem.spec.tsx` |
| `TodoPage` page object | `e2e/page-objects/TodoPage.ts` | Already has `navigate()`, `waitForTodoList()`, `typeInInput()`, `submitForm()`, `getTodoDescriptionTexts()` — **extend**, do NOT rewrite |
| `todos.feature` E2E file | `e2e/features/todos/todos.feature` | Already has 3 scenarios (Empty state, Add todo, Reload) — **append** new scenarios, keep existing ones intact |
| `todos.steps.ts` step definitions | `e2e/steps/todos/todos.steps.ts` | Already has `When 'the user reloads the page'` — **append** new steps, do NOT remove existing |

---

### RTK Query Mutation Patterns — Follow Exactly

**todos.api.ts update pattern** (follow `createTodo` exactly):

```typescript
// Add to existing injectEndpoints:
updateTodo: build.mutation<Todo, { id: string } & UpdateTodoRequest>({
  query: ({ id, ...body }) => ({
    url: `api/v1/todos/${id}`,
    method: 'PATCH',
    body,
  }),
  invalidatesTags: ['Todo'],
}),
deleteTodo: build.mutation<void, { id: string }>({
  query: ({ id }) => ({
    url: `api/v1/todos/${id}`,
    method: 'DELETE',
  }),
  invalidatesTags: ['Todo'],
}),
```

**Export line** — extend the existing destructure:
```typescript
export const {
  useGetTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
} = todosApi;
```

**TodoItem hook calls** — call RTK hooks directly inside the component:
```typescript
const [updateTodo, { isLoading: isUpdating, isError: isUpdateError, reset: resetUpdate }] =
  useUpdateTodoMutation();
const [deleteTodo, { isLoading: isDeleting, isError: isDeleteError, reset: resetDelete }] =
  useDeleteTodoMutation();
```

This ensures **per-instance mutation state isolation** — each `TodoItem` in the list gets its own loading/error state independently.

**No optimistic updates in v1** — never set UI state before the mutation resolves. Tag invalidation re-fetch is the strategy. The list update happens automatically after the mutation settles.

---

### TodoItem.tsx Implementation Guide

The current stub uses a `<span>` with a check SVG as a static visual. Replace it with an interactive `<button>`:

```
<button
  type="button"
  role="checkbox"
  aria-checked={todo.completed}
  aria-label={`Mark "${todo.description}" as ${todo.completed ? 'incomplete' : 'complete'}`}
  data-testid="todo-toggle-checkbox"
  disabled={isUpdating || isDeleting}
  onClick={() => updateTodo({ id: todo.id, completed: !todo.completed })}
  className={cn(
    'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
    'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    todo.completed && 'bg-primary border-primary',
  )}
>
  {/* keep existing SVG checkmark */}
</button>
```

Delete button — add after the description `<span>`:
```
<button
  type="button"
  aria-label={`Delete: ${todo.description}`}
  data-testid="todo-delete-button"
  disabled={isUpdating || isDeleting}
  onClick={() => deleteTodo({ id: todo.id })}
  className="ml-auto text-muted-foreground hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
>
  {/* SVG trash icon or text "✕" */}
</button>
```

Error blocks — placed **after** the closing `</li>` tag (or wrap `<li>` + errors in a `<div>`):

```
{isUpdateError && (
  <div
    data-testid="todo-update-error"
    role="alert"
    className="mt-1 flex items-center justify-between rounded-md border border-destructive/50 p-2 text-sm text-destructive"
  >
    <span>Failed to update task. Please try again.</span>
    <button
      type="button"
      aria-label="Dismiss update error"
      onClick={resetUpdate}
      className="ml-4 underline hover:no-underline"
    >
      Dismiss
    </button>
  </div>
)}
```

Same pattern for `isDeleteError` / `todo-delete-error` / "Failed to delete task. Please try again." / `resetDelete`.

> ⚠️ **`<li>` cannot directly contain a `<div>`** — wrap the whole thing in a fragment or change `<li>` + error container to be siblings inside a wrapping `<div role="listitem">`. The simplest fix: wrap each entire todo item (the `<li>` and its error block) in a wrapping `<div>` and make `TodoList.tsx` render `<ul>` → `<div wrapper>` → `<li>`. Or render the error inline inside the `<li>` using flex-col. The spec-level concern is just that `aria-live` errors are visible and dismissible. Choose the cleanest DOM structure.

---

### Existing Frontend Architecture Constraints

- **RTK Query tag**: The tag `'Todo'` is declared on `baseApi.enhanceEndpoints()` in `todos.api.ts` — it is already declared, just referenced in the new mutations via `invalidatesTags: ['Todo']`
- **Base URL**: declared via `fetchBaseQuery({ baseUrl: new URL('/', env.API_URL).href })` — always construct URLs relative (no leading `/` already handled by base URL setup)
- **No `console.log`** — not enforced by Biome on frontend but keep it clean
- **Biome rules**: `kebab-case` enforced for all new files; PascalCase for components is the exception as defined in architecture. Run `pnpm --filter @todo-app/web check` (Biome) to verify zero violations before marking done

---

### Testing Strategy: Unit Tests (Vitest + MSW)

The unit tests for `TodoItem.spec.tsx` should follow exactly the same pattern as `TodoList.spec.tsx` and `CreateTodoForm.spec.tsx`:

1. **Default MSW handlers** in `src/test/handlers/todos.ts` must cover happy-path PATCH and DELETE (the dev needs to add these in Task 4)
2. **Error scenarios** use `server.use(http.patch(...))` override per-test (MSW `server` imported from `../../../../scripts/vitest.setup`)
3. **Store pre-seeding**: `setupStore()` + `todosApi.util.upsertQueryData('getTodos', undefined, todoMockList)` injects the mock data without firing a real HTTP request for the GET — same pattern as `TodoList.spec.tsx`
4. **Testing mutations**: After clicking the toggle/delete button use `waitFor(...)` to wait for async state changes — RTK Query mutations are async

---

### Testing Strategy: E2E (Cucumber + Playwright — Live Stack)

These E2E tests run against the **real running stack** (not mocked). The test must:
1. Add a todo first (via the UI form) to have something to toggle/delete — use the existing `Given 'the user navigates to the home page'` + `When 'the user types...'` + `When 'the user submits...'` steps already in `create-todo.steps.ts`
2. Then toggle or delete using new steps added in `todos.steps.ts`
3. Use `waitForLoadState('networkidle')` after mutations to let RTK Query re-fetch settle

The `TodoPage` page object already used by `create-todo.steps.ts` — extend, don't duplicate.

---

### Project Structure Notes

**Files to modify:**
```
apps/web/src/features/todos/
├── store/
│   └── todos.api.ts          ← ADD updateTodo + deleteTodo mutations
├── components/
│   ├── TodoItem.tsx           ← REFACTOR: make interactive
│   └── TodoItem.spec.tsx      ← CREATE: unit tests
└── hooks/
    └── useTodos.ts            ← ADD update/delete mutation calls + returns

apps/web/src/test/handlers/
└── todos.ts                   ← ADD http.patch + http.delete MSW handlers

apps/web/e2e/
├── features/todos/
│   └── todos.feature          ← APPEND new scenarios
├── steps/todos/
│   └── todos.steps.ts         ← APPEND new step definitions
└── page-objects/
    └── TodoPage.ts            ← ADD toggleTodo, deleteTodo, isTodoCompleted
```

**Files NOT to touch:**
- `TodoList.tsx` — no changes needed; `TodoItem` refactor is backward-compatible (same props)
- `CreateTodoForm.tsx` — no changes
- `packages/shared/` — `UpdateTodoRequest` already exported
- `apps/api/` — backend endpoints already done (Stories 3.1 + 3.2)
- `e2e/features/todos/create-todo.feature` — separate file, unrelated scenarios
- `e2e/steps/todos/create-todo.steps.ts` — separate file, unrelated steps

---

### References

- RTK Query mutations API: `todosApi.injectEndpoints` pattern [Source: apps/web/src/features/todos/store/todos.api.ts]
- `useTodos.ts` current shape [Source: apps/web/src/features/todos/hooks/useTodos.ts]
- `TodoItem.tsx` starting stub with comment showing where actions go [Source: apps/web/src/features/todos/components/TodoItem.tsx]
- Error dismiss pattern (role="alert", reset() call, Dismiss button) [Source: apps/web/src/features/todos/components/CreateTodoForm.tsx#L75-L92]
- MSW server override per test [Source: apps/web/src/features/todos/components/TodoList.spec.tsx#L50-L70]
- `renderWithProviders`, store pre-seeding pattern [Source: apps/web/src/features/todos/components/TodoList.spec.tsx#L17-L35]
- MSW handlers array [Source: apps/web/src/test/handlers/todos.ts]
- `TodoPage` page object existing methods [Source: apps/web/e2e/page-objects/TodoPage.ts]
- E2E step definitions pattern [Source: apps/web/e2e/steps/todos/create-todo.steps.ts]
- `todos.feature` existing scenarios to preserve [Source: apps/web/e2e/features/todos/todos.feature]
- Architecture — frontend feature structure, RTK Query strategy [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- Architecture — naming conventions, `cn()` usage mandate [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns]
- Epics Story 3.3 acceptance criteria [Source: _bmad-output/planning-artifacts/epics.md#Story-3.3]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### File List

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/features/todos/store/todos.api.ts` | Modified | Added `updateTodo` (PATCH) and `deleteTodo` (DELETE) mutations with tag invalidation |
| `apps/web/src/features/todos/hooks/useTodos.ts` | Modified | Exposed update/delete mutations and state (isUpdating, isDeleting, etc.) |
| `apps/web/src/features/todos/components/TodoItem.tsx` | Modified | Refactored from read-only to interactive: toggle checkbox, delete button, inline error blocks with dismiss |
| `apps/web/src/features/todos/components/TodoItem.spec.tsx` | Created | 5 unit tests: toggle complete, toggle incomplete, delete, update error dismiss, delete error dismiss |
| `apps/web/src/test/handlers/todos.ts` | Modified | Added `http.patch` and `http.delete` MSW handlers for PATCH and DELETE endpoints |
| `apps/web/e2e/page-objects/TodoPage.ts` | Modified | Added `toggleTodo`, `deleteTodo`, `isTodoCompleted` methods |
| `apps/web/e2e/features/todos/todos.feature` | Modified | Added 3 scenarios: complete, uncomplete, delete todo |
| `apps/web/e2e/steps/todos/todos.steps.ts` | Modified | Added step definitions for toggle, delete, completion assertion, not-in-list assertion |
| `apps/web/e2e/steps/todos/create-todo.steps.ts` | Modified | Fixed submit step to wait for POST response + DOM update (React concurrent mode race condition) |

### Change Log

- Tasks 1-8: All implementation tasks completed
- Task 9.1: Unit tests — 30/30 pass (11 test files)
- Task 9.2: E2E tests — 14/14 pass (all scenarios including new complete/uncomplete/delete)
- Task 9.3: Biome check — 0 violations (104 files)
- Bug fix: Resolved E2E delete scenario race condition caused by React 19 concurrent mode deferring DOM commits after RTK Query tag invalidation GET responses. Fixed by waiting for actual DOM count change (via Playwright auto-retry assertion) instead of relying on `waitForLoadState('networkidle')`.

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created
- E2E delete race condition root cause: `waitForLoadState('networkidle')` fires when HTTP responses arrive, but React 19 concurrent rendering defers DOM commits. The submit step now waits for `toHaveCount(totalBefore + 1)`, ensuring the DOM reflects the POST's effect before the delete step measures `countBefore`.
- All mutation interactions (toggle, delete) use `Promise.all` with response waiters started before the click to avoid missing fast network responses.

**Code Review (post-implementation) — fixes applied:**
- M1: `TodoItem.tsx` inner SVG checkmark changed from `aria-label="Completed"` to `aria-hidden="true"` — decorative icon inside a fully-labelled button; `aria-label` was causing screen readers to announce "Completed" redundantly (WCAG 4.1.2)
- M2: `todos.steps.ts` — added `preDeleteCount = 0` reset at the start of the delete When step; prevents cross-scenario state bleed if a mid-step failure leaves the module-level var stale
- M3: `TodoPage.ts` `deleteTodo` — added `await expect(descLocator).toHaveCount(countBefore, { timeout: 3000 })` after measuring `countBefore` to confirm DOM stability before proceeding; guards against React 19 concurrent mode deferred commits that may still be in flight after networkidle

### File List
