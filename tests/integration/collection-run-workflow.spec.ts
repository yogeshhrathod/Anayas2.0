import { test, expect } from '../helpers/electron-fixtures';

test.describe('Collection Run Workflow Tests', () => {
  test('should run collection with multiple requests', async ({ electronPage }) => {
    // Create environment
    const envResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.env.save({
        name: 'collection-run-env',
        displayName: 'Collection Run Env',
        variables: {},
        isDefault: true
      });
    });
    
    // Create collection
    const collectionResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.collection.save({
        name: 'run-test-collection',
        environments: []
      });
    });
    
    // Add multiple requests to collection
    const request1Result = await electronPage.evaluate(async (collectionId) => {
      return await (window as any).electronAPI.request.save({
        name: 'Request 1',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: {},
        body: null,
        queryParams: [],
        auth: { type: 'none' },
        collectionId,
        order: 1000
      });
    }, collectionResult.id);
    
    const request2Result = await electronPage.evaluate(async (collectionId) => {
      return await (window as any).electronAPI.request.save({
        name: 'Request 2',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/2',
        headers: {},
        body: null,
        queryParams: [],
        auth: { type: 'none' },
        collectionId,
        order: 2000
      });
    }, collectionResult.id);
    
    // Run collection
    const runResult = await electronPage.evaluate(async (collectionId) => {
      return await (window as any).electronAPI.collection.run(collectionId);
    }, collectionResult.id);
    
    expect(runResult.success).toBe(true);
    expect(runResult.results).toBeDefined();
    expect(Array.isArray(runResult.results)).toBe(true);
    expect(runResult.results.length).toBe(2);
    
    // Verify all requests were executed
    expect(runResult.results[0].success).toBe(true);
    expect(runResult.results[0].status).toBe(200);
    expect(runResult.results[1].success).toBe(true);
    expect(runResult.results[1].status).toBe(200);
    
    // Verify summary
    expect(runResult.summary).toBeDefined();
    expect(runResult.summary.total).toBe(2);
    expect(runResult.summary.passed).toBeGreaterThanOrEqual(0);
  });

  test('should execute requests in order', async ({ electronPage }) => {
    // Create environment
    const envResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.env.save({
        name: 'order-env',
        displayName: 'Order Env',
        variables: {},
        isDefault: true
      });
    });
    
    // Create collection
    const collectionResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.collection.save({
        name: 'order-test-collection',
        environments: []
      });
    });
    
    // Add requests with specific order
    const request1Result = await electronPage.evaluate(async (collectionId) => {
      return await (window as any).electronAPI.request.save({
        name: 'First Request',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: {},
        body: null,
        queryParams: [],
        auth: { type: 'none' },
        collectionId,
        order: 1000
      });
    }, collectionResult.id);
    
    const request2Result = await electronPage.evaluate(async (collectionId) => {
      return await (window as any).electronAPI.request.save({
        name: 'Second Request',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/2',
        headers: {},
        body: null,
        queryParams: [],
        auth: { type: 'none' },
        collectionId,
        order: 2000
      });
    }, collectionResult.id);
    
    // Run collection
    const runResult = await electronPage.evaluate(async (collectionId) => {
      return await (window as any).electronAPI.collection.run(collectionId);
    }, collectionResult.id);
    
    // Verify execution order (results should match request order)
    expect(runResult.results[0].requestId).toBe(request1Result.id);
    expect(runResult.results[1].requestId).toBe(request2Result.id);
  });

  test('should handle errors in collection run', async ({ electronPage }) => {
    // Create environment
    const envResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.env.save({
        name: 'error-run-env',
        displayName: 'Error Run Env',
        variables: {},
        isDefault: true
      });
    });
    
    // Create collection
    const collectionResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.collection.save({
        name: 'error-test-collection',
        environments: []
      });
    });
    
    // Add valid request
    await electronPage.evaluate(async (collectionId) => {
      return await (window as any).electronAPI.request.save({
        name: 'Valid Request',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: {},
        body: null,
        queryParams: [],
        auth: { type: 'none' },
        collectionId,
        order: 1000
      });
    }, collectionResult.id);
    
    // Add request with invalid URL (will fail)
    await electronPage.evaluate(async (collectionId) => {
      return await (window as any).electronAPI.request.save({
        name: 'Invalid Request',
        method: 'GET',
        url: 'https://invalid-domain-that-does-not-exist-12345.com/api',
        headers: {},
        body: null,
        queryParams: [],
        auth: { type: 'none' },
        collectionId,
        order: 2000
      });
    }, collectionResult.id);
    
    // Run collection
    const runResult = await electronPage.evaluate(async (collectionId) => {
      return await (window as any).electronAPI.collection.run(collectionId);
    }, collectionResult.id);
    
    expect(runResult.success).toBe(true);
    expect(runResult.results.length).toBe(2);
    
    // First request should succeed
    expect(runResult.results[0].success).toBe(true);
    
    // Second request should fail
    expect(runResult.results[1].success).toBe(false);
    expect(runResult.results[1].error).toBeDefined();
    
    // Verify summary includes failed requests
    expect(runResult.summary.failed).toBeGreaterThan(0);
  });

  test('should resolve variables in collection run', async ({ electronPage }) => {
    // Create environment with variables
    const envResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.env.save({
        name: 'variable-run-env',
        displayName: 'Variable Run Env',
        variables: {
          base_url: 'https://jsonplaceholder.typicode.com',
          post_id: '1'
        },
        isDefault: true
      });
    });
    
    // Create collection with environment
    const collectionResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.collection.save({
        name: 'variable-collection',
        environments: [
          {
            name: 'Collection Env',
            variables: {
              collection_var: 'test-value'
            }
          }
        ],
        activeEnvironmentId: null
      });
    });
    
    // Get collection to find environment ID
    const collections = await electronPage.evaluate(() => {
      return (window as any).electronAPI.collection.list();
    });
    
    const collection = collections.find((c: any) => c.id === collectionResult.id);
    const collectionEnvId = collection.environments[0].id;
    
    // Set active environment
    await electronPage.evaluate(async ({ collectionId, envId }) => {
      return await (window as any).electronAPI.collection.setActiveEnvironment(collectionId, envId);
    }, { collectionId: collectionResult.id, envId: collectionEnvId });
    
    // Add request with variables
    await electronPage.evaluate(async (collectionId) => {
      return await (window as any).electronAPI.request.save({
        name: 'Variable Request',
        method: 'GET',
        url: '{{base_url}}/posts/{{post_id}}',
        headers: {},
        body: null,
        queryParams: [],
        auth: { type: 'none' },
        collectionId,
        order: 1000
      });
    }, collectionResult.id);
    
    // Run collection
    const runResult = await electronPage.evaluate(async (collectionId) => {
      return await (window as any).electronAPI.collection.run(collectionId);
    }, collectionResult.id);
    
    expect(runResult.success).toBe(true);
    expect(runResult.results.length).toBe(1);
    expect(runResult.results[0].success).toBe(true);
    expect(runResult.results[0].status).toBe(200);
  });

  test('should handle empty collection', async ({ electronPage }) => {
    // Create empty collection
    const collectionResult = await electronPage.evaluate(async () => {
      return await (window as any).electronAPI.collection.save({
        name: 'empty-collection',
        environments: []
      });
    });
    
    // Run collection
    const runResult = await electronPage.evaluate(async (collectionId) => {
      return await (window as any).electronAPI.collection.run(collectionId);
    }, collectionResult.id);
    
    expect(runResult.success).toBe(true);
    expect(runResult.results).toBeDefined();
    expect(runResult.results.length).toBe(0);
    expect(runResult.message).toContain('No requests found');
  });
});

