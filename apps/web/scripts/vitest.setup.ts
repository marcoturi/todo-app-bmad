import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { handlers } from '../src/test/handlers';

expect.extend(matchers);
declare let window: Window & typeof globalThis;

// Needed for testing Radix Select component
// https://github.com/testing-library/user-event/discussions/1087
(window as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent =
  class PointerEvent extends Event {} as unknown as typeof PointerEvent;
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();

export const server = setupServer(...handlers);

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => {
  server.close();
});
