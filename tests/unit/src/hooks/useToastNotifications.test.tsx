import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastNotifications } from '../../../../src/hooks/useToastNotifications';

// Mock useToast
const mockToast = vi.fn();
vi.mock('../../../../src/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

describe('useToastNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show success toast', () => {
    const { result } = renderHook(() => useToastNotifications());
    result.current.showSuccess('All good');
    
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Success',
      description: 'All good',
      variant: 'default'
    }));
  });

  it('should show error toast with details', () => {
    const { result } = renderHook(() => useToastNotifications());
    result.current.showError('Bad request', 'Timeout');
    
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error',
      description: 'Bad request: Timeout',
      variant: 'destructive'
    }));
  });

  it('should show warning toast', () => {
    const { result } = renderHook(() => useToastNotifications());
    result.current.showWarning('Careful');
    
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Warning',
      description: 'Careful'
    }));
  });
});
