const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 15000,
  expect: { timeout: 3000 },
  use: { actionTimeout: 3000 },
  fullyParallel: true,
  reporter: process.env.CI
    ? [['list'], ['github'], ['json', { outputFile: 'resultado.json' }]]
    : [['list']],
});
