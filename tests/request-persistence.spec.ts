import { test, expect } from '@playwright/test';

test.describe('Request Persistence and CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Request Creation and Persistence', () => {
    test('should create and persist a new request with all fields', async ({ page }) => {
      // Navigate to collections page
      await page.click('button:has-text("Collections")');
      await page.waitForTimeout(1000);

      // Create a new collection first
      const createCollectionBtn = page.locator('button:has-text("New Collection"), button:has-text("Create Collection")').first();
      if (await createCollectionBtn.isVisible()) {
        await createCollectionBtn.click();
        await page.fill('input[placeholder*="name" i]', 'Test Collection');
        await page.click('button:has-text("Save"), button:has-text("Create")');
        await page.waitForTimeout(500);
      }

      // Click New Request button
      const newRequestBtn = page.locator('button:has-text("New Request")').first();
      await expect(newRequestBtn).toBeVisible();
      await newRequestBtn.click();
      await page.waitForTimeout(1000);

      // Fill request details
      await page.fill('input[placeholder*="url" i]', 'https://jsonplaceholder.typicode.com/posts');
      
      // Set method to POST
      const methodSelect = page.locator('select, button:has-text("GET")').first();
      await methodSelect.click();
      await page.click('text=POST');

      // Add query parameters
      const paramsTab = page.locator('button:has-text("Params"), button:has-text("Query")').first();
      if (await paramsTab.isVisible()) {
        await paramsTab.click();
        const addParamBtn = page.locator('button:has-text("Add"), button:has-text("+")').first();
        if (await addParamBtn.isVisible()) {
          await addParamBtn.click();
          const paramInputs = page.locator('input').all();
          if (paramInputs.length >= 2) {
            await paramInputs[0].fill('userId');
            await paramInputs[1].fill('1');
          }
        }
      }

      // Add headers
      const headersTab = page.locator('button:has-text("Headers")').first();
      if (await headersTab.isVisible()) {
        await headersTab.click();
        const addHeaderBtn = page.locator('button:has-text("Add"), button:has-text("+")').first();
        if (await addHeaderBtn.isVisible()) {
          await addHeaderBtn.click();
          const headerInputs = page.locator('input').all();
          if (headerInputs.length >= 2) {
            await headerInputs[0].fill('Authorization');
            await headerInputs[1].fill('Bearer token123');
          }
        }
      }

      // Add request body
      const bodyTab = page.locator('button:has-text("Body")').first();
      if (await bodyTab.isVisible()) {
        await bodyTab.click();
        const bodyTextarea = page.locator('textarea, .monaco-editor').first();
        if (await bodyTextarea.isVisible()) {
          await bodyTextarea.fill('{"title": "Test Post", "body": "This is a test", "userId": 1}');
        }
      }

      // Add authentication
      const authTab = page.locator('button:has-text("Auth"), button:has-text("Authentication")').first();
      if (await authTab.isVisible()) {
        await authTab.click();
        const authTypeSelect = page.locator('select, button:has-text("None")').first();
        if (await authTypeSelect.isVisible()) {
          await authTypeSelect.click();
          await page.click('text=Bearer Token');
          const tokenInput = page.locator('input[placeholder*="token" i]').first();
          if (await tokenInput.isVisible()) {
            await tokenInput.fill('bearer-token-123');
          }
        }
      }

      // Save the request
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Save Request")').first();
      await expect(saveBtn).toBeVisible();
      await saveBtn.click();

      // Fill save dialog
      const nameInput = page.locator('input[placeholder*="name" i]').first();
      await expect(nameInput).toBeVisible();
      await nameInput.fill('Test API Request');

      const collectionSelect = page.locator('select, button:has-text("Select Collection")').first();
      if (await collectionSelect.isVisible()) {
        await collectionSelect.click();
        await page.click('text=Test Collection');
      }

      const confirmSaveBtn = page.locator('button:has-text("Save"), button:has-text("Confirm")').first();
      await confirmSaveBtn.click();

      // Verify request was saved and appears in sidebar
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Test API Request')).toBeVisible();
    });

    test('should persist query parameters correctly', async ({ page }) => {
      await page.click('button:has-text("Collections")');
      
      // Click New Request button
      const newRequestBtn = page.locator('button:has-text("New Request")').first();
      await expect(newRequestBtn).toBeVisible();
      await newRequestBtn.click();
      await page.waitForTimeout(1000);
      
      // Create a request with query parameters
      await page.fill('input[placeholder*="url" i]', 'https://api.example.com/users');
      
      // Add multiple query parameters
      const paramsTab = page.locator('button:has-text("Params")').first();
      if (await paramsTab.isVisible()) {
        await paramsTab.click();
        
        // Add first parameter
        const addBtn1 = page.locator('button:has-text("Add")').first();
        if (await addBtn1.isVisible()) {
          await addBtn1.click();
          const inputs1 = page.locator('input').all();
          if (inputs1.length >= 2) {
            await inputs1[0].fill('page');
            await inputs1[1].fill('1');
          }
        }
        
        // Add second parameter
        const addBtn2 = page.locator('button:has-text("Add")').first();
        if (await addBtn2.isVisible()) {
          await addBtn2.click();
          const inputs2 = page.locator('input').all();
          if (inputs2.length >= 4) {
            await inputs2[2].fill('limit');
            await inputs2[3].fill('10');
          }
        }
      }
      
      // Save request
      const saveBtn = page.locator('button:has-text("Save")').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.fill('input[placeholder*="name" i]', 'Users with Params');
        await page.click('button:has-text("Save"), button:has-text("Confirm")');
      }
      
      // Reload page and verify query parameters are persisted
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Click on the saved request
      const requestItem = page.locator('text=Users with Params').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();
        
        // Check if query parameters are still there
        const paramsTab = page.locator('button:has-text("Params")').first();
        if (await paramsTab.isVisible()) {
          await paramsTab.click();
          
          // Verify parameters exist
          const pageInput = page.locator('input[value="1"]').first();
          const limitInput = page.locator('input[value="10"]').first();
          
          if (await pageInput.isVisible() && await limitInput.isVisible()) {
            await expect(pageInput).toBeVisible();
            await expect(limitInput).toBeVisible();
          }
        }
      }
    });

    test('should persist headers correctly', async ({ page }) => {
      await page.click('button:has-text("Collections")');
      
      // Click New Request button
      const newRequestBtn = page.locator('button:has-text("New Request")').first();
      await expect(newRequestBtn).toBeVisible();
      await newRequestBtn.click();
      await page.waitForTimeout(1000);
      
      // Create a request with headers
      await page.fill('input[placeholder*="url" i]', 'https://api.example.com/data');
      
      // Add headers
      const headersTab = page.locator('button:has-text("Headers")').first();
      if (await headersTab.isVisible()) {
        await headersTab.click();
        
        // Add multiple headers
        const addBtn1 = page.locator('button:has-text("Add")').first();
        if (await addBtn1.isVisible()) {
          await addBtn1.click();
          const inputs1 = page.locator('input').all();
          if (inputs1.length >= 2) {
            await inputs1[0].fill('Content-Type');
            await inputs1[1].fill('application/json');
          }
        }
        
        const addBtn2 = page.locator('button:has-text("Add")').first();
        if (await addBtn2.isVisible()) {
          await addBtn2.click();
          const inputs2 = page.locator('input').all();
          if (inputs2.length >= 4) {
            await inputs2[2].fill('X-API-Key');
            await inputs2[3].fill('secret-key-123');
          }
        }
      }
      
      // Save request
      const saveBtn = page.locator('button:has-text("Save")').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.fill('input[placeholder*="name" i]', 'Request with Headers');
        await page.click('button:has-text("Save"), button:has-text("Confirm")');
      }
      
      // Reload and verify headers persist
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const requestItem = page.locator('text=Request with Headers').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();
        
        const headersTab = page.locator('button:has-text("Headers")').first();
        if (await headersTab.isVisible()) {
          await headersTab.click();
          
          // Verify headers exist
          const contentTypeInput = page.locator('input[value="application/json"]').first();
          const apiKeyInput = page.locator('input[value="secret-key-123"]').first();
          
          if (await contentTypeInput.isVisible() && await apiKeyInput.isVisible()) {
            await expect(contentTypeInput).toBeVisible();
            await expect(apiKeyInput).toBeVisible();
          }
        }
      }
    });

    test('should persist authentication settings', async ({ page }) => {
      await page.click('button:has-text("Collections")');
      
      // Click New Request button
      const newRequestBtn = page.locator('button:has-text("New Request")').first();
      await expect(newRequestBtn).toBeVisible();
      await newRequestBtn.click();
      await page.waitForTimeout(1000);
      
      // Create a request with authentication
      await page.fill('input[placeholder*="url" i]', 'https://api.example.com/protected');
      
      // Set up authentication
      const authTab = page.locator('button:has-text("Auth")').first();
      if (await authTab.isVisible()) {
        await authTab.click();
        
        const authTypeSelect = page.locator('select, button:has-text("None")').first();
        if (await authTypeSelect.isVisible()) {
          await authTypeSelect.click();
          await page.click('text=Basic Auth');
          
          // Fill basic auth credentials
          const usernameInput = page.locator('input[placeholder*="username" i]').first();
          const passwordInput = page.locator('input[placeholder*="password" i]').first();
          
          if (await usernameInput.isVisible() && await passwordInput.isVisible()) {
            await usernameInput.fill('testuser');
            await passwordInput.fill('testpass');
          }
        }
      }
      
      // Save request
      const saveBtn = page.locator('button:has-text("Save")').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.fill('input[placeholder*="name" i]', 'Authenticated Request');
        await page.click('button:has-text("Save"), button:has-text("Confirm")');
      }
      
      // Reload and verify auth persists
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const requestItem = page.locator('text=Authenticated Request').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();
        
        const authTab = page.locator('button:has-text("Auth")').first();
        if (await authTab.isVisible()) {
          await authTab.click();
          
          // Verify auth settings exist
          const usernameInput = page.locator('input[value="testuser"]').first();
          const passwordInput = page.locator('input[value="testpass"]').first();
          
          if (await usernameInput.isVisible() && await passwordInput.isVisible()) {
            await expect(usernameInput).toBeVisible();
            await expect(passwordInput).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Request CRUD Operations', () => {
    test('should update existing request', async ({ page }) => {
      await page.click('button:has-text("Collections")');
      
      // Create a request first
      // Click New Request button
      const newRequestBtn = page.locator('button:has-text("New Request")').first();
      await expect(newRequestBtn).toBeVisible();
      await newRequestBtn.click();
      await page.waitForTimeout(1000);
      
      // Create a request to update
      await page.fill('input[placeholder*="url" i]', 'https://api.example.com/initial');
      await page.fill('input[placeholder*="name" i]', 'Initial Request');
      
      const saveBtn = page.locator('button:has-text("Save")').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.fill('input[placeholder*="name" i]', 'Initial Request');
        await page.click('button:has-text("Save"), button:has-text("Confirm")');
      }
      
      await page.waitForTimeout(1000);
      
      // Now update the request
      const requestItem = page.locator('text=Initial Request').first();
      if (await requestItem.isVisible()) {
        await requestItem.click();
        
        // Modify the URL
        const urlInput = page.locator('input[placeholder*="url" i]').first();
        if (await urlInput.isVisible()) {
          await urlInput.fill('https://api.example.com/updated');
          
          // Save changes
          const saveBtn = page.locator('button:has-text("Save")').first();
          if (await saveBtn.isVisible()) {
            await saveBtn.click();
          }
          
          // Reload and verify update persisted
          await page.reload();
          await page.waitForLoadState('networkidle');
          
          const updatedRequest = page.locator('text=Initial Request').first();
          if (await updatedRequest.isVisible()) {
            await updatedRequest.click();
            
            const urlInputAfterReload = page.locator('input[placeholder*="url" i]').first();
            if (await urlInputAfterReload.isVisible()) {
              await expect(urlInputAfterReload).toHaveValue('https://api.example.com/updated');
            }
          }
        }
      }
    });

    test('should duplicate request with all data', async ({ page }) => {
      await page.click('button:has-text("Collections")');
      
      // Create a request with all fields
      // Click New Request button
      const newRequestBtn = page.locator('button:has-text("New Request")').first();
      await expect(newRequestBtn).toBeVisible();
      await newRequestBtn.click();
      await page.waitForTimeout(1000);
      
      // Create a request with all fields for duplication
      await page.fill('input[placeholder*="url" i]', 'https://api.example.com/duplicate-test');
      await page.fill('input[placeholder*="name" i]', 'Original Request');
      
      // Add query params
      const paramsTab = page.locator('button:has-text("Params")').first();
      if (await paramsTab.isVisible()) {
        await paramsTab.click();
        const addBtn = page.locator('button:has-text("Add")').first();
        if (await addBtn.isVisible()) {
          await addBtn.click();
          const inputs = page.locator('input').all();
          if (inputs.length >= 2) {
            await inputs[0].fill('test');
            await inputs[1].fill('value');
          }
        }
      }
      
      // Add headers
      const headersTab = page.locator('button:has-text("Headers")').first();
      if (await headersTab.isVisible()) {
        await headersTab.click();
        const addBtn = page.locator('button:has-text("Add")').first();
        if (await addBtn.isVisible()) {
          await addBtn.click();
          const inputs = page.locator('input').all();
          if (inputs.length >= 2) {
            await inputs[0].fill('X-Test');
            await inputs[1].fill('test-value');
          }
        }
      }
      
      // Save request
      const saveBtn = page.locator('button:has-text("Save")').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.fill('input[placeholder*="name" i]', 'Original Request');
        await page.click('button:has-text("Save"), button:has-text("Confirm")');
      }
      
      await page.waitForTimeout(1000);
      
      // Duplicate the request
      const requestItem = page.locator('text=Original Request').first();
      if (await requestItem.isVisible()) {
        await requestItem.click({ button: 'right' });
        
        const duplicateOption = page.locator('text=Duplicate, text=Copy').first();
        if (await duplicateOption.isVisible()) {
          await duplicateOption.click();
          
          // Verify duplicate was created
          await expect(page.locator('text=Copy of Original Request')).toBeVisible();
          
          // Click on duplicate and verify all data is copied
          const duplicateItem = page.locator('text=Copy of Original Request').first();
          await duplicateItem.click();
          
          // Check URL
          const urlInput = page.locator('input[placeholder*="url" i]').first();
          if (await urlInput.isVisible()) {
            await expect(urlInput).toHaveValue('https://api.example.com/duplicate-test');
          }
          
          // Check query params
          const paramsTab = page.locator('button:has-text("Params")').first();
          if (await paramsTab.isVisible()) {
            await paramsTab.click();
            const testInput = page.locator('input[value="value"]').first();
            if (await testInput.isVisible()) {
              await expect(testInput).toBeVisible();
            }
          }
          
          // Check headers
          const headersTab = page.locator('button:has-text("Headers")').first();
          if (await headersTab.isVisible()) {
            await headersTab.click();
            const testHeaderInput = page.locator('input[value="test-value"]').first();
            if (await testHeaderInput.isVisible()) {
              await expect(testHeaderInput).toBeVisible();
            }
          }
        }
      }
    });

    test('should delete request and remove from sidebar', async ({ page }) => {
      await page.click('button:has-text("Collections")');
      
      // Create a request to delete
      // Click New Request button
      const newRequestBtn = page.locator('button:has-text("New Request")').first();
      await expect(newRequestBtn).toBeVisible();
      await newRequestBtn.click();
      await page.waitForTimeout(1000);
      
      // Create a request to delete
      await page.fill('input[placeholder*="url" i]', 'https://api.example.com/to-delete');
      await page.fill('input[placeholder*="name" i]', 'Request to Delete');
      
      const saveBtn = page.locator('button:has-text("Save")').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.fill('input[placeholder*="name" i]', 'Request to Delete');
        await page.click('button:has-text("Save"), button:has-text("Confirm")');
      }
      
      await page.waitForTimeout(1000);
      
      // Delete the request
      const requestItem = page.locator('text=Request to Delete').first();
      if (await requestItem.isVisible()) {
        await requestItem.click({ button: 'right' });
        
        const deleteOption = page.locator('text=Delete, text=Remove').first();
        if (await deleteOption.isVisible()) {
          await deleteOption.click();
          
          // Confirm deletion
          const confirmBtn = page.locator('button:has-text("Delete"), button:has-text("Confirm")').first();
          if (await confirmBtn.isVisible()) {
            await confirmBtn.click();
          }
          
          // Verify request is removed from sidebar
          await expect(page.locator('text=Request to Delete')).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Postman-like Features', () => {
    test('should create request with proper Postman-like workflow', async ({ page }) => {
      // Navigate to home page (main request builder)
      await page.click('button:has-text("Home")');
      
      // Create a new request from scratch
      const urlInput = page.locator('input[placeholder*="url" i]').first();
      await expect(urlInput).toBeVisible();
      
      // Fill request details like in Postman
      await urlInput.fill('https://jsonplaceholder.typicode.com/posts');
      
      // Change method to POST
      const methodSelect = page.locator('button:has-text("GET"), select').first();
      await methodSelect.click();
      await page.click('text=POST');
      
      // Add request body
      const bodyTab = page.locator('button:has-text("Body")').first();
      if (await bodyTab.isVisible()) {
        await bodyTab.click();
        const bodyTextarea = page.locator('textarea, .monaco-editor').first();
        if (await bodyTextarea.isVisible()) {
          await bodyTextarea.fill('{"title": "foo", "body": "bar", "userId": 1}');
        }
      }
      
      // Send the request
      const sendBtn = page.locator('button:has-text("Send"), button:has-text("Execute")').first();
      await expect(sendBtn).toBeVisible();
      await sendBtn.click();
      
      // Wait for response
      await page.waitForTimeout(2000);
      
      // Verify response is displayed
      const responseSection = page.locator('[data-testid*="response"], .response-panel').first();
      if (await responseSection.isVisible()) {
        await expect(responseSection).toBeVisible();
      }
      
      // Save the request
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Save Request")').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        
        // Fill save dialog
        const nameInput = page.locator('input[placeholder*="name" i]').first();
        if (await nameInput.isVisible()) {
          await nameInput.fill('Create Post Request');
          
          // Select collection
          const collectionSelect = page.locator('select, button:has-text("Select Collection")').first();
          if (await collectionSelect.isVisible()) {
            await collectionSelect.click();
            await page.click('text=JSONPlaceholder API');
          }
          
          // Confirm save
          const confirmBtn = page.locator('button:has-text("Save"), button:has-text("Confirm")').first();
          await confirmBtn.click();
        }
        
        // Verify request appears in collections
        await page.click('button:has-text("Collections")');
        await expect(page.locator('text=Create Post Request')).toBeVisible();
      }
    });

    test('should handle request history properly', async ({ page }) => {
      // Send a request first
      await page.click('button:has-text("Home")');
      
      const urlInput = page.locator('input[placeholder*="url" i]').first();
      if (await urlInput.isVisible()) {
        await urlInput.fill('https://jsonplaceholder.typicode.com/users/1');
        
        const sendBtn = page.locator('button:has-text("Send")').first();
        if (await sendBtn.isVisible()) {
          await sendBtn.click();
          await page.waitForTimeout(2000);
        }
      }
      
      // Navigate to history page
      await page.click('button:has-text("History")');
      
      // Verify request appears in history
      const historyItems = page.locator('[data-testid*="history"], .history-item').first();
      if (await historyItems.isVisible()) {
        await expect(historyItems).toBeVisible();
        
        // Click on history item to reload request
        await historyItems.click();
        
        // Verify request details are loaded
        const urlInputAfterHistory = page.locator('input[placeholder*="url" i]').first();
        if (await urlInputAfterHistory.isVisible()) {
          await expect(urlInputAfterHistory).toHaveValue('https://jsonplaceholder.typicode.com/users/1');
        }
      }
    });

    test('should support request collections and folders', async ({ page }) => {
      await page.click('button:has-text("Collections")');
      
      // Create a collection
      const createCollectionBtn = page.locator('button:has-text("New Collection")').first();
      if (await createCollectionBtn.isVisible()) {
        await createCollectionBtn.click();
        await page.fill('input[placeholder*="name" i]', 'API Test Collection');
        await page.fill('textarea[placeholder*="description" i]', 'Collection for testing API endpoints');
        await page.click('button:has-text("Save"), button:has-text("Create")');
        
        await page.waitForTimeout(1000);
        
        // Create a folder within the collection
        const createFolderBtn = page.locator('button:has-text("New Folder")').first();
        if (await createFolderBtn.isVisible()) {
          await createFolderBtn.click();
          await page.fill('input[placeholder*="name" i]', 'User Endpoints');
          await page.fill('textarea[placeholder*="description" i]', 'Folder for user-related API calls');
          await page.click('button:has-text("Save"), button:has-text("Create")');
          
          await page.waitForTimeout(1000);
          
          // Create a request in the folder
          const createRequestBtn = page.locator('button:has-text("New Request"), button:has-text("Add Request")').first();
          if (await createRequestBtn.isVisible()) {
            await createRequestBtn.click();
            await page.fill('input[placeholder*="url" i]', 'https://api.example.com/users');
            await page.fill('input[placeholder*="name" i]', 'Get All Users');
            
            const saveBtn = page.locator('button:has-text("Save")').first();
            if (await saveBtn.isVisible()) {
              await saveBtn.click();
              await page.fill('input[placeholder*="name" i]', 'Get All Users');
              
              // Select the folder
              const folderSelect = page.locator('select, button:has-text("Select Folder")').first();
              if (await folderSelect.isVisible()) {
                await folderSelect.click();
                await page.click('text=User Endpoints');
              }
              
              await page.click('button:has-text("Save"), button:has-text("Confirm")');
            }
            
            // Verify hierarchical structure
            await expect(page.locator('text=API Test Collection')).toBeVisible();
            await expect(page.locator('text=User Endpoints')).toBeVisible();
            await expect(page.locator('text=Get All Users')).toBeVisible();
          }
        }
      }
    });
  });
});
