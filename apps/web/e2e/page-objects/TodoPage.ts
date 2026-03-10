import { expect, type Page } from '@playwright/test';

export class TodoPage {
  constructor(
    private readonly page: Page,
    private readonly baseUrl: string,
  ) {}

  async navigate(): Promise<void> {
    await this.page.goto(this.baseUrl);
  }

  async waitForTodoList(): Promise<void> {
    await this.page.waitForSelector(
      '[data-testid="todo-list"], [data-testid="todo-list-empty"]',
    );
  }

  async typeInInput(text: string): Promise<void> {
    await this.page.fill('[data-testid="create-todo-input"]', text);
  }

  async submitForm(): Promise<void> {
    await this.page.click('[data-testid="create-todo-submit"]');
  }

  async getInputValue(): Promise<string> {
    return this.page.inputValue('[data-testid="create-todo-input"]');
  }

  async isValidationErrorVisible(): Promise<boolean> {
    return this.page.isVisible('[data-testid="create-todo-validation-error"]');
  }

  async getTodoDescriptionTexts(): Promise<string[]> {
    return this.page.$$eval('[data-testid="todo-description"]', (els) =>
      els.map((el) => el.textContent ?? ''),
    );
  }

  async toggleTodo(description: string): Promise<void> {
    const item = this.page
      .locator('[data-testid="todo-item"]')
      .filter({ hasText: description })
      .first();
    const toggleButton = item.locator('[data-testid="todo-toggle-checkbox"]');
    // Wait for the PATCH response and GET re-fetch concurrent with clicking
    await Promise.all([
      this.page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/v1/todos') &&
          resp.request().method() === 'PATCH',
      ),
      this.page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/v1/todos') &&
          resp.request().method() === 'GET',
      ),
      toggleButton.click(),
    ]);
    await this.page.waitForLoadState('networkidle');
  }

  async deleteTodo(description: string): Promise<number> {
    // Ensure any in-flight GETs (e.g., after a preceding POST) have settled
    // before counting, so countBefore reflects the stable DOM state.
    await this.page.waitForLoadState('networkidle');

    const descLocator = this.page
      .locator('[data-testid="todo-description"]')
      .filter({ hasText: description });
    const countBefore = await descLocator.count();
    // Confirm DOM is stable at this count (guards against React 19 deferred commits
    // that may still be in flight even after networkidle).
    await expect(descLocator).toHaveCount(countBefore, { timeout: 3000 });

    const item = this.page
      .locator('[data-testid="todo-item"]')
      .filter({ hasText: description })
      .first();
    const deleteButton = item.locator('[data-testid="todo-delete-button"]');

    await Promise.all([
      this.page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/v1/todos') &&
          resp.request().method() === 'DELETE',
      ),
      this.page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/v1/todos') &&
          resp.request().method() === 'GET',
      ),
      deleteButton.click(),
    ]);
    await this.page.waitForLoadState('networkidle');

    // Wait for the DOM to reflect the deletion (uses auto-retry assertion)
    await expect(descLocator).toHaveCount(countBefore - 1, { timeout: 15_000 });
    // Return countBefore so callers can compute the expected post-delete count
    return countBefore;
  }

  async isTodoCompleted(description: string): Promise<boolean> {
    const item = this.page
      .locator('[data-testid="todo-item"]')
      .filter({ hasText: description })
      .first();
    const descSpan = item.locator('[data-testid="todo-description"]');
    const classes = await descSpan.getAttribute('class');
    return classes?.includes('line-through') ?? false;
  }
}
