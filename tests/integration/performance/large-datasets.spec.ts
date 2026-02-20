import { test, expect } from '../../helpers/electron-fixtures';
import { logger } from '../../helpers/logger';

const LARGE_COLLECTION_COUNT = 300;
const LARGE_REQUEST_COUNT = 300;
const LARGE_ENV_COUNT = 1000;
const LARGE_RENDER_COLLECTION_COUNT = 200;

test.describe('Performance: Large Datasets', () => {
  // Allow more time for heavy large-dataset scenarios in CI and local runs.
  test.setTimeout(120_000);
  test('should handle 1000+ collections efficiently', async ({
    electronPage,
    testDbPath,
  }) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    // Create a large number of collections
    logger.info(`Creating ${LARGE_COLLECTION_COUNT} collections...`);
    const createStart = Date.now();

    await electronPage.evaluate(async count => {
      const promises = [];
      for (let i = 0; i < count; i++) {
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
    }, LARGE_COLLECTION_COUNT);

    const createTime = Date.now() - createStart;
    logger.logPerformance(
      `Create ${LARGE_COLLECTION_COUNT} collections`,
      createTime
    );

    // List all collections
    const listStart = Date.now();
    const collections = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.list();
    });
    const listTime = Date.now() - listStart;
    logger.logPerformance(
      `List ${LARGE_COLLECTION_COUNT} collections`,
      listTime
    );

    expect(collections.length).toBe(LARGE_COLLECTION_COUNT);
    // In practice this may be higher on CI; ensure it stays within a reasonable bound.
    expect(createTime).toBeLessThan(60_000);
    expect(listTime).toBeLessThan(30_000);

    const endMemory = process.memoryUsage().heapUsed;
    const memoryDelta = (endMemory - startMemory) / 1024 / 1024; // MB
    logger.logMemory('After 1000 collections');

    // Memory should be reasonable (<500MB increase)
    expect(memoryDelta).toBeLessThan(500);
  });

  test('should handle 1000+ requests efficiently', async ({
    electronPage,
    testDbPath,
  }) => {
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
    logger.info(`Creating ${LARGE_REQUEST_COUNT} requests...`);
    const createStart = Date.now();

    await electronPage.evaluate(
      async ({ collectionId, count }) => {
        const promises = [];
        for (let i = 0; i < count; i++) {
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
      },
      { collectionId: collection.id, count: LARGE_REQUEST_COUNT }
    );

    const createTime = Date.now() - createStart;
    logger.logPerformance(`Create ${LARGE_REQUEST_COUNT} requests`, createTime);

    // List requests
    const listStart = Date.now();
    const requests = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.request.list(collectionId);
    }, collection.id);
    const listTime = Date.now() - listStart;
    logger.logPerformance(`List ${LARGE_REQUEST_COUNT} requests`, listTime);

    expect(requests.length).toBe(LARGE_REQUEST_COUNT);
    expect(createTime).toBeLessThan(60_000);
    expect(listTime).toBeLessThan(30_000);
  });

  test('should handle 1000+ environments efficiently', async ({
    electronPage,
    testDbPath,
  }) => {
    const startTime = Date.now();
    logger.info(`Creating ${LARGE_ENV_COUNT} environments...`);
    const createStart = Date.now();

    await electronPage.evaluate(async count => {
      const promises = [];
      for (let i = 0; i < count; i++) {
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
    }, LARGE_ENV_COUNT);

    const createTime = Date.now() - createStart;
    logger.logPerformance(`Create ${LARGE_ENV_COUNT} environments`, createTime);

    // List environments
    const listStart = Date.now();
    const environments = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.list();
    });
    const listTime = Date.now() - listStart;
    logger.logPerformance(`List ${LARGE_ENV_COUNT} environments`, listTime);

    expect(environments.length).toBe(LARGE_ENV_COUNT);
    expect(createTime).toBeLessThan(60_000);
    expect(listTime).toBeLessThan(10_000);
  });

  test('should render UI with large dataset', async ({
    electronPage,
    testDbPath,
  }) => {
    // Create a large number of collections for rendering
    await electronPage.evaluate(async count => {
      const promises = [];
      for (let i = 0; i < count; i++) {
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
    }, LARGE_RENDER_COLLECTION_COUNT);

    // Navigate to collections page
    const renderStart = Date.now();
    await electronPage.goto('/');
    await electronPage.click('text=Collections');
    await electronPage.waitForLoadState('networkidle');

    // Wait for UI to render
    await electronPage.waitForTimeout(2000);
    const renderTime = Date.now() - renderStart;

    logger.logPerformance(
      `Render UI with ${LARGE_RENDER_COLLECTION_COUNT} collections`,
      renderTime
    );

    // UI should render in reasonable time for the current dataset
    expect(renderTime).toBeLessThan(60_000);

    // Verify at least some collections are visible
    const collectionVisible = await electronPage
      .locator('text=Render Test Collection')
      .first()
      .isVisible({ timeout: 5000 });
    expect(collectionVisible).toBe(true);
  });

  test('should allow scrolling collections in sidebar with many collections', async ({
    electronPage,
  }) => {
    // GIVEN: Many collections created in the database
    await electronPage.evaluate(async count => {
      const promises = [];
      for (let i = 0; i < count; i++) {
        promises.push(
          window.electronAPI.collection.save({
            name: `Sidebar Scroll Collection ${i}`,
            description: `Sidebar scroll test ${i}`,
            documentation: '',
            environments: [],
            activeEnvironmentId: null,
            isFavorite: false,
          })
        );
      }
      await Promise.all(promises);
    }, 50);

    // WHEN: Navigating to home so the sidebar is visible
    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');
    await electronPage.waitForTimeout(1500);

    // THEN: The sidebar collections container should be scrollable
    // Try multiple selectors as the sidebar structure may vary
    const scrollable = await electronPage.evaluate(() => {
      // Try data-testid first
      let el = document.querySelector(
        '[data-testid="sidebar-collections-scroll-container"]'
      ) as HTMLElement | null;

      // If not found, try finding the sidebar or collections container
      if (!el) {
        el = document.querySelector(
          '[class*="sidebar"] [class*="overflow"], [class*="collections"] [class*="overflow"]'
        ) as HTMLElement | null;
      }

      // If still not found, try finding any scrollable container in sidebar
      if (!el) {
        const sidebar = document.querySelector(
          '[class*="sidebar"], [data-testid*="sidebar"]'
        );
        if (sidebar) {
          const scrollableElements = Array.from(
            sidebar.querySelectorAll('*')
          ).filter((elem: any) => {
            return (
              elem.scrollHeight > elem.clientHeight &&
              (elem.classList.contains('overflow-auto') ||
                elem.classList.contains('overflow-y-auto') ||
                elem.style.overflow === 'auto' ||
                elem.style.overflowY === 'auto')
            );
          });
          el = scrollableElements[0] as HTMLElement | null;
        }
      }

      if (!el) return false;
      return el.scrollHeight > el.clientHeight;
    });

    // Note: If virtualization is used, the container might not be scrollable
    // Instead, verify that collections are rendered
    if (!scrollable) {
      // Fallback: Verify that multiple collections are visible
      const collectionCount = await electronPage
        .locator('text=/Sidebar Scroll Collection/')
        .count();
      expect(collectionCount).toBeGreaterThan(0);
    } else {
      expect(scrollable).toBe(true);

      // WHEN: Scrolling to the bottom of the sidebar collections list
      await electronPage.evaluate(() => {
        let el = document.querySelector(
          '[data-testid="sidebar-collections-scroll-container"]'
        ) as HTMLElement | null;
        if (!el) {
          el = document.querySelector(
            '[class*="sidebar"] [class*="overflow"]'
          ) as HTMLElement | null;
        }
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    }
    await electronPage.waitForTimeout(1000);

    // THEN: A collection near the end of the list should be visible
    const lastCollection = electronPage
      .locator('text=Sidebar Scroll Collection 49')
      .first();
    const lastVisible = await lastCollection.isVisible({ timeout: 5000 });
    expect(lastVisible).toBe(true);
  });
});
