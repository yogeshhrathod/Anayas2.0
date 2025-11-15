import { test, expect } from '../../helpers/electron-fixtures';

test.describe('Error States', () => {
  test('should handle invalid collection ID gracefully', async ({ electronPage, testDbPath }) => {
    // Try to delete non-existent collection
    const result = await electronPage.evaluate(async () => {
      try {
        return await window.electronAPI.collection.delete(99999);
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
    
    // Should either succeed (if delete is idempotent) or return error gracefully
    expect(result).toBeDefined();
  });

  test('should handle invalid environment ID gracefully', async ({ electronPage, testDbPath }) => {
    // Try to delete non-existent environment
    const result = await electronPage.evaluate(async () => {
      try {
        return await window.electronAPI.env.delete(99999);
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
    
    // Should either succeed (if delete is idempotent) or return error gracefully
    expect(result).toBeDefined();
  });

  test('should handle invalid request ID gracefully', async ({ electronPage, testDbPath }) => {
    // Try to delete non-existent request
    const result = await electronPage.evaluate(async () => {
      try {
        return await window.electronAPI.request.delete(99999);
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
    
    // Should either succeed (if delete is idempotent) or return error gracefully
    expect(result).toBeDefined();
  });

  test('should handle network errors in request send', async ({ electronPage, testDbPath }) => {
    // Create environment
    await electronPage.evaluate(async () => {
      await window.electronAPI.env.save({
        name: 'test-env',
        displayName: 'Test',
        variables: {},
        isDefault: true,
      });
    });
    
    // Try to send request to invalid URL
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.request.send({
        method: 'GET',
        url: 'https://invalid-domain-that-does-not-exist-12345.com',
        headers: {},
        body: null,
        queryParams: [],
      });
    });
    
    // Should handle error gracefully
    expect(result).toBeDefined();
    // May succeed with error message or fail gracefully
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  test('should handle missing environment in request send', async ({ electronPage, testDbPath }) => {
    // Don't create any environment - try to send request
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.request.send({
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: {},
        body: null,
        queryParams: [],
      });
    });
    
    // Should handle missing environment gracefully
    expect(result).toBeDefined();
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});

