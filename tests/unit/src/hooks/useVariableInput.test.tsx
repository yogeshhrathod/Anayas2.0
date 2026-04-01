import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVariableInput } from '../../../../src/hooks/useVariableInput';

// Mock dependecies
vi.mock('../../../../src/hooks/useVariableResolution', () => ({
  useAvailableVariables: () => [
    { name: 'var1', value: 'val1', scope: 'global' },
    { name: 'var2', value: 'val2', scope: 'collection' },
    { name: '$dyn', value: 'val3', scope: 'dynamic' },
  ],
}));

vi.mock('../../../../src/hooks/useClickOutside', () => ({
  useClickOutside: vi.fn(),
}));

describe('useVariableInput', () => {
  const onChange = vi.fn();

  it('should initialize with autocomplete off', () => {
    const { result } = renderHook(() => useVariableInput({ value: '', onChange }));
    expect(result.current.showAutocomplete).toBe(false);
  });

  it('should show autocomplete when {{ is typed', () => {
    const { result } = renderHook(() => useVariableInput({ value: '', onChange }));
    
    act(() => {
      const event = { 
          target: { value: '{{', selectionStart: 2 },
      } as any;
      result.current.handleChange(event);
    });

    expect(result.current.showAutocomplete).toBe(true);
    expect(result.current.searchTerm).toBe('');
    expect(onChange).toHaveBeenCalledWith('{{');
  });

  it('should show dynamic only when {{$ is typed', () => {
    const { result } = renderHook(() => useVariableInput({ value: '', onChange }));
    
    act(() => {
      const event = { 
          target: { value: '{{$', selectionStart: 3 },
      } as any;
      result.current.handleChange(event);
    });

    expect(result.current.showAutocomplete).toBe(true);
    expect(result.current.showOnlyDynamic).toBe(true);
  });

  it('should update search term as user types', () => {
    const { result } = renderHook(() => useVariableInput({ value: '{{v', onChange }));
    
    act(() => {
      const event = { 
          target: { value: '{{va', selectionStart: 4 },
      } as any;
      result.current.handleChange(event);
    });

    expect(result.current.showAutocomplete).toBe(true);
    expect(result.current.searchTerm).toBe('va');
  });

  it('should handle autocomplete selection', () => {
    // We need to provide a mock for inputRef.current
    const { result } = renderHook(() => useVariableInput({ value: '{{', onChange }));
    
    // Manually set inputRef.current for the test
    const mockInput = {
        selectionStart: 2,
        focus: vi.fn(),
        setSelectionRange: vi.fn(),
    };
    (result.current.inputRef as any).current = mockInput;

    act(() => {
      result.current.handleAutocompleteSelect('var1');
    });

    expect(onChange).toHaveBeenCalledWith('{{var1}}');
    expect(result.current.showAutocomplete).toBe(false);
  });

  it('should not show autocomplete if inside closed braces', () => {
    const { result } = renderHook(() => useVariableInput({ value: '{{var}}', onChange }));
    
    act(() => {
      const event = { 
          target: { value: '{{var}} ', selectionStart: 8 },
      } as any;
      result.current.handleChange(event);
    });

    expect(result.current.showAutocomplete).toBe(false);
  });

  it('should close autocomplete on handleClose', () => {
     const { result } = renderHook(() => useVariableInput({ value: '{{', onChange }));
     act(() => {
         result.current.handleClose();
     });
     expect(result.current.showAutocomplete).toBe(false);
  });
});
