// Slow, screen-recorded Playwright config for human review.
// Use: npm run test:e2e:human  (after `npm run test:e2e` passes — enforced by the script).
// Videos land in test-results/ (gitignored).
const base = require('./playwright.config.js');
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  ...base,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'on-failure', outputFolder: 'test-results/html' }]],
  use: {
    ...base.use,
    headless: false,
    launchOptions: { slowMo: 1000 },
    video: 'on',
    trace: 'on',
  },
  projects: [
    { name: 'chromium-human', use: { ...require('@playwright/test').devices['Desktop Chrome'] } },
  ],
});
