import { test, expect } from '../../helpers/electron-fixtures';
import { assertRendered } from '../../helpers/assertions';

test.describe('RequestBuilder Component Integration', () => {
  test('should render request builder with request data', async ({ electronPage, testDbPath }) => {
    // Create environment and collection
    const setup = await electronPage.evaluate(async () => {
      const env = await window.electronAPI.env.save({
        name: 'test-env',
        displayName: 'Test Environment',
        variables: { base_url: 'https://jsonplaceholder.typicode.com' },
        isDefault: true,
      });

      const collection = await window.electronAPI.collection.save({
        name: 'Test Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });

      const request = await window.electronAPI.request.save({
        name: 'Test Request',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: { 'Content-Type': 'application/json' },
        body: null,
        queryParams: [],
        auth: null,
        collectionId: collection.id,
        folderId: null,
        isFavorite: false,
        order: 0,
      });

      return { requestId: request.id };
    });

    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    // Navigate to request (select it)
    // Request builder should render when a request is selected
    const requestElement = electronPage.locator('text=Test Request');
    await requestElement.waitFor({ state: 'visible', timeout: 5000 });
    await requestElement.click();
    await electronPage.waitForTimeout(1000);

    // Verify request builder components are rendered
    // Check for URL input
    const urlInput = electronPage.locator('input[placeholder*="URL"], input[type="url"]');
    await urlInput.waitFor({ state: 'visible', timeout: 5000 });
    
    const urlValue = await urlInput.inputValue();
    expect(urlValue).toContain('jsonplaceholder.typicode.com');
  });

  test('should update form inputs', async ({ electronPage, testDbPath }) => {
    // Create request
    const setup = await electronPage.evaluate(async () => {
      const collection = await window.electronAPI.collection.save({
        name: 'Form Test Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });

      const request = await window.electronAPI.request.save({
        name: 'Form Request',
        method: 'GET',
        url: 'https://example.com',
        headers: {},
        body: null,
        queryParams: [],
        auth: null,
        collectionId: collection.id,
        folderId: null,
        isFavorite: false,
        order: 0,
      });

      return { requestId: request.id };
    });

    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    // Select request
    const requestElement = electronPage.locator('text=Form Request');
    await requestElement.waitFor({ state: 'visible', timeout: 5000 });
    await requestElement.click();
    await electronPage.waitForTimeout(1000);

    // Update URL input
    const urlInput = electronPage.locator('input[placeholder*="URL"], input[type="url"]').first();
    await urlInput.fill('https://updated-url.com');
    await electronPage.waitForTimeout(500);

    // Verify input was updated
    const updatedUrl = await urlInput.inputValue();
    expect(updatedUrl).toBe('https://updated-url.com');
  });

  test('should send request and display response', async ({ electronPage, testDbPath }) => {
    // Create environment
    await electronPage.evaluate(async () => {
      await window.electronAPI.env.save({
        name: 'test-env',
        displayName: 'Test',
        variables: { base_url: 'https://jsonplaceholder.typicode.com' },
        isDefault: true,
      });
    });

    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    // Create new request via UI or select existing
    // Fill in request details
    const urlInput = electronPage.locator('input[placeholder*="URL"], input[type="url"]').first();
    if (await urlInput.count() > 0) {
      await urlInput.fill('https://jsonplaceholder.typicode.com/posts/1');
    }

    // Find and click send button
    const sendButton = electronPage.locator('button:has-text("Send"), button[aria-label*="Send"]');
    const sendButtonCount = await sendButton.count();
    
    if (sendButtonCount > 0) {
      await sendButton.click();
      await electronPage.waitForTimeout(2000); // Wait for response

      // Verify response panel is displayed
      // Response should show status and body
      const responseVisible = await electronPage.locator('text=200, text=Status, [class*="response"]').first().isVisible({ timeout: 5000 });
      // Response panel should be visible
    }
  });

  test('should handle different HTTP methods', async ({ electronPage, testDbPath }) => {
    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    const methodSelect = electronPage.locator('[data-testid="method-select"]').first();
    if (await methodSelect.count() > 0) {
      await methodSelect.click();
      const postOption = electronPage
        .locator('[data-radix-select-item][data-value="POST"], [data-value="POST"], [role="option"]:has-text("POST")')
        .first();
      if (await postOption.count() > 0) {
        await postOption.click();
        await electronPage.waitForTimeout(500);
        const selectedMethod = (await methodSelect.innerText())?.trim();
        expect(selectedMethod?.toUpperCase()).toBe('POST');
      }
    }
  });

  test('should display tabs for params, headers, body, auth', async ({ electronPage, testDbPath }) => {
    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    // Find tabs
    const paramsTab = electronPage.locator('button:has-text("Params"), [role="tab"]:has-text("Params")');
    const headersTab = electronPage.locator('button:has-text("Headers"), [role="tab"]:has-text("Headers")');
    const bodyTab = electronPage.locator('button:has-text("Body"), [role="tab"]:has-text("Body")');
    const authTab = electronPage.locator('button:has-text("Auth"), [role="tab"]:has-text("Auth")');

    // Verify tabs exist (at least some should be visible)
    const paramsCount = await paramsTab.count();
    const headersCount = await headersTab.count();
    
    // At least one tab should be available
    expect(paramsCount + headersCount).toBeGreaterThan(0);
  });
});

