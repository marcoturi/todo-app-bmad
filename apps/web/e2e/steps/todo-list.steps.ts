import type { DataTable } from '@cucumber/cucumber';
import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { TodoListPage } from '../page-objects/todo-list.page';
import type { ICustomWorld } from '../support/custom-world';

let todoListPage: TodoListPage;

Given(
  'the API response for todos is delayed',
  async function (this: ICustomWorld) {
    todoListPage = new TodoListPage(this.page!, this.parameters.SERVER_URL);
    await todoListPage.mockDelayedResponse();
  },
);

Given(
  'the API returns an empty todo list',
  async function (this: ICustomWorld) {
    todoListPage = new TodoListPage(this.page!, this.parameters.SERVER_URL);
    await todoListPage.mockEmptyList();
  },
);

Given(
  'the API returns the following todos:',
  async function (this: ICustomWorld, dataTable: DataTable) {
    todoListPage = new TodoListPage(this.page!, this.parameters.SERVER_URL);
    const rows = dataTable.hashes();
    const todos = rows.map((row, index) => ({
      id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
      description: row.description as string,
      completed: row.completed === 'true',
      createdAt: new Date(Date.now() + index * 1000).toISOString(),
      updatedAt: new Date(Date.now() + index * 1000).toISOString(),
    }));
    await todoListPage.mockTodoList(todos);
  },
);

Given(
  'the API returns a server error for todos',
  async function (this: ICustomWorld) {
    todoListPage = new TodoListPage(this.page!, this.parameters.SERVER_URL);
    await todoListPage.mockServerError();
  },
);

When('I visit the home page', async function (this: ICustomWorld) {
  if (!todoListPage) {
    todoListPage = new TodoListPage(this.page!, this.parameters.SERVER_URL);
  }
  await todoListPage.goto();
});

Then('I see the loading indicator', async function (this: ICustomWorld) {
  await expect(todoListPage.getLoadingIndicator()).toBeVisible();
});

Then('I see the empty state message', async function (this: ICustomWorld) {
  await expect(todoListPage.getEmptyState()).toBeVisible();
  await expect(todoListPage.getEmptyState()).toContainText('No tasks yet');
});

Then(
  'I see {int} todos in the list',
  async function (this: ICustomWorld, count: number) {
    await expect(todoListPage.getTodoItems()).toHaveCount(count);
  },
);

Then(
  'the first todo is {string}',
  async function (this: ICustomWorld, description: string) {
    await expect(todoListPage.getTodoDescriptions().first()).toContainText(
      description,
    );
  },
);

Then(
  'the second todo is {string}',
  async function (this: ICustomWorld, description: string) {
    await expect(todoListPage.getTodoDescriptions().nth(1)).toContainText(
      description,
    );
  },
);

Then(
  'the todo {string} is shown with a strikethrough',
  async function (this: ICustomWorld, description: string) {
    const descriptionSpan = todoListPage
      .getTodoDescriptions()
      .filter({ hasText: description });
    await expect(descriptionSpan).toHaveClass(/line-through/);
  },
);

Then('I see an error message', async function (this: ICustomWorld) {
  await expect(todoListPage.getErrorState()).toBeVisible();
});

Then('I see a retry button', async function (this: ICustomWorld) {
  await expect(todoListPage.getRetryButton()).toBeVisible();
});
