import { test, expect } from '../../helpers/electron-fixtures';
import { logger } from '../../helpers/logger';

test.describe('Performance: Memory Leak Detection', () => {
  test('should not leak memory when creating and deleting collections', async ({
    electronPage,
    _testDbPath,
  }) => {
    const initialMemory = process.memoryUsage().heapUsed;
    logger.logMemory('Initial state');

    // Create and delete collections in a loop
    for (let i = 0; i < 10; i++) {
      const createStart = Date.now();

      const collection = await electronPage.evaluate(async index => {
        return await window.electronAPI.collection.save({
          name: `Memory Test Collection ${index}`,
          description: '',
          documentation: '',
          environments: [],
          activeEnvironmentId: null,
          isFavorite: false,
        });
      }, i);

      await electronPage.evaluate(async id => {
        return await window.electronAPI.collection.delete(id);
      }, collection.id);

      const createTime = Date.now() - createStart;
      logger.logPerformance(`Create/Delete cycle ${i}`, createTime);
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    await electronPage.waitForTimeout(1000);

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryDelta = (finalMemory - initialMemory) / 1024 / 1024; // MB
    logger.logMemory('After 10 create/delete cycles');

    // Memory increase should be minimal (<50MB)
    expect(memoryDelta).toBeLessThan(50);
  });

  test('should not leak memory with multiple page navigations', async ({
    electronPage,
    _testDbPath,
  }) => {
    const initialMemory = process.memoryUsage().heapUsed;
    logger.logMemory('Initial state');

    // Navigate between pages multiple times
    for (let i = 0; i < 20; i++) {
      await electronPage.goto('/');
      await electronPage.waitForLoadState('networkidle');

      await electronPage.click('text=Collections');
      await electronPage.waitForLoadState('networkidle');

      await electronPage.click('text=Environments');
      await electronPage.waitForLoadState('networkidle');

      await electronPage.click('text=Home');
      await electronPage.waitForLoadState('networkidle');
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    await electronPage.waitForTimeout(1000);

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryDelta = (finalMemory - initialMemory) / 1024 / 1024; // MB
    logger.logMemory('After 20 navigation cycles');

    // Memory increase should be minimal (<100MB)
    expect(memoryDelta).toBeLessThan(100);
  });

  test('should cleanup event listeners on component unmount', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create data
    await electronPage.evaluate(async () => {
      await window.electronAPI.collection.save({
        name: 'Cleanup Test Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    const initialMemory = process.memoryUsage().heapUsed;

    // Navigate to page with component, then away, multiple times
    for (let i = 0; i < 10; i++) {
      await electronPage.goto('/');
      await electronPage.waitForLoadState('networkidle');

      await electronPage.click('text=Collections');
      await electronPage.waitForLoadState('networkidle');
      await electronPage.waitForTimeout(500);

      await electronPage.goto('/');
      await electronPage.waitForLoadState('networkidle');
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    await electronPage.waitForTimeout(1000);

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryDelta = (finalMemory - initialMemory) / 1024 / 1024; // MB
    logger.logMemory('After component mount/unmount cycles');

    // Memory increase should be minimal (<50MB)
    expect(memoryDelta).toBeLessThan(50);
  });

  test('should not accumulate memory with repeated IPC calls', async ({
    electronPage,
    _testDbPath,
  }) => {
    const initialMemory = process.memoryUsage().heapUsed;
    logger.logMemory('Initial state');

    // Make many IPC calls
    for (let i = 0; i < 100; i++) {
      await electronPage.evaluate(async () => {
        await window.electronAPI.collection.list();
        await window.electronAPI.env.list();
        await window.electronAPI.request.list();
      });
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    await electronPage.waitForTimeout(1000);

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryDelta = (finalMemory - initialMemory) / 1024 / 1024; // MB
    logger.logMemory('After 100 IPC call cycles');

    // Memory increase should be minimal (<30MB)
    expect(memoryDelta).toBeLessThan(30);
  });

  test('should cleanup database connections properly', async ({
    electronPage,
    _testDbPath,
  }) => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Create and read many items
    const collection = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'DB Cleanup Test',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    // Create many requests
    for (let i = 0; i < 50; i++) {
      await electronPage.evaluate(
        async ({ collectionId, index }) => {
          await window.electronAPI.request.save({
            name: `Request ${index}`,
            method: 'GET',
            url: `https://example.com/${index}`,
            headers: {},
            body: null,
            queryParams: [],
            auth: null,
            collectionId,
            folderId: null,
            isFavorite: false,
            order: index,
          });
        },
        { collectionId: collection.id, index: i }
      );
    }

    // Read all requests multiple times
    for (let i = 0; i < 20; i++) {
      await electronPage.evaluate(async collectionId => {
        return await window.electronAPI.request.list(collectionId);
      }, collection.id);
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    await electronPage.waitForTimeout(1000);

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryDelta = (finalMemory - initialMemory) / 1024 / 1024; // MB
    logger.logMemory('After database operations');

    // Memory increase should be reasonable (<100MB)
    expect(memoryDelta).toBeLessThan(100);
  });
});
