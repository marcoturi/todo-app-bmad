import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { TodoPage } from '../../page-objects/TodoPage';
import type { ICustomWorld } from '../../support/custom-world';

let todoPage: TodoPage;
let initialTodoCount = 0;
// Per-scenario baseline counts captured at navigation time.
// Lets "the todo list contains" prove a NEW item was added vs a dirty-DB pre-existing entry.
// WARNING: module-level state is safe for sequential runs (test:e2e) only.
// The parallel `e2e` script (--parallel 5) can cause state bleed between workers.
const initialDescriptionCounts = new Map<string, number>();

Given(
  'the user navigates to the home page',
  async function (this: ICustomWorld) {
    todoPage = new TodoPage(this.page!, this.parameters.SERVER_URL);
    await todoPage.navigate();
    await todoPage.waitForTodoList();
    // Snapshot description counts so later assertions can prove a new item was added.
    const texts = await todoPage.getTodoDescriptionTexts();
    initialDescriptionCounts.clear();
    for (const text of texts) {
      initialDescriptionCounts.set(
        text,
        (initialDescriptionCounts.get(text) ?? 0) + 1,
      );
    }
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
    // Snapshot total item count before submit so we can wait for DOM update
    const totalBefore = await this.page!.locator(
      '[data-testid="todo-description"]',
    ).count();

    await Promise.all([
      this.page!.waitForResponse(
        (resp) =>
          resp.url().includes('/api/v1/todos') &&
          resp.request().method() === 'POST',
      ),
      todoPage.submitForm(),
    ]);
    // Wait for React to render the new item (handles concurrent-mode deferred commits)
    await expect(
      this.page!.locator('[data-testid="todo-description"]'),
    ).toHaveCount(totalBefore + 1, { timeout: 10_000 });
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
    const priorCount = initialDescriptionCounts.get(description) ?? 0;
    const locator = this.page!.locator(
      '[data-testid="todo-description"]',
    ).filter({ hasText: description });
    // Prove a NEW item was added — not a false positive from a dirty-DB pre-existing entry.
    // toPass() retries until the RTK Query re-fetch completes and React re-renders the list.
    await expect(async () => {
      expect(await locator.count()).toBeGreaterThan(priorCount);
    }).toPass({ timeout: 10_000 });
    await expect(locator.first()).toBeVisible();
  },
);

Then('the todo input is empty', async function (this: ICustomWorld) {
  await expect(this.page!.getByTestId('create-todo-input')).toHaveValue('');
});

Then('a validation error is displayed', async function (this: ICustomWorld) {
  expect(await todoPage.isValidationErrorVisible()).toBe(true);
});

Then('no new todo is added to the list', async function (this: ICustomWorld) {
  const descriptions = await todoPage.getTodoDescriptionTexts();
  expect(descriptions).toHaveLength(initialTodoCount);
});
