import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { deleteTodoCommand } from '#src/modules/todos/commands/delete-todo/delete-todo.handler.ts';
import { idDtoSchema } from '#src/shared/api/id.response.dto.ts';

export default async function deleteTodo(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/todos/:id',
    schema: {
      description: 'Permanently delete a todo',
      params: idDtoSchema,
      tags: ['todos'],
    },
    handler: async (req, res) => {
      await fastify.commandBus.execute(deleteTodoCommand({ id: req.params.id }));
      return res.code(200).send();
    },
  });
}
