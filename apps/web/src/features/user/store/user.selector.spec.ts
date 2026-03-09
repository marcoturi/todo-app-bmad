import { userApi } from '@/features/user/store/user.api';
import { setupStore } from '@/shared/store/test';
import { UserSelectors } from '.';

describe('User Selector:', () => {
  // biome-ignore lint/suspicious/noImplicitAnyLet: store type inferred at assignment
  let store;

  beforeEach(() => {
    store = setupStore();
  });

  it('Should return email', async () => {
    const newData = {
      id: '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231',
      email: 'john@example.com',
      country: 'Italy',
      postalCode: '12345',
      street: 'Via Roma',
      role: 'guest' as const,
      createdAt: '2020-11-24T17:43:15.970Z',
      updatedAt: '2020-11-24T17:43:15.970Z',
    };

    await store.dispatch(
      userApi.util.upsertQueryData('getUser', undefined, newData),
    );
    const finalState = store.getState();

    expect(UserSelectors.getUserEmail(finalState)).toEqual('john@example.com');
  });

  it('Should return empty string when no data', () => {
    const finalState = store.getState();
    expect(UserSelectors.getUserEmail(finalState)).toEqual('');
  });
});
