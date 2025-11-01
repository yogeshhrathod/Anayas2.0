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

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { MonacoEditor } from '../ui/monaco-editor';
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

export interface CollectionFormRef {
  submit: () => void;
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

export const CollectionForm = forwardRef<CollectionFormRef, CollectionFormProps>(({
  collection,
  onSave,
  isLoading: _isLoading = false
}, ref) => {
  const [formData, setFormData] = useState<CollectionFormData>({
    name: '',
    description: '',
    documentation: '',
    variables: {},
    isFavorite: false
  });
  const [activeTab, setActiveTab] = useState<'variables' | 'documentation'>('variables');

  const { errors, validateField, validateForm, clearFieldError } = useFormValidation(validationSchema);

  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name,
        description: collection.description || '',
        documentation: collection.documentation || '',
        variables: collection.variables || {},
        isFavorite: !!collection.isFavorite
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

  const handleVariableChange = (variables: Record<string, string>) => {
    setFormData(prev => ({ ...prev, variables }));
  };

  // Expose submit handler for parent component
  useImperativeHandle(ref, () => ({
    submit: () => {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
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
              onChange={(e) => handleInputChange('name', e.target.value)}
              onBlur={() => validateField('name', formData.name)}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="Enter collection name"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
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

        {/* Right Column: Tabs for Variables and Documentation */}
        <div className="flex-1">
          <div className="w-full">
            <div className="flex border-b border-border/50 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('variables')}
                className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'variables'
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                Variables
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('documentation')}
                className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'documentation'
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                Documentation
              </button>
            </div>
            {activeTab === 'variables' && (
              <div className="mt-4">
                <EnvironmentVariable
                  variables={formData.variables}
                  onVariablesChange={handleVariableChange}
                  title=""
                  description=""
                />
              </div>
            )}
            {activeTab === 'documentation' && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="documentation">Markdown Documentation</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Write documentation for this collection using Markdown syntax
                </p>
                <MonacoEditor
                  value={formData.documentation || ''}
                  onChange={(value) => handleInputChange('documentation', value)}
                  language="markdown"
                  placeholder="# Collection Documentation&#10;&#10;Write your documentation here..."
                  title=""
                  description=""
                  height={400}
                  showActions={true}
                  validateJson={false}
                  readOnly={false}
                  minimap={true}
                  fontSize={13}
                  className="border rounded-md"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
});

CollectionForm.displayName = 'CollectionForm';
