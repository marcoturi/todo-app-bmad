import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
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
    const findAll = mock.fn(async () => []);
    const todoRepository = { findAll } as any;
    const queryBus = { register: mock.fn() } as any;
    const handler = makeFindTodos({ todoRepository, queryBus } as any);

    const result = await handler.handler({ payload: undefined } as any);

    assert.deepEqual(result, []);
    assert.equal(findAll.mock.calls.length, 1);
  });

  it('returns list of todos when todos exist', async () => {
    const todos = [
      mockTodoEntity(),
      mockTodoEntity({ id: 'abc-456', description: 'Walk the dog' }),
    ];
    const findAll = mock.fn(async () => todos);
    const todoRepository = { findAll } as any;
    const queryBus = { register: mock.fn() } as any;
    const handler = makeFindTodos({ todoRepository, queryBus } as any);

    const result = await handler.handler({ payload: undefined } as any);

    assert.equal(result.length, 2);
    assert.equal(result[0].description, 'Buy groceries');
    assert.equal(result[1].description, 'Walk the dog');
  });

  it('returns todos with correct entity shape', async () => {
    const todo = mockTodoEntity();
    const findAll = mock.fn(async () => [todo]);
    const todoRepository = { findAll } as any;
    const queryBus = { register: mock.fn() } as any;
    const handler = makeFindTodos({ todoRepository, queryBus } as any);

    const result = await handler.handler({ payload: undefined } as any);

    assert.equal(result[0].id, '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231');
    assert.equal(result[0].description, 'Buy groceries');
    assert.equal(result[0].completed, false);
    assert.ok(result[0].createdAt instanceof Date);
    assert.ok(result[0].updatedAt instanceof Date);
  });

  it('registers handler with queryBus on init', () => {
    const todoRepository = { findAll: mock.fn() } as any;
    const register = mock.fn();
    const queryBus = { register } as any;
    const handler = makeFindTodos({ todoRepository, queryBus } as any);

    handler.init();

    assert.equal(register.mock.calls.length, 1);
    assert.equal(register.mock.calls[0].arguments[0], findTodosQuery.type);
    assert.equal(register.mock.calls[0].arguments[1], handler.handler);
  });
});
