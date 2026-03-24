import { screen } from '@testing-library/react';
import SubscriptionsPage from '@/routes/Subscriptions/SubscriptionsPage';
import { renderWithProviders } from '@/shared/store/test';

describe('SubscriptionsPage', () => {
  test('Should load page title', () => {
    renderWithProviders(<SubscriptionsPage />);
    const text = screen.getByText(/subscriptions/i);
    expect(text).toBeInTheDocument();
  });
});
