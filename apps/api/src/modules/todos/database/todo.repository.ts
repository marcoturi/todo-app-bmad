import type { TodoRepository } from '#src/modules/todos/database/todo.repository.port.ts';
import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';
import { DatabaseErrorException } from '#src/shared/exceptions/index.ts';

export default function todoRepository({
  db,
  todoMapper,
  repositoryBase,
}: Dependencies): TodoRepository {
  const tableName = 'todos';
  return {
    ...repositoryBase({ tableName, mapper: todoMapper }),

    async findAll(): Promise<TodoEntity[]> {
      const records: TodoEntity[] =
        await db`SELECT * FROM ${db(tableName)} ORDER BY created_at ASC`;
      return records.map((r) => todoMapper.toDomain(r));
    },

    async update(entity: TodoEntity): Promise<TodoEntity> {
      const [updated] = await db`
        UPDATE ${db(tableName)}
        SET completed = ${entity.completed}, updated_at = now()
        WHERE id = ${entity.id}
        RETURNING *
      `;
      if (!updated) {
        throw new DatabaseErrorException(`Record with id ${entity.id} not found for update`);
      }
      return todoMapper.toDomain(updated as TodoEntity);
    },
  };
}
