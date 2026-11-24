import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 20000,
  expect: { timeout: 5000 },
  use: { browserName: 'chromium', baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure' },
  reporter: 'list',
});
