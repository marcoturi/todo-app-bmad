import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { todosApi } from '@/features/todos/store/todos.api';
import { renderWithProviders, setupStore } from '@/shared/store/test';
import { config } from '@/test/config';
import { todoMockList } from '@/test/handlers/todos';
import { server } from '../../../../scripts/vitest.setup';
import { TodoList } from './TodoList';

describe('TodoList', () => {
  it('shows loading skeleton while fetching', () => {
    renderWithProviders(<TodoList />);
    expect(screen.getByTestId('todo-list-loading')).toBeInTheDocument();
  });

  it('shows empty state when no todos', async () => {
    const store = setupStore();
    await store.dispatch(
      todosApi.util.upsertQueryData('getTodos', undefined, []),
    );
    renderWithProviders(<TodoList />, { store });
    expect(screen.getByTestId('todo-list-empty')).toBeInTheDocument();
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('renders todos when list is populated', async () => {
    const store = setupStore();
    await store.dispatch(
      todosApi.util.upsertQueryData('getTodos', undefined, todoMockList),
    );
    renderWithProviders(<TodoList />, { store });
    const items = screen.getAllByTestId('todo-item');
    expect(items).toHaveLength(2);
    // Verify creation order: oldest first (AC #4)
    const descriptions = screen.getAllByTestId('todo-description');
    expect(descriptions[0]).toHaveTextContent('Buy groceries');
    expect(descriptions[1]).toHaveTextContent('Walk the dog');
  });

  it('applies strikethrough to completed todos', async () => {
    const store = setupStore();
    await store.dispatch(
      todosApi.util.upsertQueryData('getTodos', undefined, todoMockList),
    );
    renderWithProviders(<TodoList />, { store });
    const walkDog = screen.getByText('Walk the dog');
    expect(walkDog).toHaveClass('line-through');
  });

  it('shows error state and retry button when API fails', async () => {
    server.use(
      http.get(`${config.API_URL}/api/v1/todos`, () => {
        return HttpResponse.json(
          { statusCode: 500, error: 'Internal Server Error', message: 'Oops' },
          { status: 500 },
        );
      }),
    );
    renderWithProviders(<TodoList />);
    await waitFor(() => {
      expect(screen.getByTestId('todo-list-error')).toBeInTheDocument();
    });
    expect(screen.getByText(/failed to load tasks/i)).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();
    // Clicking retry re-triggers fetch; MSW still returns 500 so error persists
    const user = userEvent.setup();
    await user.click(retryBtn);
    await waitFor(() => {
      expect(screen.getByTestId('todo-list-error')).toBeInTheDocument();
    });
  });
});
