import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { todoSchema, updateTodoRequestSchema } from '@todo-app/shared/todos/schema';
import { updateTodoCommand } from '#src/modules/todos/commands/update-todo/update-todo.handler.ts';
import { idDtoSchema } from '#src/shared/api/id.response.dto.ts';

export default async function updateTodo(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/todos/:id',
    schema: {
      description: 'Toggle a todo completion status',
      params: idDtoSchema,
      body: updateTodoRequestSchema,
      response: {
        200: todoSchema,
      },
      tags: ['todos'],
    },
    handler: async (req, res) => {
      const todo = await fastify.commandBus.execute(
        updateTodoCommand({ id: req.params.id, ...req.body }),
      );
      return res.status(200).send(fastify.diContainer.cradle.todoMapper.toResponse(todo));
    },
  });
}
