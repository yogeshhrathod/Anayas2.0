import { test, expect } from '@playwright/test';

test.describe('Real Data Persistence Debug', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should debug what actually gets saved to the database', async ({ page }) => {
    console.log('🔍 Debugging real data persistence...');
    
    // Step 1: Check what's currently in the database
    console.log('📍 Step 1: Checking current database state...');
    
    // Navigate to Collections to see what's there
    const collectionsBtn = page.locator('button:has-text("Collections")');
    await collectionsBtn.click();
    await page.waitForTimeout(1000);
    
    // Check if there are any existing collections
    const existingCollections = page.locator('.collection-item, text=Collection');
    const collectionCount = await existingCollections.count();
    console.log('Found', collectionCount, 'existing collections');
    
    // Check sidebar for existing requests
    const sidebarRequests = page.locator('.request-item');
    const requestCount = await sidebarRequests.count();
    console.log('Found', requestCount, 'existing requests in sidebar');
    
    // Step 2: Try to create a collection and see if it persists
    console.log('📍 Step 2: Testing collection creation persistence...');
    
    const newCollectionBtn = page.locator('button:has-text("New Collection")');
    if (await newCollectionBtn.count() > 0) {
      await newCollectionBtn.click();
      await page.waitForTimeout(1000);
      
      const nameInput = page.locator('input[placeholder*="name" i]');
      if (await nameInput.count() > 0) {
        await nameInput.first().fill('Debug Test Collection');
        
        const saveBtn = page.locator('button:has-text("Save"), button:has-text("Create")');
        if (await saveBtn.count() > 0) {
          await saveBtn.first().click();
          console.log('✅ Collection save button clicked');
          await page.waitForTimeout(2000);
          
          // Check if collection appears in UI
          const createdCollection = page.locator('text=Debug Test Collection');
          if (await createdCollection.count() > 0) {
            console.log('✅ Collection appears in UI after save');
          } else {
            console.log('❌ Collection does NOT appear in UI after save');
            await page.screenshot({ path: 'collection-not-saved.png' });
          }
        } else {
          console.log('❌ No save button found for collection');
        }
      } else {
        console.log('❌ No name input found for collection');
      }
    } else {
      console.log('❌ No New Collection button found');
    }
    
    // Step 3: Try to create a request and see if it persists
    console.log('📍 Step 3: Testing request creation persistence...');
    
    const newRequestBtn = page.locator('button:has-text("New Request")');
    if (await newRequestBtn.count() > 0) {
      await newRequestBtn.click();
      await page.waitForTimeout(1000);
      
      // Fill request details
      const urlInput = page.locator('input[placeholder*="Enter request URL"]');
      if (await urlInput.count() > 0) {
        await urlInput.fill('https://jsonplaceholder.typicode.com/posts/1');
        console.log('✅ Request URL filled');
        
        // Send request
        const sendBtn = page.locator('button:has-text("Send")');
        if (await sendBtn.count() > 0) {
          await sendBtn.click();
          console.log('✅ Request sent');
          await page.waitForTimeout(2000);
          
          // Look for save button
          const saveBtn = page.locator('button:has-text("Save"), button:has-text("Save Request")');
          if (await saveBtn.count() > 0) {
            await saveBtn.first().click();
            console.log('✅ Request save button clicked');
            await page.waitForTimeout(1000);
            
            // Fill save dialog
            const nameInput = page.locator('input[placeholder*="name" i]');
            if (await nameInput.count() > 0) {
              await nameInput.first().fill('Debug Test Request');
              
              const confirmBtn = page.locator('button:has-text("Save"), button:has-text("Confirm")');
              if (await confirmBtn.count() > 0) {
                await confirmBtn.first().click();
                console.log('✅ Request save confirmed');
                await page.waitForTimeout(2000);
                
                // Check if request appears in sidebar
                const savedRequest = page.locator('text=Debug Test Request');
                if (await savedRequest.count() > 0) {
                  console.log('✅ Request appears in sidebar after save');
                } else {
                  console.log('❌ Request does NOT appear in sidebar after save');
                  await page.screenshot({ path: 'request-not-saved.png' });
                }
              } else {
                console.log('❌ No confirm button found for request save');
              }
            } else {
              console.log('❌ No name input found for request save');
            }
          } else {
            console.log('❌ No save button found for request');
            await page.screenshot({ path: 'no-request-save-button.png' });
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
    
    // Step 4: Refresh page and check if data persists
    console.log('📍 Step 4: Testing persistence after page refresh...');
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check if collection still exists
    const persistedCollection = page.locator('text=Debug Test Collection');
    if (await persistedCollection.count() > 0) {
      console.log('✅ Collection persists after page refresh');
    } else {
      console.log('❌ Collection does NOT persist after page refresh');
    }
    
    // Check if request still exists
    const persistedRequest = page.locator('text=Debug Test Request');
    if (await persistedRequest.count() > 0) {
      console.log('✅ Request persists after page refresh');
    } else {
      console.log('❌ Request does NOT persist after page refresh');
    }
    
    // Step 5: Check database file directly
    console.log('📍 Step 5: Checking database file...');
    
    // Take final screenshot
    await page.screenshot({ path: 'final-persistence-check.png', fullPage: true });
    
    console.log('🔍 Persistence debug completed');
    console.log('📊 Summary:');
    console.log('  - Collections created:', await page.locator('text=Debug Test Collection').count() > 0 ? 'YES' : 'NO');
    console.log('  - Requests created:', await page.locator('text=Debug Test Request').count() > 0 ? 'YES' : 'NO');
    console.log('  - Data persists after refresh:', 'CHECK SCREENSHOTS');
  });

  test('should check what happens when we try to save without collection', async ({ page }) => {
    console.log('🔍 Testing save without collection...');
    
    // Create new request
    const newRequestBtn = page.locator('button:has-text("New Request")');
    await newRequestBtn.click();
    await page.waitForTimeout(1000);
    
    // Fill request
    const urlInput = page.locator('input[placeholder*="Enter request URL"]');
    await urlInput.fill('https://api.example.com/test');
    
    // Send request
    const sendBtn = page.locator('button:has-text("Send")');
    await sendBtn.click();
    await page.waitForTimeout(2000);
    
    // Try to save
    const saveBtn = page.locator('button:has-text("Save")');
    if (await saveBtn.count() > 0) {
      await saveBtn.first().click();
      await page.waitForTimeout(1000);
      
      // Check what happens in save dialog
      const nameInput = page.locator('input[placeholder*="name" i]');
      if (await nameInput.count() > 0) {
        await nameInput.first().fill('Test Without Collection');
        
        // Try to save without selecting collection
        const confirmBtn = page.locator('button:has-text("Save"), button:has-text("Confirm")');
        if (await confirmBtn.count() > 0) {
          await confirmBtn.first().click();
          await page.waitForTimeout(1000);
          
          // Check for error messages
          const errorMsg = page.locator('text=error, text=Error, text=required, text=Required');
          if (await errorMsg.count() > 0) {
            console.log('✅ Error message shown (good - validation working)');
          } else {
            console.log('❌ No error message shown (bad - no validation)');
          }
        }
      }
    }
    
    await page.screenshot({ path: 'save-without-collection-test.png' });
  });
});
