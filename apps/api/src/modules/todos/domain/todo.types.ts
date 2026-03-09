import type { Todo } from '@todo-app/shared';

export type TodoEntity = Omit<Todo, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
};
