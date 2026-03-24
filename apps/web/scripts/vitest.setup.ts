import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';

expect.extend(matchers);
declare let window: Window & typeof globalThis;

// Needed for testing Radix Select component
// https://github.com/testing-library/user-event/discussions/1087
(window as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent =
  class PointerEvent extends Event {} as unknown as typeof PointerEvent;
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();

afterEach(() => {
  cleanup();
});
