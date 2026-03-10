import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { TodoNotFoundError } from '#src/modules/todos/domain/todo.errors.ts';
import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';
import makeUpdateTodo, { updateTodoCommand } from './update-todo.handler.ts';

const mockTodoEntity = (overrides: Partial<TodoEntity> = {}): TodoEntity => ({
  id: '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231',
  description: 'Buy groceries',
  completed: false,
  createdAt: new Date('2026-03-10T10:00:00.000Z'),
  updatedAt: new Date('2026-03-10T10:00:00.000Z'),
  ...overrides,
});

describe('UpdateTodo handler', () => {
  it('marks a todo as complete', async () => {
    const existing = mockTodoEntity({ completed: false });
    const updated = mockTodoEntity({ completed: true });
    const todoRepository = {
      findOneById: mock.fn(async () => existing),
      update: mock.fn(async () => updated),
    } as any;
    const commandBus = { register: mock.fn() } as any;

    const handler = makeUpdateTodo({ todoRepository, commandBus } as any);
    const result = await handler.handler({
      payload: { id: existing.id, completed: true },
    } as any);

    assert.equal(todoRepository.findOneById.mock.calls.length, 1);
    assert.equal(todoRepository.findOneById.mock.calls[0].arguments[0], existing.id);
    assert.equal(todoRepository.update.mock.calls.length, 1);
    const updateArg1 = todoRepository.update.mock.calls[0].arguments[0];
    assert.equal(updateArg1.id, existing.id);
    assert.equal(updateArg1.completed, true);
    assert.equal(updateArg1.description, existing.description);
    assert.equal(result.completed, true);
  });

  it('marks a todo as incomplete', async () => {
    const existing = mockTodoEntity({ completed: true });
    const updated = mockTodoEntity({ completed: false });
    const todoRepository = {
      findOneById: mock.fn(async () => existing),
      update: mock.fn(async () => updated),
    } as any;
    const commandBus = { register: mock.fn() } as any;

    const handler = makeUpdateTodo({ todoRepository, commandBus } as any);
    const result = await handler.handler({
      payload: { id: existing.id, completed: false },
    } as any);

    assert.equal(todoRepository.findOneById.mock.calls.length, 1);
    assert.equal(todoRepository.findOneById.mock.calls[0].arguments[0], existing.id);
    assert.equal(todoRepository.update.mock.calls.length, 1);
    const updateArg2 = todoRepository.update.mock.calls[0].arguments[0];
    assert.equal(updateArg2.id, existing.id);
    assert.equal(updateArg2.completed, false);
    assert.equal(updateArg2.description, existing.description);
    assert.equal(result.completed, false);
  });

  it('throws TodoNotFoundError when todo does not exist', async () => {
    const todoRepository = {
      findOneById: mock.fn(async () => undefined),
      update: mock.fn(),
    } as any;
    const commandBus = { register: mock.fn() } as any;

    const handler = makeUpdateTodo({ todoRepository, commandBus } as any);
    await assert.rejects(
      () =>
        handler.handler({
          payload: { id: 'missing-id', completed: true },
        } as any),
      TodoNotFoundError,
    );
    assert.equal(todoRepository.update.mock.calls.length, 0);
  });

  it('registers handler with commandBus on init', () => {
    const todoRepository = { findOneById: mock.fn(), update: mock.fn() } as any;
    const commandBus = { register: mock.fn() } as any;

    const handler = makeUpdateTodo({ todoRepository, commandBus } as any);
    handler.init();

    assert.equal(commandBus.register.mock.calls.length, 1);
    assert.equal(commandBus.register.mock.calls[0].arguments[0], updateTodoCommand.type);
  });
});
