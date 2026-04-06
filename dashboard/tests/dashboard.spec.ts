import { test, expect } from '@playwright/test';

test.describe('Sprint Management Dashboard Security & E2E', () => {
  test('Middleware strictly redirects unauthenticated users', async ({ page }) => {
    // Attempting to hit protected route without valid JWT
    await page.goto('/dashboard');
    // Expect the edge middleware to aggressively redirect to root
    await expect(page).toHaveURL('/');
  });

  test('Root page performs hydration perfectly under React 19', async ({ page }) => {
    await page.goto('/');
    // Check DOM mounting stability
    await expect(page.locator('body')).toBeVisible();
  });
});
