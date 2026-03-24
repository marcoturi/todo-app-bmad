import type { Todo } from '@todo-app/shared';
import {
  useDeleteTodoMutation,
  useUpdateTodoMutation,
} from '@/features/todos/store/todos.api';
import { cn } from '@/shared/helpers/style.utils';

type TodoItemProps = {
  todo: Todo;
};

export function TodoItem({ todo }: TodoItemProps) {
  const [
    updateTodo,
    { isLoading: isUpdating, isError: isUpdateError, reset: resetUpdate },
  ] = useUpdateTodoMutation();
  const [
    deleteTodo,
    { isLoading: isDeleting, isError: isDeleteError, reset: resetDelete },
  ] = useDeleteTodoMutation();

  return (
    <li
      data-testid="todo-item"
      aria-label={
        todo.completed ? `${todo.description} (completed)` : todo.description
      }
      className={cn(
        'flex flex-col rounded-md border bg-card shadow-sm',
        todo.completed && 'bg-muted',
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* biome-ignore lint/a11y/useSemanticElements: custom toggle uses role=checkbox for aria-checked semantics per story spec */}
        <button
          type="button"
          role="checkbox"
          aria-checked={todo.completed}
          aria-label={`Mark "${todo.description}" as ${todo.completed ? 'incomplete' : 'complete'}`}
          data-testid="todo-toggle-checkbox"
          disabled={isUpdating || isDeleting}
          onClick={() =>
            updateTodo({ id: todo.id, completed: !todo.completed })
          }
          className={cn(
            'flex shrink-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 items-center justify-center',
            'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <span
            className={cn(
              'flex h-4 w-4 items-center justify-center rounded-sm border',
              todo.completed && 'bg-primary border-primary',
            )}
            aria-hidden="true"
          >
            {todo.completed && (
              <svg
                className="h-3 w-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </span>
        </button>
        <span
          data-testid="todo-description"
          className={cn(todo.completed && 'line-through text-muted-foreground')}
        >
          {todo.description}
        </span>
        <button
          type="button"
          aria-label={`Delete: ${todo.description}`}
          data-testid="todo-delete-button"
          disabled={isUpdating || isDeleting}
          onClick={() => deleteTodo({ id: todo.id })}
          className="ml-auto min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {isUpdateError && (
        <div
          data-testid="todo-update-error"
          role="alert"
          className="mx-4 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/50 p-2 text-sm text-destructive"
        >
          <span>Failed to update task. Please try again.</span>
          <button
            type="button"
            aria-label="Dismiss update error"
            onClick={resetUpdate}
            className="ml-4 underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Dismiss
          </button>
        </div>
      )}

      {isDeleteError && (
        <div
          data-testid="todo-delete-error"
          role="alert"
          className="mx-4 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/50 p-2 text-sm text-destructive"
        >
          <span>Failed to delete task. Please try again.</span>
          <button
            type="button"
            aria-label="Dismiss delete error"
            onClick={resetDelete}
            className="ml-4 underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Dismiss
          </button>
        </div>
      )}
    </li>
  );
}
