import { test, expect } from '../../helpers/electron-fixtures';
import { logger } from '../../helpers/logger';

test.describe('Performance: Large Datasets', () => {
  test('should handle 1000+ collections efficiently', async ({ electronPage, testDbPath }) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    // Create 1000 collections
    logger.info('Creating 1000 collections...');
    const createStart = Date.now();
    
    await electronPage.evaluate(async () => {
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(
          window.electronAPI.collection.save({
            name: `Collection ${i}`,
            description: `Description ${i}`,
            documentation: '',
            environments: [],
            activeEnvironmentId: null,
            isFavorite: false,
          })
        );
      }
      await Promise.all(promises);
    });

    const createTime = Date.now() - createStart;
    logger.logPerformance('Create 1000 collections', createTime);

    // List all collections
    const listStart = Date.now();
    const collections = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.list();
    });
    const listTime = Date.now() - listStart;
    logger.logPerformance('List 1000 collections', listTime);

    expect(collections.length).toBe(1000);
    expect(createTime).toBeLessThan(30000); // Should complete in <30s
    expect(listTime).toBeLessThan(5000); // Should list in <5s

    const endMemory = process.memoryUsage().heapUsed;
    const memoryDelta = (endMemory - startMemory) / 1024 / 1024; // MB
    logger.logMemory('After 1000 collections');
    
    // Memory should be reasonable (<500MB increase)
    expect(memoryDelta).toBeLessThan(500);
  });

  test('should handle 1000+ requests efficiently', async ({ electronPage, testDbPath }) => {
    // Create collection first
    const collection = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Large Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    const startTime = Date.now();
    logger.info('Creating 1000 requests...');
    const createStart = Date.now();

    await electronPage.evaluate(async (collectionId) => {
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(
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
      }
      await Promise.all(promises);
    }, collection.id);

    const createTime = Date.now() - createStart;
    logger.logPerformance('Create 1000 requests', createTime);

    // List requests
    const listStart = Date.now();
    const requests = await electronPage.evaluate(async (collectionId) => {
      return await window.electronAPI.request.list(collectionId);
    }, collection.id);
    const listTime = Date.now() - listStart;
    logger.logPerformance('List 1000 requests', listTime);

    expect(requests.length).toBe(1000);
    expect(createTime).toBeLessThan(30000);
    expect(listTime).toBeLessThan(5000);
  });

  test('should handle 1000+ environments efficiently', async ({ electronPage, testDbPath }) => {
    const startTime = Date.now();
    logger.info('Creating 1000 environments...');
    const createStart = Date.now();

    await electronPage.evaluate(async () => {
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(
          window.electronAPI.env.save({
            name: `env-${i}`,
            displayName: `Environment ${i}`,
            variables: { [`var_${i}`]: `value_${i}` },
            isDefault: i === 0,
          })
        );
      }
      await Promise.all(promises);
    });

    const createTime = Date.now() - createStart;
    logger.logPerformance('Create 1000 environments', createTime);

    // List environments
    const listStart = Date.now();
    const environments = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.list();
    });
    const listTime = Date.now() - listStart;
    logger.logPerformance('List 1000 environments', listTime);

    expect(environments.length).toBe(1000);
    expect(createTime).toBeLessThan(30000);
    expect(listTime).toBeLessThan(5000);
  });

  test('should render UI with large dataset', async ({ electronPage, testDbPath }) => {
    // Create 500 collections
    await electronPage.evaluate(async () => {
      const promises = [];
      for (let i = 0; i < 500; i++) {
        promises.push(
          window.electronAPI.collection.save({
            name: `Render Test Collection ${i}`,
            description: '',
            documentation: '',
            environments: [],
            activeEnvironmentId: null,
            isFavorite: false,
          })
        );
      }
      await Promise.all(promises);
    });

    // Navigate to collections page
    const renderStart = Date.now();
    await electronPage.goto('/');
    await electronPage.click('text=Collections');
    await electronPage.waitForLoadState('networkidle');
    
    // Wait for UI to render
    await electronPage.waitForTimeout(2000);
    const renderTime = Date.now() - renderStart;
    logger.logPerformance('Render UI with 500 collections', renderTime);

    // UI should render in reasonable time (<10s)
    expect(renderTime).toBeLessThan(10000);

    // Verify at least some collections are visible
    const collectionVisible = await electronPage.locator('text=Render Test Collection').first().isVisible({ timeout: 5000 });
    expect(collectionVisible).toBe(true);
  });
});

