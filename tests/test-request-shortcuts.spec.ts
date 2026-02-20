import { test, expect } from '@playwright/test';

test.describe('TEST_REQUEST Keyboard Shortcuts Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Collections page
    await page.click('button:has-text("Collections")');
    await page.waitForLoadState('networkidle');
  });

  test('should test keyboard shortcuts with TEST_REQUEST', async ({ page }) => {
    // Listen for console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleMessages.push(msg.text());
      }
    });

    console.log('=== Testing TEST_REQUEST Keyboard Shortcuts ===');

    // Step 1: Create a collection
    console.log('Creating collection...');
    const createButton = page
      .locator('button:has-text("New Collection")')
      .first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(1000);

      const nameInput = page
        .locator('input[placeholder*="name"], input[placeholder*="Name"]')
        .first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test Collection');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
      }
    }

    // Step 2: Create TEST_REQUEST
    console.log('Creating TEST_REQUEST...');
    const collectionItems = page.locator(
      '[data-testid*="collection"], .collection-item'
    );
    const collectionCount = await collectionItems.count();

    if (collectionCount > 0) {
      const firstCollection = collectionItems.first();

      // Click on collection to select it
      await firstCollection.click();
      await page.waitForTimeout(1000);

      // Look for "Add Request" button or context menu
      const addRequestButton = page.locator(
        'button:has-text("Add Request"), button:has-text("New Request")'
      );
      if (await addRequestButton.isVisible()) {
        await addRequestButton.click();
        await page.waitForTimeout(1000);
      } else {
        // Try right-click context menu
        await firstCollection.click({ button: 'right' });
        await page.waitForTimeout(500);

        const contextMenu = page.locator('[role="menu"], .context-menu');
        if (await contextMenu.isVisible()) {
          const addRequestMenuItem = contextMenu
            .locator('text=Add Request')
            .first();
          if (await addRequestMenuItem.isVisible()) {
            await addRequestMenuItem.click();
            await page.waitForTimeout(1000);
          }
        }
      }

      // Fill request details
      const requestNameInput = page
        .locator('input[placeholder*="name"], input[placeholder*="Name"]')
        .first();
      if (await requestNameInput.isVisible()) {
        await requestNameInput.fill('TEST_REQUEST');
        await page.waitForTimeout(500);
      }

      // Fill URL
      const urlInput = page
        .locator('input[placeholder*="url"], input[placeholder*="URL"]')
        .first();
      if (await urlInput.isVisible()) {
        await urlInput.fill('https://api.example.com/test');
        await page.waitForTimeout(500);
      }

      // Save the request
      const saveButton = page.locator(
        'button:has-text("Save"), button:has-text("Create")'
      );
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      } else {
        // Try pressing Enter
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
      }
    }

    // Step 3: Find and select TEST_REQUEST
    console.log('Looking for TEST_REQUEST...');
    const requestItems = page.locator(
      '[data-testid*="request"], .request-item'
    );
    const requestCount = await requestItems.count();
    console.log(`Found ${requestCount} requests`);

    // Look for TEST_REQUEST specifically
    const testRequest = page.locator('text=TEST_REQUEST').first();
    const testRequestExists = await testRequest.isVisible();
    console.log('TEST_REQUEST exists:', testRequestExists);

    if (testRequestExists) {
      // Click on TEST_REQUEST to select it
      console.log('Selecting TEST_REQUEST...');
      await testRequest.click();
      await page.waitForTimeout(1000);

      // Check if TEST_REQUEST is selected
      const requestClasses = await testRequest.getAttribute('class');
      const isSelected =
        requestClasses?.includes('bg-primary/10') ||
        requestClasses?.includes('border-primary/20');
      console.log('TEST_REQUEST selected:', isSelected);
      console.log('TEST_REQUEST classes:', requestClasses);

      if (isSelected) {
        console.log('TEST_REQUEST is selected, testing shortcuts...');

        // Test keyboard shortcuts
        const shortcuts = [
          { key: 'Meta+e', name: 'Edit' },
          { key: 'Meta+d', name: 'Duplicate' },
          { key: 'Meta+Shift+e', name: 'Export' },
          { key: 'Meta+Backspace', name: 'Delete' },
        ];

        for (const shortcut of shortcuts) {
          console.log(
            `Testing ${shortcut.name} (${shortcut.key}) on TEST_REQUEST...`
          );
          await page.keyboard.press(shortcut.key);
          await page.waitForTimeout(500);
        }

        // Check console messages
        console.log('\n=== Console Messages ===');
        consoleMessages.forEach(msg => console.log(msg));

        // Count triggered shortcuts
        const triggeredShortcuts = shortcuts.filter(shortcut =>
          consoleMessages.some(msg =>
            msg.includes(`${shortcut.name} shortcut triggered`)
          )
        );

        console.log(`\n=== Results ===`);
        console.log(
          `Triggered ${triggeredShortcuts.length}/${shortcuts.length} shortcuts on TEST_REQUEST`
        );

        if (triggeredShortcuts.length > 0) {
          console.log('✓ Keyboard shortcuts are working on TEST_REQUEST!');
          console.log(
            'Working shortcuts:',
            triggeredShortcuts.map(s => s.name)
          );
        } else {
          console.log('⚠ No shortcuts triggered on TEST_REQUEST');
        }

        // Assertions
        expect(triggeredShortcuts.length).toBeGreaterThan(0);
      } else {
        console.log(
          '⚠ TEST_REQUEST not selected - visual selection may not be working'
        );
        console.log('Request classes:', requestClasses);
        expect(isSelected).toBeTruthy();
      }
    } else {
      console.log('⚠ TEST_REQUEST not found');

      // List all available requests
      const allRequests = page.locator(
        '[data-testid*="request"], .request-item'
      );
      const allRequestCount = await allRequests.count();
      console.log(`Total requests found: ${allRequestCount}`);

      for (let i = 0; i < allRequestCount; i++) {
        const request = allRequests.nth(i);
        const requestText = await request.textContent();
        console.log(`Request ${i + 1}: ${requestText}`);
      }

      expect(testRequestExists).toBeTruthy();
    }
  });

  test('should verify TEST_REQUEST visual selection', async ({ page }) => {
    // Look for TEST_REQUEST
    const testRequest = page.locator('text=TEST_REQUEST').first();

    if (await testRequest.isVisible()) {
      // Click on TEST_REQUEST
      await testRequest.click();
      await page.waitForTimeout(500);

      // Check for selection styling
      const requestClasses = await testRequest.getAttribute('class');
      const hasSelection =
        requestClasses?.includes('bg-primary/10') ||
        requestClasses?.includes('border-primary/20');

      console.log('TEST_REQUEST classes:', requestClasses);
      console.log('Has selection styling:', hasSelection);

      expect(hasSelection).toBeTruthy();
    } else {
      console.log('TEST_REQUEST not found for visual selection test');
    }
  });
});
