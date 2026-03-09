import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';
import type { RepositoryPort } from '#src/shared/db/repository.port.ts';

export interface TodoRepository extends RepositoryPort<TodoEntity> {}
