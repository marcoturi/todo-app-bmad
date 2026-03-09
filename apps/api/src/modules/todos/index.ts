import type { Todo } from '@todo-app/shared';
import type { TodoRepository } from '#src/modules/todos/database/todo.repository.port.ts';
import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';
import { actionCreatorFactory } from '#src/shared/cqrs/action-creator.ts';
import type { Mapper } from '#src/shared/ddd/mapper.interface.ts';

declare global {
  export interface Dependencies {
    todoMapper: Mapper<TodoEntity, TodoEntity, Todo>;
    todoRepository: TodoRepository;
  }
}

export const todoActionCreator = actionCreatorFactory('todo');
