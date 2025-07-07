import { test } from '@playwright/test';

test('record a simple trace', async ({ page }) => {
  await page.goto('https://example.com');
});
