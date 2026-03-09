import { cn } from "@/shared/helpers/style.utils";
import type { Todo } from "@todo-app/shared";

type TodoItemProps = {
  todo: Todo;
};

export function TodoItem({ todo }: TodoItemProps) {
  return (
    <li
      data-testid="todo-item"
      aria-label={
        todo.completed ? `${todo.description} (completed)` : todo.description
      }
      className={cn(
        "flex items-center gap-3 rounded-md border bg-card px-4 py-3 shadow-sm",
        todo.completed && "opacity-60",
      )}
    >
      {/* Read-only completion indicator — actions added in Story 3.3 */}
      <span
        aria-hidden="true"
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
          todo.completed && "bg-primary border-primary",
        )}
      >
        {todo.completed && (
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
            aria-label="Completed"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </span>
      <span
        data-testid="todo-description"
        className={cn(todo.completed && "line-through text-muted-foreground")}
      >
        {todo.description}
      </span>
    </li>
  );
}
