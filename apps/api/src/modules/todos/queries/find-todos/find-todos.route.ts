import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { findTodosResponseSchema } from '@todo-app/shared/todos/schema';
import { findTodosQuery } from './find-todos.handler.ts';

export default async function findTodos(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'GET',
    url: '/v1/todos',
    schema: {
      description: 'Find all todos',
      response: {
        200: findTodosResponseSchema,
      },
      tags: ['todos'],
    },
    handler: async (_req, res) => {
      const todos = await fastify.queryBus.execute(findTodosQuery());
      const response = todos.map(fastify.diContainer.cradle.todoMapper.toResponse);
      return res.status(200).send(response);
    },
  });
}
