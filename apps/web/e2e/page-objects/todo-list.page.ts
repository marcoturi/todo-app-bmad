import type { Locator, Page } from '@playwright/test';

interface TodoData {
  id: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export class TodoListPage {
  constructor(
    private readonly page: Page,
    private readonly serverUrl: string,
  ) { }

  async goto(): Promise<void> {
    await this.page.goto(this.serverUrl);
  }

  async mockEmptyList(): Promise<void> {
    await this.page.route('**/api/v1/todos', (route) =>
      route.fulfill({ json: [] }),
    );
  }

  async mockTodoList(todos: TodoData[]): Promise<void> {
    await this.page.route('**/api/v1/todos', (route) =>
      route.fulfill({ json: todos }),
    );
  }

  async mockServerError(): Promise<void> {
    await this.page.route('**/api/v1/todos', (route) =>
      route.fulfill({ status: 500, json: { error: 'Internal Server Error' } }),
    );
  }

  async mockDelayedResponse(): Promise<void> {
    await this.page.route('**/api/v1/todos', async (route) => {
      await new Promise<void>((resolve) => setTimeout(resolve, 5000));
      await route.fulfill({ json: [] });
    });
  }

  getLoadingIndicator(): Locator {
    return this.page.getByTestId('todo-list-loading');
  }

  getEmptyState(): Locator {
    return this.page.getByTestId('todo-list-empty');
  }

  getErrorState(): Locator {
    return this.page.getByTestId('todo-list-error');
  }

  getRetryButton(): Locator {
    return this.page.getByRole('button', { name: /retry/i });
  }

  getTodoItems(): Locator {
    return this.page.getByTestId('todo-item');
  }

  getTodoDescriptions(): Locator {
    return this.page.getByTestId('todo-description');
  }
}
