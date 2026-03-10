import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { TodoPage } from '../../page-objects/TodoPage';
import type { ICustomWorld } from '../../support/custom-world';

// Pre-delete count — captured in "the user deletes the todo" step so the
// "is not in the list" assertion proves the item was removed (not that count = 0).
let preDeleteCount = 0;

When('the user reloads the page', async function (this: ICustomWorld) {
  await this.page!.reload();
  await this.page!.waitForSelector(
    '[data-testid="todo-list"], [data-testid="todo-list-empty"]',
  );
  await this.page!.waitForLoadState('networkidle');
});

When(
  'the user completes the todo {string}',
  async function (this: ICustomWorld, description: string) {
    const todoPage = new TodoPage(this.page!, this.parameters.SERVER_URL);
    await todoPage.toggleTodo(description);
    await this.page!.waitForLoadState('networkidle');
  },
);

When(
  'the user deletes the todo {string}',
  async function (this: ICustomWorld, description: string) {
    preDeleteCount = 0; // reset so a mid-step failure never bleeds into the next scenario
    const todoPage = new TodoPage(this.page!, this.parameters.SERVER_URL);
    // deleteTodo returns the count measured just before clicking delete;
    // this is the ground-truth baseline for "is not in the list" assertion.
    preDeleteCount = await todoPage.deleteTodo(description);
  },
);

Then(
  'the todo {string} is shown as completed',
  async function (this: ICustomWorld, description: string) {
    const todoPage = new TodoPage(this.page!, this.parameters.SERVER_URL);
    await expect(async () => {
      expect(await todoPage.isTodoCompleted(description)).toBe(true);
    }).toPass({ timeout: 10_000 });
    const toggleBtn = this.page!.locator('[data-testid="todo-item"]')
      .filter({ hasText: description })
      .first()
      .locator('[data-testid="todo-toggle-checkbox"]');
    await expect(toggleBtn).toHaveAttribute('aria-checked', 'true');
  },
);

Then(
  'the todo {string} is not in the list',
  async function (this: ICustomWorld, description: string) {
    const expectedCount = preDeleteCount - 1;
    await expect(async () => {
      const count = await this.page!.locator('[data-testid="todo-description"]')
        .filter({ hasText: description })
        .count();
      expect(count).toBe(expectedCount);
    }).toPass({ timeout: 10_000 });
  },
);
