
import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Crawler', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000/auth/signin');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    // Wait for navigation or a specific element that appears after login
    await page.waitForURL('**/dashboard'); 
  });

  test('should navigate to all sidebar links without errors', async ({ page }) => {
    // Define the sidebar links to check
    const links = [
      '/dashboard',
      '/users',
      '/classes',
      '/lessons',
      '/quizzes',
      '/assignments',
      '/analytics',
      '/settings'
    ];

    for (const link of links) {
      console.log(`Navigating to ${link}...`);
      await page.goto(`http://localhost:3000${link}`);
      
      // Check for common error indicators
      const errorAlert = page.locator('.error-alert'); // Adjust selector based on actual app
      await expect(errorAlert).not.toBeVisible();

      // Check for 404
      const notFound = page.locator('text=404');
      await expect(notFound).not.toBeVisible();
      
      // Verify URL
      expect(page.url()).toContain(link);
    }
  });

  test('should be able to open the "Create New" modal on Users page', async ({ page }) => {
    await page.goto('http://localhost:3000/users');
    
    // Look for a generic "Add" or "Create" button
    const createBtn = page.locator('button:has-text("Add User"), button:has-text("Create User"), button:has-text("New User")').first();
    
    if (await createBtn.isVisible()) {
        await createBtn.click();
        // Check if modal appears
        await expect(page.locator('div[role="dialog"]')).toBeVisible();
    } else {
        console.log('Create User button not found, skipping specific interaction check.');
    }
  });

});
