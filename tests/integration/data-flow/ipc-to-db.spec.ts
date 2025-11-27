import { test, expect } from '../../helpers/electron-fixtures';
import { getDatabaseContents } from '../../helpers/test-db';

test.describe('IPC to Database Flow', () => {
  test('should persist collection after IPC save', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create collection via IPC
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Test Collection',
        description: 'Test Description',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    expect(result.success).toBe(true);

    // Verify persisted in database
    const dbContents = getDatabaseContents(testDbPath);
    const collection = dbContents?.collections?.find(
      (c: any) => c.id === result.id
    );

    expect(collection).toBeDefined();
    expect(collection?.name).toBe('Test Collection');
    expect(collection?.description).toBe('Test Description');
  });

  test('should persist environment after IPC save', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create environment via IPC
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.save({
        name: 'test-env',
        displayName: 'Test Environment',
        variables: { base_url: 'https://example.com' },
        isDefault: false,
      });
    });

    expect(result.success).toBe(true);

    // Verify persisted in database
    const dbContents = getDatabaseContents(testDbPath);
    const env = dbContents?.environments?.find((e: any) => e.id === result.id);

    expect(env).toBeDefined();
    expect(env?.name).toBe('test-env');
    expect(env?.displayName).toBe('Test Environment');
    expect(env?.variables?.base_url).toBe('https://example.com');
  });

  test('should persist request after IPC save', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create collection first
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

    // Create request via IPC
    const result = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.request.save({
        name: 'Test Request',
        method: 'POST',
        url: 'https://example.com/api',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'value' }),
        queryParams: [],
        auth: null,
        collectionId,
        folderId: null,
        isFavorite: false,
        order: 0,
      });
    }, collection.id);

    expect(result.success).toBe(true);

    // Verify persisted in database
    const dbContents = getDatabaseContents(testDbPath);
    const request = dbContents?.requests?.find((r: any) => r.id === result.id);

    expect(request).toBeDefined();
    expect(request?.name).toBe('Test Request');
    expect(request?.method).toBe('POST');
    expect(request?.url).toBe('https://example.com/api');
  });

  test('should update database after IPC update', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create collection
    const createResult = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Original Name',
        description: 'Original',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    // Update via IPC
    const updateResult = await electronPage.evaluate(async id => {
      return await window.electronAPI.collection.save({
        id,
        name: 'Updated Name',
        description: 'Updated',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    }, createResult.id);

    expect(updateResult.success).toBe(true);

    // Verify updated in database
    const dbContents = getDatabaseContents(testDbPath);
    const collection = dbContents?.collections?.find(
      (c: any) => c.id === createResult.id
    );

    expect(collection?.name).toBe('Updated Name');
    expect(collection?.description).toBe('Updated');
  });

  test('should remove from database after IPC delete', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create collection
    const createResult = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'To Delete',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    // Delete via IPC
    const deleteResult = await electronPage.evaluate(async id => {
      return await window.electronAPI.collection.delete(id);
    }, createResult.id);

    expect(deleteResult.success).toBe(true);

    // Verify removed from database
    const dbContents = getDatabaseContents(testDbPath);
    const collection = dbContents?.collections?.find(
      (c: any) => c.id === createResult.id
    );

    expect(collection).toBeUndefined();
  });
});
