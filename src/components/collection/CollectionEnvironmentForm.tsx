/**
 * CollectionEnvironmentForm - Form component for creating and editing collection environments
 *
 * Features:
 * - Form validation with error display
 * - Environment variables management
 * - Save/Cancel actions
 *
 * @example
 * ```tsx
 * <CollectionEnvironmentForm
 *   environment={editingEnvironment}
 *   onSave={handleSave}
 *   onCancel={handleCancel}
 *   isLoading={isSaving}
 * />
 * ```
 */

import { Loader2 } from 'lucide-react';
import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react';
import { useFormValidation } from '../../hooks/useFormValidation';
import { CollectionEnvironment } from '../../types/entities';
import { EnvironmentVariable } from '../EnvironmentVariable';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export interface CollectionEnvironmentFormProps {
  environment?: CollectionEnvironment | null;
  onSave: (data: {
    name: string;
    variables: Record<string, string>;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  showActions?: boolean;
}

export interface CollectionEnvironmentFormRef {
  submit: () => void;
}

const validationSchema = {
  name: {
    required: true,
    minLength: 2,
    pattern: /^[a-z0-9_\s-]+$/i,
    message:
      'Name can only contain letters, numbers, spaces, hyphens, and underscores',
  },
};

export const CollectionEnvironmentForm = forwardRef<
  CollectionEnvironmentFormRef,
  CollectionEnvironmentFormProps
>(
  (
    { environment, onSave, onCancel, isLoading = false, showActions = false },
    ref
  ) => {
    const [formData, setFormData] = useState({
      name: '',
      variables: {} as Record<string, string>,
    });

    const { errors, validateField, validateForm, clearFieldError } =
      useFormValidation(validationSchema);

    useEffect(() => {
      if (environment) {
        setFormData({
          name: environment.name,
          variables: environment.variables || {},
        });
      } else {
        setFormData({
          name: '',
          variables: {},
        });
      }
    }, [environment]);

    const handleSubmit = useCallback(async () => {
      if (!validateForm(formData)) {
        return;
      }

      try {
        await onSave(formData);
      } catch (error) {
        // Error handling is done in parent component
      }
    }, [formData, validateForm, onSave]);

    const handleInputChange = useCallback(
      (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        clearFieldError(field);
      },
      [clearFieldError]
    );

    const handleVariableChange = useCallback(
      (variables: Record<string, string>) => {
        setFormData(prev => ({ ...prev, variables }));
      },
      []
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
      },
      [handleSubmit]
    );

    // Expose submit handler for parent component
    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
    }));

    return (
      <div className="w-full">
        <div className="space-y-5">
          {/* Name Field */}
          <div className="rounded-xl border border-border/50 bg-muted/20 p-5 space-y-2 backdrop-blur-sm">
            <Label
              htmlFor="name"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-primary/80" />
              Environment Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              onBlur={() => validateField('name', formData.name)}
              className={`h-10 bg-background/80 focus:bg-background transition-colors border-border/50 ${errors.name ? 'border-red-500' : ''}`}
              placeholder="e.g., Development, Staging, Production"
              disabled={isLoading}
              onKeyDown={handleKeyDown}
            />
            {errors.name && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Variables Section */}
          <div className="rounded-xl border border-border/50 bg-muted/20 backdrop-blur-sm overflow-hidden">
            <EnvironmentVariable
              variables={formData.variables}
              onVariablesChange={handleVariableChange}
              title="Environment Variables"
              description="Manage key-value pairs for this collection environment"
            />
          </div>

          {showActions && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-sm transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : environment ? (
                  'Update Environment'
                ) : (
                  'Create Environment'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

CollectionEnvironmentForm.displayName = 'CollectionEnvironmentForm';
