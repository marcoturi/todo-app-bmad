import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { todosApi } from '@/features/todos/store/todos.api';
import { renderWithProviders, setupStore } from '@/shared/store/test';
import { CreateTodoForm } from './CreateTodoForm';

function mockFetch(handlers: Record<string, () => Response>) {
  return vi.spyOn(global, 'fetch').mockImplementation((input) => {
    const url = input instanceof Request ? input.url : String(input);
    for (const [pattern, handler] of Object.entries(handlers)) {
      if (url.includes(pattern)) return Promise.resolve(handler());
    }
    return Promise.resolve(new Response('{}', { status: 200 }));
  });
}

describe('CreateTodoForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function renderForm() {
    const store = setupStore();
    await store.dispatch(
      todosApi.util.upsertQueryData('getTodos', undefined, []),
    );
    return renderWithProviders(<CreateTodoForm />, { store });
  }

  it('submits and clears input on success', async () => {
    mockFetch({
      '/api/v1/todos': () =>
        new Response(
          JSON.stringify({
            id: 'new-id',
            description: 'Buy groceries',
            completed: false,
            createdAt: '2026-03-09T10:00:00.000Z',
            updatedAt: '2026-03-09T10:00:00.000Z',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        ),
    });

    const user = userEvent.setup();
    await renderForm();

    const input = screen.getByTestId('create-todo-input');
    await user.type(input, 'Buy groceries');
    fireEvent.submit(screen.getByTestId('create-todo-form'));

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('shows validation error and does not call API on empty submit', async () => {
    const fetchSpy = mockFetch({});
    await renderForm();

    fireEvent.submit(screen.getByTestId('create-todo-form'));

    await waitFor(() => {
      expect(
        screen.getByTestId('create-todo-validation-error'),
      ).toBeInTheDocument();
    });
    // No POST should have been made — only background GETs are allowed
    const postCalls = fetchSpy.mock.calls.filter((call) => {
      const input = call[0];
      if (input instanceof Request) return input.method === 'POST';
      return false;
    });
    expect(postCalls).toHaveLength(0);
    expect(screen.queryByTestId('create-todo-error')).not.toBeInTheDocument();
  });

  it('associates validation error with input via aria-describedby', async () => {
    await renderForm();

    const input = screen.getByTestId('create-todo-input');
    expect(input).not.toHaveAttribute('aria-describedby');

    fireEvent.submit(screen.getByTestId('create-todo-form'));

    await waitFor(() => {
      expect(input).toHaveAttribute(
        'aria-describedby',
        'create-todo-validation-error',
      );
    });
    const errorEl = screen.getByTestId('create-todo-validation-error');
    expect(errorEl).toHaveAttribute('id', 'create-todo-validation-error');
  });

  it('shows API error and preserves input on failure', async () => {
    mockFetch({
      '/api/v1/todos': () =>
        new Response(
          JSON.stringify({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'Oops',
          }),
          { status: 500 },
        ),
    });
    const user = userEvent.setup();
    await renderForm();

    const input = screen.getByTestId('create-todo-input');
    await user.type(input, 'Buy groceries');
    fireEvent.submit(screen.getByTestId('create-todo-form'));

    await waitFor(() => {
      expect(screen.getByTestId('create-todo-error')).toBeInTheDocument();
    });
    expect(input).toHaveValue('Buy groceries');
    expect(
      screen.getByRole('button', { name: /dismiss/i }),
    ).toBeInTheDocument();
  });

  it('dismisses API error when Dismiss is clicked', async () => {
    mockFetch({
      '/api/v1/todos': () =>
        new Response(
          JSON.stringify({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'Oops',
          }),
          { status: 500 },
        ),
    });
    const user = userEvent.setup();
    await renderForm();

    const input = screen.getByTestId('create-todo-input');
    await user.type(input, 'Buy groceries');
    fireEvent.submit(screen.getByTestId('create-todo-form'));

    await waitFor(() => {
      expect(screen.getByTestId('create-todo-error')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    await waitFor(() => {
      expect(screen.queryByTestId('create-todo-error')).not.toBeInTheDocument();
    });
  });
});
