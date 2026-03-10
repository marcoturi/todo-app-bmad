import type { UpdateTodoRequest } from '@todo-app/shared/todos/types';
import { TodoNotFoundError } from '#src/modules/todos/domain/todo.errors.ts';
import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';
import { todoActionCreator } from '#src/modules/todos/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';

export type UpdateTodoPayload = { id: string } & UpdateTodoRequest;
export type UpdateTodoResult = TodoEntity;
export const updateTodoCommand = todoActionCreator<UpdateTodoPayload, UpdateTodoResult>('update');

export default function makeUpdateTodo({ commandBus, todoRepository }: Dependencies) {
  return {
    async handler({ payload }: HandlerAction<typeof updateTodoCommand>): Promise<UpdateTodoResult> {
      const existing = await todoRepository.findOneById(payload.id);
      if (!existing) {
        throw new TodoNotFoundError(payload.id);
      }
      return todoRepository.update({
        ...existing,
        completed: payload.completed,
        updatedAt: new Date(),
      });
    },
    init() {
      commandBus.register(updateTodoCommand.type, this.handler);
    },
  };
}
