# Story 3.2: Delete Todo API Endpoint

Status: done

## Story

As an API consumer,
I want a `DELETE /api/v1/todos/:id` endpoint that permanently removes a todo,
so that clients can delete todos from the list.

## Acceptance Criteria

1. **Given** a todo with `id` exists in the database, **When** `DELETE /api/v1/todos/:id` is called, **Then** the response is `200 OK` with an empty body. **And** the todo is no longer retrievable via `GET /api/v1/todos`.

2. **Given** a todo with the specified `id` does not exist, **When** `DELETE /api/v1/todos/:id` is called, **Then** the response is `404 Not Found` with RFC 9457 error shape: `{ "statusCode": 404, "error": "Not Found", "message": "Todo with id '...' not found" }`.

3. **Given** the `:id` path parameter is not a valid UUID, **When** `DELETE /api/v1/todos/:id` is called, **Then** the response is `400 Bad Request` (UUID format validated at route layer by TypeBox using `idDtoSchema`).

4. **Given** `delete-todo.handler.spec.ts` unit tests run via `node:test`, **When** tests execute, **Then** they cover: successful deletion (findOneById called, delete called once), todo not found (throws `TodoNotFoundError`, delete never called), registers with `commandBus` on init — all passing.

5. **Given** `tests/todos/delete-todo.feature` runs via Cucumber E2E against a live DB, **When** all scenarios execute, **Then** all pass: successful deletion verified via subsequent GET, 404 for non-existent id, 400 for invalid UUID.

## Tasks / Subtasks

- [x] Task 1: Verify no new shared types needed — DELETE has no request body, response is empty (AC: all)
  - [x] 1.1 Confirm `idDtoSchema` from `src/shared/api/id.response.dto.ts` — already exists, reuse for `:id` param validation
  - [x] 1.2 Confirm `RepositoryPort<Entity>.delete(entityId: string): Promise<boolean>` exists in `src/shared/db/repository.port.ts` — already exists, no new method needed
  - [x] 1.3 Confirm `TodoNotFoundError` from `src/modules/todos/domain/todo.errors.ts` — already exists, reuse for 404 case
  - [x] 1.4 Confirm `todoActionCreator` from `src/modules/todos/index.ts` — already exists

- [x] Task 2: Create `src/modules/todos/commands/delete-todo/delete-todo.handler.ts` (AC: #1–3)
  - [x] 2.1 Define `DeleteTodoPayload = { id: string }`
  - [x] 2.2 Define `DeleteTodoResult = null`
  - [x] 2.3 Export `deleteTodoCommand = todoActionCreator<DeleteTodoPayload, DeleteTodoResult>('delete')`
  - [x] 2.4 Implement `handler`: call `todoRepository.findOneById(payload.id)` → throw `TodoNotFoundError` if undefined → call `todoRepository.delete(payload.id)` → return `null`
  - [x] 2.5 Implement `init()` registering handler with `commandBus`

- [x] Task 3: Create `src/modules/todos/commands/delete-todo/delete-todo.handler.spec.ts` (AC: #4)
  - [x] 3.1 Test: successful deletion — `findOneById` returns todo, `delete` is called once with correct id, result is `null`
  - [x] 3.2 Test: todo not found — `findOneById` returns `undefined` → `assert.rejects(..., TodoNotFoundError)`, `delete` never called
  - [x] 3.3 Test: registers handler with `commandBus` on `init()`

- [x] Task 4: Create `src/modules/todos/commands/delete-todo/delete-todo.route.ts` (AC: #1–3)
  - [x] 4.1 DELETE `/v1/todos/:id` with `params: idDtoSchema`, no request body
  - [x] 4.2 Handler dispatches `await fastify.commandBus.execute(deleteTodoCommand({ id: req.params.id }))`
  - [x] 4.3 Returns `res.code(200).send()` — empty body, no JSON serialization

- [x] Task 5: Create `tests/todos/delete-todo.feature` (AC: #5)
  - [x] 5.1 Feature tagged `@todos` (triggers `TRUNCATE todos` Before hook)
  - [x] 5.2 Scenario: successfully delete an existing todo (POST then DELETE, verify GET returns empty list)
  - [x] 5.3 Scenario: 404 for non-existent todo id (valid UUID that does not exist)
  - [x] 5.4 Scenario: 400 for invalid UUID path parameter

- [x] Task 6: Append delete step definitions to `tests/todos/todos.steps.ts` (AC: #5)
  - [x] 6.1 `When 'I delete the stored todo'` — DELETE using `this.context.lastTodoId`
  - [x] 6.2 `When 'I send a DELETE to {string}'` — DELETE to arbitrary path for error scenarios
  - [x] 6.3 `Then 'I receive a 200 response with an empty body'` — assert 200, body is empty
  - [x] 6.4 `Then 'the deleted todo is no longer in the list'` — GET `/api/v1/todos` and assert id absent

- [x] Task 7: Run and verify locally (AC: #4, #5)
  - [x] 7.1 Run `pnpm --filter @todo-app/api test` — all unit tests pass (new + existing)
  - [x] 7.2 Start Postgres (`docker compose up postgres -d` from monorepo root), run `pnpm --filter @todo-app/api test:e2e` — all Cucumber scenarios pass
  - [x] 7.3 Run `pnpm --filter @todo-app/api check` — zero Biome violations

## Dev Notes

### What Already Exists — DO NOT Recreate

| Item                                                                        | Location                                                    | Notes                                                                                         |
| --------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `idDtoSchema`                                                               | `src/shared/api/id.response.dto.ts`                         | `Type.Object({ id: Type.String({ format: 'uuid' }) })` — use for `:id` param                  |
| `RepositoryPort.delete()`                                                   | `src/shared/db/repository.port.ts`                          | `delete(entityId: string): Promise<boolean>` — base implementation handles the SQL            |
| `TodoNotFoundError`                                                         | `src/modules/todos/domain/todo.errors.ts`                   | `extends NotFoundException`, constructor takes `id: string`                                   |
| `TodoEntity`                                                                | `src/modules/todos/domain/todo.types.ts`                    | `Omit<Todo, 'createdAt' \| 'updatedAt'> & { createdAt: Date; updatedAt: Date }`               |
| `todoActionCreator`                                                         | `src/modules/todos/index.ts`                                | `actionCreatorFactory('todo')`                                                                |
| `findOneById`                                                               | `src/modules/todos/database/todo.repository.port.ts` → base | Returns `Promise<TodoEntity \| undefined>`                                                    |
| `Before { tags: '@todos' }` hook                                            | `tests/todos/todos.steps.ts` line 7                         | Runs `TRUNCATE todos` before each `@todos` scenario                                           |
| `Given 'a todo is inserted with description {string} and its id is stored'` | `tests/todos/todos.steps.ts`                                | Inserts via DB and stores `row.id` in `this.context.lastTodoId` — **reuse, do not duplicate** |
| `Then 'I receive a 400 response'`                                           | `tests/todos/todos.steps.ts`                                | Checks RFC 9457 shape — reuse for AC #3                                                       |
| `Then 'I receive a 404 response'`                                           | `tests/todos/todos.steps.ts`                                | Checks RFC 9457 shape + 404 — reuse for AC #2                                                 |
| `Then 'I receive an empty list'`                                            | `tests/todos/todos.steps.ts`                                | Checks 200 + empty array — reuse for post-delete verification if desired                      |

---

### Route and Handler Auto-Loading — No Manual Registration Needed

The server auto-discovers files by glob:

- **Routes**: `AutoLoad` scans `src/modules/**/*.route.ts` with prefix `/api`. Adding `delete-todo.route.ts` is all that's needed.
- **Handlers**: DI `loadModules` scans `src/modules/**/*.handler.ts` and calls `init()` via `asyncInit`. Adding `delete-todo.handler.ts` is all that's needed.

**Do NOT modify** `src/modules/todos/index.ts` or `src/server/di/index.ts`.

---

### Handler Implementation

Follow exactly the same structure as `update-todo.handler.ts` ([Source: apps/api/src/modules/todos/commands/update-todo/update-todo.handler.ts]):

```typescript
// apps/api/src/modules/todos/commands/delete-todo/delete-todo.handler.ts
import { TodoNotFoundError } from "#src/modules/todos/domain/todo.errors.ts";
import { todoActionCreator } from "#src/modules/todos/index.ts";
import type { HandlerAction } from "#src/shared/cqrs/bus.types.ts";

export type DeleteTodoPayload = { id: string };
export type DeleteTodoResult = null;
export const deleteTodoCommand = todoActionCreator<
  DeleteTodoPayload,
  DeleteTodoResult
>("delete");

export default function makeDeleteTodo({
  commandBus,
  todoRepository,
}: Dependencies) {
  return {
    async handler({
      payload,
    }: HandlerAction<typeof deleteTodoCommand>): Promise<null> {
      const existing = await todoRepository.findOneById(payload.id);
      if (!existing) {
        throw new TodoNotFoundError(payload.id);
      }
      await todoRepository.delete(payload.id);
      return null;
    },
    init() {
      commandBus.register(deleteTodoCommand.type, this.handler);
    },
  };
}
```

**Critical rules (same as update-todo):**

- Use `HandlerAction<typeof deleteTodoCommand>` — never `ReturnType<typeof deleteTodoCommand>`.
- Never pass a generic to `commandBus.execute<T>()` in the route — type is inferred from the action creator.
- The handler must call `findOneById` first to enforce the 404 contract before calling `delete` — the base `RepositoryPort.delete` does not throw `TodoNotFoundError` on a missing record.
- Return `null` explicitly — this is the `DeleteTodoResult` type; TypeScript requires it since the return type annotation is `Promise<null>`.

---

### Route Implementation

Follow `update-todo.route.ts` for the params pattern. DELETE has no request body and returns an empty body with `200 OK`:

```typescript
// apps/api/src/modules/todos/commands/delete-todo/delete-todo.route.ts
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { deleteTodoCommand } from "#src/modules/todos/commands/delete-todo/delete-todo.handler.ts";
import { idDtoSchema } from "#src/shared/api/id.response.dto.ts";

export default async function deleteTodo(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: "DELETE",
    url: "/v1/todos/:id",
    schema: {
      description: "Permanently delete a todo",
      params: idDtoSchema,
      tags: ["todos"],
    },
    handler: async (req, res) => {
      await fastify.commandBus.execute(
        deleteTodoCommand({ id: req.params.id }),
      );
      return res.code(200).send();
    },
  });
}
```

**Notes:**

- URL is `/v1/todos/:id` — the `/api` prefix is applied automatically by `AutoLoad`. Never hardcode `/api` in route files.
- No `body` schema — DELETE requests carry no request body per REST conventions.
- No `response` schema for 200 — the response is empty, and omitting the schema avoids TypeBox serializer interference with `send()` (no argument).
- Use `res.code(200).send()` (no argument) for an empty body. Using `send(null)` would serialize as the JSON string `"null"` — incorrect.
- The `await` before `commandBus.execute` is important — errors (404, 400) must propagate before `send()` is called.

---

### Unit Test Implementation

Use `node:test` (NOT Vitest). Follow `update-todo.handler.spec.ts` exactly ([Source: apps/api/src/modules/todos/commands/update-todo/update-todo.handler.spec.ts]):

```typescript
// apps/api/src/modules/todos/commands/delete-todo/delete-todo.handler.spec.ts
import { TodoNotFoundError } from "#src/modules/todos/domain/todo.errors.ts";
import type { TodoEntity } from "#src/modules/todos/domain/todo.types.ts";
import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import makeDeleteTodo, { deleteTodoCommand } from "./delete-todo.handler.ts";

const mockTodoEntity = (overrides: Partial<TodoEntity> = {}): TodoEntity => ({
  id: "2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231",
  description: "Buy groceries",
  completed: false,
  createdAt: new Date("2026-03-10T10:00:00.000Z"),
  updatedAt: new Date("2026-03-10T10:00:00.000Z"),
  ...overrides,
});

describe("DeleteTodo handler", () => {
  it("deletes an existing todo successfully", async () => {
    const existing = mockTodoEntity();
    const todoRepository = {
      findOneById: mock.fn(async () => existing),
      delete: mock.fn(async () => true),
    } as any;
    const commandBus = { register: mock.fn() } as any;

    const handler = makeDeleteTodo({ todoRepository, commandBus } as any);
    const result = await handler.handler({
      payload: { id: existing.id },
    } as any);

    assert.equal(todoRepository.findOneById.mock.calls.length, 1);
    assert.equal(
      todoRepository.findOneById.mock.calls[0].arguments[0],
      existing.id,
    );
    assert.equal(todoRepository.delete.mock.calls.length, 1);
    assert.equal(todoRepository.delete.mock.calls[0].arguments[0], existing.id);
    assert.equal(result, null);
  });

  it("throws TodoNotFoundError when todo does not exist", async () => {
    const todoRepository = {
      findOneById: mock.fn(async () => undefined),
      delete: mock.fn(),
    } as any;
    const commandBus = { register: mock.fn() } as any;

    const handler = makeDeleteTodo({ todoRepository, commandBus } as any);
    await assert.rejects(
      () => handler.handler({ payload: { id: "missing-id" } } as any),
      TodoNotFoundError,
    );
    assert.equal(todoRepository.delete.mock.calls.length, 0);
  });

  it("registers handler with commandBus on init", () => {
    const todoRepository = { findOneById: mock.fn(), delete: mock.fn() } as any;
    const commandBus = { register: mock.fn() } as any;

    const handler = makeDeleteTodo({ todoRepository, commandBus } as any);
    handler.init();

    assert.equal(commandBus.register.mock.calls.length, 1);
    assert.equal(
      commandBus.register.mock.calls[0].arguments[0],
      deleteTodoCommand.type,
    );
    assert.equal(
      commandBus.register.mock.calls[0].arguments[1],
      handler.handler,
    );
  });
});
```

---

### E2E Feature File

```gherkin
# apps/api/tests/todos/delete-todo.feature
@todos
Feature: Delete Todo API

  Scenario: Successfully delete an existing todo
    Given a todo is inserted with description "Buy groceries" and its id is stored
    When I delete the stored todo
    Then I receive a 200 response with an empty body
    And the deleted todo is no longer in the list

  Scenario: Returns 404 for a non-existent todo id
    When I send a DELETE to "/api/v1/todos/00000000-0000-0000-0000-000000000000"
    Then I receive a 404 response

  Scenario: Returns 400 for an invalid UUID path parameter
    When I send a DELETE to "/api/v1/todos/not-a-uuid"
    Then I receive a 400 response
```

**Reuse of existing steps:**

- `Given 'a todo is inserted with description {string} and its id is stored'` — already defined in `todos.steps.ts` from Story 3.1. Do NOT re-define it.
- `Then 'I receive a 404 response'` — already defined in `todos.steps.ts`. Do NOT re-define it.
- `Then 'I receive a 400 response'` — already defined in `todos.steps.ts`. Do NOT re-define it.

Only the three new steps below need to be appended.

---

### E2E Step Definitions (APPEND to `tests/todos/todos.steps.ts`)

The following steps must be **appended** at the end of the existing `tests/todos/todos.steps.ts`. Do NOT modify or duplicate any existing steps.

```typescript
// ── Delete Todo steps ────────────────────────────────────────────────────────

When("I delete the stored todo", async function (this: ICustomWorld) {
  this.context.latestResponse = await this.server.inject({
    method: "DELETE",
    url: `/api/v1/todos/${this.context.lastTodoId}`,
  });
});

When(
  "I send a DELETE to {string}",
  async function (this: ICustomWorld, path: string) {
    this.context.latestResponse = await this.server.inject({
      method: "DELETE",
      url: path,
    });
  },
);

Then(
  "I receive a 200 response with an empty body",
  function (this: ICustomWorld) {
    assert.equal(this.context.latestResponse!.statusCode, 200);
    assert.equal(this.context.latestResponse!.body, "");
  },
);

Then(
  "the deleted todo is no longer in the list",
  async function (this: ICustomWorld) {
    const listResponse = await this.server.inject({
      method: "GET",
      url: "/api/v1/todos",
    });
    const todos = listResponse.json() as Array<{ id: string }>;
    const stillExists = todos.some((t) => t.id === this.context.lastTodoId);
    assert.equal(
      stillExists,
      false,
      `Todo with id ${this.context.lastTodoId} should have been deleted`,
    );
  },
);
```

---

### File Locations Summary

| File                                                                          | Action                             |
| ----------------------------------------------------------------------------- | ---------------------------------- |
| `apps/api/src/modules/todos/commands/delete-todo/delete-todo.handler.ts`      | CREATE                             |
| `apps/api/src/modules/todos/commands/delete-todo/delete-todo.handler.spec.ts` | CREATE                             |
| `apps/api/src/modules/todos/commands/delete-todo/delete-todo.route.ts`        | CREATE                             |
| `apps/api/tests/todos/delete-todo.feature`                                    | CREATE                             |
| `apps/api/tests/todos/todos.steps.ts`                                         | APPEND (delete steps section only) |

---

### Project Context Reference

[Source: _bmad-output/project-context.md]

- ESM-only: always include `.ts` extension in imports.
- Path aliases: `#src/*` for source, `#tests/*` for test support files.
- `import type` for all type-only imports (Biome enforces this).
- No `console.log` — but handlers don't log directly (loggers are for server/middleware level).
- Biome `noForEach` rule: use `for...of` — but `Array.some()` is acceptable (not `.forEach()`).
- Run commands from inside the workspace: `pnpm --filter @todo-app/api test`.

### Testing Commands

```bash
# Unit tests only
pnpm --filter @todo-app/api test

# E2E (requires Postgres running)
docker compose up postgres -d   # from monorepo root
pnpm --filter @todo-app/api test:e2e

# Lint check
pnpm --filter @todo-app/api check
```

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Implemented `DELETE /api/v1/todos/:id` endpoint following the red-green-refactor cycle
- Handler uses `findOneById` before `delete` to enforce 404 contract (`TodoNotFoundError` on missing record)
- Route returns `res.code(200).send()` (no argument) for an empty body — avoids TypeBox serializing `null` as `"null"`
- Unit tests: 3 new tests in `delete-todo.handler.spec.ts` using `node:test` — all pass (17/17 total)
- E2E tests: 3 new Cucumber scenarios in `delete-todo.feature` — all pass
- No new dependencies or shared types required; all referenced items already existed
- Pre-existing Biome violations in `update-todo.*` files (import order) are out of scope
- Code review (2026-03-10): Fixed import order violations in `delete-todo.handler.spec.ts` and `delete-todo.route.ts`; Biome now passes with 0 violations in all new files

### File List

- `apps/api/src/modules/todos/commands/delete-todo/delete-todo.handler.ts` (created)
- `apps/api/src/modules/todos/commands/delete-todo/delete-todo.handler.spec.ts` (created)
- `apps/api/src/modules/todos/commands/delete-todo/delete-todo.route.ts` (created)
- `apps/api/tests/todos/delete-todo.feature` (created)
- `apps/api/tests/todos/todos.steps.ts` (modified — appended delete step definitions)

### Change Log

- 2026-03-10: Implemented `DELETE /api/v1/todos/:id` endpoint (Story 3.2) — handler, route, unit tests, and Cucumber E2E scenarios added
- 2026-03-10: Code review — fixed Biome import-order violations in `delete-todo.handler.spec.ts` and `delete-todo.route.ts`; all 17 unit tests pass, biome check clean
