import { useCallback, useState } from 'react';
import { Collection } from '../types/entities';
import { useToastNotifications } from './useToastNotifications';

export interface CollectionEnvironmentFormData {
  name: string;
  variables: Record<string, string>;
}

export function useCollectionEnvironmentOperations(
  collectionId: number,
  onUpdate?: (collection: Collection) => void
) {
  const { showSuccess, showError } = useToastNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const createEnvironment = useCallback(
    async (data: CollectionEnvironmentFormData) => {
      setIsLoading(true);
      try {
        const result = await window.electronAPI.collection.addEnvironment(
          collectionId,
          data
        );
        if (result?.success) {
          showSuccess('Environment created', {
            description: `${data.name} has been created`,
          });
          // Reload collection if callback provided
          if (onUpdate && result.collection) {
            onUpdate(result.collection);
          }
          return result;
        }
        throw new Error(result?.error || 'Failed to create environment');
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'An unknown error occurred';
        showError('Failed to create environment', message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [collectionId, onUpdate, showSuccess, showError]
  );

  const updateEnvironment = useCallback(
    async (environmentId: number, data: CollectionEnvironmentFormData) => {
      setIsLoading(true);
      try {
        const result = await window.electronAPI.collection.updateEnvironment(
          collectionId,
          environmentId,
          data
        );
        if (result?.success) {
          showSuccess('Environment updated', {
            description: `${data.name} has been updated`,
          });
          // Reload collection if callback provided
          if (onUpdate && result.collection) {
            onUpdate(result.collection);
          }
          return result;
        }
        throw new Error(result?.error || 'Failed to update environment');
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'An unknown error occurred';
        showError('Failed to update environment', message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [collectionId, onUpdate, showSuccess, showError]
  );

  const deleteEnvironment = useCallback(
    async (environmentId: number) => {
      setDeletingId(environmentId);
      try {
        const result = await window.electronAPI.collection.deleteEnvironment(
          collectionId,
          environmentId
        );
        if (result?.success) {
          showSuccess('Environment deleted', {
            description: 'Environment has been deleted',
          });
          // Reload collection if callback provided
          if (onUpdate && result.collection) {
            onUpdate(result.collection);
          }
          return result;
        }
        throw new Error(result?.error || 'Failed to delete environment');
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'An unknown error occurred';
        showError('Failed to delete environment', message);
        throw error;
      } finally {
        setDeletingId(null);
      }
    },
    [collectionId, onUpdate, showSuccess, showError]
  );

  const setActiveEnvironment = useCallback(
    async (environmentId: number | null) => {
      try {
        const result = await window.electronAPI.collection.setActiveEnvironment(
          collectionId,
          environmentId
        );
        if (result?.success) {
          showSuccess('Environment activated', {
            description: 'Active environment has been updated',
          });
          // Reload collection if callback provided
          if (onUpdate && result.collection) {
            onUpdate(result.collection);
          }
          return result;
        }
        throw new Error(result?.error || 'Failed to set active environment');
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'An unknown error occurred';
        showError('Failed to set active environment', message);
        throw error;
      }
    },
    [collectionId, onUpdate, showSuccess, showError]
  );

  return {
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setActiveEnvironment,
    isLoading,
    deletingId,
  };
}
