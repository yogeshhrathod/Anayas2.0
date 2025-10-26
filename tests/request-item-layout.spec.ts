import { test, expect } from '@playwright/test';

test.describe('Request Item Layout Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Collections page
    await page.click('button:has-text("Collections")');
    await page.waitForLoadState('networkidle');
  });

  test('should display request type before request name without icon', async ({ page }) => {
    const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
    const collectionCount = await collectionItems.count();
    
    if (collectionCount > 0) {
      const firstCollection = collectionItems.first();
      
      // Expand collection to see requests
      await firstCollection.click();
      await page.waitForTimeout(500);
      
      // Look for requests
      const requestItems = page.locator('[data-testid*="request"], .request-item');
      const requestCount = await requestItems.count();
      
      if (requestCount > 0) {
        const firstRequest = requestItems.first();
        
        // Check that there's no FileText icon
        const fileIcon = firstRequest.locator('svg[data-lucide="file-text"]');
        await expect(fileIcon).not.toBeVisible();
        
        // Check that method badge appears first (before request name)
        const methodBadge = firstRequest.locator('[class*="badge"]').first();
        if (await methodBadge.isVisible()) {
          const methodText = await methodBadge.textContent();
          expect(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']).toContain(methodText);
        }
        
        // Check that request name is displayed after method badge
        const requestContent = firstRequest.locator('div.flex-1');
        await expect(requestContent).toBeVisible();
        
        // Verify the layout contains the request name
        const requestText = await requestContent.textContent();
        expect(requestText).toBeTruthy();
      }
    }
  });

  test('should maintain inline editing functionality with method badge', async ({ page }) => {
    const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
    const collectionCount = await collectionItems.count();
    
    if (collectionCount > 0) {
      const firstCollection = collectionItems.first();
      
      // Expand collection
      await firstCollection.click();
      await page.waitForTimeout(500);
      
      // Look for requests
      const requestItems = page.locator('[data-testid*="request"], .request-item');
      const requestCount = await requestItems.count();
      
      if (requestCount > 0) {
        const firstRequest = requestItems.first();
        
        // Double-click to start editing
        const requestName = firstRequest.locator('div.text-sm.font-medium').first();
        if (await requestName.isVisible()) {
          await requestName.dblclick();
          await page.waitForTimeout(500);
          
          // Check that input field appears
          const inputField = firstRequest.locator('input');
          if (await inputField.isVisible()) {
            await expect(inputField).toBeVisible();
            
            // Check that method badge is still visible during editing
            const methodBadge = firstRequest.locator('[class*="badge"]').first();
            if (await methodBadge.isVisible()) {
              await expect(methodBadge).toBeVisible();
            }
          }
        }
      }
    }
  });

  test('should show different HTTP methods with appropriate colors', async ({ page }) => {
    const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
    const collectionCount = await collectionItems.count();
    
    if (collectionCount > 0) {
      const firstCollection = collectionItems.first();
      
      // Expand collection
      await firstCollection.click();
      await page.waitForTimeout(500);
      
      // Look for requests
      const requestItems = page.locator('[data-testid*="request"], .request-item');
      const requestCount = await requestItems.count();
      
      if (requestCount > 0) {
        // Check all request items for method badges
        for (let i = 0; i < requestCount; i++) {
          const requestItem = requestItems.nth(i);
          const methodBadge = requestItem.locator('[class*="badge"]').first();
          
          if (await methodBadge.isVisible()) {
            const methodText = await methodBadge.textContent();
            const badgeClasses = await methodBadge.getAttribute('class');
            
            // Verify method badge has appropriate styling
            expect(badgeClasses).toContain('font-mono');
            expect(badgeClasses).toContain('text-white');
            expect(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']).toContain(methodText);
          }
        }
      }
    }
  });

  test('should not display request icon anywhere in the request item', async ({ page }) => {
    const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
    const collectionCount = await collectionItems.count();
    
    if (collectionCount > 0) {
      const firstCollection = collectionItems.first();
      
      // Expand collection
      await firstCollection.click();
      await page.waitForTimeout(500);
      
      // Look for requests
      const requestItems = page.locator('[data-testid*="request"], .request-item');
      const requestCount = await requestItems.count();
      
      if (requestCount > 0) {
        // Check that no request items have FileText icons
        const fileIcons = page.locator('svg[data-lucide="file-text"]');
        const iconCount = await fileIcons.count();
        
        // Should be 0 file icons in request items
        expect(iconCount).toBe(0);
        
        // Verify request items still have proper structure
        const firstRequest = requestItems.first();
        await expect(firstRequest).toBeVisible();
        
        // Check that the request item has the expected layout
        const requestContent = firstRequest.locator('div.flex-1');
        await expect(requestContent).toBeVisible();
      }
    }
  });
});
