import { describe, expect, it } from 'vitest';
import { parseCurlCommand, parseCurlCommands } from '../../../../src/lib/curl-parser';

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
    expect(() => parseCurlCommand('curl')).toThrow('Invalid cURL command');
  });

  it('should handle escaped quotes in arguments', () => {
    const curl = 'curl -d "{\\"quoted\\": \\"value\\"}" https://url';
    const request = parseCurlCommand(curl);
    expect(request.body).toBe('{"quoted": "value"}');
  });

  it('should default to POST when data is present', () => {
    const curl = 'curl https://api.example.com/users -d "name=John"';
    const request = parseCurlCommand(curl);
    
    expect(request.method).toBe('POST');
    expect(request.body).toBe('name=John');
  });

  it('should handle multiple data flags by concatenating them', () => {
    // Curl concatenates multiple -d flags with &
    const curl = 'curl https://api.example.com/users -d "name=John" -d "age=30"';
    const request = parseCurlCommand(curl);
    
    expect(request.body).toBe('name=John&age=30');
  });

  it('should handle --data-urlencode', () => {
    const curl = 'curl https://api.example.com/users --data-urlencode "name=John Doe"';
    const request = parseCurlCommand(curl);
    
    expect(request.body).toBe('name=John%20Doe');
  });

  it('should handle headers with empty values', () => {
    const curl = 'curl -H "X-Empty:" https://api.example.com';
    const request = parseCurlCommand(curl);
    
    expect(request.headers['X-Empty']).toBe('');
  });

  it('should handle headers with multiple colons', () => {
    const curl = 'curl -H "X-Custom: value:with:colons" https://api.example.com';
    const request = parseCurlCommand(curl);
    
    expect(request.headers['X-Custom']).toBe('value:with:colons');
  });

  it('should handle complex json body', () => {
    const curl = `curl -X POST https://api.example.com/data \\
      -H "Content-Type: application/json" \\
      -d '{"nested": {"array": [1, 2, 3], "bool": true}}'`;
    const request = parseCurlCommand(curl);
    expect(request.body).toBe('{"nested": {"array": [1, 2, 3], "bool": true}}');
  });

  it('should handle the user provided sample command', () => {
    const curl = `curl --location --request POST 'https://gateway.p01.eng.sjc01.qualys.com/auth/oidc' \\
--header 'clientId: fe604280-1274-4ff0-8d4b-b23fc369eecf' \\
--header 'clientSecret: RWr0QBWmDAgG7DE9Z1dn6a17mdloyAOc' \\
--header 'token: true'`;
    
    // Normalize like the UI does
    const normalized = curl.replace(/\\\n\s*/g, ' ');
    const request = parseCurlCommand(normalized);
    
    expect(request.method).toBe('POST');
    expect(request.url).toBe('https://gateway.p01.eng.sjc01.qualys.com/auth/oidc');
    expect(request.headers['clientId']).toBe('fe604280-1274-4ff0-8d4b-b23fc369eecf');
    expect(request.headers['clientSecret']).toBe('RWr0QBWmDAgG7DE9Z1dn6a17mdloyAOc');
    expect(request.headers['token']).toBe('true');
  });

  it('should handle basic auth with username only', () => {
    const curl = 'curl -u "user" https://api.com';
    const request = parseCurlCommand(curl);
    expect(request.auth.type).toBe('basic');
    expect(request.auth.username).toBe('user');
    expect(request.auth.password).toBe('');
  });

  it('should handle API key in lowercase headers', () => {
    const curl = 'curl -H "x-api-key: my-key" https://api.com';
    const request = parseCurlCommand(curl);
    expect(request.auth.type).toBe('apikey');
    expect(request.auth.apiKey).toBe('my-key');
    expect(request.auth.apiKeyHeader).toBe('X-API-Key');
  });

  it('should handle attached data flags like -d"value"', () => {
    const curl = 'curl -d"name=John" https://api.com';
    const request = parseCurlCommand(curl);
    expect(request.body).toBe('name=John');
  });

  it('should handle --data= flag', () => {
    const curl = 'curl --data=name=John https://api.com';
    const request = parseCurlCommand(curl);
    expect(request.body).toBe('name=John');
  });

  it('should use --url flag for the target URL', () => {
    const curl = 'curl --url https://api.com/v1 -X GET';
    const request = parseCurlCommand(curl);
    expect(request.url).toBe('https://api.com/v1');
  });

  it('should handle invalid URLs gracefully by matching URL and returning it', () => {
    const curl = 'curl https://not-a-valid-url-but-matches-regex';
    const request = parseCurlCommand(curl);
    expect(request.url).toBe('https://not-a-valid-url-but-matches-regex/');
    expect(request.queryParams).toEqual([]);
  });

  it('should handle bulk parsing with mixed success/failure', () => {
    const commands = [
      'curl https://api.com/1',
      'invalid command',
      'curl -X POST https://api.com/2 -d "foo=bar"'
    ];
    const results = parseCurlCommands(commands);
    
    expect(results).toHaveLength(3);
    expect(results[0].success).toBe(true);
    expect(results[0].request?.url).toBe('https://api.com/1');
    expect(results[1].success).toBe(false);
    expect(results[1].error).toBeDefined();
    expect(results[2].success).toBe(true);
    expect(results[2].request?.method).toBe('POST');
    expect(results[2].request?.body).toBe('foo=bar');
  });

  it('should handle URLs found after flags', () => {
    const curl = 'curl -X POST -H "Content-Type: application/json" https://api.com/data';
    const request = parseCurlCommand(curl);
    expect(request.url).toBe('https://api.com/data');
    expect(request.method).toBe('POST');
  });

  it('should handle --data-urlencode without a key-value pair', () => {
    const curl = 'curl --data-urlencode "just a value with spaces" https://api.com';
    const request = parseCurlCommand(curl);
    expect(request.body).toBe('just%20a%20value%20with%20spaces');
  });

  it('should handle completely invalid URL syntax by returning original URL', () => {
    // URL with characters that make new URL() throw
    const curl = 'curl "https://[" -X GET';
    const request = parseCurlCommand(curl);
    expect(request.url).toBe('https://[');
  });

  it('should throw error for only whitespaces after curl keyword', () => {
    expect(() => parseCurlCommand('curl   ')).toThrow('Invalid cURL command');
  });
});
