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

import { Loader2, Tag } from 'lucide-react';
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
        <div className="space-y-6">
          {/* Environment Name Section */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
            >
              <div className="p-1 rounded bg-primary/10">
                <Tag className="h-3 w-3 text-primary" />
              </div>
              Environment Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              onBlur={() => validateField('name', formData.name)}
              className={`h-11 bg-background border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all ${errors.name ? 'border-destructive' : ''}`}
              placeholder="e.g., Development, Staging, Production"
              disabled={isLoading}
              onKeyDown={handleKeyDown}
            />
            {errors.name && (
              <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                <span className="h-1 w-1 rounded-full bg-destructive" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Variables Section */}
          <div className="pt-4 border-t border-border/40">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-widest text-muted-foreground/80">
                <div className="p-1.5 rounded-lg bg-primary/10 shadow-sm">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                </div>
                Environment Variables
              </div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-muted/5 backdrop-blur-sm overflow-hidden min-h-[350px] shadow-inner">
              <EnvironmentVariable
                variables={formData.variables}
                onVariablesChange={handleVariableChange}
                title=""
                description=""
                className="border-0 bg-transparent shadow-none"
              />
            </div>
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
