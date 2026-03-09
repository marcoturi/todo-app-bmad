import { randomUUID } from 'node:crypto';
import type { CreateTodoRequest } from '@todo-app/shared/todos/types';
import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';

export default function todoDomain() {
  return {
    createTodo: (props: CreateTodoRequest): TodoEntity => {
      const now = new Date();
      return {
        id: randomUUID(),
        description: props.description,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };
    },
  };
}
