/**
 * EnvironmentForm - Form component for creating and editing environments
 *
 * Features:
 * - Form validation with error display
 * - Environment variables management
 * - Base URL validation
 * - Default environment toggle
 * - Save/Cancel actions
 *
 * @example
 * ```tsx
 * <EnvironmentForm
 *   environment={editingEnvironment}
 *   onSave={handleSave}
 *   onCancel={handleCancel}
 *   isLoading={isSaving}
 * />
 * ```
 */

import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { EnvironmentVariable } from '../EnvironmentVariable';
import { Environment } from '../../types/entities';
import { EnvironmentFormData } from '../../types/forms';
import { useFormValidation } from '../../hooks/useFormValidation';

export interface EnvironmentFormProps {
  environment?: Environment | null;
  onSave: (data: EnvironmentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface EnvironmentFormRef {
  submit: () => void;
}

const validationSchema = {
  name: {
    required: true,
    minLength: 2,
    pattern: /^[a-z0-9_-]+$/i,
    message: 'Name can only contain letters, numbers, hyphens, and underscores',
  },
  display_name: {
    required: true,
    minLength: 2,
    message: 'Display name must be at least 2 characters',
  },
  base_url: {
    pattern: /^https?:\/\/.+/,
    message: 'Valid URL is required (e.g., https://api.example.com)',
  },
};

export const EnvironmentForm = forwardRef<
  EnvironmentFormRef,
  EnvironmentFormProps
>(
  (
    { environment, onSave, onCancel: _onCancel, isLoading: _isLoading = false },
    ref
  ) => {
    const [formData, setFormData] = useState<EnvironmentFormData>({
      name: '',
      display_name: '',
      base_url: '',
      variables: {},
      is_default: false,
    });

    const { errors, validateField, validateForm, clearFieldError } =
      useFormValidation(validationSchema);

    useEffect(() => {
      if (environment) {
        setFormData({
          name: environment.name,
          display_name: environment.displayName,
          base_url: environment.variables?.base_url || '',
          variables: environment.variables || {},
          is_default: !!environment.isDefault,
        });
      }
    }, [environment]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (validateForm(formData)) {
        await onSave(formData);
      }
    };

    const handleInputChange = (
      field: keyof EnvironmentFormData,
      value: any
    ) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      clearFieldError(field);
    };

    const handleVariableChange = (variables: Record<string, string>) => {
      setFormData(prev => ({ ...prev, variables }));
    };

    // Expose submit handler for parent component
    useImperativeHandle(ref, () => ({
      submit: () => {
        handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      },
    }));

    return (
      <form onSubmit={handleSubmit} className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
          {/* Left Column: Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                onBlur={() => validateField('name', formData.name)}
                className={errors.name ? 'border-red-500' : ''}
                placeholder="e.g., production, staging"
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={e =>
                  handleInputChange('display_name', e.target.value)
                }
                onBlur={() =>
                  validateField('display_name', formData.display_name)
                }
                className={errors.display_name ? 'border-red-500' : ''}
                placeholder="e.g., Production API"
              />
              {errors.display_name && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.display_name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="base_url">Base URL</Label>
              <Input
                id="base_url"
                value={formData.base_url}
                onChange={e => handleInputChange('base_url', e.target.value)}
                onBlur={() => validateField('base_url', formData.base_url)}
                className={errors.base_url ? 'border-red-500' : ''}
                placeholder="https://api.example.com"
              />
              {errors.base_url && (
                <p className="text-sm text-red-500 mt-1">{errors.base_url}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={e =>
                  handleInputChange('is_default', e.target.checked)
                }
                className="rounded"
              />
              <Label htmlFor="is_default">Set as default</Label>
            </div>
          </div>

          {/* Right Column: Environment Variables */}
          <div className="flex-1">
            <EnvironmentVariable
              variables={formData.variables}
              onVariablesChange={handleVariableChange}
              title=""
              description=""
            />
          </div>
        </div>
      </form>
    );
  }
);

EnvironmentForm.displayName = 'EnvironmentForm';
