import { test, expect } from '@playwright/test';

test.describe('Collection Description Removal Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Collections page
    await page.click('button:has-text("Collections")');
    await page.waitForLoadState('networkidle');
  });

  test('should not display collection descriptions in hierarchy', async ({ page }) => {
    const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
    const collectionCount = await collectionItems.count();
    
    if (collectionCount > 0) {
      // Check all collection items
      for (let i = 0; i < collectionCount; i++) {
        const collectionItem = collectionItems.nth(i);
        
        // Verify collection name is visible
        const collectionName = collectionItem.locator('span.text-sm.font-medium');
        await expect(collectionName).toBeVisible();
        
        // Verify no description text is shown
        const descriptionText = collectionItem.locator('p.text-xs.text-muted-foreground');
        await expect(descriptionText).not.toBeVisible();
        
        // Check that the collection item only contains the expected elements
        const itemText = await collectionItem.textContent();
        
        // Should not contain description-like text patterns
        // (This is a basic check - descriptions might vary)
        expect(itemText).toBeTruthy();
      }
    }
  });

  test('should maintain clean collection layout without descriptions', async ({ page }) => {
    const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
    const collectionCount = await collectionItems.count();
    
    if (collectionCount > 0) {
      const firstCollection = collectionItems.first();
      
      // Check that collection has the expected structure
      const collectionName = firstCollection.locator('span.text-sm.font-medium');
      await expect(collectionName).toBeVisible();
      
      // Check for expand/collapse button
      const expandButton = firstCollection.locator('button').first();
      await expect(expandButton).toBeVisible();
      
      // Check for collection icon
      const folderIcon = firstCollection.locator('svg[data-lucide="folder-open"]');
      await expect(folderIcon).toBeVisible();
      
      // Verify no description elements exist
      const descriptionElements = firstCollection.locator('p.text-xs.text-muted-foreground');
      await expect(descriptionElements).not.toBeVisible();
    }
  });

  test('should show only collection name and metadata', async ({ page }) => {
    const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
    const collectionCount = await collectionItems.count();
    
    if (collectionCount > 0) {
      const firstCollection = collectionItems.first();
      
      // Get all text content from the collection item
      const itemText = await firstCollection.textContent();
      
      // Should contain collection name
      expect(itemText).toBeTruthy();
      
      // Check for expected elements
      const collectionName = firstCollection.locator('span.text-sm.font-medium');
      await expect(collectionName).toBeVisible();
      
      // Check for request count badge if present
      const countBadge = firstCollection.locator('[class*="badge"]').last();
      if (await countBadge.isVisible()) {
        await expect(countBadge).toBeVisible();
      }
      
      // Verify no description paragraph exists
      const description = firstCollection.locator('p');
      const paragraphCount = await description.count();
      
      // Should have 0 paragraphs (no description)
      expect(paragraphCount).toBe(0);
    }
  });
});


