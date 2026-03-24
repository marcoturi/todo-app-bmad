import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const API_URL = process.env.VITE_API_URL ?? 'http://localhost:3000';

async function createTodoViaAPI(description: string): Promise<string> {
  const res = await fetch(new URL('/api/v1/todos', API_URL).href, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) throw new Error(`Failed to create todo: ${res.status}`);
  const todo = await res.json();
  return todo.id;
}

async function deleteTodoViaAPI(id: string): Promise<void> {
  const res = await fetch(new URL(`/api/v1/todos/${id}`, API_URL).href, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete todo: ${res.status}`);
  }
}

function parseDurationToMs(value: string): number {
  const match = value.match(/^([\d.]+)(ms|s)$/);
  if (!match) return 0;
  const num = Number.parseFloat(match[1]);
  return match[2] === 's' ? num * 1000 : num;
}

function formatViolations(
  violations: {
    id: string;
    impact?: string | null;
    description: string;
    nodes: { html: string }[];
  }[],
): string {
  return violations
    .map(
      (v) =>
        `[${v.impact}] ${v.id}: ${v.description}\n${v.nodes.map((n) => `  - ${n.html}`).join('\n')}`,
    )
    .join('\n\n');
}

test.describe('Accessibility Audit', () => {
  test.describe('Empty todo list state', () => {
    test('has no WCAG AA violations', async ({ context, page }) => {
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

      const results = await new AxeBuilder({ page })
        .withTags(wcagTags)
        .analyze();

      expect(
        results.violations,
        formatViolations(results.violations),
      ).toHaveLength(0);
    });
  });

  test.describe('Populated todo list state', () => {
    test('has no WCAG AA violations with todos present', async ({ page }) => {
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

      const results = await new AxeBuilder({ page })
        .withTags(wcagTags)
        .analyze();

      expect(
        results.violations,
        formatViolations(results.violations),
      ).toHaveLength(0);
    });
  });

  test.describe('Loading state', () => {
    test('has no WCAG AA violations during loading', async ({ page }) => {
      // Intercept the API and delay the response so we capture the loading state
      let resolveResponse!: () => void;
      const responseReady = new Promise<void>(
        (resolve) => (resolveResponse = resolve),
      );

      await page.route('**/api/v1/todos', async (route) => {
        await responseReady;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '[]',
        });
      });

      await page.goto('/');
      // The loading skeleton should be visible while the request is held
      await expect(page.getByTestId('todo-list-loading')).toBeVisible({
        timeout: 5000,
      });

      const results = await new AxeBuilder({ page })
        .withTags(wcagTags)
        .analyze();

      expect(
        results.violations,
        formatViolations(results.violations),
      ).toHaveLength(0);

      // Release the response so the page can finish
      resolveResponse();
    });
  });

  test.describe('Component accessibility', () => {
    test('CreateTodoForm inputs have accessible labels', async ({ page }) => {
      await page.goto('/');
      await expect(
        page.getByTestId('todo-list').or(page.getByTestId('todo-list-empty')),
      ).toBeVisible({ timeout: 10_000 });

      const input = page.getByTestId('create-todo-input');
      await expect(input).toHaveAttribute('aria-label');

      const submit = page.getByTestId('create-todo-submit');
      const submitName =
        (await submit.getAttribute('aria-label')) ?? (await submit.innerText());
      expect(submitName.length).toBeGreaterThan(0);
    });

    test('CreateTodoForm associates validation error via aria-describedby', async ({
      page,
    }) => {
      await page.goto('/');
      await expect(
        page.getByTestId('todo-list').or(page.getByTestId('todo-list-empty')),
      ).toBeVisible({ timeout: 10_000 });

      // Submit empty form to trigger validation
      await page.getByTestId('create-todo-submit').click();

      const input = page.getByTestId('create-todo-input');
      await expect(input).toHaveAttribute(
        'aria-describedby',
        'create-todo-validation-error',
      );
      const errorEl = page.locator('#create-todo-validation-error');
      await expect(errorEl).toBeVisible();
    });

    test('TodoItem interactive controls have accessible names', async ({
      page,
    }) => {
      const todoId = await createTodoViaAPI('A11y test item');
      try {
        await page.goto('/');
        await expect(page.getByTestId('todo-item').first()).toBeVisible({
          timeout: 10_000,
        });

        const toggle = page.getByTestId('todo-toggle-checkbox').first();
        await expect(toggle).toHaveAttribute('aria-label');

        const deleteBtn = page.getByTestId('todo-delete-button').first();
        await expect(deleteBtn).toHaveAttribute('aria-label');
      } finally {
        await deleteTodoViaAPI(todoId);
      }
    });

    test('todo list uses semantic list structure', async ({ page }) => {
      const todoId = await createTodoViaAPI('Semantic test item');
      try {
        await page.goto('/');
        await expect(page.getByTestId('todo-item').first()).toBeVisible({
          timeout: 10_000,
        });

        const list = page.getByTestId('todo-list');
        const tagName = await list.evaluate((el) => el.tagName.toLowerCase());
        expect(['ul', 'ol']).toContain(tagName);

        const items = list.locator(':scope > li');
        await expect(items.first()).toBeVisible();
      } finally {
        await deleteTodoViaAPI(todoId);
      }
    });
  });

  test.describe('Focus visibility', () => {
    test('interactive elements show visible focus indicator', async ({
      page,
    }) => {
      const todoId = await createTodoViaAPI('Focus test item');
      try {
        await page.goto('/');
        await expect(page.getByTestId('todo-item').first()).toBeVisible({
          timeout: 10_000,
        });

        // Focus the input and tab through elements
        const input = page.getByTestId('create-todo-input');
        await input.focus();
        await expect(input).toBeFocused();

        await page.keyboard.press('Tab');
        await expect(page.getByTestId('create-todo-submit')).toBeFocused();

        await page.keyboard.press('Tab');
        await expect(
          page.getByTestId('todo-toggle-checkbox').first(),
        ).toBeFocused();

        // Verify the focused element has a visible focus ring
        const focusStyles = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el) return null;
          const styles = window.getComputedStyle(el);
          return {
            outlineWidth: styles.outlineWidth,
            outline: styles.outline,
            boxShadow: styles.boxShadow,
          };
        });

        expect(focusStyles).not.toBeNull();
        const hasVisibleFocus =
          (focusStyles!.outlineWidth !== '0px' &&
            !focusStyles!.outline.includes('none')) ||
          (focusStyles!.boxShadow !== 'none' && focusStyles!.boxShadow !== '');
        expect(hasVisibleFocus).toBe(true);
      } finally {
        await deleteTodoViaAPI(todoId);
      }
    });
  });

  test.describe('Reduced motion', () => {
    test('prefers-reduced-motion suppresses animations', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');

      await expect(
        page.getByTestId('todo-list-empty').or(page.getByTestId('todo-list')),
      ).toBeVisible({ timeout: 10_000 });

      // Verify CSS actually applies reduced motion
      const durations = await page.evaluate(() => {
        const el = document.querySelector('body');
        if (!el) return null;
        const styles = window.getComputedStyle(el);
        return {
          animationDuration: styles.animationDuration,
          transitionDuration: styles.transitionDuration,
        };
      });

      expect(durations).not.toBeNull();
      // The global rule sets 0.01ms — browsers may serialize as
      // "0s", "0.01ms", or "0.00001s"; just verify it's ≤ 1ms.
      const durationMs = parseDurationToMs(durations!.animationDuration);
      expect(durationMs).toBeLessThanOrEqual(1);

      const results = await new AxeBuilder({ page })
        .withTags(wcagTags)
        .analyze();

      expect(
        results.violations,
        formatViolations(results.violations),
      ).toHaveLength(0);
    });
  });
});
