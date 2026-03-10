import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { TodoPage } from '../../page-objects/TodoPage';
import type { ICustomWorld } from '../../support/custom-world';

let todoPage: TodoPage;
let initialTodoCount = 0;

Given(
  'the user navigates to the home page',
  async function (this: ICustomWorld) {
    todoPage = new TodoPage(this.page!, this.parameters.SERVER_URL);
    await todoPage.navigate();
    await todoPage.waitForTodoList();
  },
);

When(
  'the user types {string} in the todo input',
  async function (this: ICustomWorld, text: string) {
    await todoPage.typeInInput(text);
  },
);

When(
  'the user submits the create todo form',
  async function (this: ICustomWorld) {
    await todoPage.submitForm();
    await this.page!.waitForLoadState('networkidle');
  },
);

When(
  'the user submits the create todo form without typing anything',
  async function (this: ICustomWorld) {
    const before = await todoPage.getTodoDescriptionTexts();
    initialTodoCount = before.length;
    await todoPage.submitForm();
  },
);

Then(
  'the todo list contains {string}',
  async function (this: ICustomWorld, description: string) {
    // Use Playwright auto-retry locator assertion to wait for React re-render
    // after RTK Query invalidates ['Todo'] tag and re-fetches the list.
    await expect(
      this.page!.locator('[data-testid="todo-description"]').filter({ hasText: description }),
    ).toBeVisible();
  },
);

Then('the todo input is empty', async function (this: ICustomWorld) {
  await expect(
    this.page!.getByTestId('create-todo-input'),
  ).toHaveValue('');
});

Then('a validation error is displayed', async function (this: ICustomWorld) {
  expect(await todoPage.isValidationErrorVisible()).toBe(true);
});

Then('no new todo is added to the list', async function (this: ICustomWorld) {
  const descriptions = await todoPage.getTodoDescriptionTexts();
  expect(descriptions).toHaveLength(initialTodoCount);
});
