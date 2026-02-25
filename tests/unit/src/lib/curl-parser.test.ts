import { describe, expect, it } from 'vitest';
import { parseCurlCommand } from '../../../../src/lib/curl-parser';

describe('curl-parser', () => {
  it('should parse a basic GET request', () => {
    const curl = 'curl https://api.example.com/users';
    const request = parseCurlCommand(curl);
    
    expect(request.method).toBe('GET');
    expect(request.url).toBe('https://api.example.com/users');
    expect(request.headers).toEqual({});
  });

  it('should parse a POST request with headers and data', () => {
    const curl = `curl -X POST https://api.example.com/users \\
      -H "Content-Type: application/json" \\
      -d '{"name": "John Doe"}'`;
    const request = parseCurlCommand(curl);
    
    expect(request.method).toBe('POST');
    expect(request.url).toBe('https://api.example.com/users');
    expect(request.headers['Content-Type']).toBe('application/json');
    expect(request.body).toBe('{"name": "John Doe"}');
  });

  it('should parse query parameters from the URL', () => {
    const curl = 'curl "https://api.example.com/users?page=1&limit=10"';
    const request = parseCurlCommand(curl);
    
    expect(request.url).toBe('https://api.example.com/users');
    expect(request.queryParams).toContainEqual({ key: 'page', value: '1', enabled: true });
    expect(request.queryParams).toContainEqual({ key: 'limit', value: '10', enabled: true });
  });

  it('should handle bearer token auth from headers', () => {
    const curl = 'curl -H "Authorization: Bearer my-token" https://api.example.com';
    const request = parseCurlCommand(curl);
    
    expect(request.auth.type).toBe('bearer');
    expect(request.auth.token).toBe('my-token');
  });

  it('should handle basic auth flags', () => {
    const curl = 'curl -u admin:password123 https://api.example.com';
    const request = parseCurlCommand(curl);
    
    expect(request.auth.type).toBe('basic');
    expect(request.auth.username).toBe('admin');
    expect(request.auth.password).toBe('password123');
  });

  it('should handle API key headers', () => {
    const curl = 'curl -H "X-Api-Key: secret-key" https://api.example.com';
    const request = parseCurlCommand(curl);
    
    expect(request.auth.type).toBe('apikey');
    expect(request.auth.apiKey).toBe('secret-key');
    expect(request.auth.apiKeyHeader).toBe('X-Api-Key');
  });

  it('should parse multiple headers', () => {
    const curl = 'curl -H "X-A: 1" -H "X-B: 2" https://api.example.com';
    const request = parseCurlCommand(curl);
    
    expect(request.headers['X-A']).toBe('1');
    expect(request.headers['X-B']).toBe('2');
  });

  it('should handle different data flags', () => {
    expect(parseCurlCommand('curl -d "body" https://url').body).toBe('body');
    expect(parseCurlCommand('curl --data "body" https://url').body).toBe('body');
    expect(parseCurlCommand('curl --data-raw "body" https://url').body).toBe('body');
  });

  it('should throw error for empty or invalid command', () => {
    expect(() => parseCurlCommand('')).toThrow('Empty cURL command');
    expect(() => parseCurlCommand('   ')).toThrow('Empty cURL command');
    expect(() => parseCurlCommand('curl')).toThrow('URL not found');
  });

  it('should handle escaped quotes in arguments', () => {
    const curl = 'curl -d "{\\"quoted\\": \\"value\\"}" https://url';
    const request = parseCurlCommand(curl);
    expect(request.body).toBe('{"quoted": "value"}');
  });
});
