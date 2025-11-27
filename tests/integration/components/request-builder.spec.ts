import { test, expect } from '../../helpers/electron-fixtures';
import { assertRendered } from '../../helpers/assertions';

test.describe('RequestBuilder Component Integration', () => {
  test('should render request builder with request data', async ({
    electronPage,
    _testDbPath,
  }) => {
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
    const urlInput = electronPage.locator(
      'input[placeholder*="URL"], input[type="url"]'
    );
    await urlInput.waitFor({ state: 'visible', timeout: 5000 });

    const urlValue = await urlInput.inputValue();
    expect(urlValue).toContain('jsonplaceholder.typicode.com');
  });

  test('should update form inputs', async ({ electronPage, _testDbPath }) => {
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
    const urlInput = electronPage
      .locator('input[placeholder*="URL"], input[type="url"]')
      .first();
    await urlInput.fill('https://updated-url.com');
    await electronPage.waitForTimeout(500);

    // Verify input was updated
    const updatedUrl = await urlInput.inputValue();
    expect(updatedUrl).toBe('https://updated-url.com');
  });

  test('should send request and display response', async ({
    electronPage,
    _testDbPath,
  }) => {
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

    // Wait for request builder to be available (it should render on home page)
    const urlInput = electronPage
      .locator(
        'input[placeholder*="URL"], input[placeholder*="Enter request URL"]'
      )
      .first();
    await urlInput.waitFor({ state: 'visible', timeout: 10000 });

    // Fill in request details
    await urlInput.fill('https://jsonplaceholder.typicode.com/posts/1');

    // Verify URL was filled
    const urlValue = await urlInput.inputValue();
    expect(urlValue).toBe('https://jsonplaceholder.typicode.com/posts/1');

    // Find and click send button
    const sendButton = electronPage.locator('button:has-text("Send")');
    await sendButton.waitFor({ state: 'visible', timeout: 5000 });
    await sendButton.click();

    // Wait for response to load
    await electronPage.waitForTimeout(3000);

    // Verify response panel is displayed with status code
    // Use more specific selector to avoid matching multiple elements
    const statusCode = electronPage.locator('text=200 OK').first();
    await statusCode.waitFor({ state: 'visible', timeout: 10000 });

    // Verify response body is visible - look for Monaco editor or response content
    // Response body is rendered in a Monaco editor or text area
    const responseBody = electronPage
      .locator(
        '[class*="monaco"], text="Response Body", [class*="ResponseBody"]'
      )
      .first();
    const responseVisible = await responseBody
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    // Alternative: Check if response tab is active or response data is present
    if (!responseVisible) {
      // Check if we can see any response-related content
      const hasResponseContent = await electronPage.evaluate(() => {
        const bodyText = document.body.textContent || '';
        return (
          bodyText.includes('userId') ||
          bodyText.includes('id') ||
          bodyText.includes('title')
        );
      });
      expect(hasResponseContent).toBe(true);
    }

    // Verify response contains expected data
    const responseText = await electronPage.locator('body').textContent();
    expect(responseText).toContain('200');
  });

  test('should handle different HTTP methods', async ({
    electronPage,
    _testDbPath,
  }) => {
    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    // Wait for method selector to be visible
    const methodSelect = electronPage
      .locator(
        'button:has-text("GET"), [role="combobox"]:has-text("GET"), [data-testid="method-select"]'
      )
      .first();
    await methodSelect.waitFor({ state: 'visible', timeout: 10000 });

    // Click to open dropdown
    await methodSelect.click();
    await electronPage.waitForTimeout(500);

    // Select POST method
    const postOption = electronPage
      .locator('[role="option"]:has-text("POST"), [data-value="POST"]')
      .first();
    await postOption.waitFor({ state: 'visible', timeout: 5000 });
    await postOption.click();
    await electronPage.waitForTimeout(500);

    // Verify method was changed - check the select button text or value
    const selectedMethodText = await methodSelect.textContent();
    expect(selectedMethodText?.trim().toUpperCase()).toContain('POST');

    // Also verify via evaluating the actual form state if possible
    const methodValue = await electronPage.evaluate(() => {
      const select = document.querySelector(
        '[data-testid="method-select"], button[role="combobox"]'
      ) as HTMLElement;
      return select?.textContent?.trim().toUpperCase() || '';
    });
    expect(methodValue).toContain('POST');
  });

  test('should display tabs for params, headers, body, auth', async ({
    electronPage,
    _testDbPath,
  }) => {
    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    // Wait for tabs to be visible
    const paramsTab = electronPage
      .locator('button:has-text("Params"), [role="tab"]:has-text("Params")')
      .first();
    await paramsTab.waitFor({ state: 'visible', timeout: 10000 });

    // Verify all expected tabs are present
    const headersTab = electronPage
      .locator('button:has-text("Headers"), [role="tab"]:has-text("Headers")')
      .first();
    const bodyTab = electronPage
      .locator('button:has-text("Body"), [role="tab"]:has-text("Body")')
      .first();
    const authTab = electronPage
      .locator('button:has-text("Auth"), [role="tab"]:has-text("Auth")')
      .first();

    // Verify each tab is visible
    await expect(paramsTab).toBeVisible();
    await expect(headersTab).toBeVisible();
    await expect(bodyTab).toBeVisible();
    await expect(authTab).toBeVisible();

    // Click on each tab to verify they work
    // Note: Tabs may use different selection indicators (class names, data attributes, etc.)
    await paramsTab.click();
    await electronPage.waitForTimeout(500);
    // Verify tab is active by checking if it has active styling or is visible
    const paramsTabActive = await paramsTab.evaluate(el => {
      return (
        el.classList.contains('border-primary') ||
        el.classList.contains('text-primary') ||
        el.getAttribute('aria-selected') === 'true' ||
        el.getAttribute('data-state') === 'active'
      );
    });
    expect(paramsTabActive).toBe(true);

    await headersTab.click();
    await electronPage.waitForTimeout(500);
    const headersTabActive = await headersTab.evaluate(el => {
      return (
        el.classList.contains('border-primary') ||
        el.classList.contains('text-primary') ||
        el.getAttribute('aria-selected') === 'true' ||
        el.getAttribute('data-state') === 'active'
      );
    });
    expect(headersTabActive).toBe(true);

    await bodyTab.click();
    await electronPage.waitForTimeout(500);
    const bodyTabActive = await bodyTab.evaluate(el => {
      return (
        el.classList.contains('border-primary') ||
        el.classList.contains('text-primary') ||
        el.getAttribute('aria-selected') === 'true' ||
        el.getAttribute('data-state') === 'active'
      );
    });
    expect(bodyTabActive).toBe(true);

    await authTab.click();
    await electronPage.waitForTimeout(500);
    const authTabActive = await authTab.evaluate(el => {
      return (
        el.classList.contains('border-primary') ||
        el.classList.contains('text-primary') ||
        el.getAttribute('aria-selected') === 'true' ||
        el.getAttribute('data-state') === 'active'
      );
    });
    expect(authTabActive).toBe(true);
  });
});
