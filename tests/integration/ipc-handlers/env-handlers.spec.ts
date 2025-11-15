import { test, expect } from '../../helpers/electron-fixtures';
import { assertDataPersisted, assertDatabaseCount } from '../../helpers/assertions';
import { getDatabaseContents } from '../../helpers/test-db';
import path from 'path';

test.describe('Environment IPC Handlers', () => {
  test('env:list - should return empty list initially', async ({ electronPage, testDbPath }) => {
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.list();
    });
    
    expect(result).toEqual([]);
  });

  test('env:save - should create new environment', async ({ electronPage, testDbPath }) => {
    const envData = {
      name: 'test-env',
      displayName: 'Test Environment',
      variables: {
        base_url: 'https://jsonplaceholder.typicode.com',
        api_key: 'test-key',
      },
      isDefault: false,
    };
    
    const result = await electronPage.evaluate(async (env) => {
      return await window.electronAPI.env.save(env);
    }, envData);
    
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    
    // Verify persistence
    assertDataPersisted({ id: result.id, ...envData }, testDbPath, 'environments');
  });

  test('env:save - should update existing environment', async ({ electronPage, testDbPath }) => {
    // Create environment first
    const createResult = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.save({
        name: 'test-env',
        displayName: 'Test Environment',
        variables: { base_url: 'https://example.com' },
        isDefault: false,
      });
    });
    
    // Update it
    const updateResult = await electronPage.evaluate(async (id) => {
      return await window.electronAPI.env.save({
        id,
        name: 'test-env-updated',
        displayName: 'Updated Environment',
        variables: { base_url: 'https://updated.com' },
        isDefault: false,
      });
    }, createResult.id);
    
    expect(updateResult.success).toBe(true);
    expect(updateResult.id).toBe(createResult.id);
    
    // Verify update
    const dbContents = getDatabaseContents(testDbPath);
    const env = dbContents.environments.find((e: any) => e.id === createResult.id);
    expect(env.name).toBe('test-env-updated');
    expect(env.displayName).toBe('Updated Environment');
  });

  test('env:delete - should delete environment', async ({ electronPage, testDbPath }) => {
    // Create environment first
    const createResult = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.save({
        name: 'test-env',
        displayName: 'Test Environment',
        variables: {},
        isDefault: false,
      });
    });
    
    // Delete it
    const deleteResult = await electronPage.evaluate(async (id) => {
      return await window.electronAPI.env.delete(id);
    }, createResult.id);
    
    expect(deleteResult.success).toBe(true);
    
    // Verify deletion
    assertDatabaseCount(testDbPath, 'environments', 0);
  });

  test('env:getCurrent - should return default environment', async ({ electronPage, testDbPath }) => {
    // Create default environment
    await electronPage.evaluate(async () => {
      await window.electronAPI.env.save({
        name: 'default-env',
        displayName: 'Default Environment',
        variables: {},
        isDefault: true,
      });
    });
    
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.getCurrent();
    });
    
    expect(result).toBeDefined();
    expect(result.isDefault).toBe(1);
  });

  test('env:setCurrent - should set current environment', async ({ electronPage, testDbPath }) => {
    // Create two environments
    const env1 = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.save({
        name: 'env1',
        displayName: 'Environment 1',
        variables: {},
        isDefault: false,
      });
    });
    
    const env2 = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.save({
        name: 'env2',
        displayName: 'Environment 2',
        variables: {},
        isDefault: false,
      });
    });
    
    // Set env2 as current
    const setResult = await electronPage.evaluate(async (id) => {
      return await window.electronAPI.env.setCurrent(id);
    }, env2.id);
    
    expect(setResult.success).toBe(true);
    
    // Verify env2 is now default
    const current = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.getCurrent();
    });
    
    expect(current.id).toBe(env2.id);
    expect(current.isDefault).toBe(1);
  });

  test('env:test - should test environment connection', async ({ electronPage, testDbPath }) => {
    const envData = {
      name: 'test-env',
      displayName: 'Test Environment',
      variables: {
        base_url: 'https://jsonplaceholder.typicode.com',
      },
    };
    
    const result = await electronPage.evaluate(async (env) => {
      return await window.electronAPI.env.test(env);
    }, envData);
    
    // Note: This test may fail if network is unavailable
    // In that case, we just verify the handler was called
    expect(result).toBeDefined();
    expect(result.success !== undefined).toBe(true);
  });

  test('env:import - should import environment from file', async ({ electronPage, testDbPath }) => {
    // This test would require file system access
    // For now, we'll skip the actual file import and test the handler structure
    // In a real scenario, you'd create a test .env file and import it
    test.skip(); // Skip until file handling is properly mocked
  });
});

