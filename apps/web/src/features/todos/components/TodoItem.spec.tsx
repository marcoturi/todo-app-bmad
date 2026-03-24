import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/shared/store/test';
import { TodoList } from './TodoList';

describe('TodoItem', () => {
  async function createTodoViaAPI(): Promise<string> {
    const description = `test-${crypto.randomUUID().slice(0, 8)}`;
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/v1/todos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      },
    );
    const todo = await res.json();
    return todo.id;
  }

  async function deleteTodoViaAPI(id: string) {
    await fetch(`${import.meta.env.VITE_API_URL}/api/v1/todos/${id}`, {
      method: 'DELETE',
    });
  }

  let todoId: string;

  beforeEach(async () => {
    todoId = await createTodoViaAPI();
  });

  afterEach(async () => {
    try {
      await deleteTodoViaAPI(todoId);
    } catch {
      // already deleted by the test
    }
  });

  it('toggles todo to complete', async () => {
    renderWithProviders(<TodoList />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.queryByTestId('todo-list-loading')).not.toBeInTheDocument();
    });

    const toggleButtons = screen.getAllByTestId('todo-toggle-checkbox');
    const firstToggle = toggleButtons[0];
    const wasChecked = firstToggle.getAttribute('aria-checked');

    await user.click(firstToggle);

    const expectedState = wasChecked === 'true' ? 'false' : 'true';
    await waitFor(() => {
      expect(screen.getAllByTestId('todo-toggle-checkbox')[0]).toHaveAttribute(
        'aria-checked',
        expectedState,
      );
    });
  });

  it('deletes a todo', async () => {
    renderWithProviders(<TodoList />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.queryByTestId('todo-list-loading')).not.toBeInTheDocument();
    });

    const itemsBefore = screen.getAllByTestId('todo-item');
    const deleteButtons = screen.getAllByTestId('todo-delete-button');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      const itemsAfter = screen.queryAllByTestId('todo-item');
      expect(itemsAfter.length).toBe(itemsBefore.length - 1);
    });
  });
});
