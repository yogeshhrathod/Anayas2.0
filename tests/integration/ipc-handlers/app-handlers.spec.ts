import { test, expect } from '../../helpers/electron-fixtures';

test.describe('App IPC Handlers', () => {
  test('app:getVersion - should return app version', async ({
    electronPage,
    testDbPath,
  }) => {
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.app.getVersion();
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    // Mocked to return '1.0.0'
    expect(result).toBe('1.0.0');
  });

  test('app:getPath - should return app path', async ({
    electronPage,
    testDbPath,
  }) => {
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.app.getPath('userData');
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    // Mocked to return '/mock/path'
    expect(result).toBe('/mock/path');
  });

  test('app:getPath - should return path for different path types', async ({
    electronPage,
    testDbPath,
  }) => {
    const pathTypes = ['userData', 'home', 'temp', 'desktop'];

    for (const pathType of pathTypes) {
      const result = await electronPage.evaluate(async type => {
        return await window.electronAPI.app.getPath(type);
      }, pathType);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    }
  });
});
