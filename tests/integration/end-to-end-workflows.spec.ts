import { test, expect } from '../helpers/electron-fixtures';

test.describe('End-to-End Workflow Tests', () => {
  test('should complete full workflow: Create Environment → Collection → Request → Send → Save', async ({
    electronPage,
  }) => {
    // Step 1: Create environment
    const envResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.env.save({
        name: 'e2e-env',
        displayName: 'E2E Environment',
        variables: {
          base_url: 'https://jsonplaceholder.typicode.com',
          api_key: 'test-key',
        },
        isDefault: true,
      });
    });

    expect(envResult.success).toBe(true);

    // Step 2: Create collection
    const collectionResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.collection.save({
        name: 'E2E Collection',
        description: 'End-to-end test collection',
        environments: [],
      });
    });

    expect(collectionResult.success).toBe(true);

    // Step 3: Create request
    const requestResult = await electronPage.evaluate(async collectionId => {
      return await (window as any).electronAPI.request.save({
        name: 'E2E Request',
        method: 'GET',
        url: '{{base_url}}/posts/1',
        headers: {
          'Content-Type': 'application/json',
        },
        body: null,
        queryParams: [],
        auth: { type: 'none' },
        collectionId,
      });
    }, collectionResult.id);

    expect(requestResult.success).toBe(true);

    // Step 4: Send request
    const sendResult = await electronPage.evaluate(async environmentId => {
      return await (window as any).electronAPI.request.send({
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: {
          'Content-Type': 'application/json',
        },
        environmentId,
      });
    }, envResult.id);

    expect(sendResult.success).toBe(true);
    expect(sendResult.status).toBe(200);

    // Step 5: Verify request history
    const history = await electronPage.evaluate(() => {
      return (window as any).electronAPI.request.history(10);
    });

    expect(history.length).toBeGreaterThan(0);
    expect(history[0].method).toBe('GET');
    expect(history[0].status).toBe(200);
  });

  test('should complete workflow with folder organization', async ({
    electronPage,
  }) => {
    // Create environment
    const envResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.env.save({
        name: 'folder-e2e-env',
        displayName: 'Folder E2E Env',
        variables: {},
        isDefault: true,
      });
    });

    // Create collection
    const collectionResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.collection.save({
        name: 'Folder E2E Collection',
        environments: [],
      });
    });

    // Create folder
    const folderResult = await electronPage.evaluate(async collectionId => {
      return await (window as any).electronAPI.folder.save({
        name: 'Test Folder',
        description: 'Folder for E2E test',
        collectionId,
      });
    }, collectionResult.id);

    expect(folderResult.success).toBe(true);

    // Create request in folder
    const requestResult = await electronPage.evaluate(
      async ({ collectionId, folderId }) => {
        return await (window as any).electronAPI.request.save({
          name: 'Folder Request',
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/posts/1',
          headers: {},
          body: null,
          queryParams: [],
          auth: { type: 'none' },
          collectionId,
          folderId,
        });
      },
      { collectionId: collectionResult.id, folderId: folderResult.id }
    );

    expect(requestResult.success).toBe(true);

    // Verify request is in folder
    const requests = await electronPage.evaluate(
      ({ collectionId, folderId }) => {
        return (window as any).electronAPI.request.list(collectionId, folderId);
      },
      { collectionId: collectionResult.id, folderId: folderResult.id }
    );

    expect(requests.length).toBe(1);
    expect(requests[0].id).toBe(requestResult.id);
  });

  test('should complete workflow with collection environments', async ({
    electronPage,
  }) => {
    // Create global environment
    const globalEnvResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.env.save({
        name: 'global-e2e-env',
        displayName: 'Global E2E Env',
        variables: {
          global_var: 'global-value',
        },
        isDefault: true,
      });
    });

    // Create collection with environment
    const collectionResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.collection.save({
        name: 'Collection Env E2E',
        environments: [
          {
            name: 'Collection Environment',
            variables: {
              collection_var: 'collection-value',
            },
          },
        ],
        activeEnvironmentId: null,
      });
    });

    // Get collection to find environment ID
    const collections = await electronPage.evaluate(() => {
      return (window as any).electronAPI.collection.list();
    });

    const collection = collections.find(
      (c: any) => c.id === collectionResult.id
    );
    const collectionEnvId = collection.environments[0].id;

    // Set active environment
    await electronPage.evaluate(
      async ({ collectionId, envId }) => {
        return await (
          window as any
        ).electronAPI.collection.setActiveEnvironment(collectionId, envId);
      },
      { collectionId: collectionResult.id, envId: collectionEnvId }
    );

    // Create request with variables
    const requestResult = await electronPage.evaluate(async collectionId => {
      return await (window as any).electronAPI.request.save({
        name: 'Variable Request',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: {},
        body: null,
        queryParams: [],
        auth: { type: 'none' },
        collectionId,
      });
    }, collectionResult.id);

    expect(requestResult.success).toBe(true);

    // Run collection to test variable resolution
    const runResult = await electronPage.evaluate(async collectionId => {
      return await (window as any).electronAPI.collection.run(collectionId);
    }, collectionResult.id);

    expect(runResult.success).toBe(true);
    expect(runResult.results.length).toBe(1);
    expect(runResult.results[0].success).toBe(true);
  });

  test('should complete workflow: Update → Delete operations', async ({
    electronPage,
  }) => {
    // Create environment
    const envResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.env.save({
        name: 'update-delete-env',
        displayName: 'Update Delete Env',
        variables: { key: 'value1' },
      });
    });

    // Update environment
    const updateResult = await electronPage.evaluate(async id => {
      return await (window as any).electronAPI.env.save({
        id,
        name: 'update-delete-env',
        displayName: 'Updated Env',
        variables: { key: 'value2' },
      });
    }, envResult.id);

    expect(updateResult.success).toBe(true);

    // Verify update
    const envs = await electronPage.evaluate(() => {
      return (window as any).electronAPI.env.list();
    });

    const updatedEnv = envs.find((e: any) => e.id === envResult.id);
    expect(updatedEnv.variables.key).toBe('value2');

    // Delete environment
    const deleteResult = await electronPage.evaluate(async id => {
      return await (window as any).electronAPI.env.delete(id);
    }, envResult.id);

    expect(deleteResult.success).toBe(true);

    // Verify deletion
    const envsAfter = await electronPage.evaluate(() => {
      return (window as any).electronAPI.env.list();
    });

    const deletedEnv = envsAfter.find((e: any) => e.id === envResult.id);
    expect(deletedEnv).toBeUndefined();
  });

  test('should complete workflow with favorite operations', async ({
    electronPage,
  }) => {
    // Create collection
    const collectionResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.collection.save({
        name: 'Favorite Collection',
        environments: [],
        isFavorite: false,
      });
    });

    // Toggle favorite
    const toggleResult = await electronPage.evaluate(async id => {
      return await (window as any).electronAPI.collection.toggleFavorite(id);
    }, collectionResult.id);

    expect(toggleResult.success).toBe(true);

    // Verify favorite status
    const collections = await electronPage.evaluate(() => {
      return (window as any).electronAPI.collection.list();
    });

    const collection = collections.find(
      (c: any) => c.id === collectionResult.id
    );
    expect(collection.isFavorite).toBe(1);
  });

  test('should complete workflow: Create → Send → History → Delete History', async ({
    electronPage,
  }) => {
    // Create environment
    const envResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.env.save({
        name: 'history-workflow-env',
        displayName: 'History Workflow Env',
        variables: {},
        isDefault: true,
      });
    });

    // Send request
    await electronPage.evaluate(async environmentId => {
      return await (window as any).electronAPI.request.send({
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: {},
        environmentId,
      });
    }, envResult.id);

    // Get history
    const history = await electronPage.evaluate(() => {
      return (window as any).electronAPI.request.history(10);
    });

    expect(history.length).toBeGreaterThan(0);
    const historyItem = history[0];

    // Delete history item
    const deleteResult = await electronPage.evaluate(async id => {
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
