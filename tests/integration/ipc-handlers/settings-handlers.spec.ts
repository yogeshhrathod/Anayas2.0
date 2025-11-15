import { test, expect } from '../../helpers/electron-fixtures';

test.describe('Settings IPC Handlers', () => {
  test('settings:get - should return default setting', async ({ electronPage, testDbPath }) => {
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.settings.get('theme');
    });
    
    expect(result).toBeDefined();
  });

  test('settings:set - should set setting value', async ({ electronPage, testDbPath }) => {
    const setResult = await electronPage.evaluate(async () => {
      return await window.electronAPI.settings.set('testKey', 'testValue');
    });
    
    expect(setResult.success).toBe(true);
    
    // Verify it was set
    const value = await electronPage.evaluate(async () => {
      return await window.electronAPI.settings.get('testKey');
    });
    
    expect(value).toBe('testValue');
  });

  test('settings:getAll - should return all settings', async ({ electronPage, testDbPath }) => {
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.settings.getAll();
    });
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('theme');
  });

  test('settings:reset - should reset all settings', async ({ electronPage, testDbPath }) => {
    // Set a custom setting
    await electronPage.evaluate(async () => {
      await window.electronAPI.settings.set('testKey', 'testValue');
    });
    
    // Reset settings
    const resetResult = await electronPage.evaluate(async () => {
      return await window.electronAPI.settings.reset();
    });
    
    expect(resetResult.success).toBe(true);
    
    // Verify custom setting is gone
    const value = await electronPage.evaluate(async () => {
      return await window.electronAPI.settings.get('testKey');
    });
    
    // Should return default or undefined
    expect(value).not.toBe('testValue');
  });
});

