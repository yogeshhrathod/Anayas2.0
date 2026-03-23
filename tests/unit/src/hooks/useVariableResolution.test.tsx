import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAvailableVariables, useVariableResolution } from '../../../../src/hooks/useVariableResolution';
import { useStore } from '../../../../src/store/useStore';

// Mock the store
const mockStore = {
    currentEnvironment: {
        id: 1,
        name: 'Default',
        variables: {
            baseUrl: 'https://api.example.com',
            apiKey: 'secret-123'
        }
    },
    selectedRequest: {
        id: 1,
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
                },
                {
                    id: 102,
                    variables: {
                        userId: 'user-789',
                        token: 'auth-000'
                    }
                }
            ],
            activeEnvironmentId: 101
        }
    ]
};

vi.mock('../../../../src/store/useStore', () => ({
    useStore: vi.fn(() => mockStore)
}));

describe('useVariableResolution', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mockStore to default state
        mockStore.collections[0].activeEnvironmentId = 101;
        mockStore.selectedRequest.collectionId = 1;
        mockStore.currentEnvironment.variables = {
            baseUrl: 'https://api.example.com',
            apiKey: 'secret-123'
        };
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
        const { result: timestamp } = renderHook(() => useVariableResolution('{{$timestamp}}'));
        expect(timestamp.current.resolved).toMatch(/^\d+$/);

        const { result: randomInt } = renderHook(() => useVariableResolution('{{$randomInt}}'));
        expect(randomInt.current.resolved).toMatch(/^\d+$/);

        const { result: guid } = renderHook(() => useVariableResolution('{{$guid}}'));
        expect(guid.current.resolved).toMatch(/^[0-9a-f-]{36}$/);

        const { result: uuid } = renderHook(() => useVariableResolution('{{$uuid}}'));
        expect(uuid.current.resolved).toMatch(/^[0-9a-f-]{36}$/);

        const { result: randomEmail } = renderHook(() => useVariableResolution('{{$randomEmail}}'));
        expect(randomEmail.current.resolved).toMatch(/^.+@example\.com$/);

        const { result: unknown } = renderHook(() => useVariableResolution('{{$unknown}}'));
        expect(unknown.current.resolved).toBe('');
        expect(unknown.current.unresolved).toContain('unknown');
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
        (mockStore.currentEnvironment.variables as any)['userId'] = 'wrong-user';
        const { result } = renderHook(() => useVariableResolution('{{userId}}'));
        expect(result.current.resolved).toBe('user-456');
    });

    it('should fallback to first environment if activeEnvironmentId is missing or invalid', () => {
        // Missing activeEnvironmentId
        mockStore.collections[0].activeEnvironmentId = undefined as any;
        const { result: missingResult } = renderHook(() => useVariableResolution('{{userId}}'));
        expect(missingResult.current.resolved).toBe('user-456');

        // Invalid activeEnvironmentId
        mockStore.collections[0].activeEnvironmentId = 999 as any;
        const { result: invalidResult } = renderHook(() => useVariableResolution('{{userId}}'));
        expect(invalidResult.current.resolved).toBe('user-456');
    });
});

describe('useAvailableVariables', () => {
    it('should return all available variables including dynamic ones', () => {
        const { result } = renderHook(() => useAvailableVariables());
        
        // Dynamic variables (5) + Global variables (2) + Collection variables (2) = 9
        expect(result.current.length).toBeGreaterThanOrEqual(9);
        
        expect(result.current).toContainEqual(expect.objectContaining({ name: '$timestamp', scope: 'dynamic' }));
        expect(result.current).toContainEqual(expect.objectContaining({ name: 'baseUrl', scope: 'global' }));
        expect(result.current).toContainEqual(expect.objectContaining({ name: 'userId', scope: 'collection' }));
    });

    it('should handle missing collection and environment', () => {
        vi.mocked(useStore).mockReturnValueOnce({
            currentEnvironment: null as any,
            selectedRequest: null as any,
            collections: []
        });

        const { result } = renderHook(() => useAvailableVariables());
        // Only dynamic variables
        expect(result.current.every(v => v.scope === 'dynamic')).toBe(true);
    });
});

