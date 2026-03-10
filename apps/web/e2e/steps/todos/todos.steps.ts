import { When } from '@cucumber/cucumber';
import type { ICustomWorld } from '../../support/custom-world';

When('the user reloads the page', async function (this: ICustomWorld) {
  await this.page!.reload();
  await this.page!.waitForSelector(
    '[data-testid="todo-list"], [data-testid="todo-list-empty"]',
  );
  await this.page!.waitForLoadState('networkidle');
});
