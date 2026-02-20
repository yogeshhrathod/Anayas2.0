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

import { Globe, Star, Tag } from 'lucide-react';
import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react';
import { useFormValidation } from '../../hooks/useFormValidation';
import { Environment } from '../../types/entities';
import { EnvironmentFormData } from '../../types/forms';
import { EnvironmentVariable } from '../EnvironmentVariable';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

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
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
          {/* Left Column: Basic Info */}
          <div className="space-y-4 rounded-xl border border-border/50 bg-muted/20 p-5 backdrop-blur-sm h-fit">
            {/* Identifier / Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
              >
                <Tag className="h-3.5 w-3.5 text-primary" />
                Identifier
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                onBlur={() => validateField('name', formData.name)}
                className={`h-10 bg-background/80 focus:bg-background transition-colors border-border/50 ${errors.name ? 'border-destructive' : ''}`}
                placeholder="e.g., production, staging"
              />
              {errors.name && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label
                htmlFor="display_name"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
              >
                <span className="inline-flex items-center justify-center h-3.5 w-3.5 text-primary font-bold text-[10px] leading-none border border-primary/30 rounded-sm">Aa</span>
                Display Name
              </Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={e =>
                  handleInputChange('display_name', e.target.value)
                }
                onBlur={() =>
                  validateField('display_name', formData.display_name)
                }
                className={`h-10 bg-background/80 focus:bg-background transition-colors border-border/50 ${errors.display_name ? 'border-destructive' : ''}`}
                placeholder="e.g., Production API"
              />
              {errors.display_name && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                  {errors.display_name}
                </p>
              )}
            </div>

            {/* Base URL */}
            <div className="space-y-2">
              <Label
                htmlFor="base_url"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
              >
                <Globe className="h-3.5 w-3.5 text-primary" />
                Base URL
              </Label>
              <Input
                id="base_url"
                value={formData.base_url}
                onChange={e => handleInputChange('base_url', e.target.value)}
                onBlur={() => validateField('base_url', formData.base_url)}
                className={`h-10 bg-background/80 focus:bg-background transition-colors border-border/50 ${errors.base_url ? 'border-destructive' : ''}`}
                placeholder="https://api.example.com"
              />
              {errors.base_url && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                  {errors.base_url}
                </p>
              )}
            </div>

            {/* Default toggle */}
            <div className="pt-2 border-t border-border/40">
              <label
                htmlFor="is_default"
                className="flex items-center gap-3 cursor-pointer group select-none"
              >
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={e =>
                      handleInputChange('is_default', e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 rounded-full border border-border/60 bg-muted peer-checked:bg-primary peer-checked:border-primary transition-colors duration-200" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-foreground">
                    Set as default
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Right Column: Environment Variables */}
          <div className="rounded-xl border border-border/50 bg-muted/20 backdrop-blur-sm overflow-hidden">
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
