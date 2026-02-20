import { test, expect } from '../../helpers/electron-fixtures';

test.describe('Window IPC Handlers', () => {
  test('window:minimize - should call minimize handler', async ({
    electronPage,
    testDbPath,
  }) => {
    // This is mocked, so we just verify it doesn't throw
    const result = await electronPage.evaluate(async () => {
      await window.electronAPI.window.minimize();
      return { success: true };
    });

    expect(result.success).toBe(true);
  });

  test('window:maximize - should call maximize handler', async ({
    electronPage,
    testDbPath,
  }) => {
    // This is mocked, so we just verify it doesn't throw
    const result = await electronPage.evaluate(async () => {
      await window.electronAPI.window.maximize();
      return { success: true };
    });

    expect(result.success).toBe(true);
  });

  test('window:close - should call close handler', async ({
    electronPage,
    testDbPath,
  }) => {
    // This is mocked, so we just verify it doesn't throw
    const result = await electronPage.evaluate(async () => {
      await window.electronAPI.window.close();
      return { success: true };
    });

    expect(result.success).toBe(true);
  });

  test('window:isMaximized - should return maximized state', async ({
    electronPage,
    testDbPath,
  }) => {
    // This is mocked to return false
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.window.isMaximized();
    });

    expect(typeof result).toBe('boolean');
    // Mocked to return false
    expect(result).toBe(false);
  });
});
