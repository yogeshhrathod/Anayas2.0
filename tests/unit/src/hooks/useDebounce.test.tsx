import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDebounce } from '../../../../src/hooks/useDebounce';

describe('useDebounce', () => {
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should update value after delay', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    // Change value
    rerender({ value: 'updated' });
    
    // Should still be initial immediately
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
    vi.useRealTimers();
  });

  it('should clear timeout on unmount', () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useDebounce('value', 500));
    
    const spy = vi.spyOn(global, 'clearTimeout');
    unmount();
    expect(spy).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
