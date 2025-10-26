import { test, expect } from '@playwright/test';

test.describe('Debug Request Creation - Postman-like Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should create a new request like Postman - step by step debug', async ({ page }) => {
    console.log('🔍 Starting Postman-like request creation test...');
    
    // Step 1: Check if we're on the home page
    console.log('📍 Step 1: Checking current page...');
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Step 2: Look for New Request button on home page
    console.log('📍 Step 2: Looking for New Request button...');
    const newRequestBtn = page.locator('button:has-text("New Request")');
    const buttonCount = await newRequestBtn.count();
    console.log('Found', buttonCount, 'New Request buttons');
    
    if (buttonCount > 0) {
      console.log('✅ New Request button found! Clicking...');
      await newRequestBtn.first().click();
      await page.waitForTimeout(1000);
    } else {
      console.log('❌ No New Request button found on home page');
      // Take a screenshot to see what's actually there
      await page.screenshot({ path: 'debug-no-new-request-button.png' });
    }
    
    // Step 3: Check if we can see the request builder
    console.log('📍 Step 3: Checking for request builder elements...');
    const urlInput = page.locator('input[placeholder*="url" i], input[placeholder*="URL" i]');
    const urlInputCount = await urlInput.count();
    console.log('Found', urlInputCount, 'URL input fields');
    
    if (urlInputCount > 0) {
      console.log('✅ URL input found! Testing request creation...');
      
      // Fill in a simple request
      await urlInput.first().fill('https://jsonplaceholder.typicode.com/posts/1');
      console.log('✅ URL filled');
      
      // Look for method selector
      const methodSelect = page.locator('select, button:has-text("GET")');
      const methodCount = await methodSelect.count();
      console.log('Found', methodCount, 'method selectors');
      
      if (methodCount > 0) {
        console.log('✅ Method selector found! Setting to GET...');
        await methodSelect.first().click();
        await page.click('text=GET');
        console.log('✅ Method set to GET');
      }
      
      // Look for Send button
      const sendBtn = page.locator('button:has-text("Send"), button:has-text("Execute")');
      const sendBtnCount = await sendBtn.count();
      console.log('Found', sendBtnCount, 'Send buttons');
      
      if (sendBtnCount > 0) {
        console.log('✅ Send button found! Sending request...');
        await sendBtn.first().click();
        await page.waitForTimeout(2000);
        console.log('✅ Request sent');
        
        // Check for response
        const responseSection = page.locator('[data-testid*="response"], .response-panel, text=200');
        const responseCount = await responseSection.count();
        console.log('Found', responseCount, 'response sections');
        
        if (responseCount > 0) {
          console.log('✅ Response received!');
        } else {
          console.log('❌ No response section found');
          await page.screenshot({ path: 'debug-no-response.png' });
        }
      } else {
        console.log('❌ No Send button found');
        await page.screenshot({ path: 'debug-no-send-button.png' });
      }
      
      // Look for Save button
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Save Request")');
      const saveBtnCount = await saveBtn.count();
      console.log('Found', saveBtnCount, 'Save buttons');
      
      if (saveBtnCount > 0) {
        console.log('✅ Save button found! Testing save functionality...');
        await saveBtn.first().click();
        await page.waitForTimeout(1000);
        
        // Check for save dialog
        const saveDialog = page.locator('input[placeholder*="name" i], text=Save Request');
        const dialogCount = await saveDialog.count();
        console.log('Found', dialogCount, 'save dialog elements');
        
        if (dialogCount > 0) {
          console.log('✅ Save dialog opened!');
          
          // Fill in request name
          const nameInput = page.locator('input[placeholder*="name" i]');
          if (await nameInput.count() > 0) {
            await nameInput.first().fill('Test Request');
            console.log('✅ Request name filled');
            
            // Look for collection selector
            const collectionSelect = page.locator('select, button:has-text("Select Collection")');
            if (await collectionSelect.count() > 0) {
              console.log('✅ Collection selector found');
              await collectionSelect.first().click();
              await page.waitForTimeout(500);
              
              // Try to select first available collection
              const collectionOption = page.locator('text=JSONPlaceholder API, text=Default Collection').first();
              if (await collectionOption.count() > 0) {
                await collectionOption.click();
                console.log('✅ Collection selected');
              }
            }
            
            // Confirm save
            const confirmBtn = page.locator('button:has-text("Save"), button:has-text("Confirm")');
            if (await confirmBtn.count() > 0) {
              await confirmBtn.first().click();
              console.log('✅ Request saved!');
              await page.waitForTimeout(1000);
              
              // Check if request appears in sidebar
              const savedRequest = page.locator('text=Test Request');
              if (await savedRequest.count() > 0) {
                console.log('✅ Request appears in sidebar!');
              } else {
                console.log('❌ Request not found in sidebar');
                await page.screenshot({ path: 'debug-request-not-in-sidebar.png' });
              }
            }
          }
        } else {
          console.log('❌ Save dialog not opened');
          await page.screenshot({ path: 'debug-no-save-dialog.png' });
        }
      } else {
        console.log('❌ No Save button found');
        await page.screenshot({ path: 'debug-no-save-button.png' });
      }
      
    } else {
      console.log('❌ No URL input found - request builder not visible');
      await page.screenshot({ path: 'debug-no-url-input.png' });
    }
    
    // Final check: Take a full page screenshot
    await page.screenshot({ path: 'debug-final-state.png', fullPage: true });
    console.log('🔍 Test completed. Check screenshots for debugging info.');
  });

  test('should navigate to Collections and create request from there', async ({ page }) => {
    console.log('🔍 Testing Collections page request creation...');
    
    // Navigate to Collections page
    const collectionsBtn = page.locator('button:has-text("Collections")');
    await expect(collectionsBtn).toBeVisible();
    await collectionsBtn.click();
    await page.waitForTimeout(1000);
    
    console.log('✅ Navigated to Collections page');
    
    // Look for New Request button on Collections page
    const newRequestBtn = page.locator('button:has-text("New Request")');
    const buttonCount = await newRequestBtn.count();
    console.log('Found', buttonCount, 'New Request buttons on Collections page');
    
    if (buttonCount > 0) {
      console.log('✅ New Request button found on Collections page!');
      await newRequestBtn.first().click();
      await page.waitForTimeout(2000);
      
      // Check if we're now on home page with request builder
      const urlInput = page.locator('input[placeholder*="url" i], input[placeholder*="URL" i]');
      const urlInputCount = await urlInput.count();
      console.log('After clicking New Request, found', urlInputCount, 'URL input fields');
      
      if (urlInputCount > 0) {
        console.log('✅ Successfully navigated to request builder!');
        await urlInput.first().fill('https://api.example.com/test');
        console.log('✅ URL filled in request builder');
      } else {
        console.log('❌ Request builder not visible after clicking New Request');
        await page.screenshot({ path: 'debug-collections-new-request-failed.png' });
      }
    } else {
      console.log('❌ No New Request button found on Collections page');
      await page.screenshot({ path: 'debug-collections-no-new-request-button.png' });
    }
  });

  test('should test the actual UI elements that exist', async ({ page }) => {
    console.log('🔍 Testing what UI elements actually exist...');
    
    // Take a screenshot of the current state
    await page.screenshot({ path: 'debug-initial-page.png', fullPage: true });
    
    // Check what buttons exist
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    console.log('Total buttons on page:', buttonCount);
    
    // Get text of all buttons
    for (let i = 0; i < Math.min(buttonCount, 20); i++) {
      const buttonText = await allButtons.nth(i).textContent();
      console.log(`Button ${i}: "${buttonText}"`);
    }
    
    // Check what input fields exist
    const allInputs = page.locator('input');
    const inputCount = await allInputs.count();
    console.log('Total input fields on page:', inputCount);
    
    for (let i = 0; i < Math.min(inputCount, 10); i++) {
      const placeholder = await allInputs.nth(i).getAttribute('placeholder');
      console.log(`Input ${i} placeholder: "${placeholder}"`);
    }
    
    // Check what select elements exist
    const allSelects = page.locator('select');
    const selectCount = await allSelects.count();
    console.log('Total select elements on page:', selectCount);
    
    console.log('🔍 UI element analysis completed');
  });
});
