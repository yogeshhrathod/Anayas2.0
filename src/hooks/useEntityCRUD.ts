/**
 * useEntityCRUD - Generic create, read, update, delete operations hook
 *
 * Provides a standardized interface for CRUD operations with:
 * - Loading states
 * - Error handling
 * - Success notifications
 * - Optimistic updates
 *
 * @example
 * ```tsx
 * const {
 *   create,
 *   update,
 *   remove,
 *   isLoading,
 *   error
 * } = useEntityCRUD({
 *   createFn: window.electronAPI.collection.save,
 *   updateFn: window.electronAPI.collection.save,
 *   deleteFn: window.electronAPI.collection.delete,
 *   onSuccess: (action) => toast.success(`${action} successful`)
 * });
 * ```
 */

import { useState, useCallback } from 'react';
import { useToast } from '../components/ui/use-toast';

export interface EntityCRUDConfig<CreateData, UpdateData> {
  createFn: (data: CreateData) => Promise<any>;
  updateFn: (data: UpdateData) => Promise<any>;
  deleteFn: (id: number) => Promise<any>;
  onSuccess?: (action: string, data?: any) => void;
  onError?: (action: string, error: any) => void;
}

export interface EntityCRUDState {
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface EntityCRUDActions<CreateData, UpdateData> {
  create: (data: CreateData) => Promise<any>;
  update: (data: UpdateData) => Promise<any>;
  remove: (id: number) => Promise<any>;
  clearError: () => void;
}

export function useEntityCRUD<CreateData, UpdateData>(
  config: EntityCRUDConfig<CreateData, UpdateData>
): EntityCRUDState & EntityCRUDActions<CreateData, UpdateData> {
  const [state, setState] = useState<EntityCRUDState>({
    isLoading: false,
    error: null,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
  });

  const { toast } = useToast();

  const handleError = useCallback(
    (action: string, error: any) => {
      const errorMessage = error?.message || `Failed to ${action}`;
      setState(prev => ({
        ...prev,
        isLoading: false,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        error: errorMessage,
      }));

      toast({
        title: `${action} Failed`,
        description: errorMessage,
        variant: 'destructive',
      });

      config.onError?.(action, error);
    },
    [config, toast]
  );

  const handleSuccess = useCallback(
    (action: string, data?: any) => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        error: null,
      }));

      config.onSuccess?.(action, data);
    },
    [config]
  );

  const create = useCallback(
    async (data: CreateData) => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        isCreating: true,
        error: null,
      }));

      try {
        const result = await config.createFn(data);
        handleSuccess('Create', result);
        return result;
      } catch (error) {
        handleError('create', error);
        throw error;
      }
    },
    [config, handleSuccess, handleError]
  );

  const update = useCallback(
    async (data: UpdateData) => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        isUpdating: true,
        error: null,
      }));

      try {
        const result = await config.updateFn(data);
        handleSuccess('Update', result);
        return result;
      } catch (error) {
        handleError('update', error);
        throw error;
      }
    },
    [config, handleSuccess, handleError]
  );

  const remove = useCallback(
    async (id: number) => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        isDeleting: true,
        error: null,
      }));

      try {
        const result = await config.deleteFn(id);
        handleSuccess('Delete', result);
        return result;
      } catch (error) {
        handleError('delete', error);
        throw error;
      }
    },
    [config, handleSuccess, handleError]
  );

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    create,
    update,
    remove,
    clearError,
  };
}
