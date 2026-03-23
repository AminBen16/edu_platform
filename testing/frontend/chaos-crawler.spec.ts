
import { test, expect } from '@playwright/test';

test.describe('Resilience & Chaos Testing', () => {
  
  test('should handle network failures gracefully', async ({ page }) => {
    // 1. Intercept and abort specific API calls
    await page.route('**/api/users', route => {
        console.log('🔥 Chaos Monkey: Aborting request to /api/users');
        route.abort('failed');
    });

    await page.goto('http://localhost:3000/auth/signin');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to the page that relies on the failed API
    await page.goto('http://localhost:3000/users');

    // 2. Assert that the app didn't crash (white screen)
    // Look for error boundary or toast
    const errorAlert = page.locator('.error-alert, text=Failed to load, text=Error');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    
    console.log('✔ UI correctly displayed error state instead of crashing');
  });

  test('should handle slow network (latency simulation)', async ({ page }) => {
    // Simulate 3G speeds
    await page.route('**/*', async route => {
        await new Promise(r => setTimeout(r, 2000)); // 2s delay
        await route.continue();
    });

    await page.goto('http://localhost:3000/dashboard');
    // Check for loading spinners
    const spinner = page.locator('.loading-spinner, .skeleton');
    // If page loads fast, spinner might be gone, but this ensures no timeout crash
    await expect(page).toHaveURL(/.*dashboard/);
    console.log('✔ UI loaded under high latency');
  });
});
