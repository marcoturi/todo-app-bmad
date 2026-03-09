import { TodoItem } from '@/features/todos/components/TodoItem';
import { useTodos } from '@/features/todos/hooks/useTodos';
import { SkeletonList } from '@/UI/Elements/Skeleton';

export function TodoList() {
  const { todos, isLoading, isError, refetch } = useTodos();

  if (isLoading) {
    return (
      <output
        data-testid="todo-list-loading"
        aria-busy="true"
        aria-label="Loading tasks"
      >
        <SkeletonList className="py-4" />
      </output>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        data-testid="todo-list-error"
        className="rounded-md border border-destructive/50 p-4 text-destructive"
      >
        <p>Failed to load tasks. Please try again.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <p
        data-testid="todo-list-empty"
        className="text-muted-foreground py-8 text-center"
      >
        No tasks yet — add one above!
      </p>
    );
  }

  return (
    <ul
      data-testid="todo-list"
      className="flex flex-col gap-3"
      aria-label="Todo list"
    >
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
