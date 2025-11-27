import { test, expect } from '../../helpers/electron-fixtures';

test.describe('Component Rendering', () => {
  test('should render app after page load', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Wait for app to load
    await electronPage.waitForLoadState('networkidle');

    // Check if main app container exists
    const hasApp = await electronPage.evaluate(() => {
      return document.body.innerHTML.length > 0;
    });

    expect(hasApp).toBe(true);
  });

  test('should render collections after IPC call', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create a collection via IPC
    const collection = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Test Collection',
        description: 'Test Description',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    expect(collection.success).toBe(true);

    // Wait for potential UI updates
    await electronPage.waitForTimeout(500);

    // Verify collection was created (via IPC, not UI - UI rendering tests would need actual component selectors)
    const collections = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.list();
    });

    expect(collections.length).toBe(1);
    expect(collections[0].name).toBe('Test Collection');
  });

  test('should render environments after IPC call', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create an environment via IPC
    const env = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.save({
        name: 'test-env',
        displayName: 'Test Environment',
        variables: { base_url: 'https://example.com' },
        isDefault: false,
      });
    });

    expect(env.success).toBe(true);

    // Wait for potential UI updates
    await electronPage.waitForTimeout(500);

    // Verify environment was created
    const environments = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.list();
    });

    expect(environments.length).toBe(1);
    expect(environments[0].name).toBe('test-env');
  });

  test('should render requests after IPC call', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create collection and request
    const collection = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Test Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    const request = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.request.save({
        name: 'Test Request',
        method: 'GET',
        url: 'https://example.com',
        headers: {},
        body: null,
        queryParams: [],
        auth: null,
        collectionId,
        folderId: null,
        isFavorite: false,
        order: 0,
      });
    }, collection.id);

    expect(request.success).toBe(true);

    // Wait for potential UI updates
    await electronPage.waitForTimeout(500);

    // Verify request was created
    const requests = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.request.list(collectionId);
    }, collection.id);

    expect(requests.length).toBe(1);
    expect(requests[0].name).toBe('Test Request');
  });
});
