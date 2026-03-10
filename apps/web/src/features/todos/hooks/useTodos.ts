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
  const [updateTodo, updateTodoState] = todosApi.useUpdateTodoMutation();
  const [deleteTodo, deleteTodoState] = todosApi.useDeleteTodoMutation();

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
    createTodoReset: createTodoState.reset,
    updateTodo,
    isUpdating: updateTodoState.isLoading,
    isUpdateError: updateTodoState.isError,
    updateTodoReset: updateTodoState.reset,
    deleteTodo,
    isDeleting: deleteTodoState.isLoading,
    isDeleteError: deleteTodoState.isError,
    deleteTodoReset: deleteTodoState.reset,
  };
}
