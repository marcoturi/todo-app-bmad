import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { TodoNotFoundError } from '#src/modules/todos/domain/todo.errors.ts';
import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';
import makeDeleteTodo, { deleteTodoCommand } from './delete-todo.handler.ts';

const mockTodoEntity = (overrides: Partial<TodoEntity> = {}): TodoEntity => ({
  id: '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231',
  description: 'Buy groceries',
  completed: false,
  createdAt: new Date('2026-03-10T10:00:00.000Z'),
  updatedAt: new Date('2026-03-10T10:00:00.000Z'),
  ...overrides,
});

describe('DeleteTodo handler', () => {
  it('deletes an existing todo successfully', async () => {
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
    assert.equal(todoRepository.findOneById.mock.calls[0].arguments[0], existing.id);
    assert.equal(todoRepository.delete.mock.calls.length, 1);
    assert.equal(todoRepository.delete.mock.calls[0].arguments[0], existing.id);
    assert.equal(result, null);
  });

  it('throws TodoNotFoundError when todo does not exist', async () => {
    const todoRepository = {
      findOneById: mock.fn(async () => undefined),
      delete: mock.fn(),
    } as any;
    const commandBus = { register: mock.fn() } as any;

    const handler = makeDeleteTodo({ todoRepository, commandBus } as any);
    await assert.rejects(
      () => handler.handler({ payload: { id: 'missing-id' } } as any),
      TodoNotFoundError,
    );
    assert.equal(todoRepository.delete.mock.calls.length, 0);
  });

  it('registers handler with commandBus on init', () => {
    const todoRepository = { findOneById: mock.fn(), delete: mock.fn() } as any;
    const commandBus = { register: mock.fn() } as any;

    const handler = makeDeleteTodo({ todoRepository, commandBus } as any);
    handler.init();

    assert.equal(commandBus.register.mock.calls.length, 1);
    assert.equal(commandBus.register.mock.calls[0].arguments[0], deleteTodoCommand.type);
    assert.equal(commandBus.register.mock.calls[0].arguments[1], handler.handler);
  });
});
