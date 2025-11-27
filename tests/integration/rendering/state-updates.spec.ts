import { test, expect } from '../../helpers/electron-fixtures';
import { getDatabaseContents } from '../../helpers/test-db';

test.describe('State Updates', () => {
  test('should update database state after collection save', async ({ electronPage, _testDbPath }) => {
    // Get initial state
    const beforeState = getDatabaseContents(testDbPath);
    const beforeCount = beforeState?.collections?.length || 0;
    
    // Create collection
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Test Collection',
        description: 'Test',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });
    
    expect(result.success).toBe(true);
    
    // Verify state updated
    const afterState = getDatabaseContents(testDbPath);
    expect(afterState?.collections?.length).toBe(beforeCount + 1);
  });

  test('should update database state after environment save', async ({ electronPage, _testDbPath }) => {
    // Get initial state
    const beforeState = getDatabaseContents(testDbPath);
    const beforeCount = beforeState?.environments?.length || 0;
    
    // Create environment
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.save({
        name: 'test-env',
        displayName: 'Test',
        variables: {},
        isDefault: false,
      });
    });
    
    expect(result.success).toBe(true);
    
    // Verify state updated
    const afterState = getDatabaseContents(testDbPath);
    expect(afterState?.environments?.length).toBe(beforeCount + 1);
  });

  test('should update database state after request save', async ({ electronPage, _testDbPath }) => {
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
    
    // Get initial state
    const beforeState = getDatabaseContents(testDbPath);
    const beforeCount = beforeState?.requests?.length || 0;
    
    // Create request
    const result = await electronPage.evaluate(async (collectionId) => {
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
    
    expect(result.success).toBe(true);
    
    // Verify state updated
    const afterState = getDatabaseContents(testDbPath);
    expect(afterState?.requests?.length).toBe(beforeCount + 1);
  });

  test('should update collection favorite state', async ({ electronPage, _testDbPath }) => {
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
    
    // Toggle favorite
    await electronPage.evaluate(async (id) => {
      return await window.electronAPI.collection.toggleFavorite(id);
    }, collection.id);
    
    // Verify state updated
    const dbState = getDatabaseContents(testDbPath);
    const updatedCollection = dbState?.collections?.find((c: any) => c.id === collection.id);
    expect(updatedCollection?.isFavorite).toBe(1);
  });
});

