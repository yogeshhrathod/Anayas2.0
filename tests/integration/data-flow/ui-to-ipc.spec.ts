import { test, expect } from '../../helpers/electron-fixtures';
import { getDatabaseContents } from '../../helpers/test-db';

test.describe('UI to IPC Flow', () => {
  test('should handle collection creation from UI perspective', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Simulate UI action: create collection
    // In real UI, this would be triggered by user clicking a button
    // Here we simulate by calling IPC directly (which UI would do)
    const result = await electronPage.evaluate(async () => {
      // This is what the UI component would call
      return await window.electronAPI.collection.save({
        name: 'UI Created Collection',
        description: 'Created from UI',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    expect(result.success).toBe(true);

    // Verify it was persisted (UI would then read this back)
    const dbContents = getDatabaseContents(testDbPath);
    const collection = dbContents?.collections?.find(
      (c: any) => c.id === result.id
    );
    expect(collection).toBeDefined();
    expect(collection?.name).toBe('UI Created Collection');
  });

  test('should handle environment creation from UI perspective', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Simulate UI action: create environment
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.save({
        name: 'ui-env',
        displayName: 'UI Environment',
        variables: { api_key: 'secret' },
        isDefault: false,
      });
    });

    expect(result.success).toBe(true);

    // Verify persisted
    const dbContents = getDatabaseContents(testDbPath);
    const env = dbContents?.environments?.find((e: any) => e.id === result.id);
    expect(env).toBeDefined();
    expect(env?.name).toBe('ui-env');
  });

  test('should handle request creation from UI perspective', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create collection first (UI would have this)
    const collection = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'UI Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    // Simulate UI action: create request
    const result = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.request.save({
        name: 'UI Request',
        method: 'POST',
        url: 'https://api.example.com/data',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: 'value' }),
        queryParams: [],
        auth: null,
        collectionId,
        folderId: null,
        isFavorite: false,
        order: 0,
      });
    }, collection.id);

    expect(result.success).toBe(true);

    // Verify persisted
    const dbContents = getDatabaseContents(testDbPath);
    const request = dbContents?.requests?.find((r: any) => r.id === result.id);
    expect(request).toBeDefined();
    expect(request?.name).toBe('UI Request');
  });

  test('should handle favorite toggle from UI perspective', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create collection
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

    // Simulate UI action: toggle favorite (user clicks star icon)
    await electronPage.evaluate(async id => {
      return await window.electronAPI.collection.toggleFavorite(id);
    }, collection.id);

    // Verify state changed
    const dbContents = getDatabaseContents(testDbPath);
    const updated = dbContents?.collections?.find(
      (c: any) => c.id === collection.id
    );
    expect(updated?.isFavorite).toBe(1);
  });
});
