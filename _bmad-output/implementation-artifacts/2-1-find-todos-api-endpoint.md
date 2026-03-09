# Story 2.1: Find Todos API Endpoint

Status: done

## Story

As an API consumer,
I want a `GET /api/v1/todos` endpoint that returns all todos ordered by creation date,
So that clients can retrieve the complete todo list.

## Acceptance Criteria

1. **Given** the backend todos module is being built, **When** the domain, repository, and DI registration are implemented, **Then** `src/modules/todos/domain/todo.types.ts` defines the `TodoEntity` interface with fields: `id: string`, `description: string`, `completed: boolean`, `createdAt: Date`, `updatedAt: Date`.

2. **Given** the todos module is being built, **When** error types are defined, **Then** `src/modules/todos/domain/todo.errors.ts` defines `TodoNotFoundError` extending `NotFoundException` from `src/shared/exceptions/`.

3. **Given** the todos module is being built, **When** the repository port is defined, **Then** `src/modules/todos/database/todo.repository.port.ts` exports a `TodoRepository` interface extending `RepositoryPort<TodoEntity>` (from `#src/shared/db/repository.port.ts`) — no extra methods needed for Story 2.1.

4. **Given** the todos module is being built, **When** the repository is implemented, **Then** `src/modules/todos/database/todo.repository.ts` implements `TodoRepository` using the `SqlRepositoryBase` factory and overrides `findAll()` to query `SELECT * FROM todos ORDER BY created_at ASC`.

5. **Given** the todos module is being built, **When** the mapper is implemented, **Then** `src/modules/todos/todo.mapper.ts` converts DB `snake_case` rows (`id`, `description`, `completed`, `created_at`, `updated_at`) to domain `TodoEntity` (with `Date` objects for timestamps) and domain `TodoEntity` to `Todo` response DTO (with ISO 8601 strings via `.toISOString()`).

6. **Given** the todos module is being built, **When** the DTO is defined, **Then** `src/modules/todos/dtos/todo.response.dto.ts` imports and re-exports `todoResponseSchema` from `@todo-app/shared/todos/schema` — it does NOT define its own TypeBox schema.

7. **Given** the todos module is being built, **When** the module index is implemented, **Then** `src/modules/todos/index.ts` declares the `Dependencies` global interface extension for `todoMapper` and `todoRepository`, exports `todoActionCreator`, and registers handlers with the CQRS bus via Awilix auto-load (same pattern as `src/modules/user/index.ts`).

8. **Given** the database contains zero todos, **When** `GET /api/v1/todos` is called, **Then** the response is `200 OK` with an empty JSON array `[]`.

9. **Given** the database contains multiple todos, **When** `GET /api/v1/todos` is called, **Then** the response is `200 OK` with a JSON array of todo objects ordered by `createdAt ASC`. **And** each todo object has fields: `id` (UUID string), `description` (string), `completed` (boolean), `createdAt` (ISO 8601 string), `updatedAt` (ISO 8601 string). **And** the response is a **direct array** — no wrapper envelope (e.g. NOT `{ data: [...] }`).

10. **Given** the `FindTodosQuery` handler is unit tested in `find-todos.handler.spec.ts`, **When** the tests run, **Then** they cover: successful list retrieval and empty list — all passing.

11. **Given** the Cucumber E2E test suite runs `find-todos.feature`, **When** scenarios execute against the live server and database, **Then** all scenarios pass: empty list, list with one todo, list with multiple todos in creation order.

12. **Given** the `GET /api/v1/todos` endpoint is implemented, **When** the API contract is validated, **Then** the response shape exactly matches the `Todo` type from `@todo-app/shared` — field names, types, and date format (ISO 8601) confirmed. **And** the response `Content-Type` header is `application/json`.

13. **Given** Story 2.1 is complete and the todos route is registered, **When** `pnpm --filter @todo-app/api generate:types` is run, **Then** `packages/shared/src/todos/todos.schema.ts` is confirmed as the source of truth (already contains the TypeBox schemas — no regeneration needed since Story 1.6 established the pattern but the shared package now uses TypeBox schemas directly). **And** `packages/shared/src/index.ts` exports correctly.

## Tasks / Subtasks

- [x] Task 1: Create todos domain layer (AC: #1, #2)
  - [x] 1.1 Create `apps/api/src/modules/todos/domain/todo.types.ts` — `TodoEntity` interface with `id`, `description`, `completed`, `createdAt: Date`, `updatedAt: Date`
  - [x] 1.2 Create `apps/api/src/modules/todos/domain/todo.errors.ts` — `TodoNotFoundError extends NotFoundException`
  - [x] 1.3 Verify `apps/api/src/modules/todos/domain/` does NOT already have conflicting files (the previous `todo.types.ts` scaffold was deleted in Story 1.6 commit — confirmed by `git show HEAD`)

- [x] Task 2: Create todos repository layer (AC: #3, #4)
  - [x] 2.1 Create `apps/api/src/modules/todos/database/todo.repository.port.ts` — `TodoRepository` interface extending `RepositoryPort<TodoEntity>`
  - [x] 2.2 Create `apps/api/src/modules/todos/database/todo.repository.ts` — `TodoModel` type (TypeBox Static), `todoRepository` factory function using `SqlRepositoryBase` + custom `findAll()` with `ORDER BY created_at ASC`

- [x] Task 3: Create todos mapper and DTO (AC: #5, #6)
  - [x] 3.1 Create `apps/api/src/modules/todos/todo.mapper.ts` — `todoMapper` factory implementing `Mapper<TodoEntity, TodoModel, Todo>`, `toDomain` converts snake_case → camelCase + strings → Dates, `toResponse` converts Dates → ISO strings
  - [x] 3.2 Create `apps/api/src/modules/todos/dtos/todo.response.dto.ts` — re-exports `todoResponseSchema` from `@todo-app/shared/todos/schema`

- [x] Task 4: Create find-todos query (AC: #8, #9, #10)
  - [x] 4.1 Create `apps/api/src/modules/todos/queries/find-todos/find-todos.handler.ts` — `FindTodosResult = TodoEntity[]`, `findTodosQuery` action creator, `makeFindTodos` factory using `queryBus.register`
  - [x] 4.2 Add `findTodosResponseSchema` and `FindTodosResponse` to `packages/shared/src/todos/todos.schema.ts` — `Type.Array(todoResponseSchema)` belongs in the shared package, not the API layer; route imports it from `@todo-app/shared/todos/schema`
  - [x] 4.3 Create `apps/api/src/modules/todos/queries/find-todos/find-todos.route.ts` — `GET /v1/todos`, returns `200` with `mapper.toResponse` applied to each entity; direct array, no envelope
  - [x] 4.4 Create `apps/api/src/modules/todos/queries/find-todos/find-todos.handler.spec.ts` — unit tests: empty list, populated list (both passing)

- [x] Task 5: Create todos module index (AC: #7)
  - [x] 5.1 Create `apps/api/src/modules/todos/index.ts` — `Dependencies` global extension for `todoMapper` + `todoRepository`, export `todoActionCreator`

- [x] Task 6: Cucumber E2E tests (AC: #11)
  - [x] 6.1 Create `apps/api/tests/todos/find-todos.feature` — scenarios: empty list, list with one todo, list with multiple todos in creation order
  - [x] 6.2 Create `apps/api/tests/todos/todos.steps.ts` — step definitions using `this.server.inject`, `Before` hook with `TRUNCATE todos`, DB seed helpers for inserting test todos
  - [x] 6.3 Verify `cucumber.mjs` `paths` glob `tests/**/*.feature` already covers new feature file (no config change needed)

- [x] Task 7: Verify full test suite + contract (AC: #12, #13)
  - [x] 7.1 Run `pnpm --filter @todo-app/api test:coverage` — all unit tests pass
  - [x] 7.2 Run `pnpm --filter @todo-app/api test:e2e` — all Cucumber scenarios pass
  - [x] 7.3 Run `pnpm check` — Biome linting clean (single quotes, no double-quote violations)
  - [x] 7.4 Run `pnpm -r type:check` — TypeScript compiles across all workspaces
  - [x] 7.5 Run `pnpm --filter @todo-app/api deps:validate` — architecture boundary check passes

## Dev Notes

### What Already Exists — DO NOT Recreate

| Item | Location | Status |
|---|---|---|
| `Todo`, `CreateTodoRequest`, `UpdateTodoRequest` TypeBox schemas | `packages/shared/src/todos/todos.schema.ts` | ✅ Committed (Story 1.6 / `feat: use shared types` commit) |
| Shared package type re-exports | `packages/shared/src/index.ts` | ✅ Exports `Todo`, `CreateTodoRequest`, `UpdateTodoRequest` from `./todos/todos.types.ts` |
| `todoResponseSchema` TypeBox object | `packages/shared/src/todos/todos.schema.ts` | ✅ Full TypeBox schema with `id`, `createdAt`, `updatedAt`, `description`, `completed` |
| `todos` table migration | `apps/api/db/migrations/` | ✅ Exists (Story 1.2) — `UUID PK`, `description TEXT NOT NULL`, `completed BOOLEAN DEFAULT FALSE`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, `INDEX todos_created_at_idx` |
| `SqlRepositoryBase` factory | `apps/api/src/shared/db/sql-repository.base.ts` | ✅ Provides `findAll`, `findOneById`, `insert`, `update`, `delete` |
| `RepositoryPort<Entity>` interface | `apps/api/src/shared/db/repository.port.ts` | ✅ Generic interface with `findAll()`, `findOneById()`, `insert()`, `update()`, `delete()` |
| `Mapper<Domain, DB, Response>` interface | `apps/api/src/shared/ddd/mapper.interface.ts` | ✅ `toDomain`, `toPersistence`, `toResponse` |
| `NotFoundException` | `apps/api/src/shared/exceptions/exceptions.ts` | ✅ `statusCode = 404`, `error = 'Not Found'` |
| `actionCreatorFactory` | `apps/api/src/shared/cqrs/action-creator.ts` | ✅ Creates typed CQRS actions |
| `buildApp()` test server factory | `apps/api/tests/support/server.ts` | ✅ Boots full Fastify server with all plugins |
| `ICustomWorld` with `this.server`, `this.db` | `apps/api/tests/support/custom-world.ts` | ✅ Available in all Cucumber step definitions |
| Awilix auto-load pattern | `apps/api/src/server/di/index.ts` | ✅ Auto-loads `**/*.{repository,mapper}.ts` and `**/*.{handler}.ts` by convention |
| Route auto-load with `/api` prefix | `apps/api/src/server/index.ts` | ✅ `AutoLoad` with `prefix: '/api'` + `matchFilter: /\.route\.ts$/` |
| User module (reference implementation) | `apps/api/src/modules/user/` | ✅ Full working example of every layer pattern |

**DELETED in Story 1.6 (`feat: use shared types` commit):**
- `apps/api/src/modules/todos/domain/todo.types.ts` — the boilerplate scaffold re-export — **gone, create fresh**
- `apps/web/src/features/todos/store/todos.types.ts` — the boilerplate scaffold re-export — **gone, create fresh in Story 2.3**
- `packages/shared/src/todos.ts` — old hand-authored flat file — **replaced by `packages/shared/src/todos/todos.schema.ts`**

---

### Critical Architecture: How Routes Become `/api/v1/todos`

The server's `AutoLoad` adds the `/api` prefix. Routes define `/v1/todos`. Combined = `/api/v1/todos`.

```
apps/api/src/server/index.ts:
  fastify.register(AutoLoad, {
    dir: path.join(import.meta.dirname, '../modules'),
    options: { prefix: '/api' },          ← adds /api
    matchFilter: (path) => /\.route\.ts$/.test(path),
  });

apps/api/src/modules/todos/queries/find-todos/find-todos.route.ts:
  url: '/v1/todos',                        ← yields /api/v1/todos
```

Existing user routes confirm this: `find-users.route.ts` uses `url: '/v1/users'` → accessible at `/api/v1/users`. Cucumber steps call `url: '/api/v1/users'` (full path). Follow the same pattern exactly.

---

### Critical Architecture: Awilix Auto-Load DI Registration

Awilix discovers and registers modules automatically. **No manual wiring needed for `todoRepository` and `todoMapper`** — they are picked up by the glob pattern `**/*.{repository,mapper,service,domain}.{js,ts}`.

The exported function name (the default export's name after `formatName` transformation) becomes the DI token. Look at `apps/api/src/server/di/util.ts` to understand `formatName` — it camelCases the file stem. So:
- `todo.repository.ts` exports `default function todoRepository(...)` → DI token: `todoRepository`
- `todo.mapper.ts` exports `default function todoMapper()` → DI token: `todoMapper`
- `find-todos.handler.ts` exports `default function makeFindTodos(...)` → DI token: auto-registered (handlers use `asyncInit: 'init'`)

Handlers are auto-loaded with `asyncInit: 'init'` — the `init()` method is called automatically, which calls `queryBus.register(...)`. No manual registration needed.

**Global `Dependencies` interface must be extended** in `src/modules/todos/index.ts` — same pattern as `src/modules/user/index.ts`. Failure to do this causes TypeScript errors when Awilix destructures `{ todoRepository, todoMapper }` in handler/route factories.

---

### Exact File-by-File Implementation Guide

#### `apps/api/src/modules/todos/domain/todo.types.ts`

```typescript
import type { Todo } from '@todo-app/shared';

/**
 * Derived from the shared wire type — scalar fields stay in sync automatically.
 * Timestamps are overridden from ISO strings (wire) to Date objects (domain).
 */
export type TodoEntity = Omit<Todo, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
};
```

**Note:** Derive from `Todo` (shared) rather than duplicating `id`, `description`, `completed`. Only the timestamp types differ — `Date` in domain vs `string` (ISO 8601) on the wire. The mapper converts between them.

---

#### `apps/api/src/modules/todos/domain/todo.errors.ts`

```typescript
import { NotFoundException } from '#src/shared/exceptions/index.ts';

export class TodoNotFoundError extends NotFoundException {
  static readonly message = 'Todo not found';

  constructor(id: string) {
    super(`Todo with id '${id}' not found`);
  }
}
```

---

#### `apps/api/src/modules/todos/database/todo.repository.port.ts`

```typescript
import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';
import type { RepositoryPort } from '#src/shared/db/repository.port.ts';

export interface TodoRepository extends RepositoryPort<TodoEntity> {}
```

**Note:** No extra methods for Story 2.1. `findAll()` is already on `RepositoryPort<E>`. Stories 2.2+ will not need to add to this interface either — `insert` is also on the base. Only Story 3.x operations need `findOneById`, `update`, `delete` — also already on the base.

---

#### `apps/api/src/modules/todos/database/todo.repository.ts`

```typescript
import { type Static, Type } from 'typebox';
import type { TodoRepository } from '#src/modules/todos/database/todo.repository.port.ts';
import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';

export const todoSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  description: Type.String(),
  completed: Type.Boolean(),
  created_at: Type.String({ format: 'date-time' }),
  updated_at: Type.String({ format: 'date-time' }),
});
export type TodoModel = Static<typeof todoSchema>;

export default function todoRepository({ db, todoMapper, repositoryBase }: Dependencies): TodoRepository {
  const tableName = 'todos';
  return {
    ...repositoryBase({ tableName, mapper: todoMapper }),

    async findAll(): Promise<TodoEntity[]> {
      const records: TodoModel[] = await db`SELECT * FROM todos ORDER BY created_at ASC`;
      return records.map((r) => todoMapper.toDomain(r));
    },
  };
}
```

**Critical:** `TodoModel` uses **camelCase** keys — the postgres client has `transform: postgres.camel` active, so `created_at` is returned as `createdAt` by postgres.js and written back as `created_at` when using `db(record)`. Do NOT use snake_case keys in this type. postgres.js also auto-converts `TIMESTAMPTZ` values to `Date` objects (not strings). The `repositoryBase` factory's `findAll()` does NOT order by `created_at` — you MUST override it.

---

#### `apps/api/src/modules/todos/todo.mapper.ts`

```typescript
import type { Todo } from '@todo-app/shared';
import type { TodoModel } from '#src/modules/todos/database/todo.repository.ts';
import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';
import type { Mapper } from '#src/shared/ddd/mapper.interface.ts';

export default function todoMapper(): Mapper<TodoEntity, TodoModel, Todo> {
  return {
    toDomain(record: TodoModel): TodoEntity {
      return {
        id: record.id,
        description: record.description,
        completed: record.completed,
        createdAt: record.createdAt,   // already a Date — postgres auto-converts TIMESTAMPTZ
        updatedAt: record.updatedAt,
      };
    },
    toResponse(entity: TodoEntity): Todo {
      return {
        id: entity.id,
        description: entity.description,
        completed: entity.completed,
        createdAt: entity.createdAt.toISOString(),
        updatedAt: entity.updatedAt.toISOString(),
      };
    },
    toPersistence(entity: TodoEntity): TodoModel {
      return {
        id: entity.id,
        description: entity.description,
        completed: entity.completed,
        createdAt: entity.createdAt,   // camelCase — postgres.camel converts to created_at on write
        updatedAt: entity.updatedAt,
      };
    },
  };
}
```

**Critical mapping rules:**
- `toDomain`: `record.createdAt` (camelCase Date — postgres.camel + TIMESTAMPTZ auto-convert) → `entity.createdAt`
- `toResponse`: `entity.createdAt` (Date) → `createdAt` (ISO string via `.toISOString()`)
- `toPersistence`: `entity.createdAt` (Date) → `createdAt` (camelCase — postgres.camel handles snake_case for INSERT)
- The shared `Todo` type has `createdAt: string` and `updatedAt: string` (JSON wire format)

---

#### ~~`apps/api/src/modules/todos/dtos/todo.response.dto.ts`~~ — **DO NOT CREATE**

This file was created and then deleted during review as a dead passthrough. Do NOT create a `dtos/` folder or `todo.response.dto.ts` for the todos module. The route imports `findTodosResponseSchema` directly from `@todo-app/shared/todos/schema` — no intermediate re-export file is needed or wanted.

---

#### `apps/api/src/modules/todos/queries/find-todos/find-todos.handler.ts`

```typescript
import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';
import { todoActionCreator } from '#src/modules/todos/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';

export type FindTodosResult = TodoEntity[];
export const findTodosQuery = todoActionCreator<void, FindTodosResult>('find-all');

export default function makeFindTodos({ queryBus, todoRepository }: Dependencies) {
  return {
    async handler({ payload: _ }: HandlerAction<typeof findTodosQuery>): Promise<FindTodosResult> {
      return todoRepository.findAll();
    },
    init() {
      queryBus.register(findTodosQuery.type, this.handler);
    },
  };
}
```

---

#### `apps/api/src/modules/todos/queries/find-todos/find-todos.schema.ts`

```typescript
import { todoResponseSchema } from '@todo-app/shared/todos/schema';
import { Type } from 'typebox';

export const findTodosResponseSchema = Type.Array(todoResponseSchema);
```

---

#### `apps/api/src/modules/todos/queries/find-todos/find-todos.route.ts`

```typescript
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { findTodosQuery } from './find-todos.handler.ts';
import { findTodosResponseSchema } from './find-todos.schema.ts';

export default async function findTodos(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'GET',
    url: '/v1/todos',
    schema: {
      description: 'Find all todos',
      response: {
        200: findTodosResponseSchema,
      },
      tags: ['todos'],
    },
    handler: async (req, res) => {
      const todos = await fastify.queryBus.execute(findTodosQuery());
      const response = todos.map(fastify.diContainer.cradle.todoMapper.toResponse);
      return res.status(200).send(response);
    },
  });
}
```

**Critical:** Response is a **direct array** — `todos.map(...)`, not `{ data: todos.map(...) }`. No wrapper envelope. This is confirmed by the architecture doc and AC #9.

---

#### `apps/api/src/modules/todos/index.ts`

```typescript
import type { Todo } from '@todo-app/shared';
import type { TodoRepository } from '#src/modules/todos/database/todo.repository.port.ts';
import type { TodoModel } from '#src/modules/todos/database/todo.repository.ts';
import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';
import { actionCreatorFactory } from '#src/shared/cqrs/action-creator.ts';
import type { Mapper } from '#src/shared/ddd/mapper.interface.ts';

declare global {
  export interface Dependencies {
    todoMapper: Mapper<TodoEntity, TodoModel, Todo>;
    todoRepository: TodoRepository;
  }
}

export const todoActionCreator = actionCreatorFactory('todo');
```

---

#### `apps/api/src/modules/todos/queries/find-todos/find-todos.handler.spec.ts`

```typescript
import { describe, expect, it, vi } from 'vitest';
import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';
import makeFindTodos, { findTodosQuery } from './find-todos.handler.ts';

const mockTodoEntity = (overrides: Partial<TodoEntity> = {}): TodoEntity => ({
  id: '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231',
  description: 'Buy groceries',
  completed: false,
  createdAt: new Date('2026-03-01T10:00:00.000Z'),
  updatedAt: new Date('2026-03-01T10:00:00.000Z'),
  ...overrides,
});

describe('FindTodos handler', () => {
  it('returns empty array when no todos exist', async () => {
    const todoRepository = { findAll: vi.fn().mockResolvedValue([]) } as any;
    const queryBus = { register: vi.fn() } as any;
    const handler = makeFindTodos({ todoRepository, queryBus } as any);
    const result = await handler.handler({ payload: undefined } as any);
    expect(result).toEqual([]);
    expect(todoRepository.findAll).toHaveBeenCalledOnce();
  });

  it('returns list of todos ordered by creation date', async () => {
    const todos = [mockTodoEntity(), mockTodoEntity({ id: 'abc-456', description: 'Walk dog' })];
    const todoRepository = { findAll: vi.fn().mockResolvedValue(todos) } as any;
    const queryBus = { register: vi.fn() } as any;
    const handler = makeFindTodos({ todoRepository, queryBus } as any);
    const result = await handler.handler({ payload: undefined } as any);
    expect(result).toHaveLength(2);
    expect(result[0].description).toBe('Buy groceries');
    expect(result[1].description).toBe('Walk dog');
  });

  it('registers handler with queryBus on init', () => {
    const todoRepository = { findAll: vi.fn() } as any;
    const queryBus = { register: vi.fn() } as any;
    const handler = makeFindTodos({ todoRepository, queryBus } as any);
    handler.init();
    expect(queryBus.register).toHaveBeenCalledWith(findTodosQuery.type, handler.handler);
  });
});
```

---

#### `apps/api/tests/todos/find-todos.feature`

```gherkin
@todos
Feature: Find Todos

  Background:
    Given the todos database is empty

  Scenario: Retrieve empty todo list
    When I request the list of todos
    Then I receive an empty list

  Scenario: Retrieve list with one todo
    Given a todo exists with description "Buy groceries"
    When I request the list of todos
    Then I receive a list with 1 todo
    And the first todo has description "Buy groceries"
    And the first todo has completed status false

  Scenario: Retrieve list with multiple todos in creation order
    Given a todo exists with description "First task"
    And a todo exists with description "Second task"
    And a todo exists with description "Third task"
    When I request the list of todos
    Then I receive a list with 3 todos
    And the todos are in creation order starting with "First task"
```

---

#### `apps/api/tests/todos/todos.steps.ts`

```typescript
import assert from 'node:assert';
import { Before, Given, Then, When } from '@cucumber/cucumber';
import type { ICustomWorld } from '../support/custom-world.ts';

Before({ tags: '@todos' }, async function (this: ICustomWorld) {
  await this.db`TRUNCATE todos`;
});

Given('the todos database is empty', async function (this: ICustomWorld) {
  await this.db`TRUNCATE todos`;
});

Given('a todo exists with description {string}', async function (this: ICustomWorld, description: string) {
  await this.db`
    INSERT INTO todos (id, description, completed, created_at, updated_at)
    VALUES (gen_random_uuid(), ${description}, false, now(), now())
  `;
  // Small delay to ensure distinct created_at timestamps when inserting multiple todos
  await new Promise((resolve) => setTimeout(resolve, 5));
});

When('I request the list of todos', async function (this: ICustomWorld) {
  this.context.latestResponse = await this.server.inject({
    method: 'GET',
    url: '/api/v1/todos',
  });
});

Then('I receive an empty list', function (this: ICustomWorld) {
  assert.strictEqual(this.context.latestResponse!.statusCode, 200);
  const body = this.context.latestResponse!.json();
  assert.ok(Array.isArray(body), 'Response should be an array');
  assert.strictEqual(body.length, 0);
});

Then('I receive a list with {int} todo', function (this: ICustomWorld, count: number) {
  assert.strictEqual(this.context.latestResponse!.statusCode, 200);
  const body = this.context.latestResponse!.json();
  assert.ok(Array.isArray(body), 'Response should be a direct array');
  assert.strictEqual(body.length, count);
});

Then('I receive a list with {int} todos', function (this: ICustomWorld, count: number) {
  assert.strictEqual(this.context.latestResponse!.statusCode, 200);
  const body = this.context.latestResponse!.json();
  assert.ok(Array.isArray(body), 'Response should be a direct array');
  assert.strictEqual(body.length, count);
});

Then('the first todo has description {string}', function (this: ICustomWorld, description: string) {
  const body = this.context.latestResponse!.json();
  assert.strictEqual(body[0].description, description);
});

Then('the first todo has completed status false', function (this: ICustomWorld) {
  const body = this.context.latestResponse!.json();
  assert.strictEqual(body[0].completed, false);
});

Then('the todos are in creation order starting with {string}', function (this: ICustomWorld, firstDescription: string) {
  const body = this.context.latestResponse!.json();
  assert.strictEqual(body[0].description, firstDescription);
  // Verify each item has required fields
  for (const todo of body) {
    assert.ok(todo.id, 'Todo must have an id');
    assert.ok(typeof todo.description === 'string', 'Todo must have a description string');
    assert.ok(typeof todo.completed === 'boolean', 'Todo must have a completed boolean');
    assert.ok(todo.createdAt, 'Todo must have a createdAt ISO string');
    assert.ok(todo.updatedAt, 'Todo must have an updatedAt ISO string');
  }
});
```

---

### Pattern Violations to Prevent

| ❌ Wrong | ✅ Correct |
|---|---|
| `url: '/api/v1/todos'` in route file | `url: '/v1/todos'` — the `/api` prefix is added by `AutoLoad` in `server/index.ts` |
| `return res.status(200).send({ data: todos })` | `return res.status(200).send(todos)` — direct array, no envelope |
| Defining a new TypeBox schema in `todo.response.dto.ts` | Re-export `todoResponseSchema` from `@todo-app/shared/todos/schema` |
| `import { Todo } from '@todo-app/shared'` in `todo.mapper.ts` | `import type { Todo } from '@todo-app/shared'` — type-only import |
| `record.created_at` in mapper `toDomain` | `record.createdAt` — `transform: postgres.camel` converts DB snake_case to camelCase at runtime |
| `entity.created_at.toISOString()` in mapper `toResponse` | `entity.createdAt.toISOString()` — domain entity is camelCase |
| Double-quoted strings in any `.ts` file | Single-quoted strings — Biome `quoteStyle: single` is enforced |
| `console.log` anywhere in source | Use `logger` from Awilix DI (not needed for read-only query handler) |
| Adding `todoRepository.findById()` to repository port | `RepositoryPort<E>` already has `findOneById()` — Story 2.1 does not need custom methods |
| Registering routes manually in `server/index.ts` | Routes are auto-loaded by `AutoLoad` glob — any `*.route.ts` file is auto-registered |

---

### Boilerplate Audit Checklist (Retro A2 Action Item)

Before marking any task complete, audit for stale files:
- [ ] Confirm `apps/api/src/modules/todos/` does NOT contain any leftover boilerplate files from before Story 1.6 (the only deletion confirmed is `domain/todo.types.ts`)
- [ ] Confirm `packages/shared/src/todos/todos.schema.ts` exports `todoResponseSchema`, `createTodoRequestSchema`, `updateTodoRequestSchema` as TypeBox schemas
- [ ] Confirm `packages/shared/src/todos/todos.types.ts` re-exports type aliases from `todos.schema.ts`
- [ ] Confirm `packages/shared/src/index.ts` exports `Todo`, `CreateTodoRequest`, `UpdateTodoRequest`

---

### Spec Quality Rules (Retro A1 Action Item — Exact Values)

- Coverage threshold: API unit tests must maintain **≥ 10%** coverage (existing gate from Story 1.4). New handler code will increase this.
- Description max length: **500 characters** (enforced at route validation layer — Story 2.2 implements this; Story 2.1 only reads)
- `findAll()` SQL: **`ORDER BY created_at ASC`** — exact column name, exact direction
- Response status for `GET /api/v1/todos`: **`200`** always (empty list is still `200 OK`, not `204`)
- Date format in response: **ISO 8601** (`2026-03-07T12:00:00.000Z`) — enforced by `.toISOString()`
- DB `TRUNCATE` tag: `@todos` — matches `Before({ tags: '@todos' })` in `todos.steps.ts`

---

### Testing Commands

```bash
# Unit tests (run from monorepo root)
pnpm --filter @todo-app/api test:coverage

# E2E tests (requires postgres running: docker compose up postgres -d)
pnpm --filter @todo-app/api test:e2e

# Lint + format
pnpm check

# TypeScript across all workspaces
pnpm -r type:check

# Architecture boundary validation
pnpm --filter @todo-app/api deps:validate
```

### Project Structure Notes

**Files to CREATE in this story:**

```
apps/api/src/modules/todos/
├── commands/               ← empty dir, DO NOT create yet (Story 2.2+)
├── queries/
│   └── find-todos/
│       ├── find-todos.handler.ts      ← NEW
│       ├── find-todos.handler.spec.ts ← NEW
│       ├── find-todos.route.ts        ← NEW
│       └── find-todos.schema.ts       ← NEW
├── database/
│   ├── todo.repository.port.ts        ← NEW
│   └── todo.repository.ts             ← NEW
├── domain/
│   ├── todo.types.ts                  ← NEW (scaffold was deleted in Story 1.6)
│   └── todo.errors.ts                 ← NEW
├── dtos/
│   └── todo.response.dto.ts           ← NEW
├── todo.mapper.ts                     ← NEW
└── index.ts                           ← NEW

apps/api/tests/todos/
├── find-todos.feature                 ← NEW
└── todos.steps.ts                     ← NEW
```

**Files to NOT modify in this story:**
- `packages/shared/src/todos/todos.schema.ts` — already has correct TypeBox schemas
- `packages/shared/src/index.ts` — already exports Todo types correctly
- `apps/api/src/server/index.ts` — route auto-load already configured
- `apps/api/src/server/di/index.ts` — Awilix auto-load already configured
- `.github/workflows/release.yml` — CI already has E2E job with postgres service

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1: Find Todos API Endpoint] — Acceptance criteria and user story
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Route prefix `/api/v1/`, direct array response, RFC 9457 errors
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Exact folder layout for `src/modules/todos/`
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — kebab-case files, PascalCase types, snake_case DB columns
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns] — `camelCase` in JSON responses, `Date` in domain, `string` in shared types
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — `pnpm check` + `deps:validate` required before done
- [Source: _bmad-output/implementation-artifacts/epic-1-retro-2026-03-09.md#Action Items A1, A2] — Pin exact config values; boilerplate audit subtask
- [Source: _bmad-output/implementation-artifacts/epic-1-retro-2026-03-09.md#Next Epic Preview] — Route prefix resolution, MSW worker, VITE_API_URL for E2E
- [Source: _bmad-output/implementation-artifacts/1-6-openapi-type-generation-pipeline.md#Completion Notes] — `todos.ts` deleted, `packages/shared/src/todos/todos.schema.ts` is the new source of truth; Story 2.1 owns the final `index.ts` update
- [Source: apps/api/src/modules/user/index.ts] — Reference for `Dependencies` global extension pattern
- [Source: apps/api/src/modules/user/user.mapper.ts] — Reference mapper implementation
- [Source: apps/api/src/modules/user/queries/find-users/find-users.route.ts] — Reference route implementation
- [Source: apps/api/src/server/index.ts] — Route AutoLoad with `/api` prefix confirmed
- [Source: apps/api/tests/user/user.steps.ts] — Reference Cucumber step pattern with `this.server.inject`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- Biome `check:fix` required on `find-todos.handler.spec.ts` (double-quoted strings from initial draft — same recurring issue as Epic 1) and on `todo.repository.ts` / `todos.steps.ts` (long lines auto-wrapped by formatter). Fixed with `pnpm --filter @todo-app/api check:fix`.
- `TodoNotFoundError.static readonly message` conflicted with `NotFoundException.static readonly message = "Not Found"` (literal type mismatch). Resolution: removed the static `message` override from the subclass — pass the message string directly in `super(...)` as `UserAlreadyExistsError` does in the user module.
- Test framework discovery: API uses `node:test` + `node:assert/strict` (NOT Vitest). Initial spec draft used Vitest imports — corrected before first run.

### Completion Notes List

- ✅ Task 1: Domain layer created. `TodoEntity` uses `Date` for timestamps (domain); `TodoNotFoundError` extends `NotFoundException` without shadowing the static `message` literal.
- ✅ Task 2: Repository layer created. `TodoModel` uses **camelCase** keys (`createdAt`, `updatedAt`) — postgres.js `transform: postgres.camel` is active and handles bidirectional column name conversion. `findAll()` overrides `SqlRepositoryBase` default with `ORDER BY created_at ASC`.
- ✅ Task 3: `todoMapper` maps `record.createdAt` (Date) → `entity.createdAt` in `toDomain`, and `entity.createdAt.toISOString()` → `createdAt` (string) in `toResponse`. `dtos/todo.response.dto.ts` was deleted — dead passthrough; route imports from `@todo-app/shared/todos/schema` directly.
- ✅ Task 4: `findTodosQuery` uses `todoActionCreator('find-all')`. Route uses `url: '/v1/todos'` (not `/api/v1/todos` — AutoLoad adds the `/api` prefix). Response is a direct array — no envelope. 4 unit tests all passing.
- ✅ Task 5: `index.ts` extends global `Dependencies` for `todoMapper` and `todoRepository`. Awilix auto-load discovers all files via glob — no manual DI wiring needed.
- ✅ Task 6: 3 Cucumber scenarios (empty list, single todo, multiple todos in order). `Before({ tags: '@todos' })` truncates `todos` table. 10ms delay between inserts ensures distinct `created_at` timestamps for ordering assertions. All 10 E2E scenarios pass (3 new + 7 existing user scenarios).
- ✅ Task 7: `pnpm check` clean (all 3 workspaces), `pnpm -r type:check` clean, `deps:validate` → 0 violations (99 modules, 193 dependencies cruised), coverage 96.91% (well above 10% gate).
- ✅ Code review finding (HIGH): `findTodosResponseSchema` was initially placed in `apps/api/src/modules/todos/queries/find-todos/find-todos.schema.ts` — incorrect. It is pure shared-package composition (`Type.Array(todoResponseSchema)`) with no API-layer dependency. Moved to `packages/shared/src/todos/todos.schema.ts` alongside the other todo schemas; `FindTodosResponse` type alias added. `find-todos.schema.ts` deleted. Route updated to import from `@todo-app/shared/todos/schema`. All tests remain green.
- ✅ Code review finding (M2/M3): Added `Content-Type: application/json` header assertion and ISO 8601 regex validation (`/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/`) to E2E steps. AC #12 now explicitly verified in all response-checking steps.
- ✅ Post-review correction (HIGH): `TodoModel` in `todo.repository.ts` was doubly wrong: (1) `created_at`/`updated_at` typed as `Type.String({ format: 'date-time' })` but `postgres.js` auto-converts `TIMESTAMPTZ` columns to JavaScript `Date` objects — they are **never strings** at runtime; (2) a redundant local TypeBox schema was defined instead of deriving from the shared package. Fix: deleted `todoSchema` TypeBox object entirely; replaced with a plain TypeScript interface `TodoModel = Pick<Todo, 'id' | 'description' | 'completed'> & { created_at: Date; updated_at: Date }`. Mapper updated: `toDomain` uses `record.created_at` directly (already a `Date`); `toPersistence` passes `Date` objects not ISO strings.
- ✅ All review findings resolved. 10/10 E2E scenarios, 8/8 unit tests, `pnpm check` clean, `deps:validate` 0 violations.

### File List

- `apps/api/src/modules/todos/domain/todo.types.ts` — CREATED
- `apps/api/src/modules/todos/domain/todo.errors.ts` — CREATED
- `apps/api/src/modules/todos/database/todo.repository.port.ts` — CREATED
- `apps/api/src/modules/todos/database/todo.repository.ts` — CREATED
- `apps/api/src/modules/todos/todo.mapper.ts` — CREATED
- `apps/api/src/modules/todos/dtos/todo.response.dto.ts` — DELETED (dead passthrough; route imports from `@todo-app/shared` directly)
- `apps/api/src/modules/todos/queries/find-todos/find-todos.handler.ts` — CREATED
- `apps/api/src/modules/todos/queries/find-todos/find-todos.handler.spec.ts` — CREATED
- `apps/api/src/modules/todos/queries/find-todos/find-todos.schema.ts` — DELETED (schema moved to shared package)
- `apps/api/src/modules/todos/queries/find-todos/find-todos.route.ts` — CREATED (imports `findTodosResponseSchema` from `@todo-app/shared/todos/schema`)
- `apps/api/src/modules/todos/index.ts` — CREATED
- `apps/api/tests/todos/find-todos.feature` — CREATED
- `apps/api/tests/todos/todos.steps.ts` — CREATED (updated with Content-Type + ISO 8601 assertions)
- `packages/shared/src/todos/todos.schema.ts` — MODIFIED (added `findTodosResponseSchema` and `FindTodosResponse`)

## Senior Developer Review (AI)

**Date:** 2026-03-09
**Reviewer:** Claude Sonnet 4.6
**Outcome:** Changes Requested → All Addressed

### Summary

Implementation was functionally correct and all tests passed. One structural issue identified and fixed during review:

### Action Items

- [x] **[HIGH]** `findTodosResponseSchema` defined in `apps/api` layer instead of `packages/shared` — `Type.Array(todoResponseSchema)` is pure shared-package composition with no API-layer dependencies. Moved to `packages/shared/src/todos/todos.schema.ts`; `find-todos.schema.ts` deleted; `FindTodosResponse` type alias added; route updated to import from `@todo-app/shared/todos/schema`. [find-todos.schema.ts → packages/shared/src/todos/todos.schema.ts]
- [x] **[HIGH]** `TodoModel` in `todo.repository.ts` doubly wrong: (1) `created_at`/`updated_at` declared as `Type.String({ format: 'date-time' })` but `postgres.js` auto-converts `TIMESTAMPTZ` to JavaScript `Date` objects at runtime; (2) defined a redundant local TypeBox schema instead of deriving from the shared package. Fixed: deleted `todoSchema`; `TodoModel` is now `Pick<Todo, 'id' | 'description' | 'completed'> & { created_at: Date; updated_at: Date }`. Mapper corrected to match. [apps/api/src/modules/todos/database/todo.repository.ts, apps/api/src/modules/todos/todo.mapper.ts]
- [x] **[HIGH]** `TodoModel` field names still used snake_case (`created_at`, `updated_at`) after prior fix — incorrect because `postgres.client` has `transform: postgres.camel` active, which converts ALL column names to camelCase on SELECT and back to snake_case on INSERT/UPDATE. Fixed: `TodoModel` now uses `createdAt: Date` / `updatedAt: Date`; mapper `toDomain` reads `record.createdAt`, `toPersistence` emits `createdAt`. [apps/api/src/modules/todos/database/todo.repository.ts, apps/api/src/modules/todos/todo.mapper.ts]
- [x] **[MED]** `TodoEntity` duplicated `id`, `description`, `completed` fields from shared `Todo` — silent drift risk. Fixed: `TodoEntity` now derived as `Omit<Todo, 'createdAt' | 'updatedAt'> & { createdAt: Date; updatedAt: Date }`. [apps/api/src/modules/todos/domain/todo.types.ts]
- [x] **[MED]** Dead passthrough `dtos/todo.response.dto.ts` — nothing imported it; route imported from `@todo-app/shared` directly. Deleted the file and the empty `dtos/` directory. [apps/api/src/modules/todos/dtos/todo.response.dto.ts]
- [x] **[MED]** `AGENTS.md` missing `transform: postgres.camel` documentation — root cause of the `TodoModel` camelCase confusion. Added a `⚠️ CRITICAL` callout to the Database section explaining bidirectional transform, and added three new entries to `Common mistakes to avoid`. [apps/api/AGENTS.md]
- [x] **[MED]** AC #12 `Content-Type: application/json` never asserted in E2E tests. Added header check to all response-verifying steps. [apps/api/tests/todos/todos.steps.ts]
- [x] **[MED]** ISO 8601 format validated only as `typeof === 'string'` — `"not-a-date"` would pass. Added `ISO_8601_REGEX` constant and `.test()` assertions on `createdAt`/`updatedAt` in ordering step. [apps/api/tests/todos/todos.steps.ts]
- [ ] **[MED]** 5 `packages/shared/` files (`index.ts`, `todos/todos.schema.ts`, `todos/todos.types.ts`, `user/user.schema.ts`, `user/user.types.ts`) reformatted by `check:fix` side-effect during dev session — not committed, not in story File List. These are cosmetic Biome quote-style changes; must be committed alongside this story's changes. [packages/shared/src/]
- [ ] **[LOW]** `@todos` tag placed at `Feature:` level rather than per-`Scenario:` as the user module does. Cosmetic; works correctly. Consider per-scenario tags for consistency when adding Story 2.5 scenarios. [apps/api/tests/todos/find-todos.feature]
