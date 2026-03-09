import { subscriptionHandlers } from './subscriptions';
import { todosHandlers } from './todos';
import { usersHandlers } from './users';

export const handlers = [
  ...usersHandlers,
  ...subscriptionHandlers,
  ...todosHandlers,
];
