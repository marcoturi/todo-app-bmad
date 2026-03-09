import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { createTodoRequestSchema, todoSchema } from '@todo-app/shared/todos/schema';
import { createTodoCommand } from '#src/modules/todos/commands/create-todo/create-todo.handler.ts';

export default async function createTodo(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'POST',
    url: '/v1/todos',
    schema: {
      description: 'Create a new todo',
      body: createTodoRequestSchema,
      response: {
        201: todoSchema,
      },
      tags: ['todos'],
    },
    handler: async (req, res) => {
      const todo = await fastify.commandBus.execute(createTodoCommand(req.body));
      const response = fastify.diContainer.cradle.todoMapper.toResponse(todo);
      return res.status(201).send(response);
    },
  });
}
