import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { useToastNotifications } from '../../../../src/hooks/useToastNotifications';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }
}));

describe('useToastNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show success toast', () => {
    const { result } = renderHook(() => useToastNotifications());
    result.current.showSuccess('All good');
    
    expect(toast.success).toHaveBeenCalledWith('Success', expect.objectContaining({
      description: 'All good',
      duration: 3000
    }));
  });

  it('should show error toast with details', () => {
    const { result } = renderHook(() => useToastNotifications());
    result.current.showError('Bad request', 'Timeout');
    
    expect(toast.error).toHaveBeenCalledWith('Error', expect.objectContaining({
      description: 'Bad request: Timeout',
      duration: 5000
    }));
  });

  it('should show warning toast', () => {
    const { result } = renderHook(() => useToastNotifications());
    result.current.showWarning('Careful');
    
    expect(toast.warning).toHaveBeenCalledWith('Warning', expect.objectContaining({
      description: 'Careful',
      duration: 4000
    }));
  });
});

