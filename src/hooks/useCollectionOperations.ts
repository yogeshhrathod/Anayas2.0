/**
 * useCollectionOperations - Custom hook for collection CRUD operations
 * 
 * Features:
 * - Create, update, delete collections
 * - Import/export functionality
 * - Search and filtering
 * - Request count calculation
 * 
 * @example
 * ```tsx
 * const {
 *   collections,
 *   isLoading,
 *   createCollection,
 *   updateCollection,
 *   deleteCollection,
 *   searchCollections
 * } = useCollectionOperations();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { Collection } from '../types/entities';
import { CollectionFormData } from '../types/forms';
import { useToastNotifications } from './useToastNotifications';
import { useDebounce } from './useDebounce';
import { useStore } from '../store/useStore';

export function useCollectionOperations() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { showSuccess, showError } = useToastNotifications();
  
  // Get global store functions for real-time updates
  const { setCollections: setGlobalCollections, triggerSidebarRefresh } = useStore();

  // Load collections and requests
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [collectionsData, requestsData] = await Promise.all([
        window.electronAPI.collection.list(),
        window.electronAPI.request.list()
      ]);
      
      setCollections(collectionsData);
      setRequests(requestsData);
      
      // Also update global store for real-time sidebar updates
      setGlobalCollections(collectionsData);
    } catch (error: unknown) {
      showError('Failed to load data', error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [showError, setGlobalCollections]);

  // Calculate request counts for each collection
  const getRequestCounts = useCallback(() => {
    const counts: Record<number, number> = {};
    
    requests.forEach(request => {
      if (request.collectionId) {
        counts[request.collectionId] = (counts[request.collectionId] || 0) + 1;
      }
    });
    
    return counts;
  }, [requests]);

  // Search and filter collections
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setFilteredCollections(collections);
      return;
    }

    const filtered = collections.filter(collection =>
      collection.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      collection.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
    
    setFilteredCollections(filtered);
  }, [collections, debouncedSearchTerm]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Collection CRUD operations
  const createCollection = useCallback(async (data: CollectionFormData) => {
    try {
      const result = await window.electronAPI.collection.save({
        name: data.name,
        description: data.description,
        documentation: data.documentation || '',
        environments: data.environments || [],
        isFavorite: data.isFavorite
      });

      if (result.success) {
        await loadData();
        // Trigger sidebar refresh for real-time updates
        triggerSidebarRefresh();
        showSuccess('Collection created', { description: `${data.name} has been created successfully` });
        return result;
      }
    } catch (error: unknown) {
      showError('Failed to create collection', error instanceof Error ? error.message : 'Failed to create collection');
      throw error;
    }
  }, [loadData, showSuccess, showError, triggerSidebarRefresh]);

  const updateCollection = useCallback(async (id: number, data: CollectionFormData) => {
    try {
      const result = await window.electronAPI.collection.save({
        id,
        name: data.name,
        description: data.description,
        documentation: data.documentation || '',
        environments: data.environments || [],
        isFavorite: data.isFavorite
      });

      if (result.success) {
        await loadData();
        // Trigger sidebar refresh for real-time updates
        triggerSidebarRefresh();
        showSuccess('Collection updated', { description: `${data.name} has been updated successfully` });
        return result;
      }
    } catch (error: unknown) {
      showError('Failed to update collection', error instanceof Error ? error.message : 'Failed to update collection');
      throw error;
    }
  }, [loadData, showSuccess, showError, triggerSidebarRefresh]);

  const deleteCollection = useCallback(async (id: number) => {
    try {
      await window.electronAPI.collection.delete(id);
      await loadData();
      // Trigger sidebar refresh for real-time updates
      triggerSidebarRefresh();
      showSuccess('Collection deleted', { description: 'Collection has been deleted successfully' });
    } catch (error: unknown) {
      showError('Failed to delete collection', error instanceof Error ? error.message : 'Failed to delete collection');
      throw error;
    }
  }, [loadData, showSuccess, showError, triggerSidebarRefresh]);

  const duplicateCollection = useCallback(async (collection: Collection) => {
    try {
      // Create the duplicate collection
      const result = await createCollection({
        name: `${collection.name} (Copy)`,
        description: collection.description || '',
        environments: collection.environments ? collection.environments.map(env => ({ ...env, id: undefined })) : [],
        isFavorite: false
      });

      if (!result.success) {
        showError('Failed to create duplicate collection');
        return;
      }

      const newCollectionId = result.id;

      // Get all requests for the original collection
      const originalRequests = await window.electronAPI.request.list(collection.id);
      
      // Duplicate all requests for the new collection
      for (const request of originalRequests) {
        const duplicateRequest = {
          name: `${request.name} (Copy)`,
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body,
          queryParams: request.queryParams || [],
          auth: request.auth,
          collectionId: newCollectionId,
          folderId: undefined, // Reset folder association for simplicity
          isFavorite: false
        };
        
        await window.electronAPI.request.save(duplicateRequest);
        
        // Small delay to ensure unique IDs
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      showSuccess('Collection and requests duplicated successfully');
    } catch (error: unknown) {
      showError('Failed to duplicate collection', error instanceof Error ? error.message : 'Failed to duplicate collection');
      throw error;
    }
  }, [createCollection, showError, showSuccess]);

  const toggleFavorite = useCallback(async (collection: Collection) => {
    try {
      await updateCollection(collection.id!, {
        name: collection.name,
        description: collection.description || '',
        environments: collection.environments || [],
        isFavorite: !collection.isFavorite
      });
    } catch (error: unknown) {
      showError('Failed to update collection', error instanceof Error ? error.message : 'Failed to update collection');
      throw error;
    }
  }, [updateCollection, showError]);

  // Import/Export operations
  const exportCollections = useCallback(async () => {
    try {
      const dataStr = JSON.stringify(collections, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `collections-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSuccess('Export successful', { description: 'Collections have been exported successfully' });
    } catch (error: unknown) {
      showError('Failed to export collections', error instanceof Error ? error.message : 'Failed to export collections');
    }
  }, [collections, showSuccess, showError]);

  const importCollections = useCallback(async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const text = await file.text();
        const importedCollections = JSON.parse(text);
        
        if (Array.isArray(importedCollections)) {
          for (const collection of importedCollections) {
            await createCollection({
              name: collection.name,
              description: collection.description,
              environments: collection.environments || [],
              isFavorite: false
            });
          }
          showSuccess('Import successful', { description: `${importedCollections.length} collections imported successfully` });
        } else {
          showError('Invalid file format', 'Please select a valid collections export file');
        }
      };
      
      input.click();
    } catch (error: unknown) {
      showError('Failed to import collections', error instanceof Error ? error.message : 'Failed to import collections');
    }
  }, [createCollection, showSuccess, showError]);

  return {
    collections: filteredCollections,
    allCollections: collections,
    requests,
    isLoading,
    searchTerm,
    setSearchTerm,
    requestCounts: getRequestCounts(),
    createCollection,
    updateCollection,
    deleteCollection,
    duplicateCollection,
    toggleFavorite,
    exportCollections,
    importCollections,
    refreshData: loadData
  };
}
