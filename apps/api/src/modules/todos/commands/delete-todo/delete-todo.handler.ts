import { TodoNotFoundError } from '#src/modules/todos/domain/todo.errors.ts';
import { todoActionCreator } from '#src/modules/todos/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';

export interface DeleteTodoPayload {
  id: string;
}
export type DeleteTodoResult = null;
export const deleteTodoCommand = todoActionCreator<DeleteTodoPayload, DeleteTodoResult>('delete');

export default function makeDeleteTodo({ commandBus, todoRepository }: Dependencies) {
  return {
    async handler({ payload }: HandlerAction<typeof deleteTodoCommand>): Promise<null> {
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
