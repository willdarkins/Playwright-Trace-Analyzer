import { test, expect, request } from '@playwright/test';

test('direct API fetch', async () => {
  const apiContext = await request.newContext();
  const response = await apiContext.get('https://jsonplaceholder.typicode.com/todos/1');
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body).toHaveProperty('id', 1);
  await apiContext.dispose();
});
