import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEntityCRUD } from '../../../../src/hooks/useEntityCRUD';

// Mock useToast
const mockToast = vi.fn();
vi.mock('../../../../src/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

describe('useEntityCRUD', () => {
  const config = {
    createFn: vi.fn(),
    updateFn: vi.fn(),
    deleteFn: vi.fn(),
    onSuccess: vi.fn(),
    onError: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle successful creation', async () => {
    config.createFn.mockResolvedValue({ id: 1, name: 'New' });
    const { result } = renderHook(() => useEntityCRUD(config));

    let createResult;
    await act(async () => {
      createResult = await result.current.create({ name: 'New' });
    });

    expect(createResult).toEqual({ id: 1, name: 'New' });
    expect(result.current.isLoading).toBe(false);
    expect(config.onSuccess).toHaveBeenCalledWith('Create', expect.anything());
  });

  it('should handle failed removal', async () => {
    config.deleteFn.mockRejectedValue(new Error('Delete failed'));
    const { result } = renderHook(() => useEntityCRUD(config));

    await act(async () => {
      try {
        await result.current.remove(1);
      } catch (e) {
        // expected
      }
    });

    expect(result.current.error).toBe('Delete failed');
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'destructive'
    }));
  });

  it('should set updating state', async () => {
    let resolveFn: any;
    const updatePromise = new Promise(resolve => { resolveFn = resolve; });
    config.updateFn.mockReturnValue(updatePromise);
    
    const { result } = renderHook(() => useEntityCRUD(config));

    let actPromise: any;
    act(() => {
      actPromise = result.current.update({ id: 1 });
    });

    expect(result.current.isUpdating).toBe(true);

    await act(async () => {
      resolveFn({ id: 1 });
      await actPromise;
    });

    expect(result.current.isUpdating).toBe(false);
  });
});
