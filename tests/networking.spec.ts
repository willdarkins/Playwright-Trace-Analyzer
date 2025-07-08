import { test } from '@playwright/test';

test.use({ trace: 'on' });

test.describe('Network Trace Demo', () => {
  test('records network activity via page.request', async ({ page }) => {
    await page.goto('https://example.com');

    const response = await page.request.get('https://jsonplaceholder.typicode.com/todos/1');
    const data = await response.json();
    console.log('Fetched TODO via page.request:', data);

    await page.waitForTimeout(500);
  });
});
