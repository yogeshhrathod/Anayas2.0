import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Globe, Plus, Trash2, Check, Upload, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import { EnvironmentVariable } from '../components/EnvironmentVariable';

interface ValidationErrors {
  name?: string;
  displayName?: string;
  baseUrl?: string;
}

export function Environments() {
  const { environments, setEnvironments, currentEnvironment, setCurrentEnvironment } = useStore();
  const { success, error } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editingEnv, setEditingEnv] = useState<any>(null);
  const [testingEnv, setTestingEnv] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    baseUrl: '',
    variables: {} as Record<string, string>,
    isDefault: false,
  });

  const handleNew = () => {
    setEditingEnv(null);
    setFormData({
      name: '',
      displayName: '',
      baseUrl: '',
      variables: {},
      isDefault: false,
    });
    setIsEditing(true);
  };

  const handleEdit = (env: any) => {
    setEditingEnv(env);
    setFormData({
      name: env.name,
      displayName: env.display_name,
      baseUrl: env.variables?.base_url || '',
      variables: env.variables || {},
      isDefault: env.is_default === 1,
    });
    setIsEditing(true);
  };


  const validateUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Validate name
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Environment name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (!/^[a-z0-9_-]+$/i.test(formData.name)) {
      errors.name = 'Name can only contain letters, numbers, hyphens, and underscores';
    }

    // Validate display name
    if (!formData.displayName || formData.displayName.trim() === '') {
      errors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 2) {
      errors.displayName = 'Display name must be at least 2 characters';
    }

    // Validate base URL (optional)
    if (formData.baseUrl && !validateUrl(formData.baseUrl)) {
      errors.baseUrl = 'Valid URL is required (e.g., https://api.example.com)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    // Validate form
    if (!validateForm()) {
      error('Validation failed', 'Please fix all validation errors before saving');
      return;
    }

    try {
      // Prepare environment data with variables
      const envData = {
        id: editingEnv?.id,
        name: formData.name,
        displayName: formData.displayName,
        variables: {
          ...formData.variables,
          base_url: formData.baseUrl,
        },
        isDefault: formData.isDefault,
      };

      const result = await window.electronAPI.env.save(envData);

      if (result.success) {
        const updatedEnvs = await window.electronAPI.env.list();
        setEnvironments(updatedEnvs);
        
        if (formData.isDefault) {
          const newCurrent = updatedEnvs.find((e: any) => e.id === result.id);
          setCurrentEnvironment(newCurrent);
        }
        
        setIsEditing(false);
        setValidationErrors({});
        success('Environment saved', `${formData.displayName || formData.name} updated successfully`);
      }
    } catch (e: any) {
      console.error('Failed to save environment:', e);
      error('Save failed', 'Failed to save environment');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this environment?')) return;

    try {
      await window.electronAPI.env.delete(id);
      const updatedEnvs = await window.electronAPI.env.list();
      setEnvironments(updatedEnvs);
      
      if (currentEnvironment?.id === id) {
        setCurrentEnvironment(updatedEnvs[0] || null);
      }
      success('Environment deleted', 'The environment has been removed');
    } catch (e: any) {
      console.error('Failed to delete environment:', e);
      error('Delete failed', 'Could not delete environment');
    }
  };

  const handleTest = async (env: any) => {
    setTestingEnv(env.id);
    try {
      const result = await window.electronAPI.env.test({
        name: env.name,
        displayName: env.display_name,
        variables: env.variables,
      });
      
      if (result.success) {
        success('Connection successful', 'Environment API endpoint is reachable');
      } else {
        error('Connection failed', result.message || 'Test request failed');
      }
    } catch (e: any) {
      error('Connection error', e?.message || 'Unknown error');
    } finally {
      setTestingEnv(null);
    }
  };

  const handleImport = async () => {
    try {
      const filePath = await window.electronAPI.file.selectFile([
        { name: 'Environment Files', extensions: ['env'] },
      ]);
      
      if (filePath) {
        const result = await window.electronAPI.env.import(filePath);
        if (result.success) {
          setFormData({
            name: result.data.name,
            displayName: result.data.displayName,
            baseUrl: result.data.base_url || '',
            variables: result.data.variables || {},
            isDefault: false,
          });
          setIsEditing(true);
          success('Imported', 'Environment file imported');
        } else {
          error('Import failed', result.message || 'Could not import');
        }
      }
    } catch (e: any) {
      console.error('Failed to import environment:', e);
      error('Import failed', 'Failed to import environment');
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {editingEnv ? 'Edit Environment' : 'New Environment'}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Configure your environment settings
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Environment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Environment Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (validationErrors.name) {
                      setValidationErrors({ ...validationErrors, name: undefined });
                    }
                  }}
                  placeholder="development"
                  className={validationErrors.name ? 'border-red-500' : ''}
                />
                {validationErrors.name && (
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    <span>{validationErrors.name}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Letters, numbers, hyphens, and underscores only
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => {
                    setFormData({ ...formData, displayName: e.target.value });
                    if (validationErrors.displayName) {
                      setValidationErrors({ ...validationErrors, displayName: undefined });
                    }
                  }}
                  placeholder="Development Environment"
                  className={validationErrors.displayName ? 'border-red-500' : ''}
                />
                {validationErrors.displayName && (
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    <span>{validationErrors.displayName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="baseUrl">Base URL (Optional)</Label>
                <Input
                  id="baseUrl"
                  value={formData.baseUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, baseUrl: e.target.value });
                    if (validationErrors.baseUrl) {
                      setValidationErrors({ ...validationErrors, baseUrl: undefined });
                    }
                  }}
                  placeholder="https://api.example.com"
                  className={validationErrors.baseUrl ? 'border-red-500' : ''}
                />
                {validationErrors.baseUrl && (
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    <span>{validationErrors.baseUrl}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Base URL for API requests (used as base_url variable)
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isDefault" className="cursor-pointer">
                  Set as default environment
                </Label>
              </div>
            </div>

            {/* Environment Variables */}
            <EnvironmentVariable
              variables={formData.variables}
              onVariablesChange={(variables) => setFormData({ ...formData, variables })}
              title="Environment Variables"
              description="Add key-value pairs that can be used in your API requests"
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Environment</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Environments</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your environment configurations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" />
            Import .env
          </Button>
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Environment
          </Button>
        </div>
      </div>

      {environments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No environments yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first environment to get started
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={handleImport}>
                <Upload className="mr-2 h-4 w-4" />
                Import .env
              </Button>
              <Button onClick={handleNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create Environment
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {environments.map((env: any) => (
            <Card key={env.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {env.display_name}
                      {currentEnvironment?.id === env.id && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">{env.name}</CardDescription>
                  </div>
                  <div className={`h-3 w-3 rounded-full ${env.is_default ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="truncate">Base URL: {env.variables?.base_url || 'Not set'}</div>
                  <div className="truncate">Variables: {Object.keys(env.variables || {}).length}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(env)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(env)}
                    disabled={testingEnv === env.id}
                  >
                    {testingEnv === env.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(env.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
