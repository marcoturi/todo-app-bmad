import { type Static, Type } from 'typebox';

export const todoSchema = Type.Object({
  id: Type.String({
    format: 'uuid',
    example: '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231',
    description: "Entity's id",
  }),
  createdAt: Type.String({
    example: '2020-11-24T17:43:15.970Z',
    description: 'Entity creation date',
  }),
  updatedAt: Type.String({
    example: '2020-11-24T17:43:15.970Z',
    description: 'Entity last update date',
  }),
  description: Type.String({
    example: 'Buy groceries',
    description: 'Todo description',
  }),
  completed: Type.Boolean({
    example: false,
    description: 'Whether the todo is completed',
  }),
});

export const createTodoRequestSchema = Type.Object({
  description: Type.String({
    example: 'Buy groceries',
    description: 'Todo description',
  }),
});

export const updateTodoRequestSchema = Type.Object({
  completed: Type.Boolean({
    example: true,
    description: 'Whether the todo is completed',
  }),
});

export const findTodosResponseSchema = Type.Array(todoSchema);

export type Todo = Static<typeof todoSchema>;
export type CreateTodoRequest = Static<typeof createTodoRequestSchema>;
export type UpdateTodoRequest = Static<typeof updateTodoRequestSchema>;
export type FindTodosResponse = Static<typeof findTodosResponseSchema>;
