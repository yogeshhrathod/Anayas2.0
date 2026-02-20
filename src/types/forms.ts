/**
 * Form-related type definitions
 * Common form data structures and validation patterns
 */

export interface ValidationErrors {
  [key: string]: string | undefined;
}

export interface FormFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  description?: string;
}

export interface CollectionFormData {
  name: string;
  description: string;
  documentation?: string; // Markdown documentation
  environments?: Array<{ id?: number; name: string; variables: Record<string, string> }>;
  isFavorite: boolean;
}

export interface EnvironmentFormData {
  name: string;
  display_name: string;
  base_url: string;
  variables: Record<string, string>;
  is_default: boolean;
}

export interface RequestFormData {
  id?: number | string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: Record<string, string>;
  body: string;
  queryParams: Array<{ key: string; value: string; enabled: boolean }>;
  auth: {
    type: 'none' | 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
  collectionId?: number;
  folderId?: number;
  isFavorite: boolean;
}

export interface SettingsFormData {
  requestTimeout: number;
  maxHistory: number;
  followRedirects: boolean;
  sslVerification: boolean;
  autoSaveRequests: boolean;
}

export interface SaveRequestDialogData {
  name: string;
  collectionId: number;
  folderId?: number;
}

export interface InputDialogData {
  value: string;
}

// Validation rule types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

// Form state types
export interface FormState<T> {
  data: T;
  errors: ValidationErrors;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

export interface FormAction<T> {
  type: 'SET_FIELD' | 'SET_ERROR' | 'SET_SUBMITTING' | 'RESET' | 'SET_DATA';
  field?: keyof T;
  value?: any;
  error?: string;
  data?: T;
}
