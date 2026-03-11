import { HttpResponse, http } from 'msw';
import { config } from '../config';

const subscriptionMockList = [
  {
    id: 'monthly',
    type: 'subscription',
    name: 'Monthly Subscription',
    price: 9.99,
    currency: 'EUR',
    description: 'Lorem ipsum dolor sit amet.',
  },
  {
    id: 'yearly',
    type: 'subscription',
    name: 'Yearly Subscription',
    price: 99.99,
    currency: 'EUR',
    description: 'Lorem ipsum dolor sit amet.',
  },
  {
    id: 'lifetime',
    type: 'oneTimePurchase',
    name: 'Lifetime Purchase',
    price: 299.99,
    currency: 'EUR',
    description: 'Lorem ipsum dolor sit amet.',
  },
];

export const subscriptionHandlers = [
  http.get(`${config.API_URL}/subscriptions`, () => {
    try {
      return HttpResponse.json(subscriptionMockList);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Server Error';
      return HttpResponse.json({ message }, { status: 400 });
    }
  }),
];
