import { test, expect } from '../../helpers/electron-fixtures';
import { assertDataPersisted } from '../../helpers/assertions';
import { getDatabaseContents } from '../../helpers/test-db';

test.describe('Preset IPC Handlers', () => {
  test('preset:list - should return empty list initially', async ({
    electronPage,
    _testDbPath,
  }) => {
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.preset.list();
    });

    expect(result).toEqual([]);
  });

  test('preset:list - should return presets for specific request', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create collection and request
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

    const request = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.request.save({
        name: 'Test Request',
        method: 'GET',
        url: 'https://example.com',
        headers: {},
        body: null,
        queryParams: [],
        auth: null,
        collectionId,
        folderId: null,
        isFavorite: false,
        order: 0,
      });
    }, collection.id);

    // Create preset for this request
    await electronPage.evaluate(async requestId => {
      return await window.electronAPI.preset.save({
        requestId,
        name: 'Test Preset',
        headers: { Authorization: 'Bearer token' },
        body: '{"key": "value"}',
        queryParams: [{ key: 'param', value: 'value', enabled: true }],
      });
    }, request.id);

    // List presets for this request
    const result = await electronPage.evaluate(async requestId => {
      return await window.electronAPI.preset.list(requestId);
    }, request.id);

    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('requestId');
  });

  test('preset:save - should create new preset', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create collection and request
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

    const request = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.request.save({
        name: 'Test Request',
        method: 'POST',
        url: 'https://example.com',
        headers: {},
        body: null,
        queryParams: [],
        auth: null,
        collectionId,
        folderId: null,
        isFavorite: false,
        order: 0,
      });
    }, collection.id);

    const presetData = {
      requestId: request.id,
      name: 'Test Preset',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      },
      body: '{"key": "value"}',
      queryParams: [{ key: 'param1', value: 'value1', enabled: true }],
    };

    const result = await electronPage.evaluate(async preset => {
      return await window.electronAPI.preset.save(preset);
    }, presetData);

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();

    // Verify persistence
    const dbContents = getDatabaseContents(testDbPath);
    const preset = dbContents.presets.find((p: any) => p.id === result.id);
    expect(preset).toBeDefined();
    expect(preset.name).toBe(presetData.name);
    expect(preset.requestId).toBe(presetData.requestId);
  });

  test('preset:delete - should delete preset', async ({
    electronPage,
    _testDbPath,
  }) => {
    // Create collection and request
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

    const request = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.request.save({
        name: 'Test Request',
        method: 'GET',
        url: 'https://example.com',
        headers: {},
        body: null,
        queryParams: [],
        auth: null,
        collectionId,
        folderId: null,
        isFavorite: false,
        order: 0,
      });
    }, collection.id);

    // Create preset
    const preset = await electronPage.evaluate(async requestId => {
      return await window.electronAPI.preset.save({
        requestId,
        name: 'Test Preset',
        headers: {},
        body: '',
        queryParams: [],
      });
    }, request.id);

    // Delete it
    const deleteResult = await electronPage.evaluate(async id => {
      return await window.electronAPI.preset.delete(id);
    }, preset.id);

    expect(deleteResult.success).toBe(true);

    // Verify deletion
    const presets = await electronPage.evaluate(async requestId => {
      return await window.electronAPI.preset.list(requestId);
    }, request.id);

    expect(presets.length).toBe(0);
  });
});
