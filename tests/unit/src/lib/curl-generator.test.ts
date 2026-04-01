import { describe, expect, it } from 'vitest';
import { generateCurlCommand } from '../../../../src/lib/curl-generator';

describe('curl-generator (renderer)', () => {
  it('should generate a basic GET command', () => {
    const request = {
      method: 'GET',
      url: 'https://api.example.com/users',
      headers: {},
      queryParams: [],
      auth: { type: 'none' }
    };
    expect(generateCurlCommand(request)).toBe('curl https://api.example.com/users');
  });

  it('should generate a POST command with JSON body', () => {
    const request = {
      method: 'POST',
      url: 'https://api.example.com/users',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"John"}',
      queryParams: [],
      auth: { type: 'none' }
    };
    const result = generateCurlCommand(request);
    expect(result).toContain('-X POST');
    expect(result).toContain('--data-raw \'{"name":"John"}\'');
  });

  it('should handle query parameters', () => {
    const request = {
      method: 'GET',
      url: 'https://api.example.com/users',
      queryParams: [
        { key: 'page', value: '1', enabled: true },
        { key: 'limit', value: '10', enabled: false }
      ],
      auth: { type: 'none' }
    };
    expect(generateCurlCommand(request)).toBe('curl \'https://api.example.com/users?page=1\'');
  });

  it('should handle manual query string parsing for invalid URLs', () => {
    const request = {
      url: '{{baseUrl}}/path',
      method: 'GET',
      queryParams: [
        { key: 'a', value: '1', enabled: true },
        { key: 'b', value: '2', enabled: false }
      ],
      auth: { type: 'none' }
    };
    const res = generateCurlCommand(request);
    expect(res).toBe('curl \'{{baseUrl}}/path?a=1\'');
  });

  it('should include bearer token auth', () => {
    const request = {
      method: 'GET',
      url: 'https://api.example.com/me',
      auth: { type: 'bearer', token: 'my-token' }
    };
    const result = generateCurlCommand(request);
    expect(result).toContain('-H \'Authorization: Bearer my-token\'');
  });

  it('should handle form-data body', () => {
    const request = {
      method: 'POST',
      url: 'https://api.com/up',
      bodyType: 'form-data',
      bodyFormData: [
        { key: 'file', value: 'v', enabled: true },
        { key: 'desc', value: 'm', enabled: true }
      ],
      auth: { type: 'none' }
    };
    const result = generateCurlCommand(request);
    expect(result).toContain("-F 'file=v'");
    expect(result).toContain("-F 'desc=m'");
  });

  it('should handle x-www-form-urlencoded body', () => {
    const request = {
      method: 'POST',
      url: 'https://api.example.com/login',
      bodyType: 'x-www-form-urlencoded',
      bodyFormData: [
        { key: 'username', value: 'admin', enabled: true },
        { key: 'password', value: 'secret 123', enabled: true }
      ],
      auth: { type: 'none' }
    };
    const result = generateCurlCommand(request);
    expect(result).toContain("--data-urlencode 'username=admin'");
    expect(result).toContain("--data-urlencode 'password=secret 123'");
  });

  it('should include basic auth with credentials', () => {
    const request = {
      method: 'GET',
      url: 'https://api.example.com/me',
      auth: { type: 'basic', username: 'admin', password: 'password123' }
    };
    const result = generateCurlCommand(request);
    expect(result).toContain("-u admin:password123");
  });

  it('should include basic auth with username only', () => {
    const request = {
      method: 'GET',
      url: 'https://api.example.com/me',
      auth: { type: 'basic', username: 'admin' }
    };
    const result = generateCurlCommand(request);
    expect(result).toContain("-u admin");
  });

  it('should include apikey auth', () => {
    const request = {
      method: 'GET',
      url: 'https://api.example.com/me',
      auth: { type: 'apikey', apiKey: 'my-key', apiKeyHeader: 'X-API-Key' }
    };
    const result = generateCurlCommand(request);
    expect(result).toContain("-H 'X-API-Key: my-key'");
  });

  it('should skip headers that are already handled by auth', () => {
    const request = {
      method: 'GET',
      url: 'https://api.example.com/me',
      headers: { 'Authorization': 'Old Bearer', 'Content-Type': 'application/json' },
      auth: { type: 'bearer', token: 'new-token' }
    };
    const result = generateCurlCommand(request);
    // Flexible regex to handle potential multi-line formatting with backslashes
    expect(result).toMatch(/-H\s+([\\\s\n]*)'Authorization: Bearer new-token'/);
    expect(result).not.toContain('Old Bearer');
    expect(result).toMatch(/-H\s+([\\\s\n]*)'Content-Type: application\/json'/);
  });

  it('should handle headers with empty keys', () => {
    const request = {
      method: 'GET',
      url: 'https://api.example.com',
      headers: { '': 'value', ' ': 'value2', 'Valid': 'Value3' }
    };
    const result = generateCurlCommand(request);
    expect(result).not.toContain('value');
    expect(result).toContain("-H 'Valid: Value3'");
  });

  it('should escape strings with single quotes properly', () => {
    const request = {
      method: 'POST',
      url: 'https://api.com',
      body: "It's a test"
    };
    const result = generateCurlCommand(request);
    expect(result).toContain("'It'\\''s a test'");
  });

  it('should format long commands as multi-line', () => {
    const request = {
      method: 'POST',
      url: 'https://api.example.com/very/long/path/to/trigger/multiline/formatting/logic/if/possible',
      headers: {
        'X-Long-Header-A': 'value-a-long-one-that-adds-length',
        'X-Long-Header-B': 'value-b-long-one-that-adds-length',
        'X-Long-Header-C': 'value-c-long-one-that-adds-length'
      },
      body: '{"data":"some random data just to make it even longer than the 80 character limit commonly used in these formatters"}'
    };
    const result = generateCurlCommand(request);
    expect(result).toContain('\\\n');
    expect(result).toContain('  -H');
  });

  it('should handle buildUrl failures gracefully by manual query string construction', () => {
    const request = {
      url: 'http://[::1', // Invalid URL
      method: 'GET',
      queryParams: [
        { key: 'a', value: '1', enabled: true },
        { key: 'b', value: '2', enabled: true }
      ]
    };
    const result = generateCurlCommand(request);
    expect(result).toContain('http://[::1?a=1&b=2');
  });

  it('should handles manual query string construction with existing query', () => {
    const request = {
      url: 'http://[::1?existing=true', // Invalid URL with query
      method: 'GET',
      queryParams: [
        { key: 'a', value: '1', enabled: true }
      ]
    };
    const result = generateCurlCommand(request);
    expect(result).toContain('http://[::1?existing=true&a=1');
  });
});
