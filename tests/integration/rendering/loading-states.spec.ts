import { test, expect } from '../../helpers/electron-fixtures';

test.describe('Loading States', () => {
  test('should handle async IPC operations', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Test that async operations complete
    const startTime = Date.now();

    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Test Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    const duration = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });

  test('should handle multiple concurrent IPC operations', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create multiple collections concurrently
    const promises = Array.from({ length: 5 }, (_, i) =>
      electronPage.evaluate(async index => {
        return await window.electronAPI.collection.save({
          name: `Collection ${index}`,
          description: '',
          documentation: '',
          environments: [],
          activeEnvironmentId: null,
          isFavorite: false,
        });
      }, i)
    );

    const results = await Promise.all(promises);

    // All should succeed
    results.forEach(result => {
      expect(result.success).toBe(true);
    });

    // Verify all were created
    const collections = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.list();
    });

    expect(collections.length).toBe(5);
  });

  test('should handle request send operation', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create environment
    await electronPage.evaluate(async () => {
      await window.electronAPI.env.save({
        name: 'test-env',
        displayName: 'Test',
        variables: {},
        isDefault: true,
      });
    });

    // Send request (async operation)
    const startTime = Date.now();

    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.request.send({
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: {},
        body: null,
        queryParams: [],
      });
    });

    const duration = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(10000); // Network request should complete within 10 seconds
  });
});
