import { test, expect } from '../../helpers/electron-fixtures';
import { getDatabaseContents } from '../../helpers/test-db';

test.describe('Full Cycle: UI → IPC → DB → UI', () => {
  test('should complete full cycle for collection', async ({ electronPage, _testDbPath }) => {
    // Step 1: UI Action - Create collection (simulated via IPC call)
    const createResult = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Full Cycle Collection',
        description: 'Testing full cycle',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });
    
    expect(createResult.success).toBe(true);
    const collectionId = createResult.id;
    
    // Step 2: Verify IPC → DB (data persisted)
    const dbContents1 = getDatabaseContents(testDbPath);
    const dbCollection = dbContents1?.collections?.find((c: any) => c.id === collectionId);
    expect(dbCollection).toBeDefined();
    expect(dbCollection?.name).toBe('Full Cycle Collection');
    
    // Step 3: DB → UI (retrieve via IPC, UI would read this)
    const retrieved = await electronPage.evaluate(async (id) => {
      const collections = await window.electronAPI.collection.list();
      return collections.find((c: any) => c.id === id);
    }, collectionId);
    
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Full Cycle Collection');
    
    // Step 4: UI Action - Update collection
    const updateResult = await electronPage.evaluate(async (id) => {
      return await window.electronAPI.collection.save({
        id,
        name: 'Updated Full Cycle',
        description: 'Updated',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    }, collectionId);
    
    expect(updateResult.success).toBe(true);
    
    // Step 5: Verify update persisted
    const dbContents2 = getDatabaseContents(testDbPath);
    const updatedDb = dbContents2?.collections?.find((c: any) => c.id === collectionId);
    expect(updatedDb?.name).toBe('Updated Full Cycle');
    
    // Step 6: DB → UI (retrieve updated)
    const updatedRetrieved = await electronPage.evaluate(async (id) => {
      const collections = await window.electronAPI.collection.list();
      return collections.find((c: any) => c.id === id);
    }, collectionId);
    
    expect(updatedRetrieved?.name).toBe('Updated Full Cycle');
  });

  test('should complete full cycle for environment', async ({ electronPage, _testDbPath }) => {
    // UI → IPC → DB
    const createResult = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.save({
        name: 'full-cycle-env',
        displayName: 'Full Cycle Env',
        variables: { test: 'value' },
        isDefault: false,
      });
    });
    
    expect(createResult.success).toBe(true);
    
    // Verify DB
    const dbContents = getDatabaseContents(testDbPath);
    const dbEnv = dbContents?.environments?.find((e: any) => e.id === createResult.id);
    expect(dbEnv).toBeDefined();
    
    // DB → UI
    const retrieved = await electronPage.evaluate(async (id) => {
      const envs = await window.electronAPI.env.list();
      return envs.find((e: any) => e.id === id);
    }, createResult.id);
    
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('full-cycle-env');
  });

  test('should complete full cycle for request', async ({ electronPage, _testDbPath }) => {
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
    
    // UI → IPC → DB
    const createResult = await electronPage.evaluate(async (collectionId) => {
      return await window.electronAPI.request.save({
        name: 'Full Cycle Request',
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
    
    expect(createResult.success).toBe(true);
    
    // Verify DB
    const dbContents = getDatabaseContents(testDbPath);
    const dbRequest = dbContents?.requests?.find((r: any) => r.id === createResult.id);
    expect(dbRequest).toBeDefined();
    
    // DB → UI
    const retrieved = await electronPage.evaluate(async ({ collectionId, requestId }) => {
      const requests = await window.electronAPI.request.list(collectionId);
      return requests.find((r: any) => r.id === requestId);
    }, { collectionId: collection.id, requestId: createResult.id });
    
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Full Cycle Request');
  });
});

