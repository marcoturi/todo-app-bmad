import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTodos } from '@/features/todos/hooks/useTodos';
import { cn } from '@/shared/helpers/style.utils';

export function CreateTodoForm() {
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { createTodo, isCreating, isCreateError, createTodoReset } = useTodos();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (description.trim() === '') {
      setValidationError('Please enter a task description.');
      return;
    }
    try {
      await createTodo({ description: description.trim() }).unwrap();
      setDescription('');
      setValidationError(null);
    } catch {
      // isCreateError handled via RTK Query — input preserved intentionally
    }
  }

  return (
    <div className="mb-6">
      <form
        data-testid="create-todo-form"
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          data-testid="create-todo-input"
          type="text"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setValidationError(null);
          }}
          placeholder="Add a new task..."
          disabled={isCreating}
          aria-label="New task description"
          aria-describedby={
            validationError ? 'create-todo-validation-error' : undefined
          }
          className={cn(
            'flex-1 rounded-md border px-3 py-2 text-sm min-h-[44px]',
            'focus:ring-ring focus:outline-none focus:ring-2',
            validationError && 'border-destructive',
          )}
        />
        <button
          data-testid="create-todo-submit"
          type="submit"
          disabled={isCreating}
          className="w-full sm:w-auto min-h-[44px] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isCreating ? 'Adding…' : 'Add'}
        </button>
      </form>

      {validationError && (
        <p
          id="create-todo-validation-error"
          data-testid="create-todo-validation-error"
          className="mt-1 text-sm text-destructive"
          role="alert"
        >
          {validationError}
        </p>
      )}

      {isCreateError && (
        <div
          data-testid="create-todo-error"
          role="alert"
          className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/50 p-3 text-sm text-destructive"
        >
          <span>Failed to add task. Please try again.</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={createTodoReset}
            className="min-h-[44px] flex items-center ml-4 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
