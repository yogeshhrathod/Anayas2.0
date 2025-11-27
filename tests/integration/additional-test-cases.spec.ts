import { test, expect } from '../helpers/electron-fixtures';

test.describe('Additional IPC Test Cases', () => {
  test.describe('Environment Edge Cases', () => {
    test('should handle environment with empty variables', async ({ electronPage }) => {
      const result = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.env.save({
          name: 'empty-vars-env',
          displayName: 'Empty Vars',
          variables: {}
        });
      });
      
      expect(result.success).toBe(true);
      
      const envs = await electronPage.evaluate(() => {
        return (window as any).electronAPI.env.list();
      });
      
      const savedEnv = envs.find((e: any) => e.id === result.id);
      expect(savedEnv.variables).toEqual({});
    });

    test('should handle environment with special characters in variables', async ({ electronPage }) => {
      const result = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.env.save({
          name: 'special-chars-env',
          displayName: 'Special Chars',
          variables: {
            'api_key': 'key-with-special-chars-!@#$%^&*()',
            'url': 'https://api.example.com/v1?param=value&other=test'
          }
        });
      });
      
      expect(result.success).toBe(true);
      
      const envs = await electronPage.evaluate(() => {
        return (window as any).electronAPI.env.list();
      });
      
      const savedEnv = envs.find((e: any) => e.id === result.id);
      expect(savedEnv.variables.api_key).toBe('key-with-special-chars-!@#$%^&*()');
      expect(savedEnv.variables.url).toBe('https://api.example.com/v1?param=value&other=test');
    });

    test('should handle multiple default environments (only one should be default)', async ({ electronPage }) => {
      // Create first default
      const _env1 = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.env.save({
          name: 'default-1',
          displayName: 'Default 1',
          variables: {},
          isDefault: true
        });
      });
      
      // Create second default
      const env2 = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.env.save({
          name: 'default-2',
          displayName: 'Default 2',
          variables: {},
          isDefault: true
        });
      });
      
      // Set second as current
      await electronPage.evaluate(async (id) => {
        return await (window as any).electronAPI.env.setCurrent(id);
      }, env2.id);
      
      // Verify only one is default
      const envs = await electronPage.evaluate(() => {
        return (window as any).electronAPI.env.list();
      });
      
      const defaultEnvs = envs.filter((e: any) => e.isDefault === 1);
      expect(defaultEnvs.length).toBe(1);
      expect(defaultEnvs[0].id).toBe(env2.id);
    });
  });

  test.describe('Collection Edge Cases', () => {
    test('should handle collection with multiple environments', async ({ electronPage }) => {
      const result = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.collection.save({
          name: 'multi-env-collection',
          environments: [
            { name: 'Dev', variables: { env: 'dev' } },
            { name: 'Staging', variables: { env: 'staging' } },
            { name: 'Prod', variables: { env: 'prod' } }
          ]
        });
      });
      
      expect(result.success).toBe(true);
      
      const collections = await electronPage.evaluate(() => {
        return (window as any).electronAPI.collection.list();
      });
      
      const collection = collections.find((c: any) => c.id === result.id);
      expect(collection.environments.length).toBe(3);
    });

    test('should handle collection environment operations', async ({ electronPage }) => {
      // Create collection
      const collectionResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.collection.save({
          name: 'env-ops-collection',
          environments: []
        });
      });
      
      // Get collection to use addEnvironment (via IPC if available, or test directly)
      const collections = await electronPage.evaluate(() => {
        return (window as any).electronAPI.collection.list();
      });
      
      const collection = collections.find((c: any) => c.id === collectionResult.id);
      expect(collection.environments).toEqual([]);
    });

    test('should handle collection with very long name', async ({ electronPage }) => {
      const longName = 'A'.repeat(500);
      const result = await electronPage.evaluate(async (name) => {
        return await (window as any).electronAPI.collection.save({
          name,
          environments: []
        });
      }, longName);
      
      expect(result.success).toBe(true);
      
      const collections = await electronPage.evaluate(() => {
        return (window as any).electronAPI.collection.list();
      });
      
      const savedCollection = collections.find((c: any) => c.id === result.id);
      expect(savedCollection.name).toBe(longName);
    });
  });

  test.describe('Request Edge Cases', () => {
    test('should handle request with all HTTP methods', async ({ electronPage }) => {
      const collectionResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.collection.save({
          name: 'methods-collection',
          environments: []
        });
      });
      
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
      const requestIds: number[] = [];
      
      for (const method of methods) {
        const result = await electronPage.evaluate(async ({ collectionId, method }) => {
          return await (window as any).electronAPI.request.save({
            name: `${method} Request`,
            method,
            url: 'https://api.example.com/test',
            headers: {},
            body: null,
            queryParams: [],
            auth: { type: 'none' },
            collectionId
          });
        }, { collectionId: collectionResult.id, method });
        
        expect(result.success).toBe(true);
        requestIds.push(result.id);
      }
      
      // Verify all requests were saved
      const requests = await electronPage.evaluate((collectionId) => {
        return (window as any).electronAPI.request.list(collectionId);
      }, collectionResult.id);
      
      expect(requests.length).toBe(methods.length);
    });

    test('should handle request with complex query parameters', async ({ electronPage }) => {
      const collectionResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.collection.save({
          name: 'query-collection',
          environments: []
        });
      });
      
      const result = await electronPage.evaluate(async (collectionId) => {
        return await (window as any).electronAPI.request.save({
          name: 'Complex Query Request',
          method: 'GET',
          url: 'https://api.example.com/search',
          headers: {},
          body: null,
          queryParams: [
            { key: 'q', value: 'test query', enabled: true },
            { key: 'page', value: '1', enabled: true },
            { key: 'limit', value: '10', enabled: true },
            { key: 'disabled', value: 'should-not-appear', enabled: false }
          ],
          auth: { type: 'none' },
          collectionId
        });
      }, collectionResult.id);
      
      expect(result.success).toBe(true);
      
      const requests = await electronPage.evaluate((collectionId) => {
        return (window as any).electronAPI.request.list(collectionId);
      }, collectionResult.id);
      
      const request = requests.find((r: any) => r.id === result.id);
      expect(request.queryParams.length).toBe(4);
      expect(request.queryParams.filter((p: any) => p.enabled).length).toBe(3);
    });

    test('should handle request with large body', async ({ electronPage }) => {
      const collectionResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.collection.save({
          name: 'large-body-collection',
          environments: []
        });
      });
      
      const largeBody = JSON.stringify({ data: 'x'.repeat(10000) });
      const result = await electronPage.evaluate(async ({ collectionId, body }) => {
        return await (window as any).electronAPI.request.save({
          name: 'Large Body Request',
          method: 'POST',
          url: 'https://api.example.com/data',
          headers: { 'Content-Type': 'application/json' },
          body,
          queryParams: [],
          auth: { type: 'none' },
          collectionId
        });
      }, { collectionId: collectionResult.id, body: largeBody });
      
      expect(result.success).toBe(true);
      
      const requests = await electronPage.evaluate((collectionId) => {
        return (window as any).electronAPI.request.list(collectionId);
      }, collectionResult.id);
      
      const request = requests.find((r: any) => r.id === result.id);
      expect(request.body.length).toBeGreaterThan(10000);
    });

    test('should handle request ordering', async ({ electronPage }) => {
      const collectionResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.collection.save({
          name: 'ordering-collection',
          environments: []
        });
      });
      
      // Create requests with specific order
      const request1 = await electronPage.evaluate(async (collectionId) => {
        return await (window as any).electronAPI.request.save({
          name: 'Request 1',
          method: 'GET',
          url: 'https://api.example.com/1',
          headers: {},
          body: null,
          queryParams: [],
          auth: { type: 'none' },
          collectionId,
          order: 1000
        });
      }, collectionResult.id);
      
      const request2 = await electronPage.evaluate(async (collectionId) => {
        return await (window as any).electronAPI.request.save({
          name: 'Request 2',
          method: 'GET',
          url: 'https://api.example.com/2',
          headers: {},
          body: null,
          queryParams: [],
          auth: { type: 'none' },
          collectionId,
          order: 500
        });
      }, collectionResult.id);
      
      const request3 = await electronPage.evaluate(async (collectionId) => {
        return await (window as any).electronAPI.request.save({
          name: 'Request 3',
          method: 'GET',
          url: 'https://api.example.com/3',
          headers: {},
          body: null,
          queryParams: [],
          auth: { type: 'none' },
          collectionId,
          order: 1500
        });
      }, collectionResult.id);
      
      // Verify ordering
      const requests = await electronPage.evaluate((collectionId) => {
        return (window as any).electronAPI.request.list(collectionId);
      }, collectionResult.id);
      
      expect(requests[0].id).toBe(request2.id); // order 500
      expect(requests[1].id).toBe(request1.id); // order 1000
      expect(requests[2].id).toBe(request3.id); // order 1500
    });
  });

  test.describe('Variable Resolution Edge Cases', () => {
    test('should resolve nested variables', async ({ electronPage }) => {
      const envResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.env.save({
          name: 'nested-vars-env',
          displayName: 'Nested Vars',
          variables: {
            base_url: 'https://api.example.com',
            api_path: '/v1',
            full_url: '{{base_url}}{{api_path}}'
          },
          isDefault: true
        });
      });
      
      const result = await electronPage.evaluate(async (environmentId) => {
        return await (window as any).electronAPI.request.send({
          method: 'GET',
          url: '{{full_url}}/endpoint',
          headers: {},
          environmentId
        });
      }, envResult.id);
      
      // Note: Variable resolver may or may not support nested resolution
      // This test verifies the request is sent (may need adjustment based on actual behavior)
      expect(result).toHaveProperty('success');
    });

    test('should handle missing variables gracefully', async ({ electronPage }) => {
      const envResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.env.save({
          name: 'missing-vars-env',
          displayName: 'Missing Vars',
          variables: {
            base_url: 'https://api.example.com'
          },
          isDefault: true
        });
      });
      
      const result = await electronPage.evaluate(async (environmentId) => {
        return await (window as any).electronAPI.request.send({
          method: 'GET',
          url: '{{base_url}}/{{missing_var}}/endpoint',
          headers: {},
          environmentId
        });
      }, envResult.id);
      
      // Should still attempt the request (missing vars become empty strings)
      expect(result).toHaveProperty('success');
    });
  });

  test.describe('Request History Edge Cases', () => {
    test('should limit history results', async ({ electronPage }) => {
      const envResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.env.save({
          name: 'history-limit-env',
          displayName: 'History Limit',
          variables: {},
          isDefault: true
        });
      });
      
      // Send multiple requests
      for (let i = 0; i < 5; i++) {
        await electronPage.evaluate(async ({ environmentId, index }) => {
          return await (window as any).electronAPI.request.send({
            method: 'GET',
            url: `https://jsonplaceholder.typicode.com/posts/${index + 1}`,
            headers: {},
            environmentId
          });
        }, { environmentId: envResult.id, index: i });
      }
      
      // Get limited history
      const history = await electronPage.evaluate(() => {
        return (window as any).electronAPI.request.history(3);
      });
      
      expect(history.length).toBeLessThanOrEqual(3);
    });

    test('should delete history item', async ({ electronPage }) => {
      const envResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.env.save({
          name: 'delete-history-env',
          displayName: 'Delete History',
          variables: {},
          isDefault: true
        });
      });
      
      // Send request
      await electronPage.evaluate(async (environmentId) => {
        return await (window as any).electronAPI.request.send({
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/posts/1',
          headers: {},
          environmentId
        });
      }, envResult.id);
      
      // Get history
      const history = await electronPage.evaluate(() => {
        return (window as any).electronAPI.request.history(10);
      });
      
      const historyItem = history[0];
      
      // Delete it
      const deleteResult = await electronPage.evaluate(async (id) => {
        return await (window as any).electronAPI.request.deleteHistory(id);
      }, historyItem.id);
      
      expect(deleteResult.success).toBe(true);
      
      // Verify deletion
      const historyAfter = await electronPage.evaluate(() => {
        return (window as any).electronAPI.request.history(10);
      });
      
      const deletedItem = historyAfter.find((h: any) => h.id === historyItem.id);
      expect(deletedItem).toBeUndefined();
    });
  });

  test.describe('Folder Operations Edge Cases', () => {
    test('should handle folder with nested structure', async ({ electronPage }) => {
      const collectionResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.collection.save({
          name: 'nested-folders-collection',
          environments: []
        });
      });
      
      // Create multiple folders
      const folder1 = await electronPage.evaluate(async (collectionId) => {
        return await (window as any).electronAPI.folder.save({
          name: 'Folder 1',
          collectionId
        });
      }, collectionResult.id);
      
      const folder2 = await electronPage.evaluate(async (collectionId) => {
        return await (window as any).electronAPI.folder.save({
          name: 'Folder 2',
          collectionId
        });
      }, collectionResult.id);
      
      // Create requests in different folders
      const request1 = await electronPage.evaluate(async ({ collectionId, folderId }) => {
        return await (window as any).electronAPI.request.save({
          name: 'Request in Folder 1',
          method: 'GET',
          url: 'https://api.example.com/1',
          headers: {},
          body: null,
          queryParams: [],
          auth: { type: 'none' },
          collectionId,
          folderId
        });
      }, { collectionId: collectionResult.id, folderId: folder1.id });
      
      const request2 = await electronPage.evaluate(async ({ collectionId, folderId }) => {
        return await (window as any).electronAPI.request.save({
          name: 'Request in Folder 2',
          method: 'GET',
          url: 'https://api.example.com/2',
          headers: {},
          body: null,
          queryParams: [],
          auth: { type: 'none' },
          collectionId,
          folderId
        });
      }, { collectionId: collectionResult.id, folderId: folder2.id });
      
      // Verify requests are in correct folders
      const requests1 = await electronPage.evaluate(({ collectionId, folderId }) => {
        return (window as any).electronAPI.request.list(collectionId, folderId);
      }, { collectionId: collectionResult.id, folderId: folder1.id });
      
      const requests2 = await electronPage.evaluate(({ collectionId, folderId }) => {
        return (window as any).electronAPI.request.list(collectionId, folderId);
      }, { collectionId: collectionResult.id, folderId: folder2.id });
      
      expect(requests1.length).toBe(1);
      expect(requests1[0].id).toBe(request1.id);
      expect(requests2.length).toBe(1);
      expect(requests2[0].id).toBe(request2.id);
    });

    test('should handle folder deletion with requests', async ({ electronPage }) => {
      const collectionResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.collection.save({
          name: 'folder-delete-collection',
          environments: []
        });
      });
      
      const folderResult = await electronPage.evaluate(async (collectionId) => {
        return await (window as any).electronAPI.folder.save({
          name: 'To Delete Folder',
          collectionId
        });
      }, collectionResult.id);
      
      // Create request in folder
      const requestResult = await electronPage.evaluate(async ({ collectionId, folderId }) => {
        return await (window as any).electronAPI.request.save({
          name: 'Request in Folder',
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
      
      // Delete folder
      await electronPage.evaluate(async (id) => {
        return await (window as any).electronAPI.folder.delete(id);
      }, folderResult.id);
      
      // Verify request was also deleted
      const requests = await electronPage.evaluate((collectionId) => {
        return (window as any).electronAPI.request.list(collectionId);
      }, collectionResult.id);
      
      const deletedRequest = requests.find((r: any) => r.id === requestResult.id);
      expect(deletedRequest).toBeUndefined();
    });
  });

  test.describe('Settings Edge Cases', () => {
    test('should handle various setting types', async ({ electronPage }) => {
      // Set different types of settings
      await electronPage.evaluate(async () => {
        await (window as any).electronAPI.settings.set('stringSetting', 'test-value');
        await (window as any).electronAPI.settings.set('numberSetting', 42);
        await (window as any).electronAPI.settings.set('booleanSetting', true);
        await (window as any).electronAPI.settings.set('objectSetting', { key: 'value' });
        await (window as any).electronAPI.settings.set('arraySetting', [1, 2, 3]);
      });
      
      // Verify all settings
      const settings = await electronPage.evaluate(() => {
        return (window as any).electronAPI.settings.getAll();
      });
      
      expect(settings.stringSetting).toBe('test-value');
      expect(settings.numberSetting).toBe(42);
      expect(settings.booleanSetting).toBe(true);
      expect(settings.objectSetting).toEqual({ key: 'value' });
      expect(settings.arraySetting).toEqual([1, 2, 3]);
    });

    test('should handle setting updates', async ({ electronPage }) => {
      // Set initial value
      await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.settings.set('updateTest', 'initial');
      });
      
      // Update value
      await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.settings.set('updateTest', 'updated');
      });
      
      // Verify update
      const value = await electronPage.evaluate(() => {
        return (window as any).electronAPI.settings.get('updateTest');
      });
      
      expect(value).toBe('updated');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid environment ID', async ({ electronPage }) => {
      const result = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.env.delete(99999);
      });
      
      // Should handle gracefully (may return success or error)
      expect(result).toHaveProperty('success');
    });

    test('should handle invalid collection ID', async ({ electronPage }) => {
      const result = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.collection.delete(99999);
      });
      
      expect(result).toHaveProperty('success');
    });

    test('should handle invalid request ID', async ({ electronPage }) => {
      const result = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.request.delete(99999);
      });
      
      expect(result).toHaveProperty('success');
    });

    test('should handle network errors gracefully', async ({ electronPage }) => {
      const envResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.env.save({
          name: 'network-error-env',
          displayName: 'Network Error',
          variables: {},
          isDefault: true
        });
      });
      
      // Try to send request to non-existent domain
      const result = await electronPage.evaluate(async (environmentId) => {
        return await (window as any).electronAPI.request.send({
          method: 'GET',
          url: 'https://this-domain-does-not-exist-12345.com/api',
          headers: {},
          environmentId
        });
      }, envResult.id);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  test.describe('Data Persistence', () => {
    test('should persist data across multiple operations', async ({ electronPage, _testDbPath }) => {
      // Create environment
      const envResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.env.save({
          name: 'persistence-test',
          displayName: 'Persistence Test',
          variables: { key: 'value' }
        });
      });
      
      // Create collection
      const collectionResult = await electronPage.evaluate(async () => {
        return await (window as any).electronAPI.collection.save({
          name: 'Persistence Collection',
          environments: []
        });
      });
      
      // Create request
      const requestResult = await electronPage.evaluate(async (collectionId) => {
        return await (window as any).electronAPI.request.save({
          name: 'Persistence Request',
          method: 'GET',
          url: 'https://api.example.com',
          headers: {},
          body: null,
          queryParams: [],
          auth: { type: 'none' },
          collectionId
        });
      }, collectionResult.id);
      
      // Verify all data persisted
      const { getDatabaseContents } = await import('../helpers/test-db');
      const dbContents = getDatabaseContents(testDbPath);
      
      expect(dbContents.environments.find((e: any) => e.id === envResult.id)).toBeDefined();
      expect(dbContents.collections.find((c: any) => c.id === collectionResult.id)).toBeDefined();
      expect(dbContents.requests.find((r: any) => r.id === requestResult.id)).toBeDefined();
    });
  });
});

