// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    trace: 'on',
    screenshot: 'on',
    video: 'retain-on-failure',
  },
});
