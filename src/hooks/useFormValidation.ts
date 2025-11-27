/**
 * useFormValidation - Form validation logic with error handling
 * 
 * Provides a standardized form validation system with:
 * - Field-level validation
 * - Form-level validation
 * - Error state management
 * - Custom validation rules
 * 
 * @example
 * ```tsx
 * const {
 *   errors,
 *   validateField,
 *   validateForm,
 *   clearErrors,
 *   isValid
 * } = useFormValidation({
 *   name: { required: true, minLength: 2 },
 *   email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
 * });
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import { ValidationSchema } from '../types/forms';

export interface FormValidationState {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

export interface FormValidationActions {
  validateField: (field: string, value: unknown) => string | undefined;
  validateForm: (data: Record<string, any>) => boolean;
  setFieldError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;
  touchField: (field: string) => void;
  touchAllFields: () => void;
}

export function useFormValidation(schema: ValidationSchema) {
  const [state, setState] = useState<FormValidationState>({
    errors: {},
    touched: {}
  });

  const validateField = useCallback((field: string, value: unknown): string | undefined => {
    const rules = schema[field];
    if (!rules) return undefined;

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return undefined;
    }

    // Min length validation
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      return `${field} must be at least ${rules.minLength} characters`;
    }

    // Max length validation
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      return `${field} cannot exceed ${rules.maxLength} characters`;
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      return `${field} format is invalid`;
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }

    return undefined;
  }, [schema]);

  const validateForm = useCallback((data: Record<string, any>): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    Object.keys(schema).forEach(field => {
      const error = validateField(field, data[field]);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });

    setState(prev => ({
      ...prev,
      errors,
      touched: Object.keys(schema).reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as Record<string, boolean>)
    }));

    return isValid;
  }, [schema, validateField]);

  const setFieldError = useCallback((field: string, error: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: error }
    }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[field];
      return {
        ...prev,
        errors: newErrors
      };
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {}
    }));
  }, []);

  const touchField = useCallback((field: string) => {
    setState(prev => ({
      ...prev,
      touched: { ...prev.touched, [field]: true }
    }));
  }, []);

  const touchAllFields = useCallback(() => {
    const touched = Object.keys(schema).reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);

    setState(prev => ({
      ...prev,
      touched
    }));
  }, [schema]);

  const isValid = useMemo(() => {
    return Object.keys(state.errors).length === 0;
  }, [state.errors]);

  const hasErrors = useMemo(() => {
    return Object.keys(state.errors).length > 0;
  }, [state.errors]);

  return {
    errors: state.errors,
    touched: state.touched,
    isValid,
    hasErrors,
    validateField,
    validateForm,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    touchField,
    touchAllFields
  };
}
