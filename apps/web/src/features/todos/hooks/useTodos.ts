import { todosApi } from '@/features/todos/store/todos.api';

export function useTodos() {
  const {
    data: todos = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = todosApi.useGetTodosQuery();

  const [createTodo, createTodoState] = todosApi.useCreateTodoMutation();

  return {
    todos,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    createTodo,
    isCreating: createTodoState.isLoading,
    isCreateError: createTodoState.isError,
    createError: createTodoState.error,
  };
}
