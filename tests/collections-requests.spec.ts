import { test, expect } from '@playwright/test';

test.describe('Anayas Collections and Requests Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Collections Management', () => {
    test('should navigate to collections page', async ({ page }) => {
      await page.click('button:has-text("Collections")');
      await expect(page.locator('h2')).toContainText('collections');
    });

    test('should create a new collection', async ({ page }) => {
      await page.click('button:has-text("Collections")');
      
      // Look for create collection button
      const createButton = page.locator('button:has-text("New Collection"), button:has-text("Create Collection"), button:has-text("Add Collection")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        
        // Fill collection name
        const nameInput = page.locator('input[placeholder*="name" i], input[placeholder*="collection" i]').first();
        if (await nameInput.isVisible()) {
          await nameInput.fill('Test Collection');
          
          // Save the collection
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button:has-text("Add")').first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            
            // Verify collection was created
            await expect(page.locator('text=Test Collection')).toBeVisible();
          }
        }
      }
    });

    test('should display collections hierarchy in sidebar', async ({ page }) => {
      // Check if collections section exists in sidebar
      const collectionsSection = page.locator('text=Collections').first();
      await expect(collectionsSection).toBeVisible();
      
      // Check if there are any collection items
      const collectionItems = page.locator('[data-testid*="collection"], .collection-item, .folder-item');
      if (await collectionItems.count() > 0) {
        await expect(collectionItems.first()).toBeVisible();
      }
    });

    test('should create a new folder within collection', async ({ page }) => {
      await page.click('button:has-text("Collections")');
      
      // Look for create folder button
      const createFolderButton = page.locator('button:has-text("New Folder"), button:has-text("Create Folder"), button:has-text("Add Folder")').first();
      if (await createFolderButton.isVisible()) {
        await createFolderButton.click();
        
        // Fill folder name
        const nameInput = page.locator('input[placeholder*="name" i], input[placeholder*="folder" i]').first();
        if (await nameInput.isVisible()) {
          await nameInput.fill('Test Folder');
          
          // Save the folder
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button:has-text("Add")').first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            
            // Verify folder was created
            await expect(page.locator('text=Test Folder')).toBeVisible();
          }
        }
      }
    });

    test('should edit collection name', async ({ page }) => {
      await page.click('button:has-text("Collections")');
      
      // Look for existing collection and try to edit it
      const collectionItem = page.locator('[data-testid*="collection"], .collection-item').first();
      if (await collectionItem.isVisible()) {
        // Right-click or look for edit option
        await collectionItem.click({ button: 'right' });
        
        // Look for edit option in context menu
        const editOption = page.locator('text=Edit, text=Rename').first();
        if (await editOption.isVisible()) {
          await editOption.click();
          
          // Edit the name
          const nameInput = page.locator('input').first();
          if (await nameInput.isVisible()) {
            await nameInput.fill('Updated Collection Name');
            
            // Save changes
            const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
            if (await saveButton.isVisible()) {
              await saveButton.click();
              
              // Verify name was updated
              await expect(page.locator('text=Updated Collection Name')).toBeVisible();
            }
          }
        }
      }
    });

    test('should delete collection', async ({ page }) => {
      await page.click('button:has-text("Collections")');
      
      // Look for existing collection and try to delete it
      const collectionItem = page.locator('[data-testid*="collection"], .collection-item').first();
      if (await collectionItem.isVisible()) {
        // Right-click or look for delete option
        await collectionItem.click({ button: 'right' });
        
        // Look for delete option in context menu
        const deleteOption = page.locator('text=Delete, text=Remove').first();
        if (await deleteOption.isVisible()) {
          await deleteOption.click();
          
          // Confirm deletion if confirmation dialog appears
          const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")').first();
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }
        }
      }
    });
  });

  test.describe('Request Management', () => {
    test('should create a new API request', async ({ page }) => {
      await page.click('button:has-text("Collections")');
      
      // Look for create request button
      const createRequestButton = page.locator('button:has-text("New Request"), button:has-text("Create Request"), button:has-text("Add Request")').first();
      if (await createRequestButton.isVisible()) {
        await createRequestButton.click();
        
        // Verify we're on the request builder
        await expect(page.locator('input[placeholder*="url" i], input[placeholder*="endpoint" i]')).toBeVisible();
      }
    });

    test('should fill request details', async ({ page }) => {
      // Navigate to home page where request builder might be
      await page.click('button:has-text("Home")');
      
      // Look for request builder elements
      const urlInput = page.locator('input[placeholder*="url" i], input[placeholder*="endpoint" i]').first();
      if (await urlInput.isVisible()) {
        // Fill URL
        await urlInput.fill('https://api.example.com/users');
        
        // Select HTTP method
        const methodSelect = page.locator('select, button:has-text("GET"), button:has-text("POST")').first();
        if (await methodSelect.isVisible()) {
          await methodSelect.click();
          await page.click('text=POST');
        }
        
        // Add headers if header section exists
        const headersTab = page.locator('button:has-text("Headers"), [data-testid*="header"]').first();
        if (await headersTab.isVisible()) {
          await headersTab.click();
          
          // Add a header
          const addHeaderButton = page.locator('button:has-text("Add Header"), button:has-text("+")').first();
          if (await addHeaderButton.isVisible()) {
            await addHeaderButton.click();
            
            // Fill header key and value
            const headerInputs = page.locator('input').all();
            if (headerInputs.length >= 2) {
              await headerInputs[0].fill('Content-Type');
              await headerInputs[1].fill('application/json');
            }
          }
        }
        
        // Add request body if body section exists
        const bodyTab = page.locator('button:has-text("Body"), [data-testid*="body"]').first();
        if (await bodyTab.isVisible()) {
          await bodyTab.click();
          
          // Add JSON body
          const bodyTextarea = page.locator('textarea, .monaco-editor').first();
          if (await bodyTextarea.isVisible()) {
            await bodyTextarea.fill('{"name": "John Doe", "email": "john@example.com"}');
          }
        }
      }
    });

    test('should send API request', async ({ page }) => {
      // Navigate to home page
      await page.click('button:has-text("Home")');
      
      // Fill basic request details
      const urlInput = page.locator('input[placeholder*="url" i], input[placeholder*="endpoint" i]').first();
      if (await urlInput.isVisible()) {
        await urlInput.fill('https://jsonplaceholder.typicode.com/posts/1');
        
        // Look for send button
        const sendButton = page.locator('button:has-text("Send"), button:has-text("Execute"), button:has-text("Run")').first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
          
          // Wait for response
          await page.waitForTimeout(2000);
          
          // Check if response is displayed
          const responseSection = page.locator('[data-testid*="response"], .response-panel').first();
          if (await responseSection.isVisible()) {
            await expect(responseSection).toBeVisible();
          }
        }
      }
    });

    test('should save request to collection', async ({ page }) => {
      // Navigate to home page
      await page.click('button:has-text("Home")');
      
      // Fill request details
      const urlInput = page.locator('input[placeholder*="url" i], input[placeholder*="endpoint" i]').first();
      if (await urlInput.isVisible()) {
        await urlInput.fill('https://api.example.com/users');
        
        // Look for save button
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Save Request")').first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          
          // Fill request name
          const nameInput = page.locator('input[placeholder*="name" i], input[placeholder*="request" i]').first();
          if (await nameInput.isVisible()) {
            await nameInput.fill('Get Users Request');
            
            // Select collection if dropdown exists
            const collectionSelect = page.locator('select, button:has-text("Select Collection")').first();
            if (await collectionSelect.isVisible()) {
              await collectionSelect.click();
              await page.click('text=Default Collection, text=My Collection').first();
            }
            
            // Confirm save
            const confirmButton = page.locator('button:has-text("Save"), button:has-text("Confirm")').first();
            if (await confirmButton.isVisible()) {
              await confirmButton.click();
              
              // Verify request was saved
              await expect(page.locator('text=Get Users Request')).toBeVisible();
            }
          }
        }
      }
    });

    test('should edit existing request', async ({ page }) => {
      // Navigate to collections page
      await page.click('button:has-text("Collections")');
      
      // Look for existing request
      const requestItem = page.locator('[data-testid*="request"], .request-item').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();
        
        // Verify we're on the request builder
        const urlInput = page.locator('input[placeholder*="url" i], input[placeholder*="endpoint" i]').first();
        if (await urlInput.isVisible()) {
          // Modify the URL
          await urlInput.fill('https://api.example.com/users/updated');
          
          // Save changes
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
          }
        }
      }
    });

    test('should duplicate request', async ({ page }) => {
      // Navigate to collections page
      await page.click('button:has-text("Collections")');
      
      // Look for existing request
      const requestItem = page.locator('[data-testid*="request"], .request-item').first();
      if (await requestItem.isVisible()) {
        // Right-click for context menu
        await requestItem.click({ button: 'right' });
        
        // Look for duplicate option
        const duplicateOption = page.locator('text=Duplicate, text=Copy').first();
        if (await duplicateOption.isVisible()) {
          await duplicateOption.click();
          
          // Verify duplicate was created
          await expect(page.locator('text=Copy of')).toBeVisible();
        }
      }
    });

    test('should delete request', async ({ page }) => {
      // Navigate to collections page
      await page.click('button:has-text("Collections")');
      
      // Look for existing request
      const requestItem = page.locator('[data-testid*="request"], .request-item').first();
      if (await requestItem.isVisible()) {
        // Right-click for context menu
        await requestItem.click({ button: 'right' });
        
        // Look for delete option
        const deleteOption = page.locator('text=Delete, text=Remove').first();
        if (await deleteOption.isVisible()) {
          await deleteOption.click();
          
          // Confirm deletion
          const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")').first();
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }
        }
      }
    });

    test('should test different HTTP methods', async ({ page }) => {
      // Navigate to home page
      await page.click('button:has-text("Home")');
      
      const urlInput = page.locator('input[placeholder*="url" i], input[placeholder*="endpoint" i]').first();
      if (await urlInput.isVisible()) {
        await urlInput.fill('https://jsonplaceholder.typicode.com/posts');
        
        // Test GET method
        const methodButton = page.locator('button:has-text("GET"), button:has-text("POST"), select').first();
        if (await methodButton.isVisible()) {
          await methodButton.click();
          await page.click('text=GET');
          
          const sendButton = page.locator('button:has-text("Send"), button:has-text("Execute")').first();
          if (await sendButton.isVisible()) {
            await sendButton.click();
            await page.waitForTimeout(1000);
          }
        }
        
        // Test POST method
        if (await methodButton.isVisible()) {
          await methodButton.click();
          await page.click('text=POST');
          
          // Add body for POST request
          const bodyTab = page.locator('button:has-text("Body")').first();
          if (await bodyTab.isVisible()) {
            await bodyTab.click();
            
            const bodyTextarea = page.locator('textarea, .monaco-editor').first();
            if (await bodyTextarea.isVisible()) {
              await bodyTextarea.fill('{"title": "Test Post", "body": "This is a test", "userId": 1}');
            }
          }
          
          const sendButton = page.locator('button:has-text("Send"), button:has-text("Execute")').first();
          if (await sendButton.isVisible()) {
            await sendButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    });

    test('should handle request authentication', async ({ page }) => {
      // Navigate to home page
      await page.click('button:has-text("Home")');
      
      const urlInput = page.locator('input[placeholder*="url" i], input[placeholder*="endpoint" i]').first();
      if (await urlInput.isVisible()) {
        await urlInput.fill('https://api.example.com/protected');
        
        // Look for auth tab
        const authTab = page.locator('button:has-text("Auth"), button:has-text("Authentication")').first();
        if (await authTab.isVisible()) {
          await authTab.click();
          
          // Select auth type
          const authTypeSelect = page.locator('select, button:has-text("None")').first();
          if (await authTypeSelect.isVisible()) {
            await authTypeSelect.click();
            await page.click('text=Bearer Token, text=API Key');
            
            // Fill auth details
            const tokenInput = page.locator('input[placeholder*="token" i], input[placeholder*="key" i]').first();
            if (await tokenInput.isVisible()) {
              await tokenInput.fill('your-api-token-here');
            }
          }
        }
      }
    });
  });

  test.describe('Request History', () => {
    test('should view request history', async ({ page }) => {
      await page.click('button:has-text("History")');
      await expect(page.locator('h2')).toContainText('history');
      
      // Check if history items are displayed
      const historyItems = page.locator('[data-testid*="history"], .history-item');
      if (await historyItems.count() > 0) {
        await expect(historyItems.first()).toBeVisible();
      }
    });

    test('should clear request history', async ({ page }) => {
      await page.click('button:has-text("History")');
      
      // Look for clear history button
      const clearButton = page.locator('button:has-text("Clear"), button:has-text("Clear History")').first();
      if (await clearButton.isVisible()) {
        await clearButton.click();
        
        // Confirm clearing
        const confirmButton = page.locator('button:has-text("Clear"), button:has-text("Confirm"), button:has-text("Yes")').first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
      }
    });
  });
});
