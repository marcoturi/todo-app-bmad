import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { renderWithProviders } from '@/shared/store/test';
import { config } from '@/test/config';
import { server } from '../../../../scripts/vitest.setup';
import { CreateTodoForm } from './CreateTodoForm';

describe('CreateTodoForm', () => {
  it('submits and clears input on success', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateTodoForm />);

    const input = screen.getByTestId('create-todo-input');
    await user.type(input, 'Buy groceries');
    fireEvent.submit(screen.getByTestId('create-todo-form'));

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('shows validation error and does not call API on empty submit', async () => {
    let apiCalled = false;
    server.use(
      http.post(`${config.API_URL}/api/v1/todos`, () => {
        apiCalled = true;
        return HttpResponse.json({}, { status: 201 });
      }),
    );
    renderWithProviders(<CreateTodoForm />);

    fireEvent.submit(screen.getByTestId('create-todo-form'));

    await waitFor(() => {
      expect(
        screen.getByTestId('create-todo-validation-error'),
      ).toBeInTheDocument();
    });
    expect(apiCalled).toBe(false);
    expect(screen.queryByTestId('create-todo-error')).not.toBeInTheDocument();
  });

  it('shows API error and preserves input on failure', async () => {
    server.use(
      http.post(`${config.API_URL}/api/v1/todos`, () => {
        return HttpResponse.json(
          { statusCode: 500, error: 'Internal Server Error', message: 'Oops' },
          { status: 500 },
        );
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<CreateTodoForm />);

    const input = screen.getByTestId('create-todo-input');
    await user.type(input, 'Buy groceries');
    fireEvent.submit(screen.getByTestId('create-todo-form'));

    await waitFor(() => {
      expect(screen.getByTestId('create-todo-error')).toBeInTheDocument();
    });
    expect(input).toHaveValue('Buy groceries'); // input preserved on error
    expect(
      screen.getByRole('button', { name: /dismiss/i }),
    ).toBeInTheDocument();
  });

  it('dismisses API error when Dismiss is clicked', async () => {
    server.use(
      http.post(`${config.API_URL}/api/v1/todos`, () => {
        return HttpResponse.json(
          { statusCode: 500, error: 'Internal Server Error', message: 'Oops' },
          { status: 500 },
        );
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<CreateTodoForm />);

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
