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

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { FormSection } from '../shared/FormSection';
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

const validationSchema = {
  name: {
    required: true,
    minLength: 2,
    pattern: /^[a-z0-9_-]+$/i,
    message: 'Name can only contain letters, numbers, hyphens, and underscores'
  },
  display_name: {
    required: true,
    minLength: 2,
    message: 'Display name must be at least 2 characters'
  },
  base_url: {
    pattern: /^https?:\/\/.+/,
    message: 'Valid URL is required (e.g., https://api.example.com)'
  }
};

export const EnvironmentForm: React.FC<EnvironmentFormProps> = ({
  environment,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<EnvironmentFormData>({
    name: '',
    display_name: '',
    base_url: '',
    variables: {},
    is_default: false
  });

  const { errors, validateField, validateForm, clearFieldError } = useFormValidation(validationSchema);

  useEffect(() => {
    if (environment) {
      setFormData({
        name: environment.name,
        display_name: environment.display_name,
        base_url: environment.variables?.base_url || '',
        variables: environment.variables || {},
        is_default: environment.is_default === 1
      });
    }
  }, [environment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm(formData)) {
      await onSave(formData);
    }
  };

  const handleInputChange = (field: keyof EnvironmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const handleVariableChange = (variables: Record<string, string>) => {
    setFormData(prev => ({ ...prev, variables }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{environment ? 'Edit Environment' : 'New Environment'}</CardTitle>
        <CardDescription>
          {environment ? 'Update environment details and variables' : 'Create a new environment with variables'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormSection title="Basic Information" description="Environment name and display information">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onBlur={() => validateField('name', formData.name)}
                  className={errors.name ? 'border-red-500' : ''}
                  placeholder="e.g., production, staging, development"
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
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  onBlur={() => validateField('display_name', formData.display_name)}
                  className={errors.display_name ? 'border-red-500' : ''}
                  placeholder="e.g., Production API, Staging Environment"
                />
                {errors.display_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.display_name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="base_url">Base URL</Label>
                <Input
                  id="base_url"
                  value={formData.base_url}
                  onChange={(e) => handleInputChange('base_url', e.target.value)}
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
                  onChange={(e) => handleInputChange('is_default', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="is_default">Set as default environment</Label>
              </div>
            </div>
          </FormSection>

          <FormSection title="Environment Variables" description="Variables available for requests in this environment">
            <EnvironmentVariable
              variables={formData.variables}
              onVariablesChange={handleVariableChange}
            />
          </FormSection>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Environment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
