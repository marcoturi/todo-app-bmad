import { config } from '@/test/config';

export const initMocks = async () => {
  if (config.API_MOCKING === 'true' && import.meta.env.MODE === 'development') {
    const { worker } = await import('./browser');
    await worker.start().catch(() => {
      // Service worker blocked (e.g., during e2e tests) — continue without mocking
    });
  }
};
