import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useVariableResolution } from '../../../../src/hooks/useVariableResolution';

// Mock the store
const mockStore = {
  currentEnvironment: {
    variables: {
      baseUrl: 'https://api.example.com',
      apiKey: 'secret-123'
    }
  },
  selectedRequest: {
    collectionId: 1
  },
  collections: [
    {
      id: 1,
      environments: [
        {
          id: 101,
          variables: {
            userId: 'user-456',
            token: 'auth-789'
          }
        }
      ],
      activeEnvironmentId: 101
    }
  ]
};

vi.mock('../../../../src/store/useStore', () => ({
  useStore: () => mockStore
}));

describe('useVariableResolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve global variables', () => {
    const { result } = renderHook(() => useVariableResolution('{{baseUrl}}/users'));
    expect(result.current.resolved).toBe('https://api.example.com/users');
    expect(result.current.unresolved).toHaveLength(0);
  });

  it('should resolve collection variables', () => {
    const { result } = renderHook(() => useVariableResolution('/users/{{userId}}'));
    expect(result.current.resolved).toBe('/users/user-456');
  });

  it('should handle prefixed variables', () => {
    const { result } = renderHook(() => useVariableResolution('{{global.apiKey}} and {{collection.token}}'));
    expect(result.current.resolved).toBe('secret-123 and auth-789');
  });

  it('should track unresolved variables', () => {
    const { result } = renderHook(() => useVariableResolution('{{missingVar}}'));
    expect(result.current.resolved).toBe('');
    expect(result.current.unresolved).toContain('missingVar');
  });

  it('should resolve dynamic variables', () => {
    const { result } = renderHook(() => useVariableResolution('{{$timestamp}}'));
    // Should be a number string
    expect(result.current.resolved).toMatch(/^\d+$/);
    expect(result.current.variables[0].scope).toBe('dynamic');
  });

  it('should resolve multiple variables in one string', () => {
    const { result } = renderHook(() => useVariableResolution('{{baseUrl}}/users/{{userId}}?key={{apiKey}}'));
    expect(result.current.resolved).toBe('https://api.example.com/users/user-456?key=secret-123');
  });

  it('should handle non-string or empty input', () => {
    // @ts-ignore
    const { result: emptyResult } = renderHook(() => useVariableResolution(null));
    expect(emptyResult.current.resolved).toBe('');

    const { result: stringResult } = renderHook(() => useVariableResolution('plain text'));
    expect(stringResult.current.resolved).toBe('plain text');
    expect(stringResult.current.variables).toHaveLength(0);
  });

  it('should prioritize collection variables over global when no prefix is used', () => {
    // Temporarily add a variable to global that exists in collection
    (mockStore.currentEnvironment.variables as any)['userId'] = 'wrong-user';
    
    const { result } = renderHook(() => useVariableResolution('{{userId}}'));
    expect(result.current.resolved).toBe('user-456'); // From collection
    
    delete (mockStore.currentEnvironment.variables as any)['userId'];
  });
});
