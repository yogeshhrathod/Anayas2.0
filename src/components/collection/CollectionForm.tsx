/**
 * CollectionForm - Form component for creating and editing collections
 * 
 * Features:
 * - Form validation with error display
 * - Environment variables management
 * - Save/Cancel actions
 * 
 * @example
 * ```tsx
 * <CollectionForm
 *   collection={editingCollection}
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
import { Textarea } from '../ui/textarea';
import { FormSection } from '../shared/FormSection';
import { EnvironmentVariable } from '../EnvironmentVariable';
import { Collection } from '../../types/entities';
import { CollectionFormData } from '../../types/forms';
import { useFormValidation } from '../../hooks/useFormValidation';

export interface CollectionFormProps {
  collection?: Collection | null;
  onSave: (data: CollectionFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const validationSchema = {
  name: {
    required: true,
    minLength: 2,
    pattern: /^[a-zA-Z0-9\s_-]+$/,
    message: 'Name can only contain letters, numbers, spaces, hyphens, and underscores'
  },
  description: {
    maxLength: 500,
    message: 'Description cannot exceed 500 characters'
  }
};

export const CollectionForm: React.FC<CollectionFormProps> = ({
  collection,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CollectionFormData>({
    name: '',
    description: '',
    variables: {},
    is_favorite: false
  });

  const { errors, validateField, validateForm, clearFieldError } = useFormValidation(validationSchema);

  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name,
        description: collection.description,
        variables: collection.variables || {},
        is_favorite: collection.is_favorite || false
      });
    }
  }, [collection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm(formData)) {
      await onSave(formData);
    }
  };

  const handleInputChange = (field: keyof CollectionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{collection ? 'Edit Collection' : 'New Collection'}</CardTitle>
        <CardDescription>
          {collection ? 'Update collection details and variables' : 'Create a new collection with variables'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormSection title="Basic Information" description="Collection name and description">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onBlur={() => validateField('name', formData.name)}
                  className={errors.name ? 'border-red-500' : ''}
                  placeholder="Enter collection name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  onBlur={() => validateField('description', formData.description)}
                  className={errors.description ? 'border-red-500' : ''}
                  placeholder="Enter collection description"
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                )}
              </div>
            </div>
          </FormSection>

          <FormSection title="Environment Variables" description="Variables available for requests in this collection">
            <EnvironmentVariable
              variables={formData.variables}
              onVariablesChange={(variables) => handleInputChange('variables', variables)}
            />
          </FormSection>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Collection'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
