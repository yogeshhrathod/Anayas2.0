import { test, expect } from '../helpers/electron-fixtures';

test.describe('IPC Communication Tests', () => {
  test('should access electronAPI in renderer', async ({ electronPage }) => {
    const hasAPI = await electronPage.evaluate(() => {
      return typeof (window as any).electronAPI !== 'undefined';
    });
    
    expect(hasAPI).toBe(true);
  });

  test.describe('Environment IPC Handlers', () => {
    test('should list environments', async ({ electronPage }) => {
      const envs = await electronPage.evaluate(() => {
        return (window as any).electronAPI.env.list();
      });
      
      expect(Array.isArray(envs)).toBe(true);
    });

    test('should save environment', async ({ electronPage }) => {
      const result = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.env.save({
          name: 'test-env',
          displayName: 'Test Environment',
          variables: {
            base_url: 'https://test.com',
            api_key: 'test-key-123'
          }
        });
      });
      
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      
      // Verify persistence
      const envs = await electronPage.evaluate(() => {
        return (window as any).electronAPI.env.list();
      });
      
      const savedEnv = envs.find((e: any) => e.name === 'test-env');
      expect(savedEnv).toBeDefined();
      expect(savedEnv?.variables.base_url).toBe('https://test.com');
    });

    test('should update environment', async ({ electronPage }) => {
      // First create an environment
      const createResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.env.save({
          name: 'update-test',
          displayName: 'Update Test',
          variables: { key: 'value1' }
        });
      });
      
      // Then update it
      const updateResult = await electronPage.evaluate(async (id) => {
        return await (window as any).electronAPI.env.save({
          id,
          name: 'update-test',
          displayName: 'Updated Display Name',
          variables: { key: 'value2' }
        });
      }, createResult.id);
      
      expect(updateResult.success).toBe(true);
      
      // Verify update
      const envs = await electronPage.evaluate(() => {
        return (window as any).electronAPI.env.list();
      });
      
      const updatedEnv = envs.find((e: any) => e.id === createResult.id);
      expect(updatedEnv?.displayName).toBe('Updated Display Name');
      expect(updatedEnv?.variables.key).toBe('value2');
    });

    test('should delete environment', async ({ electronPage }) => {
      // Create environment
      const createResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.env.save({
          name: 'delete-test',
          displayName: 'Delete Test',
          variables: {}
        });
      });
      
      // Delete it
      const deleteResult = await electronPage.evaluate(async (id) => {
        return await (window as any).electronAPI.env.delete(id);
      }, createResult.id);
      
      expect(deleteResult.success).toBe(true);
      
      // Verify deletion
      const envs = await electronPage.evaluate(() => {
        return (window as any).electronAPI.env.list();
      });
      
      const deletedEnv = envs.find((e: any) => e.id === createResult.id);
      expect(deletedEnv).toBeUndefined();
    });

    test('should get and set current environment', async ({ electronPage }) => {
      // Create environment
      const createResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.env.save({
          name: 'current-test',
          displayName: 'Current Test',
          variables: {},
          isDefault: false
        });
      });
      
      // Set as current
      const setResult = await electronPage.evaluate(async (id) => {
        return await (window as any).electronAPI.env.setCurrent(id);
      }, createResult.id);
      
      expect(setResult.success).toBe(true);
      
      // Get current
      const current = await electronPage.evaluate(() => {
        return (window as any).electronAPI.env.getCurrent();
      });
      
      expect(current?.id).toBe(createResult.id);
    });
  });

  test.describe('Collection IPC Handlers', () => {
    test('should list collections', async ({ electronPage }) => {
      const collections = await electronPage.evaluate(() => {
        return (window as any).electronAPI.collection.list();
      });
      
      expect(Array.isArray(collections)).toBe(true);
    });

    test('should save collection', async ({ electronPage }) => {
      const result = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.collection.save({
          name: 'test-collection',
          description: 'Test Collection',
          environments: [],
          isFavorite: false
        });
      });
      
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      
      // Verify persistence
      const collections = await electronPage.evaluate(() => {
        return (window as any).electronAPI.collection.list();
      });
      
      const savedCollection = collections.find((c: any) => c.name === 'test-collection');
      expect(savedCollection).toBeDefined();
    });

    test('should delete collection', async ({ electronPage }) => {
      // Create collection
      const createResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.collection.save({
          name: 'delete-collection',
          description: 'Delete Test',
          environments: []
        });
      });
      
      // Delete it
      const deleteResult = await electronPage.evaluate(async (id) => {
        return await (window as any).electronAPI.collection.delete(id);
      }, createResult.id);
      
      expect(deleteResult.success).toBe(true);
      
      // Verify deletion
      const collections = await electronPage.evaluate(() => {
        return (window as any).electronAPI.collection.list();
      });
      
      const deletedCollection = collections.find((c: any) => c.id === createResult.id);
      expect(deletedCollection).toBeUndefined();
    });

    test('should toggle collection favorite', async ({ electronPage }) => {
      // Create collection
      const createResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.collection.save({
          name: 'favorite-test',
          description: 'Favorite Test',
          environments: [],
          isFavorite: false
        });
      });
      
      // Toggle favorite
      const toggleResult = await electronPage.evaluate(async (id) => {
        return await (window as any).electronAPI.collection.toggleFavorite(id);
      }, createResult.id);
      
      expect(toggleResult.success).toBe(true);
      
      // Verify toggle
      const collections = await electronPage.evaluate(() => {
        return (window as any).electronAPI.collection.list();
      });
      
      const collection = collections.find((c: any) => c.id === createResult.id);
      expect(collection?.isFavorite).toBe(1);
    });
  });

  test.describe('Request IPC Handlers', () => {
    let collectionId: number;

    test.beforeEach(async ({ electronPage }) => {
      // Create a collection for requests
      const result = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.collection.save({
          name: 'request-test-collection',
          description: 'For request tests',
          environments: []
        });
      });
      collectionId = result.id;
    });

    test('should list requests', async ({ electronPage }) => {
      const requests = await electronPage.evaluate((collectionId) => {
        return (window as any).electronAPI.request.list(collectionId);
      }, collectionId);
      
      expect(Array.isArray(requests)).toBe(true);
    });

    test('should save request', async ({ electronPage }) => {
      const result = await electronPage.evaluate(async (collectionId) => {
        return await (window as any).electronAPI.request.save({
          name: 'test-request',
          method: 'GET',
          url: 'https://api.example.com/test',
          headers: { 'Content-Type': 'application/json' },
          body: null,
          queryParams: [],
          auth: { type: 'none' },
          collectionId
        });
      }, collectionId);
      
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      
      // Verify persistence
      const requests = await electronPage.evaluate((collectionId) => {
        return (window as any).electronAPI.request.list(collectionId);
      }, collectionId);
      
      const savedRequest = requests.find((r: any) => r.name === 'test-request');
      expect(savedRequest).toBeDefined();
      expect(savedRequest?.method).toBe('GET');
    });

    test('should delete request', async ({ electronPage }) => {
      // Create request
      const createResult = await electronPage.evaluate(async (collectionId) => {
        return await (window as any).electronAPI.request.save({
          name: 'delete-request',
          method: 'GET',
          url: 'https://api.example.com/delete',
          headers: {},
          body: null,
          queryParams: [],
          auth: { type: 'none' },
          collectionId
        });
      }, collectionId);
      
      // Delete it
      const deleteResult = await electronPage.evaluate(async (id) => {
        return await (window as any).electronAPI.request.delete(id);
      }, createResult.id);
      
      expect(deleteResult.success).toBe(true);
      
      // Verify deletion
      const requests = await electronPage.evaluate((collectionId) => {
        return (window as any).electronAPI.request.list(collectionId);
      }, collectionId);
      
      const deletedRequest = requests.find((r: any) => r.id === createResult.id);
      expect(deletedRequest).toBeUndefined();
    });
  });

  test.describe('Folder IPC Handlers', () => {
    let collectionId: number;

    test.beforeEach(async ({ electronPage }) => {
      // Create a collection for folders
      const result = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.collection.save({
          name: 'folder-test-collection',
          description: 'For folder tests',
          environments: []
        });
      });
      collectionId = result.id;
    });

    test('should list folders', async ({ electronPage }) => {
      const folders = await electronPage.evaluate((collectionId) => {
        return (window as any).electronAPI.folder.list(collectionId);
      }, collectionId);
      
      expect(Array.isArray(folders)).toBe(true);
    });

    test('should save folder', async ({ electronPage }) => {
      const result = await electronPage.evaluate(async (collectionId) => {
        return await (window as any).electronAPI.folder.save({
          name: 'test-folder',
          description: 'Test Folder',
          collectionId
        });
      }, collectionId);
      
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      
      // Verify persistence
      const folders = await electronPage.evaluate((collectionId) => {
        return (window as any).electronAPI.folder.list(collectionId);
      }, collectionId);
      
      const savedFolder = folders.find((f: any) => f.name === 'test-folder');
      expect(savedFolder).toBeDefined();
    });

    test('should delete folder', async ({ electronPage }) => {
      // Create folder
      const createResult = await electronPage.evaluate(async (collectionId) => {
        return await (window as any).electronAPI.folder.save({
          name: 'delete-folder',
          description: 'Delete Test',
          collectionId
        });
      }, collectionId);
      
      // Delete it
      const deleteResult = await electronPage.evaluate(async (id) => {
        return await (window as any).electronAPI.folder.delete(id);
      }, createResult.id);
      
      expect(deleteResult.success).toBe(true);
      
      // Verify deletion
      const folders = await electronPage.evaluate((collectionId) => {
        return (window as any).electronAPI.folder.list(collectionId);
      }, collectionId);
      
      const deletedFolder = folders.find((f: any) => f.id === createResult.id);
      expect(deletedFolder).toBeUndefined();
    });
  });

  test.describe('Settings IPC Handlers', () => {
    test('should get and set settings', async ({ electronPage }) => {
      // Set a setting
      const setResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.settings.set('testKey', 'testValue');
      });
      
      expect(setResult.success).toBe(true);
      
      // Get the setting
      const value = await electronPage.evaluate(() => {
        return (window as any).electronAPI.settings.get('testKey');
      });
      
      expect(value).toBe('testValue');
    });

    test('should get all settings', async ({ electronPage }) => {
      const settings = await electronPage.evaluate(() => {
        return (window as any).electronAPI.settings.getAll();
      });
      
      expect(typeof settings).toBe('object');
      expect(settings).toHaveProperty('theme');
    });
  });
});

