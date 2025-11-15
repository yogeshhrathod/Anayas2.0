import { test, expect } from '../helpers/electron-fixtures';
import { getDatabaseContents } from '../helpers/test-db';

test.describe('Database Operations Tests', () => {
  test('should persist environment data', async ({ electronPage, testDbPath }) => {
    // Create environment via IPC
    const result = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.env.save({
        name: 'persist-test',
        displayName: 'Persist Test',
        variables: { key: 'value' }
      });
    });
    
    expect(result.success).toBe(true);
    
    // Verify persistence in database file
    const dbContents = getDatabaseContents(testDbPath);
    expect(dbContents).toBeTruthy();
    expect(dbContents.environments).toBeDefined();
    
    const savedEnv = dbContents.environments.find((e: any) => e.id === result.id);
    expect(savedEnv).toBeDefined();
    expect(savedEnv.name).toBe('persist-test');
    expect(savedEnv.variables.key).toBe('value');
  });

  test('should persist collection data', async ({ electronPage, testDbPath }) => {
    // Create collection via IPC
    const result = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.collection.save({
        name: 'persist-collection',
        description: 'Persist Test Collection',
        environments: []
      });
    });
    
    expect(result.success).toBe(true);
    
    // Verify persistence
    const dbContents = getDatabaseContents(testDbPath);
    const savedCollection = dbContents.collections.find((c: any) => c.id === result.id);
    expect(savedCollection).toBeDefined();
    expect(savedCollection.name).toBe('persist-collection');
  });

  test('should persist request data', async ({ electronPage, testDbPath }) => {
    // Create collection first
    const collectionResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.collection.save({
        name: 'request-persist-collection',
        environments: []
      });
    });
    
    // Create request
    const requestResult = await electronPage.evaluate(async (collectionId) => {
      return await (window as any).electronAPI.request.save({
        name: 'persist-request',
        method: 'POST',
        url: 'https://api.example.com/test',
        headers: { 'Content-Type': 'application/json' },
        body: '{"test": "data"}',
        queryParams: [{ key: 'param', value: 'value', enabled: true }],
        auth: { type: 'none' },
        collectionId
      });
    }, collectionResult.id);
    
    expect(requestResult.success).toBe(true);
    
    // Verify persistence
    const dbContents = getDatabaseContents(testDbPath);
    const savedRequest = dbContents.requests.find((r: any) => r.id === requestResult.id);
    expect(savedRequest).toBeDefined();
    expect(savedRequest.method).toBe('POST');
    expect(savedRequest.body).toBe('{"test": "data"}');
    expect(savedRequest.queryParams).toHaveLength(1);
  });

  test('should maintain collection-request relationships', async ({ electronPage, testDbPath }) => {
    // Create collection
    const collectionResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.collection.save({
        name: 'relationship-test',
        environments: []
      });
    });
    
    // Create request in collection
    const requestResult = await electronPage.evaluate(async (collectionId) => {
      return await (window as any).electronAPI.request.save({
        name: 'relationship-request',
        method: 'GET',
        url: 'https://api.example.com',
        headers: {},
        body: null,
        queryParams: [],
        auth: { type: 'none' },
        collectionId
      });
    }, collectionResult.id);
    
    // Verify relationship
    const dbContents = getDatabaseContents(testDbPath);
    const request = dbContents.requests.find((r: any) => r.id === requestResult.id);
    expect(request.collectionId).toBe(collectionResult.id);
    
    // Delete collection and verify request is also deleted
    await electronPage.evaluate(async (id) => {
      return await (window as any).electronAPI.collection.delete(id);
    }, collectionResult.id);
    
    const dbContentsAfter = getDatabaseContents(testDbPath);
    const deletedRequest = dbContentsAfter.requests.find((r: any) => r.id === requestResult.id);
    expect(deletedRequest).toBeUndefined();
  });

  test('should maintain folder-request relationships', async ({ electronPage, testDbPath }) => {
    // Create collection
    const collectionResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.collection.save({
        name: 'folder-relationship-test',
        environments: []
      });
    });
    
    // Create folder
    const folderResult = await electronPage.evaluate(async (collectionId) => {
      return await (window as any).electronAPI.folder.save({
        name: 'test-folder',
        collectionId
      });
    }, collectionResult.id);
    
    // Create request in folder
    const requestResult = await electronPage.evaluate(async ({ collectionId, folderId }) => {
      return await (window as any).electronAPI.request.save({
        name: 'folder-request',
        method: 'GET',
        url: 'https://api.example.com',
        headers: {},
        body: null,
        queryParams: [],
        auth: { type: 'none' },
        collectionId,
        folderId
      });
    }, { collectionId: collectionResult.id, folderId: folderResult.id });
    
    // Verify relationship
    const dbContents = getDatabaseContents(testDbPath);
    const request = dbContents.requests.find((r: any) => r.id === requestResult.id);
    expect(request.folderId).toBe(folderResult.id);
    
    // Delete folder and verify request is also deleted
    await electronPage.evaluate(async (id) => {
      return await (window as any).electronAPI.folder.delete(id);
    }, folderResult.id);
    
    const dbContentsAfter = getDatabaseContents(testDbPath);
    const deletedRequest = dbContentsAfter.requests.find((r: any) => r.id === requestResult.id);
    expect(deletedRequest).toBeUndefined();
  });

  test('should persist request history', async ({ electronPage, testDbPath }) => {
    // Send a request (this should create history)
    const sendResult = await electronPage.evaluate(async () => {
      // First create an environment
      const envResult = await (window as any).electronAPI.env.save({
        name: 'history-env',
        displayName: 'History Env',
        variables: {},
        isDefault: true
      });
      
      // Then send a request
      return await (window as any).electronAPI.request.send({
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: {},
        environmentId: envResult.id
      });
    });
    
    // Verify history was created
    const history = await electronPage.evaluate(() => {
      return (window as any).electronAPI.request.history(10);
    });
    
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    
    // Verify persistence in database
    const dbContents = getDatabaseContents(testDbPath);
    expect(dbContents.request_history).toBeDefined();
    expect(dbContents.request_history.length).toBeGreaterThan(0);
  });

  test('should handle data integrity on updates', async ({ electronPage, testDbPath }) => {
    // Create environment
    const envResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.env.save({
        name: 'integrity-test',
        displayName: 'Integrity Test',
        variables: { key1: 'value1' }
      });
    });
    
    // Update environment
    await electronPage.evaluate(async (id) => {
      return await (window as any).electronAPI.env.save({
        id,
        name: 'integrity-test',
        displayName: 'Updated Integrity Test',
        variables: { key1: 'value1', key2: 'value2' }
      });
    }, envResult.id);
    
    // Verify update persisted correctly
    const dbContents = getDatabaseContents(testDbPath);
    const updatedEnv = dbContents.environments.find((e: any) => e.id === envResult.id);
    expect(updatedEnv.variables.key1).toBe('value1');
    expect(updatedEnv.variables.key2).toBe('value2');
    expect(updatedEnv.displayName).toBe('Updated Integrity Test');
  });

  test('should maintain settings persistence', async ({ electronPage, testDbPath }) => {
    // Set multiple settings
    await electronPage.evaluate(async () => {
      await (window as any).electronAPI.settings.set('testSetting1', 'value1');
      await (window as any).electronAPI.settings.set('testSetting2', 'value2');
    });
    
    // Verify persistence
    const dbContents = getDatabaseContents(testDbPath);
    expect(dbContents.settings.testSetting1).toBe('value1');
    expect(dbContents.settings.testSetting2).toBe('value2');
  });
});

