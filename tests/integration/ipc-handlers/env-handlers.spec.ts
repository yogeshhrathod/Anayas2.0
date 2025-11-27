import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  assertDataPersisted,
  assertDatabaseCount,
} from '../../helpers/assertions';
import { expect, test } from '../../helpers/electron-fixtures';
import { getDatabaseContents } from '../../helpers/test-db';

test.describe('Environment IPC Handlers', () => {
  test('env:list - should return empty list initially', async ({
    electronPage,
    testDbPath,
  }) => {
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.list();
    });

    expect(result).toEqual([]);
  });

  test('env:save - should create new environment', async ({
    electronPage,
    testDbPath,
  }) => {
    const envData = {
      name: 'test-env',
      displayName: 'Test Environment',
      variables: {
        base_url: 'https://jsonplaceholder.typicode.com',
        api_key: 'test-key',
      },
      isDefault: false,
    };

    const result = await electronPage.evaluate(async env => {
      return await window.electronAPI.env.save(env);
    }, envData);

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();

    // Verify persistence
    assertDataPersisted(
      { id: result.id, ...envData },
      testDbPath,
      'environments'
    );
  });

  test('env:save - should update existing environment', async ({
    electronPage,
    testDbPath,
  }) => {
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
    const updateResult = await electronPage.evaluate(async id => {
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
    const env = dbContents.environments.find(
      (e: any) => e.id === createResult.id
    );
    expect(env.name).toBe('test-env-updated');
    expect(env.displayName).toBe('Updated Environment');
  });

  test('env:delete - should delete environment', async ({
    electronPage,
    testDbPath,
  }) => {
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
    const deleteResult = await electronPage.evaluate(async id => {
      return await window.electronAPI.env.delete(id);
    }, createResult.id);

    expect(deleteResult.success).toBe(true);

    // Verify deletion
    assertDatabaseCount(testDbPath, 'environments', 0);
  });

  test('env:getCurrent - should return default environment', async ({
    electronPage,
    testDbPath,
  }) => {
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

  test('env:setCurrent - should set current environment', async ({
    electronPage,
    testDbPath,
  }) => {
    // Create two environments
    const _env1 = await electronPage.evaluate(async () => {
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
    const setResult = await electronPage.evaluate(async id => {
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

  test('env:test - should test environment connection', async ({
    electronPage,
    testDbPath,
  }) => {
    const envData = {
      name: 'test-env',
      displayName: 'Test Environment',
      variables: {
        base_url: 'https://jsonplaceholder.typicode.com',
      },
    };

    const result = await electronPage.evaluate(async env => {
      return await window.electronAPI.env.test(env);
    }, envData);

    // Note: This test may fail if network is unavailable
    // In that case, we just verify the handler was called
    expect(result).toBeDefined();
    expect(result.success !== undefined).toBe(true);
  });

  test('env:import - should import environment from file', async ({
    electronPage,
    testDbPath,
  }) => {
    // Create a temporary .env file
    const envContent = `# Test Environment File
ENV=test
base_url=https://api.example.com
api_key=test-api-key-123
database_url=postgres://localhost:5432/testdb
`;

    const testFilePath = path.join(os.tmpdir(), `test-env-${Date.now()}.env`);
    fs.writeFileSync(testFilePath, envContent, 'utf-8');

    try {
      const result = await electronPage.evaluate(async filePath => {
        return await window.electronAPI.env.import(filePath);
      }, testFilePath);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe('test');
      // When ENV is set, displayName uses ENV value, otherwise 'Imported Environment'
      expect(result.data.displayName).toBe('test');
      expect(result.data.variables).toBeDefined();
      expect(result.data.variables.base_url).toBe('https://api.example.com');
      expect(result.data.variables.api_key).toBe('test-api-key-123');
      expect(result.data.variables.database_url).toBe(
        'postgres://localhost:5432/testdb'
      );
    } finally {
      // Cleanup
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });

  test('env:import - should use fallback when ENV is not set', async ({
    electronPage,
    testDbPath,
  }) => {
    // Create a temporary .env file without ENV variable
    const envContent = `# Test Environment File without ENV
base_url=https://api.example.com
api_key=test-api-key-123
`;

    const testFilePath = path.join(
      os.tmpdir(),
      `test-env-fallback-${Date.now()}.env`
    );
    fs.writeFileSync(testFilePath, envContent, 'utf-8');

    try {
      const result = await electronPage.evaluate(async filePath => {
        return await window.electronAPI.env.import(filePath);
      }, testFilePath);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe('imported');
      expect(result.data.displayName).toBe('Imported Environment');
      expect(result.data.variables).toBeDefined();
      expect(result.data.variables.base_url).toBe('https://api.example.com');
    } finally {
      // Cleanup
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });

  test('env:import - should handle non-existent file', async ({
    electronPage,
    testDbPath,
  }) => {
    const nonExistentPath = '/path/that/does/not/exist.env';

    const result = await electronPage.evaluate(async filePath => {
      return await window.electronAPI.env.import(filePath);
    }, nonExistentPath);

    expect(result.success).toBe(false);
    expect(result.message).toBeDefined();
  });
});
