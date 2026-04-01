import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfirmation } from '../../../../src/hooks/useConfirmation';

// Mock useStore
const mockSetConfirmState = vi.fn();
vi.mock('../../../../src/store/useStore', () => ({
  useStore: (selector: any) => {
      // The hook uses: state => state.setConfirmState
      return mockSetConfirmState;
  },
}));

describe('useConfirmation', () => {
  it('should return a confirm function', () => {
    const { result } = renderHook(() => useConfirmation());
    expect(typeof result.current.confirm).toBe('function');
  });

  it('should set confirm state and resolve when called', async () => {
    const { result } = renderHook(() => useConfirmation());
    const options = { title: 'Test', message: 'Ready?' };
    
    let resolvedValue: boolean | undefined;
    const promise = result.current.confirm(options).then(val => {
        resolvedValue = val;
        return val;
    });

    expect(mockSetConfirmState).toHaveBeenCalledWith(expect.objectContaining({
      isOpen: true,
      options
    }));

    // Extract the resolve function from the mock call
    const callArgs = mockSetConfirmState.mock.calls[0][0];
    const internalResolve = callArgs.resolve;

    await act(async () => {
        internalResolve(true);
    });

    expect(resolvedValue).toBe(true);
    expect(mockSetConfirmState).toHaveBeenCalledWith({ isOpen: false });
  });

  it('should resolve false when internal resolve is called with false', async () => {
    const { result } = renderHook(() => useConfirmation());
    const promise = result.current.confirm({ title: 'T', message: 'M' });
    
    const internalResolve = mockSetConfirmState.mock.calls[mockSetConfirmState.mock.calls.length - 1][0].resolve;
    
    await act(async () => {
        internalResolve(false);
    });

    const val = await promise;
    expect(val).toBe(false);
  });
});
