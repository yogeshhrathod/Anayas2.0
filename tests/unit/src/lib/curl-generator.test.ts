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
});
