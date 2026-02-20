import { test, expect } from '../../helpers/electron-fixtures';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

test.describe('File IPC Handlers', () => {
  test('file:select - should return null (mocked dialog cancelled)', async ({
    electronPage,
    testDbPath,
  }) => {
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.file.select([
        { name: 'Text Files', extensions: ['txt'] },
      ]);
    });

    // Mocked to return null (cancelled)
    expect(result).toBeNull();
  });

  test('file:selectDirectory - should return null (mocked dialog cancelled)', async ({
    electronPage,
    testDbPath,
  }) => {
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.file.selectDirectory();
    });

    // Mocked to return null (cancelled)
    expect(result).toBeNull();
  });

  test('file:save - should return success: false (mocked dialog cancelled)', async ({
    electronPage,
    testDbPath,
  }) => {
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.file.save(
        '/path/to/file.txt',
        'file content'
      );
    });

    // Mocked to return success: false (cancelled)
    expect(result.success).toBe(false);
  });

  test('file:read - should read file content', async ({
    electronPage,
    testDbPath,
  }) => {
    // Create a temporary test file
    const testContent = 'Hello, World!\nThis is a test file.';
    const testFilePath = path.join(tmpdir(), `test-read-${Date.now()}.txt`);
    fs.writeFileSync(testFilePath, testContent, 'utf-8');

    try {
      const result = await electronPage.evaluate(async filePath => {
        return await window.electronAPI.file.read(filePath);
      }, testFilePath);

      expect(result.success).toBe(true);
      expect(result.content).toBe(testContent);
    } finally {
      // Cleanup
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });

  test('file:read - should handle non-existent file', async ({
    electronPage,
    testDbPath,
  }) => {
    const nonExistentPath = path.join(
      tmpdir(),
      `non-existent-${Date.now()}.txt`
    );

    const result = await electronPage.evaluate(async filePath => {
      return await window.electronAPI.file.read(filePath);
    }, nonExistentPath);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('file:write - should write file content', async ({
    electronPage,
    testDbPath,
  }) => {
    const testContent = 'This is test content written by the test.';
    const testFilePath = path.join(tmpdir(), `test-write-${Date.now()}.txt`);

    try {
      const result = await electronPage.evaluate(
        async ({ filePath, content }) => {
          return await window.electronAPI.file.write(filePath, content);
        },
        { filePath: testFilePath, content: testContent }
      );

      expect(result.success).toBe(true);

      // Verify file was written
      const writtenContent = fs.readFileSync(testFilePath, 'utf-8');
      expect(writtenContent).toBe(testContent);
    } finally {
      // Cleanup
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });

  test('file:write - should overwrite existing file', async ({
    electronPage,
    testDbPath,
  }) => {
    const testFilePath = path.join(
      tmpdir(),
      `test-overwrite-${Date.now()}.txt`
    );
    const originalContent = 'Original content';
    const newContent = 'New content';

    // Create file with original content
    fs.writeFileSync(testFilePath, originalContent, 'utf-8');

    try {
      const result = await electronPage.evaluate(
        async ({ filePath, content }) => {
          return await window.electronAPI.file.write(filePath, content);
        },
        { filePath: testFilePath, content: newContent }
      );

      expect(result.success).toBe(true);

      // Verify file was overwritten
      const writtenContent = fs.readFileSync(testFilePath, 'utf-8');
      expect(writtenContent).toBe(newContent);
      expect(writtenContent).not.toBe(originalContent);
    } finally {
      // Cleanup
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });
});
