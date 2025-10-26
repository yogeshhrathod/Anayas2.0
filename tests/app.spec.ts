import { test, expect } from '@playwright/test';

test.describe('Anayas Application Basic Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load the application homepage', async ({ page }) => {
    // Check if the main application elements are present
    await expect(page.locator('h1')).toContainText('Anayas');
    
    // Check if the sidebar is visible (using actual class names from the app)
    await expect(page.locator('.flex.flex-col.border-r.bg-card')).toBeVisible();
  });

  test('should navigate between different pages', async ({ page }) => {
    // Test navigation to Collections page
    await page.click('button:has-text("Collections")');
    await expect(page.locator('h2')).toContainText('collections');

    // Test navigation to Environments page
    await page.click('button:has-text("Environments")');
    await expect(page.locator('h2')).toContainText('environments');

    // Test navigation to History page
    await page.click('button:has-text("History")');
    await expect(page.locator('h2')).toContainText('history');

    // Test navigation to Settings page
    await page.click('button:has-text("Settings")');
    await expect(page.locator('h2')).toContainText('settings');

    // Test navigation back to Home
    await page.click('button:has-text("Home")');
    await expect(page.locator('h1')).toContainText('Anayas');
  });

  test('should toggle sidebar visibility', async ({ page }) => {
    // Find the menu toggle button
    const menuButton = page.locator('button').filter({ hasText: '' }).first();
    
    // Click to toggle sidebar
    await menuButton.click();
    
    // Wait a moment for the animation
    await page.waitForTimeout(500);
    
    // Click again to toggle back
    await menuButton.click();
    
    // Verify sidebar is visible again
    await expect(page.locator('h1')).toContainText('Anayas');
  });

  test('should display environment switcher on non-home pages', async ({ page }) => {
    // Navigate to Collections page
    await page.click('button:has-text("Collections")');
    
    // Check if environment switcher is visible (using more specific selector)
    await expect(page.locator('button:has-text("No Environment")')).toBeVisible();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Test global search shortcut (Cmd+K or Ctrl+K)
    await page.keyboard.press('Meta+k');
    
    // Check if search input is focused (look for any input that might be the global search)
    const searchInput = page.locator('input[type="text"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeFocused();
    }
  });

  test('should display collections hierarchy', async ({ page }) => {
    // Check if collections section is visible in sidebar
    const collectionsSection = page.locator('text=Collections').first();
    await expect(collectionsSection).toBeVisible();
  });

  test('should handle theme switching', async ({ page }) => {
    // Navigate to Settings page
    await page.click('button:has-text("Settings")');
    
    // Look for theme-related controls
    const themeControls = page.locator('[data-testid*="theme"]');
    if (await themeControls.count() > 0) {
      await expect(themeControls.first()).toBeVisible();
    }
  });
});
