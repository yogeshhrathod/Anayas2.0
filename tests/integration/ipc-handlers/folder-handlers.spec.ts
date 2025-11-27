import { test, expect } from '../../helpers/electron-fixtures';
import {
  assertDataPersisted,
  assertDatabaseCount,
} from '../../helpers/assertions';

test.describe('Folder IPC Handlers', () => {
  test('folder:list - should return empty list initially', async ({
    electronPage,
    _testDbPath,
  }) => {
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.folder.list();
    });

    expect(result).toEqual([]);
  });

  test('folder:save - should create new folder', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create collection first
    const collection = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Test Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    const folderData = {
      name: 'Test Folder',
      description: 'Test Description',
      collectionId: collection.id,
    };

    const result = await electronPage.evaluate(async folder => {
      return await window.electronAPI.folder.save(folder);
    }, folderData);

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();

    // Verify persistence
    assertDataPersisted(
      { id: result.id, ...folderData },
      testDbPath,
      'folders'
    );
  });

  test('folder:delete - should delete folder', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create collection and folder
    const collection = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Test Collection',
        description: '',
        documentation: '',
        environments: [],
        activeEnvironmentId: null,
        isFavorite: false,
      });
    });

    const folder = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.folder.save({
        name: 'Test Folder',
        description: '',
        collectionId,
      });
    }, collection.id);

    // Delete it
    const deleteResult = await electronPage.evaluate(async id => {
      return await window.electronAPI.folder.delete(id);
    }, folder.id);

    expect(deleteResult.success).toBe(true);

    // Verify deletion
    assertDatabaseCount(testDbPath, 'folders', 0);
  });
});
