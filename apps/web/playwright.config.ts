import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/a11y',
  timeout: 60_000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.SERVER_URL || 'http://localhost:5173',
  },
  projects: [{ name: 'chromium' }],
});
