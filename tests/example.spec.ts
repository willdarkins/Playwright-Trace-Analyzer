import { test, expect } from '@playwright/test';

test('homepage has Playwright text', async ({ page }) => {
  await page.goto('https://playwright.dev');
  await expect(page.locator('body')).toContainText('Playwright');
});
