import { test, expect } from '@playwright/test';

test.describe('UI Persistence Check - What User Actually Sees', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should check if collections and requests appear in UI after creation', async ({
    page,
  }) => {
    console.log('🔍 Checking UI persistence - what user actually sees...');

    // Step 1: Check initial state - what's visible on Collections page
    console.log('📍 Step 1: Checking initial Collections page...');
    const collectionsBtn = page.locator('button:has-text("Collections")');
    await collectionsBtn.click();
    await page.waitForTimeout(1000);

    // Take screenshot of initial state
    await page.screenshot({
      path: 'initial-collections-page.png',
      fullPage: true,
    });

    // Count any existing collections
    const allText = await page.textContent('body');
    console.log(
      'Collections page content:',
      allText?.substring(0, 500) + '...'
    );

    // Step 2: Create a collection and see if it appears
    console.log('📍 Step 2: Creating collection and checking if it appears...');

    const newCollectionBtn = page.locator('button:has-text("New Collection")');
    if ((await newCollectionBtn.count()) > 0) {
      await newCollectionBtn.click();
      await page.waitForTimeout(1000);

      // Fill collection name
      const nameInput = page.locator('input[placeholder*="name" i]');
      if ((await nameInput.count()) > 0) {
        await nameInput.first().fill('UI Test Collection');

        // Save collection
        const saveBtn = page.locator(
          'button:has-text("Save"), button:has-text("Create")'
        );
        if ((await saveBtn.count()) > 0) {
          await saveBtn.first().click();
          await page.waitForTimeout(2000);

          // Check if collection appears in UI
          const collectionText = await page.textContent('body');
          if (collectionText?.includes('UI Test Collection')) {
            console.log('✅ Collection appears in UI after creation');
          } else {
            console.log('❌ Collection does NOT appear in UI after creation');
          }

          // Take screenshot after collection creation
          await page.screenshot({
            path: 'after-collection-creation.png',
            fullPage: true,
          });
        } else {
          console.log('❌ No save button found for collection');
        }
      } else {
        console.log('❌ No name input found for collection');
      }
    } else {
      console.log('❌ No New Collection button found');
    }

    // Step 3: Create a request and see if it appears
    console.log('📍 Step 3: Creating request and checking if it appears...');

    const newRequestBtn = page.locator('button:has-text("New Request")');
    if ((await newRequestBtn.count()) > 0) {
      await newRequestBtn.click();
      await page.waitForTimeout(1000);

      // Fill request details
      const urlInput = page.locator('input[placeholder*="Enter request URL"]');
      if ((await urlInput.count()) > 0) {
        await urlInput.fill('https://jsonplaceholder.typicode.com/posts/1');

        // Send request
        const sendBtn = page.locator('button:has-text("Send")');
        if ((await sendBtn.count()) > 0) {
          await sendBtn.click();
          await page.waitForTimeout(2000);

          // Try to save request
          const saveBtn = page.locator('button:has-text("Save")');
          if ((await saveBtn.count()) > 0) {
            await saveBtn.first().click();
            await page.waitForTimeout(1000);

            // Fill save dialog
            const nameInput = page.locator('input[placeholder*="name" i]');
            if ((await nameInput.count()) > 0) {
              await nameInput.first().fill('UI Test Request');

              // Confirm save
              const confirmBtn = page.locator(
                'button:has-text("Save"), button:has-text("Confirm")'
              );
              if ((await confirmBtn.count()) > 0) {
                await confirmBtn.first().click();
                await page.waitForTimeout(2000);

                // Check if request appears in sidebar
                const sidebarText = await page.textContent('body');
                if (sidebarText?.includes('UI Test Request')) {
                  console.log('✅ Request appears in sidebar after creation');
                } else {
                  console.log(
                    '❌ Request does NOT appear in sidebar after creation'
                  );
                }

                // Take screenshot after request creation
                await page.screenshot({
                  path: 'after-request-creation.png',
                  fullPage: true,
                });
              } else {
                console.log('❌ No confirm button found for request save');
              }
            } else {
              console.log('❌ No name input found for request save');
            }
          } else {
            console.log('❌ No save button found for request');
          }
        } else {
          console.log('❌ No send button found');
        }
      } else {
        console.log('❌ No URL input found');
      }
    } else {
      console.log('❌ No New Request button found');
    }

    // Step 4: Refresh page and check if data persists in UI
    console.log('📍 Step 4: Refreshing page and checking UI persistence...');

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Navigate back to Collections
    const collectionsBtn2 = page.locator('button:has-text("Collections")');
    await collectionsBtn2.click();
    await page.waitForTimeout(1000);

    // Check if collection still appears
    const pageText = await page.textContent('body');
    if (pageText?.includes('UI Test Collection')) {
      console.log('✅ Collection persists in UI after page refresh');
    } else {
      console.log('❌ Collection does NOT persist in UI after page refresh');
    }

    // Check if request still appears in sidebar
    if (pageText?.includes('UI Test Request')) {
      console.log('✅ Request persists in UI after page refresh');
    } else {
      console.log('❌ Request does NOT persist in UI after page refresh');
    }

    // Take final screenshot
    await page.screenshot({
      path: 'final-ui-persistence-check.png',
      fullPage: true,
    });

    console.log('🔍 UI persistence check completed');
    console.log('📊 Final Results:');
    console.log(
      '  - Collection visible after creation:',
      pageText?.includes('UI Test Collection') ? 'YES' : 'NO'
    );
    console.log(
      '  - Request visible after creation:',
      pageText?.includes('UI Test Request') ? 'YES' : 'NO'
    );
    console.log('  - Data persists after refresh:', 'CHECK SCREENSHOTS');
  });

  test('should check what happens when we try to save without filling required fields', async ({
    page,
  }) => {
    console.log('🔍 Testing save validation in UI...');

    // Create new request
    const newRequestBtn = page.locator('button:has-text("New Request")');
    await newRequestBtn.click();
    await page.waitForTimeout(1000);

    // Fill URL but don't save
    const urlInput = page.locator('input[placeholder*="Enter request URL"]');
    await urlInput.fill('https://api.example.com/test');

    // Try to save without name
    const saveBtn = page.locator('button:has-text("Save")');
    if ((await saveBtn.count()) > 0) {
      await saveBtn.first().click();
      await page.waitForTimeout(1000);

      // Check what happens
      const pageText = await page.textContent('body');
      console.log('Save dialog content:', pageText?.substring(0, 300) + '...');

      // Try to save without filling name
      const confirmBtn = page.locator(
        'button:has-text("Save"), button:has-text("Confirm")'
      );
      if ((await confirmBtn.count()) > 0) {
        await confirmBtn.first().click();
        await page.waitForTimeout(1000);

        // Check for error messages
        const errorText = await page.textContent('body');
        if (
          errorText?.includes('error') ||
          errorText?.includes('Error') ||
          errorText?.includes('required')
        ) {
          console.log('✅ Error message shown (validation working)');
        } else {
          console.log('❌ No error message shown (no validation)');
        }
      }
    }

    await page.screenshot({ path: 'save-validation-test.png', fullPage: true });
  });
});
