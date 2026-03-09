import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';
import makeCreateTodo, { createTodoCommand } from './create-todo.handler.ts';

const mockTodoEntity = (overrides: Partial<TodoEntity> = {}): TodoEntity => ({
  id: '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231',
  description: 'Buy groceries',
  completed: false,
  createdAt: new Date('2026-03-09T10:00:00.000Z'),
  updatedAt: new Date('2026-03-09T10:00:00.000Z'),
  ...overrides,
});

describe('CreateTodo handler', () => {
  it('creates a todo and inserts it into the repository', async () => {
    const todo = mockTodoEntity();
    const todoDomain = { createTodo: mock.fn(() => todo) } as any;
    const todoRepository = {
      insert: mock.fn(async () => undefined),
    } as any;
    const commandBus = { register: mock.fn() } as any;

    const handler = makeCreateTodo({
      todoDomain,
      todoRepository,
      commandBus,
    } as any);
    const result = await handler.handler({
      payload: { description: 'Buy groceries' },
    } as any);

    assert.equal(todoDomain.createTodo.mock.calls.length, 1);
    assert.deepEqual(todoDomain.createTodo.mock.calls[0].arguments[0], {
      description: 'Buy groceries',
    });
    assert.equal(todoRepository.insert.mock.calls.length, 1);
    assert.equal(todoRepository.insert.mock.calls[0].arguments[0], todo);
    assert.deepEqual(result, todo);
  });

  it('registers handler with commandBus on init', () => {
    const todoDomain = { createTodo: mock.fn() } as any;
    const todoRepository = { insert: mock.fn() } as any;
    const commandBus = { register: mock.fn() } as any;

    const handler = makeCreateTodo({
      todoDomain,
      todoRepository,
      commandBus,
    } as any);
    handler.init();
    assert.equal(commandBus.register.mock.calls.length, 1);
    assert.equal(commandBus.register.mock.calls[0].arguments[0], createTodoCommand.type);
    assert.equal(commandBus.register.mock.calls[0].arguments[1], handler.handler);
  });
});
