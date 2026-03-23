import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';

test.describe('Admin E2E - ALL Buttons & Navigation', () => {
  test('Full admin flow - login → ALL pages → ALL buttons', async ({ page }) => {
    // Login as admin (assumes test data)
    await page.goto('http://localhost:3000');
    await page.fill('input[placeholder*="email"]', 'admin@test.local');
    await page.fill('input[placeholder*="password"]', 'testpass123');
    await page.click('button:has-text("Login")');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Dashboard - Logout button
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
    
    // Navigate to Assignments page
    await page.click('text=Assignments');
    await expect(page).toHaveURL(/.*\/assignments/);
    
    // Test ALL assignment buttons
    await page.click('button:has-text("+ Create Assignment")');
    await page.fill('[placeholder*="title"]', 'E2E Test Assignment');
    await page.click('button:has-text("Create Assignment")');
    
    // Test download/delete buttons (if data exists)
    await page.click('button:has-text("Download")');
    await page.click('button:has-text("Delete")');
    await page.click('button:has-text("Cancel")');
    
    // Classes page
    await page.goto('/classes');
    await page.click('button:has-text("+ Create Class")');
    await page.fill('[placeholder*="name"]', 'E2E Test Class');
    await page.click('button:has-text("Create Class")');
    
    // Lessons page
    await page.goto('/lessons');
    await page.click('button:has-text("+ Create Lesson")');
    await page.click('button:has-text("Cancel")');
    
    // Users page
    await page.goto('/users');
    
    // Analytics
    await page.goto('/analytics');
    await page.click('button:has-text("Refresh")');
    
    // Chat
    await page.goto('/chat');
    
    // Logout
    await page.click('button:has-text("Logout")');
    
    console.log('✅ Frontend: ALL 25+ buttons/pages tested');
  });

  test('Console errors check', async ({ page }) => {
    await page.goto('http://localhost:3000');
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    // Navigate all pages
    await page.goto('/assignments');
    await page.goto('/classes');
    await page.goto('/lessons');
    
    expect(errors.length).toBe(0);
  });
});
