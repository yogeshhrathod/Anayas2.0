import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInlineEdit } from '../../../../src/hooks/useInlineEdit';

// Mock useToastNotifications
const mockShowError = vi.fn();
vi.mock('../../../../src/hooks/useToastNotifications', () => ({
  useToastNotifications: () => ({
    showError: mockShowError,
    showSuccess: vi.fn(),
  }),
}));

describe('useInlineEdit', () => {
  const initialValue = 'Initial Name';
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with initialValue', () => {
    const { result } = renderHook(() => useInlineEdit({ initialValue, onSave: mockOnSave }));
    expect(result.current.isEditing).toBe(false);
    expect(result.current.editValue).toBe(initialValue);
  });

  it('should start editing', () => {
    const { result } = renderHook(() => useInlineEdit({ initialValue, onSave: mockOnSave }));
    act(() => {
      result.current.startEdit();
    });
    expect(result.current.isEditing).toBe(true);
  });

  it('should cancel editing', () => {
    const { result } = renderHook(() => useInlineEdit({ initialValue, onSave: mockOnSave }));
    act(() => {
      result.current.startEdit();
      result.current.setEditValue('New Name');
      result.current.cancelEdit();
    });
    expect(result.current.isEditing).toBe(false);
    expect(result.current.editValue).toBe(initialValue);
  });

  it('should save editing if value changed', async () => {
    const { result } = renderHook(() => useInlineEdit({ initialValue, onSave: mockOnSave }));
    act(() => {
      result.current.startEdit();
      result.current.setEditValue('New Name');
    });
    await act(async () => {
      await result.current.saveEdit();
    });
    expect(mockOnSave).toHaveBeenCalledWith('New Name');
    expect(result.current.isEditing).toBe(false);
    expect(result.current.editValue).toBe('New Name');
  });

  it('should not save but cancel if value is same as initial', async () => {
    const { result } = renderHook(() => useInlineEdit({ initialValue, onSave: mockOnSave }));
    act(() => {
      result.current.startEdit();
    });
    await act(async () => {
      await result.current.saveEdit();
    });
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(result.current.isEditing).toBe(false);
  });

  it('should show error if value is empty', async () => {
    const { result } = renderHook(() => useInlineEdit({ initialValue, onSave: mockOnSave }));
    act(() => {
      result.current.startEdit();
      result.current.setEditValue('  ');
    });
    await act(async () => {
      await result.current.saveEdit();
    });
    expect(mockShowError).toHaveBeenCalledWith('Validation Error', 'Name cannot be empty');
    expect(result.current.isEditing).toBe(true);
  });

  it('should use custom validator', async () => {
    const validate = (val: string) => val === 'bad' ? 'Invalid name' : undefined;
    const { result } = renderHook(() => useInlineEdit({ initialValue, onSave: mockOnSave, validate }));
    act(() => {
      result.current.startEdit();
      result.current.setEditValue('bad');
    });
    await act(async () => {
      await result.current.saveEdit();
    });
    expect(mockShowError).toHaveBeenCalledWith('Validation Error', 'Invalid name');
    expect(result.current.isEditing).toBe(true);
  });

  it('should handle Enter key to save', async () => {
    const { result } = renderHook(() => useInlineEdit({ initialValue, onSave: mockOnSave }));
    act(() => {
      result.current.startEdit();
      result.current.setEditValue('Enter Save');
    });
    await act(async () => {
      result.current.handleKeyDown({ key: 'Enter', preventDefault: () => {} } as any);
    });
    expect(mockOnSave).toHaveBeenCalledWith('Enter Save');
  });

  it('should handle Escape key to cancel', () => {
    const { result } = renderHook(() => useInlineEdit({ initialValue, onSave: mockOnSave }));
    act(() => {
      result.current.startEdit();
      result.current.setEditValue('Escape Cancel');
      result.current.handleKeyDown({ key: 'Escape', preventDefault: () => {} } as any);
    });
    expect(result.current.isEditing).toBe(false);
    expect(result.current.editValue).toBe(initialValue);
  });
});
