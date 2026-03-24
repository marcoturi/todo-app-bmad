import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/shared/store/test';
import { TodoList } from './TodoList';

describe('TodoList', () => {
  it('shows loading skeleton while fetching', () => {
    renderWithProviders(<TodoList />);
    expect(screen.getByTestId('todo-list-loading')).toBeInTheDocument();
  });

  it('renders todos from the API', async () => {
    renderWithProviders(<TodoList />);

    await waitFor(() => {
      expect(screen.queryByTestId('todo-list-loading')).not.toBeInTheDocument();
    });

    // The list should have loaded from the real API (may be empty or populated)
    const items = screen.queryAllByTestId('todo-item');
    if (items.length === 0) {
      expect(screen.getByTestId('todo-list-empty')).toBeInTheDocument();
    } else {
      expect(items.length).toBeGreaterThan(0);
    }
  });
});
