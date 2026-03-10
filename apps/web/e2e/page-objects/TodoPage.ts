import type { Page } from '@playwright/test';

export class TodoPage {
  constructor(
    private readonly page: Page,
    private readonly baseUrl: string,
  ) { }

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
}
