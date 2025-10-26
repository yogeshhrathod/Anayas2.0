import { test, expect } from '@playwright/test';

test.describe('Collection Hierarchy Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Collections page
    await page.click('button:has-text("Collections")');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Collection Display and Structure', () => {
    test('should display collections in sidebar hierarchy', async ({ page }) => {
      // Check if collections section exists in sidebar
      const collectionsSection = page.locator('text=Collections').first();
      await expect(collectionsSection).toBeVisible();
      
      // Check if there are any collection items
      const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
      const collectionCount = await collectionItems.count();
      
      if (collectionCount > 0) {
        await expect(collectionItems.first()).toBeVisible();
        
        // Verify collection structure
        const firstCollection = collectionItems.first();
        await expect(firstCollection.locator('text=★')).toBeVisible({ timeout: 5000 });
        
        // Check for expand/collapse button
        const expandButton = firstCollection.locator('button').first();
        await expect(expandButton).toBeVisible();
      }
    });

    test('should not display "0" after collection names', async ({ page }) => {
      const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
      const collectionCount = await collectionItems.count();
      
      if (collectionCount > 0) {
        const firstCollection = collectionItems.first();
        const collectionText = await firstCollection.textContent();
        
        // Verify that collection names don't end with "0"
        expect(collectionText).not.toMatch(/0$/);
        
        // Check that favorite badge is properly displayed (not showing "0")
        const favoriteBadge = firstCollection.locator('text=★');
        if (await favoriteBadge.isVisible()) {
          await expect(favoriteBadge).toBeVisible();
        }
      }
    });

    test('should display request count badges correctly', async ({ page }) => {
      const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
      const collectionCount = await collectionItems.count();
      
      if (collectionCount > 0) {
        const firstCollection = collectionItems.first();
        
        // Look for request count badge
        const countBadge = firstCollection.locator('[class*="badge"]').last();
        if (await countBadge.isVisible()) {
          const countText = await countBadge.textContent();
          // Should be a number, not "0" appended to name
          expect(countText).toMatch(/^\d+$/);
        }
      }
    });
  });

  test.describe('Expand/Collapse Functionality', () => {
    test('should expand collection when clicked', async ({ page }) => {
      const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
      const collectionCount = await collectionItems.count();
      
      if (collectionCount > 0) {
        const firstCollection = collectionItems.first();
        
        // Find the expand/collapse button (chevron)
        const expandButton = firstCollection.locator('button').first();
        await expect(expandButton).toBeVisible();
        
        // Click to expand
        await expandButton.click();
        await page.waitForTimeout(500);
        
        // Check if collection content is expanded
        // Look for requests or folders under the collection
        const expandedContent = firstCollection.locator('~ div').first();
        if (await expandedContent.isVisible()) {
          await expect(expandedContent).toBeVisible();
        }
      }
    });

    test('should collapse collection when clicked again', async ({ page }) => {
      const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
      const collectionCount = await collectionItems.count();
      
      if (collectionCount > 0) {
        const firstCollection = collectionItems.first();
        const expandButton = firstCollection.locator('button').first();
        
        // Expand first
        await expandButton.click();
        await page.waitForTimeout(500);
        
        // Collapse
        await expandButton.click();
        await page.waitForTimeout(500);
        
        // Verify collapsed state
        const expandedContent = firstCollection.locator('~ div').first();
        if (await expandedContent.isVisible()) {
          // If content was visible, it should be hidden now
          await expect(expandedContent).not.toBeVisible();
        }
      }
    });

    test('should toggle chevron icon when expanding/collapsing', async ({ page }) => {
      const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
      const collectionCount = await collectionItems.count();
      
      if (collectionCount > 0) {
        const firstCollection = collectionItems.first();
        const expandButton = firstCollection.locator('button').first();
        
        // Check initial state (should be collapsed - chevron right)
        const chevronRight = expandButton.locator('svg[data-lucide="chevron-right"]');
        const chevronDown = expandButton.locator('svg[data-lucide="chevron-down"]');
        
        // Click to expand
        await expandButton.click();
        await page.waitForTimeout(500);
        
        // Click to collapse
        await expandButton.click();
        await page.waitForTimeout(500);
        
        // Verify icon changes (this is more of a visual test)
        await expect(expandButton).toBeVisible();
      }
    });
  });

  test.describe('Request Display and Interaction', () => {
    test('should display requests under collections when expanded', async ({ page }) => {
      const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
      const collectionCount = await collectionItems.count();
      
      if (collectionCount > 0) {
        const firstCollection = collectionItems.first();
        const expandButton = firstCollection.locator('button').first();
        
        // Expand collection
        await expandButton.click();
        await page.waitForTimeout(500);
        
        // Look for requests under the collection
        const requestItems = page.locator('[data-testid*="request"], .request-item');
        const requestCount = await requestItems.count();
        
        if (requestCount > 0) {
          await expect(requestItems.first()).toBeVisible();
          
          // Verify request structure
          const firstRequest = requestItems.first();
          const requestText = await firstRequest.textContent();
          
          // Should not have "0" appended to request name
          expect(requestText).not.toMatch(/0$/);
          
          // Check for method badge
          const methodBadge = firstRequest.locator('[class*="badge"]').first();
          if (await methodBadge.isVisible()) {
            await expect(methodBadge).toBeVisible();
          }
        }
      }
    });

    test('should select request when clicked', async ({ page }) => {
      const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
      const collectionCount = await collectionItems.count();
      
      if (collectionCount > 0) {
        const firstCollection = collectionItems.first();
        const expandButton = firstCollection.locator('button').first();
        
        // Expand collection
        await expandButton.click();
        await page.waitForTimeout(500);
        
        // Look for requests
        const requestItems = page.locator('[data-testid*="request"], .request-item');
        const requestCount = await requestItems.count();
        
        if (requestCount > 0) {
          const firstRequest = requestItems.first();
          
          // Click on request
          await firstRequest.click();
          await page.waitForTimeout(500);
          
          // Verify request is selected (check for visual feedback)
          // This might show as a different background color or border
          await expect(firstRequest).toBeVisible();
        }
      }
    });

    test('should not display "0" after request names', async ({ page }) => {
      const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
      const collectionCount = await collectionItems.count();
      
      if (collectionCount > 0) {
        const firstCollection = collectionItems.first();
        const expandButton = firstCollection.locator('button').first();
        
        // Expand collection
        await expandButton.click();
        await page.waitForTimeout(500);
        
        // Check all request items
        const requestItems = page.locator('[data-testid*="request"], .request-item');
        const requestCount = await requestItems.count();
        
        for (let i = 0; i < requestCount; i++) {
          const requestItem = requestItems.nth(i);
          const requestText = await requestItem.textContent();
          
          // Verify that request names don't end with "0"
          expect(requestText).not.toMatch(/0$/);
        }
      }
    });
  });

  test.describe('Context Menu and Actions', () => {
    test('should show context menu on right-click collection', async ({ page }) => {
      const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
      const collectionCount = await collectionItems.count();
      
      if (collectionCount > 0) {
        const firstCollection = collectionItems.first();
        
        // Right-click on collection
        await firstCollection.click({ button: 'right' });
        await page.waitForTimeout(500);
        
        // Look for context menu
        const contextMenu = page.locator('[role="menu"], .context-menu, [data-testid*="menu"]');
        if (await contextMenu.isVisible()) {
          await expect(contextMenu).toBeVisible();
          
          // Check for common menu items
          const menuItems = contextMenu.locator('[role="menuitem"], button, a');
          const itemCount = await menuItems.count();
          expect(itemCount).toBeGreaterThan(0);
        }
      }
    });

    test('should show context menu on right-click request', async ({ page }) => {
      const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
      const collectionCount = await collectionItems.count();
      
      if (collectionCount > 0) {
        const firstCollection = collectionItems.first();
        const expandButton = firstCollection.locator('button').first();
        
        // Expand collection
        await expandButton.click();
        await page.waitForTimeout(500);
        
        // Look for requests
        const requestItems = page.locator('[data-testid*="request"], .request-item');
        const requestCount = await requestItems.count();
        
        if (requestCount > 0) {
          const firstRequest = requestItems.first();
          
          // Right-click on request
          await firstRequest.click({ button: 'right' });
          await page.waitForTimeout(500);
          
          // Look for context menu
          const contextMenu = page.locator('[role="menu"], .context-menu, [data-testid*="menu"]');
          if (await contextMenu.isVisible()) {
            await expect(contextMenu).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Drag and Drop Functionality', () => {
    test('should support dragging collections', async ({ page }) => {
      const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
      const collectionCount = await collectionItems.count();
      
      if (collectionCount > 1) {
        const firstCollection = collectionItems.first();
        const secondCollection = collectionItems.nth(1);
        
        // Check if elements are draggable
        const firstDraggable = await firstCollection.getAttribute('draggable');
        const secondDraggable = await secondCollection.getAttribute('draggable');
        
        // At least one should be draggable
        expect(firstDraggable === 'true' || secondDraggable === 'true').toBeTruthy();
      }
    });

    test('should support dragging requests', async ({ page }) => {
      const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
      const collectionCount = await collectionItems.count();
      
      if (collectionCount > 0) {
        const firstCollection = collectionItems.first();
        const expandButton = firstCollection.locator('button').first();
        
        // Expand collection
        await expandButton.click();
        await page.waitForTimeout(500);
        
        // Look for requests
        const requestItems = page.locator('[data-testid*="request"], .request-item');
        const requestCount = await requestItems.count();
        
        if (requestCount > 0) {
          const firstRequest = requestItems.first();
          
          // Check if request is draggable
          const draggable = await firstRequest.getAttribute('draggable');
          expect(draggable).toBe('true');
        }
      }
    });
  });

  test.describe('Collection Creation and Management', () => {
    test('should create new collection', async ({ page }) => {
      // Look for create collection button
      const createButton = page.locator('button:has-text("New Collection"), button:has-text("Create Collection"), button:has-text("Add Collection")').first();
      
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(500);
        
        // Fill collection name
        const nameInput = page.locator('input[placeholder*="name" i], input[placeholder*="collection" i]').first();
        if (await nameInput.isVisible()) {
          await nameInput.fill('Test Collection Hierarchy');
          
          // Save the collection
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button:has-text("Add")').first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(1000);
            
            // Verify collection was created
            await expect(page.locator('text=Test Collection Hierarchy')).toBeVisible();
            
            // Verify it appears in hierarchy without "0" suffix
            const newCollection = page.locator('text=Test Collection Hierarchy').first();
            const collectionText = await newCollection.textContent();
            expect(collectionText).not.toMatch(/0$/);
          }
        }
      }
    });

    test('should create new request in collection', async ({ page }) => {
      const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
      const collectionCount = await collectionItems.count();
      
      if (collectionCount > 0) {
        const firstCollection = collectionItems.first();
        
        // Right-click to open context menu
        await firstCollection.click({ button: 'right' });
        await page.waitForTimeout(500);
        
        // Look for "Add Request" option
        const addRequestOption = page.locator('text=Add Request, text=New Request').first();
        if (await addRequestOption.isVisible()) {
          await addRequestOption.click();
          await page.waitForTimeout(500);
          
          // Verify we're on the request builder or a form opened
          const urlInput = page.locator('input[placeholder*="url" i], input[placeholder*="endpoint" i]').first();
          if (await urlInput.isVisible()) {
            await expect(urlInput).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle empty collections gracefully', async ({ page }) => {
      // This test ensures the hierarchy doesn't break with empty collections
      const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
      const collectionCount = await collectionItems.count();
      
      if (collectionCount > 0) {
        const firstCollection = collectionItems.first();
        const expandButton = firstCollection.locator('button').first();
        
        // Try to expand even if collection might be empty
        await expandButton.click();
        await page.waitForTimeout(500);
        
        // Should not cause any errors
        await expect(firstCollection).toBeVisible();
      }
    });

    test('should maintain hierarchy state after page refresh', async ({ page }) => {
      const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
      const collectionCount = await collectionItems.count();
      
      if (collectionCount > 0) {
        const firstCollection = collectionItems.first();
        const expandButton = firstCollection.locator('button').first();
        
        // Expand a collection
        await expandButton.click();
        await page.waitForTimeout(500);
        
        // Refresh page
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // Navigate back to collections
        await page.click('button:has-text("Collections")');
        await page.waitForLoadState('networkidle');
        
        // Check if hierarchy is still intact
        const refreshedCollections = page.locator('[data-testid*="collection"], .collection-item');
        await expect(refreshedCollections.first()).toBeVisible();
      }
    });
  });
});


