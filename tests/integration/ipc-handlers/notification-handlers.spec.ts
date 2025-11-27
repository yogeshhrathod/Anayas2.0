import { test, expect } from '../../helpers/electron-fixtures';

test.describe('Notification IPC Handlers', () => {
  test('notification:show - should show notification', async ({
    electronPage,
    _testDbPath,
  }) => {
    const notificationOptions = {
      title: 'Test Notification',
      body: 'This is a test notification',
    };

    const result = await electronPage.evaluate(async options => {
      return await window.electronAPI.notification.show(options);
    }, notificationOptions);

    expect(result.success).toBe(true);
  });

  test('notification:show - should show notification with file path', async ({
    electronPage,
    _testDbPath,
  }) => {
    const notificationOptions = {
      title: 'Export Complete',
      body: 'File exported successfully',
      filePath: '/path/to/exported/file.json',
    };

    const result = await electronPage.evaluate(async options => {
      return await window.electronAPI.notification.show(options);
    }, notificationOptions);

    expect(result.success).toBe(true);
  });
});
