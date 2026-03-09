import { screen } from '@testing-library/react';
import UserWidget from '@/features/user/components/UserWidget';
import { renderWithProviders } from '@/shared/store/test';

describe('UserWidget', () => {
  test('renders nothing while loading', () => {
    renderWithProviders(<UserWidget />);
    expect(screen.queryByText(/hello/i)).not.toBeInTheDocument();
  });
});
