import type { TodoRepository } from '#src/modules/todos/database/todo.repository.port.ts';
import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';

export default function todoRepository({
  db,
  todoMapper,
  repositoryBase,
}: Dependencies): TodoRepository {
  const tableName = 'todos';
  return {
    ...repositoryBase({ tableName, mapper: todoMapper }),

    async findAll(): Promise<TodoEntity[]> {
      const records: TodoEntity[] = await db`SELECT * FROM todos ORDER BY created_at ASC`;
      return records.map((r) => todoMapper.toDomain(r));
    },
  };
}
