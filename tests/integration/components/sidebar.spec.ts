import { test, expect } from '../../helpers/electron-fixtures';

test.describe('Sidebar Component Integration', () => {
  test('should render sidebar with navigation items', async ({ electronPage, _testDbPath }) => {
    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    // Verify sidebar is visible
    // Sidebar typically contains navigation items
    const sidebar = electronPage.locator('[data-testid="app-sidebar"]');
    await expect(sidebar).toBeVisible();

    // Verify navigation items are visible
    const homeNav = electronPage.locator('button:has-text("Home"), a:has-text("Home")');
    const collectionsNav = electronPage.locator('button:has-text("Collections"), a:has-text("Collections")');
    const envNav = electronPage.locator('button:has-text("Environments"), a:has-text("Environments")');

    const homeCount = await homeNav.count();
    const collectionsCount = await collectionsNav.count();
    
    // At least some navigation items should be visible
    expect(homeCount + collectionsCount).toBeGreaterThan(0);
  });

  test('should navigate between pages', async ({ electronPage, _testDbPath }) => {
    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    // Click Collections
    const collectionsNav = electronPage.locator('button:has-text("Collections"), a:has-text("Collections")').first();
    await collectionsNav.click();
    await electronPage.waitForLoadState('networkidle');
    await electronPage.waitForTimeout(1000);

    // Verify we're on collections page
    const collectionsPageText = await electronPage.textContent('body');
    expect(collectionsPageText).toContain('Collections');

    // Click Environments
    const envNav = electronPage.locator('button:has-text("Environments"), a:has-text("Environments")').first();
    await envNav.click();
    await electronPage.waitForLoadState('networkidle');
    await electronPage.waitForTimeout(1000);

    // Verify we're on environments page
    const envPageText = await electronPage.textContent('body');
    expect(envPageText).toContain('Environments');

    // Click Home
    const homeNav = electronPage.locator('button:has-text("Home"), a:has-text("Home")').first();
    await homeNav.click();
    await electronPage.waitForLoadState('networkidle');
    await electronPage.waitForTimeout(1000);

    // Verify we're on home page
    const homePageText = await electronPage.textContent('body');
    expect(homePageText).toContain('Anayas');
  });

  test('should update active page state', async ({ electronPage, _testDbPath }) => {
    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    // Click Collections
    const collectionsNav = electronPage.locator('button:has-text("Collections"), a:has-text("Collections")').first();
    await collectionsNav.click();
    await electronPage.waitForLoadState('networkidle');
    await electronPage.waitForTimeout(1000);

    // Verify active state (button might have active class or aria-current)
    await expect(collectionsNav).toHaveAttribute('aria-current', 'page');
  });

  test('should display collection hierarchy in sidebar', async ({ electronPage, _testDbPath }) => {
    // Create collection
    await electronPage.evaluate(async () => {
      await window.electronAPI.collection.save({
        name: 'Sidebar Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    // Verify collection appears in sidebar
    const collectionVisible = await electronPage.locator('text=Sidebar Collection').isVisible({ timeout: 5000 });
    expect(collectionVisible).toBe(true);
  });

  test('should refresh sidebar when data changes', async ({ electronPage, _testDbPath }) => {
    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    // Create collection after page load
    const collection = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Refresh Test Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    // Wait for sidebar to refresh (component should call IPC to refresh)
    await electronPage.waitForTimeout(2000);

    // Verify new collection appears in sidebar
    const collectionVisible = await electronPage.locator('text=Refresh Test Collection').isVisible({ timeout: 5000 });
    expect(collectionVisible).toBe(true);
  });

  test('should handle sidebar toggle/collapse', async ({ electronPage, _testDbPath }) => {
    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    // Find sidebar toggle button (hamburger menu)
    const toggleButton = electronPage.locator('button[aria-label*="menu"], button[aria-label*="toggle"], [class*="menu-toggle"]').first();
    const toggleCount = await toggleButton.count();

    if (toggleCount > 0) {
      // Get initial sidebar state
      const sidebar = electronPage.locator('[data-testid="app-sidebar"]').first();
      const initialWidth = await sidebar.evaluate((el) => (el as HTMLElement).offsetWidth);

      // Click toggle
      await toggleButton.click();
      await electronPage.waitForTimeout(500);

      // Verify sidebar state changed (width should change)
      const newWidth = await sidebar.evaluate((el) => (el as HTMLElement).offsetWidth);
      
      // Width should be different (collapsed or expanded)
      expect(Math.abs(newWidth - initialWidth)).toBeGreaterThan(0);
    }
  });
});

