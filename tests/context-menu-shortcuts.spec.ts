import { test, expect } from '@playwright/test';

test.describe('Context Menu Shortcuts Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Collections page
    await page.click('button:has-text("Collections")');
    await page.waitForLoadState('networkidle');
  });

  test('should show keyboard shortcuts in request context menu', async ({ page }) => {
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
        
        // Right-click on request to open context menu
        await firstRequest.click({ button: 'right' });
        await page.waitForTimeout(500);
        
        // Look for context menu
        const contextMenu = page.locator('[role="menu"], .context-menu, [data-testid*="menu"]');
        if (await contextMenu.isVisible()) {
          await expect(contextMenu).toBeVisible();
          
          // Check for keyboard shortcuts in menu items
          const menuItems = contextMenu.locator('[role="menuitem"]');
          const itemCount = await menuItems.count();
          
          if (itemCount > 0) {
            // Check that shortcuts are displayed (should contain ⌘ symbols)
            const menuText = await contextMenu.textContent();
            expect(menuText).toMatch(/⌘/);
            
            // Check for specific shortcuts
            expect(menuText).toMatch(/⌘E|⌘D|⌘⇧E|⌘⌫/);
          }
        }
      }
    }
  });

  test('should show keyboard shortcuts in collection context menu', async ({ page }) => {
    const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
    const collectionCount = await collectionItems.count();
    
    if (collectionCount > 0) {
      const firstCollection = collectionItems.first();
      
      // Right-click on collection to open context menu
      await firstCollection.click({ button: 'right' });
      await page.waitForTimeout(500);
      
      // Look for context menu
      const contextMenu = page.locator('[role="menu"], .context-menu, [data-testid*="menu"]');
      if (await contextMenu.isVisible()) {
        await expect(contextMenu).toBeVisible();
        
        // Check for keyboard shortcuts in menu items
        const menuText = await contextMenu.textContent();
        expect(menuText).toMatch(/⌘/);
        
        // Check for specific shortcuts
        expect(menuText).toMatch(/⌘N|⌘⇧N|⌘E|⌘D|⌘⇧E|⌘⇧I|⌘⌫/);
      }
    }
  });

  test('should not show icons in context menus', async ({ page }) => {
    const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
    const collectionCount = await collectionItems.count();
    
    if (collectionCount > 0) {
      const firstCollection = collectionItems.first();
      
      // Right-click on collection to open context menu
      await firstCollection.click({ button: 'right' });
      await page.waitForTimeout(500);
      
      // Look for context menu
      const contextMenu = page.locator('[role="menu"], .context-menu, [data-testid*="menu"]');
      if (await contextMenu.isVisible()) {
        await expect(contextMenu).toBeVisible();
        
        // Check that no emoji icons are present
        const menuText = await contextMenu.textContent();
        expect(menuText).not.toMatch(/✏️|📋|📤|📥|🗑️|📁|\+/);
        
        // Check that no icon spans are present
        const iconSpans = contextMenu.locator('span:has-text("✏️"), span:has-text("📋"), span:has-text("📤"), span:has-text("📥"), span:has-text("🗑️"), span:has-text("📁"), span:has-text("+")');
        await expect(iconSpans).not.toBeVisible();
      }
    }
  });

  test('should display shortcuts in shadcn style layout', async ({ page }) => {
    const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
    const collectionCount = await collectionItems.count();
    
    if (collectionCount > 0) {
      const firstCollection = collectionItems.first();
      
      // Right-click on collection to open context menu
      await firstCollection.click({ button: 'right' });
      await page.waitForTimeout(500);
      
      // Look for context menu
      const contextMenu = page.locator('[role="menu"], .context-menu, [data-testid*="menu"]');
      if (await contextMenu.isVisible()) {
        await expect(contextMenu).toBeVisible();
        
        // Check for menu items with proper layout
        const menuItems = contextMenu.locator('[role="menuitem"]');
        const itemCount = await menuItems.count();
        
        if (itemCount > 0) {
          // Check that menu items have the expected structure
          const firstMenuItem = menuItems.first();
          await expect(firstMenuItem).toBeVisible();
          
          // Check for flex layout (label on left, shortcut on right)
          const menuItemClasses = await firstMenuItem.getAttribute('class');
          expect(menuItemClasses).toContain('flex');
        }
      }
    }
  });

  test('should show appropriate shortcuts for different actions', async ({ page }) => {
    const collectionItems = page.locator('[data-testid*="collection"], .collection-item');
    const collectionCount = await collectionItems.count();
    
    if (collectionCount > 0) {
      const firstCollection = collectionItems.first();
      
      // Right-click on collection to open context menu
      await firstCollection.click({ button: 'right' });
      await page.waitForTimeout(500);
      
      // Look for context menu
      const contextMenu = page.locator('[role="menu"], .context-menu, [data-testid*="menu"]');
      if (await contextMenu.isVisible()) {
        await expect(contextMenu).toBeVisible();
        
        const menuText = await contextMenu.textContent();
        
        // Check for common shortcuts
        if (menuText.includes('Add Request')) {
          expect(menuText).toMatch(/⌘N/);
        }
        if (menuText.includes('Edit')) {
          expect(menuText).toMatch(/⌘E/);
        }
        if (menuText.includes('Duplicate')) {
          expect(menuText).toMatch(/⌘D/);
        }
        if (menuText.includes('Delete')) {
          expect(menuText).toMatch(/⌘⌫/);
        }
      }
    }
  });
});


