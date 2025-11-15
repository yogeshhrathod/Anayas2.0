import { test, expect } from '../../helpers/electron-fixtures';
import { logger } from '../../helpers/logger';

test.describe('Performance: Concurrent Operations', () => {
  test('should handle concurrent collection saves', async ({ electronPage, testDbPath }) => {
    const startTime = Date.now();
    logger.info('Running 100 concurrent collection saves...');

    const results = await electronPage.evaluate(async () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          window.electronAPI.collection.save({
            name: `Concurrent Collection ${i}`,
            description: '',
            documentation: '',
            environments: [],
            activeEnvironmentId: null,
            isFavorite: false,
          })
        );
      }
      return Promise.all(promises);
    });

    const duration = Date.now() - startTime;
    logger.logPerformance('100 concurrent collection saves', duration);

    expect(results.length).toBe(100);
    expect(results.every(r => r.success)).toBe(true);
    expect(duration).toBeLessThan(10000); // Should complete in <10s
  });

  test('should handle concurrent request saves', async ({ electronPage, testDbPath }) => {
    // Create collection first
    const collection = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Concurrent Test Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    const startTime = Date.now();
    logger.info('Running 100 concurrent request saves...');

    const results = await electronPage.evaluate(async (collectionId) => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          window.electronAPI.request.save({
            name: `Concurrent Request ${i}`,
            method: 'GET',
            url: `https://example.com/${i}`,
            headers: {},
            body: null,
            queryParams: [],
            auth: null,
            collectionId,
            folderId: null,
            isFavorite: false,
            order: i,
          })
        );
      }
      return Promise.all(promises);
    }, collection.id);

    const duration = Date.now() - startTime;
    logger.logPerformance('100 concurrent request saves', duration);

    expect(results.length).toBe(100);
    expect(results.every(r => r.success)).toBe(true);
    expect(duration).toBeLessThan(10000);
  });

  test('should handle concurrent environment operations', async ({ electronPage, testDbPath }) => {
    const startTime = Date.now();
    logger.info('Running 50 concurrent environment operations...');

    const results = await electronPage.evaluate(async () => {
      const createPromises = [];
      for (let i = 0; i < 50; i++) {
        createPromises.push(
          window.electronAPI.env.save({
            name: `concurrent-env-${i}`,
            displayName: `Concurrent Env ${i}`,
            variables: { key: `value_${i}` },
            isDefault: false,
          })
        );
      }
      const created = await Promise.all(createPromises);

      // Concurrent reads
      const readPromises = created.map(env => 
        window.electronAPI.env.getCurrent()
      );
      await Promise.all(readPromises);

      return created;
    });

    const duration = Date.now() - startTime;
    logger.logPerformance('50 concurrent environment operations', duration);

    expect(results.length).toBe(50);
    expect(duration).toBeLessThan(10000);
  });

  test('should handle concurrent IPC calls without race conditions', async ({ electronPage, testDbPath }) => {
    // Create collection
    const collection = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Race Test Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    // Concurrent update operations
    const results = await electronPage.evaluate(async (collectionId) => {
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          window.electronAPI.collection.save({
            id: collectionId,
            name: `Updated ${i}`,
            description: '',
            documentation: '',
            environments: [],
            activeEnvironmentId: null,
            isFavorite: false,
          })
        );
      }
      return Promise.all(promises);
    }, collection.id);

    // All should succeed (no race conditions)
    expect(results.length).toBe(20);
    expect(results.every(r => r.success)).toBe(true);

    // Verify final state is consistent
    const finalCollection = await electronPage.evaluate(async (collectionId) => {
      const collections = await window.electronAPI.collection.list();
      return collections.find((c: any) => c.id === collectionId);
    }, collection.id);

    expect(finalCollection).toBeDefined();
    expect(finalCollection.name).toBeDefined();
  });

  test('should handle mixed read/write operations concurrently', async ({ electronPage, testDbPath }) => {
    // Create initial data
    const collection = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Mixed Ops Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    const startTime = Date.now();
    logger.info('Running mixed read/write operations...');

    await electronPage.evaluate(async (collectionId) => {
      const operations = [];
      
      // Mix of reads and writes
      for (let i = 0; i < 50; i++) {
        if (i % 2 === 0) {
          // Write operation
          operations.push(
            window.electronAPI.request.save({
              name: `Request ${i}`,
              method: 'GET',
              url: `https://example.com/${i}`,
              headers: {},
              body: null,
              queryParams: [],
              auth: null,
              collectionId,
              folderId: null,
              isFavorite: false,
              order: i,
            })
          );
        } else {
          // Read operation
          operations.push(
            window.electronAPI.request.list(collectionId)
          );
        }
      }
      
      await Promise.all(operations);
    }, collection.id);

    const duration = Date.now() - startTime;
    logger.logPerformance('Mixed read/write operations', duration);

    expect(duration).toBeLessThan(15000);
  });
});

