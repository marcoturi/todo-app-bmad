import type { CreateTodoRequest, Todo } from '@todo-app/shared';
import { HttpResponse, http } from 'msw';
import { config } from '../config';

export const todoMockList: Todo[] = [
  {
    id: '1c9d4d3a-f5b9-4e11-85c3-4d8e0f3e2a0b',
    description: 'Buy groceries',
    completed: false,
    createdAt: '2026-03-09T10:00:00.000Z',
    updatedAt: '2026-03-09T10:00:00.000Z',
  },
  {
    id: '2a3b4c5d-1e2f-3a4b-8c9d-0e1f2a3b4c5d',
    description: 'Walk the dog',
    completed: true,
    createdAt: '2026-03-09T11:00:00.000Z',
    updatedAt: '2026-03-09T11:30:00.000Z',
  },
];

export const todosHandlers = [
  http.get(`${config.API_URL}/api/v1/todos`, () => {
    return HttpResponse.json(todoMockList);
  }),
  http.post(`${config.API_URL}/api/v1/todos`, async ({ request }) => {
    const body = (await request.json()) as CreateTodoRequest;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      description: body.description,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newTodo, { status: 201 });
  }),
];
