import baseApi from '@/shared/store/api';
import type { CreateTodoRequest, Todo } from '@todo-app/shared';

export const todosApi = baseApi
  .enhanceEndpoints({ addTagTypes: ['Todo'] })
  .injectEndpoints({
    endpoints: (build) => ({
      getTodos: build.query<Todo[], void>({
        query: () => 'api/v1/todos',
        providesTags: ['Todo'],
      }),
      createTodo: build.mutation<Todo, CreateTodoRequest>({
        query: (body) => ({
          url: 'api/v1/todos',
          method: 'POST',
          body,
        }),
        invalidatesTags: ['Todo'],
      }),
    }),
    overrideExisting: false,
  });

export const { useGetTodosQuery, useCreateTodoMutation } = todosApi;
