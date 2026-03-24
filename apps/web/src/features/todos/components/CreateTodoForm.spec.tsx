import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/shared/store/test';
import { CreateTodoForm } from './CreateTodoForm';

describe('CreateTodoForm', () => {
  it('submits and clears input on success', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateTodoForm />);

    const input = screen.getByTestId('create-todo-input');
    await user.type(input, 'Integration test todo');
    fireEvent.submit(screen.getByTestId('create-todo-form'));

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('shows validation error and does not call API on empty submit', async () => {
    renderWithProviders(<CreateTodoForm />);

    fireEvent.submit(screen.getByTestId('create-todo-form'));

    await waitFor(() => {
      expect(
        screen.getByTestId('create-todo-validation-error'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId('create-todo-error')).not.toBeInTheDocument();
  });
});
