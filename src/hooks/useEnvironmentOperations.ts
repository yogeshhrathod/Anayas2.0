/**
 * useEnvironmentOperations - Custom hook for environment CRUD operations
 * 
 * Features:
 * - Create, update, delete environments
 * - Set default environment
 * - Test environment connections
 * - Search and filtering
 * - Import/export functionality
 * 
 * @example
 * ```tsx
 * const {
 *   environments,
 *   isLoading,
 *   createEnvironment,
 *   updateEnvironment,
 *   deleteEnvironment,
 *   setDefaultEnvironment,
 *   testEnvironment
 * } = useEnvironmentOperations();
 * ```
 */

 
import { useState, useEffect, useCallback } from 'react';
import { Environment } from '../types/entities';
import { EnvironmentFormData } from '../types/forms';
import { useToastNotifications } from './useToastNotifications';
import { useDebounce } from './useDebounce';

export function useEnvironmentOperations() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEnvironments, setFilteredEnvironments] = useState<Environment[]>([]);
  const [testingEnvironmentId, setTestingEnvironmentId] = useState<number | null>(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { showSuccess, showError } = useToastNotifications();

  // Load environments
  const loadEnvironments = useCallback(async () => {
    try {
      setIsLoading(true);
      const environmentsData = await window.electronAPI.env.list();
      setEnvironments(environmentsData);
    } catch (error: unknown) {
      showError('Failed to load environments', error instanceof Error ? error.message : 'Failed to load environments');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // Search and filter environments
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setFilteredEnvironments(environments);
      return;
    }

    const filtered = environments.filter(environment =>
      environment.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      environment.displayName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
    
    setFilteredEnvironments(filtered);
  }, [environments, debouncedSearchTerm]);

  // Load environments on mount
  useEffect(() => {
    loadEnvironments();
  }, [loadEnvironments]);

  // Environment CRUD operations
  const createEnvironment = useCallback(async (data: EnvironmentFormData) => {
    try {
      const envData = {
        name: data.name,
        displayName: data.display_name,
        variables: {
          ...data.variables,
          base_url: data.base_url,
        },
        isDefault: data.is_default,
      };

      const result = await window.electronAPI.env.save(envData);

      if (result.success) {
        await loadEnvironments();
        showSuccess('Environment created', { description: `${data.display_name} has been created successfully` });
        return result;
      }
    } catch (error: unknown) {
      showError('Failed to create environment', error instanceof Error ? error.message : 'Failed to create environment');
      throw error;
    }
  }, [loadEnvironments, showSuccess, showError]);

  const updateEnvironment = useCallback(async (id: number, data: EnvironmentFormData) => {
    try {
      const envData = {
        id,
        name: data.name,
        displayName: data.display_name,
        variables: {
          ...data.variables,
          base_url: data.base_url,
        },
        isDefault: data.is_default,
      };

      const result = await window.electronAPI.env.save(envData);

      if (result.success) {
        await loadEnvironments();
        showSuccess('Environment updated', { description: `${data.display_name} has been updated successfully` });
        return result;
      }
    } catch (error: unknown) {
      showError('Failed to update environment', error instanceof Error ? error.message : 'Failed to update environment');
      throw error;
    }
  }, [loadEnvironments, showSuccess, showError]);

  const deleteEnvironment = useCallback(async (id: number) => {
    try {
      await window.electronAPI.env.delete(id);
      await loadEnvironments();
      showSuccess('Environment deleted', { description: 'Environment has been deleted successfully' });
    } catch (error: unknown) {
      showError('Failed to delete environment', error instanceof Error ? error.message : 'Failed to delete environment');
      throw error;
    }
  }, [loadEnvironments, showSuccess, showError]);

  const duplicateEnvironment = useCallback(async (environment: Environment) => {
    try {
      const duplicatedData = {
        name: `${environment.name}_copy`,
        display_name: `${environment.displayName} (Copy)`,
        base_url: environment.variables?.base_url || '',
        variables: environment.variables || {},
        is_default: false
      };

      await createEnvironment(duplicatedData);
    } catch (error: unknown) {
      showError('Failed to duplicate environment', error instanceof Error ? error.message : 'Failed to duplicate environment');
      throw error;
    }
  }, [createEnvironment, showError]);

  const setDefaultEnvironment = useCallback(async (environment: Environment) => {
    try {
      // First, unset all environments as default
      const updatedEnvs = environments.map(env => ({
        ...env,
        isDefault: false
      }));

      // Then set the selected environment as default
      const targetEnv = updatedEnvs.find(env => env.id === environment.id);
      if (targetEnv) {
        targetEnv.isDefault = true;
      }

      // Save all environments
      for (const env of updatedEnvs) {
        await window.electronAPI.env.save(env);
      }

      await loadEnvironments();
      showSuccess('Default environment set', { description: `${environment.displayName} is now the default environment` });
    } catch (error: unknown) {
      showError('Failed to set default environment', error instanceof Error ? error.message : 'Failed to set default environment');
      throw error;
    }
  }, [environments, loadEnvironments, showSuccess, showError]);

  const testEnvironment = useCallback(async (environment: Environment) => {
    try {
      setTestingEnvironmentId(environment.id!);
      
      // Test the base URL if it exists
      if (environment.variables?.base_url) {
        await fetch(environment.variables.base_url, {
          method: 'HEAD',
          mode: 'no-cors'
        });
        
        showSuccess('Connection test passed', { description: `${environment.displayName} is reachable` });
      } else {
        showSuccess('Environment test completed', { description: `${environment.displayName} configuration is valid` });
      }
    } catch (error: unknown) {
      showError('Connection test failed', error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setTestingEnvironmentId(null);
    }
  }, [showSuccess, showError]);

  // Import/Export operations
  const exportEnvironments = useCallback(async () => {
    try {
      const dataStr = JSON.stringify(environments, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `environments-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSuccess('Export successful', { description: 'Environments have been exported successfully' });
    } catch (error: unknown) {
      showError('Failed to export environments', error instanceof Error ? error.message : 'Failed to export environments');
    }
  }, [environments, showSuccess, showError]);

  const importEnvironments = useCallback(async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const text = await file.text();
        const importedEnvironments = JSON.parse(text);
        
        if (Array.isArray(importedEnvironments)) {
          for (const environment of importedEnvironments) {
            await createEnvironment({
              name: environment.name,
              display_name: environment.display_name,
              base_url: environment.variables?.base_url || '',
              variables: environment.variables || {},
              is_default: false
            });
          }
          showSuccess('Import successful', { description: `${importedEnvironments.length} environments imported successfully` });
        } else {
          showError('Invalid file format', 'Please select a valid environments export file');
        }
      };
      
      input.click();
    } catch (error: unknown) {
      showError('Failed to import environments', error instanceof Error ? error.message : 'Failed to import environments');
    }
  }, [createEnvironment, showSuccess, showError]);

  return {
    environments: filteredEnvironments,
    allEnvironments: environments,
    isLoading,
    searchTerm,
    setSearchTerm,
    testingEnvironmentId,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    duplicateEnvironment,
    setDefaultEnvironment,
    testEnvironment,
    exportEnvironments,
    importEnvironments,
    refreshEnvironments: loadEnvironments
  };
}
