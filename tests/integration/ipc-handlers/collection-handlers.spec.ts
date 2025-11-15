import { test, expect } from '../../helpers/electron-fixtures';
import { assertDataPersisted, assertDatabaseCount } from '../../helpers/assertions';
import { getDatabaseContents } from '../../helpers/test-db';

test.describe('Collection IPC Handlers', () => {
  test('collection:list - should return empty list initially', async ({ electronPage, testDbPath }) => {
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.list();
    });
    
    expect(result).toEqual([]);
  });

  test('collection:save - should create new collection', async ({ electronPage, testDbPath }) => {
    const collectionData = {
      name: 'Test Collection',
      description: 'Test Description',
      documentation: '',
      environments: [],
      activeEnvironmentId: null,
      isFavorite: false,
    };
    
    const result = await electronPage.evaluate(async (collection) => {
      return await window.electronAPI.collection.save(collection);
    }, collectionData);
    
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    
    // Verify persistence
    assertDataPersisted({ id: result.id, ...collectionData }, testDbPath, 'collections');
  });

  test('collection:save - should update existing collection', async ({ electronPage, testDbPath }) => {
    // Create collection first
    const createResult = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Test Collection',
        description: 'Original',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });
    
    // Update it
    const updateResult = await electronPage.evaluate(async (id) => {
      return await window.electronAPI.collection.save({
        id,
        name: 'Updated Collection',
        description: 'Updated',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    }, createResult.id);
    
    expect(updateResult.success).toBe(true);
    expect(updateResult.id).toBe(createResult.id);
    
    // Verify update
    const dbContents = getDatabaseContents(testDbPath);
    const collection = dbContents.collections.find((c: any) => c.id === createResult.id);
    expect(collection.name).toBe('Updated Collection');
    expect(collection.description).toBe('Updated');
  });

  test('collection:delete - should delete collection', async ({ electronPage, testDbPath }) => {
    // Create collection first
    const createResult = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Test Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });
    
    // Delete it
    const deleteResult = await electronPage.evaluate(async (id) => {
      return await window.electronAPI.collection.delete(id);
    }, createResult.id);
    
    expect(deleteResult.success).toBe(true);
    
    // Verify deletion
    assertDatabaseCount(testDbPath, 'collections', 0);
  });

  test('collection:toggleFavorite - should toggle favorite status', async ({ electronPage, testDbPath }) => {
    // Create collection
    const createResult = await electronPage.evaluate(async () => {
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
    const toggleResult = await electronPage.evaluate(async (id) => {
      return await window.electronAPI.collection.toggleFavorite(id);
    }, createResult.id);
    
    expect(toggleResult.success).toBe(true);
    
    // Verify favorite status
    const dbContents = getDatabaseContents(testDbPath);
    const collection = dbContents.collections.find((c: any) => c.id === createResult.id);
    expect(collection.isFavorite).toBe(1);
    
    // Toggle again
    await electronPage.evaluate(async (id) => {
      return await window.electronAPI.collection.toggleFavorite(id);
    }, createResult.id);
    
    // Verify it's not favorite anymore
    const dbContents2 = getDatabaseContents(testDbPath);
    const collection2 = dbContents2.collections.find((c: any) => c.id === createResult.id);
    expect(collection2.isFavorite).toBe(0);
  });

  test('collection:addEnvironment - should add environment to collection', async ({ electronPage, testDbPath }) => {
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
    
    // Add environment
    const result = await electronPage.evaluate(async (collectionId) => {
      return await window.electronAPI.collection.addEnvironment(collectionId, {
        name: 'Collection Env',
        variables: { api_key: 'test-key' },
      });
    }, collection.id);
    
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.collection).toBeDefined();
    expect(result.collection.environments.length).toBe(1);
  });

  test('collection:setActiveEnvironment - should set active environment', async ({ electronPage, testDbPath }) => {
    // Create collection with environment
    const collection = await electronPage.evaluate(async () => {
      const coll = await window.electronAPI.collection.save({
        name: 'Test Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
      
      const envResult = await window.electronAPI.collection.addEnvironment(coll.id, {
        name: 'Env 1',
        variables: {},
      });
      
      return { collection: coll, envId: envResult.id };
    });
    
    // Set active environment
    const result = await electronPage.evaluate(async ({ collectionId, envId }) => {
      return await window.electronAPI.collection.setActiveEnvironment(collectionId, envId);
    }, { collectionId: collection.collection.id, envId: collection.envId });
    
    expect(result.success).toBe(true);
    expect(result.collection.activeEnvironmentId).toBe(collection.envId);
  });

  test('collection:updateEnvironment - should update collection environment', async ({ electronPage, testDbPath }) => {
    // Create collection with environment
    const setup = await electronPage.evaluate(async () => {
      const coll = await window.electronAPI.collection.save({
        name: 'Test Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
      
      const envResult = await window.electronAPI.collection.addEnvironment(coll.id, {
        name: 'Original Env',
        variables: { api_key: 'original-key' },
      });
      
      return { collectionId: coll.id, envId: envResult.id };
    });
    
    // Update environment
    const result = await electronPage.evaluate(async ({ collectionId, envId }) => {
      return await window.electronAPI.collection.updateEnvironment(collectionId, envId, {
        name: 'Updated Env',
        variables: { api_key: 'updated-key', new_var: 'new-value' },
      });
    }, setup);
    
    expect(result.success).toBe(true);
    expect(result.collection).toBeDefined();
    
    // Verify update
    const dbContents = getDatabaseContents(testDbPath);
    const collection = dbContents.collections.find((c: any) => c.id === setup.collectionId);
    const env = collection.environments.find((e: any) => e.id === setup.envId);
    expect(env.name).toBe('Updated Env');
    expect(env.variables.api_key).toBe('updated-key');
    expect(env.variables.new_var).toBe('new-value');
  });

  test('collection:deleteEnvironment - should delete collection environment', async ({ electronPage, testDbPath }) => {
    // Create collection with multiple environments
    const setup = await electronPage.evaluate(async () => {
      const coll = await window.electronAPI.collection.save({
        name: 'Test Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
      
      const env1 = await window.electronAPI.collection.addEnvironment(coll.id, {
        name: 'Env 1',
        variables: {},
      });
      
      const env2 = await window.electronAPI.collection.addEnvironment(coll.id, {
        name: 'Env 2',
        variables: {},
      });
      
      // Set env1 as active
      await window.electronAPI.collection.setActiveEnvironment(coll.id, env1.id);
      
      return { collectionId: coll.id, env1Id: env1.id, env2Id: env2.id };
    });
    
    // Delete env1 (active environment)
    const result = await electronPage.evaluate(async ({ collectionId, envId }) => {
      return await window.electronAPI.collection.deleteEnvironment(collectionId, envId);
    }, { collectionId: setup.collectionId, envId: setup.env1Id });
    
    expect(result.success).toBe(true);
    expect(result.collection).toBeDefined();
    expect(result.collection.environments.length).toBe(1);
    
    // Verify env1 is deleted and env2 is now active (fallback)
    const dbContents = getDatabaseContents(testDbPath);
    const collection = dbContents.collections.find((c: any) => c.id === setup.collectionId);
    expect(collection.environments.length).toBe(1);
    expect(collection.environments[0].id).toBe(setup.env2Id);
    expect(collection.activeEnvironmentId).toBe(setup.env2Id);
  });

  test('collection:deleteEnvironment - should handle deleting last environment', async ({ electronPage, testDbPath }) => {
    // Create collection with single environment
    const setup = await electronPage.evaluate(async () => {
      const coll = await window.electronAPI.collection.save({
        name: 'Test Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
      
      const env = await window.electronAPI.collection.addEnvironment(coll.id, {
        name: 'Only Env',
        variables: {},
      });
      
      return { collectionId: coll.id, envId: env.id };
    });
    
    // Delete the only environment
    const result = await electronPage.evaluate(async ({ collectionId, envId }) => {
      return await window.electronAPI.collection.deleteEnvironment(collectionId, envId);
    }, setup);
    
    expect(result.success).toBe(true);
    expect(result.collection.environments.length).toBe(0);
    expect(result.collection.activeEnvironmentId).toBeUndefined();
  });

  test('collection:run - should run all requests in collection', async ({ electronPage, testDbPath }) => {
    // Create environment
    const env = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.save({
        name: 'test-env',
        displayName: 'Test',
        variables: { base_url: 'https://jsonplaceholder.typicode.com' },
        isDefault: true,
      });
    });
    
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
    
    // Create request
    await electronPage.evaluate(async (collectionId) => {
      await window.electronAPI.request.save({
        name: 'Test Request',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
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
    
    // Run collection
    const result = await electronPage.evaluate(async (collectionId) => {
      return await window.electronAPI.collection.run(collectionId);
    }, collection.id);
    
    expect(result.success).toBe(true);
    expect(result.results).toBeDefined();
    expect(result.results.length).toBeGreaterThan(0);
  });
});

