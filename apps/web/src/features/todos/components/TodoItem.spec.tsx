import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { todosApi } from '@/features/todos/store/todos.api';
import { renderWithProviders, setupStore } from '@/shared/store/test';
import { TodoList } from './TodoList';

const todoMockList = [
  {
    id: '1',
    description: 'Buy groceries',
    completed: false,
    createdAt: '2026-03-09T10:00:00.000Z',
    updatedAt: '2026-03-09T10:00:00.000Z',
  },
  {
    id: '2',
    description: 'Walk the dog',
    completed: true,
    createdAt: '2026-03-09T11:00:00.000Z',
    updatedAt: '2026-03-09T11:30:00.000Z',
  },
];

function mockFetch(handlers: Record<string, (req: Request) => Response>) {
  return vi.spyOn(global, 'fetch').mockImplementation((input, init) => {
    const req =
      input instanceof Request ? input : new Request(String(input), init);
    const url = req.url;
    for (const [pattern, handler] of Object.entries(handlers)) {
      if (url.includes(pattern)) return Promise.resolve(handler(req));
    }
    return Promise.resolve(
      new Response(JSON.stringify(todoMockList), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });
}

describe('TodoItem', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function setupWithTodos() {
    const store = setupStore();
    await store.dispatch(
      todosApi.util.upsertQueryData('getTodos', undefined, todoMockList),
    );
    renderWithProviders(<TodoList />, { store });
    return store;
  }

  it('toggles todo to complete', async () => {
    mockFetch({
      '/api/v1/todos': (req) => {
        if (req.method === 'PATCH') {
          return new Response(
            JSON.stringify({ ...todoMockList[0], completed: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        // GET refetch after invalidation
        return new Response(
          JSON.stringify([
            { ...todoMockList[0], completed: true },
            todoMockList[1],
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      },
    });

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
    mockFetch({
      '/api/v1/todos': (req) => {
        if (req.method === 'PATCH') {
          return new Response(
            JSON.stringify({ ...todoMockList[1], completed: false }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return new Response(
          JSON.stringify([
            todoMockList[0],
            { ...todoMockList[1], completed: false },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      },
    });

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
    mockFetch({
      '/api/v1/todos': (req) => {
        if (req.method === 'DELETE') {
          return new Response(null, { status: 204 });
        }
        return new Response(JSON.stringify([todoMockList[1]]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    });

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
    mockFetch({
      '/api/v1/todos': (req) => {
        if (req.method === 'PATCH') {
          return new Response(
            JSON.stringify({ statusCode: 500, message: 'Server error' }),
            { status: 500 },
          );
        }
        return new Response(JSON.stringify(todoMockList), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    });

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
    mockFetch({
      '/api/v1/todos': (req) => {
        if (req.method === 'DELETE') {
          return new Response(
            JSON.stringify({ statusCode: 500, message: 'Server error' }),
            { status: 500 },
          );
        }
        return new Response(JSON.stringify(todoMockList), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    });

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
