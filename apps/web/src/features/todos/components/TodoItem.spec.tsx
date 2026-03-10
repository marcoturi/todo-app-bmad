import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { todosApi } from '@/features/todos/store/todos.api';
import { renderWithProviders, setupStore } from '@/shared/store/test';
import { config } from '@/test/config';
import { todoMockList } from '@/test/handlers/todos';
import { server } from '../../../../scripts/vitest.setup';
import { TodoList } from './TodoList';

describe('TodoItem', () => {
  async function setupWithTodos() {
    const store = setupStore();
    await store.dispatch(
      todosApi.util.upsertQueryData('getTodos', undefined, todoMockList),
    );
    renderWithProviders(<TodoList />, { store });
    return store;
  }

  it('toggles todo to complete', async () => {
    // After PATCH, GET re-fetch returns Buy groceries as completed
    server.use(
      http.get(`${config.API_URL}/api/v1/todos`, () => {
        return HttpResponse.json([
          { ...todoMockList[0], completed: true },
          todoMockList[1],
        ]);
      }),
    );

    await setupWithTodos();
    const user = userEvent.setup();

    const toggleButtons = screen.getAllByTestId('todo-toggle-checkbox');
    expect(toggleButtons[0]).toHaveAttribute('aria-checked', 'false');

    await user.click(toggleButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByTestId('todo-toggle-checkbox')[0]).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });
  });

  it('toggles todo back to incomplete', async () => {
    // After PATCH, GET re-fetch returns Walk the dog as incomplete
    server.use(
      http.get(`${config.API_URL}/api/v1/todos`, () => {
        return HttpResponse.json([
          todoMockList[0],
          { ...todoMockList[1], completed: false },
        ]);
      }),
    );

    await setupWithTodos();
    const user = userEvent.setup();

    const toggleButtons = screen.getAllByTestId('todo-toggle-checkbox');
    expect(toggleButtons[1]).toHaveAttribute('aria-checked', 'true');

    await user.click(toggleButtons[1]);

    await waitFor(() => {
      expect(screen.getAllByTestId('todo-toggle-checkbox')[1]).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });
  });

  it('deletes a todo', async () => {
    // After DELETE, GET re-fetch returns only Walk the dog
    server.use(
      http.get(`${config.API_URL}/api/v1/todos`, () => {
        return HttpResponse.json([todoMockList[1]]);
      }),
    );

    await setupWithTodos();
    const user = userEvent.setup();

    const deleteButtons = screen.getAllByTestId('todo-delete-button');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      const descriptions = screen.getAllByTestId('todo-description');
      expect(descriptions).toHaveLength(1);
      expect(descriptions[0]).toHaveTextContent('Walk the dog');
    });
    expect(screen.queryByText('Buy groceries')).not.toBeInTheDocument();
  });

  it('shows update error and dismisses', async () => {
    server.use(
      http.patch(`${config.API_URL}/api/v1/todos/:id`, () => {
        return HttpResponse.json(
          { statusCode: 500, message: 'Server error' },
          { status: 500 },
        );
      }),
    );

    await setupWithTodos();
    const user = userEvent.setup();

    await user.click(screen.getAllByTestId('todo-toggle-checkbox')[0]);

    await waitFor(() => {
      expect(screen.getByTestId('todo-update-error')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Failed to update task. Please try again.'),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Dismiss update error' }),
    );

    await waitFor(() => {
      expect(screen.queryByTestId('todo-update-error')).not.toBeInTheDocument();
    });
  });

  it('shows delete error and dismisses', async () => {
    server.use(
      http.delete(`${config.API_URL}/api/v1/todos/:id`, () => {
        return HttpResponse.json(
          { statusCode: 500, message: 'Server error' },
          { status: 500 },
        );
      }),
    );

    await setupWithTodos();
    const user = userEvent.setup();

    await user.click(screen.getAllByTestId('todo-delete-button')[0]);

    await waitFor(() => {
      expect(screen.getByTestId('todo-delete-error')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Failed to delete task. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Dismiss delete error' }),
    );

    await waitFor(() => {
      expect(screen.queryByTestId('todo-delete-error')).not.toBeInTheDocument();
    });
  });
});
