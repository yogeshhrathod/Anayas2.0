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

    const envSwitcher = electronPage.locator('[data-testid="environment-switcher"]');
    await expect(envSwitcher).toBeVisible();
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

    // Find and click environment switcher button
    // The EnvironmentSwitcher uses a button with Globe icon and environment name
    // Look for button containing the current environment name or "No Environment"
    const envSwitcher = electronPage.locator('button:has-text("Global Env 1"), button:has-text("No Environment"), button:has([class*="Globe"])').first();
    await envSwitcher.waitFor({ state: 'visible', timeout: 10000 });
    await envSwitcher.click();
    await electronPage.waitForTimeout(1500); // Wait for dropdown to open

    // Select different environment from dropdown
    // The dropdown uses button elements with the environment displayName
    // Each button has the structure: button > div > div > font-medium (displayName)
    const env2Option = electronPage.locator('button:has-text("Global Env 2")').first();
    await env2Option.waitFor({ state: 'visible', timeout: 10000 });
    await env2Option.click();
    await electronPage.waitForTimeout(1000);

    // Verify environment was switched via IPC
    const currentEnv = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.getCurrent();
    });

    expect(currentEnv).toBeDefined();
    expect(currentEnv.id).toBe(setup.env2Id);
    
    // Also verify UI shows the new environment
    // Re-locate the switcher after the switch to get updated text
    await electronPage.waitForTimeout(500); // Wait for UI update
    const updatedEnvSwitcher = electronPage.locator('button:has-text("Global Env 2"), button:has([class*="Globe"])').first();
    await updatedEnvSwitcher.waitFor({ state: 'visible', timeout: 5000 });
    const envSwitcherText = await updatedEnvSwitcher.textContent();
    expect(envSwitcherText).toContain('Global Env 2');
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
    const currentEnvText = electronPage.locator('[data-testid="environment-switcher"] span', {
      hasText: 'Current Environment'
    });
    await expect(currentEnvText).toBeVisible({ timeout: 5000 });
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

