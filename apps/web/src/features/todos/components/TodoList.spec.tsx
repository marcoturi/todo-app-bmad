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

describe('TodoList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: 'Oops' }), { status: 500 }),
      ),
    );
    renderWithProviders(<TodoList />);
    await waitFor(() => {
      expect(screen.getByTestId('todo-list-error')).toBeInTheDocument();
    });
    expect(screen.getByText(/failed to load tasks/i)).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(retryBtn);
    await waitFor(() => {
      expect(screen.getByTestId('todo-list-error')).toBeInTheDocument();
    });
  });
});
