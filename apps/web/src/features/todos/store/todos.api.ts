import type {
  CreateTodoRequest,
  Todo,
  UpdateTodoRequest,
} from '@todo-app/shared';
import baseApi from '@/shared/store/api';

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
      updateTodo: build.mutation<Todo, { id: string } & UpdateTodoRequest>({
        query: ({ id, ...body }) => ({
          url: `api/v1/todos/${id}`,
          method: 'PATCH',
          body,
        }),
        invalidatesTags: ['Todo'],
      }),
      deleteTodo: build.mutation<void, { id: string }>({
        query: ({ id }) => ({
          url: `api/v1/todos/${id}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Todo'],
      }),
    }),
    overrideExisting: false,
  });

export const {
  useGetTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
} = todosApi;
