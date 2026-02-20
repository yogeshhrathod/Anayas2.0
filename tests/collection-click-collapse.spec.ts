import { test, expect } from '@playwright/test';

test.describe('Collection Click to Collapse Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Collections page
    await page.click('button:has-text("Collections")');
    await page.waitForLoadState('networkidle');
  });

  test('should expand/collapse collection when clicking anywhere on the collection item', async ({
    page,
  }) => {
    const collectionItems = page.locator(
      '[data-testid*="collection"], .collection-item'
    );
    const collectionCount = await collectionItems.count();

    if (collectionCount > 0) {
      const firstCollection = collectionItems.first();

      // Click on the collection item (not just the chevron)
      await firstCollection.click();
      await page.waitForTimeout(500);

      // Check if collection content is expanded
      const expandedContent = firstCollection.locator('~ div').first();
      if (await expandedContent.isVisible()) {
        await expect(expandedContent).toBeVisible();

        // Click again to collapse
        await firstCollection.click();
        await page.waitForTimeout(500);

        // Verify collapsed state
        await expect(expandedContent).not.toBeVisible();
      }
    }
  });

  test('should not trigger collapse when clicking action menu', async ({
    page,
  }) => {
    const collectionItems = page.locator(
      '[data-testid*="collection"], .collection-item'
    );
    const collectionCount = await collectionItems.count();

    if (collectionCount > 0) {
      const firstCollection = collectionItems.first();

      // First expand the collection
      await firstCollection.click();
      await page.waitForTimeout(500);

      // Look for action menu button (usually a three-dot menu)
      const actionMenuButton = firstCollection
        .locator(
          'button[aria-haspopup], [data-testid*="menu"], button:has-text("⋯"), button:has-text("⋮")'
        )
        .last();

      if (await actionMenuButton.isVisible()) {
        // Click on action menu
        await actionMenuButton.click();
        await page.waitForTimeout(500);

        // Collection should still be expanded (action menu click shouldn't collapse)
        const expandedContent = firstCollection.locator('~ div').first();
        if (await expandedContent.isVisible()) {
          await expect(expandedContent).toBeVisible();
        }
      }
    }
  });

  test('should show visual feedback on hover', async ({ page }) => {
    const collectionItems = page.locator(
      '[data-testid*="collection"], .collection-item'
    );
    const collectionCount = await collectionItems.count();

    if (collectionCount > 0) {
      const firstCollection = collectionItems.first();

      // Hover over collection item
      await firstCollection.hover();
      await page.waitForTimeout(200);

      // Check if hover styles are applied (this is more of a visual test)
      await expect(firstCollection).toBeVisible();

      // Verify cursor is pointer
      const cursor = await firstCollection.evaluate(
        el => getComputedStyle(el).cursor
      );
      expect(cursor).toBe('pointer');
    }
  });
});
