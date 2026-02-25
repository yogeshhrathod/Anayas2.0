import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useFormValidation } from '../../../../src/hooks/useFormValidation';

describe('useFormValidation', () => {
  const schema = {
    name: { required: true, minLength: 3 },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    age: { custom: (val: any) => val < 18 ? 'Must be 18+' : undefined }
  };

  it('should initialize with no errors', () => {
    const { result } = renderHook(() => useFormValidation(schema));
    expect(result.current.errors).toEqual({});
    expect(result.current.isValid).toBe(true);
  });

  it('should validate single field correctly', () => {
    const { result } = renderHook(() => useFormValidation(schema));
    
    // Test required
    act(() => {
      const error = result.current.validateField('name', '');
      expect(error).toBe('name is required');
    });

    // Test minLength
    act(() => {
      const error = result.current.validateField('name', 'ab');
      expect(error).toBe('name must be at least 3 characters');
    });

    // Test success
    act(() => {
      const error = result.current.validateField('name', 'abc');
      expect(error).toBeUndefined();
    });
  });

  it('should validate whole form', () => {
    const { result } = renderHook(() => useFormValidation(schema));
    
    act(() => {
      const isValid = result.current.validateForm({
        name: 'Jo',
        email: 'invalid-email',
        age: 16
      });
      expect(isValid).toBe(false);
    });

    expect(result.current.errors.name).toBeDefined();
    expect(result.current.errors.email).toBeDefined();
    expect(result.current.errors.age).toBe('Must be 18+');
    expect(result.current.isValid).toBe(false);
  });

  it('should clear errors', () => {
    const { result } = renderHook(() => useFormValidation(schema));
    
    act(() => {
      result.current.setFieldError('name', 'Some error');
    });
    expect(result.current.errors.name).toBe('Some error');

    act(() => {
      result.current.clearFieldError('name');
    });
    expect(result.current.errors.name).toBeUndefined();
  });

  it('should handle touched state', () => {
    const { result } = renderHook(() => useFormValidation(schema));
    
    expect(result.current.touched.name).toBeFalsy();

    act(() => {
      result.current.touchField('name');
    });
    expect(result.current.touched.name).toBe(true);

    act(() => {
      result.current.touchAllFields();
    });
    expect(result.current.touched.email).toBe(true);
  });
});
