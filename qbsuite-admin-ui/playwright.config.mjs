import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '*.spec.js', timeout: 45000, workers: 1,
  use: { baseURL: 'http://127.0.0.1:3107', headless: true,
    launchOptions: { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' },
    screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  reporter: 'list',
});
