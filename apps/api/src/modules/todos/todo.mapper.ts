import type { Todo } from '@todo-app/shared';
import type { TodoEntity } from '#src/modules/todos/domain/todo.types.ts';
import type { Mapper } from '#src/shared/ddd/mapper.interface.ts';

export default function todoMapper(): Mapper<TodoEntity, TodoEntity, Todo> {
  return {
    toDomain(record: TodoEntity): TodoEntity {
      return {
        id: record.id,
        description: record.description,
        completed: record.completed,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    },
    toResponse(entity: TodoEntity): Todo {
      return {
        id: entity.id,
        description: entity.description,
        completed: entity.completed,
        createdAt: entity.createdAt.toISOString(),
        updatedAt: entity.updatedAt.toISOString(),
      };
    },
    toPersistence(entity: TodoEntity): TodoEntity {
      return {
        id: entity.id,
        description: entity.description,
        completed: entity.completed,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      };
    },
  };
}
