import { describe, expect, it } from 'vitest';
import { generateDraftName } from '../../../../src/lib/draftNaming';

describe('draftNaming', () => {
  it('should return "New Request" for empty URL', () => {
    expect(generateDraftName('GET', '')).toBe('New Request');
    expect(generateDraftName('GET', '  ')).toBe('New Request');
  });

  it('should use the hostname if no path is provided', () => {
    expect(generateDraftName('GET', 'https://api.example.com')).toBe('api.example.com');
    expect(generateDraftName('GET', 'https://www.example.org/')).toBe('example.org');
  });

  it('should use the last path segments for context', () => {
    expect(generateDraftName('GET', 'https://api.example.com/v1/users')).toBe('v1 / users');
    expect(generateDraftName('GET', 'https://api.example.com/v1/users/123')).toBe('users / 123');
  });

  it('should handle single path segments', () => {
    expect(generateDraftName('GET', 'https://api.example.com/ping')).toBe('ping');
  });

  it('should fallback to string processing if URL parsing fails', () => {
    expect(generateDraftName('GET', 'http://localhost')).toBe('localhost');
    expect(generateDraftName('GET', 'api/users')).toBe('api');
  });
});
