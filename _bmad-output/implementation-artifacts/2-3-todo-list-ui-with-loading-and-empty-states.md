# Story 2.3: Todo List UI with Loading and Empty States

Status: review

## Story

As Alex (the user),
I want to see all my todos on the page with clear loading and empty states,
So that I always know the current status of my task list.

## Acceptance Criteria

1. **Given** the RTK Query todos API slice is configured in `src/features/todos/store/todos.api.ts`, **When** it is set up, **Then** it extends the base API with tag `'Todo'` and defines the `getTodos` query calling `GET /api/v1/todos`, providing the `['Todo']` tag. **And** it defines the `createTodo` mutation calling `POST /api/v1/todos`, invalidating the `['Todo']` tag. **And** `src/features/todos/store/todos.types.ts` imports `Todo` and `CreateTodoRequest` from `@todo-app/shared` — no inline type duplication. **And** `src/features/todos/hooks/useTodos.ts` encapsulates `useGetTodosQuery` and `useCreateTodoMutation` and exposes a clean interface to components. **And** `VITE_API_URL` is centralised in `src/shared/config/env.ts` and used as the base URL.

2. **Given** the app is loading todos for the first time (no cached data), **When** the `TodoList` component renders, **Then** a visible loading indicator (skeleton or spinner) is displayed while `isLoading` is true from `useGetTodosQuery()`.

3. **Given** the API returns an empty array, **When** the `TodoList` component renders, **Then** a clear, inviting empty state message is displayed (e.g. "No tasks yet — add one above!"). **And** no todo items are rendered.

4. **Given** the API returns a non-empty list, **When** the `TodoList` component renders, **Then** all todos are displayed in creation order (oldest first). **And** each todo shows its description text. **And** completed todos are visually distinct from active todos (e.g. strikethrough text, muted colour, checked checkbox).

5. **Given** the API returns an error, **When** the `TodoList` component renders with `isError: true`, **Then** a user-visible error message is displayed (e.g. "Failed to load tasks. Please try again."). **And** no crash or blank screen occurs. **And** the error message is dismissible or a retry affordance is provided so the user can attempt the operation again.

6. **Given** `TodoList.spec.tsx` is created, **When** it runs under Vitest + Testing Library with MSW, **Then** tests cover: loading state, empty state, populated list, error state — all passing.

## Tasks / Subtasks

- [x] Task 1: Set up RTK Query todos API slice (AC: #1)
  - [x] 1.1 Create `apps/web/src/features/todos/store/todos.api.ts` — extend `baseApi`, tag `'Todo'`, `getTodos` query, `createTodo` mutation
  - [x] 1.2 Create `apps/web/src/features/todos/store/todos.types.ts` — re-export `Todo`, `CreateTodoRequest`, `UpdateTodoRequest` from `@todo-app/shared`
  - [x] 1.3 Create `apps/web/src/features/todos/hooks/useTodos.ts` — encapsulate `useGetTodosQuery` + `useCreateTodoMutation`

- [x] Task 2: Build `TodoList` component (AC: #2, #3, #4, #5)
  - [x] 2.1 Create `apps/web/src/features/todos/components/TodoItem.tsx` — read-only todo row (description + visual distinction for completed; NO action buttons in this story)
  - [x] 2.2 Create `apps/web/src/features/todos/components/TodoList.tsx` — loading skeleton, empty state, populated list, error state with retry
  - [x] 2.3 Update `apps/web/src/routes/Home/HomePage.tsx` — import and render `<TodoList />`

- [x] Task 3: Add MSW todo handlers (AC: #6)
  - [x] 3.1 Create `apps/web/src/test/handlers/todos.ts` — GET and POST handlers for `/api/v1/todos`
  - [x] 3.2 Update `apps/web/src/test/handlers/index.ts` — register `todosHandlers`

- [x] Task 4: Write `TodoList.spec.tsx` unit tests (AC: #6)
  - [x] 4.1 Create `apps/web/src/features/todos/components/TodoList.spec.tsx` — loading state, empty state, populated list, error state

- [x] Task 5: Verify full test suite passes
  - [x] 5.1 Run `pnpm --filter @todo-app/web test` — all unit tests pass
  - [x] 5.2 Run `pnpm --filter @todo-app/web check` — Biome linting clean
  - [x] 5.3 Run `pnpm -r type:check` — TypeScript compiles across all workspaces

## Dev Notes

### What Already Exists — DO NOT Recreate

| Item                                                     | Location                                     | Status                                      |
| -------------------------------------------------------- | -------------------------------------------- | ------------------------------------------- |
| `baseApi` RTK Query base with `baseUrl`                  | `apps/web/src/shared/store/api.ts`           | ✅ created in boilerplate                   |
| Redux store with `api: baseApi.reducer`                  | `apps/web/src/shared/store/index.ts`         | ✅ already includes RTK Query cache reducer |
| `renderWithProviders` test helper                        | `apps/web/src/shared/store/test.tsx`         | ✅ wraps with Provider + BrowserRouter      |
| `setupStore` test store factory                          | `apps/web/src/shared/store/test.tsx`         | ✅ for injecting preloaded state            |
| MSW `server` setup with `beforeAll`/`afterEach`          | `apps/web/scripts/vitest.setup.ts`           | ✅ server lifecycle managed                 |
| `Skeleton`, `SkeletonList`, `SkeletonCard` UI components | `apps/web/src/UI/Elements/Skeleton`          | ✅ from boilerplate                         |
| `VITE_API_URL` centralised in `env.ts`                   | `apps/web/src/shared/config/env.ts`          | ✅ `API_URL: import.meta.env.VITE_API_URL`  |
| `cn` utility (clsx + tailwind-merge)                     | `apps/web/src/shared/helpers/style.utils.ts` | ✅ use for conditional class merging        |
| `Todo`, `CreateTodoRequest` types                        | `packages/shared/src/todos/todos.types.ts`   | ✅ re-exported from `@todo-app/shared`      |
| `src/features/todos/store/` directory                    | `apps/web/src/features/todos/store/`         | ✅ exists (empty)                           |
| `config.API_URL` in test config                          | `apps/web/src/test/config.ts`                | ✅ `import.meta.env.VITE_API_URL`           |

---

### Critical Pattern: RTK Query `injectEndpoints` (Match Existing Code)

Do NOT create a standalone `createApi` call for todos. Use `injectEndpoints` on the **existing** `baseApi` — this is how the codebase works (see `user.api.ts`, `subscription.api.ts`):

```typescript
// apps/web/src/features/todos/store/todos.api.ts
import type { CreateTodoRequest, Todo } from "@todo-app/shared";
import baseApi from "@/shared/store/api";

export const todosApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["Todo"] })
  .injectEndpoints({
    endpoints: (build) => ({
      getTodos: build.query<Todo[], void>({
        query: () => "api/v1/todos",
        providesTags: ["Todo"],
      }),
      createTodo: build.mutation<Todo, CreateTodoRequest>({
        query: (body) => ({
          url: "api/v1/todos",
          method: "POST",
          body,
        }),
        invalidatesTags: ["Todo"],
      }),
    }),
    overrideExisting: false,
  });

export const { useGetTodosQuery, useCreateTodoMutation } = todosApi;
```

**Why `'api/v1/todos'` (no leading slash)?** The `baseApi` in `api.ts` sets `baseUrl` to
`new URL('/', env.API_URL).href` which resolves to e.g. `http://localhost:3000/`. RTK Query
with `fetchBaseQuery` treats endpoint paths without a leading `/` as relative — they are
appended after the trailing slash of `baseUrl`, giving `http://localhost:3000/api/v1/todos`.
Compare: `user.api.ts` uses `query: () => 'users'` → `http://localhost:3000/users`.

**Do NOT add `todos: todosApi.reducer` to `shared/store/index.ts`** — injected endpoints share
the base API's existing `api` reducer key. The store already has `api: baseApi.reducer` which
handles ALL injected endpoints automatically.

---

### Critical Pattern: `todos.types.ts` — Re-export only, no duplication

```typescript
// apps/web/src/features/todos/store/todos.types.ts
export type {
  CreateTodoRequest,
  Todo,
  UpdateTodoRequest,
} from "@todo-app/shared";
```

No inline type definitions. Types live in `packages/shared` — never duplicate them.

---

### Critical Pattern: `useTodos.ts` Hook

Encapsulates both the query and mutation for components. This keeps components clean:

```typescript
// apps/web/src/features/todos/hooks/useTodos.ts
import { todosApi } from "@/features/todos/store/todos.api";

export function useTodos() {
  const {
    data: todos = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = todosApi.useGetTodosQuery();

  const [createTodo, createTodoState] = todosApi.useCreateTodoMutation();

  return {
    todos,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    createTodo,
    isCreating: createTodoState.isLoading,
    isCreateError: createTodoState.isError,
    createError: createTodoState.error,
  };
}
```

**Note:** `data: todos = []` — default to `[]` to avoid `undefined` on first render.

---

### Critical Pattern: `TodoItem.tsx` — Read-Only in Story 2.3

Story 2.3 creates a **read-only** `TodoItem` that displays description and visual distinction.
**No action buttons yet** — checkbox/delete come in Story 3.3. Use a read-only checked
indicator (disabled checkbox or visual check icon) for completed state:

```typescript
// apps/web/src/features/todos/components/TodoItem.tsx
import type { Todo } from '@todo-app/shared'
import { cn } from '@/shared/helpers/style.utils'

type TodoItemProps = {
  todo: Todo
}

export function TodoItem({ todo }: TodoItemProps) {
  return (
    <li
      data-testid="todo-item"
      className={cn(
        'flex items-center gap-3 rounded-md border px-4 py-3',
        todo.completed && 'opacity-60',
      )}
    >
      {/* Read-only completion indicator — actions added in Story 3.3 */}
      <span
        aria-hidden="true"
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
          todo.completed && 'bg-primary border-primary',
        )}
      >
        {todo.completed && (
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
            aria-label="Completed"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </span>
      <span
        data-testid="todo-description"
        className={cn(todo.completed && 'line-through text-muted-foreground')}
      >
        {todo.description}
      </span>
    </li>
  )
}
```

---

### Critical Pattern: `TodoList.tsx` — All Four States

```typescript
// apps/web/src/features/todos/components/TodoList.tsx
import { TodoItem } from '@/features/todos/components/TodoItem'
import { useTodos } from '@/features/todos/hooks/useTodos'
import { SkeletonList } from '@/UI/Elements/Skeleton'

export function TodoList() {
  const { todos, isLoading, isError, refetch } = useTodos()

  if (isLoading) {
    return (
      <div data-testid="todo-list-loading" aria-busy="true" aria-label="Loading tasks">
        <SkeletonList className="py-4" />
      </div>
    )
  }

  if (isError) {
    return (
      <div
        role="alert"
        data-testid="todo-list-error"
        className="rounded-md border border-destructive/50 p-4 text-destructive"
      >
        <p>Failed to load tasks. Please try again.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <p
        data-testid="todo-list-empty"
        className="text-muted-foreground py-8 text-center"
      >
        No tasks yet — add one above!
      </p>
    )
  }

  return (
    <ul
      data-testid="todo-list"
      className="flex flex-col gap-2"
      aria-label="Todo list"
    >
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  )
}
```

**Key decisions:**

- `data-testid` attributes on each state — tests rely on these (do NOT remove them)
- `role="alert"` on error state — required for accessibility (AR16 from architecture)
- `aria-busy` on loading state — communicates loading to screen readers
- Retry button calls `refetch()` from RTK Query — this is the "retry affordance" from AC #5
- Empty state check AFTER error check — prevents showing "empty" when an error occurred

---

### Critical Detail: MSW Handlers for Todos

**New file** `apps/web/src/test/handlers/todos.ts`:

```typescript
import type { CreateTodoRequest, Todo } from "@todo-app/shared";
import { HttpResponse, http } from "msw";
import { config } from "../config";

export const todoMockList: Todo[] = [
  {
    id: "1c9d4d3a-f5b9-4e11-85c3-4d8e0f3e2a0b",
    description: "Buy groceries",
    completed: false,
    createdAt: "2026-03-09T10:00:00.000Z",
    updatedAt: "2026-03-09T10:00:00.000Z",
  },
  {
    id: "2a3b4c5d-1e2f-3a4b-8c9d-0e1f2a3b4c5d",
    description: "Walk the dog",
    completed: true,
    createdAt: "2026-03-09T11:00:00.000Z",
    updatedAt: "2026-03-09T11:30:00.000Z",
  },
];

export const todosHandlers = [
  http.get(`${config.API_URL}/api/v1/todos`, () => {
    return HttpResponse.json(todoMockList);
  }),
  http.post(`${config.API_URL}/api/v1/todos`, async ({ request }) => {
    const body = (await request.json()) as CreateTodoRequest;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      description: body.description,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newTodo, { status: 201 });
  }),
];
```

**Update** `apps/web/src/test/handlers/index.ts` — add `todosHandlers`:

```typescript
import { subscriptionHandlers } from "@/test/handlers/subscriptions";
import { todosHandlers } from "./todos";
import { usersHandlers } from "./users";

export const handlers = [
  ...usersHandlers,
  ...subscriptionHandlers,
  ...todosHandlers,
];
```

---

### Critical Detail: `TodoList.spec.tsx` Test Approaches

All four states must be tested. The pattern uses:

1. **Loading state** — check synchronously before RTK Query resolves
2. **Empty / populated states** — inject via `todosApi.util.upsertQueryData()` (established project
   pattern from `subscription.selector.spec.ts` — do NOT fight it)
3. **Error state** — override MSW handler via `server.use()` from the vitest setup file

```typescript
// apps/web/src/features/todos/components/TodoList.spec.tsx
import { HttpResponse, http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { todosApi } from '@/features/todos/store/todos.api'
import { renderWithProviders, setupStore } from '@/shared/store/test'
// The server is exported from the Vitest setup file — MSW lifecycle (listen/close) is handled there
import { server } from '../../../../scripts/vitest.setup'
import { todoMockList } from '@/test/handlers/todos'
import { config } from '@/test/config'
import { TodoList } from './TodoList'

describe('TodoList', () => {
  it('shows loading skeleton while fetching', () => {
    renderWithProviders(<TodoList />)
    expect(screen.getByTestId('todo-list-loading')).toBeInTheDocument()
    expect(screen.getByRole('region', { hidden: true })).toBeDefined()
  })

  it('shows empty state when no todos', async () => {
    const store = setupStore()
    await store.dispatch(
      todosApi.util.upsertQueryData('getTodos', undefined, []),
    )
    renderWithProviders(<TodoList />, { store })
    expect(screen.getByTestId('todo-list-empty')).toBeInTheDocument()
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument()
  })

  it('renders todos when list is populated', async () => {
    const store = setupStore()
    await store.dispatch(
      todosApi.util.upsertQueryData('getTodos', undefined, todoMockList),
    )
    renderWithProviders(<TodoList />, { store })
    const items = screen.getAllByTestId('todo-item')
    expect(items).toHaveLength(2)
    expect(screen.getByText('Buy groceries')).toBeInTheDocument()
    expect(screen.getByText('Walk the dog')).toBeInTheDocument()
  })

  it('applies strikethrough to completed todos', async () => {
    const store = setupStore()
    await store.dispatch(
      todosApi.util.upsertQueryData('getTodos', undefined, todoMockList),
    )
    renderWithProviders(<TodoList />, { store })
    const walkDog = screen.getByText('Walk the dog')
    expect(walkDog.className).toMatch(/line-through/)
  })

  it('shows error state and retry button when API fails', async () => {
    server.use(
      http.get(`${config.API_URL}/api/v1/todos`, () => {
        return HttpResponse.json({ statusCode: 500, error: 'Internal Server Error', message: 'Oops' }, { status: 500 })
      }),
    )
    renderWithProviders(<TodoList />)
    await waitFor(() => {
      expect(screen.getByTestId('todo-list-error')).toBeInTheDocument()
    })
    expect(screen.getByText(/failed to load tasks/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})
```

**Key notes:**

- `server` is importable from `scripts/vitest.setup.ts` — Vitest allows importing from setup files
- `server.resetHandlers()` is called in `afterEach` by the setup file — the error handler is cleaned up automatically
- `upsertQueryData` injects data directly into the RTK Query cache — no async wait needed for those tests
- `upsertQueryData` is part of `todosApi.util` (same pattern as `subscriptionApi.util` in `subscription.selector.spec.ts`)

---

### Critical Detail: `HomePage.tsx` Update

Replace the Lorem Ipsum placeholder with the `TodoList` component:

```typescript
// apps/web/src/routes/Home/HomePage.tsx
import { TodoList } from '@/features/todos/components/TodoList'
import { Container } from '@/UI/Elements/Container'
import { Text } from '@/UI/Elements/Text'

function HomePage() {
  return (
    <Container data-testid="home-page">
      <Text size="5" as="p" className="mb-4 font-semibold">
        My Tasks
      </Text>
      <TodoList />
    </Container>
  )
}

export default HomePage
```

**Note:** This replaces all the Lorem Ipsum `<Text>` blocks. The `HomePage.spec.tsx` test that
checks for `lorem ipsum dolor sit amet` will BREAK and must be updated:

Update `apps/web/src/routes/Home/HomePage.spec.tsx`:

```typescript
import { screen } from '@testing-library/react'
import HomePage from '@/routes/Home/HomePage'
import { renderWithProviders } from '@/shared/store/test'

describe('HomePage', () => {
  test('Should load', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByTestId('home-page')).toBeInTheDocument()
  })
})
```

---

### Architecture Compliance

| Rule                           | Detail                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| Feature folder structure       | `src/features/todos/{store,components,hooks}/` — matches architecture spec exactly |
| Types from shared              | All types via `@todo-app/shared` — never inline Todo type                          |
| RTK Query base API             | Use `baseApi.injectEndpoints()` — never `createApi()` directly                     |
| Tag naming                     | `'Todo'` (singular PascalCase) — matches architecture spec                         |
| Component naming               | `PascalCase.tsx` — TodoList, TodoItem, CreateTodoForm                              |
| Hook naming                    | `camelCase.ts` — useTodos.ts                                                       |
| Store files                    | `camelCase` — todos.api.ts, todos.types.ts                                         |
| Spec co-location               | `TodoList.spec.tsx` next to `TodoList.tsx`                                         |
| No Redux slice for server data | RTK Query cache IS the server state — no `todos[]` in a Redux slice                |

---

### Project Structure Notes

**New files (create from scratch):**

- `apps/web/src/features/todos/store/todos.api.ts`
- `apps/web/src/features/todos/store/todos.types.ts`
- `apps/web/src/features/todos/hooks/useTodos.ts` ← **new `hooks/` directory**
- `apps/web/src/features/todos/components/TodoItem.tsx` ← **new `components/` directory**
- `apps/web/src/features/todos/components/TodoList.tsx`
- `apps/web/src/features/todos/components/TodoList.spec.tsx`
- `apps/web/src/test/handlers/todos.ts`

**Files to update (extend existing):**

- `apps/web/src/test/handlers/index.ts` — add `todosHandlers` to handlers array
- `apps/web/src/routes/Home/HomePage.tsx` — replace Lorem Ipsum with `<TodoList />`
- `apps/web/src/routes/Home/HomePage.spec.tsx` — update broken assertion

**Files NOT to touch:**

- `apps/web/src/shared/store/index.ts` — RTK Query cache is already handled via `api: baseApi.reducer`; injected endpoints share this reducer automatically
- `apps/web/src/shared/store/api.ts` — base API is correct as-is
- `apps/web/src/shared/config/env.ts` — `VITE_API_URL` already centralised here (AC #1 already satisfied)
- `apps/web/scripts/vitest.setup.ts` — DO NOT modify; just import `server` from it in tests

### References

- Architecture: [\_bmad-output/planning-artifacts/architecture.md](_bmad-output/planning-artifacts/architecture.md#frontend-architecture)
- Epics/AC: [\_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md#story-23-todo-list-ui-with-loading-and-empty-states)
- Pattern reference `user.api.ts`: `apps/web/src/features/user/store/user.api.ts`
- Pattern reference `subscription.api.ts`: `apps/web/src/features/subscriptions/store/subscription.api.ts`
- Pattern reference `subscription.selector.spec.ts` (upsertQueryData): `apps/web/src/features/subscriptions/store/subscription.selector.spec.ts`
- Pattern reference `SubscriptionList.tsx` (loading state with SkeletonList): `apps/web/src/features/subscriptions/components/SubscriptionList.tsx`
- MSW handler pattern: `apps/web/src/test/handlers/users.ts`
- Vitest setup + MSW server: `apps/web/scripts/vitest.setup.ts`
- Skeleton component: `apps/web/src/UI/Elements/Skeleton/Skeleton.tsx`
- shared types: `packages/shared/src/todos/todos.types.ts`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Implemented RTK Query `todosApi` using `injectEndpoints` on existing `baseApi` with `getTodos` query and `createTodo` mutation.
- Created `todos.types.ts` as a pure re-export from `@todo-app/shared` (no inline type duplication).
- Created `useTodos` hook encapsulating both query and mutation for clean component API.
- Created `TodoItem` — read-only, with visual distinction for completed items (strikethrough + muted colour + checkmark icon).
- Created `TodoList` — all four states: loading (`<output aria-busy>` + `<SkeletonList>`), error (`role="alert"` + Retry button), empty, populated.
- Replaced Lorem Ipsum placeholder in `HomePage.tsx` with `<TodoList />`; updated `HomePage.spec.tsx` assertion accordingly.
- Added MSW handlers for GET/POST `/api/v1/todos`; registered in global handlers index.
- 5 unit tests covering all four `TodoList` display states; all 21 tests in suite pass.
- Biome linting clean; TypeScript compiles across all workspaces.
- Loading state uses `<output>` semantic element (Biome `useSemanticElements` rule requires this over `<div role="status">`).

### File List

- `apps/web/src/features/todos/store/todos.api.ts` (new)
- `apps/web/src/features/todos/store/todos.types.ts` (new)
- `apps/web/src/features/todos/hooks/useTodos.ts` (new)
- `apps/web/src/features/todos/components/TodoItem.tsx` (new)
- `apps/web/src/features/todos/components/TodoList.tsx` (new)
- `apps/web/src/features/todos/components/TodoList.spec.tsx` (new)
- `apps/web/src/test/handlers/todos.ts` (new)
- `apps/web/src/test/handlers/index.ts` (modified)
- `apps/web/src/routes/Home/HomePage.tsx` (modified)
- `apps/web/src/routes/Home/HomePage.spec.tsx` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)

## Change Log

- 2026-03-09: Story implemented — RTK Query todos API slice, TodoItem, TodoList (all four states), MSW handlers, unit tests, HomePage updated. All 21 tests pass, Biome clean, TypeScript compiles. (Claude Sonnet 4.6)
