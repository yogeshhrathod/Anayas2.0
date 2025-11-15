import { test, expect } from '../../helpers/electron-fixtures';
import { assertDataPersisted, assertDatabaseCount } from '../../helpers/assertions';
import { getDatabaseContents } from '../../helpers/test-db';

test.describe('Unsaved Request IPC Handlers', () => {
  test('unsaved-request:save - should create new unsaved request', async ({ electronPage, testDbPath }) => {
    const requestData = {
      name: 'Unsaved Request',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      headers: {},
      body: '',
      queryParams: [],
      auth: null,
    };
    
    const result = await electronPage.evaluate(async (request) => {
      return await window.electronAPI.unsavedRequest.save(request);
    }, requestData);
    
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    
    // Verify persistence
    const dbContents = getDatabaseContents(testDbPath);
    const unsavedRequest = dbContents.unsaved_requests.find((r: any) => r.id === result.id);
    expect(unsavedRequest).toBeDefined();
    expect(unsavedRequest.name).toBe(requestData.name);
    expect(unsavedRequest.method).toBe(requestData.method);
    expect(unsavedRequest.url).toBe(requestData.url);
  });

  test('unsaved-request:save - should update existing unsaved request', async ({ electronPage, testDbPath }) => {
    // Create unsaved request first
    const createResult = await electronPage.evaluate(async () => {
      return await window.electronAPI.unsavedRequest.save({
        name: 'Original Request',
        method: 'GET',
        url: 'https://example.com',
        headers: {},
        body: '',
        queryParams: [],
        auth: null,
      });
    });
    
    // Update it
    const updateResult = await electronPage.evaluate(async (id) => {
      return await window.electronAPI.unsavedRequest.save({
        id,
        name: 'Updated Request',
        method: 'POST',
        url: 'https://updated.com',
        headers: { 'Content-Type': 'application/json' },
        body: '{"key": "value"}',
        queryParams: [],
        auth: null,
      });
    }, createResult.id);
    
    expect(updateResult.success).toBe(true);
    expect(updateResult.id).toBe(createResult.id);
    
    // Verify update
    const dbContents = getDatabaseContents(testDbPath);
    const unsavedRequest = dbContents.unsaved_requests.find((r: any) => r.id === createResult.id);
    expect(unsavedRequest.name).toBe('Updated Request');
    expect(unsavedRequest.method).toBe('POST');
    expect(unsavedRequest.url).toBe('https://updated.com');
  });

  test('unsaved-request:get-all - should return all unsaved requests', async ({ electronPage, testDbPath }) => {
    // Create multiple unsaved requests
    await electronPage.evaluate(async () => {
      await window.electronAPI.unsavedRequest.save({
        name: 'Request 1',
        method: 'GET',
        url: 'https://example.com/1',
        headers: {},
        body: '',
        queryParams: [],
        auth: null,
      });
      await window.electronAPI.unsavedRequest.save({
        name: 'Request 2',
        method: 'POST',
        url: 'https://example.com/2',
        headers: {},
        body: '',
        queryParams: [],
        auth: null,
      });
    });
    
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.unsavedRequest.getAll();
    });
    
    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('method');
    expect(result[0]).toHaveProperty('url');
  });

  test('unsaved-request:delete - should delete unsaved request', async ({ electronPage, testDbPath }) => {
    // Create unsaved request first
    const createResult = await electronPage.evaluate(async () => {
      return await window.electronAPI.unsavedRequest.save({
        name: 'Test Request',
        method: 'GET',
        url: 'https://example.com',
        headers: {},
        body: '',
        queryParams: [],
        auth: null,
      });
    });
    
    // Delete it
    const deleteResult = await electronPage.evaluate(async (id) => {
      return await window.electronAPI.unsavedRequest.delete(id);
    }, createResult.id);
    
    expect(deleteResult.success).toBe(true);
    
    // Verify deletion
    const allRequests = await electronPage.evaluate(async () => {
      return await window.electronAPI.unsavedRequest.getAll();
    });
    
    expect(allRequests.length).toBe(0);
  });

  test('unsaved-request:clear - should clear all unsaved requests', async ({ electronPage, testDbPath }) => {
    // Create multiple unsaved requests
    await electronPage.evaluate(async () => {
      await window.electronAPI.unsavedRequest.save({
        name: 'Request 1',
        method: 'GET',
        url: 'https://example.com/1',
        headers: {},
        body: '',
        queryParams: [],
        auth: null,
      });
      await window.electronAPI.unsavedRequest.save({
        name: 'Request 2',
        method: 'POST',
        url: 'https://example.com/2',
        headers: {},
        body: '',
        queryParams: [],
        auth: null,
      });
    });
    
    // Clear all
    const clearResult = await electronPage.evaluate(async () => {
      return await window.electronAPI.unsavedRequest.clear();
    });
    
    expect(clearResult.success).toBe(true);
    
    // Verify all cleared
    const allRequests = await electronPage.evaluate(async () => {
      return await window.electronAPI.unsavedRequest.getAll();
    });
    
    expect(allRequests.length).toBe(0);
  });

  test('unsaved-request:promote - should promote unsaved request to saved request', async ({ electronPage, testDbPath }) => {
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
    
    // Create unsaved request
    const unsavedRequest = await electronPage.evaluate(async () => {
      return await window.electronAPI.unsavedRequest.save({
        name: 'Unsaved Request',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: {},
        body: '',
        queryParams: [],
        auth: null,
      });
    });
    
    // Promote it
    const promoteResult = await electronPage.evaluate(async ({ id, collectionId }) => {
      return await window.electronAPI.unsavedRequest.promote(id, {
        collectionId,
        folderId: null,
        isFavorite: false,
        order: 0,
      });
    }, { id: unsavedRequest.id, collectionId: collection.id });
    
    expect(promoteResult.success).toBe(true);
    expect(promoteResult.id).toBeDefined();
    
    // Verify unsaved request is gone
    const allUnsaved = await electronPage.evaluate(async () => {
      return await window.electronAPI.unsavedRequest.getAll();
    });
    expect(allUnsaved.length).toBe(0);
    
    // Verify saved request exists
    const savedRequests = await electronPage.evaluate(async (collectionId) => {
      return await window.electronAPI.request.list(collectionId);
    }, collection.id);
    
    expect(savedRequests.length).toBe(1);
    expect(savedRequests[0].name).toBe('Unsaved Request');
  });
});

