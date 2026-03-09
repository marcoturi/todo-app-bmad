import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';
import { todoActionCreator } from '#src/modules/todos/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';

export type FindTodosResult = TodoEntity[];
export const findTodosQuery = todoActionCreator<void, FindTodosResult>('find-all');

export default function makeFindTodos({ queryBus, todoRepository }: Dependencies) {
  return {
    async handler(_action: HandlerAction<typeof findTodosQuery>): Promise<FindTodosResult> {
      return todoRepository.findAll();
    },
    init() {
      queryBus.register(findTodosQuery.type, this.handler);
    },
  };
}
