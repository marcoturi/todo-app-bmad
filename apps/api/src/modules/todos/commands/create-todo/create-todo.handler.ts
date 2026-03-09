import type { CreateTodoRequest } from '@todo-app/shared';
import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';
import { todoActionCreator } from '#src/modules/todos/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';

export type CreateTodoResult = TodoEntity;
export const createTodoCommand = todoActionCreator<CreateTodoRequest, CreateTodoResult>('create');

export default function makeCreateTodo({ commandBus, todoRepository, todoDomain }: Dependencies) {
  return {
    async handler({ payload }: HandlerAction<typeof createTodoCommand>): Promise<CreateTodoResult> {
      const todo = todoDomain.createTodo({ description: payload.description });
      await todoRepository.insert(todo);
      return todo;
    },
    init() {
      commandBus.register(createTodoCommand.type, this.handler);
    },
  };
}
