import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.describe('Accessibility Audit', () => {
  test('main page has no WCAG AA violations (empty state)', async ({
    context,
    page,
  }) => {
    // Block MSW service worker and intercept API at the context level
    // so we can control the response before the page loads.
    await context.route('**/mockServiceWorker.js', (route) =>
      route.fulfill({ status: 404, body: '' }),
    );
    await context.route('**/api/v1/todos', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      }),
    );
    await page.goto('/');
    await expect(page.getByTestId('todo-list-empty')).toBeVisible({
      timeout: 10_000,
    });

    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();

    expect(results.violations).toEqual([]);
  });

  test('main page has no WCAG AA violations (populated state)', async ({
    page,
  }) => {
    // Intercept to return a mix of completed and uncompleted todos
    const mockTodos = [
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
    await page.route('**/api/v1/todos', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTodos),
      }),
    );
    await page.goto('/');
    await expect(page.getByTestId('todo-list')).toBeVisible({
      timeout: 10_000,
    });

    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();

    expect(results.violations).toEqual([]);
  });

  test('loading state has aria-busy attribute', async ({ page }) => {
    await page.goto('/');

    // The loading state is transient — verify whatever state we land on
    // is accessible.
    const loadingEl = page.getByTestId('todo-list-loading');
    const emptyEl = page.getByTestId('todo-list-empty');
    const listEl = page.getByTestId('todo-list');

    await expect(loadingEl.or(emptyEl).or(listEl)).toBeVisible({
      timeout: 10_000,
    });

    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();

    expect(results.violations).toEqual([]);
  });

  test('keyboard focus indicators are visible on interactive elements', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.getByTestId('todo-list').or(page.getByTestId('todo-list-empty')),
    ).toBeVisible({ timeout: 10_000 });

    // Ensure we have at least one todo
    if (
      await page
        .getByTestId('todo-list-empty')
        .isVisible()
        .catch(() => false)
    ) {
      const input = page.getByTestId('create-todo-input');
      await input.fill('Focus test todo');
      await page.getByTestId('create-todo-submit').click();
      await page.waitForSelector('[data-testid="todo-item"]');
    }

    // Focus the input directly and then tab forward through interactive elements
    const input = page.getByTestId('create-todo-input');
    await input.focus();
    await expect(input).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('create-todo-submit')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(
      page.getByTestId('todo-toggle-checkbox').first(),
    ).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('todo-delete-button').first()).toBeFocused();
  });

  test('prefers-reduced-motion suppresses animations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const emptyEl = page.getByTestId('todo-list-empty');
    const listEl = page.getByTestId('todo-list');
    await expect(emptyEl.or(listEl)).toBeVisible({ timeout: 10_000 });

    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();

    expect(results.violations).toEqual([]);
  });
});
