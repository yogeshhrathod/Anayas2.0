/**
 * FormSection - Consistent form layout with validation support
 * 
 * Provides a standardized form section with:
 * - Section title and description
 * - Grid layout for form fields
 * - Validation error display
 * - Consistent spacing and styling
 * 
 * @example
 * ```tsx
 * <FormSection
 *   title="Collection Details"
 *   description="Configure your collection settings"
 *   errors={validationErrors}
 * >
 *   <div className="grid gap-4 md:grid-cols-2">
 *     <FormField
 *       label="Name"
 *       error={errors.name}
 *       required
 *     >
 *       <Input value={name} onChange={setName} />
 *     </FormField>
 *   </div>
 * </FormSection>
 * ```
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  errors?: Record<string, string>;
  required?: boolean;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = '',
  errors = {},
  required = false
}) => {
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          {required && <span className="text-red-500">*</span>}
          {hasErrors && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        
        {/* Display validation errors */}
        {hasErrors && (
          <div className="space-y-2">
            {Object.entries(errors).map(([field, error]) => (
              <div key={field} className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
