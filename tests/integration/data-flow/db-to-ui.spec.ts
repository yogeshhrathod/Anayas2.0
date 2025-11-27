import { test, expect } from '../../helpers/electron-fixtures';

test.describe('Database to UI Flow', () => {
  test('should retrieve collections from database via IPC', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create collection via IPC (which persists to DB)
    const createResult = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Test Collection',
        description: 'Test',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    expect(createResult.success).toBe(true);

    // Retrieve via IPC (reads from DB)
    const collections = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.list();
    });

    expect(collections.length).toBe(1);
    expect(collections[0].id).toBe(createResult.id);
    expect(collections[0].name).toBe('Test Collection');
  });

  test('should retrieve environments from database via IPC', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create environment via IPC
    const createResult = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.save({
        name: 'test-env',
        displayName: 'Test',
        variables: { key: 'value' },
        isDefault: false,
      });
    });

    expect(createResult.success).toBe(true);

    // Retrieve via IPC
    const environments = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.list();
    });

    expect(environments.length).toBe(1);
    expect(environments[0].id).toBe(createResult.id);
    expect(environments[0].name).toBe('test-env');
  });

  test('should retrieve requests from database via IPC', async ({
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

    // Retrieve via IPC
    const requests = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.request.list(collectionId);
    }, collection.id);

    expect(requests.length).toBe(1);
    expect(requests[0].id).toBe(request.id);
    expect(requests[0].name).toBe('Test Request');
  });

  test('should retrieve current environment from database', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create default environment
    const env = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.save({
        name: 'default-env',
        displayName: 'Default',
        variables: {},
        isDefault: true,
      });
    });

    // Retrieve current environment (reads from DB)
    const current = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.getCurrent();
    });

    expect(current).toBeDefined();
    expect(current?.id).toBe(env.id);
    expect(current?.isDefault).toBe(1);
  });
});
