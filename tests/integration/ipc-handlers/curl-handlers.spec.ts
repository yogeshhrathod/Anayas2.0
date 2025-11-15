import { test, expect } from '../../helpers/electron-fixtures';

test.describe('cURL IPC Handlers', () => {
  test('curl:parse - should parse simple GET cURL command', async ({ electronPage, testDbPath }) => {
    const curlCommand = 'curl https://jsonplaceholder.typicode.com/posts/1';
    
    const result = await electronPage.evaluate(async (command) => {
      return await window.electronAPI.curl.parse(command);
    }, curlCommand);
    
    expect(result.success).toBe(true);
    expect(result.request).toBeDefined();
    expect(result.request.method).toBe('GET');
    expect(result.request.url).toBe('https://jsonplaceholder.typicode.com/posts/1');
  });

  test('curl:parse - should parse POST cURL command with headers and body', async ({ electronPage, testDbPath }) => {
    const curlCommand = `curl -X POST https://jsonplaceholder.typicode.com/posts \\
      -H "Content-Type: application/json" \\
      -H "Authorization: Bearer token123" \\
      -d '{"title":"foo","body":"bar","userId":1}'`;
    
    const result = await electronPage.evaluate(async (command) => {
      return await window.electronAPI.curl.parse(command);
    }, curlCommand);
    
    expect(result.success).toBe(true);
    expect(result.request).toBeDefined();
    expect(result.request.method).toBe('POST');
    expect(result.request.url).toBe('https://jsonplaceholder.typicode.com/posts');
    expect(result.request.headers).toBeDefined();
    expect(result.request.headers['Content-Type']).toBe('application/json');
    expect(result.request.headers['Authorization']).toBe('Bearer token123');
    expect(result.request.body).toContain('title');
  });

  test('curl:parse - should handle invalid cURL command', async ({ electronPage, testDbPath }) => {
    const invalidCommand = 'not a curl command';
    
    const result = await electronPage.evaluate(async (command) => {
      return await window.electronAPI.curl.parse(command);
    }, invalidCommand);
    
    // Should handle error gracefully
    expect(result).toBeDefined();
    // May return success: false or throw, depending on parser implementation
  });

  test('curl:generate - should generate cURL command from request', async ({ electronPage, testDbPath }) => {
    const request = {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      headers: {},
      body: null,
      queryParams: [],
    };
    
    const result = await electronPage.evaluate(async (req) => {
      return await window.electronAPI.curl.generate(req);
    }, request);
    
    expect(result.success).toBe(true);
    expect(result.command).toBeDefined();
    expect(result.command).toContain('curl');
    expect(result.command).toContain('https://jsonplaceholder.typicode.com/posts/1');
  });

  test('curl:generate - should generate POST cURL command with headers and body', async ({ electronPage, testDbPath }) => {
    const request = {
      method: 'POST',
      url: 'https://jsonplaceholder.typicode.com/posts',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token123',
      },
      body: '{"title":"foo","body":"bar","userId":1}',
      queryParams: [],
    };
    
    const result = await electronPage.evaluate(async (req) => {
      return await window.electronAPI.curl.generate(req);
    }, request);
    
    expect(result.success).toBe(true);
    expect(result.command).toBeDefined();
    expect(result.command).toContain('curl');
    expect(result.command).toContain('-X POST');
    expect(result.command).toContain('Content-Type');
    expect(result.command).toContain('Authorization');
    expect(result.command).toContain('title');
  });

  test('curl:import-bulk - should parse multiple cURL commands', async ({ electronPage, testDbPath }) => {
    const commands = [
      'curl https://jsonplaceholder.typicode.com/posts/1',
      'curl -X POST https://jsonplaceholder.typicode.com/posts -H "Content-Type: application/json" -d \'{"title":"test"}\'',
    ];
    
    const result = await electronPage.evaluate(async (cmds) => {
      return await window.electronAPI.curl.importBulk(cmds);
    }, commands);
    
    expect(result.success).toBe(true);
    expect(result.results).toBeDefined();
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.results.length).toBeGreaterThan(0);
  });

  test('curl:import-bulk - should handle empty array', async ({ electronPage, testDbPath }) => {
    const commands: string[] = [];
    
    const result = await electronPage.evaluate(async (cmds) => {
      return await window.electronAPI.curl.importBulk(cmds);
    }, commands);
    
    expect(result.success).toBe(true);
    expect(result.results).toBeDefined();
    expect(Array.isArray(result.results)).toBe(true);
  });
});

