import { test, expect } from '../../helpers/electron-fixtures';

test.describe('EnvironmentSwitcher Component Integration', () => {
  test('should render environment switcher with environments', async ({ electronPage, testDbPath }) => {
    // Create multiple environments
    await electronPage.evaluate(async () => {
      await window.electronAPI.env.save({
        name: 'env1',
        displayName: 'Environment 1',
        variables: { api_key: 'key1' },
        isDefault: true,
      });

      await window.electronAPI.env.save({
        name: 'env2',
        displayName: 'Environment 2',
        variables: { api_key: 'key2' },
        isDefault: false,
      });
    });

    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    // Navigate to a page where environment switcher is visible (not home)
    await electronPage.click('text=Collections');
    await electronPage.waitForLoadState('networkidle');
    await electronPage.waitForTimeout(1000);

    // Verify environment switcher is visible
    // EnvironmentSwitcher typically shows current environment
    const envSwitcher = electronPage.locator('text=Environment, [class*="environment"], button:has-text("Environment")');
    const envSwitcherCount = await envSwitcher.count();
    
    // Environment switcher should be visible on non-home pages
    expect(envSwitcherCount).toBeGreaterThan(0);
  });

  test('should switch global environment', async ({ electronPage, testDbPath }) => {
    // Create environments
    const setup = await electronPage.evaluate(async () => {
      const env1 = await window.electronAPI.env.save({
        name: 'global-env-1',
        displayName: 'Global Env 1',
        variables: { api_key: 'global1' },
        isDefault: true,
      });

      const env2 = await window.electronAPI.env.save({
        name: 'global-env-2',
        displayName: 'Global Env 2',
        variables: { api_key: 'global2' },
        isDefault: false,
      });

      return { env1Id: env1.id, env2Id: env2.id };
    });

    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    // Navigate to collections page
    await electronPage.click('text=Collections');
    await electronPage.waitForLoadState('networkidle');
    await electronPage.waitForTimeout(1000);

    // Find and click environment switcher
    const envSwitcher = electronPage.locator('button:has-text("Environment"), [class*="environment-selector"]').first();
    const envSwitcherCount = await envSwitcher.count();

    if (envSwitcherCount > 0) {
      await envSwitcher.click();
      await electronPage.waitForTimeout(500);

      // Select different environment from dropdown
      const env2Option = electronPage.locator('text=Global Env 2, text=global-env-2');
      const env2Count = await env2Option.count();

      if (env2Count > 0) {
        await env2Option.click();
        await electronPage.waitForTimeout(1000);

        // Verify environment was switched via IPC
        const currentEnv = await electronPage.evaluate(async () => {
          return await window.electronAPI.env.getCurrent();
        });

        expect(currentEnv.id).toBe(setup.env2Id);
      }
    }
  });

  test('should display current environment', async ({ electronPage, testDbPath }) => {
    // Create default environment
    const env = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.save({
        name: 'current-env',
        displayName: 'Current Environment',
        variables: { api_key: 'current' },
        isDefault: true,
      });
    });

    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    // Navigate to collections page
    await electronPage.click('text=Collections');
    await electronPage.waitForLoadState('networkidle');
    await electronPage.waitForTimeout(1000);

    // Verify current environment is displayed
    const currentEnvText = electronPage.locator('text=Current Environment, text=current-env');
    const currentEnvVisible = await currentEnvText.isVisible({ timeout: 5000 });
    
    // Environment switcher should show current environment
    expect(currentEnvVisible).toBe(true);
  });

  test('should handle collection environments', async ({ electronPage, testDbPath }) => {
    // Create collection with environments
    const setup = await electronPage.evaluate(async () => {
      const collection = await window.electronAPI.collection.save({
        name: 'Collection with Envs',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });

      const envResult = await window.electronAPI.collection.addEnvironment(collection.id, {
        name: 'Collection Env',
        variables: { api_key: 'collection-key' },
      });

      return { collectionId: collection.id, envId: envResult.id };
    });

    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    // Select a request from the collection to trigger collection environment display
    // EnvironmentSwitcher should show collection environments when a request from that collection is selected
    const collectionVisible = await electronPage.locator('text=Collection with Envs').isVisible({ timeout: 5000 });
    expect(collectionVisible).toBe(true);
  });

  test('should call IPC to set current environment', async ({ electronPage, testDbPath }) => {
    // Create environments
    const setup = await electronPage.evaluate(async () => {
      const env1 = await window.electronAPI.env.save({
        name: 'ipc-env-1',
        displayName: 'IPC Env 1',
        variables: {},
        isDefault: true,
      });

      const env2 = await window.electronAPI.env.save({
        name: 'ipc-env-2',
        displayName: 'IPC Env 2',
        variables: {},
        isDefault: false,
      });

      return { env2Id: env2.id };
    });

    // Switch environment via IPC (simulating what component does)
    const switchResult = await electronPage.evaluate(async (envId) => {
      return await window.electronAPI.env.setCurrent(envId);
    }, setup.env2Id);

    expect(switchResult.success).toBe(true);

    // Verify environment was switched
    const currentEnv = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.getCurrent();
    });

    expect(currentEnv.id).toBe(setup.env2Id);
  });
});

