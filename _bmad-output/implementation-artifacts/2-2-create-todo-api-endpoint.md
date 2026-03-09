# Story 2.2: Create Todo API Endpoint

Status: ready-for-dev

## Story

As an API consumer,
I want a `POST /api/v1/todos` endpoint that creates a new todo,
So that clients can add todos to the list.

## Acceptance Criteria

1. **Given** a valid request body `{ "description": "Buy milk" }`, **When** `POST /api/v1/todos` is called, **Then** the response is `201 Created` with the newly created todo object: `{ id, description, completed: false, createdAt, updatedAt }`. **And** the todo is persisted in the database and retrievable via `GET /api/v1/todos`.

2. **Given** a request body with an empty description `{ "description": "" }`, **When** `POST /api/v1/todos` is called, **Then** the response is `400 Bad Request` with RFC 9457 error shape: `{ "statusCode": 400, "error": "Bad Request", "message": "..." }`.

3. **Given** a request body with a description exceeding 500 characters, **When** `POST /api/v1/todos` is called, **Then** the response is `400 Bad Request` with RFC 9457 error shape.

4. **Given** a request body with no `description` field, **When** `POST /api/v1/todos` is called, **Then** the response is `400 Bad Request`.

5. **Given** the `CreateTodoCommand` handler is unit tested in `create-todo.handler.spec.ts`, **When** the tests run, **Then** they cover: successful creation (entity created with correct defaults, `todoRepository.insert` called) — passing.

6. **Given** the Cucumber E2E test suite runs `create-todo.feature`, **When** scenarios execute against the live server and database, **Then** all scenarios pass: successful creation with correct 201 response, empty description rejection (400), description too long rejection (400), missing description field (400).

7. **Given** the `POST /api/v1/todos` endpoint is implemented, **When** the API contract is validated, **Then** a successful creation request returns status `201` with a response body matching the `Todo` type from `@todo-app/shared`. **And** an invalid request (empty description) returns status `400` with an RFC 9457 error body: `{ statusCode, error, message }`. **And** the `Content-Type` response header is `application/json`.

## Tasks / Subtasks

- [ ] Task 1: Create `todo.domain.ts` for entity creation (AC: #1)
  - [ ] 1.1 Create `apps/api/src/modules/todos/domain/todo.domain.ts` — `todoDomain` factory with `createTodo({ description })` method generating UUID + timestamps + `completed: false`
  - [ ] 1.2 Update `apps/api/src/modules/todos/index.ts` — add `todoDomain: ReturnType<typeof todoDomain>` to the global `Dependencies` interface

- [ ] Task 2: Create create-todo command (AC: #1, #2, #3, #4, #5)
  - [ ] 2.1 Create `apps/api/src/modules/todos/commands/create-todo/create-todo.schema.ts` — local TypeBox schema `createTodoRequestSchema` with `description: Type.String({ minLength: 1, maxLength: 500 })` + exported type `CreateTodoRequestDto`
  - [ ] 2.2 Create `apps/api/src/modules/todos/commands/create-todo/create-todo.handler.ts` — `CreateTodoResult = TodoEntity`, `createTodoCommand` action creator, `makeCreateTodo` factory registering with `commandBus`
  - [ ] 2.3 Create `apps/api/src/modules/todos/commands/create-todo/create-todo.route.ts` — `POST /v1/todos`, validates body with `createTodoRequestSchema`, returns `201` with mapped response
  - [ ] 2.4 Create `apps/api/src/modules/todos/commands/create-todo/create-todo.handler.spec.ts` — unit tests: successful creation

- [ ] Task 3: Cucumber E2E tests (AC: #6)
  - [ ] 3.1 Create `apps/api/tests/todos/create-todo.feature` — scenarios: successful creation with 201 response, empty description → 400, description too long → 400, missing description field → 400
  - [ ] 3.2 Update `apps/api/tests/todos/todos.steps.ts` — add step definitions for create-todo scenarios

- [ ] Task 4: Verify full test suite (AC: #7)
  - [ ] 4.1 Run `pnpm --filter @todo-app/api test` — all unit tests pass (including new `create-todo.handler.spec.ts`)
  - [ ] 4.2 Run `pnpm --filter @todo-app/api test:e2e` — all Cucumber scenarios pass (find-todos + create-todo features)
  - [ ] 4.3 Run `pnpm check` — Biome linting clean
  - [ ] 4.4 Run `pnpm -r type:check` — TypeScript compiles across all workspaces
  - [ ] 4.5 Run `pnpm --filter @todo-app/api deps:validate` — architecture boundary check passes

## Dev Notes

### What Already Exists — DO NOT Recreate

| Item                                                                       | Location                                                      | Status                                                                                 |
| -------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `TodoEntity` interface                                                     | `apps/api/src/modules/todos/domain/todo.types.ts`             | ✅ Created (Story 2.1)                                                                 |
| `TodoNotFoundError`                                                        | `apps/api/src/modules/todos/domain/todo.errors.ts`            | ✅ Created (Story 2.1)                                                                 |
| `TodoRepository` port (with `insert()`)                                    | `apps/api/src/modules/todos/database/todo.repository.port.ts` | ✅ Created (Story 2.1)                                                                 |
| `todoRepository` with `findAll()` override                                 | `apps/api/src/modules/todos/database/todo.repository.ts`      | ✅ Created (Story 2.1)                                                                 |
| `todoMapper` (`toDomain`, `toResponse`, `toPersistence`)                   | `apps/api/src/modules/todos/todo.mapper.ts`                   | ✅ Created (Story 2.1)                                                                 |
| `todo.response.dto.ts` (re-exports `todoResponseSchema`)                   | `apps/api/src/modules/todos/dtos/todo.response.dto.ts`        | ✅ Created (Story 2.1)                                                                 |
| `todoActionCreator` + `Dependencies` (`todoMapper`, `todoRepository`)      | `apps/api/src/modules/todos/index.ts`                         | ✅ Created (Story 2.1) — **MUST extend** to add `todoDomain`                           |
| `todoResponseSchema`, `createTodoRequestSchema`, `updateTodoRequestSchema` | `packages/shared/src/todos/todos.schema.ts`                   | ✅ Full TypeBox schemas                                                                |
| `todos` table migration                                                    | `apps/api/db/migrations/`                                     | ✅ Exists — UUID PK, description NOT NULL, completed BOOLEAN DEFAULT FALSE, timestamps |
| `SqlRepositoryBase` with `insert()`                                        | `apps/api/src/shared/db/sql-repository.base.ts`               | ✅ `insert(entity: Entity)` calls `mapper.toPersistence` → inserts via postgres.js     |
| `buildApp()` test server factory                                           | `apps/api/tests/support/server.ts`                            | ✅ Boots full Fastify server                                                           |
| `ICustomWorld` (`this.server`, `this.db`)                                  | `apps/api/tests/support/custom-world.ts`                      | ✅ Available in all Cucumber steps                                                     |
| `@todos` Before hook in todos.steps.ts                                     | `apps/api/tests/todos/todos.steps.ts`                         | ✅ `TRUNCATE todos` before each `@todos` scenario                                      |
| User module create command (reference)                                     | `apps/api/src/modules/user/commands/create-user/`             | ✅ Full working example of every command layer pattern                                 |

---

### Critical Architecture: Command Pattern (vs Query)

Story 2.1 used `queryBus` for the `FindTodosQuery`. Story 2.2 uses `commandBus` for `CreateTodoCommand`. The pattern is identical except bus type.

```text
Query:   queryBus.register(...)  /  queryBus.execute(...)
Command: commandBus.register(...) / commandBus.execute(...)
```

Reference: `apps/api/src/modules/user/commands/create-user/create-user.handler.ts`

---

### Critical Architecture: How Routes Become `/api/v1/todos`

The server's AutoLoad adds the `/api` prefix. Routes define `/v1/todos`. Combined = `/api/v1/todos`.

```text
apps/api/src/server/index.ts:
  fastify.register(AutoLoad, {
    prefix: '/api',         ← adds /api
    matchFilter: /\.route\.ts$/
  });

create-todo.route.ts:
  url: '/v1/todos',        ← yields /api/v1/todos
  method: 'POST',
```

---

### Critical Architecture: Awilix Auto-Load DI Registration

Awilix discovers modules via glob pattern `**/*.{repository,mapper,service,domain}.{js,ts}`.

The `formatName` function in `apps/api/src/server/di/util.ts` converts filenames to camelCase DI tokens:

- `todo.domain.ts` → `todoDomain`

**`todoDomain` MUST be added to the `Dependencies` global interface in `apps/api/src/modules/todos/index.ts`**, otherwise TypeScript fails when handlers destructure it.

Pattern from user module (`apps/api/src/modules/user/index.ts`):

```typescript
import type userDomain from "#src/modules/user/domain/user.domain.ts";
// ...
declare global {
  export interface Dependencies {
    // ...
    userDomain: ReturnType<typeof userDomain>;
  }
}
```

---

### Critical Implementation Detail: `TodoModel` Uses `Date` Objects

postgres.js auto-converts `TIMESTAMPTZ` columns to JavaScript `Date` objects. The actual `TodoModel` in `todo.repository.ts` is:

```typescript
export type TodoModel = Pick<Todo, "id" | "description" | "completed"> & {
  created_at: Date; // Date (auto-converted by postgres.js) — NOT string
  updated_at: Date; // Date (auto-converted by postgres.js) — NOT string
};
```

The `toPersistence` mapper returns `{ ..., created_at: Date, updated_at: Date }`. This is correct — postgres.js handles Date objects natively when inserting.

---

### Critical Implementation Detail: `SqlRepositoryBase.insert()` Behaviour

```typescript
async insert(entity: Entity | Entity[]): Promise<void>
```

- Calls `mapper.toPersistence(entity)` to convert domain entity to DB model
- Executes `INSERT INTO todos ${db(records)}` via postgres.js
- Returns `void` — does NOT return the inserted row
- The handler must **return the original `TodoEntity`** passed to `insert`, NOT the DB result

This means the route gets back the domain entity and maps it to response with `todoMapper.toResponse(entity)`.

---

### Critical Implementation Detail: Input Validation via TypeBox at Route Level

The `description` field validation (`minLength: 1`, `maxLength: 500`) is enforced by TypeBox/Fastify schema validation at the **route layer**, not in the handler. The handler receives already-validated data.

Fastify/TypeBox automatically returns 400 with RFC 9457 shape for schema violations (Fastify's built-in behavior). No manual validation code is needed in the handler.

**Use a local schema file** (pattern from `create-user.schema.ts`) rather than the shared `createTodoRequestSchema` to add the validation constraints:

```typescript
// create-todo.schema.ts (local)
export const createTodoRequestSchema = Type.Object({
  description: Type.String({
    minLength: 1,
    maxLength: 500,
    example: "Buy groceries",
    description: "Todo description",
  }),
});
export type CreateTodoRequestDto = Static<typeof createTodoRequestSchema>;
```

The shared `createTodoRequestSchema` (in `@todo-app/shared`) intentionally lacks `minLength`/`maxLength` — it's a type declaration, not an API validation schema.

---

### File-by-File Implementation Guide

#### `apps/api/src/modules/todos/domain/todo.domain.ts` (NEW)

```typescript
import { randomUUID } from "node:crypto";
import type { TodoEntity } from "#src/modules/todos/domain/todo.types.ts";

export type CreateTodoProps = {
  description: string;
};

export default function todoDomain() {
  return {
    createTodo: (props: CreateTodoProps): TodoEntity => {
      const now = new Date();
      return {
        id: randomUUID(),
        description: props.description,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };
    },
  };
}
```

---

#### `apps/api/src/modules/todos/index.ts` (UPDATE — add `todoDomain`)

Add the `todoDomain` import and declaration to the existing file:

```typescript
import type { Todo } from "@todo-app/shared";
import type { TodoRepository } from "#src/modules/todos/database/todo.repository.port.ts";
import type { TodoModel } from "#src/modules/todos/database/todo.repository.ts";
import type todoDomain from "#src/modules/todos/domain/todo.domain.ts";
import type { TodoEntity } from "#src/modules/todos/domain/todo.types.ts";
import { actionCreatorFactory } from "#src/shared/cqrs/action-creator.ts";
import type { Mapper } from "#src/shared/ddd/mapper.interface.ts";

declare global {
  export interface Dependencies {
    todoMapper: Mapper<TodoEntity, TodoModel, Todo>;
    todoRepository: TodoRepository;
    todoDomain: ReturnType<typeof todoDomain>;
  }
}

export const todoActionCreator = actionCreatorFactory("todo");
```

---

#### `apps/api/src/modules/todos/commands/create-todo/create-todo.schema.ts` (NEW)

```typescript
import { type Static, Type } from "typebox";

export const createTodoRequestSchema = Type.Object({
  description: Type.String({
    minLength: 1,
    maxLength: 500,
    example: "Buy groceries",
    description: "Todo description",
  }),
});

export type CreateTodoRequestDto = Static<typeof createTodoRequestSchema>;
```

---

#### `apps/api/src/modules/todos/commands/create-todo/create-todo.handler.ts` (NEW)

```typescript
import type { TodoEntity } from "#src/modules/todos/domain/todo.types.ts";
import { todoActionCreator } from "#src/modules/todos/index.ts";
import type { HandlerAction } from "#src/shared/cqrs/bus.types.ts";
import type { CreateTodoRequestDto } from "./create-todo.schema.ts";

export type CreateTodoResult = TodoEntity;
export const createTodoCommand = todoActionCreator<
  CreateTodoRequestDto,
  CreateTodoResult
>("create");

export default function makeCreateTodo({
  commandBus,
  todoRepository,
  todoDomain,
}: Dependencies) {
  return {
    async handler({
      payload,
    }: HandlerAction<typeof createTodoCommand>): Promise<CreateTodoResult> {
      const todo = todoDomain.createTodo({ description: payload.description });
      await todoRepository.insert(todo);
      return todo;
    },
    init() {
      commandBus.register(createTodoCommand.type, this.handler);
    },
  };
}
```

**Key points:**

- Uses `commandBus` (not `queryBus`)
- `todoDomain.createTodo(...)` generates UUID + `createdAt`/`updatedAt` = `new Date()` + `completed: false`
- `todoRepository.insert(todo)` returns `void` — that is fine, we return `todo` directly
- The route maps `todo` to response DTO via `todoMapper.toResponse(todo)`

---

#### `apps/api/src/modules/todos/commands/create-todo/create-todo.route.ts` (NEW)

```typescript
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { todoResponseSchema } from "@todo-app/shared/todos/schema";
import { createTodoCommand } from "#src/modules/todos/commands/create-todo/create-todo.handler.ts";
import { createTodoRequestSchema } from "#src/modules/todos/commands/create-todo/create-todo.schema.ts";

export default async function createTodo(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: "POST",
    url: "/v1/todos",
    schema: {
      description: "Create a new todo",
      body: createTodoRequestSchema,
      response: {
        201: todoResponseSchema,
      },
      tags: ["todos"],
    },
    handler: async (req, res) => {
      const todo = await fastify.commandBus.execute(
        createTodoCommand(req.body),
      );
      const response = fastify.diContainer.cradle.todoMapper.toResponse(todo);
      return res.status(201).send(response);
    },
  });
}
```

**Key points:**

- `method: 'POST'`, `url: '/v1/todos'` → accessible at `/api/v1/todos`
- Body schema: local `createTodoRequestSchema` (with `minLength: 1, maxLength: 500`)
- Response schema: `todoResponseSchema` from shared package (same pattern as find-todos using `findTodosResponseSchema`)
- Response status: `201` (not `200`)
- Response is a single object, not an array

---

#### `apps/api/src/modules/todos/commands/create-todo/create-todo.handler.spec.ts` (NEW)

```typescript
import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { TodoEntity } from "#src/modules/todos/domain/todo.types.ts";
import makeCreateTodo, { createTodoCommand } from "./create-todo.handler.ts";

const mockTodoEntity = (overrides: Partial<TodoEntity> = {}): TodoEntity => ({
  id: randomUUID(),
  description: "Buy groceries",
  completed: false,
  createdAt: new Date("2026-03-09T10:00:00.000Z"),
  updatedAt: new Date("2026-03-09T10:00:00.000Z"),
  ...overrides,
});

describe("CreateTodo handler", () => {
  it("creates a todo and inserts it into the repository", async () => {
    const todo = mockTodoEntity();
    const todoDomain = { createTodo: vi.fn().mockReturnValue(todo) } as any;
    const todoRepository = {
      insert: vi.fn().mockResolvedValue(undefined),
    } as any;
    const commandBus = { register: vi.fn() } as any;

    const handler = makeCreateTodo({
      todoDomain,
      todoRepository,
      commandBus,
    } as any);
    const result = await handler.handler({
      payload: { description: "Buy groceries" },
    } as any);

    expect(todoDomain.createTodo).toHaveBeenCalledWith({
      description: "Buy groceries",
    });
    expect(todoRepository.insert).toHaveBeenCalledWith(todo);
    expect(result).toEqual(todo);
  });

  it("registers handler with commandBus on init", () => {
    const todoDomain = { createTodo: vi.fn() } as any;
    const todoRepository = { insert: vi.fn() } as any;
    const commandBus = { register: vi.fn() } as any;

    const handler = makeCreateTodo({
      todoDomain,
      todoRepository,
      commandBus,
    } as any);
    handler.init();
    expect(commandBus.register).toHaveBeenCalledWith(
      createTodoCommand.type,
      handler.handler,
    );
  });
});
```

---

#### `apps/api/tests/todos/create-todo.feature` (NEW)

```gherkin
@todos
Feature: Create Todo

  Background:
    Given the todos database is empty

  Scenario: Successfully create a todo
    When I create a todo with description "Buy milk"
    Then I receive a 201 response
    And the response body contains a todo with description "Buy milk"
    And the todo has completed status false
    And the todo has a valid UUID id
    And the todo has valid ISO 8601 createdAt and updatedAt timestamps

  Scenario: Reject empty description
    When I create a todo with description ""
    Then I receive a 400 response

  Scenario: Reject description that exceeds 500 characters
    When I create a todo with a description of 501 characters
    Then I receive a 400 response

  Scenario: Reject missing description field
    When I create a todo with no description field
    Then I receive a 400 response

  Scenario: Created todo is retrievable via GET
    When I create a todo with description "Walk the dog"
    Then I receive a 201 response
    When I request the list of todos
    Then I receive a list with 1 todo
    And the first todo has description "Walk the dog"
```

---

#### `apps/api/tests/todos/todos.steps.ts` (UPDATE — add create-todo steps)

Add the following step definitions to the existing `todos.steps.ts` file. **Do NOT remove the existing find-todos steps.**

```typescript
// Add these imports at the top (if not already present):
// import assert from 'node:assert/strict';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

When(
  "I create a todo with description {string}",
  async function (this: ICustomWorld, description: string) {
    this.context.latestResponse = await this.server.inject({
      method: "POST",
      url: "/api/v1/todos",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ description }),
    });
  },
);

When(
  "I create a todo with a description of {int} characters",
  async function (this: ICustomWorld, length: number) {
    const description = "a".repeat(length);
    this.context.latestResponse = await this.server.inject({
      method: "POST",
      url: "/api/v1/todos",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ description }),
    });
  },
);

When(
  "I create a todo with no description field",
  async function (this: ICustomWorld) {
    this.context.latestResponse = await this.server.inject({
      method: "POST",
      url: "/api/v1/todos",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
  },
);

Then("I receive a 201 response", function (this: ICustomWorld) {
  assert.equal(this.context.latestResponse!.statusCode, 201);
  assert.ok(
    this.context.latestResponse!.headers["content-type"]?.includes(
      "application/json",
    ),
    "Content-Type must be application/json",
  );
});

Then("I receive a 400 response", function (this: ICustomWorld) {
  assert.equal(this.context.latestResponse!.statusCode, 400);
  const body = this.context.latestResponse!.json();
  assert.ok(
    typeof body.statusCode === "number",
    "RFC 9457: must have statusCode",
  );
  assert.ok(typeof body.error === "string", "RFC 9457: must have error string");
  assert.ok(
    typeof body.message === "string",
    "RFC 9457: must have message string",
  );
});

Then(
  "the response body contains a todo with description {string}",
  function (this: ICustomWorld, description: string) {
    const body = this.context.latestResponse!.json();
    assert.equal(body.description, description);
  },
);

Then("the todo has completed status false", function (this: ICustomWorld) {
  const body = this.context.latestResponse!.json();
  assert.equal(body.completed, false);
});

Then("the todo has a valid UUID id", function (this: ICustomWorld) {
  const body = this.context.latestResponse!.json();
  assert.ok(
    UUID_REGEX.test(body.id),
    `id must be a valid UUID, got: ${body.id}`,
  );
});

Then(
  "the todo has valid ISO 8601 createdAt and updatedAt timestamps",
  function (this: ICustomWorld) {
    const body = this.context.latestResponse!.json();
    assert.ok(
      ISO_8601_REGEX.test(body.createdAt),
      `createdAt must be ISO 8601, got: ${body.createdAt}`,
    );
    assert.ok(
      ISO_8601_REGEX.test(body.updatedAt),
      `updatedAt must be ISO 8601, got: ${body.updatedAt}`,
    );
  },
);
```

**Note:** `ISO_8601_REGEX` is already defined at the top of `todos.steps.ts` from Story 2.1. Do not duplicate it.

---

### Previous Story Learnings (from Story 2.1 Actual Code)

1. **`TodoModel` uses `Date` objects, not strings** — postgres.js auto-converts `TIMESTAMPTZ`. The story file's code examples had strings; the actual committed code uses `Date`. Follow the committed code.

2. **`toPersistence` returns `Date` objects** — `{ ..., created_at: entity.createdAt, updated_at: entity.updatedAt }` where both are `Date` objects. postgres.js handles Date natively.

3. **Handler uses `_action` naming** — The find-todos handler uses `_action: HandlerAction<...>` (underscore prefix for unused param). For create-todo, the payload is used, so use `{ payload }` destructuring.

4. **Route imports from shared package** — `findTodosResponseSchema` is imported from `@todo-app/shared/todos/schema` directly (not from a local schema file). Do the same for `todoResponseSchema` in the create route.

5. **`this.server.inject` for Cucumber steps** — Use `this.server.inject({ method, url, headers, body })`. The `headers: { 'content-type': 'application/json' }` and `body: JSON.stringify(...)` are required for POST.

6. **`@todos` tag on feature file** — Required for the `Before` hook that truncates the table. All todo feature files must use `@todos` tag.

7. **`assert` import** — Steps use `import assert from 'node:assert/strict'` (strict mode). Use `assert.equal` (not `assert.strictEqual`).

---

### Architecture Compliance Checklist

- [ ] Route → Handler → Domain → Repository dependency flow maintained
- [ ] No `console.log` — use `pino` logger if logging is needed (injected via Awilix)
- [ ] TypeScript strict mode — no `any` except in test mocks
- [ ] Biome formatting — single quotes, no semicolons (see `biome.json`)
- [ ] DI token names match `formatName` algorithm (camelCase from filename)
- [ ] `todo.domain.ts` auto-loaded by Awilix glob `**/*.domain.{js,ts}`
- [ ] `create-todo.handler.ts` auto-loaded by Awilix glob `**/*.handler.{js,ts}` with `asyncInit: 'init'`
- [ ] `create-todo.route.ts` auto-loaded by AutoLoad with `/api` prefix and `matchFilter: /\.route\.ts$/`

### References

- Architecture: [\_bmad-output/planning-artifacts/architecture.md](_bmad-output/planning-artifacts/architecture.md)
- PRD/Epics: [\_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md#story-22-create-todo-api-endpoint)
- Previous story: [\_bmad-output/implementation-artifacts/2-1-find-todos-api-endpoint.md](_bmad-output/implementation-artifacts/2-1-find-todos-api-endpoint.md)
- User module create command (reference): `apps/api/src/modules/user/commands/create-user/`
- Shared TypeBox schemas: `packages/shared/src/todos/todos.schema.ts`
- SqlRepositoryBase: `apps/api/src/shared/db/sql-repository.base.ts`
- DI util (formatName): `apps/api/src/server/di/util.ts`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (GitHub Copilot)

### Debug Log References

### Completion Notes List

### File List
