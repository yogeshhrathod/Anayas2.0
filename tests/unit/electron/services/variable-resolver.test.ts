import { describe, expect, it, vi } from 'vitest';
import { VariableResolver, VariableContext } from '../../../../electron/services/variable-resolver';

vi.mock('../../../../electron/services/logger', () => ({
  createLogger: () => ({
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('VariableResolver', () => {
  const resolver = new VariableResolver();
  const context: VariableContext = {
    globalVariables: {
      baseUrl: 'https://api.example.com',
      apiKey: 'secret-123'
    },
    collectionVariables: {
      userId: 'user-456',
      token: 'auth-789'
    }
  };

  describe('resolve', () => {
    it('should resolve global variables', () => {
      expect(resolver.resolve('{{baseUrl}}/users', context)).toBe('https://api.example.com/users');
    });

    it('should resolve collection variables', () => {
      expect(resolver.resolve('/users/{{userId}}', context)).toBe('/users/user-456');
    });

    it('should handle prefixed variables', () => {
      expect(resolver.resolve('{{global.apiKey}} and {{collection.token}}', context)).toBe('secret-123 and auth-789');
    });

    it('should prioritize collection variables over global when no prefix is used', () => {
      const mixedContext: VariableContext = {
        globalVariables: { var1: 'global-val' },
        collectionVariables: { var1: 'collection-val' }
      };
      expect(resolver.resolve('{{var1}}', mixedContext)).toBe('collection-val');
    });

    it('should return empty string for missing variables', () => {
      expect(resolver.resolve('{{missingVar}}', context)).toBe('');
    });

    it('should resolve dynamic variables', () => {
      expect(resolver.resolve('{{$timestamp}}', context)).toMatch(/^\d+$/);
      expect(resolver.resolve('{{$randomInt}}', context)).toMatch(/^\d+$/);
      expect(resolver.resolve('{{$guid}}', context)).toMatch(/^[0-9a-f-]{36}$/);
      expect(resolver.resolve('{{$uuid}}', context)).toMatch(/^[0-9a-f-]{36}$/);
      expect(resolver.resolve('{{$randomEmail}}', context)).toMatch(/^.+@example\.com$/);
      expect(resolver.resolve('{{$unknown}}', context)).toBe('');
    });

    it('should handle non-string inputs gracefully', () => {
      // @ts-ignore
      expect(resolver.resolve(null, context)).toBe(null);
      // @ts-ignore
      expect(resolver.resolve(undefined, context)).toBe(undefined);
    });
  });

  describe('resolveObject', () => {
    it('should resolve variables in objects recursively', () => {
      const obj = {
        url: '{{baseUrl}}/{{userId}}',
        headers: {
          'Authorization': 'Bearer {{token}}',
          'X-API-Key': '{{apiKey}}'
        },
        tags: ['tag1', '{{userId}}'],
        metadata: {
          id: 1,
          active: true
        }
      };

      const expected = {
        url: 'https://api.example.com/user-456',
        headers: {
          'Authorization': 'Bearer auth-789',
          'X-API-Key': 'secret-123'
        },
        tags: ['tag1', 'user-456'],
        metadata: {
          id: 1,
          active: true
        }
      };

      expect(resolver.resolveObject(obj, context)).toEqual(expected);
    });
  });

  describe('previewResolution', () => {
    it('should return resolved text and list of unresolved variables', () => {
      const text = '{{baseUrl}}/{{userId}}/{{missing1}} and {{global.missing2}}';
      const result = resolver.previewResolution(text, context);
      
      expect(result.resolved).toBe('https://api.example.com/user-456/ and ');
      expect(result.unresolved).toContain('missing1');
      expect(result.unresolved).toContain('missing2');
    });

    it('should handle empty input in previewResolution', () => {
      // @ts-ignore
      expect(resolver.previewResolution(null, context)).toEqual({ resolved: null, unresolved: [] });
    });
  });
});
