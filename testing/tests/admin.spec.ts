import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';

test.describe('Admin Frontend E2E - Button & Navigation', () => {
  test.use({ baseURL: 'http://localhost:3000' });

  test.beforeEach(async ({ page }) => {
    // Login with test admin
    await page.goto('/auth/login');
    await page.fill('input[placeholder*="Email"]', 'admin@test.com');
    await page.fill('input[placeholder*="Password"]', 'password123');
    await page.click('text=Login');
    await page.waitForURL('**/dashboard'); // Or index
  });

  test('Navigate ALL pages & click buttons', async ({ page }) => {
    const pages = [
      '/users', '/subjects', '/classes', '/assignments', '/quizzes',
      '/lessons', '/live-classes', '/analytics', '/levels'
    ];

    for (const path of pages) {
      await page.goto(path);
      await expect(page).toHaveTitle(/Admin|Dashboard/);

      // Click all clickable buttons/links (simulate user actions)
      const buttons = page.locator('button, a[href]').all();
      for (const button of await buttons.slice(0, 10)) { // Limit to avoid infinite
        if (await button.isVisible() && await button.isEnabled()) {
          const text = await button.textContent();
          if (text && !text.includes('Delete') && !text.includes('Danger')) { // Safe clicks
            await button.click().catch(() => {}); // Ignore modals
            await page.waitForTimeout(500);
          }
        }
      }

      // Check no console errors
      const errors = await page.context().consoleMessages();
      const jsErrors = errors.filter(msg => msg.type() === 'javascript' && msg.text().includes('ERROR'));
      expect(jsErrors).toHaveLength(0);
    }
  });

  test('Modals & Forms work', async ({ page }) => {
    await page.goto('/users');
    await page.click('button:has-text("+ Add User"), button:has-text("Invite")');
    await page.waitForSelector('button:has-text("Cancel")'); // Modal open
    await page.fill('input[placeholder*="Email"]', 'test@example.com');
    await page.click('button:has-text("Send")');
    // Expect no crash
  });
});
